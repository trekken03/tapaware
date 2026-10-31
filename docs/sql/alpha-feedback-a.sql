-- Alpha feedback A: run once on the production database BEFORE merging.
-- Only Task 4 ("Contact an admin" requests) needs a schema change.

CREATE TABLE admin_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    request_type ENUM('change_email','change_household','correct_name','other') NOT NULL,
    requested_value VARCHAR(255) NULL,
    reason TEXT NOT NULL,
    status ENUM('pending','done','rejected') NOT NULL DEFAULT 'pending',
    admin_note TEXT NULL,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE so permanently deleting an archived user is not blocked by their requests.
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_admin_requests_status (status),
    INDEX idx_admin_requests_user_type_status (user_id, request_type, status)
);
