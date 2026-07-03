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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getReportByIssueType = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT issue_type, COUNT(*) as count
            FROM reports GROUP BY issue_type ORDER BY count DESC`
        );
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTdsTrend = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT DATE(recorded_at) as date,
            AVG(tds_value) as average,
            COUNT(*) as reading_count
            FROM tds_readings GROUP BY DATE(recorded_at)
            ORDER BY date DESC LIMIT 30`
        );
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTdsByPurok = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT households.purok,
            AVG(tds_readings.tds_value) as average_tds,
            COUNT(tds_readings.id) as reading_count
            FROM households 
            LEFT JOIN tds_readings ON households.id = tds_readings.household_id
            GROUP BY households.purok
            ORDER BY households.purok ASC`
        );
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getReportsByPurokCount = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT households.purok,
            COUNT(reports.id) as report_count
            FROM households LEFT JOIN reports ON households.id = reports.household_id
            GROUP BY households.purok ORDER BY report_count DESC`
        );
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
