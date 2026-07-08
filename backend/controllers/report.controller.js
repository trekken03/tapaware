const db = require('../models/db');
const auditLog = require('../utils/auditLogger');

exports.getAllReports = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT reports.*, 
            households.household_number,
            households.owner_name,
            households.purok,
            users.name as reported_by
            FROM reports JOIN households ON reports.household_id =households.id
            JOIN users ON reports.user_id= users.id
            ORDER BY reports.created_at DESC`
        );
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.submitReport = async (req, res) => {
    const { household_id, user_id, issue_type, description } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO reports(household_id,user_id,issue_type,description)VALUES(?,?,?,?)',
            [household_id, user_id, issue_type, description || null]
        );
        await auditLog({
            user_id: req.user ? req.user.id : null,
            user_name: req.user ? req.user.name : 'Unknown',
            user_role: req.user ? req.user.role : 'resident',
            action: 'SUBMIT_REPORT',
            table_affected: 'reports',
            record_id: result.insertId,
            details: `Report submitted for household: ${household_id}, issue: ${issue_type}`,
            ip_address: req.ip
        });
        const [existing] = await db.query(
            `SELECT * FROM recurring_flags WHERE household_id =? AND issue_type = ? AND status='active'`,
            [household_id, issue_type]
        );
        if (existing.length > 0) {
            await db.query(
                `UPDATE recurring_flags
                SET times_reported = times_reported + 1,last_reported_at=NOW()
                WHERE household_id=? AND issue_type=? AND status ='active'`,
                [household_id, issue_type]
            );
        }
        else {
            const [countRows] = await db.query(
                `SELECT COUNT(*) as count FROM reports
                WHERE household_id = ? AND issue_type =?`,
                [household_id, issue_type]
            );
            if (countRows[0].count >= 3) {
                await db.query(
                    `INSERT INTO recurring_flags(household_id,issue_type,times_reported,last_reported_at)
                    VALUES(?,?,?,NOW())`, [household_id, issue_type, countRows[0].count]
                );
            }
        }

        res.status(201).json({ message: 'Report submitted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateReportStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await db.query(
            `UPDATE reports SET status = ? WHERE id=?`,
            [status, id]
        );
        await auditLog({
            user_id: req.user ? req.user.id : null,
            user_name: req.user ? req.user.name : 'Unknown',
            user_role: req.user ? req.user.role : 'staff',
            action: 'UPDATE_REPORT_STATUS',
            table_affected: 'reports',
            record_id: id,
            details: `Report status updated to ${status} for report ID: ${id}`,
            ip_address: req.ip
        });
        res.json({ message: 'Report status updated successfully ' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }

};

exports.getReportsByHousehold = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT reports.*, users.name as reported_by
            FROM reports JOIN users ON reports.user_id=users.id
            WHERE reports.household_id=?
            ORDER BY reports.created_at DESC`,
            [id]
        );
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getReportById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[report]] = await db.query(
            `SELECT reports.*,
            households.household_number,
            households.owner_name,
            households.purok,
            households.address,
            users.name as reported_by
            FROM reports JOIN households ON reports.household_id = households.id
            JOIN users ON reports.user_id = users.id
            WHERE reports.id = ?`,
            [id]
        );

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const [otherReports] = await db.query(
            `SELECT reports.*, users.name as reported_by
            FROM reports JOIN users ON reports.user_id = users.id
            WHERE reports.household_id = ? AND reports.id != ?
            ORDER BY reports.created_at DESC
            LIMIT 5`,
            [report.household_id, id]
        );

        res.json({ ...report, household_reports: otherReports });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
