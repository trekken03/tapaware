const db = require('../models/db');
const auditLog = require('../utils/auditLogger');

exports.getAllReadings = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT tds_readings.*, 
            households.household_number,
            households.owner_name,
            households.purok,
            users.name as staff_name FROM tds_readings
            JOIN households ON tds_readings.household_id = households.id
            JOIN users ON tds_readings.staff_id = users.id
            ORDER BY tds_readings.recorded_at DESC`
        );
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addReadings = async (req, res) => {
    const { household_id, tds_value, notes } = req.body;
    const staff_id = req.user.id;

    const numericTds = Number(tds_value);
    if (isNaN(numericTds) || numericTds < 0 || numericTds > 1500) {
        return res.status(400).json({ message: 'Invalid TDS value' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO tds_readings(household_id,staff_id,tds_value,notes) VALUES(?,?,?,?)',
            [household_id, staff_id, tds_value, notes || null]
        );
        await auditLog({
            user_id: req.user.id,
            user_name: req.user.name,
            user_role: req.user.role,
            action: 'ADD_TDS_READING',
            table_affected: 'tds_readings',
            record_id: result.insertId,
            details: `TDS reading added for household: ${household_id}, value: ${tds_value}`,
            ip_address: req.ip
        });
        res.status(201).json({ message: 'TDS Reading added successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getReadingsByHousehold = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT tds_readings.*,users.name as staff_name
            FROM tds_readings
            JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.household_id= ?
            ORDER BY tds_readings.recorded_at DESC`,
            [id]

        );
        res.json(rows);

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getLatestReadingByHousehold = async (req, res) => {
    const { id } = req.params;

    try {
        const [[row]] = await db.query(
            `SELECT tds_readings.*,users.name as staff_name
            FROM tds_readings
            JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.household_id= ?
            ORDER BY tds_readings.recorded_at DESC LIMIT 1`,
            [id]
        );

        if (!row) {
            return res.json(null);
        }

        res.json(row);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getReadingById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[reading]] = await db.query(
            `SELECT tds_readings.*,
            households.household_number,
            households.owner_name,
            households.purok,
            households.address,
            users.name as staff_name
            FROM tds_readings JOIN households ON tds_readings.household_id = households.id
            JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.id = ?`,
            [id]
        );

        if (!reading) {
            return res.status(404).json({ message: 'Reading not found' });
        }

        const [history] = await db.query(
            `SELECT tds_readings.*, users.name as staff_name
            FROM tds_readings JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.household_id = ? AND tds_readings.id != ?
            ORDER BY tds_readings.recorded_at DESC
            LIMIT 5`,
            [reading.household_id, id]
        );

        res.json({ ...reading, household_history: history });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteReading = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM tds_readings WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Reading not found' });
        }

        await db.query('DELETE FROM tds_readings WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'DELETE_TDS_READING',
            table_affected: 'tds_readings',
            record_id: id,
            details: `Deleted TDS reading #${id} (${existing[0].tds_value} ppm) for household ${existing[0].household_id}`,
            ip_address: req.ip
        });

        res.json({ message: 'TDS reading deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

