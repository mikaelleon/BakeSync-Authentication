/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
}

/**
 * Get OTP expiry time (10 minutes from now)
 * @returns {Date} Expiry timestamp
 */
function getOTPExpiry() {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
}

module.exports = {
    generateOTP,
    getOTPExpiry
};
