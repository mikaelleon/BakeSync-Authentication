# BakeSync Authentication System
## Technical Report - IAS102 Activity 5

**Course:** IAS102 Information Assurance and Security 2
**Project:** BakeSync ERP Authentication System
**Stack:** Node.js/Express + MySQL + Vanilla HTML/CSS/JS

---

## 1. System Overview

BakeSync is a bakery management system that demonstrates four key authentication and access control mechanisms. The system includes password-based authentication with bcrypt hashing. It uses multi-factor authentication through one-time passwords. It implements role-based access control for dashboard features. It also applies discretionary access control for file management.

The architecture follows a client-server model. The frontend runs on Netlify as static HTML pages. The backend runs on Google Cloud Run as a containerized Express API. The database uses MySQL hosted on Cloud SQL.

### Authentication Flow

The user enters username and password on the login page. The server validates credentials using bcrypt comparison. If valid, the server generates a 6-digit OTP with 5-minute expiry. The OTP appears in the server console to simulate SMS delivery. The user enters the OTP on the verification page. The server checks the OTP code and expiry time. If valid, the server issues a JWT token with 2-hour expiry. The frontend stores the token and redirects to the role-specific dashboard.

### Role Mapping

The system uses three internal roles that map to bakery positions. Admin maps to Manager with full system access. Staff maps to Baker with production features. User maps to Cashier with order features. Each role sees a different dashboard with relevant data.

---

## 2. Reflection Question Responses

### Question 1: Why is MFA more secure than password-only authentication?

Multi-factor authentication adds a second layer of verification beyond passwords. Password-only systems fail when attackers obtain credentials through phishing or data breaches. With MFA, stolen passwords alone cannot grant access.

The BakeSync system requires both something you know and something you have. The password is knowledge-based. The OTP represents possession of the delivery channel. An attacker needs both factors to succeed.

Time-based expiry adds another defense layer. The OTP expires after 5 minutes in this system. This limits the window for attackers to use intercepted codes. Single-use codes prevent replay attacks where attackers reuse old valid codes.

MFA stops automated credential stuffing attacks. Bots that test leaked password lists cannot proceed past the OTP step. This protects users who reuse passwords across multiple sites.

### Question 2: Compare RBAC and DAC in terms of scalability.

Role-Based Access Control scales better for large organizations. Administrators assign permissions to roles rather than individual users. Adding new employees only requires role assignment. This reduces administrative overhead significantly.

In BakeSync, three roles cover all access patterns. New bakers receive the staff role automatically. They inherit all staff permissions without manual configuration. This approach handles hundreds of users efficiently.

Discretionary Access Control scales differently. Each resource owner controls their own permissions. This works well for personal file management. Users decide what to share without administrator involvement.

DAC becomes complex at organizational scale. Many owners make many individual decisions. Tracking who shared what with whom grows difficult. Policy enforcement becomes inconsistent across users.

BakeSync uses both models appropriately. RBAC controls feature access at the dashboard level. DAC controls file sharing at the resource level. This hybrid approach balances central policy with user autonomy.

RBAC requires fewer permission checks at runtime. The system verifies role membership once per request. DAC requires ownership checks for each resource access. Performance impact increases with DAC complexity.

### Question 3: What security weaknesses exist in your prototype?

The prototype has several known limitations for demonstration purposes.

The OTP delivery uses console logging instead of actual SMS or email. Real attackers with server access could see codes directly. Production systems need secure external delivery channels.

JWT tokens are stored in browser sessionStorage. This storage is accessible to JavaScript code on the page. Cross-site scripting vulnerabilities could expose tokens. Production systems should use httpOnly cookies instead.

The system lacks account lockout mechanisms. Attackers can attempt unlimited password guesses. Rate limiting and lockout after failed attempts would improve security. The prototype allows brute force attacks.

Input validation relies mainly on parameterized queries. No web application firewall filters malicious requests. SQL injection is prevented but other attacks are possible. XSS protection is minimal beyond basic escaping.

The prototype does not implement HTTPS locally. Network traffic travels unencrypted during development. Cloud Run and Netlify provide TLS automatically. Local testing exposes credentials on the network.

Session management is basic. No refresh token rotation occurs. Stolen tokens remain valid for 2 hours. Compromised sessions cannot be remotely invalidated.

### Question 4: How would you improve it for enterprise deployment?

Several enhancements would prepare this system for enterprise use.

Replace console OTP delivery with actual SMS or authenticator app integration. Services like Twilio handle SMS delivery at scale. TOTP apps like Google Authenticator eliminate SMS interception risks.

Move JWT storage to httpOnly cookies with secure flags. Set SameSite attribute to prevent cross-site request forgery. Add CSRF tokens for state-changing operations.

Implement account lockout after 5 failed login attempts. Lock duration should increase with repeated violations. Add CAPTCHA after 3 failures to stop automated attacks. Send email alerts for suspicious login activity.

