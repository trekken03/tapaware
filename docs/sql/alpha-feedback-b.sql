-- Alpha feedback B: run once on the production database BEFORE merging.
-- None of these columns exist in schema.sql before this change set.
-- reports.status is already ENUM('pending','investigating','resolved'); no change needed.

-- Task 3: status flow New -> Investigating -> Resolved
ALTER TABLE reports
    ADD COLUMN scheduled_date DATE NULL,
    ADD COLUMN scheduled_from TIME NULL,
    ADD COLUMN scheduled_to TIME NULL,
    ADD COLUMN investigating_at DATETIME NULL,
    ADD COLUMN resolution_notes TEXT NULL,
    ADD COLUMN resolved_by INT NULL,
    ADD COLUMN resolved_at DATETIME NULL,
    ADD COLUMN resolution_lat DECIMAL(10,7) NULL,
    ADD COLUMN resolution_lng DECIMAL(10,7) NULL,
    -- SET NULL so permanently deleting an archived user is not blocked.
    ADD CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Task 4: TDS reading time and optional GPS.
-- measured_at is the barangay's local time (Asia/Manila). Older readings keep it NULL
-- and the app shows their recorded_at instead.
ALTER TABLE tds_readings
    ADD COLUMN measured_at DATETIME NULL,
    ADD COLUMN latitude DECIMAL(10,7) NULL,
    ADD COLUMN longitude DECIMAL(10,7) NULL;
