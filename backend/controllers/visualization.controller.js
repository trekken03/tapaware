const db = require('../models/db');
const jwt = require('jsonwebtoken');
const { getAttentionCounts } = require('../utils/attentionCounts');

exports.getSummary = async (req, res) => {
    // This route is public (the homepage uses it), so the admin-only total reads the
    // session cookie here instead of through verifyToken. No or bad token: field is left out.
    let isAdmin = false;
    try {
        const token = req.cookies && req.cookies.token;
        isAdmin = Boolean(token) && jwt.verify(token, process.env.JWT_SECRET).role === 'admin';
    } catch (error) {
        isAdmin = false;
    }

    try {
        const [[totalReports]] = await db.query(
            'SELECT COUNT(*) as count FROM reports WHERE deleted_at IS NULL'
        );
        const [[totalHouseholds]] = await db.query(
            'SELECT COUNT(*) as count FROM households WHERE deleted_at IS NULL'
        );
        const [[flaggedHousehold]] = await db.query(
            `SELECT COUNT(DISTINCT household_id) as count
            FROM recurring_flags WHERE status = 'active'`
        );
        const [[pendingReports]] = await db.query(
            `SELECT COUNT(*) as count FROM reports WHERE status='pending' AND deleted_at IS NULL`
        );
        const [[avgTds]] = await db.query(
            `SELECT AVG(tds_value) as average FROM tds_readings WHERE deleted_at IS NULL`
        );
        let totalUsers = null;
        if (isAdmin) {
            const [[usersCount]] = await db.query(
                'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
            );
            totalUsers = Number(usersCount.count);
        }

        res.json({
            total_reports: totalReports.count,
            total_households: totalHouseholds.count,
            flagged_households: flaggedHousehold.count,
            pending_reports: pendingReports.count,
            average_tds: avgTds.average ? parseFloat(avgTds.average).toFixed(2) : 0,
            ...(isAdmin ? { total_users: totalUsers } : {})
        });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getReportByIssueType = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT issue_type, COUNT(*) as count FROM reports WHERE deleted_at IS NULL`;
        const params = [];

        if (from && to) {
            query += ` AND created_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` GROUP BY issue_type ORDER BY count DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getReportsByHouseholdCount = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT households.household_number,households.owner_name,
            COUNT(reports.id) as report_count
            FROM households LEFT JOIN reports ON households.id = reports.household_id AND reports.deleted_at IS NULL
            WHERE households.deleted_at IS NULL
            GROUP BY households.id ORDER BY report_count DESC `
        );
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getFlaggedHouseholds = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT recurring_flags.*,
            households.household_number,
            households.owner_name,
            households.zone
            FROM recurring_flags JOIN households ON recurring_flags.household_id = households.id
            WHERE recurring_flags.status = 'active' AND households.deleted_at IS NULL
            ORDER BY recurring_flags.times_reported DESC`
        );
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getTdsTrend = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT DATE(recorded_at) as date, AVG(tds_value) as average, COUNT(*) as reading_count
            FROM tds_readings WHERE deleted_at IS NULL`;
        const params = [];

        if (from && to) {
            query += ` AND recorded_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
            query += ` GROUP BY DATE(recorded_at) ORDER BY date ASC`;
        } else {
            query += ` GROUP BY DATE(recorded_at) ORDER BY date DESC LIMIT 30`;
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTdsByZone = async (req, res) => {
    const { from, to } = req.query;
    try {
        // This endpoint is public (the homepage renders it to anonymous visitors),
        // so it deliberately exposes no reading counts — only the average and the
        // date of the most recent reading. last_recorded is NULL for a zone with
        // no readings, which is how callers tell "empty" apart from "has data".
        let query = `SELECT households.zone,
            AVG(tds_readings.tds_value) as average_tds,
            MAX(tds_readings.recorded_at) as last_recorded
            FROM households
            LEFT JOIN tds_readings ON households.id = tds_readings.household_id AND tds_readings.deleted_at IS NULL`;
        const params = [];

        if (from && to) {
            query += ` AND tds_readings.recorded_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` WHERE households.deleted_at IS NULL GROUP BY households.zone ORDER BY households.zone ASC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getResidentSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get resident's household
        const [[userHousehold]] = await db.query(
            'SELECT household_id FROM users WHERE id = ?',
            [userId]
        );

        if (!userHousehold || !userHousehold.household_id) {
            return res.json({
                my_reports: 0,
                pending_reports: 0
            });
        }

        const householdId = userHousehold.household_id;

        // Get resident's total reports
        const [[myReports]] = await db.query(
            'SELECT COUNT(*) as count FROM reports WHERE household_id = ? AND user_id = ? AND deleted_at IS NULL',
            [householdId, userId]
        );

        // Get resident's pending reports
        const [[pendingReports]] = await db.query(
            `SELECT COUNT(*) as count FROM reports
            WHERE household_id = ? AND user_id = ? AND status = 'pending' AND deleted_at IS NULL`,
            [householdId, userId]
        );

        res.json({
            my_reports: myReports.count,
            pending_reports: pendingReports.count
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getReportsByZoneCount = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT households.zone, COUNT(reports.id) as report_count
            FROM households LEFT JOIN reports ON households.id = reports.household_id AND reports.deleted_at IS NULL`;
        const params = [];

        if (from && to) {
            query += ` AND reports.created_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` WHERE households.deleted_at IS NULL GROUP BY households.zone ORDER BY report_count DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTrendingIssuesByZone = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT households.zone, reports.issue_type, COUNT(*) as count
            FROM reports JOIN households ON reports.household_id = households.id
            WHERE reports.deleted_at IS NULL`;
        const params = [];

        if (from && to) {
            query += ` AND reports.created_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` GROUP BY households.zone, reports.issue_type ORDER BY households.zone ASC, count DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getReportsByStatus = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT status, COUNT(*) as count FROM reports WHERE deleted_at IS NULL`;
        const params = [];

        if (from && to) {
            query += ` AND created_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` GROUP BY status ORDER BY FIELD(status, 'pending','investigating','resolved')`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTrendingIssuesByTime = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT
                CASE
                    WHEN HOUR(occurred_at) >= 5 AND HOUR(occurred_at) < 11 THEN 'morning'
                    WHEN HOUR(occurred_at) >= 11 AND HOUR(occurred_at) < 17 THEN 'afternoon'
                    WHEN HOUR(occurred_at) >= 17 AND HOUR(occurred_at) < 21 THEN 'evening'
                    ELSE 'night'
                END AS time_bucket,
                issue_type,
                COUNT(*) as count
            FROM reports
            WHERE deleted_at IS NULL`;
        const params = [];

        if (from && to) {
            query += ` AND created_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` GROUP BY time_bucket, issue_type
            ORDER BY FIELD(time_bucket, 'morning','afternoon','evening','night'), count DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Open reports older than this many days count as "needs follow-up".
const FOLLOW_UP_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

// Manila calendar date as YYYY-MM-DD. Manila has no daylight saving, so stepping
// back 24 hours always lands on the previous Manila day.
const manilaDateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
});
const manilaWeekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', weekday: 'short' });

const toDayKey = (value) => {
    const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
    return isNaN(date) ? null : manilaDateKey.format(date);
};

// Highest count wins; ties go to the lower key in numeric-aware alphabetical order.
const pickTop = (counts, keyName) => {
    const entries = Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true }));
    return entries.length > 0 ? { [keyName]: entries[0][0], count: entries[0][1] } : null;
};

