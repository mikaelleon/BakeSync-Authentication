// BakeSync File Manager (DAC) Logic

let currentFiles = [];
let fileManagerState = {
    allFiles: [],
    selectedType: 'all', // all | recipe | report | schedule | invoice
    searchQuery: '',
    roleDefaultType: 'recipe'
};

function validateFileType(type) {
    return ['recipe', 'report', 'schedule', 'invoice', 'all'].includes(type) ? type : null;
}

function getRoleDefaultType(role) {
    return role === 'user' ? 'invoice' : 'recipe';
}

function getFileTypeDisplay(type) {
    switch (type) {
        case 'recipe': return 'Recipes';
        case 'report': return 'Reports';
        case 'schedule': return 'Schedules';
        case 'invoice': return 'Invoices';
        default: return 'All';
    }
}

/**
 * Initialize file manager page
 */
async function initFileManager() {
    if (!requireAuth()) return;

    initNavbar();

    const user = getCurrentUser();
    fileManagerState.roleDefaultType = getRoleDefaultType(user.role);

    const params = new URLSearchParams(window.location.search);
    const typeParam = validateFileType(params.get('type'));
    const actionParam = params.get('action');

    fileManagerState.selectedType = typeParam ? typeParam : 'all';
    fileManagerState.searchQuery = '';

    // Tabs
    const tabs = Array.from(document.querySelectorAll('#files-type-tabs .file-type-tab'));
    tabs.forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextType = validateFileType(btn.getAttribute('data-type'));
            if (!nextType) return;
            fileManagerState.selectedType = nextType;

            // Active tab styles
            tabs.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            // URL sync without reload
            const sp = new URLSearchParams(window.location.search);
            sp.delete('action');
            if (nextType !== 'all') sp.set('type', nextType);
            else sp.delete('type');
            history.pushState({}, '', `${window.location.pathname}${sp.toString() ? '?' + sp.toString() : ''}`);

            // Sync upload default type to active tab (or role default if "all")
            syncUploadTypeSelect();

            renderFiles();
        });
    });

    // Initial tab state
    tabs.forEach((btn) => {
        const t = validateFileType(btn.getAttribute('data-type'));
        if (t === fileManagerState.selectedType) btn.classList.add('active');
    });

    // Search
    const searchEl = document.getElementById('files-search');
    if (searchEl) {
        searchEl.addEventListener('input', () => {
            fileManagerState.searchQuery = (searchEl.value || '').trim().toLowerCase();
            renderFiles();
        });
    }

    // Upload panel expand/collapse
    const toggleBtn = document.getElementById('files-upload-toggle');
    const uploadPanel = document.getElementById('files-upload-panel');
    const cancelBtn = document.getElementById('files-upload-cancel');
    const filenameInput = document.getElementById('files-filename');

    function expandUploadPanel() {
        if (uploadPanel) uploadPanel.classList.remove('collapsed');
        if (filenameInput) {
            filenameInput.focus();
        }
        if (uploadPanel && uploadPanel.scrollIntoView) {
            uploadPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function collapseUploadPanel() {
        if (uploadPanel) uploadPanel.classList.add('collapsed');
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (uploadPanel && uploadPanel.classList.contains('collapsed')) expandUploadPanel();
            else collapseUploadPanel();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            collapseUploadPanel();
        });
    }

    // Upload form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) uploadForm.addEventListener('submit', handleUpload);

    // Set initial upload type default
    syncUploadTypeSelect();

    // Fetch all files once (DAC already applied by backend)
    await loadFiles();

    // action=upload => auto-open upload panel
    if (actionParam === 'upload') {
        expandUploadPanel();
    }

    // Render using selected filters (after fetch)
    renderFiles();
}

/**
 * Load files from API
 */
async function loadFiles() {
    const loading = document.getElementById('loading');

    try {
        loading.style.display = 'block';
        currentFiles = await apiGet('/api/files');
        fileManagerState.allFiles = Array.isArray(currentFiles) ? currentFiles : [];
        loading.style.display = 'none';
    } catch (error) {
        loading.style.display = 'none';
        console.error('Load files error:', error);
        showError('Failed to load files: ' + error.message);
    }
}

function syncUploadTypeSelect() {
    const select = document.getElementById('files-file-type');
    if (!select) return;

    const selected = fileManagerState.selectedType;
    const next = selected === 'all' ? fileManagerState.roleDefaultType : selected;
    select.value = next;
}

