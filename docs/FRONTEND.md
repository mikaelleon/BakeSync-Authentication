# BakeSync IAS102 Frontend Documentation

This document describes the **static frontend** under `frontend/` at the repository root (vanilla HTML / CSS / JavaScript). It covers:

- Pages in `frontend/pages/*.html`
- Shared behavior in `frontend/js/sidebar.js`, `frontend/js/dashboard.js`, and related modules
- Data flow to the backend API (`backend/`)
- URL parameters, DAC/RBAC visuals, **theme (dark/light)**, and shell layout

## Conventions and runtime model

### Auth storage (sessionStorage)
The frontend uses `sessionStorage` for:
- `token` (JWT)
- `role` (`admin` | `staff` | `user`)
- `username`

Key helpers are in:
- `frontend/js/api.js`
  - `isAuthenticated()`, `getCurrentUser()`, `requireAuth()`, `logout()`

### API base URL
The frontend calls the backend through:
- `frontend/js/config.js` → `API_BASE`

### Theme (dark / light mode)
- **Storage:** `localStorage` key `bakesync_theme` with values `light` or `dark`.
- **DOM:** Light mode is the default (no attribute). Dark mode sets `data-theme="dark"` on `document.documentElement` (`<html>`).
- **Flash prevention:** A small IIFE at the top of `config.js` reads `bakesync_theme` and applies `data-theme` before the rest of the page runs, so the first paint matches the saved preference when possible.
- **Toggle:** `#theme-toggle` in the topbar (moon / sun SVG icons). Logic lives in `dashboard.js`: `applyTheme()`, `syncThemeToggleButton()`, `initThemeToggle()` (bound once per button via `data-theme-bound`). `initNavbar()` calls `initThemeToggle()` on shell pages so any page that already invoked `initNavbar()` wires the control.
- **Styles:** `frontend/css/style.css` defines base tokens under `:root` and overrides under `:root[data-theme="dark"]` (background, card, border, primary, role-badge tokens, etc.).

### DAC/RBAC enforcement model
- **RBAC**: backend enforces access to dashboards and other role-gated APIs. The frontend also redirects on mismatch.
- **DAC (Document Manager)**:
  - `GET /api/files` returns only files visible to the user (owner + public).
  - When a user tries to view a private non-owned file, the backend returns `403`, and the frontend shows an "Access Denied" modal.

## Shared UI Features

## Sidebar utility and behavior (`frontend/js/sidebar.js`)

### What it renders
The sidebar is rendered dynamically into the page’s sidebar container using `renderSidebarContent()`:

- Primary shell: `aside#sidebar` (class `sidebar`)
- `getSidebarElements()` still accepts `aside#app-sidebar` for older markup if it appears anywhere

The sidebar includes:

- BakeSync logo + wordmark (SVG mark in the logo tile, not emoji)
- Navigation links filtered by role (Dashboard, Document Manager, type-specific links, **Settings** → `profile.html` as a normal nav row—not a separate floating footer link)
- **Footer**
  - User card: avatar (initial), **username**, **role badge** (`renderRoleBadge()` from `dashboard.js` when that script loaded first)
  - **Sign Out** button only in the footer (`logout()`). There is **no** Sign Out in the topbar.

### Sticky + collapsible state (desktop)
The collapsible state is controlled by CSS + `localStorage`:
- Key: `bakesync_sidebar_collapsed`
- Value: `'true'` / `'false'`

The logic is in:
- `initSidebar()`
- `toggleSidebar()`
- `setToggleIcon()`

Collapsed visuals:
- Sidebar width reduces (CSS variable driven)
- Nav labels hide
- Tooltips appear on hover for collapsed mode

### Mobile behavior (max-width 768px)
For widths `< 768px`:
- The sidebar is hidden off-screen by default (via CSS transform)
- A hamburger button is injected/handled in `initMobileSidebar()`
- Clicking hamburger opens an overlay sidebar
- Clicking the overlay closes it

### Breadcrumb trail
`renderBreadcrumb()` (in `sidebar.js`):

- Maps the current HTML filename to crumb labels (e.g. `files.html` → Dashboard › Document Manager).
- Appends a crumb when `files.html` has `?type=recipe|report|schedule|invoice`.
- First crumb links to the role-appropriate dashboard via `getDashboardUrl(role)` and `sessionStorage.role`.
- On **dashboard home** (`dashboard-*.html`) with only the “Dashboard” crumb, the breadcrumb nav is **cleared** so the label is not duplicated next to the already-active sidebar item.

### Active nav item highlighting
`setActiveNavItem()`:

- Compares `window.location.pathname`
- Also considers the `?type=` URL parameter for Document Manager routes (`files.html`)

