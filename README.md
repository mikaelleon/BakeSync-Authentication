# BakeSync IAS102

Authentication and Access Control System for Bakery Management

## Overview

This project demonstrates core security concepts for the IAS102 course:

- **RBAC** (Role-Based Access Control): Admin / Staff / User roles
- **DAC** (Discretionary Access Control): File ownership with public/private visibility
- **MFA/OTP**: Email OTP verification for registration and account deletion
- **JWT Authentication**: Stateless token-based session management

## Project Structure

```
BakeSync/
├── backend/           # Node.js + Express API server
│   ├── src/
│   │   ├── config/    # Database configuration
│   │   ├── middleware/# Auth, RBAC, CSRF middleware
│   │   ├── routes/    # API route handlers
│   │   └── utils/     # OTP and email utilities
│   └── package.json
├── frontend/          # Static HTML/CSS/JS
│   ├── pages/         # HTML pages (login, dashboard, files, etc.)
│   ├── js/            # JavaScript modules
│   └── css/           # Stylesheets
├── database/          # SQL schema and migrations
│   ├── schema.sql     # Main database schema
│   └── migrations/    # Incremental SQL (e.g. rollback helpers)
└── docs/              # Documentation
    ├── ARCHITECTURE.md    # Stack, Mermaid diagrams, file layout
    ├── DATABASE.md        # Full SQL reference (schema + migrations)
    ├── FRONTEND.md        # Pages, JS modules, UI behavior
    └── TECHNICAL_REPORT.md # IAS102 security analysis
```

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | HTML / CSS / JavaScript |
| Backend  | Node.js + Express       |
| Database | MySQL 8.0 (Aiven Cloud) |
| Email    | Resend SDK              |
| Auth     | JWT + bcrypt            |

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register with email OTP
- **POST** `/api/auth/verify-otp` - Verify email OTP
- **POST** `/api/auth/resend-otp` - Resend OTP code
- **POST** `/api/auth/login` - Login and receive JWT

### Dashboards (RBAC Protected)
- **GET** `/api/dashboard/admin` - Admin only
- **GET** `/api/dashboard/staff` - Staff only
- **GET** `/api/dashboard/user` - User only

### Files (DAC Protected)
- **GET** `/api/files` - List accessible files
- **POST** `/api/files` - Create new file
- **GET** `/api/files/:id` - View file (owner or public)
- **DELETE** `/api/files/:id` - Delete file (owner only)
- **PATCH** `/api/files/:id/visibility` - Toggle visibility (owner only)
- **GET** `/api/files/logs/denied` - Admin only; recent denied DAC attempts (returns `[]` if the audit table is missing or on error so clients stay stable)

### User Profile
- **GET** `/api/users/me` - Get profile
- **PATCH** `/api/users/me` - Update profile
- **POST** `/api/users/me/delete/request-otp` - Request deletion OTP
- **POST** `/api/users/me/delete/confirm` - Confirm account deletion

## Roles

| Role  | Description | Dashboard Access |
|-------|-------------|------------------|
| Admin | Manager     | Admin dashboard, denied access logs |
| Staff | Baker       | Staff dashboard, production focus |
| User  | Cashier     | User dashboard, sales focus |

## DAC Rules

- Each file has an owner (`owner_id`)
- Owner can view, delete, and toggle visibility
- Non-owners can only view public files (`is_public = 1`)
- Access denials are logged to `access_logs` table (when present)

## Frontend shell (authenticated pages)

- **Topbar:** breadcrumb trail (hidden on dashboard home to avoid duplicating the sidebar), hamburger (mobile), and a **dark/light theme** toggle. Username and role are **not** shown in the topbar; **Sign out** lives in the **sidebar footer** only.
- **Sidebar:** role-based nav, **Settings** as a normal nav item, footer user card (avatar, username, role badge), and **Sign Out**.
- **Theme:** `localStorage` key `bakesync_theme` (`light` | `dark`); `data-theme="dark"` on `<html>`. Applied early from `frontend/js/config.js` to reduce flash.

## Quick Start

### 1. Database Setup

Run `database/schema.sql` on your MySQL instance.

Optional: `database/migrations/` may contain one-off scripts (for example, rolling back optional columns if you experimented with file-storage fields). Apply only what matches your live schema.

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=8080
FRONTEND_URL=http://localhost:5500

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=defaultdb
DB_SSL=false

JWT_SECRET=your-secret-key
RESEND_API_KEY=your-resend-key
```

Start the server:

```bash
npm run dev
```

### 3. Frontend Setup

Serve the `frontend/` folder with any static server:

```bash
npx serve frontend -l 5500
```

Open: http://localhost:5500/pages/login.html

## Demo Accounts

| Username       | Password  | Role  |
|----------------|-----------|-------|
| manager_maria  | admin123  | Admin |
| baker_juan     | staff123  | Staff |
| cashier_ana    | user123   | User  |

## Documentation

- [Technical report](./docs/TECHNICAL_REPORT.md) — Security analysis and reflection questions  
- [System architecture](./docs/ARCHITECTURE.md) — Stack, diagrams (Mermaid), repository layout  
- [Database SQL](./docs/DATABASE.md) — Full schema and migration queries in one place  
- [Frontend guide](./docs/FRONTEND.md) — Pages, `sidebar.js` / `dashboard.js`, theme and navigation  

Diagrams in `docs/ARCHITECTURE.md` render on GitHub; for local viewing use [mermaid.live](https://mermaid.live) or a Mermaid-capable editor.
