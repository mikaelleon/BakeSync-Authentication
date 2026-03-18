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
    } catch (error) {
        console.error('Dashboard load error:', error);
        if (error.message === 'Unauthorized') {
            logout();
        }
    }
}
