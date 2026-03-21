const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let cloudinary = null;
try {
    cloudinary = require('cloudinary').v2;
    const raw = process.env.CLOUDINARY_URL;
    if (raw && raw.startsWith('cloudinary://')) {
        const rest = raw.replace('cloudinary://', '');
        const at = rest.lastIndexOf('@');
        if (at > 0) {
            const cloud_name = rest.slice(at + 1);
            const pair = rest.slice(0, at);
            const colon = pair.indexOf(':');
            if (colon > 0) {
                cloudinary.config({
                    cloud_name,
                    api_key: pair.slice(0, colon),
                    api_secret: pair.slice(colon + 1),
                    secure: true,
                });
            }
        }
    }
} catch (_) {
    cloudinary = null;
}

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * Persist an uploaded buffer. Uses Cloudinary when CLOUDINARY_URL is set, else local disk.
 * @returns {Promise<{ file_url: string, file_size_kb: number, original_name: string, mime_type: string }>}
 */
async function persistUploadedFile(buffer, originalName, mimeType) {
    const safeName = String(originalName || 'upload').replace(/[^\w.\-()+ ]/g, '_').slice(0, 200);
    const sizeKb = Math.max(1, Math.round(buffer.length / 1024));
    const mime = mimeType && String(mimeType).trim() ? String(mimeType).trim() : 'application/octet-stream';

    if (cloudinary && process.env.CLOUDINARY_URL) {
        const secureUrl = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'bakesync', resource_type: 'auto', use_filename: true, unique_filename: true },
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result.secure_url);
                }
            );
            stream.end(buffer);
        });
        return {
            file_url: secureUrl,
            file_size_kb: sizeKb,
            original_name: safeName,
            mime_type: mime,
        };
    }

    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(safeName) || '.bin';
    const stored = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const fullPath = path.join(UPLOAD_DIR, stored);
    await fs.promises.writeFile(fullPath, buffer);

    return {
        file_url: `/uploads/${stored}`,
        file_size_kb: sizeKb,
        original_name: safeName,
        mime_type: mime,
    };
}

module.exports = { persistUploadedFile, UPLOAD_DIR };