### Tooltips
`initTooltips()`:
- Creates a tooltip element (`#sidebar-tooltip`)
- Shows tooltip only when the sidebar is collapsed and the viewport is not mobile

## Toast notifications (`frontend/js/dashboard.js`)
`showToast(message, type)` appends a fixed-position toast element.
- Success and error are supported by class (`toast toast-${type}`)

## Page transitions (`frontend/js/dashboard.js`)
`initPageTransitions()` (invoked at load) intercepts **same-origin** `<a href>` navigation, adds a short **exit** animation class, then assigns `location.href`. Entry animations use `.page-content`, `.auth-card`, `.dashboard-section`, `.kpi-card` in `style.css` (`@keyframes pageFadeIn`, `sectionSlideIn`, `kpiCardIn`, etc.).

## File modal and DAC access denied modal (`frontend/js/dashboard.js`)

### File Details modal
- Modal is created/ensured via `ensureFileModal()`
- View flow:
  - `openFileModal(fileId)` calls `GET /api/files/:id`
  - On success, it populates `#modal-body` with filename/type/description/visibility/owner

### Access Denied modal
When `GET /api/files/:id` returns an error (e.g., backend `403`):
- The UI closes the file modal
- Shows `access-denied-modal` with:
  - `"DAC Rule: Only the file owner can access private files..."`

## Dashboards (role-based) (`frontend/js/dashboard.js`)

### HTML pages
The dashboard HTML pages are lightweight and rely on `dashboard.js` to render the content:
- `pages/dashboard-admin.html`
- `pages/dashboard-staff.html`
- `pages/dashboard-user.html`

Each page contains:

- `aside.sidebar#sidebar`
- `header.topbar`: `topbar-left` (hamburger + `#topbar-breadcrumb`), `topbar-right` (**theme toggle** `#theme-toggle` only)
- `main#page-content` where `dashboard.js` renders the main dashboard body

Each page calls on load (typical order):

- `initSidebar()`
- `setActiveNavItem()`
- `initMobileSidebar()`
- `initNavbar()` (legacy navbar IDs if present + **theme toggle**)
- `renderBreadcrumb()` when available
- Role loader: `loadAdminDashboard()`, `loadStaffDashboard()`, or `loadUserDashboard()`

### Role guard
`loadAdminDashboard()`, `loadStaffDashboard()`, `loadUserDashboard()`:
- Check `getCurrentUser().role`
- Redirect to `access-denied.html?reason=...` on mismatch

### Greeting and date
`renderHeaderBlock(role)` uses:

- `getGreeting()` (time-based greeting)
- **Username only** in the headline (e.g. “Good morning, manager_maria.”)—role is shown in the sidebar footer, not repeated in the greeting
- `formatDateLong()` (long date formatting)

### KPI row
KPI cards are generated by `renderKpiRow(role, data.stats)`.

### Role-specific panels
`renderRoleDashboardContent(role)` renders after the Document Manager widget:

- Admin:
  - Recent Activity feed from `GET /api/dashboard/admin` (`renderActivityFeed()`). Rows use a **left border** colored by uploader role instead of repeating full role pills; backend deduplicates by file id where needed.
  - **DAC Access Denial Log** from `GET /api/files/logs/denied` only when the response is a **non-empty** array; otherwise no panel (avoids empty or error states in demos).
  - No in-app **RBAC Information** collapsible card—role explanation belongs in the written technical report.
- Staff:
  - Production schedule table from `GET /api/dashboard/staff`
  - Rendered by `renderProductionScheduleTable()`
- User:
  - Notifications panel from `GET /api/dashboard/user`
  - Rendered by `renderNotificationsPanel()`

## Document Manager widget (`dashboard.js` + `files.html`)

The Document Manager is the centerpiece on dashboards and is implemented twice:
1. Embedded preview widget on dashboards (inline)
2. Full Document Manager page (`files.html`)

Both use the same backend endpoint:
- `GET /api/files`

### Widget in dashboards
`renderDocumentManagerWidget(role, containerEl)`:

- Fetches `GET /api/files` **once** per render; results are **deduplicated by file `id`** before display (guards duplicate rows or double render).
- Filters locally by tab (`All`, `Recipes`, `Reports`, `Schedules`, `Invoices`)
- Shows up to **5** items per active tab
- **Header:** title + subtitle + tab strip only—no duplicate “View all” / “Add” buttons in the widget (those actions live in the page-level quick actions and `files.html`)
- **Upload:** use **+ New Document** / role equivalent and `files.html?action=upload`—the dashboard widget does not embed the old inline upload panel

Widget tabs:
- Built by `renderFilterTabs()`
- Active tab defaults by role:
  - admin: `all`
  - staff: `recipe`
  - user: `invoice`

Widget file cards:

