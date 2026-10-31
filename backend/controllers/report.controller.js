const db = require('../models/db');
const auditLog = require('../utils/auditLogger');
const sendEmail = require('../utils/emailSender');

// mysql2 returns DATE columns as a Date at local midnight; send a plain "YYYY-MM-DD"
// so the browser can't shift it a day. Undefined (column not added yet) stays null.
const toDateText = (value) => {
    if (!value) return null;
    if (!(value instanceof Date)) return String(value).slice(0, 10);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};

exports.getAllReports = async (req, res) => {
    try {
        const isResident = req.user?.role === 'resident';
        let query = `SELECT reports.*,
            households.household_number,
            households.owner_name,
            households.zone,
            users.name as reported_by
            FROM reports JOIN households ON reports.household_id =households.id
            JOIN users ON reports.user_id = users.id
            WHERE reports.deleted_at IS NULL
            ${isResident ? 'AND reports.user_id = ?' : ''}
            ORDER BY reports.created_at DESC`;
        const params = isResident ? [req.user.id] : [];
        const [rows] = await db.query(query, params);
        res.json(rows.map((row) => ({ ...row, scheduled_date_text: toDateText(row.scheduled_date) })));
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
            households.zone,
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

const MAX_BACKDATE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

exports.submitReport = async (req, res) => {
    const { household_id, user_id, issue_type, other_issue, description, occurred_time, occurred_date } = req.body;

    const isPositiveInteger = (value) => {
        if (typeof value === 'number') {
            return Number.isSafeInteger(value) && value > 0;
        }

        return typeof value === 'string' &&
            /^\d+$/.test(value) &&
            Number.isSafeInteger(Number(value)) &&
            Number(value) > 0;
    };

    if (!isPositiveInteger(household_id) || !isPositiveInteger(user_id)) {
        return res.status(400).json({ message: 'Missing household or user information.' });
    }

    try {
        const [[household]] = await db.query(
            'SELECT id FROM households WHERE id = ? AND deleted_at IS NULL',
            [household_id]
        );
        if (!household) {
            return res.status(400).json({ message: 'Household not found.' });
        }

        const validIssueTypes = ['odor', 'discoloration', 'low pressure', 'cleanliness', 'broken hardware', 'other'];
        if (typeof issue_type !== 'string' || !validIssueTypes.includes(issue_type)) {
            return res.status(400).json({ message: 'Please select a valid issue type.' });
        }

        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({ message: 'Please describe the issue.' });
        }

        if (
            occurred_time !== undefined &&
            occurred_time !== '' &&
            (typeof occurred_time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(occurred_time))
        ) {
            return res.status(400).json({ message: 'Please enter a valid time.' });
        }

        // occurred_date is optional; without it the report uses the legacy
        // "same day it was filed" behaviour and occurred_on stays NULL.
        const dateProvided = occurred_date !== undefined && occurred_date !== null;
        if (dateProvided) {
            const dateMatch = typeof occurred_date === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(occurred_date);
            const occurredDay = dateMatch
                ? new Date(Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])))
                : null;
            if (
                !occurredDay ||
                occurredDay.getUTCFullYear() !== Number(dateMatch[1]) ||
                occurredDay.getUTCMonth() !== Number(dateMatch[2]) - 1 ||
                occurredDay.getUTCDate() !== Number(dateMatch[3])
            ) {
                return res.status(400).json({ message: 'Please enter a valid date.' });
            }

            // 1-day tolerance either way covers residents whose local date differs from UTC.
            const serverNow = new Date();
            const todayUtc = Date.UTC(serverNow.getUTCFullYear(), serverNow.getUTCMonth(), serverNow.getUTCDate());
            const dayOffset = Math.round((occurredDay.getTime() - todayUtc) / DAY_MS);
            if (dayOffset > 1) {
                return res.status(400).json({ message: 'The date cannot be in the future.' });
            }
            if (dayOffset < -(MAX_BACKDATE_DAYS + 1)) {
                return res.status(400).json({ message: `Reports can only be filed for issues that happened within the last ${MAX_BACKDATE_DAYS} days.` });
            }

            if (typeof occurred_time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(occurred_time)) {
                return res.status(400).json({ message: 'Please enter the time it happened.' });
            }
        }

    const normalizedIssueType = issue_type === 'other' ? 'other' : issue_type;

    const cleanOtherIssue =
        normalizedIssueType === 'other' && other_issue
            ? other_issue.trim()
            : null;

    const finalDescription = description?.trim() || null;

    const issueLabel =
        normalizedIssueType === 'other' && cleanOtherIssue
            ? `Other: ${cleanOtherIssue}`
            : normalizedIssueType;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const finalOccurredTime = occurred_time || currentTime;

        // One open report per household and issue type; a new one is allowed once it is resolved.
        const [[openReport]] = await db.query(
            `SELECT id FROM reports
             WHERE household_id = ? AND issue_type = ? AND deleted_at IS NULL AND status <> 'resolved'
             ORDER BY created_at DESC LIMIT 1`,
            [household_id, normalizedIssueType]
        );
        if (openReport) {
            return res.status(409).json({
                code: 'OPEN_REPORT_EXISTS',
                message: 'You already have an open report for this issue. You can submit again once it is resolved.',
                existingReportId: openReport.id
            });
        }

        const [result] = await db.query(
            `INSERT INTO reports
        (household_id, user_id, issue_type, other_issue, description, occurred_at, occurred_on)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                household_id,
                user_id,
                normalizedIssueType,
                cleanOtherIssue,
                finalDescription,
                finalOccurredTime,
                dateProvided ? occurred_date : null
            ]
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
            const [[household]] = await db.query('SELECT zone FROM households WHERE id = ?', [household_id]);
            const timeBucket = getTimeBucket(finalOccurredTime);

            const [existingPattern] = await db.query(
                'SELECT * FROM time_patterns WHERE zone = ? AND issue_type = ? AND time_bucket = ?',
                [household.zone, normalizedIssueType, timeBucket]
            );

            if (existingPattern.length > 0) {
                await db.query(
                    'UPDATE time_patterns SET times_reported = times_reported + 1, last_reported_at = NOW() WHERE id = ?',
                    [existingPattern[0].id]
                );
            } else {
                await db.query(
                    'INSERT INTO time_patterns(zone, issue_type, time_bucket, times_reported, last_reported_at) VALUES (?,?,?,1,NOW())',
                    [household.zone, normalizedIssueType, timeBucket]
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
        ${dateProvided ? `<p><strong>When it happened:</strong> ${occurred_date} at ${occurred_time}</p>` : ''}
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

// The schedule and resolution columns come from docs/sql/alpha-feedback-b.sql.
// Until they exist, Investigating and Resolved answer with this instead of crashing.
const REPORT_COLUMNS_MISSING = 'Scheduling and resolution details are not available yet. The database has not been updated for this feature.';
// resolution_tds_value comes from docs/sql/alpha-feedback-c.sql.
const RESOLUTION_TDS_MISSING = 'Saving a TDS reading at resolution is not available yet. The database has not been updated for this feature. Resolve without the TDS value, or try again later.';
const RESOLUTION_TDS_FAILED = 'The report was not resolved because the TDS reading could not be saved. Nothing was changed. Please try again.';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

// The barangay's calendar day, so "not in the past" doesn't depend on the server's time zone.
const todayInManila = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());

// Current wall-clock time in the barangay as "YYYY-MM-DD HH:MM:00", the format
// tds_readings.measured_at is stored in (see tds.controller addReadings).
const nowInManilaDateTime = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:00`;
};

