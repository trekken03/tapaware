const db = require('../models/db');

// Counts behind the Admin Panel dot in the sidebar. Archived concerns are left out,
// matching the concerns list the admin actually sees.
const getAttentionCounts = async () => {
    const [[concerns]] = await db.query(
        `SELECT COUNT(*) AS count FROM concerns WHERE status = 'new' AND deleted_at IS NULL`
    );
    const [[requests]] = await db.query(
        `SELECT COUNT(*) AS count FROM account_requests WHERE status = 'pending'`
    );

    // admin_requests may not exist yet (docs/sql/alpha-feedback-a.sql); count 0 until it does.
    let adminRequestsPending = 0;
    try {
        const [[adminRequests]] = await db.query(
            `SELECT COUNT(*) AS count FROM admin_requests WHERE status = 'pending'`
        );
        adminRequestsPending = Number(adminRequests.count);
    } catch (error) {
        if (error.code !== 'ER_NO_SUCH_TABLE') throw error;
    }

    return {
        concerns_new: Number(concerns.count),
        account_requests_pending: Number(requests.count),
        admin_requests_pending: adminRequestsPending,
    };
};

module.exports = { getAttentionCounts };
