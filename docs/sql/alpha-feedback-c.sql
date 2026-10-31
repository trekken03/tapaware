-- Alpha feedback C: run once on the production database BEFORE merging.
-- Requires alpha-feedback-b.sql (already run). The column does not exist before this.

-- Optional TDS reading taken when a report is marked Resolved.
ALTER TABLE reports ADD COLUMN resolution_tds_value DECIMAL(6,2) NULL;
