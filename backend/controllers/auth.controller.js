const db = require('../models/db');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const auditLog = require('../utils/auditLogger');


exports.register = async (req, res) => {
    const { name, email, role, household_id, household_number, purok, password } = req.body;
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
            } else {
                const [newHousehold] = await db.query(
                    'INSERT INTO households(household_number, purok, owner_name, address) VALUES (?,?,?,?)',
                    [houseNum, purokNum, name, '']
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

