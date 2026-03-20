// BakeSync IAS102 - Shared sticky/collapsible sidebar utility (static frontend)
// Imported via <script src="../js/sidebar.js"></script> in every dashboard + files.html.

const SIDEBAR_COLLAPSED_KEY = 'bakesync_sidebar_collapsed';

function roleColorVar(role) {
  // Keep the role colors aligned with style.css tokens.
  if (role === 'admin') return 'var(--role-admin)';
  if (role === 'staff') return 'var(--role-staff)';
  return 'var(--role-user)';
}

function getSidebarNavByRole(role) {
  // The spec wants explicit items + filtering params for files.html.
  const managerItems = [
    { label: 'Dashboard', href: 'dashboard-admin.html' },
    { label: 'Document Manager', href: 'files.html', primary: true },
    { label: 'Recipes', href: 'files.html?type=recipe', fileType: 'recipe' },
    { label: 'Reports', href: 'files.html?type=report', fileType: 'report' },
    { label: 'Schedules', href: 'files.html?type=schedule', fileType: 'schedule' },
    { label: 'Invoices', href: 'files.html?type=invoice', fileType: 'invoice' },
    { divider: true },
    { label: 'System Overview', href: null, visualOnly: true },
    { label: 'User Activity', href: null, visualOnly: true }
  ];

  const bakerItems = [
    { label: 'Dashboard', href: 'dashboard-staff.html' },
    { label: 'Document Manager', href: 'files.html', primary: true },
    { label: 'My Recipes', href: 'files.html?type=recipe', fileType: 'recipe' },
    { label: 'Schedules', href: 'files.html?type=schedule', fileType: 'schedule' },
    { label: 'Production Log', href: null, visualOnly: true },
    { divider: true },
    { label: 'Raw Materials', href: null, visualOnly: true }
  ];

  const cashierItems = [
    { label: 'Dashboard', href: 'dashboard-user.html' },
    { label: 'Document Manager', href: 'files.html', primary: true },
    { label: 'My Invoices', href: 'files.html?type=invoice', fileType: 'invoice' },
    { label: 'Reports', href: 'files.html?type=report', fileType: 'report' },
    { divider: true },
    { label: 'Point of Sale', href: null, visualOnly: true }
  ];

  if (role === 'admin') return managerItems;
  if (role === 'staff') return bakerItems;
  return cashierItems;
}