- File-type glyph uses a **single Lucide-style `file-text` SVG** inside a colored wrapper class (`widgetFileTypeIcon()`), not per-type emoji
- View button; owner-only Toggle visibility (`PATCH /api/files/:id/visibility`) and Delete (`DELETE /api/files/:id`) with inline confirm UI
- DAC overlays for private non-owned vs owner-private states as before

### Full Document Manager page (`pages/files.html`)
The full page uses `initFilesPage()` from `dashboard.js`.

#### URL param handling
On load, it reads:
- `?type=recipe|report|schedule|invoice`:
  - selects the matching tab
- `?action=upload`:
  - expands the upload panel
  - scrolls it into view
  - focuses the filename input

#### Tabs and filtering (client-side only)
Filtering behavior:
- It loads all visible files once from `GET /api/files`
- It does not call the API per tab switch
- It re-renders from cached `allFiles`

Tab click updates URL without reload:
- Uses `history.pushState(...)`
- Clears `action` param when switching tabs

#### Search
`#files-search` filters the visible cards by filename substring match (case-insensitive).

#### Upload panel
The upload panel lives under:
- `#files-upload-panel`

It is collapsed by default (CSS `max-height` transition):
- Expand: `openUploadPanel()`
- Collapse: `closeUploadPanel()`

Submission:
- `POST /api/files` with:
  - `filename`
  - `description`
  - `file_type` (recipe/report/schedule/invoice)
  - `is_public` (radio selection)

On success:
- The new file is prepended to `allFiles`
- The panel collapses
- A toast is shown

## Feature-specific API mapping (frontend -> backend)

### Auth
- `POST /api/auth/login` (handled in `frontend/js/auth.js` -> `handleLogin`)
- `POST /api/auth/register` (handled in `frontend/js/auth.js` -> `handleRegister`)
- `POST /api/auth/verify-otp` (handled in `auth.js` OTP init block)
- `POST /api/auth/resend-otp` (handled in `auth.js` OTP init block)

### Profile / settings
- `GET /api/users/me` (handled in `frontend/js/profile.js` -> `loadProfile`)
- `PATCH /api/users/me` (handled in `profile.js` -> `handleProfileSave`)
- `POST /api/users/me/delete/request-otp` (handled in `profile.js` -> `requestDeleteOTP`)
- `POST /api/users/me/delete/confirm` (handled in `profile.js` -> `confirmDelete`)

### Files / DAC Document Manager
- `GET /api/files` (used by dashboards widget and `files.html`)
- `POST /api/files` (upload in widget + `files.html`)
- `GET /api/files/:id` (View modal in both)
- `DELETE /api/files/:id` (Delete buttons)
- `PATCH /api/files/:id/visibility` (owner-only visibility toggle)

## Page-by-page documentation

## `frontend/pages/index.html`
Purpose:
- Redirects users based on authentication state:
  - If `isAuthenticated()`: redirect to role dashboard
  - Else: redirect to `login.html`

Role mapping:
- `admin` -> `dashboard-admin.html`
- `staff` -> `dashboard-staff.html`
- `user` -> `dashboard-user.html`

## `frontend/pages/login.html`
Purpose:
- Username/password login form.

Key elements:
- Form: `#login-form` calling `handleLogin(event)` via `onsubmit`
- Error alert elements: `#error-alert`, `#error-message`

Data flow (`auth.js`):
- Calls `POST ${API_BASE}/api/auth/login`
- On `403` unverified accounts:
  - stores `reg_userId`, `reg_username` in `sessionStorage`
  - redirects to `otp.html`

## `frontend/pages/register.html`
Purpose:
- Creates a new user with role selection.

Form handler (`auth.js`):
- `#register-form` -> `handleRegister(event)`
- Calls `POST /api/auth/register`
- Stores:
  - `reg_userId`, `reg_username`, `reg_email`
- Redirects to `otp.html`

Role selection:
- `#role` select values: `admin`, `staff`, `user`

## `frontend/pages/otp.html`
Purpose:
- OTP verification and resend flow for newly registered accounts.

Key elements:
- Timer: `#otp-timer` (10 minutes)
- Verification code input: `#otp-input`
- Resend button: `#otp-resend-btn` (disabled until timer conditions)

Session dependency:
- Requires `sessionStorage.reg_userId` and `reg_username` and `reg_email`

API calls:
- `POST /api/auth/verify-otp` with `{ userId, otp }`
- `POST /api/auth/resend-otp` with `{ userId }`

On success:
- Hides OTP form
- Shows success container
- Redirects to `login.html?registered=true`

## `frontend/pages/access-denied.html`
Purpose:
- Unified RBAC/DAC denial UI.

Behavior:
- Reads `?reason=...` and displays it in `#reason`
- Provides:
  - `Go to my dashboard`:
    - uses `sessionStorage.role`
    - redirects to the role-specific dashboard page
  - `Sign out` button calls `logout()`
  - Back to login link

