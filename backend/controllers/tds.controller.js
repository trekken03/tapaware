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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addReadings = async (req, res) => {
    const { household_id, staff_id, tds_value, notes } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO tds_readings(household_id,staff_id,tds_value,notes) VALUES(?,?,?,?)',
            [household_id, staff_id, tds_value, notes || null]
        );
        await auditLog({
            user_id: req.user ? req.user.id : null,
            user_name: req.user ? req.user.name : 'Unknown',
            user_role: req.user ? req.user.role : 'staff',
            action: 'ADD_TDS_READING',
            table_affected: 'tds_readings',
            record_id: result.insertId,
            details: `TDS reading added for household: ${household_id}, value: ${tds_value}`,
            ip_address: req.ip
        });
        res.status(201).json({ message: 'TDS Reading added successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


