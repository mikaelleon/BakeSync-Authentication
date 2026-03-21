-- BakeSync IAS102: remove file storage / Cloudinary columns added by 001_files_storage.sql
-- Run on databases where those ALTERs were already applied.
-- If a column was never added, skip that line or comment it out (MySQL will error on missing column).

USE defaultdb;

ALTER TABLE files DROP COLUMN cloudinary_public_id;
ALTER TABLE files DROP COLUMN mime_type;
ALTER TABLE files DROP COLUMN original_name;
ALTER TABLE files DROP COLUMN file_size_kb;
ALTER TABLE files DROP COLUMN file_url;
