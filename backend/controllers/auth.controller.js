const db = require('../models/db');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const auditLog = require('../utils/auditLogger');
const crypto = require('crypto');
const sendEmail = require('../utils/emailSender');


exports.register = async (req, res) => {
    const { name, email, role, household_id, household_number, purok, address, password } = req.body;
    const currentUser = req.user;

    try {
        const [existing] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let finalHouseholdId = household_id || null;

        // For residents, look up or create household
        if (role === 'resident' && household_number && purok) {
            // Convert to integers for database comparison
            const houseNum = parseInt(household_number, 10);
            const purokNum = parseInt(purok, 10);

            const [existingHousehold] = await db.query(
                'SELECT id FROM households WHERE household_number = ? AND purok = ?',
                [houseNum, purokNum]
            );

            if (existingHousehold.length > 0) {
                finalHouseholdId = existingHousehold[0].id;

                const [existingResident] = await db.query(
                    `SELECT id FROM users WHERE household_id = ? AND role = 'resident'`,
                    [finalHouseholdId]
                );

                if (existingResident.length > 0) {
                    return res.status(400).json({
                        message: `Household #${houseNum} in Purok ${purokNum} already has a resident account linked to it. Please use a different household number or purok.`
                    });
                }
            } else {
                const [newHousehold] = await db.query(
                    'INSERT INTO households(household_number, purok, owner_name, address) VALUES (?,?,?,?)',
                    [houseNum, purokNum, name, address || '']
                );
                finalHouseholdId = newHousehold.insertId;
            }
        }

        const [result] = await db.query(
            'INSERT INTO users(name, email, role, household_id, password) VALUES (?,?,?,?,?)',
            [name, email, role, finalHouseholdId, hashedPassword]
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

        res.status(201).json({ message: 'User registered successfully' });





    }

    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query(
            `SELECT users.*,
            households.household_number,
            households.purok
            FROM users
            LEFT JOIN households ON users.household_id = households.id
            WHERE users.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = generateToken(user);

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


        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                household_id: user.household_id,
                household_number: user.household_number,
                purok: user.purok
            }
        });




    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
            households.purok,
            users.created_at
            FROM users
            LEFT JOIN households ON users.household_id = households.id
            ORDER BY users.created_at DESC`
        );
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.updateProfile = async (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;

    try {
        const [existing] = await db.query(
            'SELECT * FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already in use by another account' });
        }

        const [[currentUserRow]] = await db.query(
            'SELECT household_id, role FROM users WHERE id = ?',
            [userId]
        );

        await db.query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, userId]
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

        res.json({ message: 'Profile updated successfully', user: { name, email } });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

