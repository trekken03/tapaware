-- Adds soft-delete/archive support (deleted_at) to households, users, tds_readings, and reports.
-- Run this against an existing database that predates schema.sql's deleted_at columns.
-- Safe to re-run: each ALTER is guarded, but MySQL doesn't support IF NOT EXISTS on ADD COLUMN
-- before 8.0.29, so only run this once per database.

USE tapaware;

ALTER TABLE households ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE tds_readings ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE reports ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
