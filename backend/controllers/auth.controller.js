const db = require('../models/db');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const auditLog = require('../utils/auditLogger');
const crypto = require('crypto');
const sendEmail = require('../utils/emailSender');
const sendVerificationEmail = require('../utils/emailVerification');
const {
    authCookieOptions,
    csrfCookieOptions,
    legacyCsrfCookieOptions,
    authCookieClearOptions,
    csrfCookieClearOptions,
    legacyCsrfCookieClearOptions,
} = require('../utils/cookieOptions');


exports.register = async (req, res) => {
    const { name, email, role, household_id, household_number, zone, address, password } = req.body;
    const passwordMode = req.body.password_mode || 'manual';
    const currentUser = req.user;

    try {
        if (!['generate', 'manual'].includes(passwordMode)) {
            return res.status(400).json({ message: 'Password mode must be generate or manual.' });
        }

        const [existing] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            if (existing[0].deleted_at) {
                return res.status(400).json({ message: 'This email belongs to a previously archived account. Restore it from the Archive instead of creating a new one.' });
            }
            return res.status(400).json({ message: 'Email already registered' });
        }

        let temporaryPassword;
        if (passwordMode === 'generate') {
            const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
            const lowercase = 'abcdefghijkmnopqrstuvwxyz';
            const digits = '23456789';
            const alphabet = uppercase + lowercase + digits;
            const passwordCharacters = [
                uppercase[crypto.randomInt(uppercase.length)],
                lowercase[crypto.randomInt(lowercase.length)],
                digits[crypto.randomInt(digits.length)],
            ];

            while (passwordCharacters.length < 8) {
                passwordCharacters.push(alphabet[crypto.randomInt(alphabet.length)]);
            }

            for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
                const swapIndex = crypto.randomInt(index + 1);
                [passwordCharacters[index], passwordCharacters[swapIndex]] = [passwordCharacters[swapIndex], passwordCharacters[index]];
            }
            temporaryPassword = passwordCharacters.join('');
        }

        const passwordToHash = passwordMode === 'generate' ? temporaryPassword : password;
        const hashedPassword = await bcrypt.hash(passwordToHash, 10);

        let finalHouseholdId = household_id || null;

        // For residents, look up or create household
        if (role === 'resident' && household_number && zone) {
            // Convert to integers for database comparison
            const houseNum = parseInt(household_number, 10);
            const zoneNum = parseInt(zone, 10);

            const [existingHousehold] = await db.query(
                'SELECT id FROM households WHERE household_number = ? AND zone = ?',
                [houseNum, zoneNum]
            );

            if (existingHousehold.length > 0) {
                finalHouseholdId = existingHousehold[0].id;

                const [existingResident] = await db.query(
                    `SELECT id FROM users WHERE household_id = ? AND role = 'resident'`,
                    [finalHouseholdId]
                );

                if (existingResident.length > 0) {
                    return res.status(400).json({
                        message: `Household #${houseNum} in Zone ${zoneNum} already has a resident account linked to it. Please use a different household number or zone.`
                    });
                }
            } else {
                const [newHousehold] = await db.query(
                    'INSERT INTO households(household_number, zone, owner_name, address) VALUES (?,?,?,?)',
                    [houseNum, zoneNum, name, address || '']
                );
                finalHouseholdId = newHousehold.insertId;
            }
        }

        const [result] = await db.query(
            'INSERT INTO users(name, email, role, household_id, password, email_verified) VALUES (?,?,?,?,?,0)',
            [name, email, role, finalHouseholdId, hashedPassword]
        );

        const { emailSent } = await sendVerificationEmail(
            { id: result.insertId, name, email, role },
            passwordMode === 'generate' ? temporaryPassword : undefined
        );

        const [admins] = await db.query(
            'SELECT name, role FROM users WHERE id = ?',
            [currentUser.id]
        );
        const admin = admins[0] || { name: 'Admin', role: 'admin' };

        await auditLog({
            user_id: currentUser.id,
            user_name: admin.name,
            user_role: admin.role,
            action: 'CREATE_USER',
            table_affected: 'users',
            record_id: result.insertId,
            details: `Created ${role} account: ${email}`,
            ip_address: req.ip
        });

        res.status(201).json({
            message: emailSent
                ? 'User registered successfully. A verification email was sent.'
                : passwordMode === 'generate'
                    ? 'The account was created, but the verification email could not be sent. The password was not shown to anyone. Use Resend verification from the Admin Panel and have the user use Forgot password after verifying.'
                    : 'User registered, but the verification email could not be sent. Use Resend verification from the Admin Panel.',
            emailSent
        });





    }

    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }


};
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim()]);

        // Always respond the same way, whether the email exists or not.
        // This prevents someone from using this form to check which emails are registered.
        if (rows.length === 0) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const user = rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

        await db.query(
            'INSERT INTO password_resets(user_id, token, expires_at) VALUES (?,?,?)',
            [user.id, token, expiresAt]
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        await sendEmail({
            to: user.email,
            subject: 'TapAware Password Reset',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.name},</p>
                <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>If you didn't request this, you can safely ignore this email.</p>
            `
        });

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    try {
        const [rows] = await db.query(
            'SELECT * FROM password_resets WHERE token = ?',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        const resetRequest = rows[0];

        if (resetRequest.used) {
            return res.status(400).json({ message: 'This reset link has already been used' });
        }

        if (new Date(resetRequest.expires_at) < new Date()) {
            return res.status(400).json({ message: 'This reset link has expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetRequest.user_id]);
        await db.query('UPDATE password_resets SET used = true WHERE id = ?', [resetRequest.id]);

        res.json({ message: 'Password reset successful. You can now log in.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



exports.verifyEmail = async (req, res) => {
    const invalidLinkMessage = 'This verification link is invalid or has expired. Ask your administrator to resend it.';
    const token = req.body?.token;

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({ message: invalidLinkMessage });
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const [rows] = await db.query(
            `SELECT ev.id, ev.user_id, ev.expires_at, ev.used,
                    u.name, u.role, u.email_verified
             FROM email_verifications ev
             JOIN users u ON u.id = ev.user_id
             WHERE ev.token_hash = ?`,
            [tokenHash]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: invalidLinkMessage });
        }

        const verification = rows[0];
        if (Number(verification.email_verified) === 1) {
            return res.status(200).json({ message: 'Email already verified' });
        }

        const expiresAt = new Date(verification.expires_at);
        if (verification.used || !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
            return res.status(400).json({ message: invalidLinkMessage });
        }

        await db.query('UPDATE users SET email_verified = 1 WHERE id = ?', [verification.user_id]);
        await db.query('UPDATE email_verifications SET used = TRUE WHERE id = ?', [verification.id]);

        await auditLog({
            user_id: verification.user_id,
            user_name: verification.name,
            user_role: verification.role,
            action: 'VERIFY_EMAIL',
            table_affected: 'users',
            record_id: verification.user_id,
            ip_address: req.ip
        });

        return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query(
            `SELECT users.*,
            households.household_number,
            households.zone,
            households.address
            FROM users
            LEFT JOIN households ON users.household_id = households.id
            WHERE users.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.deleted_at) {
            return res.status(403).json({ message: 'This account has been deactivated. Please contact an administrator.' });
        }

        if (user.email_verified !== null && user.email_verified !== undefined && Number(user.email_verified) === 0) {
            return res.status(403).json({ message: 'Please verify your email before logging in. Check your inbox for the verification link, or ask an administrator to resend it.' });
        }

        const token = generateToken(user);
        const csrfToken = crypto.randomBytes(32).toString('hex');

        await auditLog({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            action: 'LOGGED_IN',
            table_affected: 'users',
            record_id: user.id,
            details: `User ${user.name} logged in`,
            ip_address: req.ip

        });

        // Drop any host-only XSRF-TOKEN left over from before COOKIE_DOMAIN was
        // set, otherwise it shadows the one we are about to issue.
        res.clearCookie('XSRF-TOKEN', legacyCsrfCookieClearOptions);
        res.cookie('token', token, authCookieOptions);
        res.cookie('XSRF-TOKEN', csrfToken, csrfCookieOptions);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                household_id: user.household_id,
                household_number: user.household_number,
                zone: user.zone,
                address: user.address
            }
        });




    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

};

