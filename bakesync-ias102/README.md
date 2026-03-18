# BakeSync IAS102 - Authentication System

A secure authentication system demonstrating Password-Based Authentication, Multi-Factor Authentication (MFA), Role-Based Access Control (RBAC), and Discretionary Access Control (DAC).

Built for IAS102 Activity 5.

## Tech Stack

- **Backend**: Node.js + Express + MySQL
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Google Cloud Run (backend) + Netlify (frontend)

## Features

1. **Password-Based Authentication** - bcrypt hashing with 10 rounds
2. **Multi-Factor Authentication** - 6-digit OTP with 5-minute expiry
3. **Role-Based Access Control (RBAC)** - Admin, Staff, User roles
4. **Discretionary Access Control (DAC)** - File ownership and visibility control

## Project Structure

```
bakesync-ias102/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── middleware/auth.js
│   │   ├── middleware/rbac.js
│   │   ├── routes/auth.js
│   │   ├── routes/dashboard.js
│   │   ├── routes/files.js
│   │   ├── utils/otp.js
│   │   └── index.js
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── pages/
│   ├── css/style.css
│   ├── js/
│   └── netlify.toml
├── database/schema.sql
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- MySQL 8.0+

### Database Setup

1. Start MySQL server
2. Run the schema:
```bash
mysql -u root -p < database/schema.sql
```

3. Generate proper bcrypt hashes for seed users:
```bash
cd backend
node -e "const bcrypt = require('bcrypt'); ['admin123', 'staff123', 'user123'].forEach(async p => console.log(p, await bcrypt.hash(p, 10)));"
```

4. Update the password_hash values in schema.sql with the generated hashes

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```bash
cp .env.example .env
```

4. Update .env with your database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bakesync_ias102
JWT_SECRET=your_secret_key
PORT=8080
FRONTEND_URL=http://localhost:5500
```

5. Start the server:
```bash
npm start
```

### Frontend Setup

1. Serve the frontend folder using any static server:
```bash
cd frontend
npx serve .
```

Or use VS Code Live Server extension.

2. Update `js/config.js` with your backend URL:
```javascript
const API_BASE = "http://localhost:8080";
```

## Demo Accounts

| Role    | Username      | Password  | Display Name |
|---------|---------------|-----------|--------------|
| Admin   | manager_maria | admin123  | Manager      |
| Staff   | baker_juan    | staff123  | Baker        |
| User    | cashier_ana   | user123   | Cashier      |

## API Endpoints

### Authentication

| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| POST   | /api/auth/login     | Login (step 1)        |
| POST   | /api/auth/verify-otp| Verify OTP (step 2)   |
| POST   | /api/auth/register  | Register new user     |

### Dashboard (RBAC Protected)

| Method | Endpoint              | Required Role |
|--------|-----------------------|---------------|
| GET    | /api/dashboard/admin  | admin         |
| GET    | /api/dashboard/staff  | staff         |
| GET    | /api/dashboard/user   | user          |

### Files (DAC Protected)

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/files                  | List accessible files    |
| POST   | /api/files                  | Create file              |
| GET    | /api/files/:id              | View file (DAC enforced) |
| DELETE | /api/files/:id              | Delete file (owner only) |
| PATCH  | /api/files/:id/visibility   | Toggle visibility        |

## Deployment

### Backend (Google Cloud Run)

1. Build Docker image:
```bash
cd backend
docker build -t bakesync-api .
```

2. Push to Google Artifact Registry:
```bash
docker tag bakesync-api gcr.io/PROJECT_ID/bakesync-api
docker push gcr.io/PROJECT_ID/bakesync-api
```

3. Deploy to Cloud Run:
```bash
gcloud run deploy bakesync-api \
  --image gcr.io/PROJECT_ID/bakesync-api \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars "DB_HOST=...,DB_USER=...,DB_PASSWORD=...,DB_NAME=bakesync_ias102,JWT_SECRET=...,FRONTEND_URL=https://your-netlify-url.netlify.app"
```

### Frontend (Netlify)

1. Update `js/config.js` with Cloud Run URL
2. Deploy frontend folder to Netlify
3. Configure environment in Netlify dashboard

## Security Implementation

### Password Security
- bcrypt hashing with cost factor 10
- Passwords never stored in plaintext

### MFA (Multi-Factor Authentication)
- 6-digit numeric OTP
- 5-minute expiry window
- OTP appears in server console only (simulation)

### RBAC (Role-Based Access Control)
- Three roles: admin, staff, user
- Server-side middleware enforcement
- Role-specific dashboard content

### DAC (Discretionary Access Control)
- File ownership tracked by owner_id
- Owner can toggle public/private visibility
- Non-owners can only access public files
- Server-side enforcement on all file operations

## Known Limitations

1. OTP delivered via console (not SMS/email)
2. JWT stored in sessionStorage (XSS vulnerable)
3. No account lockout after failed attempts
4. No rate limiting

## License

MIT
