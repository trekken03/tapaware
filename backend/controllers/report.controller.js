const db = require('../models/db');
const auditLog = require('../utils/auditLogger');
const sendEmail = require('../utils/emailSender');

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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTimeBucket = (timeString) => {
    const hour = parseInt(timeString.split(':')[0], 10);
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
};

exports.submitReport = async (req, res) => {
    const { household_id, user_id, issue_type, description, occurred_time } = req.body;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const finalOccurredTime = occurred_time || currentTime;

    try {
        const [result] = await db.query(
            'INSERT INTO reports(household_id,user_id,issue_type,description,occurred_at)VALUES(?,?,?,?,?)',
            [household_id, user_id, issue_type, description || null, finalOccurredTime]
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

        const [[household]] = await db.query('SELECT purok FROM households WHERE id = ?', [household_id]);
        const timeBucket = getTimeBucket(finalOccurredTime);

        const [existingPattern] = await db.query(
            'SELECT * FROM time_patterns WHERE purok = ? AND issue_type = ? AND time_bucket = ?',
            [household.purok, issue_type, timeBucket]
        );

        if (existingPattern.length > 0) {
            await db.query(
                'UPDATE time_patterns SET times_reported = times_reported + 1, last_reported_at = NOW() WHERE id = ?',
                [existingPattern[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO time_patterns(purok, issue_type, time_bucket, times_reported, last_reported_at) VALUES (?,?,?,1,NOW())',
                [household.purok, issue_type, timeBucket]
            );
        }

        res.status(201).json({ message: 'Report submitted successfully' });

        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            try {
                await sendEmail({
                    to: adminEmail,
                    subject: `New Water Quality Report — ${issue_type}`,
                    html: `
        <h2>New Report Submitted</h2>
        <p>A new water quality report has been submitted.</p>
        <p><strong>Issue Type:</strong> ${issue_type}</p>
        <p><strong>Description:</strong> ${description || 'No description provided'}</p>
        <p><strong>Household ID:</strong> ${household_id}</p>
        <p>Log in to TapAware to view full details and update its status.</p>
    `
                });
            } catch (emailError) {
                console.log('Failed to send report notification email:', emailError.message);
            }
        } else {
            console.log('Report submitted, but no admin email configured for notification.');
        }


    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteReport = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM reports WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }
        const report = existing[0];

        const isAdmin = currentUser.role === 'admin';
        const isOwner = currentUser.role === 'resident' && report.user_id === currentUser.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'You are not allowed to delete this report' });
        }

        if (isOwner && report.status !== 'pending') {
            return res.status(400).json({ message: 'This report is already being processed and can no longer be deleted' });
        }

        await db.query('DELETE FROM reports WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'DELETE_REPORT',
            table_affected: 'reports',
            record_id: id,
            details: `Deleted report #${id} (${report.issue_type})`,
            ip_address: req.ip
        });

        res.json({ message: 'Report deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
