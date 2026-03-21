-- Run once against your BakeSync MySQL database (e.g. mysql < migrations/002_files_storage.sql)
-- Adds optional storage metadata for real file uploads (local /uploads or Cloudinary URL).

ALTER TABLE files ADD COLUMN file_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE files ADD COLUMN file_size_kb INT DEFAULT NULL;
ALTER TABLE files ADD COLUMN original_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE files ADD COLUMN mime_type VARCHAR(100) DEFAULT NULL;