## `frontend/pages/dashboard-admin.html`
Purpose:
- Admin (Manager) dashboard.

How content is built:

- Static HTML contains the shell (`#page-content` is filled by JS)
- `loadAdminDashboard()` in `dashboard.js` guards role, then `renderRoleDashboardContent('admin')` loads `GET /api/dashboard/admin` and renders KPI row, onboarding banner when stats are all zero, Document Manager widget, Recent Activity, and conditionally the DAC denial log—not an RBAC explainer card

## `frontend/pages/dashboard-staff.html`
Purpose:
- Baker (Staff) dashboard.

Content rendering:
- `loadStaffDashboard()` calls `GET /api/dashboard/staff`
- Renders:
  - KPI row from `data.stats`
  - Document Manager widget
  - Production schedule table from `data.schedule`

## `frontend/pages/dashboard-user.html`
Purpose:
- Cashier (User) dashboard.

Content rendering:
- `loadUserDashboard()` calls `GET /api/dashboard/user`
- Renders:
  - KPI row from `data.stats`
  - Document Manager widget
  - Notifications panel from `data.notifications`

## `frontend/pages/files.html`
Purpose:
- Full Document Manager: DAC enforced.

Core features:
1. Tabs (`#files-filter-tabs`) and search (`#files-search`)
2. Card list (`#files-cards`)
3. Collapsible upload panel:
   - trigger: `#files-upload-toggle`
   - panel: `#files-upload-panel`
   - cancel: `#files-upload-cancel`
   - submit: `#files-upload-submit`

Key behaviors:
- Reads `?type=` and `?action=upload`
- Loads all visible files once from `GET /api/files`
- Re-renders locally on:
  - tab switch
  - search typing
- View:
  - View button triggers `openFileModal(fileId)` which calls `GET /api/files/:id`
  - If `403`, a DAC access denied modal is shown

## `frontend/pages/profile.html`
Purpose:
- Account settings:
  - update username/email
  - delete account with OTP verification

JavaScript (`profile.js`):
- `initProfilePage()` runs on load and:
  - calls `loadProfile()` -> `GET /api/users/me`
- Save changes:
  - submit `#profile-form`
  - PATCH ` /api/users/me`
- Delete:
  - request OTP button calls `POST /api/users/me/delete/request-otp`
  - confirm form calls `POST /api/users/me/delete/confirm` with `{ otp }`
  - clears `sessionStorage` and returns to `login.html`

## Legacy UI pages (stubs / placeholders)

These pages use the **same** `app-layout` shell as the dashboards (`aside#sidebar`, topbar with breadcrumb + theme toggle, `main.page-content`) and a **Coming soon** style placeholder. Backend modules for inventory, POS, etc. are not wired in IAS102:

- `frontend/pages/inventory.html`
- `frontend/pages/recipes.html`
- `frontend/pages/pos.html`
- `frontend/pages/production.html`
- `frontend/pages/analytics.html`
- `frontend/pages/supply-chain.html`
- `frontend/pages/financials.html`
- `frontend/pages/team.html`

They exist so sidebar navigation demonstrates the full ERP-style structure while the course prototype focuses on auth, RBAC, DAC, and Document Manager.

## CSS and UI patterns (where to look)

- Shared styling: `frontend/css/style.css`
  - Sidebar: `.sidebar`, `.sidebar.collapsed`, tooltips, mobile overlay, `.sidebar-signout`, `.sidebar-user-role`
  - Topbar: `.topbar`, `.breadcrumb`, `.theme-toggle` / `.theme-icon-moon` / `.theme-icon-sun`
  - Dark theme: `:root[data-theme="dark"]` token overrides
  - Document Manager: `.file-card`, `.upload-panel`, filter tabs, toasts, KPI / activity helpers
- Shared JS:
  - `frontend/js/sidebar.js` - sidebar behavior
  - `frontend/js/dashboard.js` - dashboards + Document Manager (widget + full page init)

## Notes for developers

1. **Avoid adding new endpoints** for file widget filtering: the widget and `files.html` filter locally from a single `GET /api/files` response.
2. **DAC is enforced by the backend**: UI overlays and modals reflect server decisions; they are not the source of truth.
3. **URL params are part of the UI contract**: dashboard primary CTAs route to `files.html?action=upload` (and optional `type=...`).
4. **Quick actions** on dashboards are **two links** (primary upload + secondary list)—no stub “system overview” or similar third buttons.
5. **Shell consistency**: authenticated pages should include `config.js` (for early theme + `API_BASE`), then `api.js`, then `dashboard.js` before `sidebar.js` if the sidebar footer needs `renderRoleBadge()`.

