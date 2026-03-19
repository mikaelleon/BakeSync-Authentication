// BakeSync IAS102 Sidebar (vanilla JS, collapsible + mobile overlay)

const SIDEBAR_COLLAPSED_KEY = "bakesync_sidebar_collapsed";

function roleDotColor(role) {
    if (role === "admin") return "var(--success)";
    if (role === "staff") return "#3b82f6";
    return "var(--warning)";
}

function getSidebarNav(role) {
    const typeLinks = (type) => `files.html?type=${encodeURIComponent(type)}`;

    if (role === "admin") {
        return [
            { label: "Dashboard", href: "dashboard-admin.html", icon: "🏠", activeId: "dashboard" },
            { label: "Document Manager", href: "files.html", icon: "📁", activeId: "docs" },
            { label: "Recipes", href: typeLinks("recipe"), icon: "📘", activeId: "docs-recipe" },
            { label: "Reports", href: typeLinks("report"), icon: "📊", activeId: "docs-report" },
            { label: "Schedules", href: typeLinks("schedule"), icon: "🗓️", activeId: "docs-schedule" },
            { label: "Invoices", href: typeLinks("invoice"), icon: "🧾", activeId: "docs-invoice" },
            { divider: true },
            { label: "System Overview", href: null, icon: "🧠", activeId: "visual-only" },
            { label: "User Activity", href: null, icon: "👥", activeId: "visual-only-2" },
        ];
    }

    if (role === "staff") {
        return [
            { label: "Dashboard", href: "dashboard-staff.html", icon: "🏠", activeId: "dashboard" },
            { label: "Document Manager", href: "files.html", icon: "📁", activeId: "docs" },
            { label: "My Recipes", href: typeLinks("recipe"), icon: "📘", activeId: "docs-recipe" },
            { label: "Schedules", href: typeLinks("schedule"), icon: "🗓️", activeId: "docs-schedule" },
            { label: "Production Log", href: null, icon: "🏭", activeId: "visual-only" },
            { divider: true },
            { label: "Raw Materials", href: null, icon: "🧂", activeId: "visual-only-2" },
        ];
    }

    // user / cashier
    return [
        { label: "Dashboard", href: "dashboard-user.html", icon: "🏠", activeId: "dashboard" },
        { label: "Document Manager", href: "files.html", icon: "📁", activeId: "docs" },
        { label: "My Invoices", href: typeLinks("invoice"), icon: "🧾", activeId: "docs-invoice" },
        { label: "Reports", href: typeLinks("report"), icon: "📊", activeId: "docs-report" },
        { divider: true },
        { label: "Point of Sale", href: null, icon: "🛒", activeId: "visual-only" },
    ];
}

function buildSidebarHTML() {
    const user = getCurrentUser();
    const role = user.role;

    const navItems = getSidebarNav(role);
    const initials = (user.username || "U").slice(0, 1).toUpperCase();

    const itemsHTML = navItems
        .map((item) => {
            if (item.divider) {
                return `<div class="sidebar-divider" aria-hidden="true"></div>`;
            }

            const href = item.href || "#";
            const isDisabled = !item.href;

            return `
              <a
                class="sidebar-nav-item"
                href="${href}"
                ${isDisabled ? "aria-disabled=true tabindex=-1 onclick='return false;'" : ""}
                data-nav-id="${item.activeId}"
                data-nav-label="${item.label}"
              >
                <span class="sidebar-nav-icon" aria-hidden="true">${item.icon}</span>
                <span class="sidebar-nav-label">${item.label}</span>
              </a>
            `;
        })
        .join("");

    return `
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="sidebar-logo-mark" aria-hidden="true">🥐</span>
          <span class="sidebar-logo-wordmark">BakeSync</span>
        </div>
        <button class="sidebar-collapse-btn" type="button" id="sidebar-collapse-btn" aria-label="Toggle sidebar">
          <span class="sidebar-collapse-icon" aria-hidden="true">⟨</span>
        </button>
      </div>

      <div class="sidebar-body" role="navigation" aria-label="Primary">
        ${itemsHTML}
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user-card">
          <div class="sidebar-avatar" aria-hidden="true">${initials}</div>
          <div class="sidebar-user-meta">
            <div class="sidebar-user-name">${user.username || "User"}</div>
            <div class="sidebar-user-role">
              <span class="sidebar-user-role-text">${getRoleDisplayName(role)}</span>
              <span class="sidebar-user-role-dot" style="background:${roleDotColor(role)}"></span>
            </div>
          </div>
        </div>

        <button class="sidebar-signout" type="button" id="sidebar-signout-btn" aria-label="Sign out">
          <span class="sidebar-signout-icon" aria-hidden="true">⎋</span>
          <span class="sidebar-signout-label">Sign Out</span>
        </button>
      </div>
    `;
}

