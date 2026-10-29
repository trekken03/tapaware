-- 1. Before deploying:
ALTER TABLE reports ADD COLUMN occurred_on DATE NULL;
-- 2. After deploying and testing:
ALTER TABLE users DROP COLUMN contact_number;
