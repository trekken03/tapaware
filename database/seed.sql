-- =========================================================
-- TapAware seed data — Suits-themed test residents
-- Safe to re-run: clears existing data first, resets IDs.
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM audit_trail;
DELETE FROM password_resets;
DELETE FROM recurring_flags;
DELETE FROM reports;
DELETE FROM tds_readings;
DELETE FROM concerns;
DELETE FROM users;
DELETE FROM households;

ALTER TABLE households AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE tds_readings AUTO_INCREMENT = 1;
ALTER TABLE reports AUTO_INCREMENT = 1;
ALTER TABLE recurring_flags AUTO_INCREMENT = 1;
ALTER TABLE concerns AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- TEST LOGIN CREDENTIALS
-- Admin:    admin@tapaware.com     / admin123
-- Staff:    staff@tapaware.com / staff123
-- Resident: resident@tapaware.com / resident123  
-- (any resident below, password:Suits@123 )
-- =========================================================

-- ---------------------------------------------------------
-- Households (ids 1-20, one per resident, puroks 1-7)
-- ---------------------------------------------------------
INSERT INTO households (household_number, purok, owner_name, address) VALUES
('1',  '1', 'Mike Ross',          'don jose st'),
('2',  '2', 'Rachel Zane',        'don alfredo st'),
('3',  '3', 'Donna Paulsen',      'don leo st'),
('4',  '4', 'Louis Litt',         'don pedro st'),
('5',  '5', 'Jessica Pearson',    'don miguel st'),
('6',  '6', 'Robert Zane',        'don ramon st'),
('7',  '7', 'Katrina Bennett',    'don carlos st'),
('8',  '1', 'Samantha Wheeler',   'don jose st'),
('9',  '2', 'Alex Williams',      'don alfredo st'),
('10', '3', 'Sheila Sazs',        'don leo st'),
('11', '4', 'Scottie McPherson',  'don pedro st'),
('12', '5', 'Tara Messer',        'don miguel st'),
('13', '6', 'Nathan Sydney',      'don ramon st'),
('14', '7', 'Sean Cahill',        'don carlos st'),
('15', '1', 'Charles Forstman',   'don jose st'),
('16', '2', 'Daniel Hardman',     'don alfredo st'),
('17', '3', 'Travis Tanner',      'don leo st'),
('18', '4', 'Esther Litt',        'don pedro st'),
('19', '5', 'Gretchen Bodinski',  'don miguel st'),
('20', '6', 'Benjamin Pierce',    'don ramon st');

-- ---------------------------------------------------------
-- Users: 1 admin, 1 staff, 20 residents (id = household_id + 2)
-- ---------------------------------------------------------
INSERT INTO users (name, email, role, household_id, password) VALUES
('Admin', 'admin@tapaware.com', 'admin', NULL,
 '$2a$12$H0l8x8060GMsBBW3XqnI6eHtA46Mc4cTlOuKcW24PSFVpZZHX7Vz.'),
('Harvey Specter', 'staff@tapaware.com', 'staff', NULL,
 '$2a$10$zouKN6GQSkHhRlabIAd6Ie93pWfLARVQAupfzhdCf261zWwEI/sky'),