function getSidebarEl() {
    return document.getElementById("sidebar") || document.querySelector(".sidebar");
}

function getMainContentEl() {
    return document.getElementById("main-content") || document.querySelector(".main-content");
}

function isMobileViewport() {
    return typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false;
}

function applyCollapsedState(collapsed) {
    const sidebarEl = getSidebarEl();
    const mainEl = getMainContentEl();
    if (!sidebarEl || !mainEl) return;

    // On mobile we always keep expanded overlay behavior.
    if (isMobileViewport()) return;

    if (collapsed) {
        sidebarEl.classList.add("collapsed");
        mainEl.classList.add("sidebar-collapsed");
        sidebarEl.setAttribute("data-collapsed", "true");
    } else {
        sidebarEl.classList.remove("collapsed");
        mainEl.classList.remove("sidebar-collapsed");
        sidebarEl.setAttribute("data-collapsed", "false");
    }
}

function updateToggleIcon(collapsed) {
    const sidebarEl = getSidebarEl();
    if (!sidebarEl) return;
    const btn = sidebarEl.querySelector("#sidebar-collapse-btn");
    const icon = sidebarEl.querySelector(".sidebar-collapse-icon");
    if (!btn || !icon) return;
    // If collapsed -> chevron-right (pointing right). Else chevron-left.
    icon.textContent = collapsed ? "⟩" : "⟨";
}

function hideLabelsDuringCollapse(hide) {
    const sidebarEl = getSidebarEl();
    if (!sidebarEl) return;
    sidebarEl.classList.toggle("labels-hidden", !!hide);
}

function setActiveNavItem() {
    const sidebarEl = getSidebarEl();
    if (!sidebarEl) return;

    const pathname = (window.location.pathname || "").split("/").pop() || "";
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");

    const allNav = Array.from(sidebarEl.querySelectorAll(".sidebar-nav-item"));
    allNav.forEach((a) => a.classList.remove("active"));

    // If on files page, match by ?type (or All)
    if (pathname === "files.html") {
        const effectiveType = type || "all";
        const navIdByType = {
            all: "docs",
            recipe: "docs-recipe",
            report: "docs-report",
            schedule: "docs-schedule",
            invoice: "docs-invoice",
        };
        const activeId = navIdByType[effectiveType] || "docs";
        const match = sidebarEl.querySelector(`.sidebar-nav-item[data-nav-id="${activeId}"]`);
        if (match) match.classList.add("active");
        return;
    }

    // Otherwise compare dashboard routes
    const idByPage = {
        "dashboard-admin.html": "dashboard",
        "dashboard-staff.html": "dashboard",
        "dashboard-user.html": "dashboard",
    };

    const activeId = idByPage[pathname] || null;
    if (!activeId) return;
    const match = sidebarEl.querySelector(`.sidebar-nav-item[data-nav-id="${activeId}"]`);
    if (match) match.classList.add("active");
}

function initTooltips() {
    const sidebarEl = getSidebarEl();
    if (!sidebarEl) return;

    let tooltipEl = null;

    const ensureTooltip = () => {
        if (tooltipEl) return tooltipEl;
        tooltipEl = document.createElement("div");
        tooltipEl.className = "sidebar-tooltip";
        tooltipEl.style.display = "none";
        document.body.appendChild(tooltipEl);
        return tooltipEl;
    };

    const navItems = Array.from(sidebarEl.querySelectorAll(".sidebar-nav-item[data-nav-label]"));
    navItems.forEach((item) => {
        item.addEventListener("mouseenter", (e) => {
            if (!sidebarEl.classList.contains("collapsed") || isMobileViewport()) return;
            const label = item.getAttribute("data-nav-label") || "";
            const t = ensureTooltip();
            t.textContent = label;
            t.style.display = "block";

            const rect = item.getBoundingClientRect();
            // Left of tooltip should align with right edge of collapsed sidebar.
            t.style.left = `${Math.min(rect.right + 8, window.innerWidth - 200)}px`;
            t.style.top = `${Math.max(rect.top, 16)}px`;
            item.classList.add("tooltip-active");
        });

        item.addEventListener("mouseleave", () => {
            if (!sidebarEl.classList.contains("collapsed") || isMobileViewport()) return;
            if (tooltipEl) tooltipEl.style.display = "none";
        });
    });
}

