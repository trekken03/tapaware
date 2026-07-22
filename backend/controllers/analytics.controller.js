const db = require('../models/db');

exports.getSummary = async (req, res) => {
    try {
        const [[totalReports]] = await db.query(
            'SELECT COUNT(*) as count FROM reports'
        );
        const [[totalHouseholds]] = await db.query(
            'SELECT COUNT(*) as count FROM households'
        );
        const [[flaggedHousehold]] = await db.query(
            `SELECT COUNT(DISTINCT household_id) as count
            FROM recurring_flags WHERE status = 'active'`
        );
        const [[pendingReports]] = await db.query(
            `SELECT COUNT(*) as count FROM reports WHERE status='pending'`
        );
        const [[avgTds]] = await db.query(
            `SELECT AVG(tds_value) as average FROM tds_readings`
        );

        res.json({
            total_reports: totalReports.count,
            total_households: totalHouseholds.count,
            flagged_households: flaggedHousehold.count,
            pending_reports: pendingReports.count,
            average_tds: avgTds.average ? parseFloat(avgTds.average).toFixed(2) : 0
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
        let query = `SELECT issue_type, COUNT(*) as count FROM reports`;
        const params = [];

        if (from && to) {
            query += ` WHERE created_at BETWEEN ? AND ?`;
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
            FROM households LEFT JOIN reports ON households.id = reports.household_id
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
            households.purok 
            FROM recurring_flags JOIN households ON recurring_flags.household_id = households.id
            WHERE recurring_flags.status = 'active'
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
            FROM tds_readings`;
        const params = [];

        if (from && to) {
            query += ` WHERE recorded_at BETWEEN ? AND ?`;
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

exports.getTdsByPurok = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT households.purok,
            AVG(tds_readings.tds_value) as average_tds,
            COUNT(tds_readings.id) as reading_count
            FROM households 
            LEFT JOIN tds_readings ON households.id = tds_readings.household_id`;
        const params = [];

        if (from && to) {
            query += ` AND tds_readings.recorded_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` GROUP BY households.purok ORDER BY households.purok ASC`;
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
            'SELECT COUNT(*) as count FROM reports WHERE household_id = ? AND user_id = ?',
            [householdId, userId]
        );

        // Get resident's pending reports
        const [[pendingReports]] = await db.query(
            `SELECT COUNT(*) as count FROM reports 
            WHERE household_id = ? AND user_id = ? AND status = 'pending'`,
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
exports.getReportsByPurokCount = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT households.purok, COUNT(reports.id) as report_count
            FROM households LEFT JOIN reports ON households.id = reports.household_id`;
        const params = [];

        if (from && to) {
            query += ` WHERE reports.created_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` GROUP BY households.purok ORDER BY report_count DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTrendingIssuesByPurok = async (req, res) => {
    const { from, to } = req.query;
    try {
        let query = `SELECT households.purok, reports.issue_type, COUNT(*) as count
            FROM reports JOIN households ON reports.household_id = households.id`;
        const params = [];

        if (from && to) {
            query += ` WHERE reports.created_at BETWEEN ? AND ?`;
            params.push(from, `${to} 23:59:59`);
        }

        query += ` GROUP BY households.purok, reports.issue_type ORDER BY households.purok ASC, count DESC`;
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
            FROM reports`;
        const params = [];

        if (from && to) {
            query += ` WHERE created_at BETWEEN ? AND ?`;
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