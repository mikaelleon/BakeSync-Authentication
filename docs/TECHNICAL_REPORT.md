# BakeSync IAS102 Technical Report

**Course:** IAS 102 - Information Assurance and Security
**System:** BakeSync Authentication and Access Control Prototype
**Date:** March 2026

---

## 1. Introduction

This report documents the design and implementation of the BakeSync IAS102 authentication and access control system. BakeSync is a bakery management application that demonstrates core security concepts for the IAS102 course. The system provides a practical example of how modern web applications protect user accounts and control access to resources.

The prototype implements four security mechanisms that work together to protect the application. Password-based authentication uses bcrypt hashing to store credentials securely. Multi-factor authentication via email OTP adds a second verification layer during registration. Role-Based Access Control restricts dashboard features based on user roles such as Admin, Staff, and User. Discretionary Access Control allows file owners to decide whether their documents are private or public.

The backend uses Node.js with Express and connects to a MySQL database hosted on Aiven Cloud. The frontend consists of static HTML pages with JavaScript that communicate with the backend through REST API calls. Interface behavior (navigation shell, theme toggle, breadcrumbs, Document Manager) is summarized in **`docs/FRONTEND.md`**. The Resend SDK handles transactional email delivery for OTP verification codes.

---

## 2. Authentication Implementation

### 2.1 Password-Based Authentication

The system stores passwords securely using the bcryptjs library. When a user registers, the backend hashes the password before storing it in the database. The hash function uses a salt rounds value of 10, which meets the OWASP minimum recommendation for password hashing. Higher salt rounds provide stronger protection but require more computation time. For this prototype, 10 rounds balance security with performance.

The login flow begins when a user submits their username and password. The backend queries the users table to find a matching username. If no user exists, it returns a generic "Invalid credentials" error. This prevents attackers from discovering valid usernames through error messages. The system then uses bcrypt.compare() to check the submitted password against the stored hash. This comparison runs in constant time to prevent timing attacks. If the password matches and the account has is_verified set to 1, the backend issues a JSON Web Token.

The JWT contains three claims: the user ID, username, and role. The token expires after 2 hours, which limits the window for misuse if a token is stolen. The backend signs tokens using a secret key stored in the JWT_SECRET environment variable. The payload is base64 encoded but not encrypted, so the system avoids storing sensitive data in the token.

### 2.2 Multi-Factor Authentication (Email OTP)

The system implements MFA during the registration process. After a user submits the registration form, the backend generates a 6-digit OTP code using the generateOTP() function in `backend/src/utils/otp.js`. The code is stored in the otp_code column of the users table. The otp_expires_at column records when the code becomes invalid, set to 10 minutes from generation. This expiry window follows NIST SP 800-63B guidance for OTP validity.

The Resend SDK sends the OTP to the user email address. The email contains the 6-digit code displayed in a styled format with clear instructions. If email delivery fails, the backend deletes the user record and returns an error. This prevents orphan accounts that cannot complete verification.

The frontend redirects users to otp.html where they enter the code. The backend checks several conditions before accepting the OTP. It verifies the code matches, the expiry time has not passed, and the account is not locked out. The server returns the expiresAt timestamp in the registration response. The frontend uses this server-side timestamp to display an accurate countdown timer. This approach fixes the timer desync problem that occurs when users refresh the page or have incorrect local clocks.

Brute-force protection limits OTP guessing attacks. The otp_attempts column tracks failed verification attempts. After 5 failed attempts, the system sets otp_locked_until to 15 minutes in the future. During lockout, all verification and resend requests return HTTP 429 with the unlock time. The system also clears the OTP code on lockout, requiring users to request a new code after the lock expires.

**Reflection Question 1: Why is MFA more secure than password-only authentication?**

MFA provides stronger security because it requires proof from two different authentication factors. Passwords are something you know, while email access is something you have. An attacker who steals a password through phishing or a data breach still cannot log in without access to the registered email account. The 6-digit OTP has one million possible combinations, and the 5-attempt lockout makes guessing impractical. The 10-minute expiry window limits the time for interception attacks. Together, these layers create defense in depth that single-factor authentication cannot provide.

---

