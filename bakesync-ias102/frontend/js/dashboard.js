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

// =======================================================
// IAS102 Shared utilities + new Dashboard/Files behavior
// =======================================================

// Relative time formatter (used by activity feed + notifications)
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
    // Keep type icons simple and consistent across widget + files page.
    // Uses emoji-like glyphs but wrapped in SVG for consistent sizing.
    const key = fileTypeToColorClass(type);
    const styles = {
        recipe: 'color: var(--success);',
        report: 'color: #3b82f6;',
        schedule: 'color: var(--warning);',
        invoice: 'color: #a855f7;'
    }[key] || 'color: var(--success);';

    // Small inline icon shapes
    const glyph = key === 'recipe' ? '📖' : key === 'report' ? '📊' : key === 'schedule' ? '📅' : '🧾';
    return `
      <div class="file-type-icon ${key}" style="${styles}" aria-hidden="true">
        ${glyph}
      </div>
    `;
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
    let modal = document.getElementById('access-denied-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'access-denied-modal';
        modal.className = 'modal-overlay show';
        modal.style.zIndex = '1200';
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
    const modal = ensureFileModal();
    const body = modal.querySelector('#modal-body');
    const title = modal.querySelector('#modal-title');

    modal.classList.add('show');
    modal.style.display = 'flex';

    body.innerHTML = `<div class="loading" style="padding:0.5rem 0;">Loading...</div>`;

    try {
        const file = await apiGet(`/api/files/${fileId}`);

        const ownerLabel = file.isOwner ? 'You' : 'Shared';
        const visibility = file.is_public ? 'Public' : 'Private';

        title.textContent = file.filename || 'File Details';
        body.innerHTML = `
          <p style="margin-bottom: 0.75rem; font-size: 0.875rem;">
            <strong>${escapeHtml(visibility)}</strong>
            <span style="color: var(--muted-foreground); font-size: 0.8125rem; margin-left: 0.5rem;">
              Owner: ${escapeHtml(ownerLabel)}
            </span>
          </p>
          <p style="margin-bottom: 0.75rem; color: var(--muted-foreground); font-size: 0.875rem;">
            Type: ${escapeHtml(file.file_type || '—')}
          </p>
          <p style="margin-bottom: 0.75rem; color: var(--foreground); font-size: 0.875rem;">
            ${escapeHtml(file.description || 'No description provided.')}
          </p>
        `;
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

function docUploadPanelHTML({ role, typeKeyDefault }) {
    const typeSelectDefault = typeKeyDefault || 'recipe';
    const types = [
        { value: 'recipe', label: 'Recipe' },
        { value: 'report', label: 'Report' },
        { value: 'schedule', label: 'Schedule' },
        { value: 'invoice', label: 'Invoice' }
    ];
    const options = types
        .map((t) => `<option value="${t.value}" ${t.value === typeSelectDefault ? 'selected' : ''}>${t.label}</option>`)
        .join('');

    return `
      <div class="upload-panel" id="widget-upload-panel">
        <div class="upload-panel-body">
          <div class="upload-row">
            <input type="text" id="widget-upload-filename" placeholder="Filename" class="input" />
            <select id="widget-upload-type" class="input">
              ${options}
            </select>
          </div>

          <div class="upload-row" style="margin-top: 0.75rem;">
            <textarea id="widget-upload-description" rows="2" placeholder="Optional description"></textarea>
          </div>

          <div class="upload-row" style="margin-top: 0.75rem;">
            <div class="upload-visibility">
              <label class="checkbox-wrapper">
                <input type="radio" name="widget-is-public" value="0" checked />
                <span>Private</span>
              </label>
              <label class="checkbox-wrapper">
                <input type="radio" name="widget-is-public" value="1" />
                <span>Public</span>
              </label>
            </div>
            <div class="upload-actions">
              <button class="btn btn-primary" type="button" id="widget-upload-submit">Upload</button>
              <button class="btn btn-ghost" type="button" id="widget-upload-cancel">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
}

async function renderDocumentManagerWidget(role, containerEl, apiFilesEndpoint = '/api/files') {
    containerEl.innerHTML = `
      <section class="doc-widget">
        <div class="doc-widget-header">
          <div>
            <div class="doc-widget-title">Document Manager</div>
            <div class="doc-widget-subtext">Your files and shared documents</div>
          </div>
          <div class="doc-widget-header-right">
            <a href="files.html" class="btn btn-outline btn-sm">View All &rarr;</a>
            <button type="button" class="btn btn-primary btn-sm" id="widget-upload-open-btn">+ Add Recipe</button>
          </div>
        </div>

        <div class="filter-tabs" id="widget-filter-tabs"></div>
        <div id="widget-file-list" class="widget-file-list"></div>

        <div id="widget-upload-toggle-row" class="widget-upload-toggle-row" style="display:none;"></div>
        ${docUploadPanelHTML({ role, typeKeyDefault: roleDefaultDocumentTab(role) === 'all' ? 'recipe' : roleDefaultDocumentTab(role) })}
      </section>
    `;

    // Inline panel collapsed by default.
    const uploadPanel = containerEl.querySelector('#widget-upload-panel');
    if (uploadPanel) uploadPanel.classList.add('collapsed');

    const activeDefault = roleDefaultDocumentTab(role);
    renderFilterTabs(containerEl.querySelector('#widget-filter-tabs'), role, activeDefault);

    const listEl = containerEl.querySelector('#widget-file-list');
    const tabsEl = containerEl.querySelector('#widget-filter-tabs');
    const addBtn = containerEl.querySelector('#widget-upload-open-btn');

    const uploadBtnTypeDefault = activeDefault === 'all' ? 'recipe' : activeDefault;
    if (containerEl.querySelector('#widget-upload-type')) {
        containerEl.querySelector('#widget-upload-type').value = uploadBtnTypeDefault;
    }

    // Local cache: API called once.
    const allFiles = await apiGet(apiFilesEndpoint).then((x) => (Array.isArray(x) ? x : []));
    const filesSorted = allFiles.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    function renderListForTab(tabKey) {
        const filtered = tabKey === 'all' ? filesSorted : filesSorted.filter((f) => f.file_type === tabKey);
        const shown = filtered.slice(0, 5);

        if (shown.length === 0) {
            listEl.innerHTML = `
              <div class="widget-empty">
                <div class="widget-empty-icon">📂</div>
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
                const ownerLabel = isOwner ? 'You' : 'Shared';
                const dateLabel = file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                const lockOverlay = !isPublic && !isOwner ? `<div class="file-card-locked">🔒 Access restricted</div>` : '';
                const lockOwnerMuted = !isPublic && isOwner ? `<div class="file-card-locked file-card-locked-muted">🔒 Your private file</div>` : '';

                const visibilityBadgeClass = isPublic ? 'public' : 'private';
                return `
                  <div class="file-card">
                    <div class="file-card-icon">
                      ${fileTypeIcon(typeKey)}
                      ${lockOverlay || lockOwnerMuted ? '' : ''}
                    </div>
                    <div class="file-card-body">
                      <div class="file-card-name">${escapeHtml(file.filename || '')}</div>
                      <div class="file-card-meta">
                        <span class="file-type-badge ${escapeHtml(visibilityBadgeClass)}">${escapeHtml(typeKey)}</span>
                        <span class="file-owner">${escapeHtml(ownerLabel)}</span>
                        <span class="file-date">${escapeHtml(dateLabel)}</span>
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
                const filename = btn.closest('.file-card')?.querySelector('.file-card-name')?.textContent || 'this file';
                const ok = window.confirm(`Delete "${filename}"?`);
                if (!ok) return;

                try {
                    await apiDelete(`/api/files/${fileId}`);
                    const idx = filesSorted.findIndex((f) => String(f.id) === String(fileId));
                    if (idx >= 0) filesSorted.splice(idx, 1);
                    showToast('File deleted successfully.', 'success');
                    renderListForTab(tabKey);
                } catch (e) {
                    showToast(String(e.message || 'Delete failed'), 'error');
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
                    showToast('Visibility updated.', 'success');
                    renderListForTab(tabKey);
                } catch (e) {
                    showToast(String(e.message || 'Update failed'), 'error');
                }
            });
        });
    }

    let activeTab = activeDefault;
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

    // Upload panel toggle (within widget)
    function openUploadPanel() {
        if (!uploadPanel) return;
        uploadPanel.classList.remove('collapsed');
        uploadPanel.classList.add('open');
        // Ensure type select aligns to active tab when uploading.
        const typeSel = containerEl.querySelector('#widget-upload-type');
        if (typeSel && activeTab && activeTab !== 'all') typeSel.value = activeTab;
    }
    function closeUploadPanel() {
        if (!uploadPanel) return;
        uploadPanel.classList.remove('open');
        uploadPanel.classList.add('collapsed');
    }

    if (addBtn) addBtn.addEventListener('click', openUploadPanel);

    const cancelBtn = containerEl.querySelector('#widget-upload-cancel');
    const submitBtn = containerEl.querySelector('#widget-upload-submit');
    if (cancelBtn) cancelBtn.addEventListener('click', closeUploadPanel);

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const filename = containerEl.querySelector('#widget-upload-filename')?.value?.trim();
            const type = containerEl.querySelector('#widget-upload-type')?.value;
            const description = containerEl.querySelector('#widget-upload-description')?.value?.trim() || '';
            const vis = containerEl.querySelector('input[name="widget-is-public"]:checked')?.value || '0';

            if (!filename) {
                showToast('Please enter a filename.', 'error');
                return;
            }

            try {
                const res = await apiPost('/api/files', {
                    filename,
                    file_type: type,
                    description: description || null,
                    is_public: vis === '1'
                });

                // Optimistic prepend into cached list (no re-fetch needed).
                const newFile = {
                    id: res.fileId || res.insertId || res.id,
                    filename,
                    description,
                    file_type: type,
                    owner_id: null,
                    is_public: vis === '1' ? 1 : 0,
                    isOwner: true,
                    created_at: new Date().toISOString()
                };
                filesSorted.unshift(newFile);
                showToast('File added successfully.', 'success');
                closeUploadPanel();
                renderListForTab(activeTab);
            } catch (e) {
                showToast(String(e.message || 'Upload failed'), 'error');
            }
        });
    }
}

function renderRBACInfoCard(role) {
    const container = document.createElement('div');
    container.className = 'content-card';

    const roleText =
        role === 'admin'
            ? 'Full system access. All RBAC roles visible to you.'
            : role === 'staff'
                ? 'Recipe and production access only. Financial modules are restricted to Managers.'
                : 'POS and invoice access only. Inventory and recipe management is restricted.';

    container.innerHTML = `
      <details class="rbac-card">
        <summary style="cursor:pointer; font-weight:600; padding-bottom: 0.5rem;">RBAC Information</summary>
        <div class="rbac-card-body" style="color: var(--muted-foreground); font-size: 0.875rem; line-height: 1.6;">
          ${escapeHtml(roleText).replace(/\\n/g, '<br/>')}
        </div>
      </details>
    `;

    return container;
}

function renderHeaderBlock(role) {
    const user = getCurrentUser();
    const greeting = getGreeting();
    const dateStr = formatDateLong(new Date().toISOString());
    const roleName = getRoleDisplayName(role);

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <div style="display:flex; justify-content:space-between; gap:1rem; align-items:flex-start;">
          <div style="font-size:24px; font-weight:700; color: var(--foreground);">
            ${escapeHtml(`${greeting}, ${roleName} ${user.username || ''}.`.trim())}
          </div>
          <div style="font-size:13px; color: var(--muted-foreground); padding-top: 8px;">
            ${escapeHtml(dateStr)}
          </div>
        </div>

        <div style="margin-top: 0.75rem; font-size: 14px; color: var(--muted-foreground);">
          ${escapeHtml(getRoleLine(role))}
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
    const ghost2 = '#';

    const title = role === 'admin' ? '+ New Document' : role === 'staff' ? '+ New Recipe' : '+ New Invoice';

    const container = document.createElement('div');
    container.innerHTML = `
      <div style="display:flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
        <a href="${escapeHtml(primary)}" class="btn btn-primary">${escapeHtml(title)}</a>
        <a href="${escapeHtml(ghost1)}" class="btn btn-outline">${escapeHtml(role === 'admin' ? 'View All Files' : role === 'staff' ? 'My Schedules' : 'My Reports')}</a>
        <a href="${escapeHtml(ghost2)}" class="btn btn-outline" onclick="return false;">${escapeHtml(role === 'admin' ? 'System Overview' : role === 'staff' ? 'Production Log' : 'Open POS')}</a>
      </div>
    `;
    return container;
}

function iconWrapperHTML(iconType) {
    // Matches .kpi-icon-wrapper in style.css
    const svg = (() => {
        if (iconType === 'folder') return `<svg viewBox="0 0 24 24" fill="none"><path d="M3 7h6l2 2h10v10H3V7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
        if (iconType === 'users') return `<svg viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 8v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M23 11h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
        if (iconType === 'book-open') return `<svg viewBox="0 0 24 24" fill="none"><path d="M4 19a2 2 0 0 0 2 2h2V5H6a2 2 0 0 0-2 2v12Z" stroke="currentColor" stroke-width="2"/><path d="M12 5a4 4 0 0 1 4-4h4v18h-4a4 4 0 0 0-4 4V5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
        if (iconType === 'alert-triangle') return `<svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" stroke-width="2"/><path d="M12 9v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
        if (iconType === 'calendar') return `<svg viewBox="0 0 24 24" fill="none"><path d="M8 2v4M16 2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 9h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
        return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>`;
    })();

    return `<div class="kpi-icon-wrapper">${svg}</div>`;
}

function renderKpiCard({ label, value, trendText, iconHtml, valueTone }) {
    const card = document.createElement('div');
    card.className = 'kpi-card';

    card.innerHTML = `
      <div class="kpi-card-header">
        <span class="kpi-label">${escapeHtml(label)}</span>
        ${iconHtml}
      </div>
      <div class="kpi-card-value" ${valueTone ? `style="color:${valueTone};"` : ''}>${escapeHtml(String(value))}</div>
      <div class="kpi-card-footer">
        <span class="kpi-trend up">${escapeHtml(trendText)}</span>
      </div>
    `;
    return card;
}

function renderKpiRow(role, stats) {
    if (!stats) return document.createElement('div');

    const row = document.createElement('div');
    row.className = role === 'admin' ? 'kpi-row-4' : 'kpi-row-3';

    if (role === 'admin') {
        row.appendChild(
            renderKpiCard({
                label: 'Total Documents',
                value: stats.totalFiles,
                trendText: `↑ ${stats.filesAddedThisWeek || 0} this week`,
                iconHtml: iconWrapperHTML('folder')
            })
        );
        row.appendChild(
            renderKpiCard({
                label: 'Total Users',
                value: stats.totalUsers,
                trendText: `↑ ${stats.newRegistrations || 0} this week`,
                iconHtml: iconWrapperHTML('users')
            })
        );
        row.appendChild(
            renderKpiCard({
                label: 'Public Recipes',
                value: stats.publicRecipes,
                trendText: `↑ ${stats.sharedWithTeamThisWeek || 0} shared with team`,
                iconHtml: iconWrapperHTML('book-open')
            })
        );
        const alertTrend = `${stats.systemAlertsThisWeek || 0} this week`;
        row.appendChild(
            renderKpiCard({
                label: 'System Alerts',
                value: stats.systemAlerts,
                trendText: `↑ ${alertTrend}`,
                iconHtml: iconWrapperHTML('alert-triangle'),
                valueTone: stats.systemAlerts > 0 ? 'var(--warning)' : undefined
            })
        );
        return row;
    }

    if (role === 'staff') {
        row.appendChild(
            renderKpiCard({
                label: 'My Recipes',
                value: stats.myRecipes,
                trendText: `↑ ${stats.myRecipesAddedThisMonth || 0} this month`,
                iconHtml: iconWrapperHTML('book-open')
            })
        );
        row.appendChild(
            renderKpiCard({
                label: 'Shared Schedules',
                value: stats.sharedSchedules,
                trendText: `↑ ${stats.sharedSchedulesActiveThisWeek || 0} active this week`,
                iconHtml: iconWrapperHTML('calendar')
            })
        );
        row.appendChild(
            renderKpiCard({
                label: 'Production Batches',
                value: stats.productionToday,
                trendText: `↑ ${stats.scheduledToday || 0} scheduled today`,
                iconHtml: iconWrapperHTML('calendar')
            })
        );
        return row;
    }

    // user
    row.appendChild(
        renderKpiCard({
            label: 'My Invoices',
            value: stats.myInvoices,
            trendText: `↑ ${stats.invoicesAddedThisMonth || 0} this month`,
            iconHtml: iconWrapperHTML('file-text')
        })
    );
    row.appendChild(
        renderKpiCard({
            label: 'My Reports',
            value: stats.myReports,
            trendText: `↑ ${stats.reportsAddedThisWeek || 0} filed this week`,
            iconHtml: iconWrapperHTML('bar-chart')
        })
    );
    row.appendChild(
        renderKpiCard({
            label: 'Shared Documents',
            value: stats.sharedDocs,
            trendText: `↑ ${stats.sharedDocsAccessibleThisWeek || 0} accessible to you`,
            iconHtml: iconWrapperHTML('files')
        })
    );
    return row;
}

function renderActivityFeed(activity) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
      <h3>Recent Activity</h3>
      <div id="activity-feed"></div>
    `;
    const el = card.querySelector('#activity-feed');

    if (!activity || activity.length === 0) {
        el.innerHTML = `<div style="color: var(--muted-foreground); font-size: 0.875rem;">No recent activity.</div>`;
        return card;
    }

    el.innerHTML = activity
        .map((item) => {
            const dotColor =
                item.type === 'upload' ? 'var(--success)' :
                    item.type === 'delete' ? 'var(--destructive)' :
                        item.type === 'view' ? '#3b82f6' :
                            item.type === 'login' ? '#a855f7' : 'var(--primary)';
            return `
              <div class="activity-item" style="display:flex; gap: 0.75rem; padding: 0.5rem 0; align-items:flex-start;">
                <div class="activity-dot" style="width: 8px; height: 8px; border-radius: 9999px; background:${dotColor}; margin-top: 6px;"></div>
                <div class="activity-body" style="flex:1;">
                  <div class="activity-text" style="font-size: 0.875rem; color: var(--foreground);">${escapeHtml(item.text || '')}</div>
                  <div class="activity-time" style="font-size: 0.75rem; color: var(--muted-foreground); margin-top: 2px;">${escapeHtml(timeAgo(item.time))}</div>
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
    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
      <h3>DAC Access Denial Log</h3>
      <p class="text-sm text-muted" style="margin-top: -0.25rem; margin-bottom: 1rem; color: var(--muted-foreground);">
        Recent denied access attempts recorded by DAC rules.
      </p>
      <div id="denied-log-list">
        <div style="color: var(--muted-foreground); font-size: 0.875rem;">Loading...</div>
      </div>
    `;

    const wrap = card.querySelector('#denied-log-list');
    try {
        const logs = await apiGet('/api/files/logs/denied');
        const safeLogs = Array.isArray(logs) ? logs : [];

        if (safeLogs.length === 0) {
            wrap.innerHTML = `
              <div style="text-align:center; color: var(--muted-foreground); font-size: 0.875rem; padding: 1rem 0;">
                No denied access attempts.
              </div>
            `;
            return card;
        }

        wrap.innerHTML = safeLogs
            .map((log) => {
                const when = log.time ? timeAgo(log.time) : '—';
                const user = log.user || 'Unknown';
                const file = log.filename || 'Unknown file';
                const action = log.action || '—';
                const reason = log.reason || '—';

                return `
                  <div style="display:flex; gap: 0.75rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); margin-bottom: 0.75rem; align-items:flex-start;">
                    <div style="width: 10px; height: 10px; border-radius: 9999px; margin-top: 7px; background: var(--destructive); flex-shrink: 0;"></div>
                    <div style="flex: 1;">
                      <div style="font-size: 0.875rem; color: var(--foreground);">
                        ${escapeHtml(action)} denied
                      </div>
                      <div style="font-size: 0.75rem; color: var(--muted-foreground); margin-top: 2px; line-height: 1.4;">
                        User: ${escapeHtml(user)}<br/>
                        File: ${escapeHtml(file)}<br/>
                        Reason: ${escapeHtml(reason)}
                      </div>
                      <div style="font-size: 0.75rem; color: var(--muted-foreground); margin-top: 6px;">
                        ${escapeHtml(when)}
                      </div>
                    </div>
                  </div>
                `;
            })
            .join('');
    } catch (error) {
        console.error('Denied access logs load error:', error);
        wrap.innerHTML = `
          <div style="text-align:center; color: var(--destructive); font-size: 0.875rem; padding: 1rem 0;">
            Failed to load denied access logs.
          </div>
        `;
    }

    return card;
}

function renderProductionScheduleTable(schedule) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
      <h3>Today's Production Schedule</h3>
      <p class="text-sm text-muted" style="margin-top: -0.25rem; margin-bottom: 1rem; color: var(--muted-foreground);">Batches and recipes assigned for today</p>
      <div id="schedule-wrap"></div>
    `;

    const wrap = card.querySelector('#schedule-wrap');
    if (!schedule || schedule.length === 0) {
        wrap.innerHTML = `
          <div style="text-align:center; color: var(--muted-foreground); font-size: 0.875rem; padding: 0.75rem 0;">
            No production scheduled for today.
          </div>
          <div style="text-align:center;">
            <a class="btn btn-primary" href="files.html?type=schedule&action=upload">+ Add Schedule</a>
          </div>
        `;
        return card;
    }

    wrap.innerHTML = `
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Batch Name</th>
            <th>Recipe Document</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${schedule
              .map((row) => {
                  const status = row.status || 'pending';
                  const statusClass =
                      status === 'completed' ? 'status-completed' :
                          status === 'in_progress' ? 'status-in_progress' :
                              'status-pending';
                  const recipeLink =
                      row.recipeFileId && row.recipeFileId !== null
                          ? `<button type="button" class="btn btn-ghost btn-sm" onclick="openFileModal('${escapeHtml(String(row.recipeFileId))}')">${escapeHtml(row.recipeFileName || 'View recipe')}</button>`
                          : '—';
                  return `
                    <tr>
                      <td>${escapeHtml(row.time || '—')}</td>
                      <td>${escapeHtml(row.batchName || '—')}</td>
                      <td>${recipeLink}</td>
                      <td class="${statusClass}">${escapeHtml(status.replace('_', ' '))}</td>
                    </tr>
                  `;
              })
              .join('')}
        </tbody>
      </table>
    `;
    return card;
}

function renderNotificationsPanel(notifications) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
      <h3>Notifications</h3>
      <p class="text-sm text-muted" style="margin-top: -0.25rem; margin-bottom: 1rem; color: var(--muted-foreground);">Recent updates relevant to your role</p>
      <div id="notif-list"></div>
    `;
    const wrap = card.querySelector('#notif-list');

    if (!notifications || notifications.length === 0) {
        wrap.innerHTML = `
          <div style="text-align:center; color: var(--muted-foreground); padding: 1rem 0;">
            <div style="font-size: 1.25rem;">🔔</div>
            <div>No new notifications.</div>
          </div>
        `;
        return card;
    }

    wrap.innerHTML = `
      ${notifications
          .map((n) => {
              const unread = n.unread;
              return `
                <div class="notification-item" style="display:flex; gap: 0.75rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: ${unread ? 'rgba(161, 104, 50, 0.05)' : 'var(--card)'}; margin-bottom: 0.75rem; position: relative;">
                  <div class="notification-icon" style="font-size: 1.25rem;">🔔</div>
                  <div class="notification-body">
                    <div style="font-size: 0.875rem; color: var(--foreground);">${escapeHtml(n.message || '')}</div>
                    <div style="font-size: 0.75rem; color: var(--muted-foreground); margin-top: 3px;">${escapeHtml(timeAgo(n.time))}</div>
                  </div>
                  ${unread ? `<div class="notification-dot" style="width: 10px; height: 10px; border-radius: 9999px; background: var(--primary); position:absolute; right: 14px; top: 14px;"></div>` : ''}
                </div>
              `;
          })
          .join('')}
    `;
    return card;
}

function renderDashboardShell(role, dashboardData) {
    const main = document.getElementById('page-content') || document.body;
    main.innerHTML = '';

    main.appendChild(renderHeaderBlock(role));
    main.appendChild(renderQuickActions(role));

    const statsRow = renderKpiRow(role, dashboardData.stats || {});
    main.appendChild(statsRow);

    const widgetWrap = document.createElement('div');
    widgetWrap.style.marginTop = '1.5rem';
    main.appendChild(widgetWrap);
    // Document Manager widget inserted async below.

    if (role === 'admin' && (dashboardData.recentActivity || []).length) {
        // Activity is below widget per spec; we insert after widget async below.
    }

    // RBAC card at bottom
    const rbacCard = renderRBACInfoCard(role);
    rbacCard.style.marginTop = '1.5rem';

    main.appendChild(widgetWrap);
    main.appendChild(document.createElement('div')).appendChild(rbacCard);
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
    main.appendChild(renderKpiRow(role, data.stats || {}));

    // Document Manager widget
    const widgetWrap = document.createElement('div');
    widgetWrap.style.marginTop = '1.5rem';
    main.appendChild(widgetWrap);
    await renderDocumentManagerWidget(role, widgetWrap, '/api/files');

    // Role-specific panels
    if (role === 'admin') {
        main.appendChild(renderActivityFeed(data.recentActivity || []));
        main.appendChild(await renderAccessDeniedLogPanel());
    } else if (role === 'staff') {
        main.appendChild(renderProductionScheduleTable(data.schedule || []));
    } else if (role === 'user') {
        main.appendChild(renderNotificationsPanel(data.notifications || []));
    }

    // RBAC card (collapsible)
    const rbacCard = renderRBACInfoCard(role);
    rbacCard.style.marginTop = '1.5rem';
    main.appendChild(rbacCard);
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
    if (shown.length === 0) {
        container.innerHTML = `
          <div class="widget-empty">
            <div class="widget-empty-icon">📂</div>
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
            const visibilityBadge = isPublic ? 'Public' : 'Private';
            const ownerLabel = isOwner ? 'You' : 'Shared';
            const dateLabel = file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
            const lockedOther = !isPublic && !isOwner;
            const lockedOwner = !isPublic && isOwner;

            const cardLocked = lockedOther
                ? `<div class="file-card-locked">🔒 Access restricted</div>`
                : lockedOwner
                    ? `<div class="file-card-locked file-card-locked-muted">🔒 Your private file</div>`
                    : '';

            return `
              <div class="file-card">
                <div class="file-card-icon">
                  ${fileTypeIcon(typeKey)}
                </div>
                <div class="file-card-body">
                  <div class="file-card-name">${escapeHtml(file.filename || '')}</div>
                  <div class="file-card-meta">
                    <span class="file-type-badge ${isPublic ? 'public' : 'private'}">${escapeHtml(typeKey)}</span>
                    <span class="file-owner">${escapeHtml(ownerLabel)}</span>
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
            const ok = window.confirm('Delete this file?');
            if (!ok) return;
            try {
                await apiDelete(`/api/files/${fileId}`);
                if (typeof callbacks.onDelete === 'function') callbacks.onDelete(fileId);
            } catch (e) {
                showToast(String(e.message || 'Delete failed'), 'error');
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
    const defaultType = role === 'admin' ? 'all' : role === 'staff' ? 'recipe' : 'invoice';

    const activeTab = getTabFromType(typeFilter) || defaultType;
    let currentTab = activeTab;
    let searchQuery = '';

    const files = document.getElementById('files-cards');
    const tabsEl = document.getElementById('files-filter-tabs');
    const searchEl = document.getElementById('files-search');
    const uploadPanel = document.getElementById('files-upload-panel');
    const filenameInput = document.getElementById('files-upload-filename');

    if (!files || !tabsEl) return;

    // Load file data once.
    let allFiles = await apiGet('/api/files').then((x) => (Array.isArray(x) ? x : []));
    allFiles = allFiles.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    function setActiveTab(tabKey) {
        currentTab = tabKey;
        tabsEl.querySelectorAll('.filter-tab').forEach((t) => t.classList.toggle('active', t.getAttribute('data-tab') === tabKey));
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
    tabsEl.innerHTML = tabs
        .map(
            (t) =>
                `<button type="button" class="filter-tab ${t.key === currentTab ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>`
        )
        .join('');

    function rerender() {
        renderFileCards(files, allFiles, currentTab, searchQuery, {
            onDelete: (deletedFileId) => {
                allFiles = allFiles.filter((f) => String(f.id) !== String(deletedFileId));
                rerender();
            },
            onVisibilityToggle: (fileId, nextIsPublic) => {
                allFiles = allFiles.map((f) => (String(f.id) === String(fileId) ? { ...f, is_public: nextIsPublic ? 1 : 0 } : f));
                rerender();
            }
        });
    }

    rerender();

    tabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-tab');
        if (!btn) return;
        const nextTab = btn.getAttribute('data-tab');
        setActiveTab(nextTab);

        // Update URL param without reloading
        const url = new URL(window.location.href);
        url.searchParams.delete('action');
        if (nextTab === 'all') url.searchParams.delete('type');
        else url.searchParams.set('type', nextTab);
        const qs = url.searchParams.toString();
        history.pushState({}, '', qs ? (url.pathname + '?' + qs) : url.pathname);
    });

    if (searchEl) {
        searchEl.addEventListener('input', () => {
            searchQuery = searchEl.value;
            rerender();
        });
    }

    // Upload panel handling
    const toggleBtn = document.getElementById('files-upload-toggle');
    const cancelBtn = document.getElementById('files-upload-cancel');
    const submitBtn = document.getElementById('files-upload-submit');
    const typeSelect = document.getElementById('files-upload-type');
    const visibilityRadios = document.querySelectorAll('input[name="files-is-public"]');

    function openUploadPanel() {
        if (!uploadPanel) return;
        uploadPanel.classList.remove('collapsed');
        uploadPanel.classList.add('open');
        if (filenameInput) filenameInput.focus();
        // Scroll into view to satisfy the action=upload requirement.
        uploadPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeUploadPanel() {
        if (!uploadPanel) return;
        uploadPanel.classList.remove('open');
        uploadPanel.classList.add('collapsed');
    }

    // Collapsed by default
    if (uploadPanel) {
        uploadPanel.classList.remove('open');
        uploadPanel.classList.add('collapsed');
    }

    if (toggleBtn) toggleBtn.addEventListener('click', openUploadPanel);
    if (cancelBtn) cancelBtn.addEventListener('click', closeUploadPanel);

    if (action === 'upload') {
        openUploadPanel();
    }

    // Default type selection based on active tab or role-appropriate fallback.
    const defaultUploadType = currentTab !== 'all' ? currentTab : (role === 'user' ? 'invoice' : 'recipe');
    if (typeSelect) typeSelect.value = defaultUploadType;

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const filename = document.getElementById('files-upload-filename')?.value?.trim();
            const file_type = document.getElementById('files-upload-type')?.value;
            const description = document.getElementById('files-upload-description')?.value?.trim() || null;
            const isPublic = document.querySelector('input[name="files-is-public"]:checked')?.value === '1';

            if (!filename) {
                showToast('Please enter a filename.', 'error');
                return;
            }

            try {
                const res = await apiPost('/api/files', { filename, description, file_type, is_public: isPublic });
                const newFile = {
                    id: res.fileId,
                    filename,
                    description,
                    file_type,
                    owner_id: null,
                    is_public: isPublic ? 1 : 0,
                    isOwner: true,
                    created_at: new Date().toISOString()
                };
                allFiles.unshift(newFile);
                closeUploadPanel();
                showToast('File added successfully.', 'success');
                rerender();
            } catch (e) {
                showToast(String(e.message || 'Upload failed'), 'error');
            }
        });
    }
}

