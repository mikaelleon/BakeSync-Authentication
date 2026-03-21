// BakeSync API Configuration
const API_BASE = "https://bakesync-authentication.onrender.com";

// Apply saved theme before first paint (avoids flash when CSS loads)
(function () {
    try {
        if (localStorage.getItem('bakesync_theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    } catch (_) {}
})();

// Role display name mapping (internal -> display)
const ROLE_DISPLAY = {
    'admin': 'Manager',
    'staff': 'Baker',
    'user': 'Cashier'
};
