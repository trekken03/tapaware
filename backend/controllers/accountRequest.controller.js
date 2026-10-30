const db = require('../models/db');
const bcrypt = require('bcryptjs');
const auditLog = require('../utils/auditLogger');
const sendEmail = require('../utils/emailSender');
const sendVerificationEmail = require('../utils/emailVerification');
const generatePassword = require('../utils/generatePassword');

// Same zone options as the Add User form and the landing page concern form.
const ZONES = ['1', '2', '3', '4', '5', '6'];

const NEUTRAL_MESSAGE = 'Request received. The barangay will review it. If it is approved, you will receive an email with your login details.';
const ALREADY_PROCESSED = 'This request has already been processed.';

// The only sentences a rejected requester ever reads. Never add details about
// existing households or accounts here.
const REJECT_SENTENCES = {
    household_mismatch: "We couldn't match your household number and zone with the barangay's records. Please check them and send a new request.",
    visit_barangay: "We couldn't verify your request online. Please visit the barangay hall.",
    not_approved: 'We could not approve your request at this time.',
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const asText = (value) => (typeof value === 'string' || typeof value === 'number') ? String(value).trim() : '';

const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

const parseId = (value) => (/^\d+$/.test(String(value)) ? parseInt(value, 10) : null);

// Runs the automatic checks for one request. `conn` lets approve run it inside
// its transaction; everything else uses the pool.
const evaluateRequest = async (request, conn = db) => {
    const email = String(request.email).toLowerCase();

    const household = { state: 'not_found', id: null, owner_name: null, address: null, resident_name: null };
    const [householdRows] = await conn.query(
        'SELECT id, owner_name, address, deleted_at FROM households WHERE household_number = ? AND zone = ? LIMIT 1',
        [request.household_number, request.zone]
    );
    if (householdRows.length > 0) {
        const row = householdRows[0];
        household.id = row.id;
        household.owner_name = row.owner_name;
        household.address = row.address;

        if (row.deleted_at) {
            household.state = 'archived';
        } else {
            const [residents] = await conn.query(
                `SELECT name FROM users WHERE role = 'resident' AND household_id = ? AND deleted_at IS NULL LIMIT 1`,
                [row.id]
            );
            if (residents.length > 0) {
                household.state = 'occupied';
                household.resident_name = residents[0].name;
            } else {
                household.state = 'vacant';
            }
        }
    }

    const [emailRows] = await conn.query(
        'SELECT id, deleted_at FROM users WHERE LOWER(email) = ? LIMIT 1',
        [email]
    );
    const emailCheck = {
        state: emailRows.length === 0 ? 'available' : emailRows[0].deleted_at ? 'archived_account' : 'taken'
    };

    const nameMatchesOwner = household.state === 'not_found'
        ? null
        : normalizeName(request.full_name) === normalizeName(household.owner_name);

    const [[{ count: otherPending }]] = await conn.query(
        `SELECT COUNT(*) AS count FROM account_requests
         WHERE household_number = ? AND zone = ? AND status = 'pending' AND id <> ?`,
        [request.household_number, request.zone, request.id]
    );

    const requestedName = String(request.full_name).trim().toLowerCase();
    const [matchRows] = await conn.query(
        `SELECT h.id, h.household_number, h.zone, h.owner_name, h.address,
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.household_id = h.id AND u.role = 'resident' AND u.deleted_at IS NULL
                ) AS occupied,
                (LOWER(TRIM(h.owner_name)) = ?) AS name_match
         FROM households h
         WHERE h.deleted_at IS NULL
           AND NOT (h.household_number = ? AND h.zone = ?)
           AND (LOWER(TRIM(h.owner_name)) = ? OR h.household_number = ?)
         ORDER BY name_match DESC, h.id ASC
         LIMIT 5`,
        [requestedName, request.household_number, request.zone, requestedName, request.household_number]
    );
    const possibleMatches = matchRows.map((row) => ({
        id: row.id,
        household_number: row.household_number,
        zone: row.zone,
        owner_name: row.owner_name,
        address: row.address,
        state: Number(row.occupied) === 1 ? 'occupied' : 'vacant',
    }));

    const blockers = [];
    if (request.status !== 'pending') blockers.push(ALREADY_PROCESSED);
    if (household.state === 'occupied') blockers.push('This household already has a resident account.');
    if (household.state === 'not_found') blockers.push('Household not found. Add it under Households first, then approve.');
    if (household.state === 'archived') blockers.push('That household is archived. Restore it from the Archive first.');
    if (emailCheck.state === 'taken') blockers.push('That email is already registered.');
    if (emailCheck.state === 'archived_account') blockers.push('That email belongs to an archived account. Restore it from the Archive instead.');

    return {
        household,
        email: emailCheck,
        name_matches_owner: nameMatchesOwner,
        other_pending_for_household: Number(otherPending),
        possible_matches: possibleMatches,
        can_approve: blockers.length === 0,
        blockers,
    };
};

exports.submitRequest = async (req, res) => {
    const body = req.body || {};

    // Honeypot: real visitors never see the "website" field.
    if (asText(body.website) !== '') {
        return res.status(201).json({ message: NEUTRAL_MESSAGE });
    }

    const fullName = asText(body.full_name);
    const email = asText(body.email).toLowerCase();
    const householdInput = asText(body.household_number);
    const zoneInput = asText(body.zone);
    const address = asText(body.address);

    if (fullName.length < 2 || fullName.length > 250) {
        return res.status(400).json({ message: 'Please enter your full name.' });
    }
    if (!isValidEmail(email) || email.length > 250) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!/^\d{1,6}$/.test(householdInput)) {
        return res.status(400).json({ message: 'Please enter a valid household number.' });
    }
    const householdNumber = String(parseInt(householdInput, 10));
    const zone = /^\d{1,3}$/.test(zoneInput) ? String(parseInt(zoneInput, 10)) : '';
    if (!ZONES.includes(zone)) {
        return res.status(400).json({ message: 'Please select your zone.' });
    }
    if (address.length < 5 || address.length > 250) {
        return res.status(400).json({ message: 'Please enter your street address.' });
    }
    if (body.consent !== true) {
        return res.status(400).json({ message: 'Please agree to the data use notice.' });
    }

    try {
        const [existing] = await db.query(
            `SELECT id FROM account_requests WHERE LOWER(email) = ? AND status = 'pending' LIMIT 1`,
            [email]
        );

        if (existing.length === 0) {
            await db.query(
                'INSERT INTO account_requests(full_name, email, household_number, zone, address) VALUES (?,?,?,?,?)',
                [fullName, email, householdNumber, zone, address]
            );
        }

        res.status(201).json({ message: NEUTRAL_MESSAGE });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const [requests] = await db.query(
            `SELECT id, full_name, email, household_number, zone, status, created_at, reviewed_by, reviewed_at
             FROM account_requests
             ORDER BY created_at DESC, id DESC
             LIMIT 100`
        );
        const [[{ count }]] = await db.query(
            `SELECT COUNT(*) AS count FROM account_requests WHERE status = 'pending'`
        );
        res.json({ requests, pending_count: Number(count) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRequestById = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: 'Invalid request ID.' });
    }

    try {
        const [[request]] = await db.query('SELECT * FROM account_requests WHERE id = ?', [id]);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const checks = await evaluateRequest(request);
        res.json({ request, checks });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.approveRequest = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: 'Invalid request ID.' });
    }
    const currentUser = req.user;

    let conn;
    let request;
    let newUserId;
    let temporaryPassword;

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // Lock the request (and the household it points to) so two admins
        // approving at the same time cannot both succeed.
        const [[locked]] = await conn.query('SELECT * FROM account_requests WHERE id = ? FOR UPDATE', [id]);
        if (!locked) {
            await conn.rollback();
            return res.status(404).json({ message: 'Request not found' });
        }
        if (locked.status !== 'pending') {
            await conn.rollback();
            return res.status(400).json({ message: ALREADY_PROCESSED });
        }
        request = locked;

        await conn.query(
            'SELECT id FROM households WHERE household_number = ? AND zone = ? FOR UPDATE',
            [request.household_number, request.zone]
        );

        const checks = await evaluateRequest(request, conn);
        if (!checks.can_approve) {
            await conn.rollback();
            return res.status(400).json({ message: checks.blockers[0] });
        }

        temporaryPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        const [result] = await conn.query(
            'INSERT INTO users(name, email, role, household_id, password, email_verified) VALUES (?,?,?,?,?,0)',
            [request.full_name, request.email, 'resident', checks.household.id, hashedPassword]
        );
        newUserId = result.insertId;

        await conn.query(
            'UPDATE households SET owner_name = ? WHERE id = ?',
            [request.full_name, checks.household.id]
        );

        await conn.query(
            `UPDATE account_requests
             SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), created_user_id = ?
             WHERE id = ?`,
            [currentUser.name, newUserId, id]
        );

        await conn.commit();
    }
    catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch (rollbackError) { console.error(rollbackError); }
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'That email is already registered.' });
        }
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
    finally {
        if (conn) conn.release();
    }

    try {
        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'APPROVE_ACCOUNT_REQUEST',
            table_affected: 'account_requests',
            record_id: id,
            details: `Approved account request #${id}: household #${request.household_number}, Zone ${request.zone}, ${request.email} (user #${newUserId})`,
            ip_address: req.ip
        });

        const { emailSent } = await sendVerificationEmail(
            { id: newUserId, name: request.full_name, email: request.email, role: 'resident' },
            temporaryPassword,
            'request_approved'
        );

        res.json({
            message: emailSent
                ? `Account created. A verification email with a temporary password was sent to ${request.email}.`
                : 'The account was created, but the verification email could not be sent. The password was not shown to anyone. Use Resend verification from the Admin Panel and have the user use Forgot password after verifying.',
            emailSent,
            user_id: newUserId
        });
    }
    catch (error) {
        // The account already exists at this point, so report it as created.
        console.error(error);
        res.json({
            message: 'The account was created, but the verification email could not be sent. Use Resend verification from the Admin Panel and have the user use Forgot password after verifying.',
            emailSent: false,
            user_id: newUserId
        });
    }
};

