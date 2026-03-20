// BakeSync API Wrapper
// Centralized fetch wrapper with authentication

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Response data
 */
async function apiRequest(endpoint, options = {}) {
    const token = sessionStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    let data = {};
    try {
        data = await response.json();
    } catch (e) {
        data = {};
    }

    if (!response.ok) {
        if (response.status === 401) {
            const endpointLc = String(endpoint || '').toLowerCase();
            const isAuthEndpoint =
                endpointLc.includes('/api/auth/login') ||
                endpointLc.includes('/api/auth/register') ||
                endpointLc.includes('/api/auth/verify-otp') ||
                endpointLc.includes('/api/auth/resend-otp');

            // Improvement: on expired JWT, redirect to login with context.
            if (!isAuthEndpoint) {
                sessionStorage.clear();
                window.__bakesyncJwtExpiredRedirected = true;
                window.location.href = 'login.html?expired=true';
            }
        }

        throw new Error(data.error || 'Request failed');
    }

    return data;
}

/**
 * POST request helper
 */
async function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

/**
 * GET request helper
 */
async function apiGet(endpoint) {
    return apiRequest(endpoint, {
        method: 'GET'
    });
}

/**
 * DELETE request helper
 */
async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: 'DELETE'
    });
}

/**
 * PATCH request helper
 */
async function apiPatch(endpoint, body) {
    return apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return sessionStorage.getItem('token') !== null;
}

/**
 * Get current user info from session
 */
function getCurrentUser() {
    return {
        token: sessionStorage.getItem('token'),
        role: sessionStorage.getItem('role'),
        username: sessionStorage.getItem('username')
    };
}

/**
 * Clear session and redirect to login
 */
function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

/**
 * Require authentication - redirect if not logged in
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Get role badge class
 */
function getRoleBadgeClass(role) {
    const classes = {
        'admin': 'badge-admin',
        'staff': 'badge-staff',
        'user': 'badge-user'
    };
    return classes[role] || 'badge-user';
}

/**
 * Get role display name
 */
function getRoleDisplayName(role) {
    return ROLE_DISPLAY[role] || role;
}
