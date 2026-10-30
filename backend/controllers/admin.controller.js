const db = require('../models/db');
const auditLog = require('../utils/auditLogger');
const sendVerificationEmail = require('../utils/emailVerification');
const { getAttentionCounts } = require('../utils/attentionCounts');

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(`Select u.id,u.name,u.email,u.role,u.household_id,u.email_verified,
            h.household_number,h.zone,h.address,u.created_at from users u left join households h on u.household_id = h.id
            where u.deleted_at is null
            order by u.created_at desc`);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resendVerification = async (req, res) => {
    const { id } = req.params;

    try {
        const [users] = await db.query(
            'SELECT id, name, email, role, email_verified FROM users WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        if (Number(user.email_verified) === 1) {
            return res.status(400).json({ message: 'This email is already verified.' });
        }

        const [recentTokens] = await db.query(
            'SELECT created_at FROM email_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [id]
        );
        if (recentTokens.length > 0 && Date.now() - new Date(recentTokens[0].created_at).getTime() < 60 * 1000) {
            return res.status(400).json({ message: 'A verification email was sent recently. Please wait 60 seconds before resending.' });
        }

        const { emailSent } = await sendVerificationEmail(user);
        await auditLog({
            user_id: req.user.id,
            user_name: req.user.name,
            user_role: req.user.role,
            action: 'RESEND_VERIFICATION',
            table_affected: 'users',
            record_id: user.id,
            ip_address: req.ip
        });

        return res.json({
            message: emailSent ? 'Verification email sent successfully.' : 'The verification email could not be sent. Please try again later.',
            emailSent
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.getArchivedUsers = async (req, res) => {
    try {
        const [rows] = await db.query(`Select u.id,u.name,u.email,u.role,u.household_id,u.deleted_at,
            h.household_number,h.zone,u.created_at from users u left join households h on u.household_id = h.id
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
    const { name, email, household_number, zone } = req.body;
    const currentUser = req.user;

    try {
        const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const candidateEmail = typeof email === 'string' ? email : existing[0].email;
        const emailChanged = candidateEmail.trim().toLowerCase() !== String(existing[0].email).trim().toLowerCase();
        const emailToStore = emailChanged ? candidateEmail.trim() : candidateEmail;

        const [emailCheck] = await db.query('SELECT * FROM users WHERE email = ? AND id != ?', [emailToStore, id]);
        if (emailCheck.length > 0) {
            return res.status(400).json({ message: 'Email already in use by another account' });
        }

        let finalHouseholdId = existing[0].household_id;

        if (household_number && zone) {
            const houseNum = parseInt(household_number, 10);
            const zoneNum = parseInt(zone, 10);

            const [existingHousehold] = await db.query(
                'SELECT id FROM households WHERE household_number = ? AND zone = ?',
                [houseNum, zoneNum]
            );

            if (existingHousehold.length > 0) {
                finalHouseholdId = existingHousehold[0].id;

                const [existingResident] = await db.query(
                    `SELECT id FROM users WHERE household_id = ? AND role = 'resident' AND id != ?`,
                    [finalHouseholdId, id]
                );

                if (existingResident.length > 0) {
                    return res.status(400).json({
                        message: `Household #${houseNum} in Zone ${zoneNum} already has a resident account linked to it. Please use a different household number or zone.`
                    });
                }
            } else {
                const [newHousehold] = await db.query(
                    'INSERT INTO households(household_number, zone, owner_name, address) VALUES (?,?,?,?)',
                    [houseNum, zoneNum, name, '']
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
    const { name, email, household_number, zone, transfer_data, address } = req.body;
    const currentUser = req.user;
    const addressProvided = Object.prototype.hasOwnProperty.call(req.body, 'address');
    const normalizedAddress = typeof address === 'string' ? address.trim() : '';

    if (addressProvided && (typeof address !== 'string' || normalizedAddress.length > 250)) {
        return res.status(400).json({ message: 'Address must be 250 characters or fewer' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const emailToStore = String(email || '').trim();
        const emailChanged = emailToStore.toLowerCase() !== String(existing[0].email || '').trim().toLowerCase();

        const [emailCheck] = await db.query('SELECT * FROM users WHERE email = ? AND id != ?', [emailToStore, id]);
        if (emailCheck.length > 0) {
            return res.status(400).json({ message: 'Email already in use by another account' });
        }

        const oldHouseholdId = existing[0].household_id;
        let oldHousehold = null;
        if (oldHouseholdId) {
            const [[household]] = await db.query('SELECT * FROM households WHERE id = ?', [oldHouseholdId]);
            oldHousehold = household || null;
        }

        let finalHouseholdId = oldHousehold ? oldHouseholdId : null;
        const incomingHouseholdNumber = household_number ? String(household_number).trim() : '';
        const incomingZone = zone ? String(zone).trim() : '';
        const householdPairProvided = incomingHouseholdNumber !== '' && incomingZone !== '';
        const householdPairChanged = householdPairProvided && (
            !oldHousehold ||
            incomingHouseholdNumber !== String(oldHousehold.household_number).trim() ||
            incomingZone !== String(oldHousehold.zone).trim()
        );

        if (householdPairChanged) {
            const [[targetHousehold]] = await db.query(
                'SELECT * FROM households WHERE household_number = ? AND zone = ?',
                [incomingHouseholdNumber, incomingZone]
            );

            if (targetHousehold?.deleted_at) {
                return res.status(400).json({ message: 'That household was archived. Restore it from the Archive first.' });
            }

            if (targetHousehold) {
                const [existingResident] = await db.query(
                    `SELECT id FROM users WHERE household_id = ? AND role = 'resident' AND deleted_at IS NULL AND id != ?`,
                    [targetHousehold.id, id]
                );

                if (existingResident.length > 0) {
                    return res.status(400).json({
                        message: `Household #${incomingHouseholdNumber} in Zone ${incomingZone} already has a resident account linked to it. Please use a different household number or zone.`
                    });
                }

                finalHouseholdId = targetHousehold.id;
            } else if (transfer_data && oldHousehold) {
                const [[otherUsers]] = await db.query(
                    'SELECT COUNT(*) AS count FROM users WHERE household_id = ? AND deleted_at IS NULL AND id != ?',
                    [oldHouseholdId, id]
                );

                if (Number(otherUsers.count) === 0) {
                    await db.query(
                        'UPDATE households SET household_number = ?, zone = ? WHERE id = ?',
                        [incomingHouseholdNumber, incomingZone, oldHouseholdId]
                    );
                    finalHouseholdId = oldHouseholdId;
                    await auditLog({
                        user_id: currentUser.id,
                        user_name: currentUser.name,
                        user_role: currentUser.role,
                        action: 'UPDATE_HOUSEHOLD',
                        table_affected: 'households',
                        record_id: oldHouseholdId,
                        details: `Corrected household from #${oldHousehold.household_number} zone ${oldHousehold.zone} to #${incomingHouseholdNumber} zone ${incomingZone}`,
                        ip_address: req.ip
                    });
                } else {
                    const [newHousehold] = await db.query(
                        'INSERT INTO households(household_number, zone, owner_name, address) VALUES (?,?,?,?)',
                        [incomingHouseholdNumber, incomingZone, name, '']
                    );
                    finalHouseholdId = newHousehold.insertId;
                }
            } else {
                const [newHousehold] = await db.query(
                    'INSERT INTO households(household_number, zone, owner_name, address) VALUES (?,?,?,?)',
                    [incomingHouseholdNumber, incomingZone, name, '']
                );
                finalHouseholdId = newHousehold.insertId;
            }
        }

        const userUpdateQuery = emailChanged
            ? 'UPDATE users SET name = ?, email = ?, email_verified = 0, household_id = ? WHERE id = ?'
            : 'UPDATE users SET name = ?, email = ?, household_id = ? WHERE id = ?';
        await db.query(userUpdateQuery, [
            name,
            emailToStore,
            finalHouseholdId,
            id
        ]);

        if (existing[0].role === 'resident' && finalHouseholdId) {
            await db.query(
                'UPDATE households SET owner_name = ?, address = COALESCE(?, address) WHERE id = ?',
                [name, addressProvided ? normalizedAddress : null, finalHouseholdId]
            );
        }

        // Household changed and admin explicitly chose "same household, fix a data entry error" —
        // move the old household's history over to the corrected one.
        const householdActuallyChanged = Boolean(oldHouseholdId && finalHouseholdId && oldHouseholdId !== finalHouseholdId);

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

        if (oldHouseholdId && !oldHousehold?.deleted_at && finalHouseholdId && oldHouseholdId !== finalHouseholdId) {
            const [[activeUsers]] = await db.query(
                'SELECT COUNT(*) AS count FROM users WHERE household_id = ? AND deleted_at IS NULL',
                [oldHouseholdId]
            );
            const [[activeReports]] = await db.query(
                'SELECT COUNT(*) AS count FROM reports WHERE household_id = ? AND deleted_at IS NULL',
                [oldHouseholdId]
            );
            const [[activeReadings]] = await db.query(
                'SELECT COUNT(*) AS count FROM tds_readings WHERE household_id = ? AND deleted_at IS NULL',
                [oldHouseholdId]
            );
            const [[remainingFlags]] = await db.query(
                'SELECT COUNT(*) AS count FROM recurring_flags WHERE household_id = ?',
                [oldHouseholdId]
            );

            if (
                Number(activeUsers.count) === 0 &&
                Number(activeReports.count) === 0 &&
                Number(activeReadings.count) === 0 &&
                Number(remainingFlags.count) === 0
            ) {
                const archivedAt = new Date();
                await db.query('UPDATE households SET deleted_at = ? WHERE id = ?', [archivedAt, oldHouseholdId]);
                await db.query(
                    'UPDATE reports SET deleted_at = ? WHERE household_id = ? AND deleted_at IS NULL',
                    [archivedAt, oldHouseholdId]
                );
                await db.query(
                    'UPDATE tds_readings SET deleted_at = ? WHERE household_id = ? AND deleted_at IS NULL',
                    [archivedAt, oldHouseholdId]
                );
                await auditLog({
                    user_id: currentUser.id,
                    user_name: currentUser.name,
                    user_role: currentUser.role,
                    action: 'ARCHIVE_HOUSEHOLD',
                    table_affected: 'households',
                    record_id: oldHouseholdId,
                    details: `Automatically archived empty household #${oldHousehold?.household_number} - ${oldHousehold?.owner_name}, zone ${oldHousehold?.zone}`,
                    ip_address: req.ip
                });
            }
        }

        let emailSent = null;
        let emailMessage = null;
        if (emailChanged) {
            const verificationResult = await sendVerificationEmail(
                { id, name, email: emailToStore, role: existing[0].role },
                undefined,
                'email_changed'
            );
            emailSent = verificationResult.emailSent;
            emailMessage = emailSent
                ? 'A verification link was sent to the new email address.'
                : 'The email was changed, but the verification email could not be sent. Use Resend verification from the Admin Panel.';

            await auditLog({
                user_id: currentUser.id,
                user_name: currentUser.name,
                user_role: currentUser.role,
                action: 'CHANGE_USER_EMAIL',
                table_affected: 'users',
                record_id: id,
                details: `Changed user email from ${existing[0].email} to ${emailToStore}`,
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

        res.json({ message: 'User updated successfully', emailSent, emailMessage });
    }
    catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'That household number and purok already exist.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateFlagStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const currentUser = req.user;

    if (!status || !['active', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
    }

    try {
        const [result] = await db.query(
            `UPDATE recurring_flags
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Flag not found' });
        }

        if (status === 'resolved') {
            const [[flag]] = await db.query(
                `SELECT household_id, issue_type
                 FROM recurring_flags
                 WHERE id = ?`,
                [id]
            );

            if (flag) {
                await db.query(
                    `UPDATE reports
                     SET status = 'resolved'
                     WHERE household_id = ?
                       AND issue_type = ?
                       AND deleted_at IS NULL
                       AND status != 'resolved'`,
                    [flag.household_id, flag.issue_type]
                );
            }
        }

        await auditLog({
            user_id: currentUser?.id ?? null,
            user_name: currentUser?.name ?? 'Unknown',
            user_role: currentUser?.role ?? 'admin',
            action: 'UPDATE_FLAG_STATUS',
            table_affected: 'recurring_flags',
            record_id: id,
            details: `Flag status updated to ${status}`,
            ip_address: req.ip
        });

        return res.json({ message: 'Flag status updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const [[user]] = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.household_id, u.created_at,
            h.household_number, h.zone, h.address
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
                'SELECT * FROM reports WHERE household_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
                [user.household_id]
            );
        }

        if (user.role === 'staff' || user.role === 'admin') {
            [tdsReadings] = await db.query(
                `SELECT tds_readings.*, households.household_number, households.zone
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
            households.zone,
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
            WHERE reports.household_id = ? AND reports.issue_type = ? and reports.deleted_at is null
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

exports.getAttentionCounts = async (req, res) => {
    try {
        res.json(await getAttentionCounts());
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};