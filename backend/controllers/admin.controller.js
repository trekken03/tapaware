const db = require('../models/db');
const auditLog = require('../utils/auditLogger');

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(`Select u.id,u.name,u.email,u.role,u.household_id,
            h.household_number,h.purok,u.created_at from users u left join households h on u.household_id = h.id
            order by u.created_at desc`);
        res.json(rows);
    }
    catch (error) {

        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = req.user;

    try {
        await db.query(`Update users set role = ? where id = ?`, [role, id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'UPDATE_USER_ROLE',
            table_affected: 'users',
            record_id: id,
            details: `Changed role to ${role}`,
            ip_address: req.ip
        });
        res.json({ message: 'User role updated successfully' });

    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }

};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [user] = await db.query(`Select * from users where id = ?`, [id]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.query(`Delete from users where id = ?`, [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'DELETE_USER',
            table_affected: 'users',
            record_id: id,
            details: `Deleted user ${user[0].name} (${user[0].email})`,
            ip_address: req.ip
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({
                message: 'Cannot delete this user — they have submitted reports or recorded TDS readings. Change their role instead, or delete those records first.'
            });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getAuditTrail = async (req, res) => {
    try {
        const [rows] = await db.query(`Select * from audit_trail order by created_at desc limit 100`);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }

};

exports.getAuditTrailByUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`Select * from audit_trail where user_id = ? order by created_at desc`, [id]);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }

};

exports.updateUserInfo = async (req, res) => {
    const { id } = req.params;
    const { name, email, household_number, purok } = req.body;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [emailCheck] = await db.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
        if (emailCheck.length > 0) {
            return res.status(400).json({ message: 'Email already in use by another account' });
        }

        let finalHouseholdId = existing[0].household_id;

        if (household_number && purok) {
            const houseNum = parseInt(household_number, 10);
            const purokNum = parseInt(purok, 10);

            const [existingHousehold] = await db.query(
                'SELECT id FROM households WHERE household_number = ? AND purok = ?',
                [houseNum, purokNum]
            );

            if (existingHousehold.length > 0) {
                finalHouseholdId = existingHousehold[0].id;

                const [existingResident] = await db.query(
                    `SELECT id FROM users WHERE household_id = ? AND role = 'resident' AND id != ?`,
                    [finalHouseholdId, id]
                );

                if (existingResident.length > 0) {
                    return res.status(400).json({
                        message: `Household #${houseNum} in Purok ${purokNum} already has a resident account linked to it. Please use a different household number or purok.`
                    });
                }
            } else {
                const [newHousehold] = await db.query(
                    'INSERT INTO households(household_number, purok, owner_name, address) VALUES (?,?,?,?)',
                    [houseNum, purokNum, name, '']
                );
                finalHouseholdId = newHousehold.insertId;
            }
        }

        await db.query(
            'UPDATE users SET name = ?, email = ?, household_id = ? WHERE id = ?',
            [name, email, finalHouseholdId, id]
        );

        if (existing[0].role === 'resident' && finalHouseholdId) {
            await db.query(
                'UPDATE households SET owner_name = ? WHERE id = ?',
                [name, finalHouseholdId]
            );
        }
        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'UPDATE_USER_INFO',
            table_affected: 'users',
            record_id: id,
            details: `Admin updated user ${existing[0].name}'s info`,
            ip_address: req.ip
        });

        res.json({ message: 'User updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateFlagStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const currentUser = req.user;

    try {
        await db.query(`Update recurring_flags set status = ? where id = ?`, [status, id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'UPDATE_FLAG_STATUS',
            table_affected: 'recurring_flags',
            record_id: id,
            details: `Flag status updated to ${status}`,
            ip_address: req.ip
        });

        res.json({ message: 'Flag status updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[user]] = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.household_id, u.created_at,
            h.household_number, h.purok, h.address
            FROM users u LEFT JOIN households h ON u.household_id = h.id
            WHERE u.id = ?`,
            [id]
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let reports = [];
        let tdsReadings = [];

        if (user.role === 'resident' && user.household_id) {
            [reports] = await db.query(
                'SELECT * FROM reports WHERE household_id = ? ORDER BY created_at DESC',
                [user.household_id]
            );
        }

        if (user.role === 'staff' || user.role === 'admin') {
            [tdsReadings] = await db.query(
                `SELECT tds_readings.*, households.household_number, households.purok
                FROM tds_readings JOIN households ON tds_readings.household_id = households.id
                WHERE tds_readings.staff_id = ? ORDER BY recorded_at DESC LIMIT 10`,
                [id]
            );
        }

        const [recentActivity] = await db.query(
            'SELECT * FROM audit_trail WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [id]
        );

        res.json({ ...user, reports, tds_readings: tdsReadings, recent_activity: recentActivity });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getAuditLogById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[log]] = await db.query('SELECT * FROM audit_trail WHERE id = ?', [id]);

        if (!log) {
            return res.status(404).json({ message: 'Audit log entry not found' });
        }

        let otherActivity = [];
        if (log.user_id) {
            [otherActivity] = await db.query(
                'SELECT * FROM audit_trail WHERE user_id = ? AND id != ? ORDER BY created_at DESC LIMIT 10',
                [log.user_id, id]
            );
        }

        res.json({ ...log, other_activity: otherActivity });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};