## 3. RBAC Implementation

The system defines three roles that map to bakery positions. Admin represents the Manager with full system access. Staff represents Bakers who handle production tasks. User represents Cashiers who process sales transactions. The role value is stored in the users table as an ENUM column restricted to these three values.

The requireRole middleware factory in `backend/src/middleware/rbac.js` enforces role-based restrictions. The function accepts one or more allowed roles as arguments and returns an Express middleware. When a request arrives, the middleware checks if req.user.role matches any allowed role. If not, it returns HTTP 403 Forbidden with the message "insufficient role."

Each dashboard endpoint applies this middleware to restrict access. The **GET** `/api/dashboard/admin` endpoint uses requireRole('admin') so only Admin users can access it. The **GET** `/api/dashboard/staff` endpoint allows only Staff users. The **GET** `/api/dashboard/user` endpoint allows only User role accounts. The frontend also checks the role stored in sessionStorage and redirects mismatched users to access-denied.html.

| Endpoint | Admin | Staff | User |
|----------|-------|-------|------|
| GET /api/dashboard/admin | Yes | No | No |
| GET /api/dashboard/staff | No | Yes | No |
| GET /api/dashboard/user | No | No | Yes |
| GET /api/files | Yes | Yes | Yes |
| GET /api/files/logs/denied | Yes | No | No |

The web UI reinforces RBAC through **sidebar navigation** (different link sets per role) and by redirecting to `access-denied.html` when a user opens another role’s dashboard URL. The **Manager/Baker/Cashier** label appears in the **sidebar footer** next to the avatar; the topbar intentionally does not repeat username or role so the header can stay minimal (breadcrumb + theme toggle only).

**Reflection Question 5: How does the principle of least privilege apply in your system?**

The principle of least privilege means users have only the minimum permissions needed for their tasks. Staff accounts can view recipes and log production but cannot access financial reports or user management. User accounts can process sales and manage invoices but cannot view production schedules. Each role receives only the dashboard data relevant to their job function. File access also follows this principle through DAC. Users can only modify their own files regardless of their role. Even Admin users cannot delete files they do not own through normal endpoints. This separation limits the damage from compromised accounts or insider threats.

---

## 4. DAC Implementation

The file ownership model gives users control over their documents. Each file record has an owner_id column that references the user who created it. The is_public column determines visibility with 0 meaning private and 1 meaning public. These values are set when the file is created and the owner can change visibility later.

The system enforces four access scenarios based on ownership and visibility. First, an owner can always view their own files regardless of visibility setting. Second, an owner can delete files they created. Third, an owner can toggle the visibility of their files between public and private. Fourth, any authenticated user can view files marked as public. Non-owners attempting to view private files receive HTTP 403 Access Denied.

The access_logs table records an audit trail of all DAC decisions. Each record includes the user_id who made the request, the file_id accessed, the action attempted (view, delete, or visibility), and the result (allowed or denied). The reason column explains why access was denied, such as "not_owner_private" or "only_owner_can_delete." The created_at timestamp records when the attempt occurred.

The Admin dashboard can show denied access attempts using the **GET** `/api/files/logs/denied` endpoint. This route requires the admin role and, when the `access_logs` table is available, returns up to the 50 most recent denial records (username, filename, action, reason, timestamp). For demo stability, the API responds with HTTP **200** and an **empty array** if the table is missing or the query fails, rather than surfacing a hard error to the client. The **DAC Access Denial Log** block on the manager dashboard is rendered **only when** at least one row is returned; otherwise the section is omitted so evaluators do not see a broken panel.

The Document Manager page (`files.html`) explains in copy that DAC rules apply when viewing private files. The file list only includes documents the current user may access (own files plus public files from others). The frontend hides delete and visibility controls for non-owned files, but the backend enforces ownership independently.

---

## 5. System Architecture

The system uses a two-tier architecture separating the frontend from the backend. The frontend consists of static HTML, CSS, and JavaScript files served by Render Static Site. The backend runs as a Node.js Express application on Render Web Service. These services communicate through HTTPS REST API calls.