function toggleSidebar() {
    const sidebarEl = getSidebarEl();
    const mainEl = getMainContentEl();
    if (!sidebarEl || !mainEl) return;

    if (isMobileViewport()) return; // don't apply collapsed mode on mobile

    const willCollapse = !sidebarEl.classList.contains("collapsed");
    // Collapse: hide labels during transition.
    if (willCollapse) hideLabelsDuringCollapse(true);

    applyCollapsedState(willCollapse);
    updateToggleIcon(willCollapse);

    // Persist
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, willCollapse ? "true" : "false");

    if (!willCollapse) {
        // Expand: show labels after width transition ends.
        setTimeout(() => hideLabelsDuringCollapse(false), 250);
    }

    setActiveNavItem();
}

function initSidebar() {
    if (!requireAuth()) return;

    // Render sidebar once if empty.
    const sidebarEl = getSidebarEl();
    if (!sidebarEl) return;
    if (!sidebarEl.dataset.bakesyncRendered) {
        sidebarEl.innerHTML = buildSidebarHTML();
        sidebarEl.dataset.bakesyncRendered = "true";
    }

    // Restore collapsed state
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    const collapsed = saved === "true";

    applyCollapsedState(collapsed);
    updateToggleIcon(collapsed);
    hideLabelsDuringCollapse(collapsed);

    const collapseBtn = sidebarEl.querySelector("#sidebar-collapse-btn");
    if (collapseBtn) collapseBtn.addEventListener("click", toggleSidebar);

    const signoutBtn = sidebarEl.querySelector("#sidebar-signout-btn");
    if (signoutBtn) signoutBtn.addEventListener("click", logout);

    initTooltips();
    setActiveNavItem();

    window.addEventListener("popstate", setActiveNavItem);
}

function initMobileSidebar() {
    if (!requireAuth()) return;

    const sidebarEl = getSidebarEl();
    if (!sidebarEl) return;

    let overlayEl = document.getElementById("sidebar-overlay");
    if (!overlayEl) {
        overlayEl = document.createElement("div");
        overlayEl.id = "sidebar-overlay";
        overlayEl.className = "sidebar-overlay";
        document.body.appendChild(overlayEl);
        overlayEl.addEventListener("click", closeMobileSidebar);
    }

    const hamburger = document.getElementById("hamburger");
    if (!hamburger) return;

    function openMobileSidebar() {
        if (!isMobileViewport()) return;
        overlayEl.classList.add("show");
        sidebarEl.classList.add("mobile-open");
    }

    function closeMobileSidebar() {
        overlayEl.classList.remove("show");
        sidebarEl.classList.remove("mobile-open");
    }

    hamburger.addEventListener("click", () => {
        if (sidebarEl.classList.contains("mobile-open")) closeMobileSidebar();
        else openMobileSidebar();
    });

    // Close on navigation clicks (any sidebar link)
    sidebarEl.addEventListener("click", (e) => {
        const target = e.target;
        if (!target) return;
        const link = target.closest && target.closest(".sidebar-nav-item");
        if (!link) return;
        if (!isMobileViewport()) return;
        closeMobileSidebar();
    });

    window.addEventListener("resize", () => {
        if (!isMobileViewport()) {
            overlayEl.classList.remove("show");
            sidebarEl.classList.remove("mobile-open");
        }
    });
}

// Shared initializer: must be called on each dashboard + files page.
function initSharedSidebar() {
    initSidebar();
    initMobileSidebar();
}

// Backwards-compatible exports for callers in HTML.
window.initSidebar = initSharedSidebar;
window.toggleSidebar = toggleSidebar;
window.setActiveNavItem = setActiveNavItem;
window.initTooltips = initTooltips;


