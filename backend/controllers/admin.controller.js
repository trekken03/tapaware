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
    const { name, email, household_id } = req.body;
    const currentUser = req.user;

    try {
        const [existing] = await db.query(`Select * from users where id = ?`, [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.query(
            `Update users set name = ?, email = ?, household_id = ? where id = ?`,
            [name, email, household_id || null, id]
        );

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'UPDATE_USER_INFO',
            table_affected: 'users',
            record_id: id,
            details: `Updated info for user ${existing[0].name} -> name: ${name}, email: ${email}`,
            ip_address: req.ip
        });

        res.json({ message: 'User info updated successfully' });
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