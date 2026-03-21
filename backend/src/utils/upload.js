const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed'
];

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: 'bakesync-ias102',
        resource_type: 'raw',
        public_id: `${Date.now()}-${String(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`
    })
});

function fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `File type not allowed: ${file.mimetype}. ` +
                    'Accepted types: PDF, DOCX, XLSX, TXT, CSV, PPTX, JPG, PNG, WEBP, ZIP.'
            ),
            false
        );
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 250 * 1024 * 1024
    }
});

module.exports = { upload, cloudinary };