const isValidDateText = (value) => {
    const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
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

const formatTime12 = (time) => {
    const [hours, minutes] = String(time).split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const formatDateLong = (dateText) => {
    const [year, month, day] = dateText.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    });
};

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

exports.updateReportStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'investigating', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
    }

    const scheduledDate = req.body.scheduled_date;
    const scheduledFrom = req.body.scheduled_from;
    const scheduledTo = req.body.scheduled_to;
    const resolutionNotes = typeof req.body.resolution_notes === 'string' ? req.body.resolution_notes.trim() : '';
    const resolutionLat = parseCoordinate(req.body.resolution_lat, 90);
    const resolutionLng = parseCoordinate(req.body.resolution_lng, 180);
    const hasLocation = resolutionLat !== null && resolutionLng !== null;

    // Optional TDS reading taken when resolving. Empty means "not given".
    const rawTds = req.body.resolution_tds_value;
    const tdsProvided = status === 'resolved' && rawTds !== undefined && rawTds !== null
        && !(typeof rawTds === 'string' && rawTds.trim() === '');
    const resolutionTds = tdsProvided ? Number(rawTds) : null;

    if (status === 'investigating') {
        if (!isValidDateText(scheduledDate)) {
            return res.status(400).json({ message: 'Please choose the scheduled day.' });
        }
        if (scheduledDate < todayInManila()) {
            return res.status(400).json({ message: 'The scheduled day cannot be in the past.' });
        }
        if (typeof scheduledFrom !== 'string' || !TIME_PATTERN.test(scheduledFrom)
            || typeof scheduledTo !== 'string' || !TIME_PATTERN.test(scheduledTo)) {
            return res.status(400).json({ message: 'Please enter the scheduled time window.' });
        }
        if (scheduledTo <= scheduledFrom) {
            return res.status(400).json({ message: 'The end of the time window must be after the start.' });
        }
    }
    if (status === 'resolved') {
        if (resolutionNotes.length < 10) {
            return res.status(400).json({ message: 'Please describe how it was resolved (at least 10 characters).' });
        }
        if (resolutionNotes.length > 2000) {
            return res.status(400).json({ message: 'The resolution notes can be at most 2000 characters.' });
        }
        // Same rule as addReadings in tds.controller.
        if (tdsProvided && (isNaN(resolutionTds) || resolutionTds < 0 || resolutionTds > 1500)) {
            return res.status(400).json({ message: 'Invalid TDS value' });
        }
    }

    try {

        const [[report]] = await db.query(`select household_id, issue_type, user_id
            from reports where id = ? and deleted_at is null`, [id]);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (status === 'pending') {
            await db.query(
                `UPDATE reports SET status = ? WHERE id= ?`,
                [status, id]
            );
        }
        // The other open reports for the same household and issue follow this one,
        // and get the same schedule or resolution details.
        let resolutionReadingId = null;
        if (status === 'resolved' && tdsProvided) {
            // With a TDS value, resolving and saving the reading succeed or fail together.
            const conn = await db.getConnection();
            try {
                await conn.beginTransaction();
                await conn.query(
                    `UPDATE reports
                     SET status = 'resolved', resolution_notes = ?, resolved_by = ?, resolved_at = NOW(),
                         resolution_lat = ?, resolution_lng = ?, resolution_tds_value = ?
                     WHERE id = ?`,
                    [resolutionNotes, req.user.id, resolutionLat, resolutionLng, resolutionTds, id]
                );
                await conn.query(
                    `UPDATE reports
                     SET status = 'resolved', resolution_notes = ?, resolved_by = ?, resolved_at = NOW(),
                         resolution_lat = ?, resolution_lng = ?, resolution_tds_value = ?
                     WHERE household_id = ? AND issue_type = ? AND deleted_at IS NULL AND status != 'resolved'`,
                    [resolutionNotes, req.user.id, resolutionLat, resolutionLng, resolutionTds, report.household_id, report.issue_type]
                );

                // One reading for the household, however many reports were resolved.
                const readingNotes = `Resolution check, report #${id}`;
                let readingResult;
                try {
                    [readingResult] = await conn.query(
                        'INSERT INTO tds_readings(household_id,staff_id,tds_value,notes,measured_at,latitude,longitude) VALUES(?,?,?,?,?,?,?)',
                        [report.household_id, req.user.id, resolutionTds, readingNotes, nowInManilaDateTime(), hasLocation ? resolutionLat : null, hasLocation ? resolutionLng : null]
                    );
                } catch (insertError) {
                    // measured_at/latitude/longitude not added yet: save the reading the old way, like addReadings.
                    if (insertError.code !== 'ER_BAD_FIELD_ERROR') throw insertError;
                    [readingResult] = await conn.query(
                        'INSERT INTO tds_readings(household_id,staff_id,tds_value,notes) VALUES(?,?,?,?)',
                        [report.household_id, req.user.id, resolutionTds, readingNotes]
                    );
                }
                resolutionReadingId = readingResult.insertId;

                await conn.commit();
            } catch (transactionError) {
                try { await conn.rollback(); } catch (rollbackError) { console.error(rollbackError); }
                console.error(transactionError);
                const columnMissing = transactionError.code === 'ER_BAD_FIELD_ERROR'
                    && String(transactionError.sqlMessage || transactionError.message).includes('resolution_tds_value');
                return res.status(columnMissing ? 503 : 500).json({
                    message: columnMissing ? RESOLUTION_TDS_MISSING : RESOLUTION_TDS_FAILED
                });
            } finally {
                conn.release();
            }
        } else if (status === 'resolved') {
            await db.query(
                `UPDATE reports
                 SET status = 'resolved', resolution_notes = ?, resolved_by = ?, resolved_at = NOW(),
                     resolution_lat = ?, resolution_lng = ?
                 WHERE id = ?`,
                [resolutionNotes, req.user.id, resolutionLat, resolutionLng, id]
            );
            await db.query(
                `UPDATE reports
                 SET status = 'resolved', resolution_notes = ?, resolved_by = ?, resolved_at = NOW(),
                     resolution_lat = ?, resolution_lng = ?
                 WHERE household_id = ? AND issue_type = ? AND deleted_at IS NULL AND status != 'resolved'`,
                [resolutionNotes, req.user.id, resolutionLat, resolutionLng, report.household_id, report.issue_type]
            );
        }
        if (status === 'investigating') {
            await db.query(
                `UPDATE reports
                 SET status = 'investigating', scheduled_date = ?, scheduled_from = ?, scheduled_to = ?,
                     investigating_at = COALESCE(investigating_at, NOW())
                 WHERE id = ?`,
                [scheduledDate, scheduledFrom, scheduledTo, id]
            );
            await db.query(
                `UPDATE reports
                 SET status = 'investigating', scheduled_date = ?, scheduled_from = ?, scheduled_to = ?,
                     investigating_at = COALESCE(investigating_at, NOW())
                 WHERE household_id = ? AND issue_type = ? AND deleted_at IS NULL AND status != 'resolved'`,
                [scheduledDate, scheduledFrom, scheduledTo, report.household_id, report.issue_type]
            );
        }

        const scheduleText = status === 'investigating'
            ? `${formatDateLong(scheduledDate)}, ${formatTime12(scheduledFrom)} to ${formatTime12(scheduledTo)}`
            : '';

        await auditLog({
            user_id: req.user ? req.user.id : null,
            user_name: req.user ? req.user.name : 'Unknown',
            user_role: req.user ? req.user.role : 'staff',
            action: 'UPDATE_REPORT_STATUS',
            table_affected: 'reports',
            record_id: id,
            details: `Report status updated to ${status} for report ID: ${id}`
                + (status === 'investigating' ? ` (scheduled ${scheduledDate} ${scheduledFrom}-${scheduledTo})` : '')
                + (status === 'resolved' ? ` (resolution notes saved${hasLocation ? ', location saved' : ''}${tdsProvided ? `, TDS ${resolutionTds} ppm` : ''})` : ''),
            ip_address: req.ip
        });

        if (resolutionReadingId) {
            await auditLog({
                user_id: req.user.id,
                user_name: req.user.name,
                user_role: req.user.role,
                action: 'ADD_TDS_READING',
                table_affected: 'tds_readings',
                record_id: resolutionReadingId,
                details: `TDS reading added for household: ${report.household_id}, value: ${resolutionTds} (resolution check, report #${id})`,
                ip_address: req.ip
            });
        }

        if (status !== 'investigating') {
            return res.json({ message: 'Report status updated successfully ' });
        }

        // The status change already succeeded; a failed email is only reported back.
        let emailSent = false;
        try {
            const [[resident]] = await db.query('SELECT name, email FROM users WHERE id = ?', [report.user_id]);
            if (resident?.email) {
                const issueLabel = String(report.issue_type);
                const result = await sendEmail({
                    to: resident.email,
                    subject: 'Your TapAware report is being checked',
                    html: `
                <div style="margin:0;padding:32px 16px;background-color:#0a1a33;font-family:Arial,sans-serif;color:#0a1a33;">
                    <div style="max-width:560px;margin:0 auto;padding:32px;background-color:#ffffff;border-radius:8px;">
                        <h1 style="margin:0 0 20px;color:#0a1a33;font-size:24px;">Your report is being checked</h1>
                        <p style="margin:0 0 16px;line-height:1.5;">Hello ${escapeHtml(resident.name)},</p>
                        <p style="margin:0 0 16px;line-height:1.5;">The barangay is now looking into your report about <strong>${escapeHtml(issueLabel)}</strong>.</p>
                        <p style="margin:0 0 24px;line-height:1.5;">Scheduled visit: <strong>${escapeHtml(scheduleText)}</strong></p>
                        <p style="margin:0;line-height:1.5;">Barangay Cabalantian</p>
                    </div>
                </div>
            `
                });
                emailSent = Boolean(result?.success);
            }
        } catch (emailError) {
            console.log('Failed to send report schedule email:', emailError.message);
        }

        res.json({
            message: emailSent
                ? 'Report status updated. The resident was emailed the schedule.'
                : 'Report status updated, but the email to the resident could not be sent.',
            emailSent
        });
    }
    catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(503).json({ message: REPORT_COLUMNS_MISSING });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

};

