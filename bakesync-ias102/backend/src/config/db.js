const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Build connection config
function normalizeDbHost(rawHost) {
    if (!rawHost) return rawHost;

    let host = String(rawHost).trim();
    const original = host;

    // Allow URLs like mysql://host:port or host:port
    // (We only extract host; DB_PORT is already handled separately.)
    host = host.replace(/^mysql:\/\//i, '').replace(/^mongodb:\/\//i, '');
    host = host.split('/')[0];

    // If accidentally provided as host:port, strip port part.
    if (host.includes(':')) {
        host = host.split(':')[0];
    }

    // Common Aiven hostname typo: extra ".a" segment.
    // Example: "foo.a.aivencloud.com" -> "foo.aivencloud.com"
    host = host.replace(/\.a\.aivencloud\.com$/i, '.aivencloud.com');

    if (original !== host) {
        console.log('DB host normalized:', original, '->', host);
    }

    return host;
}

function buildDbConfigFromEnv() {
    // Support platforms that provide a single DB URL.
    // Example: mysql://user:pass@host:port/dbname
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
        try {
            const url = new URL(databaseUrl);
            return {
                host: normalizeDbHost(url.hostname),
                port: url.port ? Number(url.port) : 3306,
                user: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password),
                database: url.pathname.replace(/^\//, '')
            };
        } catch (e) {
            console.warn('Invalid DATABASE_URL format; falling back to individual DB_* env vars.');
        }
    }

    return {
        host: normalizeDbHost(process.env.DB_HOST),
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };
}

const envDb = buildDbConfigFromEnv();
const dbConfig = {
    host: envDb.host,
    port: envDb.port,
    user: envDb.user,
    password: envDb.password,
    database: envDb.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (!dbConfig.host) {
    console.warn('DB_HOST is not set; MySQL connection will fail.');
} else {
    console.log('DB host used:', dbConfig.host);
    if (process.env.DB_HOST) console.log('DB_HOST raw:', process.env.DB_HOST);
}

// Add SSL configuration for Aiven (production)
if (String(process.env.DB_SSL || '').toLowerCase() === 'true') {
    const caPath = path.join(__dirname, '../../ca.pem');
    if (fs.existsSync(caPath)) {
        dbConfig.ssl = {
            ca: fs.readFileSync(caPath),
            rejectUnauthorized: true
        };
        console.log('Database SSL enabled with ca.pem');
    } else {
        // Fallback: Aiven commonly uses TLS; allow connection even without CA bundle.
        // This avoids failures where `ca.pem` isn't mounted in the platform.
        console.warn('Warning: DB_SSL=true but ca.pem not found at', caPath, '- enabling SSL with rejectUnauthorized:false');
        dbConfig.ssl = { rejectUnauthorized: false };
    }
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;