function iconSvg(name, colorClass = '') {
  // Minimal inline SVG set (24px) to match the sidebar icon expectations.
  // Note: this is static/vanilla; no external icon libraries.
  const common = `width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${colorClass}`.trim();
  switch (name) {
    case 'dashboard':
      return `<svg ${common}><path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    case 'files':
      return `<svg ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    case 'book-open':
      return `<svg ${common}><path d="M4 19a2 2 0 0 0 2 2h2V5H6a2 2 0 0 0-2 2v12Z" stroke="currentColor" stroke-width="1.8"/><path d="M12 5a4 4 0 0 1 4-4h4v18h-4a4 4 0 0 0-4 4V5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    case 'bar-chart':
      return `<svg ${common}><path d="M4 20V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M10 20V4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 20v-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M22 20H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'calendar':
      return `<svg ${common}><path d="M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 9h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    case 'file-text':
      return `<svg ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'chevron-left':
      return `<svg ${common}><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'chevron-right':
      return `<svg ${common}><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'log-out':
      return `<svg ${common}><path d="M10 17l-5-5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 3h-4a2 2 0 0 0-2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 21h-4a2 2 0 0 1-2-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    case 'settings':
      return `<svg ${common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a7.7 7.7 0 0 0 .1-2l2-1.2-2-3.5-2.3.7a7.6 7.6 0 0 0-1.7-1L15 3h-6l-.5 4.2a7.6 7.6 0 0 0-1.7 1L4.5 7.5l-2 3.5 2 1.2a7.7 7.7 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.7a7.6 7.6 0 0 0 1.7 1L9 21h6l.5-4.2a7.6 7.6 0 0 0 1.7-1l2.3.7 2-3.5-2-1.2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
    default:
      return `<svg ${common}><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/></svg>`;
  }
}

function labelToIconKey(label) {
  const l = String(label || '').toLowerCase();
  if (l.includes('dashboard')) return 'dashboard';
  if (l.includes('document')) return 'files';
  if (l.includes('recipe')) return 'book-open';
  if (l.includes('report')) return 'bar-chart';
  if (l.includes('schedule')) return 'calendar';
  if (l.includes('invoice')) return 'file-text';
  if (l.includes('point of sale')) return 'file-text';
  return 'files';
}

function getSidebarElements() {
  const sidebar = document.getElementById('sidebar') || document.getElementById('app-sidebar');
  const mainContent =
    document.getElementById('main-content') ||
    document.querySelector('.main-content') ||
    document.querySelector('.app-main') ||
    null;
  return { sidebar, mainContent };
}

function currentIsMobile() {
  return window.innerWidth < 768;
}

function getToggleButton() {
  return document.getElementById('sidebar-toggle-btn');
}

function applySidebarCollapsedState(collapsed) {
  const { sidebar, mainContent } = getSidebarElements();
  if (!sidebar || !mainContent) return;

  if (collapsed) {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('sidebar-collapsed');
  } else {
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('sidebar-collapsed');
  }
}

function setToggleIcon(collapsed) {
  const btn = getToggleButton();
  if (!btn) return;
  // Expanded: show chevron-left (click collapses). Collapsed: show chevron-right (click expands).
  const collapsedIcon = iconSvg('chevron-right');
  const expandedIcon = iconSvg('chevron-left');
  btn.innerHTML = collapsed ? collapsedIcon : expandedIcon;
}

function renderSidebarContent() {
  const { sidebar } = getSidebarElements();
  if (!sidebar) return;
  const user = getCurrentUser();
  if (!user || !user.role) return;

  const navItems = getSidebarNavByRole(user.role);
  const role = user.role;
  const username = user.username || 'User';

  sidebar.innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-mark" aria-hidden="true">🥐</div>
          <div class="sidebar-logo-wordmark">
            <div class="sidebar-logo-title">BakeSync</div>
            <div class="sidebar-logo-subtitle">Bakery ERP</div>
          </div>
        </div>

        <button class="sidebar-collapse-toggle" type="button" id="sidebar-toggle-btn" aria-label="Toggle sidebar">
          ${iconSvg('chevron-right')}
        </button>
      </div>

      <nav class="sidebar-nav">
        ${navItems
          .map((item) => {
            if (item.divider) return `<div class="sidebar-divider"></div>`;
            if (item.visualOnly) {
              return `
                <div class="sidebar-link sidebar-link-visual" data-visual="true">
                  <span class="sidebar-link-icon" aria-hidden="true">${iconSvg(labelToIconKey(item.label))}</span>
                  <span class="sidebar-link-text">${item.label}</span>
                </div>
              `;
            }

            const iconKey = labelToIconKey(item.label);
            const fileType = item.fileType ? `data-file-type="${item.fileType}"` : '';
            return `
              <a class="sidebar-link" href="${item.href}" ${fileType}>
                <span class="sidebar-link-icon" aria-hidden="true">${iconSvg(iconKey)}</span>
                <span class="sidebar-link-text">${item.label}</span>
              </a>
            `;
          })
          .join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user-card">
          <div class="sidebar-avatar" style="background:${roleColorVar(role)}">${String(username).slice(0, 1).toUpperCase()}</div>
          <div class="sidebar-user-meta">
            <div class="sidebar-user-name">${username}</div>
            <div class="sidebar-user-role">
              <span class="sidebar-role-text">${getRoleDisplayName(role)}</span>
              <span class="sidebar-role-dot" style="background:${roleColorVar(role)}"></span>
            </div>
          </div>
        </div>

        <a class="sidebar-settings" href="profile.html">
          <span class="sidebar-settings-icon" aria-hidden="true">${iconSvg('settings')}</span>
          <span class="sidebar-settings-text">Settings</span>
        </a>

        <button class="sidebar-signout" type="button" id="sidebar-signout-btn">
          <span class="sidebar-signout-icon" aria-hidden="true">${iconSvg('log-out')}</span>
          <span class="sidebar-signout-text">Sign Out</span>
        </button>
      </div>
    </div>
  `;

  const signout = document.getElementById('sidebar-signout-btn');
  if (signout) signout.addEventListener('click', logout);

  const toggleBtn = getToggleButton();
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
  }
}

function initTooltips() {
  const { sidebar } = getSidebarElements();
  if (!sidebar) return;

  const tooltipId = 'sidebar-tooltip';
  let tooltipEl = document.getElementById(tooltipId);

  function ensureTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.id = tooltipId;
    tooltipEl.className = 'sidebar-tooltip';
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  const navLinks = sidebar.querySelectorAll('.sidebar-link[data-visual="true"]');
  // Tooltips only apply to real links (not divider/visual placeholders).
  const clickableLinks = sidebar.querySelectorAll('.sidebar-link:not([data-visual="true"])');

  clickableLinks.forEach((a) => {
    const label = (a.querySelector('.sidebar-link-text')?.textContent || '').trim();
    a.addEventListener('mouseenter', (e) => {
      if (!sidebar.classList.contains('collapsed') || currentIsMobile()) return;
      const tip = ensureTooltip();
      tip.textContent = label;
      const rect = a.getBoundingClientRect();
      tip.style.top = `${rect.top + window.scrollY}px`;
      tip.style.left = `${rect.left + window.scrollX + 72}px`;
      tip.style.display = 'block';
      tip.style.visibility = 'visible';
    });
    a.addEventListener('mouseleave', () => {
      if (!sidebar.classList.contains('collapsed') || currentIsMobile()) return;
      const tip = ensureTooltip();
      tip.style.display = 'none';
      tip.style.visibility = 'hidden';
    });
  });

  // Cleanup helper to hide tooltip on scroll.
  window.addEventListener('scroll', () => {
    if (tooltipEl) {
      tooltipEl.style.display = 'none';
      tooltipEl.style.visibility = 'hidden';
    }
  });
}

function setActiveNavItem() {
  const { sidebar } = getSidebarElements();
  if (!sidebar) return;

  const pathname = window.location.pathname || '';
  const params = new URLSearchParams(window.location.search || '');
  const typeParam = params.get('type');

  // Clear active styles
  sidebar.querySelectorAll('.sidebar-link.active').forEach((el) => el.classList.remove('active'));

  const links = sidebar.querySelectorAll('.sidebar-link[href]');
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const anchorPath = href.split('?')[0];
    const isFilesPage = anchorPath.endsWith('files.html');

    let isActive = false;
    if (isFilesPage && pathname.endsWith('files.html')) {
      const itemType = a.getAttribute('data-file-type');
      // If the base Document Manager has no fileType, treat it as "All"
      if (!itemType) {
        isActive = !typeParam;
      } else {
        isActive = String(itemType) === String(typeParam);
      }
    } else {
      isActive = pathname.endsWith(anchorPath);
    }

    if (isActive) a.classList.add('active');
  });
}

function toggleSidebar() {
  const { sidebar, mainContent } = getSidebarElements();
  if (!sidebar || !mainContent) return;

  // On mobile, sidebar overlay behavior is controlled by initMobileSidebar.
  if (currentIsMobile()) return;

  const next = !sidebar.classList.contains('collapsed');
  // Hide labels during transition to satisfy the spec.
  sidebar.classList.add('label-transition');

  applySidebarCollapsedState(next);
  setToggleIcon(next);
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));

  // After collapse/expand transition, reveal labels (expand only).
  window.setTimeout(() => {
    sidebar.classList.remove('label-transition');
  }, 250);
}

function initSidebar() {
  if (!requireAuth()) return;
  const { sidebar, mainContent } = getSidebarElements();
  if (!sidebar || !mainContent) return;

  sidebar.classList.add('sidebar');
  // Only mark the new shell main region when it's actually present.
  if (mainContent.id === 'main-content') mainContent.classList.add('main-content');

  renderSidebarContent();

  // Ensure we have correct collapsed defaults for the viewport.
  const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  const shouldCollapse = saved && !currentIsMobile();
  applySidebarCollapsedState(shouldCollapse);
  setToggleIcon(shouldCollapse);

  initTooltips();

  // Sign out / toggle handler already attached in render.

  window.__bakesyncSidebarInitialized = true;
}

function initMobileSidebar() {
  const { sidebar, mainContent } = getSidebarElements();
  if (!sidebar || !mainContent) return;

  function getOrCreateHamburger() {
    const topbar = document.querySelector('.topbar') || document.querySelector('.app-topbar');
    if (!topbar) return null;
    let btn = document.getElementById('hamburger');
    if (btn) return btn;

    btn = document.createElement('button');
    btn.id = 'hamburger';
    btn.className = 'hamburger';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open sidebar');
    btn.innerHTML = `<span class="hamburger-lines" aria-hidden="true">☰</span>`;
    topbar.insertBefore(btn, topbar.firstChild);
    return btn;
  }

  const btn = getOrCreateHamburger();
  if (!btn) return;

  let overlayEl = null;

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.id = 'sidebar-overlay';
    overlayEl.className = 'sidebar-overlay';
    document.body.appendChild(overlayEl);
    overlayEl.addEventListener('click', () => closeMobileSidebar());
    return overlayEl;
  }

  function openMobileSidebar() {
    if (!currentIsMobile()) return;
    ensureOverlay();
    sidebar.classList.add('mobile-open');
    overlayEl.classList.add('visible');
  }

  function closeMobileSidebar() {
    if (!currentIsMobile()) return;
    sidebar.classList.remove('mobile-open');
    if (overlayEl) overlayEl.classList.remove('visible');
  }

  btn.addEventListener('click', () => {
    if (!currentIsMobile()) return;
    if (sidebar.classList.contains('mobile-open')) closeMobileSidebar();
    else openMobileSidebar();
  });

  // Resize handling: disable overlay + icon-only collapse on wider screens.
  window.addEventListener('resize', () => {
    if (!currentIsMobile()) {
      if (overlayEl) overlayEl.classList.remove('visible');
      sidebar.classList.remove('mobile-open');

      // Restore the persisted collapsed state (non-mobile).
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
      applySidebarCollapsedState(saved);
      setToggleIcon(saved);
    } else {
      // Mobile: sidebar is either open overlay or hidden; remove collapsed class.
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('sidebar-collapsed');
    }
  });
}

// The spec requires: every dashboard page calls initSidebar() and setActiveNavItem() on load.
// We intentionally do not auto-run here to avoid double-rendering with different page layouts.

document.addEventListener('DOMContentLoaded', () => {
  try {
    if (window.__bakesyncSidebarInitialized) return;
    const hasAnySidebarContainer =
      !!document.getElementById('sidebar') || !!document.getElementById('app-sidebar');
    if (!hasAnySidebarContainer) return;

    // Auto-init only when the caller didn't explicitly do it (legacy pages).
    initSidebar();
    setActiveNavItem();
    initMobileSidebar();
  } catch (e) {
    // Silent: some pages may not have the expected shell.
  }
});


