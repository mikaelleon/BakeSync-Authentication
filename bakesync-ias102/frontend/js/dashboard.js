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

function safeTextById(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
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
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Manager dashboard is restricted to Admin (Manager) role.')}`;
        return;
    }

    try {
        const data = await apiGet('/api/dashboard/admin');

        // Update KPIs
        const adminStats = data.stats || {};
        const adminTrends = data.trends || {};
        safeTextById('kpi-total-files', String(adminStats.totalFiles ?? '-'));
        safeTextById('kpi-total-users', String(adminStats.totalUsers ?? '-'));
        safeTextById('kpi-public-recipes', String(adminStats.publicRecipes ?? '-'));
        safeTextById('kpi-system-alerts', String(adminStats.systemAlerts ?? '-'));
        safeTextById('kpi-total-files-trend', `↑ ${adminTrends.filesAddedThisWeek ?? 0} this week`);
        safeTextById('kpi-total-users-trend', `↑ ${adminTrends.newRegistrationsThisWeek ?? 0} new registrations`);
        safeTextById('kpi-public-recipes-trend', `↑ ${adminTrends.publicRecipesSharedThisWeek ?? 0} shared this week`);
        safeTextById('kpi-system-alerts-trend', `↓ ${adminTrends.systemAlertsThisWeek ?? 0} this week`);

        // Populate activity list
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        activityList.innerHTML = '';

        (data.recentActivity || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="action">${item.text || ''}</span>
                <span class="time">${item.time ? timeAgo(item.time) : ''}</span>
            `;
            activityList.appendChild(li);
        });

        // Document Manager widget (inline preview)
        const docmgrRoot = document.getElementById('dashboard-docmgr');
        await initDashboardDocumentManagerPreview(docmgrRoot, 'admin');
    } catch (error) {
        console.error('Dashboard load error:', error);
        if (error.message === 'Unauthorized') {
            logout();
        }
        if (String(error.message || '').toLowerCase().includes('forbidden')) {
            window.location.href = `access-denied.html?reason=${encodeURIComponent('You do not have permission to access this dashboard.')}`;
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
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Baker dashboard is restricted to Staff (Baker) role.')}`;
        return;
    }

    try {
        const data = await apiGet('/api/dashboard/staff');

        // Update KPIs
        const staffStats = data.stats || {};
        const staffTrends = data.trends || {};
        safeTextById('kpi-my-recipes', String(staffStats.myRecipes ?? '-'));
        safeTextById('kpi-shared-schedules', String(staffStats.sharedSchedules ?? '-'));
        safeTextById('kpi-production-batches', String(staffStats.productionToday ?? '-'));
        safeTextById('kpi-my-recipes-trend', `↑ ${staffTrends.myRecipesAddedThisMonth ?? 0} added this month`);
        safeTextById('kpi-shared-schedules-trend', `↑ ${staffTrends.sharedSchedulesActiveThisWeek ?? 0} active this week`);
        safeTextById('kpi-production-batches-trend', `↑ ${staffStats.productionToday ?? 0} scheduled today`);

        // Populate schedule table
        const scheduleBody = document.getElementById('schedule-body');
        if (scheduleBody) scheduleBody.innerHTML = '';

        (data.schedule || []).forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.time}</td>
                <td>${item.task || item.batchName || '-'}</td>
                <td class="status-${item.status}">${String(item.status || 'pending').replace('_', ' ')}</td>
            `;
            if (scheduleBody) scheduleBody.appendChild(tr);
        });

        const docmgrRoot = document.getElementById('dashboard-docmgr');
        await initDashboardDocumentManagerPreview(docmgrRoot, 'staff');
    } catch (error) {
        console.error('Dashboard load error:', error);
        if (error.message === 'Unauthorized') {
            logout();
        }
        if (String(error.message || '').toLowerCase().includes('forbidden')) {
            window.location.href = `access-denied.html?reason=${encodeURIComponent('You do not have permission to access this dashboard.')}`;
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
        window.location.href = `access-denied.html?reason=${encodeURIComponent('Cashier dashboard is restricted to User (Cashier) role.')}`;
        return;
    }

    try {
        const data = await apiGet('/api/dashboard/user');

        // Update KPIs
        const s = data.stats || {};
        const t = data.trends || {};
        safeTextById('kpi-my-invoices', String(s.myInvoices ?? '-'));
        safeTextById('kpi-my-reports', String(s.myReports ?? '-'));
        safeTextById('kpi-shared-docs', String(s.sharedDocs ?? '-'));
        safeTextById('kpi-my-invoices-trend', `↑ ${t.myInvoicesThisMonth ?? 0} this month`);
        safeTextById('kpi-my-reports-trend', `↑ ${t.myReportsFiledThisWeek ?? 0} filed this week`);
        safeTextById('kpi-shared-docs-trend', `↑ ${t.sharedDocsThisWeek ?? 0} accessible this week`);

        // Populate notifications
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;
        notificationList.innerHTML = '';

        (data.notifications || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="message">${item.message}</div>
                <div class="time">${item.time}</div>
            `;
            notificationList.appendChild(li);
        });

        const docmgrRoot = document.getElementById('dashboard-docmgr');
        await initDashboardDocumentManagerPreview(docmgrRoot, 'user');
    } catch (error) {
        console.error('Dashboard load error:', error);
        if (error.message === 'Unauthorized') {
            logout();
        }
        if (String(error.message || '').toLowerCase().includes('forbidden')) {
            window.location.href = `access-denied.html?reason=${encodeURIComponent('You do not have permission to access this dashboard.')}`;
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

/**
 * Relative time formatter (used by activity feed)
 * - < 60s  => Just now
 * - < 60m  => X minutes ago
 * - < 24h  => X hours ago
 * - >= 24h => Mar 19, 2026
 */
function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return Math.floor(diffSeconds / 60) + ' minutes ago';
    if (diffSeconds < 86400) return Math.floor(diffSeconds / 3600) + ' hours ago';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
}

/**
 * Toast notification (bottom-right)
 * type: success | error
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    toast.textContent = message;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

function getFileTypeLabel(type) {
    switch (type) {
        case 'recipe': return 'Recipes';
        case 'report': return 'Reports';
        case 'schedule': return 'Schedules';
        case 'invoice': return 'Invoices';
        default: return 'All';
    }
}

function getFileTypeIconClass(fileType) {
    switch (fileType) {
        case 'recipe': return 'file-icon-recipe';
        case 'report': return 'file-icon-report';
        case 'schedule': return 'file-icon-schedule';
        case 'invoice': return 'file-icon-invoice';
        default: return '';
    }
}

function getFileTypeEmoji(fileType) {
    switch (fileType) {
        case 'recipe': return '📘';
        case 'report': return '📊';
        case 'schedule': return '🗓️';
        case 'invoice': return '🧾';
        default: return '📁';
    }
}

function renderFileCardHTML(file) {
    const filename = escapeHtml(file.filename || '');
    const fileType = file.file_type || '';
    const ownerLabel = file.isOwner ? 'You' : (file.owner_id ? 'Shared' : 'Shared');
    const date = file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    const visibilityBadge = file.is_public
        ? `<span class="file-type-badge" style="border-color: rgba(22, 163, 74, 0.35); background: rgba(22, 163, 74, 0.06); color: var(--success);">Public</span>`
        : `<span class="file-card-locked-badge">Private</span>`;

    const privateNonOwner = !file.isOwner && !file.is_public;
    const lockedOverlay = privateNonOwner
        ? `<div class="file-card-locked-overlay">🔒 Access restricted</div>`
        : '';

    const lockBadgeText = !file.is_public && file.isOwner ? 'Your private file' : (!file.is_public ? 'Access restricted' : '');
    const ownerMeta = file.is_public
        ? `<span class="file-owner">${escapeHtml(ownerLabel)}</span>`
        : `<span class="file-owner">${escapeHtml(file.isOwner ? 'Your private file' : 'Access restricted')}</span>`;

    const typeBadge = `<span class="file-type-badge ${escapeHtml(fileType)}">${escapeHtml(fileType.charAt(0).toUpperCase() + fileType.slice(1))}</span>`;

    return `
        <div class="file-card ${privateNonOwner ? 'private-nonowner' : ''}">
            ${lockedOverlay}
            <div class="file-card-left">
                <div class="file-card-icon ${getFileTypeIconClass(fileType)}" aria-hidden="true">
                    ${getFileTypeEmoji(fileType)}
                </div>
                <div class="file-card-body">
                    <div class="file-card-name">${filename}</div>
                    <div class="file-card-meta">
                        ${typeBadge}
                        ${ownerMeta}
                        ${date ? `<span class="file-date">${escapeHtml(date)}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="file-card-actions">
                <button class="btn btn-ghost btn-small" type="button" onclick="viewFile(${file.id})">View</button>
            </div>
        </div>
    `;
}

/**
 * Document Manager preview widget (used inside dashboards)
 * Expects the dashboard page to have:
 * - #docmgr-list
 * - #docmgr-upload-btn
 * - #docmgr-upload-panel
 * - upload form fields inside #docmgr-upload-form with ids:
 *   docmgr-filename, docmgr-type, docmgr-description, docmgr-is-public
 */
async function initDashboardDocumentManagerPreview(rootEl, role) {
    if (!rootEl) return;

    const listEl = rootEl.querySelector('#docmgr-list');
    const countEl = rootEl.querySelector('#docmgr-count');
    const uploadBtn = rootEl.querySelector('#docmgr-upload-btn');
    const uploadPanel = rootEl.querySelector('#docmgr-upload-panel');
    const uploadForm = rootEl.querySelector('#docmgr-upload-form');

    if (!listEl || !uploadBtn || !uploadPanel || !uploadForm) return;

    const effectiveDefaultType = role === 'user' ? 'invoice' : 'recipe';

    const tabs = [
        { key: 'all', label: 'All', type: null },
        { key: 'recipe', label: 'Recipes', type: 'recipe' },
        { key: 'report', label: 'Reports', type: 'report' },
        { key: 'schedule', label: 'Schedules', type: 'schedule' },
        { key: 'invoice', label: 'Invoices', type: 'invoice' },
    ];

    let state = {
        files: [],
        selectedType: role === 'user' ? 'invoice' : (role === 'staff' ? 'recipe' : 'all'),
        // In dashboards we want "Recipes" as default except Cashier -> Invoices
    };

    const normalizeSelectedType = () => {
        if (state.selectedType === 'all') return null;
        return state.selectedType;
    };

    function renderTabs() {
        const tabsEl = rootEl.querySelector('#docmgr-tabs');
        if (!tabsEl) return;

        tabsEl.innerHTML = '';
        tabs.forEach((t) => {
            const key = t.key;
            const active = (t.type === null && state.selectedType === 'all') || (t.type !== null && state.selectedType === t.type);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'file-type-tab' + (active ? ' active' : '');
            btn.textContent = t.label;
            btn.addEventListener('click', () => {
                state.selectedType = key;
                render();
            });
            tabsEl.appendChild(btn);
        });
    }

    function renderEmptyMessage(type) {
        const empty = rootEl.querySelector('#docmgr-empty');
        if (!empty) return;

        const map = {
            all: 'No documents yet. Add your first file.',
            recipe: 'No recipes yet. Add your first recipe.',
            report: 'No reports found.',
            schedule: 'No schedules available.',
            invoice: 'No invoices found.'
        };

        empty.style.display = 'block';
        const msg = map[type] || map.all;
        empty.innerHTML = `
            <div class="docmgr-empty">
                <div class="empty-icon" aria-hidden="true">📁</div>
                <div style="font-weight:700; margin-bottom: 0.5rem;">${escapeHtml(msg)}</div>
                <button class="btn btn-primary" type="button" onclick="window.location.href='files.html?type=${escapeHtml(type)}&action=upload'">
                    Add ${escapeHtml(getFileTypeLabel(type).replace('s',''))}
                </button>
            </div>
        `;
    }

    function renderList() {
        const type = normalizeSelectedType();
        const filtered = type ? state.files.filter(f => f.file_type === type) : state.files.slice();

        const shown = filtered.slice(0, 5);

        if (countEl) countEl.textContent = `${filtered.length} document(s)`;

        if (!shown.length) {
            listEl.innerHTML = '';
            renderEmptyMessage(state.selectedType === 'all' ? 'all' : state.selectedType);
            return;
        }

        const emptyEl = rootEl.querySelector('#docmgr-empty');
        if (emptyEl) emptyEl.style.display = 'none';

        listEl.innerHTML = shown.map(renderFileCardHTML).join('');
    }

    function renderUploadPanel() {
        // Default type selector: active tab first, otherwise role default.
        const defaultType = state.selectedType && state.selectedType !== 'all'
            ? state.selectedType
            : effectiveDefaultType;
        const typeSelect = rootEl.querySelector('#docmgr-type');
        if (typeSelect && typeSelect.value !== defaultType) {
            typeSelect.value = defaultType;
        }
    }

    function collapseUploadPanel() {
        uploadPanel.classList.add('collapsed');
    }

    function expandUploadPanel() {
        uploadPanel.classList.remove('collapsed');
        const filename = rootEl.querySelector('#docmgr-filename');
        if (filename) filename.focus();
        uploadPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const cancelBtn = rootEl.querySelector('#docmgr-upload-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            collapseUploadPanel();
        });
    }

    uploadBtn.addEventListener('click', () => {
        const collapsed = uploadPanel.classList.contains('collapsed');
        if (collapsed) expandUploadPanel();
        else collapseUploadPanel();
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const filename = rootEl.querySelector('#docmgr-filename').value.trim();
        const description = rootEl.querySelector('#docmgr-description').value.trim();
        const fileType = rootEl.querySelector('#docmgr-type').value;
        const isPublic = rootEl.querySelector('#docmgr-is-public').checked;

        if (!filename || !fileType) {
            showToast('Filename and file type are required.', 'error');
            return;
        }

        try {
            await apiPost('/api/files', {
                filename,
                description: description || '',
                file_type: fileType,
                is_public: isPublic
            });
            showToast('File added successfully.', 'success');

            // Re-fetch accessible files once after upload, then filter locally.
            state.files = await apiGet('/api/files');
            collapseUploadPanel();
            render();
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Upload failed', 'error');
        }
    });

    function render() {
        renderTabs();
        renderList();
        renderUploadPanel();
    }

    // Initial fetch
    state.files = await apiGet('/api/files');
    renderTabs();
    renderUploadPanel();

    // Initial list
    renderList();

    // Show upload panel collapsed by default
    collapseUploadPanel();
}
