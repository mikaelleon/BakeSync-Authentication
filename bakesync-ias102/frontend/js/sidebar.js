// BakeSync Sidebar (static frontend)

function roleDotColor(role) {
  if (role === "admin") return "var(--success)";
  if (role === "staff") return "#3b82f6";
  return "var(--warning)";
}

function getSidebarNav(role) {
  const groups = [];

  groups.push({
    label: "General",
    items: [{ label: "Dashboard", href: role === "admin" ? "dashboard-admin.html" : role === "staff" ? "dashboard-staff.html" : "dashboard-user.html" }],
  });

  const productionItems = [];
  if (role === "admin" || role === "staff") {
    productionItems.push({ label: "Production Log", href: "production.html" });
    productionItems.push({ label: "Recipes", href: "recipes.html" });
    productionItems.push({ label: "Inventory", href: "inventory.html" });
  } else if (role === "user") {
    productionItems.push({ label: "Inventory", href: "inventory.html" });
  }
  if (productionItems.length) groups.push({ label: "Production", items: productionItems });

  const managementItems = [];
  if (role === "admin") {
    managementItems.push({ label: "Supply Chain", href: "supply-chain.html" });
    managementItems.push({ label: "Financials", href: "financials.html" });
    managementItems.push({ label: "Team", href: "team.html" });
  }
  if (managementItems.length) groups.push({ label: "Management", items: managementItems });

  const salesItems = [];
  if (role === "admin" || role === "user") {
    salesItems.push({ label: "Point of Sale", href: "pos.html" });
  }
  if (salesItems.length) groups.push({ label: "Sales", items: salesItems });

  groups.push({
    label: "Resources",
    items: [
      { label: "Document Manager", href: "files.html" },
      { label: "Profile", href: "profile.html" },
    ],
  });

  return groups;
}

function renderSidebar() {
  const host = document.getElementById("app-sidebar");
  if (!host) return;

  if (!requireAuth()) return;
  const user = getCurrentUser();
  const role = user.role;

  const current = (window.location.pathname || "").split("/").pop() || "";
  const groups = getSidebarNav(role);

  host.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-mark">🥐</div>
          <div>
            <div class="sidebar-logo-title">BakeSync</div>
            <div class="sidebar-logo-subtitle">Bakery ERP</div>
          </div>
        </div>
      </div>

      <div class="sidebar-content">
        ${groups
          .map(
            (g) => `
          <div class="sidebar-group">
            <div class="sidebar-group-label">${g.label}</div>
            <div class="sidebar-menu">
              ${g.items
                .map((item) => {
                  const isActive = current === item.href;
                  return `
                    <a class="sidebar-link ${isActive ? "active" : ""}" href="${item.href}">
                      <span class="sidebar-link-text">${item.label}</span>
                    </a>
                  `;
                })
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">${(user.username || "U").slice(0, 1).toUpperCase()}</div>
          <div class="sidebar-user-meta">
            <div class="sidebar-user-name">${user.username || "User"}</div>
            <div class="sidebar-user-role">
              <span class="sidebar-role-text">${getRoleDisplayName(role)}</span>
              <span class="sidebar-role-dot" style="background:${roleDotColor(role)}"></span>
            </div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm sidebar-signout" type="button" id="sidebar-signout-btn">Sign Out</button>
      </div>
    </div>
  `;

  const signout = document.getElementById("sidebar-signout-btn");
  if (signout) signout.addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", renderSidebar);

