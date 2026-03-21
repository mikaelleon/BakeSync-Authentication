-- BakeSync IAS102: file storage columns + Cloudinary public id (run on existing DBs)
USE defaultdb;

ALTER TABLE files ADD COLUMN file_url VARCHAR(500) DEFAULT NULL AFTER description;
ALTER TABLE files ADD COLUMN file_size_kb INT UNSIGNED DEFAULT NULL AFTER file_url;
ALTER TABLE files ADD COLUMN original_name VARCHAR(255) DEFAULT NULL AFTER file_size_kb;
ALTER TABLE files ADD COLUMN mime_type VARCHAR(100) DEFAULT NULL AFTER original_name;
ALTER TABLE files ADD COLUMN cloudinary_public_id VARCHAR(255) DEFAULT NULL AFTER mime_type;
