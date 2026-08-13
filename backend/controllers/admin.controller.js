const db = require('../models/db');
const auditLog = require('../utils/auditLogger');

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(`Select u.id,u.name,u.email,u.role,u.household_id,
            h.household_number,h.purok,u.created_at from users u left join households h on u.household_id = h.id
            where u.deleted_at is null
            order by u.created_at desc`);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getArchivedUsers = async (req, res) => {
    try {
        const [rows] = await db.query(`Select u.id,u.name,u.email,u.role,u.household_id,u.deleted_at,
            h.household_number,h.purok,u.created_at from users u left join households h on u.household_id = h.id
            where u.deleted_at is not null
            order by u.deleted_at desc`);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        if (Number(id) === currentUser.id) {
            return res.status(400).json({ message: 'You cannot archive your own account' });
        }

        const [user] = await db.query(`Select * from users where id = ? and deleted_at is null`, [id]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.query(`Update users set deleted_at = NOW() where id = ?`, [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'ARCHIVE_USER',
            table_affected: 'users',
            record_id: id,
            details: `Archived user ${user[0].name} (${user[0].email})`,
            ip_address: req.ip
        });
        res.json({ message: 'User archived successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.restoreUser = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        const [user] = await db.query(`Select * from users where id = ? and deleted_at is not null`, [id]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'Archived user not found' });
        }

        await db.query(`Update users set deleted_at = NULL where id = ?`, [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'RESTORE_USER',
            table_affected: 'users',
            record_id: id,
            details: `Restored user ${user[0].name} (${user[0].email})`,
            ip_address: req.ip
        });
        res.json({ message: 'User restored successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Hard delete — the row is removed from the database and cannot be restored.
// Only allowed on users that are already archived. Reports (user_id) and TDS
// readings (staff_id) reference users without ON DELETE, so a user who left any
// of those behind is refused instead of taking their history down with them.
exports.permanentDeleteUser = async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    try {
        if (Number(id) === currentUser.id) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const [user] = await db.query(`Select * from users where id = ? and deleted_at is not null`, [id]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'Archived user not found' });
        }

        const [[{ report_count }]] = await db.query('SELECT COUNT(*) as report_count FROM reports WHERE user_id = ?', [id]);
        const [[{ reading_count }]] = await db.query('SELECT COUNT(*) as reading_count FROM tds_readings WHERE staff_id = ?', [id]);

        if (report_count > 0 || reading_count > 0) {
            return res.status(409).json({
                message: `This user still has ${report_count} report(s) and ${reading_count} TDS reading(s) on record, so the account cannot be permanently deleted. It stays archived instead.`
            });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);

        await auditLog({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            action: 'PERMANENT_DELETE_USER',
            table_affected: 'users',
            record_id: id,
            details: `Permanently deleted user ${user[0].name} (${user[0].email})`,
            ip_address: req.ip
        });

        res.json({ message: 'User permanently deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getAuditTrail = async (req, res) => {
    try {
        const [rows] = await db.query(`Select * from audit_trail order by created_at desc limit 100`);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAuditTrailByUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`Select * from audit_trail where user_id = ? order by created_at desc`, [id]);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUserInfo = async (req, res) => {
    const { id } = req.params;
    const { name, email, household_number, purok, transfer_data } = req.body;
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

        const oldHouseholdId = existing[0].household_id;
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

        // Household changed and admin explicitly chose "same household, fix a data entry error" —
        // move the old household's history over to the corrected one.
        const householdActuallyChanged = oldHouseholdId && finalHouseholdId && oldHouseholdId !== finalHouseholdId;

        if (transfer_data && householdActuallyChanged) {
            await db.query(
                'UPDATE reports SET household_id = ? WHERE household_id = ?',
                [finalHouseholdId, oldHouseholdId]
            );
            await db.query(
                'UPDATE tds_readings SET household_id = ? WHERE household_id = ?',
                [finalHouseholdId, oldHouseholdId]
            );

            // recurring_flags has a unique (household_id, issue_type, status) constraint —
            // if the target household already has a matching active flag, merge counts
            // instead of moving the row, to avoid a constraint violation.
            const [oldFlags] = await db.query(
                'SELECT * FROM recurring_flags WHERE household_id = ?',
                [oldHouseholdId]
            );

            for (const flag of oldFlags) {
                const [[conflict]] = await db.query(
                    'SELECT * FROM recurring_flags WHERE household_id = ? AND issue_type = ? AND status = ?',
                    [finalHouseholdId, flag.issue_type, flag.status]
                );

                if (conflict) {
                    await db.query(
                        'UPDATE recurring_flags SET times_reported = times_reported + ?, last_reported_at = GREATEST(last_reported_at, ?) WHERE id = ?',
                        [flag.times_reported, flag.last_reported_at, conflict.id]
                    );
                    await db.query('DELETE FROM recurring_flags WHERE id = ?', [flag.id]);
                } else {
                    await db.query(
                        'UPDATE recurring_flags SET household_id = ? WHERE id = ?',
                        [finalHouseholdId, flag.id]
                    );
                }
            }

            await auditLog({
                user_id: currentUser.id,
                user_name: currentUser.name,
                user_role: currentUser.role,
                action: 'TRANSFER_HOUSEHOLD_DATA',
                table_affected: 'households',
                record_id: finalHouseholdId,
                details: `Transferred reports, TDS readings, and flags from household #${oldHouseholdId} to #${finalHouseholdId} for user ${existing[0].name}`,
                ip_address: req.ip
            });
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[user]] = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.household_id, u.created_at,
            h.household_number, h.purok, h.address
            FROM users u LEFT JOIN households h ON u.household_id = h.id
            WHERE u.id = ? AND u.deleted_at IS NULL`,
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getFlagById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[flag]] = await db.query(
            `SELECT recurring_flags.*,
            households.household_number,
            households.owner_name,
            households.purok,
            households.address
            FROM recurring_flags JOIN households ON recurring_flags.household_id = households.id
            WHERE recurring_flags.id = ?`,
            [id]
        );

        if (!flag) {
            return res.status(404).json({ message: 'Flag not found' });
        }

        const [contributingReports] = await db.query(
            `SELECT reports.*, users.name as reported_by
            FROM reports JOIN users ON reports.user_id = users.id
            WHERE reports.household_id = ? AND reports.issue_type = ?
            ORDER BY reports.created_at DESC`,
            [flag.household_id, flag.issue_type]
        );

        res.json({ ...flag, contributing_reports: contributingReports });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};