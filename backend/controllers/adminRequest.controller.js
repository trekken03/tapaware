const db = require('../models/db');
const auditLog = require('../utils/auditLogger');

const REQUEST_TYPES = ['change_email', 'change_household', 'correct_name', 'other'];
const ALREADY_PROCESSED = 'This request has already been processed.';

// The admin_requests table comes from docs/sql/alpha-feedback-a.sql. Until it
// is created, this feature answers with a clear error instead of crashing.
const TABLE_MISSING = 'User requests are not available yet. The database has not been updated for this feature.';
const isTableMissing = (error) => error && error.code === 'ER_NO_SUCH_TABLE';

const asText = (value) => (typeof value === 'string' ? value.trim() : '');

const parseId = (value) => (/^\d+$/.test(String(value)) ? parseInt(value, 10) : null);

exports.submitRequest = async (req, res) => {
    const body = req.body || {};
    const requestType = body.request_type;
    const requestedValue = asText(body.requested_value);
    const reason = asText(body.reason);

    if (typeof requestType !== 'string' || !REQUEST_TYPES.includes(requestType)) {
        return res.status(400).json({ message: 'Please choose a request type.' });
    }
    if (requestType !== 'other' && requestedValue === '') {
        return res.status(400).json({ message: 'Please enter what it should be changed to.' });
    }
    if (requestedValue.length > 255) {
        return res.status(400).json({ message: 'The new value can be at most 255 characters.' });
    }
    if (reason.length < 10) {
        return res.status(400).json({ message: 'Please give a reason of at least 10 characters.' });
    }
    if (reason.length > 1000) {
        return res.status(400).json({ message: 'The reason can be at most 1000 characters.' });
    }

    try {
        const [existing] = await db.query(
            `SELECT id FROM admin_requests WHERE user_id = ? AND request_type = ? AND status = 'pending' LIMIT 1`,
            [req.user.id, requestType]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'You already have a pending request of this type. Please wait for an admin to review it.' });
        }

        const [result] = await db.query(
            'INSERT INTO admin_requests(user_id, request_type, requested_value, reason) VALUES (?,?,?,?)',
            [req.user.id, requestType, requestedValue || null, reason]
        );

        await auditLog({
            user_id: req.user.id,
            user_name: req.user.name,
            user_role: req.user.role,
            action: 'SUBMIT_ADMIN_REQUEST',
            table_affected: 'admin_requests',
            record_id: result.insertId,
            details: `Sent a request to an admin (${requestType})`,
            ip_address: req.ip
        });

        res.status(201).json({ message: 'Your request was sent. It is pending until an admin reviews it.' });
    }
    catch (error) {
        if (isTableMissing(error)) {
            return res.status(503).json({ message: TABLE_MISSING });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const [requests] = await db.query(
            `SELECT ar.id, ar.user_id, ar.request_type, ar.requested_value, ar.reason, ar.status,
                    ar.admin_note, ar.reviewed_at, ar.created_at,
                    u.name AS user_name, u.email AS user_email,
                    h.household_number, h.zone,
                    reviewer.name AS reviewed_by_name
             FROM admin_requests ar
             JOIN users u ON ar.user_id = u.id
             LEFT JOIN households h ON u.household_id = h.id
             LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
             ORDER BY ar.created_at DESC, ar.id DESC`
        );
        const pendingCount = requests.filter((r) => r.status === 'pending').length;
        res.json({ requests, pending_count: pendingCount });
    }
    catch (error) {
        if (isTableMissing(error)) {
            return res.status(503).json({ message: TABLE_MISSING });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// The request plus the requester's current account details, so the detail page
// can show the current value next to the requested one.
exports.getRequestById = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: 'Invalid request ID.' });
    }

    try {
        const [[row]] = await db.query(
            `SELECT ar.id, ar.user_id, ar.request_type, ar.requested_value, ar.reason, ar.status,
                    ar.admin_note, ar.reviewed_at, ar.created_at,
                    reviewer.name AS reviewed_by_name,
                    u.name AS user_name, u.email AS user_email, u.email_verified AS user_email_verified,
                    u.role AS user_role, u.deleted_at AS user_deleted_at,
                    h.household_number, h.zone, h.address
             FROM admin_requests ar
             JOIN users u ON ar.user_id = u.id
             LEFT JOIN households h ON u.household_id = h.id
             LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
             WHERE ar.id = ?`,
            [id]
        );
        if (!row) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json({
            request: {
                id: row.id,
                request_type: row.request_type,
                requested_value: row.requested_value,
                reason: row.reason,
                status: row.status,
                admin_note: row.admin_note,
                reviewed_at: row.reviewed_at,
                reviewed_by_name: row.reviewed_by_name,
                created_at: row.created_at,
            },
            user: {
                id: row.user_id,
                name: row.user_name,
                email: row.user_email,
                email_verified: Number(row.user_email_verified) === 1,
                role: row.user_role,
                archived: Boolean(row.user_deleted_at),
                household_number: row.household_number,
                zone: row.zone,
                address: row.address,
            },
        });
    }
    catch (error) {
        if (isTableMissing(error)) {
            return res.status(503).json({ message: TABLE_MISSING });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Only records the decision. Any account change is made beforehand through the
// Edit User endpoint (PUT /api/admin/users/:id); nothing on the account is changed here.
exports.reviewRequest = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: 'Invalid request ID.' });
    }
    const status = req.body?.status;
    const rawNote = req.body?.admin_note;

    if (status !== 'done' && status !== 'rejected') {
        return res.status(400).json({ message: 'Status must be done or rejected.' });
    }
    if (rawNote !== undefined && rawNote !== null && typeof rawNote !== 'string') {
        return res.status(400).json({ message: 'The note must be text.' });
    }
    const note = typeof rawNote === 'string' ? rawNote.trim() : '';
    if (note.length > 500) {
        return res.status(400).json({ message: 'The note can be at most 500 characters.' });
    }
    if (status === 'rejected' && note === '') {
        return res.status(400).json({ message: 'Please add a note explaining why the request is rejected.' });
    }
    // Set by the detail page after its Edit User update succeeded; only used for the audit entry.
    const applied = status === 'done' && req.body?.applied === true;

    try {
        // The status condition makes a second, simultaneous review a no-op.
        const [result] = await db.query(
            `UPDATE admin_requests
             SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [status, note || null, req.user.id, id]
        );
        if (result.affectedRows === 0) {
            const [[request]] = await db.query('SELECT id FROM admin_requests WHERE id = ?', [id]);
            return request
                ? res.status(400).json({ message: ALREADY_PROCESSED })
                : res.status(404).json({ message: 'Request not found' });
        }

        await auditLog({
            user_id: req.user.id,
            user_name: req.user.name,
            user_role: req.user.role,
            action: status === 'done' ? 'COMPLETE_ADMIN_REQUEST' : 'REJECT_ADMIN_REQUEST',
            table_affected: 'admin_requests',
            record_id: id,
            details: `Marked user request #${id} as ${status}${status === 'done' ? (applied ? ' (change applied through Edit User)' : ' (no change applied)') : ''}`,
            ip_address: req.ip
        });

        res.json({ message: status === 'done' ? 'Request marked as done.' : 'Request rejected.' });
    }
    catch (error) {
        if (isTableMissing(error)) {
            return res.status(503).json({ message: TABLE_MISSING });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
