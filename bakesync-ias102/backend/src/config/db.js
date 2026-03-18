const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Build connection config
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Add SSL configuration for Aiven (production)
if (process.env.DB_SSL === 'true') {
    const caPath = path.join(__dirname, '../../ca.pem');
    if (fs.existsSync(caPath)) {
        dbConfig.ssl = {
            ca: fs.readFileSync(caPath),
            rejectUnauthorized: true
        };
        console.log('Database SSL enabled with ca.pem');
    } else {
        console.warn('Warning: DB_SSL=true but ca.pem not found at', caPath);
    }
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;