('Mike Ross',         'resident@tapaware.com',         'resident', 1,  '$2a$10$KDvVO57AbbgWOdPEW9ejSuxCqqEynrCtPRVgs.tfZlxftfUA3TkkK'),
('Rachel Zane',       'rachel.zane@tapaware.com',       'resident', 2,  '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Donna Paulsen',     'donna.paulsen@tapaware.com',     'admin', 3,  '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Louis Litt',        'louis.litt@tapaware.com',        'resident', 4,  '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Jessica Pearson',   'jessica.pearson@tapaware.com',   'resident', 5,  '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Robert Zane',       'robert.zane@tapaware.com',       'resident', 6,  '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Katrina Bennett',   'katrina.bennett@tapaware.com',   'resident', 7,  '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Samantha Wheeler',  'samantha.wheeler@tapaware.com',  'resident', 8,  '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Alex Williams',     'alex.williams@tapaware.com',     'resident', 9,  '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Sheila Sazs',       'sheila.sazs@tapaware.com',       'resident', 10, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Scottie McPherson', 'scottie.mcpherson@tapaware.com', 'resident', 11, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Tara Messer',       'tara.messer@tapaware.com',       'resident', 12, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Nathan Sydney',     'nathan.sydney@tapaware.com',     'resident', 13, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Sean Cahill',       'sean.cahill@tapaware.com',       'resident', 14, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Charles Forstman',  'charles.forstman@tapaware.com',  'resident', 15, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Daniel Hardman',    'daniel.hardman@tapaware.com',    'resident', 16, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Travis Tanner',     'travis.tanner@tapaware.com',     'resident', 17, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Esther Litt',       'esther.litt@tapaware.com',       'resident', 18, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Gretchen Bodinski', 'gretchen.bodinski@tapaware.com', 'resident', 19, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2'),
('Benjamin Pierce',   'benjamin.pierce@tapaware.com',   'resident', 20, '$2b$10$WcOldrt1iHTyK.Vh1Oxot.Q4lVVwC0lPDYuAuLY0XlD95UuP/1fe2');

