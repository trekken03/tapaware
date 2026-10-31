create database tapaware;

use tapaware;


create table households(
    id int auto_increment primary key,
    household_number varchar(50) not null,
    zone varchar(100) not null,
    owner_name varchar(250) not null,
    address varchar(250) not null,
    created_at timestamp default current_timestamp,
    deleted_at timestamp null default null,
    unique key unique_household_zone (household_number, zone)
);

create table users(
    id int auto_increment primary key,
    name varchar(250) not null,
    email varchar(250) not null unique,
    role enum('resident','staff','admin') not null default 'resident',
    household_id int,
    password varchar(255) not null,
    email_verified TINYINT(1) NOT NULL DEFAULT 1,
    created_at timestamp default current_timestamp,
    deleted_at timestamp null default null,
    foreign key(household_id) references households(id) on delete set null,
    index idx_users_household_id (household_id),
    index idx_users_role (role)
);

CREATE TABLE email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_email_verifications_user (user_id)
);

create table tds_readings(
    id int auto_increment primary key,
    household_id int not null,
    staff_id int not null,
    tds_value decimal(10,2) not null default 0,
    notes text,
    recorded_at timestamp default current_timestamp,
    deleted_at timestamp null default null,
    measured_at datetime null,
    latitude decimal(10,7) null,
    longitude decimal(10,7) null,
    foreign key(household_id) references households(id) on delete cascade,
    foreign key(staff_id) references users(id),
    index idx_tds_household_recorded (household_id, recorded_at),
    index idx_tds_staff_id (staff_id)
);

create table reports(
    id int auto_increment primary key,
    household_id int not null,
    user_id int not null,
    issue_type enum('odor','discoloration','low pressure','cleanliness','broken hardware','other') not null,
    other_issue varchar(255) null,
    description text,
    status enum('pending','investigating','resolved') not null default 'pending',
    created_at timestamp default current_timestamp,
    occurred_at TIME NOT NULL DEFAULT (CURRENT_TIME),
    occurred_on DATE NULL,
    deleted_at timestamp null default null,
    scheduled_date DATE NULL,
    scheduled_from TIME NULL,
    scheduled_to TIME NULL,
    investigating_at DATETIME NULL,
    resolution_notes TEXT NULL,
    resolved_by INT NULL,
    resolved_at DATETIME NULL,
    resolution_lat DECIMAL(10,7) NULL,
    resolution_lng DECIMAL(10,7) NULL,
    foreign key(household_id) references households(id) on delete cascade,
    foreign key(user_id) references users(id),
    constraint fk_reports_resolved_by foreign key(resolved_by) references users(id) on delete set null,
    index idx_reports_household_created (household_id, created_at),
    index idx_reports_user_id (user_id),
    index idx_reports_status (status),
    index idx_reports_issue (issue_type)
);


CREATE TABLE recurring_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id INT NOT NULL,
    issue_type ENUM('odor','discoloration','low pressure','cleanliness','broken hardware','other') NOT NULL,
    times_reported INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active','resolved') NOT NULL DEFAULT 'active',
    UNIQUE KEY unique_flag_household_issue (household_id, issue_type),
    KEY idx_recurring_status (status),
    CONSTRAINT fk_recurring_flags_household
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);
create table audit_trail(
    id int auto_increment primary key,
    user_id int,
    user_name varchar(250) not null,
    user_role enum('resident','staff','admin') not null,
    action varchar(255) not null,
    table_affected varchar(100) not null,
    record_id int,
    details text,
    ip_address varchar(45),
    created_at timestamp default current_timestamp,
    foreign key(user_id) references users(id) on delete set null,
    index idx_audit_user_created (user_id, created_at),
    index idx_audit_created_at (created_at)
);

create table password_resets(
    id int auto_increment primary key,
    user_id int not null,
    token varchar(255) not null unique,
    expires_at timestamp not null,
    used boolean not null default false,
    created_at timestamp default current_timestamp,
    foreign key(user_id) references users(id) on delete cascade,
    index idx_password_resets_token (token)
);

create table concerns(
    id int auto_increment primary key,
    name varchar(250),
    contact_info varchar(250),
    zone varchar(100),
    message text not null,
    status enum('new','reviewed') not null default 'new',
    reply_message text,
    replied_by varchar(250),
    replied_at timestamp null,
    created_at timestamp default current_timestamp,
    deleted_at timestamp null default null,
    index idx_concerns_status (status)
);

CREATE TABLE account_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(250) NOT NULL,
    email VARCHAR(250) NOT NULL,
    household_number VARCHAR(50) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    address VARCHAR(250) NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(250) NULL,
    reviewed_at DATETIME NULL,
    reject_code VARCHAR(30) NULL,
    reject_reason VARCHAR(500) NULL,
    created_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_snapshot TEXT NULL,
    FOREIGN KEY (created_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_account_requests_status (status),
    INDEX idx_account_requests_email (email)
);

CREATE TABLE admin_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    request_type ENUM('change_email','change_household','correct_name','other') NOT NULL,
    requested_value VARCHAR(255) NULL,
    reason TEXT NOT NULL,
    status ENUM('pending','done','rejected') NOT NULL DEFAULT 'pending',
    admin_note TEXT NULL,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_admin_requests_status (status),
    INDEX idx_admin_requests_user_type_status (user_id, request_type, status)
);


CREATE TABLE time_patterns(
    id int auto_increment primary key,
    zone varchar(100) not null,
    issue_type enum('odor','discoloration','low pressure','cleanliness','broken hardware','other') not null,
    time_bucket enum('morning','afternoon','evening','night') not null,
    times_reported int not null default 0,
    last_reported_at timestamp not null default current_timestamp,
    unique key unique_time_pattern (zone, issue_type, time_bucket),
    index idx_time_patterns_zone (zone)
);