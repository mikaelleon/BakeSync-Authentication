# BakeSync IAS102 — System Architecture

## Stack Overview

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | Vanilla HTML / CSS / JavaScript         |
| Backend     | Node.js + Express                       |
| Database    | MySQL 8.0 (Aiven Cloud)                 |
| Hosting FE  | Render Static Site                      |
| Hosting BE  | Render Web Service                      |
| Email       | Resend SDK                              |
| Auth        | JWT (jsonwebtoken) + bcrypt             |

## System Architecture Diagram

```mermaid
graph TB
  subgraph Client["Browser (Render Static Site)"]
    FE["Vanilla HTML/CSS/JS<br/>frontend/pages/*.html"]
    JS["frontend/js/<br/>api.js · auth.js · dashboard.js<br/>sidebar.js · files.js · profile.js"]
  end

  subgraph Backend["Render Web Service (Node.js + Express)"]
    MW["Middleware<br/>auth.js · rbac.js · csrf.js"]
    AUTH["Routes<br/>/api/auth/*"]
    DASH["Routes<br/>/api/dashboard/*"]
    FILES["Routes<br/>/api/files/*"]
    USERS["Routes<br/>/api/users/*"]
  end

  subgraph DB["Aiven MySQL 8.0 (Cloud)"]
    USERS_T["users table"]
    FILES_T["files table"]
    LOGS_T["access_logs table"]
  end

  subgraph Email["Resend (Email Service)"]
    SMTP["Transactional Email<br/>OTP Verification"]
  end

  FE --> JS
  JS -->|"HTTPS REST API calls<br/>Bearer JWT"| MW
  MW --> AUTH
  MW --> DASH
  MW --> FILES
  MW --> USERS
  AUTH -->|"bcrypt verify<br/>JWT sign"| USERS_T
  AUTH -->|"OTP store/verify"| USERS_T
  AUTH -->|"sendOTPEmail()"| SMTP
  DASH -->|"COUNT queries"| USERS_T
  DASH -->|"COUNT queries"| FILES_T
  FILES -->|"CRUD"| FILES_T
  FILES -->|"DAC audit"| LOGS_T
  USERS -->|"PATCH / DELETE"| USERS_T
```

## Authentication Flow

```mermaid
sequenceDiagram
  participant U  as User (Browser)
  participant FE as Frontend
  participant BE as Backend (Express)
  participant DB as MySQL (Aiven)
  participant EM as Resend Email

  Note over U,EM: Registration Flow (MFA)

  U  ->> FE: Fill register form
  FE ->> BE: POST /api/auth/register
  BE ->> DB: INSERT user (is_verified=0)
  BE ->> EM: sendOTPEmail(email, otp)
  EM -->> U: Email with 6-digit OTP
  BE -->> FE: 201 { userId, expiresAt }
  FE ->> U:  Redirect to otp.html

  U  ->> FE: Enter OTP code
  FE ->> BE: POST /api/auth/verify-otp
  BE ->> DB: Check otp_code + expiry + attempts
  BE ->> DB: UPDATE is_verified=1, clear OTP
  BE -->> FE: 200 { message: verified }
  FE ->> U:  Redirect to login.html

  Note over U,EM: Login Flow (Password only)

  U  ->> FE: Enter username + password
  FE ->> BE: POST /api/auth/login
  BE ->> DB: SELECT user by username
  BE ->> BE: bcrypt.compare(password, hash)
  BE ->> BE: jwt.sign({ id, role, username })
  BE -->> FE: 200 { token, role, username }
  FE ->> U:  Redirect to role dashboard
```

## Authorization Model

```mermaid
graph LR
  subgraph RBAC["Role-Based Access Control"]
    A["Admin (Manager)<br/>All dashboards<br/>All files visible<br/>User activity logs"]
    S["Staff (Baker)<br/>Staff dashboard only<br/>Own + public files<br/>Recipe focus"]
    U["User (Cashier)<br/>User dashboard only<br/>Own + public files<br/>Invoice focus"]
  end

  subgraph DAC["Discretionary Access Control"]
    OWN["Owner<br/>Full CRUD on own files<br/>Toggle visibility<br/>Delete"]
    PUB["Public file viewer<br/>Read only"]
    DEN["Non-owner + private<br/>403 Access Denied<br/>Logged in access_logs"]
  end

  A --> OWN
  S --> OWN
  U --> OWN
  A --> PUB
  S --> PUB
  U --> PUB
  A -.->|"attempt"| DEN
  S -.->|"attempt"| DEN
  U -.->|"attempt"| DEN
```

## Database Schema

```mermaid
erDiagram
  users {
    int     id              PK
    varchar username        UK
    varchar email           UK
    varchar password_hash
    enum    role
    tinyint is_verified
    varchar otp_code
    datetime otp_expires_at
    tinyint otp_attempts
    datetime otp_locked_until
    timestamp created_at
  }

  files {
    int     id              PK
    varchar filename
    text    description
    enum    file_type
    int     owner_id        FK
    tinyint is_public
    timestamp created_at
  }

  access_logs {
    int     id              PK
    int     user_id         FK
    int     file_id         FK
    varchar action
    enum    result
    varchar reason
    timestamp accessed_at
  }

  users ||--o{ files       : "owns"
  users ||--o{ access_logs : "generates"
  files ||--o{ access_logs : "records"
```

## Deployment Architecture

```mermaid
graph LR
  GH["GitHub Repository<br/>bakesync-ias102"]

  subgraph Render["Render.com"]
    RS["Static Site<br/>bakesync-frontend<br/>bakesync-frontend.onrender.com"]
    RW["Web Service<br/>bakesync-authentication<br/>bakesync-authentication.onrender.com"]
  end

  AV["Aiven MySQL<br/>defaultdb<br/>asia-southeast1"]
  RE["Resend<br/>Email API"]

  GH -->|"auto-deploy on push"| RS
  GH -->|"auto-deploy on push"| RW
  RW -->|"SSL connection"| AV
  RW -->|"HTTPS API"| RE
  RS -->|"REST API calls"| RW
```
