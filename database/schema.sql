create database tapaware;

use tapaware;


create table households(
    id int auto_increment primary key,
    household_number varchar(50) not null,
    purok varchar(100) not null,
    owner_name varchar(250) not null,
    address varchar(250) not null,
    created_at timestamp default current_timestamp,
    unique key unique_household_purok (household_number, purok)
);

create table users(
    id int auto_increment primary key,
    name varchar(250) not null,
    email varchar(250) not null unique,
    role enum('resident','staff','admin') not null default 'resident',
    household_id int,
    password varchar(255) not null,
    created_at timestamp default current_timestamp,
    foreign key(household_id) references households(id) on delete set null,
    index idx_users_household_id (household_id),
    index idx_users_role (role)
);


create table tds_readings(
    id int auto_increment primary key,
    household_id int not null,
    staff_id int not null,
    tds_value decimal(10,2) not null default 0,
    notes text,
    recorded_at timestamp default current_timestamp,
    foreign key(household_id) references households(id) on delete cascade,
    foreign key(staff_id) references users(id),
    index idx_tds_household_recorded (household_id, recorded_at),
    index idx_tds_staff_id (staff_id)
);

create table reports(
    id int auto_increment primary key,
    household_id int not null,
    user_id int not null,
    issue_type enum('odor','discoloration','low pressure','cleanliness','broken hardware') not null,
    description text,
    status enum('pending','investigating','resolved') not null default 'pending',
    created_at timestamp default current_timestamp,
    occurred_at TIME NOT NULL DEFAULT (CURRENT_TIME),
    foreign key(household_id) references households(id) on delete cascade,
    foreign key(user_id) references users(id),
    index idx_reports_household_created (household_id, created_at),
    index idx_reports_user_id (user_id),
    index idx_reports_status (status),
    index idx_reports_issue (issue_type)
);

create table recurring_flags(
    id int auto_increment primary key,
    household_id int not null,
    issue_type enum('odor','discoloration','low pressure','cleanliness','broken hardware'),
    times_reported int not null default 0,
    created_at timestamp default current_timestamp,
    last_reported_at timestamp not null default current_timestamp,
    status enum('active','resolved') not null default 'active',
    foreign key(household_id) references households(id) on delete cascade,
    unique key unique_active_flag (household_id, issue_type, status),
    index idx_recurring_status (status)
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
    purok varchar(100),
    message text not null,
    status enum('new','reviewed') not null default 'new',
    reply_message text,
    replied_by varchar(250),
    replied_at timestamp null,
    created_at timestamp default current_timestamp,
    index idx_concerns_status (status)
);


CREATE TABLE time_patterns(
    id int auto_increment primary key,
    purok varchar(100) not null,
    issue_type enum('odor','discoloration','low pressure','cleanliness','broken hardware') not null,
    time_bucket enum('morning','afternoon','evening','night') not null,
    times_reported int not null default 0,
    last_reported_at timestamp not null default current_timestamp,
    unique key unique_time_pattern (purok, issue_type, time_bucket),
    index idx_time_patterns_purok (purok)
);