exports.rejectRequest = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: 'Invalid request ID.' });
    }
    const currentUser = req.user;
    const reasonCode = req.body?.reason_code;
    const rawNote = req.body?.note;

    if (typeof reasonCode !== 'string' || !Object.prototype.hasOwnProperty.call(REJECT_SENTENCES, reasonCode)) {
        return res.status(400).json({ message: 'Please choose a reason.' });
    }
    if (rawNote !== undefined && rawNote !== null && typeof rawNote !== 'string') {
        return res.status(400).json({ message: 'The internal note must be text.' });
    }
    const note = typeof rawNote === 'string' ? rawNote.trim() : '';
    if (note.length > 500) {
        return res.status(400).json({ message: 'The internal note can be at most 500 characters.' });
    }

    try {
        const [[request]] = await db.query('SELECT * FROM account_requests WHERE id = ?', [id]);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: ALREADY_PROCESSED });
        }

        // The status condition makes a second, simultaneous reject a no-op.
        const [result] = await db.query(
            `UPDATE account_requests
             SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), reject_code = ?, reject_reason = ?
             WHERE id = ? AND status = 'pending'`,
            [currentUser.name, reasonCode, note || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(400).json({ message: ALREADY_PROCESSED });
        }

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'REJECT_ACCOUNT_REQUEST',
            table_affected: 'account_requests',
            record_id: id,
            details: `Rejected account request #${id} (${reasonCode})`,
            ip_address: req.ip
        });

        const emailResult = await sendEmail({
            to: request.email,
            subject: 'About your TapAware account request',
            html: `
                <div style="margin:0;padding:32px 16px;background-color:#0a1a33;font-family:Arial,sans-serif;color:#0a1a33;">
                    <div style="max-width:560px;margin:0 auto;padding:32px;background-color:#ffffff;border-radius:8px;">
                        <h1 style="margin:0 0 20px;color:#0a1a33;font-size:24px;">About your TapAware account request</h1>
                        <p style="margin:0 0 16px;line-height:1.5;">Hello ${escapeHtml(request.full_name)},</p>
                        <p style="margin:0 0 24px;line-height:1.5;">${escapeHtml(REJECT_SENTENCES[reasonCode])}</p>
                        <p style="margin:0;line-height:1.5;">Barangay Cabalantian</p>
                    </div>
                </div>
            `
        });
        const emailSent = Boolean(emailResult?.success);

        res.json({
            message: emailSent
                ? 'Request rejected. The requester was notified by email.'
                : 'Request rejected, but the notification email could not be sent.',
            emailSent
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
