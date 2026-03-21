const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim + lowercase for consistent email lookups (password reset, resend, etc.). */
function normalizeEmailInput(email) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
}

function isValidEmail(email) {
    return typeof email === 'string' && EMAIL_REGEX.test(email);
}

module.exports = {
    normalizeEmailInput,
    isValidEmail,
};
