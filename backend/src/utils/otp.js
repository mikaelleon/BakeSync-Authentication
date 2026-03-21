/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
    // Math.random() is NOT cryptographically secure (CSPRNG).
    // Prototype limitation; production: crypto.randomInt(100000, 999999).
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
}

/**
 * Get OTP expiry time (10 minutes from now)
 * @returns {Date} Expiry timestamp
 */
function getOTPExpiry() {
    // 10-minute validity aligns with NIST SP 800-63B guidance for OTPs.
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
}

module.exports = {
    generateOTP,
    getOTPExpiry
};
