// BakeSync Dashboard Logic

function getRoleDisplayLabel(role) {
    return role === 'admin' ? 'Manager'
        : role === 'staff' ? 'Baker'
            : role === 'user' ? 'Cashier'
                : role;
}

function renderRoleBadge(role) {
    const r = role || 'user';
    const label = typeof getRoleDisplayName === 'function' ? getRoleDisplayName(r) : getRoleDisplayLabel(r);
    return `<span class="role-badge ${escapeHtml(r)}">${escapeHtml(label)}</span>`;
}

/**
 * Initialize navbar with user info
 */
function initNavbar() {
    const user = getCurrentUser();

    const usernameEl = document.getElementById('navbar-username');
    const roleEl = document.getElementById('navbar-role');
    const logoutBtn = document.getElementById('logout-btn');

    if (usernameEl) {
        usernameEl.textContent = user.username;
    }

    if (roleEl) {
        roleEl.innerHTML = renderRoleBadge(user.role);
    }

    const topUser = document.getElementById('topbar-username');
    const topRole = document.getElementById('topbar-role-badge');
    if (topUser) topUser.textContent = user.username || '';
    if (topRole) topRole.innerHTML = renderRoleBadge(user.role || 'user');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

/**
 * Load admin dashboard data
 */
async function loadAdminDashboard() {
    if (!requireAuth()) return;

    initNavbar();
    // Frontend guard (backend also enforces RBAC)
    const me = getCurrentUser();
    if (me.role !== 'admin') {
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Manager dashboard is restricted to Admin (Manager) role.')}&required=${encodeURIComponent('admin')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        return;
    }

    try {
        const data = await apiGet('/api/dashboard/admin');

        // Update stats
        document.getElementById('stat-users').textContent = data.stats?.totalUsers ?? '-';
        document.getElementById('stat-files').textContent = data.stats?.totalFiles ?? '-';
        document.getElementById('stat-alerts').textContent = data.stats?.systemAlerts ?? '-';

        // Quick stats (cards like original dashboard)
        const qs = data.quickStats || {};
        const salesEl = document.getElementById('stat-today-sales');
        const prodEl = document.getElementById('stat-production-today');
        const lowEl = document.getElementById('stat-low-stock');
        const poEl = document.getElementById('stat-pending-orders');
        if (salesEl) salesEl.textContent = `₱${Number(qs.todaySales || 0).toFixed(2)}`;
        if (prodEl) prodEl.textContent = String(qs.productionToday || 0);
        if (lowEl) lowEl.textContent = String(qs.lowStockItems || 0);
        if (poEl) poEl.textContent = String(qs.pendingOrders || 0);

        // Populate activity list
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = '';

        (data.recentActivity || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="action">${item.action} by <span class="user">${item.user}</span></span>
                <span class="time">${item.time}</span>
            `;
            activityList.appendChild(li);
        });

        // Load a preview of accessible documents (file manager).
        await loadFilesPreview(5);
    } catch (error) {
        console.error('Dashboard load error:', error);
        if (error.message === 'Unauthorized') {
            logout();
        }
        if (String(error.message || '').toLowerCase().includes('forbidden')) {
            window.location.href = `access-denied.html?reason=${encodeURIComponent('You do not have permission to access this dashboard.')}&required=${encodeURIComponent('admin')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        }
    }
}

/**
 * Load staff dashboard data
 */
async function loadStaffDashboard() {
    if (!requireAuth()) return;

    initNavbar();
    const me = getCurrentUser();
    if (me.role !== 'staff') {
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Baker dashboard is restricted to Staff (Baker) role.')}&required=${encodeURIComponent('staff')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        return;
    }

    try {
        const data = await apiGet('/api/dashboard/staff');

        // Update stats
        document.getElementById('stat-recipes').textContent = data.stats?.recipesManaged ?? '-';
        document.getElementById('stat-production').textContent = data.stats?.productionToday ?? '-';

        // Populate schedule table
        const scheduleBody = document.getElementById('schedule-body');
        scheduleBody.innerHTML = '';

        (data.schedule || []).forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.time}</td>
                <td>${item.task}</td>
                <td class="status-${item.status}">${item.status.replace('_', ' ')}</td>
            `;
            scheduleBody.appendChild(tr);
        });

        // Load a preview of accessible documents (file manager).
        await loadFilesPreview(5);
    } catch (error) {
        console.error('Dashboard load error:', error);
        if (error.message === 'Unauthorized') {
            logout();
        }
        if (String(error.message || '').toLowerCase().includes('forbidden')) {
            window.location.href = `access-denied.html?reason=${encodeURIComponent('You do not have permission to access this dashboard.')}&required=${encodeURIComponent('staff')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        }
    }
}

/**
 * Load user dashboard data
 */
async function loadUserDashboard() {
    if (!requireAuth()) return;

    initNavbar();
    const me = getCurrentUser();
    if (me.role !== 'user') {
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Cashier dashboard is restricted to User (Cashier) role.')}&required=${encodeURIComponent('user')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        return;
    }

    try {
        const data = await apiGet('/api/dashboard/user');

        // Update stats
        document.getElementById('stat-orders').textContent = data.stats?.ordersToday ?? '-';
        const salesEl = document.getElementById('stat-today-sales');
        if (salesEl) salesEl.textContent = `₱${Number(data.stats?.todaySales || 0).toFixed(2)}`;

        // Populate notifications
        const notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = '';

        (data.notifications || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="message">${item.message}</div>
                <div class="time">${item.time}</div>
            `;
            notificationList.appendChild(li);
        });

        // Load a preview of accessible documents (file manager).
        await loadFilesPreview(5);
    } catch (error) {
        console.error('Dashboard load error:', error);
        if (error.message === 'Unauthorized') {
            logout();
        }
        if (String(error.message || '').toLowerCase().includes('forbidden')) {
            window.location.href = `access-denied.html?reason=${encodeURIComponent('You do not have permission to access this dashboard.')}&required=${encodeURIComponent('user')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        }
    }
}

/**
 * Load a small preview of documents (files) visible to the current user.
 * This preserves DAC/permissions because the backend `/api/files` filters access.
 */
async function loadFilesPreview(limit = 5) {
    const listEl = document.getElementById('recent-files-list');
    const countEl = document.getElementById('recent-files-count');

    if (!listEl && !countEl) return;

    const loadingLi = `
        <li class="loading">
            <div class="spinner"></div>
        </li>
    `;

    if (listEl) listEl.innerHTML = loadingLi;
    if (countEl) countEl.textContent = 'Loading...';

    try {
        const files = await apiGet('/api/files');
        const safeFiles = Array.isArray(files) ? files : [];

        if (countEl) countEl.textContent = `${safeFiles.length} file(s) accessible`;

        if (!listEl) return;
        if (safeFiles.length === 0) {
            listEl.innerHTML = `
                <li style="text-align:center; padding: 1.5rem; color: var(--muted-foreground);">
                    No files available yet.
                </li>
            `;
            return;
        }

        const shown = safeFiles.slice(0, limit);
        listEl.innerHTML = '';

        shown.forEach(file => {
            const filename = escapeHtml(file.filename || '');
            const type = escapeHtml(file.file_type || '');
            const ownerLabel = file.isOwner ? 'You' : `User #${file.owner_id ?? '?'}`;
            const visibility = file.is_public ? 'Public' : 'Private';

            const li = document.createElement('li');
            li.innerHTML = `
                <span class="action">
                    ${filename}
                    <span class="badge" style="margin-left: 0.5rem;">${type}</span>
                    <span style="display:block; margin-top: 0.25rem; font-size: 0.75rem; color: var(--muted-foreground);">
                        Owner: ${escapeHtml(ownerLabel)}
                    </span>
                </span>
                <span class="time">${visibility}</span>
            `;
            listEl.appendChild(li);
        });
    } catch (error) {
        console.error('Files preview load error:', error);
        if (listEl) {
            listEl.innerHTML = `
                <li style="text-align:center; padding: 1.5rem; color: var(--destructive);">
                    Failed to load file preview.
                </li>
            `;
        }
        if (countEl) countEl.textContent = 'Failed to load';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function icon(name, className = '') {
    const iconMap = {
        'file-text': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        'book-open': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
        calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        receipt: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
        'bar-chart': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        'bar-chart-2': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        folder: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
        users: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        lock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        bell: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        package: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
        'shopping-cart': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
        settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
        truck: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
        'dollar-sign': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
        upload: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
        eye: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
        'log-in': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
    };
    const svg = iconMap[name] || iconMap['file-text'];
    if (!className) return svg;
    return svg.replace('<svg ', `<svg class="${className}" `);
}

function getFileTypeIconEl(type) {
    const iconName = {
        recipe: 'book-open',
        report: 'bar-chart',
        schedule: 'calendar',
        invoice: 'receipt',
    }[type] || 'file-text';
    const t = type || 'recipe';
    return `<span class="file-type-icon-wrap type-${escapeHtml(t)}">${icon(iconName)}</span>`;
}

function updateFilesPageTitle(type) {
    const typeLabel = {
        all: 'Document Manager',
        recipe: 'Recipes',
        report: 'Reports',
        schedule: 'Schedules',
        invoice: 'Invoices',
    };
    document.title = `${typeLabel[type] || 'Document Manager'} — BakeSync`;
}

// =======================================================
// IAS102 Shared utilities + new Dashboard/Files behavior
// =======================================================

// Relative time formatter (used by activity feed + notifications)
function timeAgo(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Unknown time';

    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) {
        const m = Math.floor(diff / 60);
        return `${m} minute${m !== 1 ? 's' : ''} ago`;
    }
    if (diff < 86400) {
        const h = Math.floor(diff / 3600);
        return `${h} hour${h !== 1 ? 's' : ''} ago`;
    }
    if (diff < 604800) {
        const d = Math.floor(diff / 86400);
        return `${d} day${d !== 1 ? 's' : ''} ago`;
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function formatDateLong(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getRoleLine(role) {
    if (role === 'admin') return 'Here is your full system overview.';
    if (role === 'staff') return 'Here is your production and recipe summary.';
    return 'Here is your shift and transaction summary.';
}

function roleDefaultDocumentTab(role) {
    if (role === 'admin') return 'all';
    if (role === 'staff') return 'recipe';
    return 'invoice';
}

function fileTypeToLabel(type) {
    if (!type || type === 'all') return 'All';
    if (type === 'recipe') return 'Recipes';
    if (type === 'report') return 'Reports';
    if (type === 'schedule') return 'Schedules';
    if (type === 'invoice') return 'Invoices';
    return type;
}

function fileTypeToColorClass(type) {
    if (type === 'recipe') return 'recipe';
    if (type === 'report') return 'report';
    if (type === 'schedule') return 'schedule';
    if (type === 'invoice') return 'invoice';
    return 'recipe';
}

function fileTypeIcon(type) {
    return getFileTypeIconEl(type);
}

/** Document Manager widget: one Lucide-style file icon + type color from wrapper (no per-type glyph). */
function widgetFileTypeIcon(type) {
    const t = type || 'recipe';
    return `<span class="file-type-icon-wrap type-${escapeHtml(t)}">${icon('file-text').replace('width="16" height="16"', 'width="18" height="18"')}</span>`;
}

function dedupeFilesById(files) {
    const map = new Map();
    for (const f of files) {
        if (!f || f.id == null) continue;
        const k = String(f.id);
        if (!map.has(k)) map.set(k, f);
    }
    return [...map.values()];
}

function resolveMediaUrl(fileUrl) {
    if (!fileUrl) return null;
    const s = String(fileUrl).trim();
    if (/^https?:\/\//i.test(s)) return s;
    const base = typeof API_BASE !== 'undefined' ? String(API_BASE).replace(/\/$/, '') : '';
    return base + (s.startsWith('/') ? s : `/${s}`);
}

function formatFileOwnerLabel(file) {
    if (!file || file.isOwner) return 'You';
    if (file.owner_username) return file.owner_username;
    if (file.owner_id != null) return `User #${file.owner_id}`;
    return 'Unknown';
}

function formatFileSizeKb(kb) {
    if (kb == null || kb === '' || Number.isNaN(Number(kb))) return null;
    const n = Number(kb);
    if (n >= 1024) return `${(n / 1024).toFixed(1)} MB`;
    return `${n} KB`;
}

function openStoredFile(file) {
    const url = resolveMediaUrl(file.file_url);
    if (!url) return false;
    const name = (file.filename || file.original_name || '').toLowerCase();
    const mime = String(file.mime_type || '').toLowerCase();
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
        window.open(url, '_blank', 'noopener');
        return true;
    }
    if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(name)) {
        window.open(url, '_blank', 'noopener');
        return true;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename || file.original_name || 'download';
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
}

function ensureFileModal() {
    let modal = document.getElementById('file-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'file-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 id="modal-title">File Details</h3>
          <button class="modal-close" type="button" onclick="closeFileModal()">&times;</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function closeFileModal() {
    const modal = document.getElementById('file-modal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
}

function openAccessDeniedModal(message) {
    document.dispatchEvent(new CustomEvent('modal:open'));
    let modal = document.getElementById('access-denied-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'access-denied-modal';
        modal.className = 'modal-overlay show access-denied-modal';
        modal.style.zIndex = '9002';
        modal.innerHTML = `
          <div class="modal">
            <div class="modal-header">
              <h3>Access Denied</h3>
              <button class="modal-close" type="button" onclick="closeAccessDeniedModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p>${escapeHtml(message || 'You do not have permission to access this file.')}</p>
              <p style="margin-top: 1rem;">
                <strong>DAC Rule:</strong> Only the file owner can access private files.
                Your access attempt is recorded in the audit log. Managers can review denied access in the Access Denial Log panel.
              </p>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
    }
    const msgP = modal.querySelector('.modal-body > p');
    if (msgP) msgP.innerHTML = escapeHtml(message || 'You do not have permission to access this file.');
}

function closeAccessDeniedModal() {
    const modal = document.getElementById('access-denied-modal');
    if (modal) modal.remove();
}

async function openFileModal(fileId) {
    document.dispatchEvent(new CustomEvent('modal:open'));
    const modal = ensureFileModal();
    const body = modal.querySelector('#modal-body');
    const title = modal.querySelector('#modal-title');

    modal.classList.add('show');
    modal.style.display = 'flex';

    body.innerHTML = `<div class="loading" style="padding:0.5rem 0;">Loading...</div>`;

    try {
        const file = await apiGet(`/api/files/${fileId}`);

        const ownerLabel = formatFileOwnerLabel(file);
        const visibility = file.is_public ? 'Public' : 'Private';
        const sizeLine = formatFileSizeKb(file.file_size_kb);
        const openBtn = file.file_url
            ? `<p style="margin-top:1rem;"><button type="button" class="btn btn-primary btn-sm" id="modal-open-file-btn">Open / download file</button></p>`
            : '';

        title.textContent = file.filename || 'File Details';
        body.innerHTML = `
          <p style="margin-bottom: 0.75rem; font-size: 0.875rem;">
            <span class="visibility-pill ${file.is_public ? 'is-public' : 'is-private'}" style="margin-right:0.5rem;">${escapeHtml(visibility)}</span>
            <span style="color: var(--muted-foreground); font-size: 0.8125rem;">
              Owner: ${escapeHtml(ownerLabel)}${sizeLine ? ` · ${escapeHtml(sizeLine)}` : ''}
            </span>
          </p>
          <p style="margin-bottom: 0.75rem; color: var(--muted-foreground); font-size: 0.875rem;">
            Type: ${escapeHtml(file.file_type || '—')}
          </p>
          <p style="margin-bottom: 0.75rem; color: var(--foreground); font-size: 0.875rem;">
            ${escapeHtml(file.description || 'No description provided.')}
          </p>
          ${openBtn}
        `;

        const ob = body.querySelector('#modal-open-file-btn');
        if (ob) {
            ob.addEventListener('click', () => openStoredFile(file));
        }
    } catch (err) {
        const msg = (err && err.message) ? err.message : 'Access denied.';
        closeFileModal();
        openAccessDeniedModal(msg);
    }
}

function renderFilterTabs(container, role, activeType) {
    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'recipe', label: 'Recipes' },
        { key: 'report', label: 'Reports' },
        { key: 'schedule', label: 'Schedules' },
        { key: 'invoice', label: 'Invoices' }
    ];

    container.innerHTML = tabs
        .map(
            (t) => `
            <button type="button" class="filter-tab ${t.key === activeType ? 'active' : ''}" data-tab="${t.key}">
              ${t.label}
            </button>
          `
        )
        .join('');
}

function emptyStateMessage(tabKey) {
    if (tabKey === 'all') return 'No documents yet. Add your first file.';
    if (tabKey === 'recipe') return 'No recipes yet. Add your first recipe.';
    if (tabKey === 'report') return 'No reports found.';
    if (tabKey === 'schedule') return 'No schedules available.';
    if (tabKey === 'invoice') return 'No invoices found.';
    return 'No documents.';
}

function primaryUploadLink(typeKey) {
    const typeParam = typeKey && typeKey !== 'all' ? typeKey : null;
    if (typeParam) return `files.html?action=upload&type=${encodeURIComponent(typeParam)}`;
    return `files.html?action=upload&type=recipe`;
}

async function renderDocumentManagerWidget(role, containerEl, apiFilesEndpoint = '/api/files') {
    containerEl.innerHTML = `
      <section class="doc-widget">
        <div class="doc-widget-header">
          <div>
            <div class="doc-widget-title">Document Manager</div>
            <div class="doc-widget-subtext">Your files first, then shared documents</div>
            <p class="doc-widget-dac-hint">
              DAC: opening another user&rsquo;s <strong>private</strong> file returns 403 — use <strong>View</strong> on a shared file, then try a private one from the full Document Manager to show denial in the audit log.
            </p>
          </div>
        </div>

        <div class="filter-tabs" id="widget-filter-tabs"></div>
        <div id="widget-file-list" class="widget-file-list"></div>
      </section>
    `;

    const activeDefault = roleDefaultDocumentTab(role);

    const listEl = containerEl.querySelector('#widget-file-list');
    const tabsEl = containerEl.querySelector('#widget-filter-tabs');

    // Local cache: API called once; dedupe by id (guards duplicate rows / double render).
    const allFiles = dedupeFilesById(await apiGet(apiFilesEndpoint).then((x) => (Array.isArray(x) ? x : [])));
    // Improvement 12: own files first, then public files from others (both sorted by created_at desc).
    const myFiles = allFiles
        .filter((f) => !!f.isOwner)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const publicFiles = allFiles
        .filter((f) => !f.isOwner && (f.is_public === 1 || f.is_public === true))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const filesSorted = [...myFiles, ...publicFiles];

    // Used to apply a short "flash" animation after visibility updates.
    let lastVisibilityUpdatedId = null;

    function refreshTabs(activeTabValue) {
        const counts = {
            all: filesSorted.length,
            recipe: filesSorted.filter((f) => f.file_type === 'recipe').length,
            report: filesSorted.filter((f) => f.file_type === 'report').length,
            schedule: filesSorted.filter((f) => f.file_type === 'schedule').length,
            invoice: filesSorted.filter((f) => f.file_type === 'invoice').length
        };

        const tabs = [
            { key: 'all', label: 'All' },
            { key: 'recipe', label: 'Recipes' },
            { key: 'report', label: 'Reports' },
            { key: 'schedule', label: 'Schedules' },
            { key: 'invoice', label: 'Invoices' }
        ];

        tabsEl.innerHTML = tabs
            .map((t) => {
                const count = counts[t.key] || 0;
                const badge = count > 0 ? `<span class="tab-badge">${count}</span>` : '';
                return `<button type="button" class="filter-tab ${t.key === activeTabValue ? 'active' : ''}" data-tab="${t.key}">${t.label}${badge}</button>`;
            })
            .join('');
    }

    function renderListForTab(tabKey) {
        const filtered = tabKey === 'all' ? filesSorted : filesSorted.filter((f) => f.file_type === tabKey);
        const shown = filtered.slice(0, 5);

        if (shown.length === 0) {
            listEl.innerHTML = `
              <div class="widget-empty">
                <div class="widget-empty-icon" style="display:flex;justify-content:center;">${icon('folder', '')}</div>
                <div class="widget-empty-message">${escapeHtml(emptyStateMessage(tabKey))}</div>
                <a class="btn btn-primary" href="${escapeHtml(primaryUploadLink(tabKey))}">Add ${fileTypeToLabel(tabKey).replace('Recipes','Recipe').replace('Invoices','Invoice')}</a>
              </div>
            `;
            return;
        }

        listEl.innerHTML = shown
            .map((file) => {
                const type = file.file_type;
                const typeKey = type;
                const isOwner = !!file.isOwner;
                const isPublic = file.is_public === 1 || file.is_public === true;
                const visibilityLabel = isPublic ? 'Public' : 'Private';
                const ownerLabel = formatFileOwnerLabel(file);
                const sizeLabel = formatFileSizeKb(file.file_size_kb);
                const dateTitle = file.created_at ? new Date(file.created_at).toLocaleString() : '';
                const dateLabel = file.created_at ? timeAgo(file.created_at) : '—';
                const lockOverlay = !isPublic && !isOwner ? `<div class="file-card-locked" style="display:flex;gap:6px;align-items:center;">${icon('lock')} Access restricted</div>` : '';
                const lockOwnerMuted = !isPublic && isOwner ? `<div class="file-card-locked file-card-locked-muted" style="display:flex;gap:6px;align-items:center;">${icon('lock')} Your private file</div>` : '';

                return `
                  <div class="file-card ${String(file.id) === String(lastVisibilityUpdatedId) ? 'card-updated' : ''}">
                    <div class="file-card-icon">
                      ${widgetFileTypeIcon(typeKey)}
                      ${lockOverlay || lockOwnerMuted ? '' : ''}
                    </div>
                    <div class="file-card-body">
                      <div class="file-card-name">${escapeHtml(file.filename || '')}</div>
                      <div class="file-card-meta">
                        <span class="file-type-badge file-kind">${escapeHtml(typeKey)}</span>
                        <span class="visibility-pill ${isPublic ? 'is-public' : 'is-private'}">${escapeHtml(visibilityLabel)}</span>
                        <span class="file-owner">${escapeHtml(ownerLabel)}</span>
                        ${sizeLabel ? `<span class="file-size-meta">${escapeHtml(sizeLabel)}</span>` : ''}
                        <span class="file-date" ${dateTitle ? `title="${escapeHtml(dateTitle)}"` : ''}>${escapeHtml(dateLabel)}</span>
                      </div>
                    </div>
                    <div class="file-card-actions">
                      <button class="btn btn-ghost btn-sm" type="button" data-view-file="${escapeHtml(String(file.id))}">View</button>
                      ${isOwner ? `<button class="btn btn-ghost btn-sm" type="button" data-toggle-visibility="${escapeHtml(String(file.id))}">Toggle</button>` : ''}
                      ${isOwner ? `<button class="btn btn-ghost btn-sm btn-danger" type="button" data-delete-file="${escapeHtml(String(file.id))}">Delete</button>` : ''}
                    </div>

                    ${lockOverlay}
                    ${lockOwnerMuted}
                  </div>
                `;
            })
            .join('');

        listEl.querySelectorAll('[data-view-file]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await openFileModal(btn.getAttribute('data-view-file'));
            });
        });

        listEl.querySelectorAll('[data-delete-file]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const fileId = btn.getAttribute('data-delete-file');
                const cardEl = btn.closest('.file-card');
                const actionsEl = cardEl?.querySelector('.file-card-actions');
                if (!actionsEl) return;

                actionsEl.innerHTML = `
                  <span class="delete-confirm-text">Delete this file?</span>
                  <button class="btn btn-danger btn-sm confirm-yes"
                          type="button"
                          data-delete-file-id="${escapeHtml(String(fileId))}">
                    Delete
                  </button>
                  <button class="btn btn-ghost btn-sm confirm-no" type="button">Cancel</button>
                `;

                const confirmYes = actionsEl.querySelector('.confirm-yes');
                const confirmNo = actionsEl.querySelector('.confirm-no');

                if (confirmNo) {
                    confirmNo.addEventListener('click', () => {
                        renderListForTab(tabKey);
                    });
                }

                if (confirmYes) {
                    confirmYes.addEventListener('click', async () => {
                        confirmYes.disabled = true;
                        confirmYes.textContent = 'Deleting...';

                        try {
                            await apiDelete(`/api/files/${fileId}`);
                            const idx = filesSorted.findIndex((f) => String(f.id) === String(fileId));
                            if (idx >= 0) filesSorted.splice(idx, 1);
                            showToast('File deleted successfully.', 'success');
                            refreshTabs(activeTab);
                            renderListForTab(tabKey);
                        } catch (e) {
                            showToast(String(e.message || 'Delete failed'), 'error');
                            renderListForTab(tabKey);
                        }
                    });
                }
            });
        });

        listEl.querySelectorAll('[data-toggle-visibility]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const fileId = btn.getAttribute('data-toggle-visibility');
                const file = filesSorted.find((f) => String(f.id) === String(fileId));
                if (!file) return;
                const nextIsPublic = !(file.is_public === 1 || file.is_public === true);
                try {
                    await apiPatch(`/api/files/${fileId}/visibility`, { is_public: nextIsPublic ? 1 : 0 });
                    file.is_public = nextIsPublic;
                    lastVisibilityUpdatedId = fileId;
                    showToast(
                        nextIsPublic
                            ? 'File is now public — visible to all users.'
                            : 'File is now private — only you can access it.',
                        'success'
                    );
                    refreshTabs(activeTab);
                    renderListForTab(tabKey);
                } catch (e) {
                    showToast(String(e.message || 'Update failed'), 'error');
                }
            });
        });
    }

    let activeTab = activeDefault;
    refreshTabs(activeTab);
    tabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-tab');
        if (!btn) return;
        const tabKey = btn.getAttribute('data-tab');
        activeTab = tabKey;

        // Update active class + re-render using cached files.
        tabsEl.querySelectorAll('.filter-tab').forEach((t) => t.classList.toggle('active', t.getAttribute('data-tab') === tabKey));
        renderListForTab(tabKey);
    });

    // Initial render
    renderListForTab(activeTab);
}

function renderHeaderBlock(role) {
    const user = getCurrentUser();
    const greeting = getGreeting();
    const dateStr = formatDateLong(new Date().toISOString());
    const uname = (user.username || '').trim();

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <div style="display:flex; justify-content:space-between; gap:1rem; align-items:flex-start;">
          <div style="font-size:24px; font-weight:700; color: var(--foreground);">
            ${escapeHtml(uname ? `${greeting}, ${uname}.` : `${greeting}.`)}
          </div>
          <div style="font-size:13px; color: var(--muted-foreground); padding-top: 8px;">
            ${escapeHtml(dateStr)}
          </div>
        </div>

      </div>
    `;
    return el;
}

function renderQuickActions(role) {
    const primary = (() => {
        if (role === 'admin') return `files.html?action=upload&type=recipe`;
        if (role === 'staff') return `files.html?action=upload&type=recipe`;
        return `files.html?action=upload&type=invoice`;
    })();

    const ghost1 = role === 'admin' ? 'files.html' : role === 'staff' ? 'files.html?type=schedule' : 'files.html?type=report';

    const title = role === 'admin' ? '+ New Document' : role === 'staff' ? '+ New Recipe' : '+ New Invoice';

    const container = document.createElement('div');
    container.innerHTML = `
      <div style="display:flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
        <a href="${escapeHtml(primary)}" class="btn btn-primary">${escapeHtml(title)}</a>
        <a href="${escapeHtml(ghost1)}" class="btn btn-outline">${escapeHtml(role === 'admin' ? 'View All Files' : role === 'staff' ? 'My Schedules' : 'My Reports')}</a>
      </div>
    `;
    return container;
}

function iconWrapperHTML(iconType) {
    const map = {
        folder: 'folder',
        users: 'users',
        'book-open': 'book-open',
        'alert-triangle': null,
        calendar: 'calendar',
        'file-text': 'file-text',
        'bar-chart': 'bar-chart',
        files: 'folder',
    };
    if (iconType === 'alert-triangle') {
        return `<div class="kpi-icon-wrapper"><svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" stroke-width="2"/><path d="M12 9v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>`;
    }
    const key = map[iconType] || 'file-text';
    return `<div class="kpi-icon-wrapper">${icon(key).replace('width="16" height="16"', 'width="20" height="20"')}</div>`;
}

function renderKpiValue(value, zeroLabel, valueTone) {
    const numeric = Number(value);
    if (numeric === 0) {
        return `
          <div class="kpi-card-value zero">0</div>
          <div class="kpi-zero-hint">${escapeHtml(zeroLabel || '')}</div>
        `;
    }

    return `
      <div class="kpi-card-value" ${valueTone ? `style="color:${valueTone};"` : ''}>${escapeHtml(String(value))}</div>
    `;
}

function renderKpiCard({ label, value, zeroLabel, trendText, iconHtml, valueTone }) {
    const card = document.createElement('div');
    card.className = 'kpi-card';

    const footerHtml = trendText ? `
      <div class="kpi-card-footer">
        <span class="kpi-trend up">${escapeHtml(trendText)}</span>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="kpi-card-header">
        <span class="kpi-label">${escapeHtml(label)}</span>
        ${iconHtml}
      </div>
      ${renderKpiValue(value, zeroLabel, valueTone)}
      ${footerHtml}
    `;
    return card;
}

function renderKpiRow(role, stats) {
    const safe = stats || {};
    const row = document.createElement('div');
    row.className = role === 'admin' ? 'kpi-row-4' : 'kpi-row-3';

    if (role === 'admin') {
        const totalFiles = Number(safe.totalFiles || 0);
        const totalUsers = Number(safe.totalUsers || 0);
        const publicRecipes = Number(safe.publicRecipes || 0);
        const systemAlerts = Number(safe.systemAlerts || 0);

        row.appendChild(renderKpiCard({
            label: 'Total Documents',
            value: totalFiles,
            zeroLabel: 'No documents yet — upload the first one.',
            iconHtml: iconWrapperHTML('folder'),
        }));
        row.appendChild(renderKpiCard({
            label: 'Total Users',
            value: totalUsers,
            zeroLabel: 'No registered users yet.',
            iconHtml: iconWrapperHTML('users'),
        }));
        row.appendChild(renderKpiCard({
            label: 'Public Recipes',
            value: publicRecipes,
            zeroLabel: 'No shared recipes — mark a recipe as public.',
            iconHtml: iconWrapperHTML('book-open'),
        }));
        row.appendChild(renderKpiCard({
            label: 'System Alerts',
            value: systemAlerts,
            zeroLabel: 'No alerts in the last 24 hours.',
            iconHtml: iconWrapperHTML('alert-triangle'),
            valueTone: systemAlerts > 0 ? 'var(--warning)' : undefined
        }));
        return row;
    }

    if (role === 'staff') {
        const myRecipes = Number(safe.myRecipes || 0);
        const sharedSchedules = Number(safe.sharedSchedules || 0);
        const productionToday = Number(safe.productionToday || 0);

        row.appendChild(renderKpiCard({
            label: 'My Recipes',
            value: myRecipes,
            zeroLabel: 'You have no recipes yet — add your first one.',
            iconHtml: iconWrapperHTML('book-open'),
        }));
        row.appendChild(renderKpiCard({
            label: 'Shared Schedules',
            value: sharedSchedules,
            zeroLabel: 'No shared schedules available.',
            iconHtml: iconWrapperHTML('calendar'),
        }));
        row.appendChild(renderKpiCard({
            label: 'Production Batches',
            value: productionToday,
            zeroLabel: 'Nothing scheduled for today.',
            iconHtml: iconWrapperHTML('calendar'),
        }));
        return row;
    }

    // user
    const myInvoices = Number(safe.myInvoices || 0);
    const myReports = Number(safe.myReports || 0);
    const sharedDocs = Number(safe.sharedDocs || 0);

    row.appendChild(renderKpiCard({
        label: 'My Invoices',
        value: myInvoices,
        zeroLabel: 'No invoices yet — upload your first.',
        iconHtml: iconWrapperHTML('file-text')
    }));
    row.appendChild(renderKpiCard({
        label: 'My Reports',
        value: myReports,
        zeroLabel: 'No reports filed yet.',
        iconHtml: iconWrapperHTML('bar-chart')
    }));
    row.appendChild(renderKpiCard({
        label: 'Shared Documents',
        value: sharedDocs,
        zeroLabel: 'No shared documents from other users.',
        iconHtml: iconWrapperHTML('files')
    }));
    return row;
}

function renderOnboardingBanner(role, containerEl, stats) {
    const safeStats = stats || {};
    const values = Object.values(safeStats);
    const allZero = values.length > 0 && values.every((v) => Number(v) === 0);
    if (!allZero) return;

    const roleAction = {
        admin: 'Upload your first document to get started.',
        staff: 'Add your first recipe to begin.',
        user: 'Upload your first invoice to get started.',
    };

    const banner = document.createElement('div');
    banner.className = 'onboarding-banner';
    banner.innerHTML = `
      <div class="onboarding-banner-icon" style="display:flex;align-items:center;justify-content:center;">${icon('rocket')}</div>
      <div class="onboarding-banner-body">
        <strong>Welcome to BakeSync!</strong>
        <p>${escapeHtml(roleAction[role] || 'Get started by adding your first document.')}</p>
      </div>
      <a href="files.html?action=upload" class="btn btn-primary btn-sm">
        Get Started
      </a>
    `;

    containerEl.appendChild(banner);
}

function renderActivityFeed(activity) {
    const card = document.createElement('div');
    card.className = 'content-card dashboard-activity-card';
    card.innerHTML = `
      <h3>Recent Activity</h3>
      <div id="activity-feed"></div>
    `;
    const el = card.querySelector('#activity-feed');

    if (!activity || activity.length === 0) {
        el.innerHTML = `<div style="color: var(--muted-foreground); font-size: 0.875rem;">No recent activity.</div>`;
        return card;
    }

    function activityIconKey(type) {
        const t = type || 'upload';
        if (t === 'delete') return 'trash';
        if (t === 'view') return 'eye';
        if (t === 'login') return 'log-in';
        return 'upload';
    }

    el.innerHTML = activity
        .map((item) => {
            const rr = item.uploaderRole && ['admin', 'staff', 'user'].includes(item.uploaderRole)
                ? item.uploaderRole
                : '';
            const roleMod = rr ? ` activity-item--role-${rr}` : '';
            const ik = activityIconKey(item.type);
            return `
              <div class="activity-item activity-item-row${roleMod}">
                <div class="activity-item-icon" aria-hidden="true">${icon(ik)}</div>
                <div class="activity-body">
                  <div class="activity-text">
                    ${escapeHtml(item.text || '')}
                  </div>
                  <span class="activity-time"
                        title="${new Date(item.time).toLocaleString()}">
                    ${escapeHtml(timeAgo(item.time))}
                  </span>
                </div>
              </div>
            `;
        })
        .join('');
    return card;
}

/**
 * Admin-only panel showing recent denied DAC decisions.
 */
async function renderAccessDeniedLogPanel() {
    let safeLogs;
    try {
        const logs = await apiGet('/api/files/logs/denied');
        safeLogs = Array.isArray(logs) ? logs : [];
    } catch (error) {
        console.error('Denied access logs load error:', error);
        return null;
    }

    if (safeLogs.length === 0) return null;

    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
      <h3>DAC Access Denial Log</h3>
      <p class="text-sm text-muted denied-log-intro">
        Recent denied access attempts recorded by DAC rules.
      </p>
      <div id="denied-log-list"></div>
    `;

    const wrap = card.querySelector('#denied-log-list');
    wrap.innerHTML = safeLogs
        .map((log) => {
            const when = log.time ? timeAgo(log.time) : '—';
            const user = log.user || 'Unknown';
            const file = log.filename || 'Unknown file';
            const action = log.action || '—';
            const reason = log.reason || '—';

            return `
              <div class="denied-log-row">
                <div class="denied-log-dot" aria-hidden="true"></div>
                <div class="denied-log-body">
                  <div class="denied-log-action">${escapeHtml(action)} denied</div>
                  <div class="denied-log-meta">
                    User: ${escapeHtml(user)}<br/>
                    File: ${escapeHtml(file)}<br/>
                    Reason: ${escapeHtml(reason)}
                  </div>
                  <div class="denied-log-when">${escapeHtml(when)}</div>
                </div>
              </div>
            `;
        })
        .join('');

    return card;
}

function renderProductionScheduleTable(schedules, containerEl) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';

    section.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Production Schedules</h2>
          <p class="section-subtitle">
            Your schedules and shared team schedules
          </p>
        </div>
        <a href="files.html?type=schedule&action=upload"
           class="btn-ghost btn-sm">
          + Add Schedule
        </a>
      </div>
    `;

    if (!schedules || schedules.length === 0) {
        section.innerHTML += `
          <div class="empty-state">
            <div class="empty-state-icon" style="display:flex;justify-content:center;">${icon('calendar')}</div>
            <p class="empty-state-title">No schedules yet</p>
            <p class="empty-state-body">
              Upload a schedule document to see it here.
            </p>
            <a href="files.html?type=schedule&action=upload"
               class="btn-primary btn-sm">
              Add Schedule
            </a>
          </div>
        `;
        if (containerEl) containerEl.appendChild(section);
        return section;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Document</th>
          <th>Owner</th>
          <th>Visibility</th>
          <th>Uploaded</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${schedules.map((s) => `
          <tr>
            <td>
              <div class="file-name-cell" style="display:flex;align-items:center;gap:8px;">
                ${getFileTypeIconEl('schedule')}
                <span>${escapeHtml(s.filename)}</span>
              </div>
            </td>
            <td>${escapeHtml(s.owner || '—')}</td>
            <td>
              <span class="badge ${s.is_public ? 'badge-green' : 'badge-red'}">
                ${s.is_public ? 'Public' : 'Private'}
              </span>
            </td>
            <td>
              <span title="${new Date(s.time).toLocaleString()}">
                ${escapeHtml(timeAgo(s.time))}
              </span>
            </td>
            <td>
              <button class="btn-ghost btn-sm" type="button" onclick="openFileModal(${s.id})">
                View
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;

    section.appendChild(table);
    if (containerEl) containerEl.appendChild(section);
    return section;
}

function renderNotificationsPanel(notifications, containerEl) {
    const section = document.createElement('div');
    section.className = 'dashboard-section';

    const notifCount = Array.isArray(notifications) ? notifications.length : 0;

    section.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Notifications</h2>
          <p class="section-subtitle">
            Recently shared documents from your team
          </p>
        </div>
        ${notifCount > 0
            ? `<span class="badge badge-primary">${notifCount} new</span>`
            : ''
        }
      </div>
    `;

    if (!notifications || notifications.length === 0) {
        section.innerHTML += `
          <div class="empty-state">
            <div class="empty-state-icon" style="display:flex;justify-content:center;">${icon('bell')}</div>
            <p class="empty-state-title">No notifications</p>
            <p class="empty-state-body">
              When team members share documents, they will appear here.
            </p>
          </div>
        `;
        if (containerEl) containerEl.appendChild(section);
        return section;
    }

    const list = document.createElement('div');
    list.className = 'notification-list';

    notifications.forEach((n) => {
        const isRead = !!n.read;
        const item = document.createElement('div');
        item.className = `notification-item ${isRead ? 'read' : 'unread'}`;
        const uploaderBadge = n.uploaderRole ? `<span style="margin-left:6px;">${renderRoleBadge(n.uploaderRole)}</span>` : '';
        item.innerHTML = `
          <div class="notification-icon-wrap type-${escapeHtml(n.type || '')}">
            ${getFileTypeIconEl(n.type || '')}
          </div>
          <div class="notification-body">
            <p class="notification-message" style="display:flex;flex-wrap:wrap;align-items:center;">${escapeHtml(n.message || '')}${uploaderBadge}</p>
            <span class="notification-time"
                  title="${new Date(n.time).toLocaleString()}">
              ${escapeHtml(timeAgo(n.time))}
            </span>
          </div>
          ${!isRead ? '<div class="notification-dot"></div>' : ''}
        `;

        item.style.cursor = 'pointer';
        item.addEventListener('click', () => openFileModal(n.id));
        list.appendChild(item);
    });

    section.appendChild(list);
    if (containerEl) containerEl.appendChild(section);
    return section;
}

async function renderRoleDashboardContent(role) {
    const data = await apiGet(`/api/dashboard/${role}`);
    const main = document.getElementById('page-content');
    if (!main) return;
    main.innerHTML = '';

    // Header + Quick Actions
    main.appendChild(renderHeaderBlock(role));
    main.appendChild(renderQuickActions(role));

    // KPI cards
    const statsObj = data.stats || {};
    main.appendChild(renderKpiRow(role, statsObj));
    renderOnboardingBanner(role, main, statsObj);

    // Document Manager widget
    const widgetWrap = document.createElement('div');
    widgetWrap.style.marginTop = '1.5rem';
    main.appendChild(widgetWrap);
    await renderDocumentManagerWidget(role, widgetWrap, '/api/files');

    // Role-specific panels
    if (role === 'admin') {
        main.appendChild(renderActivityFeed(data.recentActivity || []));
        const deniedPanel = await renderAccessDeniedLogPanel();
        if (deniedPanel) main.appendChild(deniedPanel);
    } else if (role === 'staff') {
        renderProductionScheduleTable(data.schedule || [], main);
    } else if (role === 'user') {
        renderNotificationsPanel(data.notifications || [], main);
    }
}

// Override role entrypoints (used by HTML pages)
async function loadAdminDashboard() {
    if (!requireAuth()) return;
    const me = getCurrentUser();
    if (me.role !== 'admin') {
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Manager dashboard is restricted to Admin (Manager) role.')}&required=${encodeURIComponent('admin')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        return;
    }

    if (!document.getElementById('page-content')) return;
    try {
        await renderRoleDashboardContent('admin');
    } catch (error) {
        console.error('Admin dashboard error:', error);
        if (error && error.message === 'Unauthorized') {
            if (window.__bakesyncJwtExpiredRedirected) return;
            logout();
        }
    }
}

async function loadStaffDashboard() {
    if (!requireAuth()) return;
    const me = getCurrentUser();
    if (me.role !== 'staff') {
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Baker dashboard is restricted to Staff (Baker) role.')}&required=${encodeURIComponent('staff')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        return;
    }

    if (!document.getElementById('page-content')) return;
    try {
        await renderRoleDashboardContent('staff');
    } catch (error) {
        console.error('Staff dashboard error:', error);
        if (error && error.message === 'Unauthorized') {
            if (window.__bakesyncJwtExpiredRedirected) return;
            logout();
        }
    }
}

async function loadUserDashboard() {
    if (!requireAuth()) return;
    const me = getCurrentUser();
    if (me.role !== 'user') {
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Cashier dashboard is restricted to User (Cashier) role.')}&required=${encodeURIComponent('user')}&attempted=${encodeURIComponent(me.role)}&userRole=${encodeURIComponent(me.role)}`;
        return;
    }

    if (!document.getElementById('page-content')) return;
    try {
        await renderRoleDashboardContent('user');
    } catch (error) {
        console.error('User dashboard error:', error);
        if (error && error.message === 'Unauthorized') {
            if (window.__bakesyncJwtExpiredRedirected) return;
            logout();
        }
    }
}

// =======================================================
// Files page (Document Manager full) - initFilesPage()
// =======================================================

function getTabFromType(type) {
    if (!type) return 'all';
    return String(type);
}

function fileMatchesTab(file, tabKey) {
    if (tabKey === 'all') return true;
    return file.file_type === tabKey;
}

function renderFileCards(container, files, tabKey, searchQuery, callbacks = {}) {
    const query = String(searchQuery || '').trim().toLowerCase();
    const filtered = files.filter((f) => fileMatchesTab(f, tabKey));
    const searched = query
        ? filtered.filter((f) => String(f.filename || '').toLowerCase().includes(query))
        : filtered;

    const shown = searched.slice(0, 50); // files page shows all filtered results (not just 5)
    const highlightId = callbacks && callbacks.highlightFileId ? String(callbacks.highlightFileId) : null;
    if (shown.length === 0) {
        container.innerHTML = `
          <div class="widget-empty">
            <div class="widget-empty-icon" style="display:flex;justify-content:center;">${icon('folder')}</div>
            <div class="widget-empty-message">${escapeHtml(emptyStateMessage(tabKey))}</div>
            <a class="btn btn-primary" href="${escapeHtml(primaryUploadLink(tabKey))}">Add ${escapeHtml(fileTypeToLabel(tabKey).replace('Recipes', 'Recipe').replace('Invoices', 'Invoice'))}</a>
          </div>
        `;
        return;
    }

    container.innerHTML = shown
        .map((file) => {
            const typeKey = file.file_type;
            const isOwner = !!file.isOwner;
            const isPublic = file.is_public === 1 || file.is_public === true;
            const visibilityLabel = isPublic ? 'Public' : 'Private';
            const ownerLabel = formatFileOwnerLabel(file);
            const sizeLabel = formatFileSizeKb(file.file_size_kb);
            const dateLabel = file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
            const lockedOther = !isPublic && !isOwner;
            const lockedOwner = !isPublic && isOwner;

            const cardLocked = lockedOther
                ? `<div class="file-card-locked" style="display:flex;gap:6px;align-items:center;">${icon('lock')} Access restricted</div>`
                : lockedOwner
                    ? `<div class="file-card-locked file-card-locked-muted" style="display:flex;gap:6px;align-items:center;">${icon('lock')} Your private file</div>`
                    : '';

            return `
              <div class="file-card ${highlightId && String(file.id) === highlightId ? 'card-updated' : ''}">
                <div class="file-card-icon">
                  ${fileTypeIcon(typeKey)}
                </div>
                <div class="file-card-body">
                  <div class="file-card-name">${escapeHtml(file.filename || '')}</div>
                  <div class="file-card-meta">
                    <span class="file-type-badge file-kind">${escapeHtml(typeKey)}</span>
                    <span class="visibility-pill ${isPublic ? 'is-public' : 'is-private'}">${escapeHtml(visibilityLabel)}</span>
                    <span class="file-owner">${escapeHtml(ownerLabel)}</span>
                    ${sizeLabel ? `<span class="file-size-meta">${escapeHtml(sizeLabel)}</span>` : ''}
                    <span class="file-date">${escapeHtml(dateLabel)}</span>
                  </div>
                </div>
                <div class="file-card-actions">
                  <button class="btn btn-ghost btn-sm" type="button" data-view-file="${escapeHtml(String(file.id))}">View</button>
                  ${isOwner ? `<button class="btn btn-ghost btn-sm" type="button" data-toggle-visibility="${escapeHtml(String(file.id))}">${isPublic ? 'Make Private' : 'Make Public'}</button>` : ''}
                  ${isOwner ? `<button class="btn btn-ghost btn-sm btn-danger" type="button" data-delete-file="${escapeHtml(String(file.id))}">Delete</button>` : ''}
                </div>
                ${cardLocked}
              </div>
            `;
        })
        .join('');

    container.querySelectorAll('[data-view-file]').forEach((btn) => {
        btn.addEventListener('click', async () => openFileModal(btn.getAttribute('data-view-file')));
    });

    container.querySelectorAll('[data-delete-file]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const fileId = btn.getAttribute('data-delete-file');
            const cardEl = btn.closest('.file-card');
            const actionsEl = cardEl?.querySelector('.file-card-actions');
            if (!actionsEl) return;

            actionsEl.innerHTML = `
              <span class="delete-confirm-text">Delete this file?</span>
              <button class="btn btn-destructive btn-sm confirm-yes" type="button">Delete</button>
              <button class="btn btn-ghost btn-sm confirm-no" type="button">Cancel</button>
            `;

            const confirmYes = actionsEl.querySelector('.confirm-yes');
            const confirmNo = actionsEl.querySelector('.confirm-no');

            if (confirmNo) {
                confirmNo.addEventListener('click', () => {
                    renderFileCards(container, files, tabKey, searchQuery, callbacks);
                });
            }

            if (confirmYes) {
                confirmYes.addEventListener('click', async () => {
                    confirmYes.disabled = true;
                    confirmYes.textContent = 'Deleting...';

                    try {
                        await apiDelete(`/api/files/${fileId}`);
                        showToast('File deleted successfully.', 'success');
                        if (typeof callbacks.onDelete === 'function') callbacks.onDelete(fileId);
                    } catch (e) {
                        showToast(String(e.message || 'Delete failed'), 'error');
                        renderFileCards(container, files, tabKey, searchQuery, callbacks);
                    }
                });
            }
        });
    });

    container.querySelectorAll('[data-toggle-visibility]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const fileId = btn.getAttribute('data-toggle-visibility');
            const file = files.find((f) => String(f.id) === String(fileId));
            if (!file) return;
            const nextIsPublic = !(file.is_public === 1 || file.is_public === true);

            try {
                await apiPatch(`/api/files/${fileId}/visibility`, { is_public: nextIsPublic ? 1 : 0 });
                file.is_public = nextIsPublic ? 1 : 0;
                if (typeof callbacks.onVisibilityToggle === 'function') callbacks.onVisibilityToggle(fileId, nextIsPublic);
            } catch (e) {
                showToast(String(e.message || 'Update failed'), 'error');
            }
        });
    });
}

async function initFilesPage() {
    if (!requireAuth()) return;
    const params = new URLSearchParams(window.location.search);
    const typeFilter = params.get('type');
    const action = params.get('action');

    const role = getCurrentUser().role;
    const ROLE_DEFAULT_FILE_TYPE = { admin: 'recipe', staff: 'recipe', user: 'invoice' };
    const roleDefaultType = ROLE_DEFAULT_FILE_TYPE[role] || 'recipe';
    const defaultType = role === 'admin' ? 'all' : role === 'staff' ? 'recipe' : 'invoice';

    const activeTab = getTabFromType(typeFilter) || defaultType;
    let currentTab = activeTab;
    let searchQuery = '';

    const files = document.getElementById('files-cards');
    const tabsEl = document.getElementById('files-filter-tabs');
    const searchEl = document.getElementById('files-search');
    const uploadPanel = document.getElementById('files-upload-panel');
    const filenameInput = document.getElementById('files-upload-filename');
    const typeSelect = document.getElementById('files-upload-type');
    const toggleBtn = document.getElementById('files-upload-toggle');
    const cancelBtn = document.getElementById('files-upload-cancel');
    const submitBtn = document.getElementById('files-upload-submit');
    const fileInput = document.getElementById('files-file-input');
    const dropZone = document.getElementById('file-drop-zone');
    const selectedPreview = document.getElementById('files-selected-preview');
    const selectedNameEl = document.getElementById('files-selected-name');
    const clearFileBtn = document.getElementById('files-clear-file');
    const progressWrap = document.getElementById('upload-progress-wrap');
    const progressFill = document.getElementById('upload-progress-fill');
    const progressText = document.getElementById('upload-progress-text');

    if (!files || !tabsEl) return;

    const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
    let selectedFile = null;

    // Load file data once; dedupe by id so tab counts stay accurate.
    let allFiles = dedupeFilesById(await apiGet('/api/files').then((x) => (Array.isArray(x) ? x : [])));
    allFiles = allFiles.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    let uploadPanelOpen = action === 'upload';
    let highlightFileId = null;

    function pushFilesUrl() {
        const url = new URL(window.location.href);
        if (uploadPanelOpen) url.searchParams.set('action', 'upload');
        else url.searchParams.delete('action');
        if (currentTab === 'all') url.searchParams.delete('type');
        else url.searchParams.set('type', currentTab);
        const qs = url.searchParams.toString();
        history.pushState({}, '', qs ? `${url.pathname}?${qs}` : url.pathname);
        if (typeof setActiveNavItem === 'function') setActiveNavItem();
        if (typeof renderBreadcrumb === 'function') renderBreadcrumb();
    }

    function syncUploadToggleUi() {
        if (!toggleBtn) return;
        if (uploadPanelOpen) {
            toggleBtn.textContent = 'Close upload';
            toggleBtn.classList.remove('btn-primary');
            toggleBtn.classList.add('btn-outline');
        } else {
            toggleBtn.textContent = '+ Add New Document';
            toggleBtn.classList.add('btn-primary');
            toggleBtn.classList.remove('btn-outline');
        }
    }

    function setSelectedFile(file) {
        selectedFile = file || null;
        if (selectedPreview) selectedPreview.style.display = selectedFile ? 'flex' : 'none';
        if (selectedNameEl && selectedFile) {
            selectedNameEl.textContent = `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`;
        }
        if (filenameInput && selectedFile && !String(filenameInput.value || '').trim()) {
            filenameInput.value = selectedFile.name;
        }
    }

    function setActiveTab(tabKey) {
        currentTab = tabKey;
        rerender();
    }

    // Render tabs
    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'recipe', label: 'Recipes' },
        { key: 'report', label: 'Reports' },
        { key: 'schedule', label: 'Schedules' },
        { key: 'invoice', label: 'Invoices' }
    ];

    function refreshTabs() {
        const counts = {
            all: allFiles.length,
            recipe: allFiles.filter((f) => f.file_type === 'recipe').length,
            report: allFiles.filter((f) => f.file_type === 'report').length,
            schedule: allFiles.filter((f) => f.file_type === 'schedule').length,
            invoice: allFiles.filter((f) => f.file_type === 'invoice').length
        };

        tabsEl.innerHTML = tabs
            .map((t) => {
                const count = counts[t.key] || 0;
                const badge = count > 0 ? `<span class="tab-badge">${count}</span>` : '';
                return `<button type="button" class="filter-tab ${t.key === currentTab ? 'active' : ''}" data-tab="${t.key}">${t.label}${badge}</button>`;
            })
            .join('');
    }

    refreshTabs();

    function rerender() {
        refreshTabs();
        renderFileCards(files, allFiles, currentTab, searchQuery, {
            highlightFileId,
            onDelete: (deletedFileId) => {
                allFiles = allFiles.filter((f) => String(f.id) !== String(deletedFileId));
                rerender();
            },
            onVisibilityToggle: (fileId, nextIsPublic) => {
                highlightFileId = fileId;
                allFiles = allFiles.map((f) => (String(f.id) === String(fileId) ? { ...f, is_public: nextIsPublic ? 1 : 0 } : f));
                rerender();
                highlightFileId = null;

                showToast(
                    nextIsPublic
                        ? 'File is now public — visible to all users.'
                        : 'File is now private — only you can access it.',
                    'success'
                );
            }
        });
    }

    function openUploadPanel() {
        if (!uploadPanel) return;
        uploadPanelOpen = true;
        uploadPanel.classList.remove('collapsed');
        uploadPanel.classList.add('open');
        syncUploadToggleUi();
        pushFilesUrl();
        if (filenameInput) filenameInput.focus();
    }

    function closeUploadPanel() {
        if (!uploadPanel) return;
        uploadPanelOpen = false;
        uploadPanel.classList.remove('open');
        uploadPanel.classList.add('collapsed');
        if (progressWrap) progressWrap.style.display = 'none';
        if (progressFill) progressFill.style.width = '0%';
        syncUploadToggleUi();
        pushFilesUrl();
    }

    function applyUrlFromLocation() {
        const p = new URLSearchParams(window.location.search);
        const t = p.get('type');
        let next = t ? getTabFromType(t) : defaultType;
        if (!['all', 'recipe', 'report', 'schedule', 'invoice'].includes(next)) next = defaultType;
        currentTab = next;
        uploadPanelOpen = p.get('action') === 'upload';
        if (uploadPanel) {
            if (uploadPanelOpen) {
                uploadPanel.classList.remove('collapsed');
                uploadPanel.classList.add('open');
            } else {
                uploadPanel.classList.remove('open');
                uploadPanel.classList.add('collapsed');
            }
        }
        syncUploadToggleUi();
        if (typeSelect) typeSelect.value = currentTab !== 'all' ? currentTab : roleDefaultType;
        rerender();
        updateFilesPageTitle(currentTab);
    }

    window.addEventListener('popstate', applyUrlFromLocation);

    document.addEventListener(
        'click',
        function bakesyncFilesSidebarSpa(ev) {
            const a = ev.target.closest('a.sidebar-link[href*="files.html"]');
            if (!a || !a.closest('.sidebar')) return;
            if (!window.location.pathname.endsWith('files.html')) return;
            ev.preventDefault();
            ev.stopImmediatePropagation();
            const u = new URL(a.getAttribute('href'), window.location.origin);
            const type = u.searchParams.get('type');
            const act = u.searchParams.get('action');
            let next = type ? getTabFromType(type) : 'all';
            if (!['all', 'recipe', 'report', 'schedule', 'invoice'].includes(next)) next = 'all';
            currentTab = next;
            uploadPanelOpen = act === 'upload';
            if (uploadPanel) {
                if (uploadPanelOpen) {
                    uploadPanel.classList.remove('collapsed');
                    uploadPanel.classList.add('open');
                } else {
                    uploadPanel.classList.remove('open');
                    uploadPanel.classList.add('collapsed');
                }
            }
            syncUploadToggleUi();
            if (typeSelect) typeSelect.value = currentTab !== 'all' ? currentTab : roleDefaultType;
            pushFilesUrl();
            rerender();
            updateFilesPageTitle(currentTab);
        },
        true
    );

    rerender();
    updateFilesPageTitle(currentTab);
    if (typeof renderBreadcrumb === 'function') renderBreadcrumb();

    tabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-tab');
        if (!btn) return;
        const nextTab = btn.getAttribute('data-tab');
        setActiveTab(nextTab);
        if (typeSelect) {
            typeSelect.value = nextTab !== 'all' ? nextTab : roleDefaultType;
        }
        pushFilesUrl();
        updateFilesPageTitle(nextTab);
    });

    if (searchEl) {
        const handleSearch = debounce(function () {
            searchQuery = searchEl.value;
            rerender();
        }, 200);
        searchEl.addEventListener('input', handleSearch);
    }

    if (uploadPanel) {
        if (uploadPanelOpen) {
            uploadPanel.classList.remove('collapsed');
            uploadPanel.classList.add('open');
        } else {
            uploadPanel.classList.remove('open');
            uploadPanel.classList.add('collapsed');
        }
    }
    syncUploadToggleUi();

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (uploadPanelOpen) closeUploadPanel();
            else openUploadPanel();
        });
    }
    if (cancelBtn) cancelBtn.addEventListener('click', closeUploadPanel);

    const defaultUploadType = currentTab !== 'all' ? currentTab : (role === 'user' ? 'invoice' : 'recipe');
    if (typeSelect) typeSelect.value = defaultUploadType;

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const f = fileInput.files && fileInput.files[0];
            if (f) {
                if (f.size > MAX_UPLOAD_BYTES) {
                    showToast('File exceeds 250 MB limit.', 'error');
                    fileInput.value = '';
                    setSelectedFile(null);
                    return;
                }
                setSelectedFile(f);
            }
        });
    }

    if (clearFileBtn) {
        clearFileBtn.addEventListener('click', () => {
            if (fileInput) fileInput.value = '';
            setSelectedFile(null);
        });
    }

    if (dropZone && fileInput) {
        ['dragenter', 'dragover'].forEach((ev) => {
            dropZone.addEventListener(ev, (e) => {
                e.preventDefault();
                dropZone.classList.add('file-drop-zone-active');
            });
        });
        ['dragleave', 'drop'].forEach((ev) => {
            dropZone.addEventListener(ev, (e) => {
                e.preventDefault();
                dropZone.classList.remove('file-drop-zone-active');
            });
        });
        dropZone.addEventListener('drop', (e) => {
            const f = e.dataTransfer.files && e.dataTransfer.files[0];
            if (!f) return;
            if (f.size > MAX_UPLOAD_BYTES) {
                showToast('File exceeds 250 MB limit.', 'error');
                return;
            }
            setSelectedFile(f);
        });
        dropZone.addEventListener('click', () => fileInput.click());
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const filename = document.getElementById('files-upload-filename')?.value?.trim();
            const file_type = document.getElementById('files-upload-type')?.value;
            const description = document.getElementById('files-upload-description')?.value?.trim() || '';
            const isPublicFlag = document.querySelector('input[name="files-is-public"]:checked')?.value === '1';

            if (!filename && !selectedFile) {
                showToast('Choose a file or enter a filename.', 'error');
                return;
            }

            if (selectedFile && selectedFile.size > MAX_UPLOAD_BYTES) {
                showToast('File exceeds 250 MB limit.', 'error');
                return;
            }

            try {
                if (typeof apiUploadMultipart !== 'function') {
                    throw new Error('Upload helper missing');
                }

                if (selectedFile) {
                    const fd = new FormData();
                    fd.append('file', selectedFile);
                    fd.append('filename', filename || selectedFile.name);
                    fd.append('file_type', file_type);
                    if (description) fd.append('description', description);
                    fd.append('is_public', isPublicFlag ? '1' : '0');

                    if (progressWrap) progressWrap.style.display = 'block';
                    if (progressFill) progressFill.style.width = '0%';
                    if (progressText) progressText.textContent = 'Uploading…';

                    await apiUploadMultipart('/api/files', fd, (loaded, total) => {
                        const pct = total ? Math.round((loaded / total) * 100) : 0;
                        if (progressFill) progressFill.style.width = `${pct}%`;
                        if (progressText) {
                            const mbL = (loaded / (1024 * 1024)).toFixed(1);
                            const mbT = (total / (1024 * 1024)).toFixed(1);
                            progressText.textContent = `${pct}% (${mbL} MB / ${mbT} MB)`;
                        }
                    });
                } else {
                    await apiPost('/api/files', {
                        filename,
                        description: description || null,
                        file_type,
                        is_public: isPublicFlag,
                    });
                }

                allFiles = dedupeFilesById(await apiGet('/api/files').then((x) => (Array.isArray(x) ? x : [])));
                allFiles = allFiles.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                if (fileInput) fileInput.value = '';
                setSelectedFile(null);
                document.getElementById('files-upload-description').value = '';
                document.getElementById('files-upload-filename').value = '';
                closeUploadPanel();
                showToast('File uploaded successfully.', 'success');
                rerender();
            } catch (e) {
                showToast(String(e.message || 'Upload failed'), 'error');
                if (progressWrap) progressWrap.style.display = 'none';
            }
        });
    }
}

function initPageTransitions() {
    document.addEventListener('click', function (e) {
        if (e.defaultPrevented) return;
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        if (
            href.startsWith('http') ||
            href.startsWith('//') ||
            href.startsWith('#') ||
            href.startsWith('mailto') ||
            href.toLowerCase().startsWith('javascript')
        ) return;

        if (link.target === '_blank') return;
        if (link.hasAttribute('download')) return;

        e.preventDefault();

        const pageContent =
            document.querySelector('.page-content') ||
            document.querySelector('.auth-container .card') ||
            document.body;

        pageContent.classList.add('page-exit');

        setTimeout(() => {
            window.location.href = href;
        }, 180);
    });
}

initPageTransitions();

