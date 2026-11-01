-- Alpha feedback D: run once on the production database BEFORE merging.
-- Requires alpha-feedback-b.sql and alpha-feedback-c.sql (already run).

-- Task 1: residents can follow up on an open report.
CREATE TABLE report_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    user_id INT NOT NULL,
    message VARCHAR(200) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    KEY idx_followups_report (report_id)
);

-- Task 2: resident confirmation of a resolved report.
-- None of these columns exist before this file; nothing to skip.
ALTER TABLE reports
    ADD COLUMN resident_response ENUM('confirmed','not_resolved') NULL,
    ADD COLUMN resident_responded_at DATETIME NULL,
    ADD COLUMN resident_comment VARCHAR(500) NULL,
    ADD COLUMN reopened_at DATETIME NULL,
    ADD COLUMN reopen_count INT NOT NULL DEFAULT 0;
