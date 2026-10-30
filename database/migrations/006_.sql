
CREATE TABLE account_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(250) NOT NULL,
    email VARCHAR(250) NOT NULL,
    household_number VARCHAR(50) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    address VARCHAR(250) NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(250) NULL,
    reviewed_at DATETIME NULL,
    reject_code VARCHAR(30) NULL,
    reject_reason VARCHAR(500) NULL,
    created_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_account_requests_status (status),
    INDEX idx_account_requests_email (email)
);
