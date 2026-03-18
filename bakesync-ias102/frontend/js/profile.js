// BakeSync Profile & Account Settings

function showError(message) {
    const alert = document.getElementById('error-alert');
    const msgSpan = document.getElementById('error-message');
    const success = document.getElementById('success-alert');
    if (success) success.style.display = 'none';
    if (msgSpan) msgSpan.textContent = message;
    if (alert) alert.style.display = 'flex';
}

function showSuccess(message) {
    const alert = document.getElementById('success-alert');
    const msgSpan = document.getElementById('success-message');
    const error = document.getElementById('error-alert');
    if (error) error.style.display = 'none';
    if (msgSpan) msgSpan.textContent = message;
    if (alert) alert.style.display = 'flex';
}

async function loadProfile() {
    const data = await apiGet('/api/users/me');
    document.getElementById('username').value = data.username || '';
    document.getElementById('email').value = data.email || '';
}

async function handleProfileSave(event) {
    event.preventDefault();

    const saveBtn = document.getElementById('save-btn');
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const res = await apiPatch('/api/users/me', { username, email });
        if (res.user?.username) sessionStorage.setItem('username', res.user.username);
        if (res.token) sessionStorage.setItem('token', res.token);
        initNavbar();
        showSuccess('Profile updated.');
    } catch (e) {
        showError(e.message || 'Failed to update profile');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save changes';
    }
}

async function requestDeleteOTP() {
    const btn = document.getElementById('request-delete-otp-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
        await apiPost('/api/users/me/delete/request-otp', {});
        showSuccess('Deletion OTP sent. Check your email.');
    } catch (e) {
        showError(e.message || 'Failed to send deletion OTP');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send deletion OTP to my email';
    }
}

async function confirmDelete(event) {
    event.preventDefault();

    const btn = document.getElementById('confirm-delete-btn');
    const otp = document.getElementById('delete-otp').value.trim();

    if (!/^\d{6}$/.test(otp)) {
        showError('Please enter a valid 6-digit OTP.');
        return;
    }

    const ok = confirm('This will permanently delete your account. Continue?');
    if (!ok) return;

    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
        await apiPost('/api/users/me/delete/confirm', { otp });
        sessionStorage.clear();
        window.location.href = 'login.html';
    } catch (e) {
        showError(e.message || 'Failed to delete account');
        btn.disabled = false;
        btn.textContent = 'Delete my account';
    }
}

(async function initProfilePage() {
    if (!requireAuth()) return;
    initNavbar();

    try {
        await loadProfile();
    } catch (e) {
        showError(e.message || 'Failed to load profile');
    }

    const profileForm = document.getElementById('profile-form');
    if (profileForm) profileForm.addEventListener('submit', handleProfileSave);

    const requestBtn = document.getElementById('request-delete-otp-btn');
    if (requestBtn) requestBtn.addEventListener('click', requestDeleteOTP);

    const deleteForm = document.getElementById('delete-form');
    if (deleteForm) deleteForm.addEventListener('submit', confirmDelete);
})();

