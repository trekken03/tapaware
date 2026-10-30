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

    return {
        concerns_new: Number(concerns.count),
        account_requests_pending: Number(requests.count),
    };
};

module.exports = { getAttentionCounts };
