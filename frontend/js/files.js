// BakeSync File Manager (DAC) Logic

let currentFiles = [];

/**
 * Initialize file manager page
 */
async function initFileManager() {
    if (!requireAuth()) return;

    initNavbar();
    await loadFiles();

    // Set up form submission
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
}

/**
 * Load files from API
 */
async function loadFiles() {
    const tableBody = document.getElementById('files-body');
    const loading = document.getElementById('loading');

    try {
        loading.style.display = 'block';
        tableBody.innerHTML = '';

        const raw = await apiGet('/api/files');
        currentFiles = Array.isArray(raw) ? raw : raw && Array.isArray(raw.files) ? raw.files : [];

        loading.style.display = 'none';

        if (currentFiles.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-secondary);">
                        No files found. Upload your first file above.
                    </td>
                </tr>
            `;
            return;
        }

        currentFiles.forEach(file => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(file.filename)}</td>
                <td><span class="badge">${file.file_type}</span></td>
                <td>${file.isOwner ? 'You' : `User #${file.owner_id}`}</td>
                <td>
                    <span class="badge ${file.is_public ? 'badge-public' : 'badge-private'}">
                        ${file.is_public ? 'Public' : 'Private'}
                    </span>
                </td>
                <td class="file-actions">
                    <button class="btn btn-ghost btn-small" onclick="viewFile(${file.id})">View</button>
                    ${file.isOwner ? `
                        <button class="btn btn-ghost btn-small" onclick="toggleVisibility(${file.id}, ${file.is_public ? 0 : 1})">
                            ${file.is_public ? 'Make Private' : 'Make Public'}
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteFile(${file.id})">Delete</button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        loading.style.display = 'none';
        console.error('Load files error:', error);
        showError('Failed to load files: ' + error.message);
    }
}

/**
 * Handle file upload
 */
async function handleUpload(event) {
    event.preventDefault();

    const filename = document.getElementById('filename').value.trim();
    const description = document.getElementById('description').value.trim();
    const fileType = document.getElementById('file-type').value;
    const isPublic = document.getElementById('is-public').checked;

    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');

    errorAlert.classList.remove('show');
    successAlert.classList.remove('show');

    if (!filename || !fileType) {
        showError('Filename and file type are required');
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
        document.getElementById('filename').value = '';
        document.getElementById('description').value = '';
        document.getElementById('file-type').value = '';
        document.getElementById('is-public').checked = false;

        showSuccess('File created successfully');
        await loadFiles();
    } catch (error) {
        showError(error.message);
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
