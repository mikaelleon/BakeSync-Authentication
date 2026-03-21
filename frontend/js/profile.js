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

function showFieldError(fieldId, message) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
}

function clearFieldError(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
}

function clearProfileFieldErrors() {
    clearFieldError('profile-username-error');
    clearFieldError('profile-email-error');
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

    clearProfileFieldErrors();

    if (!username || !email) {
        showToast('Username and email are required.', 'error');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/users/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ username, email }),
        });

        let data = {};
        try {
            data = await res.json();
        } catch (_) {
            data = {};
        }

        if (!res.ok) {
            if (res.status === 409) {
                const err = String(data.error || '');
                const errLc = err.toLowerCase();

                if (errLc.includes('username')) {
                    showFieldError('profile-username-error', 'This username is already taken.');
                } else if (errLc.includes('email')) {
                    showFieldError('profile-email-error', 'This email is already registered.');
                } else {
                    showToast(err || 'Failed to save changes.', 'error');
                }

                showToast(data.error || 'Failed to save changes.', 'error');
                return;
            }

            showToast(data.error || 'Failed to save changes.', 'error');
            showError(data.error || 'Failed to save changes.');
            return;
        }

        if (data.user?.username) sessionStorage.setItem('username', data.user.username);
        if (data.token) sessionStorage.setItem('token', data.token);

        // Keep sidebar username in sync without forcing a full refresh.
        const sidebarUserName = document.querySelector('.sidebar-user-name');
        if (sidebarUserName) sidebarUserName.textContent = data.user?.username || username;

        if (typeof initNavbar === 'function') initNavbar();

        showSuccess('Profile updated.');
        showToast('Profile updated successfully.', 'success');
    } catch (e) {
        showToast('Network error. Changes not saved.', 'error');
        showError(e.message || 'Failed to update profile');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save changes';
    }
}

function initDeleteAccountFlow() {
    const showBtn = document.getElementById('delete-show-btn');
    const cancelBtn = document.getElementById('delete-cancel-btn');
    const requestOTPBtn = document.getElementById('delete-request-otp-btn');
    const confirmBtn = document.getElementById('delete-confirm-btn');
    const backBtn = document.getElementById('delete-back-btn');

    const step1 = document.getElementById('delete-step-1');
    const step2 = document.getElementById('delete-step-2');
    const step3 = document.getElementById('delete-step-3');

    function showStep(n) {
        if (step1) step1.style.display = n === 1 ? '' : 'none';
        if (step2) step2.style.display = n === 2 ? '' : 'none';
        if (step3) step3.style.display = n === 3 ? '' : 'none';
    }

    showBtn?.addEventListener('click', () => showStep(2));

    cancelBtn?.addEventListener('click', () => showStep(1));

    requestOTPBtn?.addEventListener('click', async () => {
        requestOTPBtn.disabled = true;
        requestOTPBtn.textContent = 'Sending...';

        try {
            await apiPost('/api/users/me/delete/request-otp', {});
            showStep(3);
            document.getElementById('delete-otp-input')?.focus();
            if (typeof showToast === 'function') {
                showToast('Deletion code sent to your email.', 'success');
            } else {
                showSuccess('Deletion code sent to your email.');
            }
        } catch (err) {
            if (typeof showToast === 'function') {
                showToast(err.message || 'Failed to send code.', 'error');
            } else {
                showError(err.message || 'Failed to send code.');
            }
        } finally {
            requestOTPBtn.disabled = false;
            requestOTPBtn.textContent = 'Yes, send me a deletion code';
        }
    });

    backBtn?.addEventListener('click', () => {
        showStep(1);
        const otpInput = document.getElementById('delete-otp-input');
        if (otpInput) otpInput.value = '';
    });

    confirmBtn?.addEventListener('click', async () => {
        const otp = document.getElementById('delete-otp-input')?.value?.trim();

        if (!otp || otp.length !== 6) {
            if (typeof showToast === 'function') {
                showToast('Enter the 6-digit code from your email.', 'error');
            } else {
                showError('Enter the 6-digit code from your email.');
            }
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';

        try {
            await apiPost('/api/users/me/delete/confirm', { otp });
            sessionStorage.clear();
            window.location.href = 'login.html?deleted=true';
        } catch (err) {
            if (typeof showToast === 'function') {
                showToast(err.message || 'Deletion failed.', 'error');
            } else {
                showError(err.message || 'Deletion failed.');
            }
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete my account permanently';
        }
    });
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

    initDeleteAccountFlow();

    // Collapsible password change section toggle
    const passwordToggle = document.getElementById('password-card-toggle');
    const passwordBody = document.getElementById('password-form-body');
    const passwordChevron = document.getElementById('password-chevron');

    passwordToggle?.addEventListener('click', () => {
        if (!passwordBody) return;
        const isOpen = passwordBody.style.display !== 'none';
        passwordBody.style.display = isOpen ? 'none' : 'block';
        if (passwordChevron) passwordChevron.textContent = isOpen ? '▼' : '▲';
    });

    // Password change submit
    const changePasswordBtn = document.getElementById('change-password-btn');
    changePasswordBtn?.addEventListener('click', async () => {
        const currentPassword = document.getElementById('current-password')?.value || '';
        const newPassword = document.getElementById('new-password')?.value || '';
        const confirmNewPassword = document.getElementById('confirm-new-password')?.value || '';

        clearFieldError('current-password-error');
        clearFieldError('new-password-error');
        clearFieldError('confirm-new-password-error');

        let valid = true;

        if (!currentPassword) {
            showFieldError('current-password-error', 'Enter your current password.');
            valid = false;
        }

        if (!newPassword || newPassword.length < 6) {
            showFieldError('new-password-error', 'New password must be at least 6 characters.');
            valid = false;
        }

        if (newPassword !== confirmNewPassword) {
            showFieldError('confirm-new-password-error', 'Passwords do not match.');
            valid = false;
        }

        if (!valid) return;

        changePasswordBtn.disabled = true;
        changePasswordBtn.textContent = 'Updating...';

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/users/me/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }),
            });

            let data = {};
            try {
                data = await res.json();
            } catch (_) {
                data = {};
            }

            if (!res.ok) {
                if (res.status === 401) {
                    showFieldError('current-password-error', data.error || 'Current password is incorrect.');
                } else {
                    showToast(data.error || 'Failed to change password.', 'error');
                }
                return;
            }

            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-new-password').value = '';

            showToast('Password changed successfully.', 'success');

            if (passwordBody) passwordBody.style.display = 'none';
            if (passwordChevron) passwordChevron.textContent = '▼';
        } catch (e) {
            showToast('Network error. Password not changed.', 'error');
        } finally {
            changePasswordBtn.disabled = false;
            changePasswordBtn.textContent = 'Change Password';
        }
    });
})();

