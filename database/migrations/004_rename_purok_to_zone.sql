USE tapaware;

ALTER TABLE households
    CHANGE COLUMN purok zone VARCHAR(100) NOT NULL,
    RENAME INDEX unique_household_purok TO unique_household_zone;

ALTER TABLE concerns
    CHANGE COLUMN purok zone VARCHAR(100) NULL;

ALTER TABLE time_patterns
    CHANGE COLUMN purok zone VARCHAR(100) NOT NULL,
    RENAME INDEX idx_time_patterns_purok TO idx_time_patterns_zone;
