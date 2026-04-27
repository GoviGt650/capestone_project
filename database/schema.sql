

create database users_db;

use users_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Optional: add some default data
INSERT INTO users (name) VALUES 
('Govind'),
('Rahul'),
('Anjali'),
('Priya'),
('Kiran');