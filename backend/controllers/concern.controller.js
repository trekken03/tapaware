const db = require('../models/db');
const auditLog = require('../utils/auditLogger');
const sendEmail = require('../utils/emailSender');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');

exports.submitConcern = async (req, res) => {
    const { name, contact_info, purok, message } = req.body;

    if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: 'Please describe your concern' });
    }

    try {
        await db.query(
            'INSERT INTO concerns(name, contact_info, purok, message) VALUES (?,?,?,?)',
            [name || null, contact_info || null, purok || null, message]
        );

        res.status(201).json({ message: 'Concern submitted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllConcerns = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM concerns ORDER BY created_at DESC limit 100');
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getConcernById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[concern]] = await db.query('SELECT * FROM concerns WHERE id = ?', [id]);

        if (!concern) {
            return res.status(404).json({ message: 'Concern not found' });
        }

        res.json(concern);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.replyToConcern = async (req, res) => {
    const { id } = req.params;
    const { reply_message } = req.body;
    const currentUser = req.user;

    if (!reply_message || reply_message.trim().length === 0) {
        return res.status(400).json({ message: 'Reply message cannot be empty' });
    }

    try {
        const [[concern]] = await db.query('SELECT * FROM concerns WHERE id = ?', [id]);
        if (!concern) {
            return res.status(404).json({ message: 'Concern not found' });
        }

        await db.query(
            `UPDATE concerns
            SET reply_message = ?, replied_by = ?, replied_at = NOW(), status = 'reviewed'
            WHERE id = ?`,
            [reply_message, currentUser.name, id]
        );

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'REPLY_CONCERN',
            table_affected: 'concerns',
            record_id: id,
            details: `Replied to concern #${id}`,
            ip_address: req.ip
        });

        let emailSent = false;
        if (isValidEmail(concern.contact_info)) {
            const result = await sendEmail({
                to: concern.contact_info,
                subject: 'Response to your TapAware concern',
                html: `
                    <h2>Barangay Cabalantian — TapAware</h2>
                    <p>Hi${concern.name ? ' ' + concern.name : ''},</p>
                    <p>You submitted the following concern:</p>
                    <p style="background:#f3f4f6;padding:12px;border-radius:8px;">${concern.message}</p>
                    <p>Barangay staff response:</p>
                    <p style="background:#e0f2fe;padding:12px;border-radius:8px;">${reply_message}</p>
                    <p>Thank you for helping us keep the barangay's water quality in check.</p>
                `
            });
            emailSent = result.success;
        }

        res.json({
            message: emailSent
                ? 'Reply sent successfully'
                : 'Reply saved, but no valid email was on file so it could not be emailed',
            emailSent
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};