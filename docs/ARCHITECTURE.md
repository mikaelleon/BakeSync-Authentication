# BakeSync IAS102 System Architecture

## Stack Overview

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | HTML / CSS / JavaScript |
| Backend  | Node.js + Express       |
| Database | MySQL 8.0 (Aiven Cloud) |
| Hosting  | Render (Static + Web Service) |
| Email    | Resend SDK              |
| Auth     | JWT + bcrypt            |

## Frontend UX (IAS102 shell)

Authenticated pages share **`frontend/css/style.css`** and a common layout:

| Area | Contents |
|------|-----------|
| **Topbar** | Mobile hamburger, breadcrumb (`#topbar-breadcrumb`, populated by `renderBreadcrumb()` in `sidebar.js`), **theme toggle** only (`#theme-toggle`). No username, role, or sign-out in the topbar. |
| **Sidebar** | `sidebar.js` renders into `#sidebar`: logo, role-filtered nav, **Settings** link in the nav list, footer user card (avatar, username, role badge), **Sign Out**. |
| **Theme** | `config.js` restores `bakesync_theme` before paint; `dashboard.js` binds the toggle (`applyTheme` / `initThemeToggle`, invoked from `initNavbar()`). Dark palette uses `:root[data-theme="dark"]` in `style.css`. |

See **[FRONTEND.md](./FRONTEND.md)** for page-by-page behavior and API mapping.

## System Architecture Diagram

```mermaid
graph TB
  subgraph Client["Browser (Render Static Site)"]
    FE["HTML/CSS/JS<br/>frontend/pages/*.html"]
    JS["frontend/js/<br/>api.js, auth.js, dashboard.js<br/>sidebar.js, files.js, profile.js"]
  end

  subgraph Backend["Render Web Service (Node.js + Express)"]
    MW["Middleware<br/>auth.js, rbac.js, csrf.js"]
    AUTH["Routes<br/>/api/auth/*"]
    DASH["Routes<br/>/api/dashboard/*"]
    FILES["Routes<br/>/api/files/*"]
    USERS["Routes<br/>/api/users/*"]
  end

  subgraph DB["Aiven MySQL 8.0"]
    USERS_T["users table"]
    FILES_T["files table"]
    LOGS_T["access_logs table"]
  end

  subgraph Email["Resend"]
    SMTP["Transactional Email<br/>Registration OTP, deletion OTP,<br/>password reset OTP"]
  end

  FE --> JS
  JS -->|"HTTPS REST API<br/>Bearer JWT"| MW
  MW --> AUTH
  MW --> DASH
  MW --> FILES
  MW --> USERS
  AUTH -->|"bcrypt verify<br/>JWT sign"| USERS_T
  AUTH -->|"OTP / reset token<br/>in users.otp_* fields"| USERS_T
  AUTH -->|"sendOTPEmail()<br/>sendPasswordResetOTPEmail()<br/>sendAccountDeletionOTPEmail()"| SMTP
  DASH -->|"COUNT queries"| USERS_T
  DASH -->|"COUNT queries"| FILES_T
  FILES -->|"CRUD"| FILES_T
  FILES -->|"DAC audit"| LOGS_T
  USERS -->|"PATCH / DELETE"| USERS_T
```

## Authentication Flow

