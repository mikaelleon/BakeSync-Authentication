/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

/**
 * Get OTP expiry time (5 minutes from now)
 * @returns {Date} Expiry timestamp
 */
function getOTPExpiry() {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);
    return expiry;
}

module.exports = {
    generateOTP,
    getOTPExpiry
};
