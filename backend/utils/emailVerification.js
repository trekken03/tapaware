const crypto = require('crypto');
const db = require('../models/db');
const sendEmail = require('./emailSender');

const VERIFICATION_EXPIRY_HOURS = 48;

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sendVerificationEmail = async (user, temporaryPassword, variant = 'registered') => {
    try {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

        await db.query(
            'UPDATE email_verifications SET used = TRUE WHERE user_id = ? AND used = FALSE',
            [user.id]
        );
        await db.query(
            'INSERT INTO email_verifications(user_id, token_hash, expires_at) VALUES (?,?,?)',
            [user.id, tokenHash, expiresAt]
        );

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        const safeName = escapeHtml(user.name);
        const safeRole = escapeHtml(user.role);
        const safeEmail = escapeHtml(user.email);
        const safeLink = escapeHtml(verificationLink);
        const emailChanged = variant === 'email_changed';
        const temporaryPasswordSection = temporaryPassword
            ? `<div style="margin:0 0 24px;padding:16px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;">
                        <p style="margin:0 0 8px;line-height:1.5;font-weight:bold;">Your temporary password:</p>
                        <p style="margin:0;padding:12px;background-color:#ffffff;border-radius:4px;font-family:monospace;font-size:20px;letter-spacing:2px;">${escapeHtml(temporaryPassword)}</p>
                        <p style="margin:12px 0 0;line-height:1.5;font-weight:bold;">Please change it as soon as you log in: go to My Account, then Change Password.</p>
                    </div>`
            : '';
        const result = await sendEmail({
            to: user.email,
            subject: emailChanged ? 'Verify your new TapAware email' : 'Verify your TapAware account',
            html: `
                <div style="margin:0;padding:32px 16px;background-color:#0a1a33;font-family:Arial,sans-serif;color:#0a1a33;">
                    <div style="max-width:560px;margin:0 auto;padding:32px;background-color:#ffffff;border-radius:8px;">
                        <h1 style="margin:0 0 20px;color:#0a1a33;font-size:24px;">${emailChanged ? 'Verify your new TapAware email' : 'Verify your TapAware account'}</h1>
                        ${emailChanged
                            ? `<p style="margin:0 0 16px;line-height:1.5;">Hello ${safeName}, an administrator changed the email address on your TapAware account to <strong>${safeEmail}</strong>. Please verify it to keep using your account. From now on, log in with this email address.</p>`
                            : `<p style="margin:0 0 16px;line-height:1.5;">Hello ${safeName}, an account has been registered under your email in TapAware.</p>`}
                        <p style="margin:0 0 24px;line-height:1.5;">Account role: <strong>${safeRole}</strong></p>
                        ${temporaryPasswordSection}
                        <p style="margin:0 0 24px;">
                            <a href="${safeLink}" style="display:inline-block;padding:12px 20px;background-color:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Verify my email</a>
                        </p>
                        <p style="margin:0 0 8px;line-height:1.5;">If the button does not work, copy and paste this link into your browser:</p>
                        <p style="margin:0 0 24px;line-height:1.5;word-break:break-all;"><a href="${safeLink}" style="color:#1d4ed8;">${safeLink}</a></p>
                        <p style="margin:0 0 16px;line-height:1.5;">This link expires in ${VERIFICATION_EXPIRY_HOURS} hours.</p>
                        <p style="margin:0;line-height:1.5;">If you weren't expecting this, ignore this email; the account stays inactive.</p>
                    </div>
                </div>
            `
        });

        return { emailSent: Boolean(result?.success) };
    } catch (error) {
        console.error('Email verification setup failed:', error.message);
        return { emailSent: false };
    }
};

module.exports = sendVerificationEmail;