```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant FE as Frontend
  participant BE as Backend (Express)
  participant DB as MySQL
  participant EM as Resend Email

  Note over U,EM: Registration Flow (MFA)

  U ->> FE: Fill register form
  FE ->> BE: POST /api/auth/register
  BE ->> DB: INSERT user (is_verified=0)
  BE ->> EM: sendOTPEmail(email, otp)
  EM -->> U: Email with 6-digit OTP
  BE -->> FE: 201 { userId, expiresAt }
  FE ->> U: Redirect to otp.html

  U ->> FE: Enter OTP code
  FE ->> BE: POST /api/auth/verify-otp
  BE ->> DB: Check otp_code + expiry + attempts
  BE ->> DB: UPDATE is_verified=1, clear OTP
  BE -->> FE: 200 { message: verified }
  FE ->> U: Redirect to login.html

  Note over U,EM: Login Flow

  U ->> FE: Enter username + password
  FE ->> BE: POST /api/auth/login
  BE ->> DB: SELECT user by username
  BE ->> BE: bcrypt.compare(password, hash)
  BE ->> BE: jwt.sign({ id, role, username })
  BE -->> FE: 200 { token, role, username }
  FE ->> U: Redirect to role dashboard

  Note over U,EM: Password reset (verified accounts only)

  U ->> FE: Forgot password — enter email
  FE ->> BE: POST /api/auth/forgot-password
  BE ->> DB: Store reset OTP in otp_code / otp_expires_at
  BE ->> EM: sendPasswordResetOTPEmail(email, username, otp)
  EM -->> U: Email with 6-digit code
  FE ->> BE: POST /api/auth/verify-reset-otp
  BE -->> FE: { resetToken }
  FE ->> BE: POST /api/auth/reset-password
  BE ->> DB: bcrypt hash; clear reset state
  FE ->> U: Close modal; sign in with new password
```

## Authorization Model

```mermaid
graph LR
  subgraph RBAC["Role-Based Access Control"]
    A["Admin (Manager)<br/>All dashboards<br/>Access logs"]
    S["Staff (Baker)<br/>Staff dashboard<br/>Production focus"]
    U["User (Cashier)<br/>User dashboard<br/>Sales focus"]
  end

  subgraph DAC["Discretionary Access Control"]
    OWN["Owner<br/>Full CRUD<br/>Toggle visibility"]
    PUB["Public viewer<br/>Read only"]
    DEN["Non-owner + private<br/>403 Denied<br/>Logged"]
  end

  A --> OWN
  S --> OWN
  U --> OWN
  A --> PUB
  S --> PUB
  U --> PUB
```

## Database Schema

```mermaid
erDiagram
  users {
    int id PK
    varchar username UK
    varchar email UK
    varchar password_hash
    enum role
    tinyint is_verified
    varchar otp_code
    datetime otp_expires_at
    int otp_attempts
    datetime otp_locked_until
    timestamp created_at
  }

  files {
    int id PK
    varchar filename
    text description
    enum file_type
    int owner_id FK
    tinyint is_public
    timestamp created_at
  }

  access_logs {
    int id PK
    int user_id FK
    int file_id FK
    enum action
    enum result
    varchar reason
    timestamp created_at
  }

  users ||--o{ files : "owns"
  users ||--o{ access_logs : "generates"
  files ||--o{ access_logs : "records"
```

## File Structure

```
BakeSync/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # MySQL connection pool
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification
│   │   │   ├── rbac.js         # Role checking
│   │   │   └── csrf.js         # Origin validation
│   │   ├── routes/
│   │   │   ├── auth.js         # Register, login, OTP, forgot/reset password
│   │   │   ├── dashboard.js    # Role-specific stats
│   │   │   ├── files.js        # DAC file management
│   │   │   └── users.js        # Profile, deletion
│   │   └── utils/
│   │       ├── otp.js          # OTP generation
│   │       └── mailer.js       # Resend email
│   ├── index.js                # Express app entry
│   └── package.json
├── frontend/
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── otp.html
│   │   ├── dashboard-admin.html
│   │   ├── dashboard-staff.html
│   │   ├── dashboard-user.html
│   │   ├── files.html
│   │   └── profile.html
│   ├── js/
│   │   ├── api.js              # API request wrapper
│   │   ├── auth.js             # Login, register, OTP, forgot-password UI
│   │   ├── config.js           # API base URL
│   │   ├── dashboard.js        # Dashboard loaders
│   │   ├── files.js            # File management
│   │   ├── profile.js          # Profile handlers
│   │   └── sidebar.js          # Navigation
│   └── css/
│       └── style.css
├── database/
│   ├── schema.sql              # Main schema + seed data
│   ├── full_database.sql       # Complete install (same as schema + header)
│   └── migrations/             # Optional SQL (e.g. rollback_* helpers)
└── docs/
    ├── ARCHITECTURE.md         # This file
    ├── DATABASE.md             # Full SQL reference
    ├── FRONTEND.md             # UI pages and JS modules
    └── TECHNICAL_REPORT.md     # Security analysis
```
