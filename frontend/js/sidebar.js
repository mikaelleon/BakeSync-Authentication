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
    { label: 'Settings', href: 'profile.html' },
    { divider: true },
  ];

  const bakerItems = [
    { label: 'Dashboard', href: 'dashboard-staff.html' },
    { label: 'Document Manager', href: 'files.html', primary: true },
    { label: 'My Recipes', href: 'files.html?type=recipe', fileType: 'recipe' },
    { label: 'Schedules', href: 'files.html?type=schedule', fileType: 'schedule' },
    { label: 'Settings', href: 'profile.html' },
    { divider: true },
    { label: 'Production Log', href: null, visualOnly: true },
    { label: 'Raw Materials', href: null, visualOnly: true }
  ];

  const cashierItems = [
    { label: 'Dashboard', href: 'dashboard-user.html' },
    { label: 'Document Manager', href: 'files.html', primary: true },
    { label: 'My Invoices', href: 'files.html?type=invoice', fileType: 'invoice' },
    { label: 'Reports', href: 'files.html?type=report', fileType: 'report' },
    { label: 'Settings', href: 'profile.html' },
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
  if (l.includes('settings')) return 'settings';
  if (l.includes('point of sale')) return 'file-text';
  return 'files';
}

function sidebarLogoMarkSvg() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m4.6 13.11 5.79-3.21c1.89-1.05 4.79 1.78 3.71 3.71l-3.22 5.81C8.8 23.16.79 15.23 4.6 13.11Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m10.5 9.5-1-2.29C9.2 6.48 8.8 6 8 6H4.5C2.79 6 2 6.5 2 8.5a7.71 7.71 0 0 0 2 4.83" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 6c0-1.55.24-4-2-4-2 0-2.5 2.17-2.5 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m14.5 13.5 2.29 1c.73.3 1.21.7 1.21 1.5v3.5c0 1.71-.5 2.5-2.5 2.5a7.71 7.71 0 0 1-4.83-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 16c1.55 0 4-.24 4 2 0 2-2.17 2.5-4 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
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

function getDashboardUrl(role) {
  const map = {
    admin: 'dashboard-admin.html',
    staff: 'dashboard-staff.html',
    user: 'dashboard-user.html',
  };
  return map[role] || 'login.html';
}

const BREADCRUMB_MAP = {
  'dashboard-admin.html': ['Dashboard'],
  'dashboard-staff.html': ['Dashboard'],
  'dashboard-user.html': ['Dashboard'],
  'files.html': ['Dashboard', 'Document Manager'],
  'profile.html': ['Dashboard', 'Account Settings'],
  'access-denied.html': ['Access Denied'],
  'inventory.html': ['Dashboard', 'Inventory'],
  'recipes.html': ['Dashboard', 'Recipes'],
  'pos.html': ['Dashboard', 'Point of Sale'],
  'production.html': ['Dashboard', 'Production'],
  'analytics.html': ['Dashboard', 'Analytics'],
  'financials.html': ['Dashboard', 'Financials'],
  'team.html': ['Dashboard', 'Team'],
  'supply-chain.html': ['Dashboard', 'Supply Chain'],
};

function renderBreadcrumb() {
  const breadcrumbEl = document.getElementById('topbar-breadcrumb');
  if (!breadcrumbEl) return;

  const filename = window.location.pathname.split('/').pop() || '';
  const crumbs = BREADCRUMB_MAP[filename] || ['Dashboard'];
  const role = sessionStorage.getItem('role') || 'user';
  const dashUrl = getDashboardUrl(role);

  const params = new URLSearchParams(window.location.search);
  const fileType = params.get('type');
  const typeLabel = {
    recipe: 'Recipes',
    report: 'Reports',
    schedule: 'Schedules',
    invoice: 'Invoices',
  };

  const allCrumbs = fileType ? [...crumbs, typeLabel[fileType] || fileType] : crumbs;

  // Dashboard home: sidebar already shows active "Dashboard" — skip redundant crumb.
  if (allCrumbs.length === 1 && allCrumbs[0] === 'Dashboard') {
    breadcrumbEl.innerHTML = '';
    breadcrumbEl.setAttribute('aria-hidden', 'true');
    return;
  }
  breadcrumbEl.removeAttribute('aria-hidden');

  breadcrumbEl.innerHTML = allCrumbs
    .map((crumb, index) => {
      const isLast = index === allCrumbs.length - 1;
      const isFirst = index === 0;
      const linkHref = isFirst ? dashUrl : null;

      if (isLast) {
        return `<span class="breadcrumb-current">${crumb}</span>`;
      }

      return `
      <a class="breadcrumb-link"
         href="${linkHref || '#'}">
        ${crumb}
      </a>
      <span class="breadcrumb-separator">›</span>
    `;
    })
    .join('');
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
  const dashboardUrl = getDashboardUrl(role);

  sidebar.innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-header">
        <a href="${dashboardUrl}" class="sidebar-logo-link sidebar-logo" title="Go to Dashboard">
          <div class="sidebar-logo-mark" aria-hidden="true">${sidebarLogoMarkSvg()}</div>
          <div class="sidebar-logo-wordmark">
            <div class="sidebar-logo-title">BakeSync</div>
            <div class="sidebar-logo-subtitle">Bakery ERP</div>
          </div>
        </a>

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
            let filesNavData = '';
            if (item.href && String(item.href).startsWith('files.html')) {
              const [base, query] = String(item.href).split('?');
              let t = '';
              if (query) {
                const params = new URLSearchParams(query);
                t = params.get('type') || '';
              }
              filesNavData = `data-path="${base}" data-type="${t}"`;
            }
            return `
              <a class="sidebar-link" href="${item.href}" ${filesNavData}>
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
              ${typeof renderRoleBadge === 'function' ? renderRoleBadge(role) : ''}
            </div>
          </div>
        </div>

        <button class="sidebar-signout" type="button" id="sidebar-signout-btn">
          <span class="sidebar-signout-icon" aria-hidden="true">${iconSvg('log-out')}</span>
          <span class="sidebar-signout-text">Sign Out</span>
        </button>
      </div>
    </div>
  `;

  const toggleBtn = getToggleButton();
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
  }

  const signoutBtn = document.getElementById('sidebar-signout-btn');
  if (signoutBtn) signoutBtn.addEventListener('click', logout);
}

