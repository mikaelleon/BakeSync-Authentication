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
│   └── migrations/    # Database migrations
└── docs/              # Documentation
    └── TECHNICAL_REPORT.md
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
- Access denials are logged to `access_logs` table

## Quick Start

### 1. Database Setup

Run `database/schema.sql` on your MySQL instance.

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

- [Technical Report](./docs/TECHNICAL_REPORT.md) - Security analysis and reflection questions
