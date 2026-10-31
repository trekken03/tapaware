const db = require('../models/db');
const auditLog = require('../utils/auditLogger');

exports.getAllReadings = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT tds_readings.*,
            households.household_number,
            households.owner_name,
            households.zone,
            users.name as staff_name FROM tds_readings
            JOIN households ON tds_readings.household_id = households.id
            JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.deleted_at IS NULL
            ORDER BY tds_readings.recorded_at DESC`
        );
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getArchivedReadings = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT tds_readings.*,
            households.household_number,
            households.owner_name,
            households.zone,
            users.name as staff_name FROM tds_readings
            JOIN households ON tds_readings.household_id = households.id
            JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.deleted_at IS NOT NULL
            ORDER BY tds_readings.deleted_at DESC`
        );
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Current wall-clock time in the barangay, as "YYYY-MM-DDTHH:MM".
const nowInManila = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const isValidLocalDateTime = (value) => {
    const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
    if (!match) return false;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.getUTCFullYear() === Number(match[1])
        && date.getUTCMonth() === Number(match[2]) - 1
        && date.getUTCDate() === Number(match[3]);
};

// Optional coordinate from the browser; anything unusable is simply not saved.
const parseCoordinate = (value, limit) => {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && Math.abs(number) <= limit ? Number(number.toFixed(7)) : null;
};

exports.addReadings = async (req, res) => {
    const { household_id, tds_value, notes, measured_at } = req.body;
    const staff_id = req.user.id;

    const numericTds = Number(tds_value);
    if (isNaN(numericTds) || numericTds < 0 || numericTds > 1500) {
        return res.status(400).json({ message: 'Invalid TDS value' });
    }

    // "Measured at" is optional for older clients; it defaults to now.
    const measuredProvided = measured_at !== undefined && measured_at !== null && measured_at !== '';
    if (measuredProvided && !isValidLocalDateTime(measured_at)) {
        return res.status(400).json({ message: 'Please enter a valid date and time for the measurement.' });
    }
    const measuredAt = measuredProvided ? measured_at : nowInManila();
    if (measuredAt > nowInManila()) {
        return res.status(400).json({ message: 'The measurement time cannot be in the future.' });
    }
    const latitude = parseCoordinate(req.body.latitude, 90);
    const longitude = parseCoordinate(req.body.longitude, 180);
    const hasLocation = latitude !== null && longitude !== null;

    try {
        let result;
        try {
            [result] = await db.query(
                'INSERT INTO tds_readings(household_id,staff_id,tds_value,notes,measured_at,latitude,longitude) VALUES(?,?,?,?,?,?,?)',
                [household_id, staff_id, tds_value, notes || null, `${measuredAt.replace('T', ' ')}:00`, hasLocation ? latitude : null, hasLocation ? longitude : null]
            );
        } catch (insertError) {
            // Columns from docs/sql/alpha-feedback-b.sql not added yet: save the reading the old way.
            if (insertError.code !== 'ER_BAD_FIELD_ERROR') throw insertError;
            [result] = await db.query(
                'INSERT INTO tds_readings(household_id,staff_id,tds_value,notes) VALUES(?,?,?,?)',
                [household_id, staff_id, tds_value, notes || null]
            );
        }
        await auditLog({
            user_id: req.user.id,
            user_name: req.user.name,
            user_role: req.user.role,
            action: 'ADD_TDS_READING',
            table_affected: 'tds_readings',
            record_id: result.insertId,
            details: `TDS reading added for household: ${household_id}, value: ${tds_value}, measured at: ${measuredAt.replace('T', ' ')}${hasLocation ? ', location saved' : ''}`,
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
            WHERE tds_readings.household_id= ? AND tds_readings.deleted_at IS NULL
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
            WHERE tds_readings.household_id= ? AND tds_readings.deleted_at IS NULL
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
            households.zone,
            households.address,
            users.name as staff_name
            FROM tds_readings JOIN households ON tds_readings.household_id = households.id
            JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.id = ? AND tds_readings.deleted_at IS NULL`,
            [id]
        );

        if (!reading) {
            return res.status(404).json({ message: 'Reading not found' });
        }

        const [history] = await db.query(
            `SELECT tds_readings.*, users.name as staff_name
            FROM tds_readings JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.household_id = ? AND tds_readings.id != ? AND tds_readings.deleted_at IS NULL
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
        const [existing] = await db.query('SELECT * FROM tds_readings WHERE id = ? AND deleted_at IS NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Reading not found' });
        }

        await db.query('UPDATE tds_readings SET deleted_at = NOW() WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'ARCHIVE_TDS_READING',
            table_affected: 'tds_readings',
            record_id: id,
            details: `Archived TDS reading #${id} (${existing[0].tds_value} ppm) for household ${existing[0].household_id}`,
            ip_address: req.ip
        });

        res.json({ message: 'TDS reading archived successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.restoreReading = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM tds_readings WHERE id = ? AND deleted_at IS NOT NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Archived reading not found' });
        }

        await db.query('UPDATE tds_readings SET deleted_at = NULL WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'RESTORE_TDS_READING',
            table_affected: 'tds_readings',
            record_id: id,
            details: `Restored TDS reading #${id} (${existing[0].tds_value} ppm) for household ${existing[0].household_id}`,
            ip_address: req.ip
        });

        res.json({ message: 'TDS reading restored successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Hard delete — the row is removed from the database and cannot be restored.
// Only allowed on readings that are already archived.
exports.permanentDeleteReading = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM tds_readings WHERE id = ? AND deleted_at IS NOT NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Archived reading not found' });
        }

        await db.query('DELETE FROM tds_readings WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'PERMANENT_DELETE_TDS_READING',
            table_affected: 'tds_readings',
            record_id: id,
            details: `Permanently deleted TDS reading #${id} (${existing[0].tds_value} ppm) for household ${existing[0].household_id}`,
            ip_address: req.ip
        });

        res.json({ message: 'TDS reading permanently deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