exports.logout = async (req, res) => {
    res.clearCookie('token', authCookieClearOptions);
    res.clearCookie('XSRF-TOKEN', csrfCookieClearOptions);
    res.clearCookie('XSRF-TOKEN', legacyCsrfCookieClearOptions);
    res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT users.*,
            households.household_number,
            households.zone,
            households.address
            FROM users
            LEFT JOIN households ON users.household_id = households.id
            WHERE users.id = ?`,
            [req.user.id]
        );

        if (rows.length === 0 || rows[0].deleted_at) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = rows[0];

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                household_id: user.household_id,
                household_number: user.household_number,
                zone: user.zone,
                address: user.address
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT users.id,
            users.name,
            users.email,
            users.role,
            users.household_id,
            households.household_number,
            households.zone,
            users.created_at
            FROM users
            LEFT JOIN households ON users.household_id = households.id
            ORDER BY users.created_at DESC`
        );
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProfile = async (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;

    try {
        const [[currentUserRow]] = await db.query(
            'SELECT email, household_id, role FROM users WHERE id = ?',
            [userId]
        );

        if (
            Object.prototype.hasOwnProperty.call(req.body, 'email') &&
            (typeof email !== 'string' ||
                email.trim().toLowerCase() !== String(currentUserRow.email).trim().toLowerCase())
        ) {
            return res.status(403).json({ message: 'Your email can only be changed by an administrator.' });
        }

        await db.query(
            'UPDATE users SET name = ? WHERE id = ?',
            [name, userId]
        );

        if (currentUserRow.role === 'resident' && currentUserRow.household_id) {
            await db.query(
                'UPDATE households SET owner_name = ? WHERE id = ?',
                [name, currentUserRow.household_id]
            );
        }

        await auditLog({
            user_id: userId,
            user_name: name,
            user_role: req.user.role,
            action: 'UPDATE_PROFILEs',
            table_affected: 'users',
            record_id: userId,
            details: `User updated their own profile info`,
            ip_address: req.ip
        });

        res.json({ message: 'Profile updated successfully', user: { name, email: currentUserRow.email } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        await auditLog({
            user_id: userId,
            user_name: user.name,
            user_role: user.role,
            action: 'CHANGE_PASSWORD',
            table_affected: 'users',
            record_id: userId,
            details: `User changed their own password`,
            ip_address: req.ip
        });

        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