exports.getReportsByHousehold = async (req, res) => {
    const { id } = req.params;

    try {
        const isResident = req.user?.role === 'resident';
        let query = `SELECT reports.*, users.name as reported_by
            FROM reports JOIN users ON reports.user_id=users.id
            WHERE reports.household_id = ? AND reports.deleted_at IS NULL
            ${isResident ? 'AND reports.user_id = ?' : ''}
            ORDER BY reports.created_at DESC`;
        const params = isResident ? [id, req.user.id] : [id];
        const [rows] = await db.query(query, params);
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
            DATE_FORMAT(reports.occurred_on, '%Y-%m-%d') AS occurred_on_text,
            households.household_number,
            households.owner_name,
            households.zone,
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

        if (req.user?.role === 'resident' && Number(report.user_id) !== Number(req.user.id)) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const isResident = req.user?.role === 'resident';
        let otherReportsQuery = `SELECT reports.*, users.name as reported_by
            FROM reports JOIN users ON reports.user_id = users.id
            WHERE reports.household_id = ? AND reports.id != ? AND reports.deleted_at IS NULL
            ${isResident ? 'AND reports.user_id = ?' : ''}
            ORDER BY reports.created_at DESC
            LIMIT 5`;
        const otherReportsParams = [report.household_id, id];
        if (isResident) otherReportsParams.push(req.user.id);
        const [otherReports] = await db.query(otherReportsQuery, otherReportsParams);

        const [[activeFlag]] = await db.query(
            `SELECT id, times_reported FROM recurring_flags
            WHERE household_id = ? AND issue_type = ? AND status = 'active'`,
            [report.household_id, report.issue_type]
        );

        res.json({
            ...report,
            scheduled_date_text: toDateText(report.scheduled_date),
            household_reports: otherReports,
            active_flag: activeFlag || null
        });
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