The authentication flow follows this sequence: browser sends credentials to /api/auth/login, the backend verifies against the MySQL database, and returns a signed JWT on success. For subsequent requests, the frontend includes the JWT in the Authorization header as a Bearer token. The authMiddleware extracts and verifies this token before passing requests to route handlers.

The deployment stack uses three cloud services. Render Static Site hosts the frontend files at bakesync-frontend.onrender.com. Render Web Service runs the backend at bakesync-authentication.onrender.com. Aiven MySQL hosts the database in the asia-southeast1 region with SSL encryption for connections.

The backend middleware chain processes requests in order. The CORS middleware allows requests from the frontend origin. The CSRF middleware validates Origin headers on state-changing requests. The authMiddleware verifies JWT tokens for protected routes. The RBAC middleware checks user roles for restricted endpoints.

---

## 6. Database Design

The schema defines three tables that work together for authentication and access control. The users table stores account credentials and OTP state with 11 columns including password_hash, role, otp_code, otp_expires_at, otp_attempts, and otp_locked_until. The files table stores document metadata with owner_id referencing users. The access_logs table records DAC audit entries with foreign keys to both users and files.

Foreign key constraints maintain referential integrity. The files.owner_id column references users.id with ON DELETE CASCADE, so deleting a user removes their files. The access_logs table uses ON DELETE SET NULL for both user_id and file_id. This preserves audit records even when the referenced user or file is deleted.

Indexes optimize query performance for common operations. The access_logs table has an index on created_at to speed up time-range queries for the admin dashboard. An index on file_id supports queries filtering logs by specific files. The users table has unique indexes on both username and email columns to prevent duplicates and speed up lookups during login and registration.

---

## 7. Identified Security Vulnerabilities

**Reflection Question 3: What security weaknesses exist in your prototype?**

The prototype has eight documented security vulnerabilities that would need fixes before production deployment.

**V01: Non-cryptographic OTP generation.** The generateOTP() function uses Math.random() which is not cryptographically secure. JavaScript Math.random() uses a predictable algorithm that could allow attackers to guess future OTP values if they understand the internal state. The real-world impact is that a sophisticated attacker could reduce the 6-digit search space significantly.

**V02: JWT stored in sessionStorage.** The frontend stores JWT tokens in browser sessionStorage which is accessible to JavaScript. This makes tokens vulnerable to cross-site scripting attacks. If an attacker injects malicious JavaScript into the page, they can steal the token and impersonate the user.

**V03: Missing SSL certificate validation fallback.** The database configuration falls back to rejectUnauthorized: false when the CA certificate file is missing. This disables SSL certificate verification and allows man-in-the-middle attacks on the database connection. An attacker on the network path could intercept database traffic.

**V04: Weak password complexity requirements.** The system only requires passwords to be 6 characters minimum. There are no requirements for numbers, symbols, or mixed case. Users can create weak passwords like "123456" that are easy to crack through dictionary attacks.

**V05: No login rate limiting.** While OTP verification has brute-force protection, the login endpoint does not track failed attempts. Attackers can try unlimited password combinations without lockout. This makes password brute-force attacks feasible.

**V06: Partial CSRF protection.** The CSRF middleware only validates Origin headers rather than using the Synchronizer Token Pattern. Missing Origin headers are allowed through to avoid breaking legitimate clients. This leaves some CSRF attack vectors open.

**V07: No session revocation mechanism.** JWT tokens are stateless with 2-hour expiry. There is no way to revoke a token before it expires. If a token is stolen, the attacker has access until expiration. Users cannot log out from other devices.

**V08: Fixed OTP lockout duration.** The 15-minute lockout does not increase with repeated violations. A persistent attacker can wait 15 minutes and try again indefinitely. Progressive lockout would provide stronger protection against sustained attacks.

---

## 8. Proposed Improvements

**Reflection Question 4: How would you improve it for enterprise deployment?**

Enterprise deployment would require addressing each identified vulnerability plus adding infrastructure-level protections.

CSPRNG for OTP generation would replace Math.random() with the Node.js crypto.randomInt() function. This uses the operating system random number generator which provides cryptographic randomness. The change requires replacing one line in the generateOTP() function.