function initTooltips() {
  const { sidebar } = getSidebarElements();
  if (!sidebar) return;

  const tooltipId = 'sidebar-tooltip';
  let tooltipEl = document.getElementById(tooltipId);

  // Improvement 24: Hide sidebar tooltip whenever a modal is opened.
  document.addEventListener('modal:open', () => {
    if (!tooltipEl) return;
    tooltipEl.style.opacity = '0';
    tooltipEl.style.display = 'none';
    tooltipEl.style.visibility = 'hidden';
  });

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

  const currentPath = window.location.pathname || '';
  const currentParams = new URLSearchParams(window.location.search || '');
  const currentType = currentParams.get('type');

  // Clear active styles
  sidebar.querySelectorAll('.sidebar-link.active').forEach((el) => el.classList.remove('active'));

  // File-type nav items (files.html)
  const fileNavItems = sidebar.querySelectorAll('.sidebar-link[data-path]');
  fileNavItems.forEach((item) => {
    const itemPath = item.dataset.path || '';
    const rawType = item.dataset.type;
    const itemType = rawType ? rawType : null;

    const pathMatches =
      currentPath.endsWith(itemPath) || currentPath.includes(itemPath);
    if (!pathMatches) return;

    if (itemType) {
      if (String(currentType) === String(itemType)) item.classList.add('active');
      return;
    }

    // Document Manager ("All") should be active only when no ?type exists.
    if (!currentType) item.classList.add('active');
  });

  // Fallback for non-files.html links (dashboard + other pages)
  const otherLinks = sidebar.querySelectorAll('.sidebar-link[href]:not([data-path])');
  otherLinks.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const anchorPath = href.split('?')[0];
    const isActive = currentPath.endsWith(anchorPath) || currentPath.includes(anchorPath);
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
    const left = topbar.querySelector('.topbar-left');
    if (left) left.insertBefore(btn, left.firstChild);
    else topbar.insertBefore(btn, topbar.firstChild);
    return btn;
  }

  const btn = getOrCreateHamburger();
  if (!btn) return;

  let overlayEl = document.getElementById('sidebar-overlay');

  function ensureOverlay() {
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.id = 'sidebar-overlay';
      overlayEl.className = 'sidebar-overlay';
      document.body.appendChild(overlayEl);
    }
    if (!overlayEl.dataset.bakesyncOverlayBound) {
      overlayEl.addEventListener('click', () => closeMobileSidebar());
      overlayEl.dataset.bakesyncOverlayBound = '1';
    }
    return overlayEl;
  }

  function openMobileSidebar() {
    if (!currentIsMobile()) return;
    const sb = document.getElementById('sidebar') || sidebar;
    const ov = ensureOverlay();
    if (sb) sb.classList.add('mobile-open');
    if (ov) ov.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    const sb = document.getElementById('sidebar') || sidebar;
    const ov = document.getElementById('sidebar-overlay') || overlayEl;
    if (sb) sb.classList.remove('mobile-open');
    if (ov) ov.classList.remove('visible');
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 280);
  }

  btn.addEventListener('click', () => {
    if (!currentIsMobile()) return;
    const sb = document.getElementById('sidebar') || sidebar;
    if (sb.classList.contains('mobile-open')) closeMobileSidebar();
    else openMobileSidebar();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileSidebar();
  });

  let touchStartX = 0;
  document.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );
  document.addEventListener(
    'touchend',
    (e) => {
      const deltaX = touchStartX - e.changedTouches[0].clientX;
      const sb = document.getElementById('sidebar') || sidebar;
      const isOpen = sb?.classList.contains('mobile-open');
      if (isOpen && deltaX > 60) {
        closeMobileSidebar();
      }
    },
    { passive: true }
  );

  // Resize handling: disable overlay + icon-only collapse on wider screens.
  window.addEventListener('resize', () => {
    if (!currentIsMobile()) {
      document.body.style.overflow = '';
      const ov = document.getElementById('sidebar-overlay') || overlayEl;
      if (ov) ov.classList.remove('visible');
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
    if (typeof renderBreadcrumb === 'function') renderBreadcrumb();
  } catch (e) {
    // Silent: some pages may not have the expected shell.
  }
});