-- ---------------------------------------------------------
-- TDS readings — mix of safe / moderate / high, staff_id = 2 (Harvey)
-- ---------------------------------------------------------
INSERT INTO tds_readings (household_id, staff_id, tds_value, notes, recorded_at) VALUES
(1,  2, 120.0,  'clear water',            DATE_SUB(CURDATE(), INTERVAL 19 DAY)),
(2,  2, 670.0,  'slightly cloudy',        DATE_SUB(CURDATE(), INTERVAL 18 DAY)),
(3,  2, 1200.0, 'strong sediment',        DATE_SUB(CURDATE(), INTERVAL 17 DAY)),
(4,  2, 95.0,   'clear water',            DATE_SUB(CURDATE(), INTERVAL 16 DAY)),
(5,  2, 450.0,  'ok',                     DATE_SUB(CURDATE(), INTERVAL 15 DAY)),
(6,  2, 820.0,  'slightly discolored',    DATE_SUB(CURDATE(), INTERVAL 14 DAY)),
(7,  2, 1350.0, 'needs attention',        DATE_SUB(CURDATE(), INTERVAL 13 DAY)),
(8,  2, 210.0,  'clear water',            DATE_SUB(CURDATE(), INTERVAL 12 DAY)),
(9,  2, 990.0,  'borderline',             DATE_SUB(CURDATE(), INTERVAL 11 DAY)),
(10, 2, 1500.0, 'very cloudy',            DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
(11, 2, 60.0,   'clear water',            DATE_SUB(CURDATE(), INTERVAL 9 DAY)),
(12, 2, 530.0,  'ok',                     DATE_SUB(CURDATE(), INTERVAL 8 DAY)),
(13, 2, 1100.0, 'needs attention',        DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(14, 2, 180.0,  'clear water',            DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(15, 2, 760.0,  'slightly cloudy',        DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(16, 2, 1420.0, 'needs attention',        DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(17, 2, 340.0,  'clear water',            DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(18, 2, 610.0,  'ok',                     DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(19, 2, 1250.0, 'strong sediment',        DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(20, 2, 90.0,   'clear water',            CURDATE()),
-- extra historical readings for trend visibility on a couple households
(1,  2, 150.0,  'follow-up check',        DATE_SUB(CURDATE(), INTERVAL 9 DAY)),
(9,  2, 1050.0, 'follow-up check',        DATE_SUB(CURDATE(), INTERVAL 4 DAY));

-- ---------------------------------------------------------
-- Reports — includes two flag-triggering clusters (3+ same issue/household)
-- ---------------------------------------------------------
INSERT INTO reports (household_id, user_id, issue_type, description, status, created_at) VALUES
-- Household 1 (Mike Ross) — discoloration x3, triggers a flag
(1, 3, 'discoloration', 'Water looks yellowish in the morning', 'pending',       DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
(1, 3, 'discoloration', 'Still discolored, worse than before',  'investigating', DATE_SUB(CURDATE(), INTERVAL 12 DAY)),
(1, 3, 'discoloration', 'Cleared up after maintenance visit',   'resolved',      DATE_SUB(CURDATE(), INTERVAL 3 DAY)),

-- Household 9 (Alex Williams) — odor x4, triggers a flag
(9, 11, 'odor', 'Strong smell from the tap',        'pending',       DATE_SUB(CURDATE(), INTERVAL 18 DAY)),
(9, 11, 'odor', 'Smell is still there',              'pending',       DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
(9, 11, 'odor', 'Getting worse over the week',        'investigating', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(9, 11, 'odor', 'Slight improvement but still present','resolved',      DATE_SUB(CURDATE(), INTERVAL 1 DAY)),

-- Assorted single reports across other households/puroks for variety
(2,  4,  'low pressure',      'Barely any water pressure in the mornings', 'pending',       DATE_SUB(CURDATE(), INTERVAL 15 DAY)),
(4,  6,  'cleanliness',       'Sediment visible in the storage tank',      'investigating', DATE_SUB(CURDATE(), INTERVAL 14 DAY)),
(5,  7,  'broken hardware',   'Faucet handle is broken',                    'resolved',      DATE_SUB(CURDATE(), INTERVAL 13 DAY)),
(7,  9,  'odor',              'Faint smell after rain',                     'pending',       DATE_SUB(CURDATE(), INTERVAL 11 DAY)),
(8,  10, 'discoloration',     'Slight brown tint in the water',             'pending',       DATE_SUB(CURDATE(), INTERVAL 9 DAY)),
(13, 15, 'broken hardware',   'Pipe fitting is leaking',                    'investigating', DATE_SUB(CURDATE(), INTERVAL 8 DAY)),
(16, 18, 'odor',              'Slight odor noticed this week',              'pending',       DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(19, 21, 'discoloration',     'Resolved after flushing the line',           'resolved',      DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(20, 22, 'cleanliness',       'Debris found in the water container',        'pending',       DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(6,  8,  'low pressure',      'Pressure back to normal after fix',          'resolved',      DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(12, 14, 'cleanliness',       'Water looks a bit murky',                    'pending',       DATE_SUB(CURDATE(), INTERVAL 2 DAY));

-- ---------------------------------------------------------
-- Recurring flags — matching the two clusters above
-- ---------------------------------------------------------
INSERT INTO recurring_flags (household_id, issue_type, times_reported, last_reported_at, status) VALUES
(1, 'discoloration', 3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'active'),
(9, 'odor',          4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'active');

-- ---------------------------------------------------------
-- Public concerns — anonymous, phone-only, and already-replied examples
-- ---------------------------------------------------------
INSERT INTO concerns (name, contact_info, purok, message, status, reply_message, replied_by, replied_at, created_at) VALUES
(NULL, NULL, '3',
 'May amoy na masangsang ang tubig sa amin, sana matingnan po.',
 'new', NULL, NULL, NULL, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),

('Concerned Resident', 'concerned.resident@gmail.com', '5',
 'Nagbabago ang kulay ng tubig namin tuwing hapon, medyo dilaw.',
 'new', NULL, NULL, NULL, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),

('Juan Dela Cruz', '09171234567', '2',
 'Mababa ang tubig pressure sa aming lugar simula nung isang linggo.',
 'reviewed',
 'Salamat sa report, may naka-iskedyul nang inspeksyon sa Purok 2 sa susunod na linggo.',
 'Harvey Specter', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(CURDATE(), INTERVAL 6 DAY)),

('Maria Santos', 'maria.santos@gmail.com', '1',
 'Medyo maalikabok ang tubig namin ngayong linggo.',
 'reviewed',
 'Nakumpirma po namin ang isyu, ipapadala ang aming staff para tingnan ang inyong linya.',
 'Harvey Specter', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY));