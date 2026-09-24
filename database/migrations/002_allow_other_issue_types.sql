-- Allows the report category 'other' to be tracked in recurring flags and time patterns.
-- Run this for existing databases created from older schema versions.

USE tapaware;

ALTER TABLE recurring_flags
    MODIFY COLUMN issue_type ENUM('odor','discoloration','low pressure','cleanliness','broken hardware','other') NOT NULL;

ALTER TABLE time_patterns
    MODIFY COLUMN issue_type ENUM('odor','discoloration','low pressure','cleanliness','broken hardware','other') NOT NULL;