httpOnly cookies for JWT storage would move tokens from sessionStorage to secure cookies. Setting the httpOnly flag prevents JavaScript access to the cookie. The SameSite=Strict attribute provides additional CSRF protection. This requires changes to both frontend and backend token handling.

Full CA certificate SSL verification would require the Aiven CA certificate in production. The fallback to unverified connections would be removed. Connection failures with missing certificates would force administrators to fix the configuration rather than silently degrading security.

Password complexity enforcement would add validation rules requiring minimum 12 characters, at least one number, at least one symbol, and mixed case letters. Integration with haveibeenpwned API would check passwords against known breaches. Users with weak passwords would be prompted to update them.

Permission-level RBAC granularity would split the three roles into finer permissions. Instead of checking role directly, endpoints would check specific permissions like "view_reports" or "manage_users." Roles would map to permission sets, allowing custom combinations for special cases.

Ownership transfer for DAC would allow file owners to transfer ownership to other users. This supports scenarios where employees leave or responsibilities change. Transfer would require confirmation from both current and new owners.

Rate limiting at infrastructure level would deploy a Web Application Firewall in front of the backend. The WAF would limit requests per IP address across all endpoints. This provides protection even for endpoints that do not implement application-level rate limiting.

---

## 9. RBAC vs DAC Scalability Comparison

**Reflection Question 2: Compare RBAC and DAC in terms of scalability.**

RBAC scales well for large organizations because roles are defined centrally and assigned to many users. Adding a new employee requires only assigning them to an existing role. The employee immediately receives all permissions for that role without individual configuration. Changing permissions for a role updates access for all users with that role in a single operation. A bakery chain with 500 staff members would still have only three role definitions. The administrative effort stays constant regardless of organization size.

DAC does not scale as well because each owner manages their own permissions individually. Every file owner makes independent decisions about visibility. There is no central policy that applies to all files of a certain type. Auditing becomes difficult because visibility settings are scattered across thousands of individual files. Finding all private recipe files requires scanning every file record rather than checking a single policy.

BakeSync uses both models for different purposes. RBAC controls dashboard access where the organization needs consistent policy. All Cashiers see the same dashboard features determined by their role. DAC controls document access where individual discretion makes sense. Each user decides whether to share their reports and invoices. This hybrid approach gives the organization control over business functions while allowing flexibility for user content.

In a real bakery chain with hundreds of staff members, RBAC roles would remain manageable. The three roles cover the main job functions and the middleware handles enforcement automatically. However, DAC would become difficult to audit without automated tools. Administrators would need queries to find orphaned files, files that should be public but are not, and patterns of denied access. The access_logs table provides some visibility but manual review does not scale to thousands of files and users.

---

## 10. Conclusion

This project implemented a complete authentication and access control system for the BakeSync bakery management application. The system demonstrates password hashing with bcrypt, multi-factor authentication with email OTP, role-based access control with three user roles, and discretionary access control for file management. The audit logging system records all access decisions for security review.

The prototype successfully addresses IAS102 learning outcomes for authentication mechanisms, access control models, and security vulnerability analysis. The documented vulnerabilities provide concrete examples for the security analysis portion of the course. The proposed improvements show understanding of enterprise security requirements.

---

## 11. References

Auth0. (2024). *JSON Web Tokens introduction*. https://jwt.io/introduction

Grassi, P. A., Garcia, M. E., & Fenton, J. L. (2017). *Digital identity guidelines: Authentication and lifecycle management* (NIST Special Publication 800-63B). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-63b

Internet Engineering Task Force. (2015). *JSON Web Token (JWT)* (RFC 7519). https://datatracker.ietf.org/doc/html/rfc7519

Node.js Foundation. (2024). *bcrypt.js documentation*. https://www.npmjs.com/package/bcryptjs

OpenJS Foundation. (2024). *Express.js API reference*. https://expressjs.com/en/api.html

OWASP Foundation. (2024). *Authentication cheat sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

OWASP Foundation. (2024). *Password storage cheat sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

Aiven. (2024). *MySQL documentation*. https://aiven.io/docs/products/mysql

Resend. (2024). *Node.js SDK documentation*. https://resend.com/docs/sdks/nodejs
