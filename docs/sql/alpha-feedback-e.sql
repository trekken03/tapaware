-- Alpha feedback E: run once on the production database BEFORE merging.
-- Requires alpha-feedback-b.sql (latitude/longitude and resolution_lat/lng).
-- GPS accuracy in whole metres, saved only together with a location.
-- Until this runs, readings and resolutions still save; only the accuracy is skipped.

ALTER TABLE tds_readings ADD COLUMN location_accuracy INT NULL;

ALTER TABLE reports ADD COLUMN resolution_accuracy INT NULL;
