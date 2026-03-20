# BakeSync IAS102 (Backend + Static Frontend)

This folder contains the **IAS102 implementation** of BakeSync focused on:

- **RBAC** (Role-Based Access Control): Admin / Staff / User
- **DAC** (Discretionary Access Control): database-backed “resources/files” with ownership + public visibility
- **MFA/OTP** flows: email OTP verification + OTP-gated account deletion
- A **static frontend** that visually matches the original dashboard layout (sidebar + role-specific dashboards)

## Architecture

### Backend
- **Path**: `bakesync-ias102/backend`
- **Runtime**: Node.js + Express
- **Database**: MySQL (Aiven/Local)
- **Core routes**
  - **Auth (OTP email verification)**: `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/resend-otp`, `POST /api/auth/login`
  - **Role dashboards (RBAC enforced)**: `GET /api/dashboard/admin`, `GET /api/dashboard/staff`, `GET /api/dashboard/user`
  - **Document manager (DAC enforced)**: `GET/POST /api/files`, `GET/DELETE /api/files/:id`, `PATCH /api/files/:id/visibility`
  - **User profile & deletion (OTP required)**: `GET /api/users/me`, `PATCH /api/users/me`,
    `POST /api/users/me/delete/request-otp`, `POST /api/users/me/delete/confirm`

### Frontend
- **Path**: `bakesync-ias102/frontend`
- **Type**: Static HTML/CSS/JS (Netlify style)
- **Key pages**
  - Auth: `pages/login.html`, `pages/register.html`, `pages/otp.html`
  - Dashboards: `pages/dashboard-admin.html`, `pages/dashboard-staff.html`, `pages/dashboard-user.html`
  - Document manager: `pages/files.html`
  - Settings: `pages/profile.html`
- **App shell**
  - Sidebar + topbar layout: `js/sidebar.js` + CSS in `css/style.css`

## IAS102 Requirements Mapping

### RBAC
- **Roles**
  - `admin` (Manager)
  - `staff` (Baker)
  - `user` (Cashier)
- **Dashboard access restriction**
  - Backend enforces role access using middleware:
    - `GET /api/dashboard/admin` → Admin only
    - `GET /api/dashboard/staff` → Staff only
    - `GET /api/dashboard/user` → User only
  - Frontend also guards dashboard pages and redirects to `pages/access-denied.html` if role mismatches.
- **Different content per role**
  - Admin: business overview + management actions
  - Staff: production schedule/actions
  - User: POS + notifications/actions

### DAC (Document Manager)
“Files/resources” represent bakery materials like:
- recipes, reports, schedules, invoices

Rules (enforced by backend):
- **Each file has an owner** (`files.owner_id`)
- **Owner can always view/delete/toggle visibility**
- **Non-owners**
  - Can only list/view **public** files
  - Receive **403 Access denied** for private files they don’t own

Frontend behavior:
- `pages/files.html` lists accessible files (owned + public) from `GET /api/files`
- “View file” opens a modal:
  - If backend returns 403, the UI shows an “Access denied” modal state

## Database

### Minimal IAS102 schema (recommended for Activity 5)
- **File**: `bakesync-ias102/database/schema.sql`
- Includes only:
  - `users` (auth + role + OTP fields)
  - `files` (DAC resources)

### Full ERP schema (optional)
- **File**: `bakesync-ias102/database/00-master-schema.sql`
- Includes additional modules (inventory/recipes/pos/financials/etc.)
  - The IAS102 backend will **gracefully fall back to 0** if optional tables do not exist.

### OTP columns (important)
The `users.otp_code` and `users.otp_expires_at` columns are reused for:
- Email verification OTP (registration)
- Account deletion OTP (deletion confirmation)

## Configuration

### Backend `.env`
Create `bakesync-ias102/backend/.env`:

```env
PORT=8080
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=defaultdb
DB_SSL=false

JWT_SECRET=replace-with-strong-secret

RESEND_API_KEY=your_resend_key
```

Notes:
- `FRONTEND_URL` is used for CORS.
- If using Aiven SSL, set `DB_SSL=true` and ensure `bakesync-ias102/backend/ca.pem` exists.

### Frontend API base URL
Update `bakesync-ias102/frontend/js/config.js`:

- `API_BASE` must point at the backend base URL (Render/local).

## Running locally

### 1) Database
Run `bakesync-ias102/database/schema.sql` on your MySQL instance.

### 2) Backend
From `bakesync-ias102/backend`:

```bash
npm install
npm run dev
```

Backend default: `http://localhost:8080`

### 3) Frontend
You can serve `bakesync-ias102/frontend` with any static server.

Example (Node):

```bash
npx serve bakesync-ias102/frontend -l 5173
```

Open:
- `http://localhost:5173/pages/login.html`

## Troubleshooting

### “Unknown column … delete_otp_code”
This project uses **only** `otp_code` / `otp_expires_at`. If your DB previously added `delete_otp_*`,
run the optional cleanup migration:
- `bakesync-ias102/database/migrations/cleanup_drop_delete_otp_columns.sql`

