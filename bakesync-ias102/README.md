# BakeSync Authentication System

A secure authentication system for bakery management, demonstrating **Password-Based Authentication**, **Email OTP Verification**, **Role-Based Access Control (RBAC)**, and **Discretionary Access Control (DAC)**.

Built for **IAS102 Information Assurance and Security 2 - Activity 5**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Demo Accounts](#demo-accounts)
- [Security Implementation](#security-implementation)
- [Deployment](#deployment)
- [License](#license)

---

## Features

### Authentication
- **Password-Based Authentication** — Secure password hashing with bcrypt (10 rounds)
- **Email OTP Verification** — 6-digit verification code sent via email during registration
- **JWT Sessions** — Stateless authentication with 2-hour token expiry

### Access Control
- **Role-Based Access Control (RBAC)** — Three roles with distinct permissions:
  - `admin` (Manager) — Full system access
  - `staff` (Baker) — Production and inventory access
  - `user` (Cashier) — POS and order access
- **Discretionary Access Control (DAC)** — File ownership with public/private visibility

### User Experience
- Clean, responsive UI matching shadcn/ui design system
- Real-time form validation
- 10-minute OTP expiry with countdown timer
- Role-specific dashboards

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8.0+ (Aiven) |
| **Email** | Resend API |
| **Auth** | JWT, bcryptjs |
| **Deployment** | Render (Backend & Frontend) |

---

## Project Structure

```
bakesync-ias102/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MySQL connection pool
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   └── rbac.js            # Role-based access control
│   │   ├── routes/
│   │   │   ├── auth.js            # Authentication endpoints
│   │   │   ├── dashboard.js       # Dashboard data endpoints
│   │   │   └── files.js           # File management (DAC)
│   │   ├── utils/
│   │   │   ├── mailer.js          # Resend email service
│   │   │   └── otp.js             # OTP generation
│   │   └── index.js               # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── ca.pem                     # Aiven SSL certificate
├── frontend/
│   ├── css/
│   │   └── style.css              # Global styles
│   ├── js/
│   │   ├── api.js                 # API helper functions
│   │   ├── auth.js                # Authentication logic
│   │   └── config.js              # API base URL
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── otp.html
│       ├── dashboard-admin.html
│       ├── dashboard-staff.html
│       ├── dashboard-user.html
│       └── files.html
├── database/
│   └── schema.sql                 # Database schema and seed data
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **MySQL** 8.0+ (local or cloud-hosted)
- **Resend Account** for email OTP ([resend.com](https://resend.com))

### Database Setup

1. Create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Or run the SQL directly in your MySQL client:

```sql
CREATE DATABASE IF NOT EXISTS bakesync_ias102;
USE bakesync_ias102;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'user') NOT NULL,
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expires_at DATETIME DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(100) NOT NULL,
    description TEXT,
    file_type ENUM('recipe', 'report', 'schedule', 'invoice') NOT NULL,
    owner_id INT NOT NULL,
    is_public TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Backend Setup

1. Navigate to the backend directory:

```bash
cd bakesync-ias102/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Configure your `.env` file (see [Environment Variables](#environment-variables))

5. Start the development server:

```bash
npm start
```

The API will be available at `http://localhost:8080`.

### Frontend Setup

1. Update the API base URL in `frontend/js/config.js`:

```javascript
const API_BASE = "http://localhost:8080";
```

2. Serve the frontend using any static server:

```bash
cd frontend
npx serve .
```

Or use VS Code Live Server extension pointing to the `frontend` folder.

---

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database (Local)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bakesync_ias102
DB_SSL=false

# Database (Aiven - Production)
# DB_HOST=your-host.aivencloud.com
# DB_PORT=12345
# DB_USER=avnadmin
# DB_PASSWORD=your_aiven_password
# DB_NAME=bakesync_ias102
# DB_SSL=true

# JWT
JWT_SECRET=your_secure_random_string_here

# Server
PORT=8080

# CORS
FRONTEND_URL=http://localhost:5500

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### Getting a Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** in the dashboard
3. Create a new API key
4. Add the key to your `.env` as `RESEND_API_KEY`

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user (sends OTP email) |
| `POST` | `/api/auth/verify-otp` | Verify email OTP and activate account |
| `POST` | `/api/auth/resend-otp` | Resend verification OTP |
| `POST` | `/api/auth/login` | Login with credentials (returns JWT) |

### Dashboard (Protected)

| Method | Endpoint | Required Role |
|--------|----------|---------------|
| `GET` | `/api/dashboard/admin` | `admin` |
| `GET` | `/api/dashboard/staff` | `staff` |
| `GET` | `/api/dashboard/user` | `user` |

### Files (DAC Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/files` | List accessible files |
| `POST` | `/api/files` | Create new file |
| `GET` | `/api/files/:id` | View file (DAC enforced) |
| `DELETE` | `/api/files/:id` | Delete file (owner only) |
| `PATCH` | `/api/files/:id/visibility` | Toggle public/private |

### Request Headers

All protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

---

## Demo Accounts

Pre-seeded accounts for testing (already verified):

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Manager | `manager_maria` | `admin123` | Full access |
| Baker | `baker_juan` | `staff123` | Production features |
| Cashier | `cashier_ana` | `user123` | POS features |

---

## Security Implementation

### Password Security
- **bcrypt** hashing with cost factor 10
- Passwords never stored in plaintext
- Minimum 6-character requirement

### Multi-Factor Authentication
- 6-digit numeric OTP for email verification
- 10-minute expiry window
- Rate limiting on resend (60-second cooldown)
- OTP cleared after successful verification

### Role-Based Access Control (RBAC)
- Server-side middleware enforcement
- Role embedded in JWT payload
- Role-specific dashboard routing
- API endpoints protected by role requirements

### Discretionary Access Control (DAC)
- File ownership tracked by `owner_id`
- Owner controls public/private visibility
- Non-owners can only access public files
- Delete operation restricted to owner

### Additional Security
- Parameterized SQL queries (SQL injection prevention)
- CORS restricted to frontend origin
- JWT expiry (2 hours)
- SSL/TLS for database connections (production)

---

## Deployment

### Render (Recommended)

#### Backend Deployment

1. Create a new **Web Service** on Render
2. Connect your repository
3. Configure:
   - **Root Directory**: `bakesync-ias102/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables in Render dashboard
5. Upload `ca.pem` for Aiven SSL (if using Aiven)

#### Frontend Deployment

1. Create a new **Static Site** on Render
2. Connect your repository
3. Configure:
   - **Root Directory**: `bakesync-ias102/frontend`
   - **Publish Directory**: `.`
4. Update `js/config.js` with your backend URL

### Environment Variables for Production

Set these in your Render dashboard:

```
DB_HOST=<aiven_host>
DB_PORT=<aiven_port>
DB_USER=avnadmin
DB_PASSWORD=<aiven_password>
DB_NAME=bakesync_ias102
DB_SSL=true
JWT_SECRET=<secure_random_string>
FRONTEND_URL=https://your-frontend.onrender.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

---

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
