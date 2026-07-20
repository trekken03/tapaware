const db = require('../models/db');
const auditLog = require('../utils/auditLogger');

exports.getAllHouseholds = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT h.*,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM recurring_flags rf
                        WHERE rf.household_id = h.id AND rf.status = 'active'
                    ) THEN 'flagged'
                    WHEN EXISTS (
                        SELECT 1 FROM reports r
                        WHERE r.household_id = h.id AND r.status IN ('pending', 'investigating')
                    ) THEN 'pending'
                    ELSE 'safe'
                END AS computed_status
            FROM households h
            ORDER BY h.created_at ASC
        `);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addHousehold = async (req, res) => {

    const { household_number, purok, owner_name, address } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO households(household_number,purok,owner_name,address) VALUES (?,?,?,?)',
            [household_number, purok, owner_name, address]
        );
        await auditLog({
            user_id: req.user ? req.user.id : null,
            user_name: req.user ? req.user.name : 'Unknown',
            user_role: req.user ? req.user.role : 'staff',
            action: 'ADD_HOUSEHOLD',
            table_affected: 'households',
            record_id: result.insertId,
            details: `Added household: ${household_number} - ${owner_name}, purok: ${purok}`,
            ip_address: req.ip
        });
        res.status(201).json({ message: 'household added successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getHouseholdById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[household]] = await db.query(
            `SELECT h.*,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM recurring_flags rf
                        WHERE rf.household_id = h.id AND rf.status = 'active'
                    ) THEN 'flagged'
                    WHEN EXISTS (
                        SELECT 1 FROM reports r
                        WHERE r.household_id = h.id AND r.status IN ('pending', 'investigating')
                    ) THEN 'pending'
                    ELSE 'safe'
                END AS computed_status
            FROM households h
            WHERE h.id = ?`,
            [id]
        );

        if (!household) {
            return res.status(404).json({ message: 'Household not found' });
        }

        const [reports] = await db.query(
            `SELECT reports.*, users.name as reported_by
            FROM reports JOIN users ON reports.user_id = users.id
            WHERE reports.household_id = ?
            ORDER BY reports.created_at DESC`,
            [id]
        );

        const [tdsReadings] = await db.query(
            `SELECT tds_readings.*, users.name as staff_name
            FROM tds_readings JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.household_id = ?
            ORDER BY tds_readings.recorded_at DESC`,
            [id]
        );

        const [flags] = await db.query(
            `SELECT * FROM recurring_flags WHERE household_id = ? ORDER BY last_reported_at DESC`,
            [id]
        );

        res.json({ ...household, reports, tds_readings: tdsReadings, flags });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteHousehold = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM households WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Household not found' });
        }

        await db.query('DELETE FROM households WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'DELETE_HOUSEHOLD',
            table_affected: 'households',
            record_id: id,
            details: `Deleted household #${existing[0].household_number} - ${existing[0].owner_name}, purok ${existing[0].purok}`,
            ip_address: req.ip
        });

        res.json({ message: 'Household deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};