function setFilesEmptyState(type) {
    const emptyEl = document.getElementById('files-empty');
    const listEl = document.getElementById('files-list');
    if (!emptyEl || !listEl) return;

    const map = {
        all: 'No documents yet. Add your first file.',
        recipe: 'No recipes yet. Add your first recipe.',
        report: 'No reports found.',
        schedule: 'No schedules available.',
        invoice: 'No invoices found.'
    };

    const labelType = type === 'all' ? 'file' : type;
    const btnHref = type === 'all'
        ? 'files.html?action=upload'
        : `files.html?type=${encodeURIComponent(type)}&action=upload`;

    emptyEl.style.display = 'block';
    emptyEl.innerHTML = `
        <div class="docmgr-empty">
            <div class="empty-icon" aria-hidden="true">📁</div>
            <div style="font-weight:700; margin-bottom: 0.5rem;">${escapeHtml(map[type] || map.all)}</div>
            <button class="btn btn-primary" type="button" onclick="window.location.href='${String(btnHref).replace(/'/g, "\\'")}'">
                Add ${escapeHtml(labelType)}
            </button>
        </div>
    `;

    listEl.innerHTML = '';
}

function getSafeFileTypeEmoji(fileType) {
    try {
        if (typeof getFileTypeEmoji === 'function') return getFileTypeEmoji(fileType);
    } catch (e) { /* ignore */ }
    return '📁';
}

function getSafeFileTypeIconClass(fileType) {
    try {
        if (typeof getFileTypeIconClass === 'function') return getFileTypeIconClass(fileType);
    } catch (e) { /* ignore */ }
    return '';
}

function renderFileCard(file) {
    const filename = escapeHtml(file.filename || '');
    const fileType = file.file_type || '';
    const created = file.created_at ? new Date(file.created_at) : null;
    const date = created
        ? created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    const privateNonOwner = !file.isOwner && !file.is_public;
    const ownerLabel = file.isOwner ? 'You' : (file.is_public ? 'Shared' : 'Access restricted');
    const iconClass = getSafeFileTypeIconClass(fileType);
    const emoji = getSafeFileTypeEmoji(fileType);

    const lockedOverlay = privateNonOwner ? `<div class="file-card-locked-overlay">🔒 Private</div>` : '';

    const typeBadge = `<span class="file-type-badge ${escapeHtml(fileType)}">${escapeHtml(fileType.charAt(0).toUpperCase() + fileType.slice(1))}</span>`;
    const visibilityBadge = file.is_public
        ? `<span class="file-type-badge" style="border-color: rgba(22, 163, 74, 0.35); background: rgba(22, 163, 74, 0.06); color: var(--success);">Public</span>`
        : `<span class="file-card-locked-badge">Private</span>`;

    const actions = `
        <button class="btn btn-ghost btn-sm" type="button" onclick="viewFile(${file.id})">View</button>
        ${file.isOwner ? `
            <button class="btn btn-ghost btn-sm" type="button" onclick="toggleVisibility(${file.id}, ${file.is_public ? 0 : 1})">
                ${file.is_public ? 'Make Private' : 'Make Public'}
            </button>
            <button class="btn btn-destructive btn-sm" type="button" onclick="deleteFile(${file.id})">Delete</button>
        ` : ''}
    `;

    return `
        <div class="file-card ${privateNonOwner ? 'private-nonowner' : ''}">
            ${lockedOverlay}
            <div class="file-card-left">
                <div class="file-card-icon ${iconClass}" aria-hidden="true">${emoji}</div>
                <div class="file-card-body">
                    <div class="file-card-name">${filename}</div>
                    <div class="file-card-meta">
                        ${typeBadge}
                        <span class="file-owner">${escapeHtml(ownerLabel)}</span>
                        ${date ? `<span class="file-date">${escapeHtml(date)}</span>` : ''}
                        ${visibilityBadge}
                    </div>
                </div>
            </div>
            <div class="file-card-actions">${actions}</div>
        </div>
    `;
}

