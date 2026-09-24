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
            WHERE reports.deleted_at IS NULL
            ORDER BY reports.created_at DESC`
        );
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getArchivedReports = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT reports.*,
            households.household_number,
            households.owner_name,
            households.purok,
            users.name as reported_by
            FROM reports JOIN households ON reports.household_id = households.id
            JOIN users ON reports.user_id = users.id
            WHERE reports.deleted_at IS NOT NULL
            ORDER BY reports.deleted_at DESC`
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
    const { household_id, user_id, issue_type, other_issue, description, occurred_time } = req.body;

    const normalizedIssueType = issue_type === 'other' ? 'other' : issue_type;
    const customIssueNote = normalizedIssueType === 'other' && other_issue ? `Other issue: ${other_issue}` : null;
    const finalDescription = [description, customIssueNote].filter(Boolean).join('\n\n') || null;
    const issueLabel = normalizedIssueType === 'other' && other_issue ? `Other: ${other_issue}` : normalizedIssueType;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const finalOccurredTime = occurred_time || currentTime;

    try {
        const [result] = await db.query(
            'INSERT INTO reports(household_id,user_id,issue_type,description,occurred_at)VALUES(?,?,?,?,?)',
            [household_id, user_id, normalizedIssueType, finalDescription, finalOccurredTime]
        );
        await auditLog({
            user_id: req.user ? req.user.id : null,
            user_name: req.user ? req.user.name : 'Unknown',
            user_role: req.user ? req.user.role : 'resident',
            action: 'SUBMIT_REPORT',
            table_affected: 'reports',
            record_id: result.insertId,
            details: `Report submitted for household: ${household_id}, issue: ${issueLabel}`,
            ip_address: req.ip
        });
        try {
            const [existingFlag] = await db.query(
                `SELECT * FROM recurring_flags
     WHERE household_id = ? AND issue_type = ?`,
                [household_id, normalizedIssueType]
            );

            if (existingFlag.length > 0) {
                await db.query(
                    `UPDATE recurring_flags
         SET times_reported = times_reported + 1,
             last_reported_at = NOW(),
             status = 'active'
         WHERE household_id = ? AND issue_type = ?`,
                    [household_id, normalizedIssueType]
                );
            } else {
                const [countRows] = await db.query(
                    `SELECT COUNT(*) as count
         FROM reports
         WHERE household_id = ? AND issue_type = ? AND deleted_at IS NULL`,
                    [household_id, normalizedIssueType]
                );

                if (countRows[0].count >= 3) {
                    await db.query(
                        `INSERT INTO recurring_flags (household_id, issue_type, times_reported, last_reported_at, status)
             VALUES (?, ?, ?, NOW(), 'active')`,
                        [household_id, normalizedIssueType, countRows[0].count]
                    );
                }
            }
        } catch (flagError) {
            console.warn('Recurring flag update skipped for this report:', flagError.message);
        }

        try {
            const [[household]] = await db.query('SELECT purok FROM households WHERE id = ?', [household_id]);
            const timeBucket = getTimeBucket(finalOccurredTime);

            const [existingPattern] = await db.query(
                'SELECT * FROM time_patterns WHERE purok = ? AND issue_type = ? AND time_bucket = ?',
                [household.purok, normalizedIssueType, timeBucket]
            );

            if (existingPattern.length > 0) {
                await db.query(
                    'UPDATE time_patterns SET times_reported = times_reported + 1, last_reported_at = NOW() WHERE id = ?',
                    [existingPattern[0].id]
                );
            } else {
                await db.query(
                    'INSERT INTO time_patterns(purok, issue_type, time_bucket, times_reported, last_reported_at) VALUES (?,?,?,1,NOW())',
                    [household.purok, normalizedIssueType, timeBucket]
                );
            }
        } catch (patternError) {
            console.warn('Time pattern update skipped for this report:', patternError.message);
        }

        res.status(201).json({ message: 'Report submitted successfully' });

        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            try {
                await sendEmail({
                    to: adminEmail,
                    subject: `New Water Quality Report — ${issueLabel}`,
                    html: `
        <h2>New Report Submitted</h2>
        <p>A new water quality report has been submitted.</p>
        <p><strong>Issue Type:</strong> ${issueLabel}</p>
        <p><strong>Description:</strong> ${finalDescription || 'No description provided'}</p>
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
            WHERE reports.household_id=? AND reports.deleted_at IS NULL
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
            WHERE reports.id = ? AND reports.deleted_at IS NULL`,
            [id]
        );

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const [otherReports] = await db.query(
            `SELECT reports.*, users.name as reported_by
            FROM reports JOIN users ON reports.user_id = users.id
            WHERE reports.household_id = ? AND reports.id != ? AND reports.deleted_at IS NULL
            ORDER BY reports.created_at DESC
            LIMIT 5`,
            [report.household_id, id]
        );

        const [[activeFlag]] = await db.query(
            `SELECT id, times_reported FROM recurring_flags
            WHERE household_id = ? AND issue_type = ? AND status = 'active'`,
            [report.household_id, report.issue_type]
        );

        res.json({ ...report, household_reports: otherReports, active_flag: activeFlag || null });
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
        const [existing] = await db.query('SELECT * FROM reports WHERE id = ? AND deleted_at IS NULL', [id]);
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
        await db.query('UPDATE reports SET deleted_at = NOW() WHERE id = ?', [id]);

        // If this report was counted toward an active recurring flag, archiving it
        // means the flag's evidence just shrank by one — decrement, and drop the
        // flag back to resolved once it no longer meets the flagging threshold.
        const [[activeFlag]] = await db.query(
            `SELECT * FROM recurring_flags WHERE household_id = ? AND issue_type = ? AND status = 'active'`,
            [report.household_id, report.issue_type]
        );

        if (activeFlag) {
            const newCount = Math.max(activeFlag.times_reported - 1, 0);
            const newStatus = newCount <= 2 ? 'resolved' : 'active';
            await db.query(
                `UPDATE recurring_flags SET times_reported = ?, status = ? WHERE id = ?`,
                [newCount, newStatus, activeFlag.id]
            );
        }

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'ARCHIVE_REPORT',
            table_affected: 'reports',
            record_id: id,
            details: `Archived report #${id} (${report.issue_type})`,
            ip_address: req.ip
        });

        res.json({ message: 'Report archived successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.restoreReport = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM reports WHERE id = ? AND deleted_at IS NOT NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Archived report not found' });
        }

        await db.query('UPDATE reports SET deleted_at = NULL WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'RESTORE_REPORT',
            table_affected: 'reports',
            record_id: id,
            details: `Restored report #${id} (${existing[0].issue_type})`,
            ip_address: req.ip
        });

        res.json({ message: 'Report restored successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Hard delete — the row is removed from the database and cannot be restored.
// Only allowed on records that are already archived, so nothing live can be
// wiped by accident.
exports.permanentDeleteReport = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM reports WHERE id = ? AND deleted_at IS NOT NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Archived report not found' });
        }

        await db.query('DELETE FROM reports WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'PERMANENT_DELETE_REPORT',
            table_affected: 'reports',
            record_id: id,
            details: `Permanently deleted report #${id} (${existing[0].issue_type}) for household ${existing[0].household_id}`,
            ip_address: req.ip
        });

        res.json({ message: 'Report permanently deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

