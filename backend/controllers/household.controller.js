const db = require('../models/db');
const auditLog = require('../utils/auditLogger');

// A resident's own household, read from the database (never from the request).
const getOwnHouseholdId = async (userId) => {
    const [[user]] = await db.query(
        'SELECT household_id FROM users WHERE id = ? AND deleted_at IS NULL',
        [userId]
    );
    return user?.household_id || null;
};

exports.getAllHouseholds = async (req, res) => {
    try {
        // Residents only see their own household (Submit Report looks it up in this list).
        const isResident = req.user?.role === 'resident';
        const ownHouseholdId = isResident ? await getOwnHouseholdId(req.user.id) : null;
        if (isResident && !ownHouseholdId) {
            return res.json([]);
        }

        const [rows] = await db.query(`
            SELECT h.*,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM recurring_flags rf
                        WHERE rf.household_id = h.id AND rf.status = 'active'
                    ) THEN 'flagged'
                    WHEN EXISTS (
                        SELECT 1 FROM reports r
                        WHERE r.household_id = h.id AND r.status IN ('pending', 'investigating') AND r.deleted_at IS NULL
                    ) THEN 'pending'
                    ELSE 'safe'
                END AS computed_status
            FROM households h
            WHERE h.deleted_at IS NULL
            ${isResident ? 'AND h.id = ?' : ''}
            ORDER BY h.created_at DESC
        `, isResident ? [ownHouseholdId] : []);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getArchivedHouseholds = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM households WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
        );
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addHousehold = async (req, res) => {

    const { household_number, zone, owner_name, address } = req.body;

    try {
        if (
            household_number === undefined ||
            household_number === null ||
            household_number === '' ||
            zone === undefined ||
            zone === null ||
            zone === '' ||
            typeof owner_name !== 'string' ||
            !owner_name.trim() ||
            typeof address !== 'string' ||
            !address.trim()
        ) {
            return res.status(400).json({
                message: 'All household fields are required'
            });
        }


        const [existing] = await db.query('SELECT * FROM households WHERE household_number = ? and zone = ?', [household_number, zone]);
        if (existing.length > 0) {
            if (existing[0].deleted_at) {
                return res.status(400).json({ message: 'This household was previously archived. Restore it from the Archive instead of creating a new one.' });
            }
            return res.status(400).json({ message: 'Household address already exists' });
        }
        const [result] = await db.query(
            'INSERT INTO households(household_number,zone,owner_name,address) VALUES (?,?,?,?)',
            [household_number, zone, owner_name, address]
        );
        await auditLog({
            user_id: req.user ? req.user.id : null,
            user_name: req.user ? req.user.name : 'Unknown',
            user_role: req.user ? req.user.role : 'staff',
            action: 'ADD_HOUSEHOLD',
            table_affected: 'households',
            record_id: result.insertId,
            details: `Added household: ${household_number} - ${owner_name}, zone: ${zone}`,
            ip_address: req.ip
        });
        res.status(201).json({ message: 'household added successfully' });
    }
    catch (error) {

        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getHouseholdById = async (req, res) => {
    const { id } = req.params;

    try {
        // A resident may only open their own household; anything else looks like it doesn't exist.
        if (req.user?.role === 'resident') {
            const ownHouseholdId = await getOwnHouseholdId(req.user.id);
            if (!ownHouseholdId || Number(ownHouseholdId) !== Number(id)) {
                return res.status(404).json({ message: 'Household not found' });
            }
        }

        const [[household]] = await db.query(
            `SELECT h.*,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM recurring_flags rf
                        WHERE rf.household_id = h.id AND rf.status = 'active'
                    ) THEN 'flagged'
                    WHEN EXISTS (
                        SELECT 1 FROM reports r
                        WHERE r.household_id = h.id AND r.status IN ('pending', 'investigating') AND r.deleted_at IS NULL
                    ) THEN 'pending'
                    ELSE 'safe'
                END AS computed_status
            FROM households h
            WHERE h.id = ? AND h.deleted_at IS NULL`,
            [id]
        );

        if (!household) {
            return res.status(404).json({ message: 'Household not found' });
        }

        const [reports] = await db.query(
            `SELECT reports.*, users.name as reported_by
            FROM reports JOIN users ON reports.user_id = users.id
            WHERE reports.household_id = ? AND reports.deleted_at IS NULL
            ORDER BY reports.created_at DESC`,
            [id]
        );

        const [tdsReadings] = await db.query(
            `SELECT tds_readings.*, users.name as staff_name
            FROM tds_readings JOIN users ON tds_readings.staff_id = users.id
            WHERE tds_readings.household_id = ? AND tds_readings.deleted_at IS NULL
            ORDER BY tds_readings.recorded_at DESC`,
            [id]
        );

        const [flags] = await db.query(
            `SELECT *
     FROM recurring_flags
     WHERE household_id = ? AND status = 'active'
     ORDER BY last_reported_at DESC`,
            [id]
        );

        // measured_at holds the barangay's local wall-clock time (no time zone), and mysql2
        // turns it into a Date in the server's zone; send it back as plain "YYYY-MM-DDTHH:MM"
        // so the browser doesn't shift it. Readings saved before the column existed have none.
        const toLocalText = (value) => (value instanceof Date
            ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
            : null);
        const readings = tdsReadings.map((reading) => ({ ...reading, measured_at_text: toLocalText(reading.measured_at) }));

        res.json({ ...household, reports, tds_readings: readings, flags });
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
        const [existing] = await db.query('SELECT * FROM households WHERE id = ? AND deleted_at IS NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Household not found' });
        }

        // Archiving a household cascades to its non-archived reports and TDS readings,
        // mirroring the old ON DELETE CASCADE behavior, but reversibly. A single JS timestamp
        // (rather than three separate NOW() calls) keeps the three UPDATEs matchable for restore.
        const archivedAt = new Date();
        await db.query('UPDATE households SET deleted_at = ? WHERE id = ?', [archivedAt, id]);
        await db.query('UPDATE reports SET deleted_at = ? WHERE household_id = ? AND deleted_at IS NULL', [archivedAt, id]);
        await db.query('UPDATE tds_readings SET deleted_at = ? WHERE household_id = ? AND deleted_at IS NULL', [archivedAt, id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'ARCHIVE_HOUSEHOLD',
            table_affected: 'households',
            record_id: id,
            details: `Archived household #${existing[0].household_number} - ${existing[0].owner_name}, zone ${existing[0].zone}`,
            ip_address: req.ip
        });

        res.json({ message: 'Household archived successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.restoreHousehold = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM households WHERE id = ? AND deleted_at IS NOT NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Archived household not found' });
        }

        await db.query('UPDATE households SET deleted_at = NULL WHERE id = ?', [id]);
        // Only restore reports/readings that were archived as part of the same household archive
        // (i.e. archived at the same moment) — anything archived independently beforehand stays archived.
        await db.query(
            'UPDATE reports SET deleted_at = NULL WHERE household_id = ? AND deleted_at = ?',
            [id, existing[0].deleted_at]
        );
        await db.query(
            'UPDATE tds_readings SET deleted_at = NULL WHERE household_id = ? AND deleted_at = ?',
            [id, existing[0].deleted_at]
        );

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'RESTORE_HOUSEHOLD',
            table_affected: 'households',
            record_id: id,
            details: `Restored household #${existing[0].household_number} - ${existing[0].owner_name}, zone ${existing[0].zone}`,
            ip_address: req.ip
        });

        res.json({ message: 'Household restored successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Hard delete — the row is removed from the database and cannot be restored.
// Only allowed on households that are already archived. The schema's
// ON DELETE CASCADE takes every report, TDS reading and recurring flag of this
// household with it; residents linked to it keep their account but lose the
// household link (users.household_id is ON DELETE SET NULL).
exports.permanentDeleteHousehold = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM households WHERE id = ? AND deleted_at IS NOT NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Archived household not found' });
        }

        // Counted before the delete so the audit entry records what went with it.
        const [[{ report_count }]] = await db.query('SELECT COUNT(*) as report_count FROM reports WHERE household_id = ?', [id]);
        const [[{ reading_count }]] = await db.query('SELECT COUNT(*) as reading_count FROM tds_readings WHERE household_id = ?', [id]);
        const [[{ user_count }]] = await db.query('SELECT COUNT(*) as user_count FROM users WHERE household_id = ?', [id]);

        await db.query('DELETE FROM households WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'PERMANENT_DELETE_HOUSEHOLD',
            table_affected: 'households',
            record_id: id,
            details: `Permanently deleted household #${existing[0].household_number} - ${existing[0].owner_name}, zone ${existing[0].zone}. Also removed ${report_count} report(s) and ${reading_count} TDS reading(s); ${user_count} user account(s) unlinked`,
            ip_address: req.ip
        });

        res.json({ message: 'Household permanently deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