Add refresh token rotation for long-lived sessions. Short-lived access tokens limit exposure windows. Refresh tokens allow seamless user experience. Token revocation lists enable emergency logout.

Deploy a web application firewall before the API. Filter common attack patterns automatically. Log all blocked requests for security analysis. Update rules based on threat intelligence.

Implement comprehensive audit logging. Track all authentication events with timestamps. Record file access for compliance requirements. Store logs in tamper-evident storage systems.

Add encryption for sensitive database fields. Encrypt personal data at rest. Use separate encryption keys per tenant. Implement key rotation procedures.

### Question 5: How does the principle of least privilege apply in your system?

The principle of least privilege limits access to minimum necessary levels. Users receive only permissions required for their job functions. This reduces damage from compromised accounts.

BakeSync applies this principle through role-based access. Cashiers cannot access production schedules. Bakers cannot view system administration data. Managers have broader access matching their responsibilities.

The dashboard routes enforce role restrictions server-side. A cashier token cannot access the admin dashboard endpoint. The API returns 403 Forbidden for unauthorized role access. Client-side hiding is supplemented by server enforcement.

File access demonstrates discretionary least privilege. Users start with access only to their own files. Public files expand access intentionally. Private files remain restricted to owners.

The file deletion endpoint shows tight privilege control. Only file owners can delete their files. Managers cannot delete files owned by others. This prevents accidental or malicious data loss.

API endpoints require authentication by default. Anonymous access is limited to login and registration. Protected routes check token validity first. Invalid or expired tokens receive 401 responses.

Database connections use application-specific credentials. The API account has limited database permissions. Direct database access requires separate administrator credentials. Compromise of the API does not expose full database control.

---

## 3. Architecture Diagram Description

The system architecture flows through six main stages.

**Stage 1: Registration**
New users submit username, password, and role. The backend hashes the password with bcrypt. User record is stored in MySQL users table. Registration completes without automatic login.

**Stage 2: Login**
User submits credentials on login.html. Backend queries users table by username. bcrypt compares submitted password with stored hash. On match, backend generates 6-digit OTP. OTP and expiry time update in users table. Server logs OTP to console for simulation. Response includes userId but no token yet.

**Stage 3: OTP Verification**
User enters OTP on otp.html page. Backend retrieves user by userId. System checks otp_code matches submitted value. System verifies otp_expires_at is in the future. On success, OTP fields are cleared from database. Backend signs JWT with user id, username, and role.

**Stage 4: JWT Token**
Token returned to frontend with role and username. Frontend stores token in sessionStorage. All subsequent API requests include Authorization header. Backend middleware validates token on protected routes.

**Stage 5: Dashboard Access**
Frontend redirects to role-specific dashboard page. Dashboard fetches data from role-specific API endpoint. RBAC middleware checks token role against required role. Dashboard displays role-appropriate statistics and features.

**Stage 6: File Management (DAC)**
Files.html displays accessible files to user. GET /api/files returns owned files plus public files. File creation sets current user as owner. View requests check ownership or public flag. Delete requests require exact owner match. Visibility toggle requires ownership.

### Component Diagram

```
[Browser]
    |
    |-- login.html --> POST /api/auth/login
    |-- otp.html --> POST /api/auth/verify-otp
    |-- dashboard-*.html --> GET /api/dashboard/:role
    |-- files.html --> /api/files/*

[Netlify CDN]
    |
    | HTTPS
    |
[Google Cloud Run]
    |-- Express API
    |   |-- CORS middleware
    |   |-- JSON parser
    |   |-- Auth middleware (JWT)
    |   |-- RBAC middleware (roles)
    |   |-- Route handlers
    |
[Cloud SQL MySQL]
    |-- users table
    |-- files table
```

---

## 4. Security Controls Summary

| Control | Implementation | Location |
|---------|----------------|----------|
| Password Hashing | bcrypt (rounds=10) | auth.js route |
| OTP Generation | 6-digit numeric | otp.js utility |
| OTP Expiry | 5-minute window | auth.js route |
| Token Signing | JWT with secret | auth.js route |
| Token Expiry | 2-hour lifetime | auth.js route |
| Token Validation | Middleware check | auth.js middleware |
| Role Enforcement | Middleware guard | rbac.js middleware |
| Ownership Check | Query condition | files.js route |
| SQL Injection Prevention | Parameterized queries | All routes |
| CORS Restriction | Origin whitelist | index.js config |

---

## 5. Conclusion

The BakeSync authentication system demonstrates four security mechanisms effectively. Password hashing protects stored credentials from database breaches. Multi-factor authentication prevents unauthorized access with stolen passwords. Role-based access control restricts features by job function. Discretionary access control gives users ownership of their files.

The prototype prioritizes clarity over production readiness. Known limitations exist in OTP delivery and token storage. Enterprise deployment requires additional security layers. The architecture provides a foundation for secure bakery management.

The system meets IAS102 Activity 5 requirements. It demonstrates understanding of authentication principles. It shows practical implementation of access control models. The code is organized for educational review and extension.
