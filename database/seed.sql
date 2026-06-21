
insert into households(household_number,purok,owner_name,address)
values
('20','2','Teresita Facundo','don jose st'),
('21','1','Tess Raymundo','don alfredo st'),
('11','1','Bless Raymundo','don alfredo st'),
('25','3','Leopoldo Don','don leo st');

insert into users(name,email,role,household_id,password)
values
-- Temporary seeded admin login: admin@tapaware.com / Admin@12345
-- Change this password after first login.
('Admin','admin@tapaware.com','admin',null,'$2a$10$suK.AJKQ9ULRPn/pMhdXNuYNfKf10LV7x3ZJiqbwrn28vFZW162Di'),
('Harvey Specter','staff1@gmail.com','staff',null,'hashed_password'),
('Daniel Hardman','resident@gmail.com','resident',2,'hashed_password'),
('Mike Ross','ross@gmail.com','resident',1,'hashed_password');


insert into tds_readings(household_id,staff_id,tds_value,notes)
values
(1,2,86.0,'clear water'),
(2,2,134.2,'slightly cloudy'),
(3,2,286.0,'a bit sand'),
(4,2,156.0,'slightly cloudy');

insert into reports(household_id,user_id,issue_type,description,status)
values
(1,3,'discoloration','makanyan ya lasa!','pending'),
(2,4,'odor','mamawu ya takla!','pending'),
(3,3,'cleanliness','atin ya gabun!','pending');

insert into recurring_flags(household_id,issue_type,times_reported,last_reported_at,status)
values
(2,'odor',3,'2024-05-15 08:30:33','active'),
(1,'discoloration',5,'2024-05-05 08:20:33','active');