exports.getDashboardWeek = async (req, res) => {
    try {
        const now = new Date();
        const dayKeys = [];
        for (let i = 13; i >= 0; i--) {
            dayKeys.push(manilaDateKey.format(new Date(now.getTime() - i * DAY_MS)));
        }
        const previousKeys = new Set(dayKeys.slice(0, 7));
        const lastKeys = dayKeys.slice(7);
        const lastKeySet = new Set(lastKeys);

        const [reportRows] = await db.query(
            `SELECT reports.created_at, reports.issue_type, households.zone
            FROM reports JOIN households ON reports.household_id = households.id
            WHERE reports.deleted_at IS NULL AND reports.created_at >= NOW() - INTERVAL 15 DAY`
        );
        const [readingRows] = await db.query(
            `SELECT recorded_at FROM tds_readings
            WHERE deleted_at IS NULL AND recorded_at >= NOW() - INTERVAL 15 DAY`
        );
        const [[followUp]] = await db.query(
            `SELECT COUNT(*) as count FROM reports
            WHERE deleted_at IS NULL AND status IN ('pending','investigating')
            AND created_at < NOW() - INTERVAL ? DAY`,
            [FOLLOW_UP_DAYS]
        );
        // Same query as getSummary, so this always matches the Flagged Households card.
        const [[flaggedHousehold]] = await db.query(
            `SELECT COUNT(DISTINCT household_id) as count
            FROM recurring_flags WHERE status = 'active'`
        );

        const perDayCounts = Object.fromEntries(lastKeys.map((key) => [key, 0]));
        const issueCounts = {};
        const zoneCounts = {};
        let reportsPrevious = 0;
        for (const row of reportRows) {
            const key = toDayKey(row.created_at);
            if (lastKeySet.has(key)) {
                perDayCounts[key] += 1;
                issueCounts[row.issue_type] = (issueCounts[row.issue_type] || 0) + 1;
                zoneCounts[row.zone] = (zoneCounts[row.zone] || 0) + 1;
            } else if (previousKeys.has(key)) {
                reportsPrevious += 1;
            }
        }

        const countWindows = (rows, column) => {
            let last7 = 0;
            let previous7 = 0;
            for (const row of rows) {
                const key = toDayKey(row[column]);
                if (lastKeySet.has(key)) last7 += 1;
                else if (previousKeys.has(key)) previous7 += 1;
            }
            return { last7, previous7 };
        };

        const response = {
            generated_at: now.toISOString(),
            reports: {
                last7: lastKeys.reduce((sum, key) => sum + perDayCounts[key], 0),
                previous7: reportsPrevious,
                per_day: lastKeys.map((key) => ({
                    date: key,
                    label: manilaWeekday.format(new Date(`${key}T12:00:00+08:00`)),
                    count: perDayCounts[key],
                })),
                top_issue: pickTop(issueCounts, 'issue_type'),
                busiest_zone: pickTop(zoneCounts, 'zone'),
            },
            tds_readings: countWindows(readingRows, 'recorded_at'),
            follow_up: { count: Number(followUp.count), threshold_days: FOLLOW_UP_DAYS },
            flagged_households: Number(flaggedHousehold.count),
        };

        if (req.user.role === 'admin') {
            const [userRows] = await db.query(
                `SELECT created_at FROM users
                WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL 15 DAY`
            );
            const attention = await getAttentionCounts();
            response.admin = {
                new_accounts: countWindows(userRows, 'created_at'),
                concerns_new: attention.concerns_new,
                account_requests_pending: attention.account_requests_pending,
            };
        }

        res.set('Cache-Control', 'no-store');
        res.json(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};