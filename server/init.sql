-- Initial setup script for MySQL
CREATE DATABASE IF NOT EXISTS icrogen;
USE icrogen;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'icrogen_user'@'%' IDENTIFIED BY 'icrogen_pass';
GRANT ALL PRIVILEGES ON icrogen.* TO 'icrogen_user'@'%';
FLUSH PRIVILEGES;