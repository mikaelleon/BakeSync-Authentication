// BakeSync Dashboard Logic

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
        roleEl.textContent = getRoleDisplayName(user.role);
        roleEl.className = `badge ${getRoleBadgeClass(user.role)}`;
    }

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

    try {
        const data = await apiGet('/api/dashboard/admin');

        // Update stats
        document.getElementById('stat-users').textContent = data.stats.totalUsers;
        document.getElementById('stat-files').textContent = data.stats.totalFiles;
        document.getElementById('stat-alerts').textContent = data.stats.systemAlerts;

        // Populate activity list
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = '';

        data.recentActivity.forEach(item => {
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
    }
}

/**
 * Load staff dashboard data
 */
async function loadStaffDashboard() {
    if (!requireAuth()) return;

    initNavbar();

    try {
        const data = await apiGet('/api/dashboard/staff');

        // Update stats
        document.getElementById('stat-recipes').textContent = data.stats.recipesManaged;
        document.getElementById('stat-production').textContent = data.stats.productionToday;

        // Populate schedule table
        const scheduleBody = document.getElementById('schedule-body');
        scheduleBody.innerHTML = '';

        data.schedule.forEach(item => {
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
    }
}

/**
 * Load user dashboard data
 */
async function loadUserDashboard() {
    if (!requireAuth()) return;

    initNavbar();

    try {
        const data = await apiGet('/api/dashboard/user');

        // Update stats
        document.getElementById('stat-orders').textContent = data.stats.ordersToday;

        // Populate notifications
        const notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = '';

        data.notifications.forEach(item => {
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
