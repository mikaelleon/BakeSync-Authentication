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

    // Common typo: duplicated service name.
    // Example: "bakesync-bakesync.a.aivencloud.com" -> "bakesync.a.aivencloud.com"
    host = host.replace(/^bakesync-bakesync\./i, 'bakesync.');

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

function buildPoolConfig(host) {
    const dbConfig = {
        host,
        port: envDb.port,
        user: envDb.user,
        password: envDb.password,
        database: envDb.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

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
            console.warn(
                'Warning: DB_SSL=true but ca.pem not found at',
                caPath,
                '- enabling SSL with rejectUnauthorized:false'
            );
            dbConfig.ssl = { rejectUnauthorized: false };
        }
    }

    return dbConfig;
}

function candidateHosts(rawHost) {
    const out = [];
    const add = (h) => {
        if (!h) return;
        const v = String(h).trim();
        if (!v) return;
        if (!out.includes(v)) out.push(v);
    };

    add(rawHost);

    // Normalized baseline
    add(normalizeDbHost(rawHost));

    // Alternative fixes:
    // - duplicated service name
    if (typeof rawHost === 'string') {
        add(rawHost.replace(/^bakesync-bakesync\./i, 'bakesync.'));
        // - extra ".a" segment
        add(String(rawHost).replace(/\.a\.aivencloud\.com$/i, '.aivencloud.com'));
        // - duplicated service name + extra ".a"
        const v = rawHost.replace(/^bakesync-bakesync\./i, 'bakesync.').replace(/\.a\.aivencloud\.com$/i, '.aivencloud.com');
        add(v);
    }

    // Final cleanup candidates through normalizer again.
    return out;
}

const rawHost = process.env.DB_HOST;
const hosts = candidateHosts(rawHost);
let hostIndex = 0;

if (!hosts[0]) {
    console.warn('DB_HOST is not set; MySQL connection will fail.');
} else {
    console.log('DB host raw:', rawHost);
    console.log('DB host candidates:', hosts.join(', '));
}

let pool = hosts[0] ? mysql.createPool(buildPoolConfig(hosts[0])) : null;

async function executeWithHostRetry(sql, params) {
    if (!pool) throw new Error('MySQL pool is not initialized (missing DB_HOST)');

    try {
        return await pool.execute(sql, params);
    } catch (err) {
        const code = err && err.code ? err.code : '';
        if ((code === 'ENOTFOUND' || code === 'EAI_AGAIN') && hostIndex < hosts.length - 1) {
            hostIndex += 1;
            const nextHost = hosts[hostIndex];
            console.warn('MySQL host resolution failed; retrying with host:', nextHost);
            // Re-create pool for the new host.
            pool = mysql.createPool(buildPoolConfig(nextHost));
            return await pool.execute(sql, params);
        }
        throw err;
    }
}

module.exports = {
    execute: executeWithHostRetry
};