function renderFiles() {
    const listEl = document.getElementById('files-list');
    const emptyEl = document.getElementById('files-empty');
    if (!listEl || !emptyEl) return;

    const type = fileManagerState.selectedType;
    const q = fileManagerState.searchQuery || '';

    const baseFiles = Array.isArray(fileManagerState.allFiles) ? fileManagerState.allFiles : [];
    let filtered = baseFiles.slice();

    if (type !== 'all') {
        filtered = filtered.filter(f => (f.file_type || '') === type);
    }

    if (q) {
        filtered = filtered.filter(f => (f.filename || '').toLowerCase().includes(q));
    }

    if (!filtered.length) {
        emptyEl.style.display = 'block';
        setFilesEmptyState(type);
        return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = filtered.map(renderFileCard).join('');
}

/**
 * Handle file upload
 */
async function handleUpload(event) {
    event.preventDefault();

    const filename = document.getElementById('files-filename').value.trim();
    const description = document.getElementById('files-description').value.trim();
    const fileType = document.getElementById('files-file-type').value;
    const isPublic = document.getElementById('files-is-public').checked;

    if (!filename || !fileType) {
        showToast('Filename and file type are required.', 'error');
        return;
    }

    try {
        await apiPost('/api/files', {
            filename,
            description,
            file_type: fileType,
            is_public: isPublic
        });

        // Clear form
        document.getElementById('files-filename').value = '';
        document.getElementById('files-description').value = '';
        document.getElementById('files-is-public').checked = false;

        // Collapse and refresh list
        const panel = document.getElementById('files-upload-panel');
        if (panel) panel.classList.add('collapsed');

        showToast('File added successfully.', 'success');
        await loadFiles();
        renderFiles();
    } catch (error) {
        showToast(error.message || 'Upload failed', 'error');
    }
}

/**
 * View file details
 */
async function viewFile(fileId) {
    const modal = document.getElementById('file-modal');
    const modalBody = document.getElementById('modal-body');

    try {
        const file = await apiGet(`/api/files/${fileId}`);

        modalBody.innerHTML = `
            <p><strong>Filename</strong>${escapeHtml(file.filename)}</p>
            <p><strong>Type</strong>${file.file_type}</p>
            <p><strong>Description</strong>${file.description || 'No description'}</p>
            <p><strong>Visibility</strong>${file.is_public ? 'Public' : 'Private'}</p>
            <p><strong>Owner</strong>${file.isOwner ? 'You' : `User #${file.owner_id}`}</p>
            <p><strong>Created</strong>${new Date(file.created_at).toLocaleString()}</p>
        `;

        document.getElementById('modal-title').textContent = 'File Details';
        modal.classList.add('show');
    } catch (error) {
        // DAC enforcement - show access denied modal
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">&#128274;</div>
                <h4 style="color: var(--error); margin-bottom: 8px;">Access Denied</h4>
                <p style="color: var(--text-secondary);">${error.message}</p>
                <p style="color: var(--text-secondary); font-size: 12px; margin-top: 16px;">
                    This file is private and you are not the owner.<br>
                    DAC (Discretionary Access Control) prevents unauthorized access.
                    <br><br>
                    <strong>DAC Rule:</strong> Only the file owner can access private files. This access attempt has been recorded.
                </p>
            </div>
        `;

        document.getElementById('modal-title').textContent = 'Access Denied';
        modal.classList.add('show');
    }
}

/**
 * Delete file
 */
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }

    try {
        await apiDelete(`/api/files/${fileId}`);
        showSuccess('File deleted successfully');
        await loadFiles();
        renderFiles();
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Toggle file visibility
 */
async function toggleVisibility(fileId, newVisibility) {
    try {
        await apiPatch(`/api/files/${fileId}/visibility`, {
            is_public: newVisibility
        });

        showSuccess(`File is now ${newVisibility ? 'public' : 'private'}`);
        await loadFiles();
        renderFiles();
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('file-modal').classList.remove('show');
}

/**
 * Show error alert
 */
function showError(message) {
    try {
        if (typeof showToast === 'function') showToast(message, 'error');
    } catch (e) { /* ignore */ }

    const alert = document.getElementById('error-alert');
    const msgSpan = document.getElementById('error-message');
    if (msgSpan) msgSpan.textContent = message;
    alert.style.display = 'flex';

    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

/**
 * Show success alert
 */
function showSuccess(message) {
    try {
        if (typeof showToast === 'function') showToast(message, 'success');
    } catch (e) { /* ignore */ }

    const alert = document.getElementById('success-alert');
    const msgSpan = document.getElementById('success-message');
    if (msgSpan) msgSpan.textContent = message;
    alert.style.display = 'flex';

    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('file-modal');
    if (event.target === modal) {
        closeModal();
    }
});
