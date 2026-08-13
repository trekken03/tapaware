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
                        WHERE r.household_id = h.id AND r.status IN ('pending', 'investigating') AND r.deleted_at IS NULL
                    ) THEN 'pending'
                    ELSE 'safe'
                END AS computed_status
            FROM households h
            WHERE h.deleted_at IS NULL
            ORDER BY h.created_at ASC
        `);
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

    const { household_number, purok, owner_name, address } = req.body;

    try {
        const [existing] = await db.query('SELECT * FROM households WHERE household_number = ? and purok = ?', [household_number, purok]);
        if (existing.length > 0) {
            if (existing[0].deleted_at) {
                return res.status(400).json({ message: 'This household was previously archived. Restore it from the Archive instead of creating a new one.' });
            }
            return res.status(400).json({ message: 'Household address already exists' });
        }
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

        res.status(500).json({ message: 'Server error', error: error.message });
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
            details: `Archived household #${existing[0].household_number} - ${existing[0].owner_name}, purok ${existing[0].purok}`,
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
            details: `Restored household #${existing[0].household_number} - ${existing[0].owner_name}, purok ${existing[0].purok}`,
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
            details: `Permanently deleted household #${existing[0].household_number} - ${existing[0].owner_name}, purok ${existing[0].purok}. Also removed ${report_count} report(s) and ${reading_count} TDS reading(s); ${user_count} user account(s) unlinked`,
            ip_address: req.ip
        });

        res.json({ message: 'Household permanently deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
