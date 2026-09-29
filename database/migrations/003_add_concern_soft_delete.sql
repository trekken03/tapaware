-- Adds soft-delete/archive support to concerns.
-- Run this against existing databases before using concern archiving.

USE tapaware;

ALTER TABLE concerns ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;