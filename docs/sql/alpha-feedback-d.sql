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
