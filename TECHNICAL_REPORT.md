# BakeSync-IAS102 Authentication and Access Control System
## Technical Report: Security Implementation Analysis

**Course:** IAS 102 - Information Assurance and Security
**System:** BakeSync-IAS102 Bakery Management Prototype
**Date:** March 2026

---

## 1. Introduction

This report analyzes the security implementation of the BakeSync-IAS102 system. This prototype demonstrates authentication and access control mechanisms for a bakery management application. The system uses Node.js with Express for the backend and plain HTML with JavaScript for the frontend. MySQL serves as the database.

The report answers five key questions about the security design. It covers multi-factor authentication, access control models, security weaknesses, enterprise improvements, and the principle of least privilege.

---

## 2. System Architecture Overview

The BakeSync-IAS102 system follows a three-tier web application architecture. The frontend consists of static HTML pages with JavaScript files for authentication and file management. The backend uses Express.js with middleware for authentication and authorization. The database uses MySQL with InnoDB tables for data storage.

**Authentication Flow Description**

The system implements a six-step security flow that protects user accounts and resources.

**Step 1: User Registration.** Users submit their username, email, password, and role selection through the registration form. The backend validates the input format and checks for duplicate accounts. It hashes the password using bcrypt with 10 salt rounds. The system generates a six-digit OTP code and stores it in the database with a 10-minute expiration time. The Resend API sends the OTP to the user email address. The user account is created with is_verified set to 0.

**Step 2: Email Verification.** Users enter the OTP code on the verification page. The backend checks if the code matches and has not expired. Users have five attempts to enter the correct code. After five failed attempts, the system locks verification for 15 minutes. The otp_attempts and otp_locked_until columns track this state. On successful verification, the system sets is_verified to 1 and clears all OTP fields.

**Step 3: User Login.** Verified users enter their username and password on the login page. The backend retrieves the user record and compares the password hash using bcrypt. It checks that is_verified equals 1 before allowing login. The system creates a JSON Web Token containing the user ID, username, and role. The token expires after two hours.

**Step 4: JWT Authentication.** The frontend stores the JWT in sessionStorage. Each request to protected endpoints includes the token in the Authorization header. The authMiddleware verifies the token signature using the JWT_SECRET environment variable. It extracts the user claims and populates the req.user object for downstream handlers.

**Step 5: Role-Based Access Control.** The requireRole middleware checks if the user role matches the required roles for each endpoint. The system defines three roles with different access levels. Admin users have full system access. Staff users access production-related features. User role handles sales-related functions. The middleware returns 403 Forbidden for insufficient permissions.

**Step 6: Discretionary Access Control.** The file system implements DAC based on ownership. Each file has an owner_id field set at creation time. Files can be public or private based on the is_public flag. Only file owners can delete files or change visibility. The system logs all access decisions to the access_logs table for auditing.

---

## 3. Reflection Question 1: Why is MFA More Secure Than Password-Only Authentication?

Multi-factor authentication provides stronger security than passwords alone. This is because MFA requires proof from two different categories of authentication factors. The three main categories are something you know, something you have, and something you are.

Password-only authentication uses just one factor. This is something you know. If an attacker learns your password, they gain full access to your account. Passwords can be stolen through phishing attacks, data breaches, or social engineering. Many users also choose weak passwords or reuse passwords across multiple sites.

BakeSync-IAS102 implements MFA using a password and a one-time password sent to email. The password is the first factor. The OTP is the second factor because it proves you have access to the registered email account. An attacker who steals your password still cannot log in without access to your email.

The OTP implementation in BakeSync-IAS102 follows security best practices in several ways. Each OTP code expires after 10 minutes. This follows NIST SP 800-63B guidelines for authentication. The short expiration window limits the time an attacker has to intercept and use the code. The backend validates expiration by comparing otp_expires_at with the current timestamp.

The system also protects against brute force attacks on OTP codes. The otp_attempts column tracks failed verification attempts. After five failed attempts, the system sets otp_locked_until to 15 minutes in the future. The backend checks this lockout status before processing any verification request. It returns HTTP 429 Too Many Requests when the account is locked.

The lockout mechanism makes brute force attacks impractical. A six-digit OTP has one million possible combinations. With only five attempts allowed before a 15-minute lockout, an attacker would need many years to try all combinations. The system also clears the OTP code on lockout, requiring the user to request a new code.

MFA creates defense in depth. Even if one security layer fails, the second layer provides protection. This layered approach is a fundamental principle of information security. It reduces the risk of unauthorized access significantly compared to single-factor authentication.

---

## 4. Reflection Question 2: Compare RBAC and DAC in Terms of Scalability

Role-Based Access Control and Discretionary Access Control serve different purposes. RBAC assigns permissions to roles. Users receive permissions by belonging to a role. DAC allows resource owners to control access to their own resources. BakeSync-IAS102 uses both models for different parts of the system.

**RBAC Implementation in BakeSync-IAS102**

The system defines three roles with specific access levels. The role field in the users table uses an ENUM type restricting values to admin, staff, and user. The requireRole middleware in rbac.js enforces role-based access on protected endpoints.

The Admin role has full system access with permission level 100. Admin users can view all system statistics including total users and files. They can access the denied access logs for security monitoring. The admin dashboard shows pending unverified accounts and system alerts. Admin users can view recent activity across all users.

The Staff role has production-focused access with permission level 50. Staff users can view and manage their own recipes. They can access shared production schedules. The staff dashboard shows their document counts and recent schedules. Staff users work with recipe and schedule file types.

The User role has sales-focused access with permission level 25. User accounts can manage their own invoices and reports. They can view public documents shared by other users. The user dashboard shows accessible document counts and notifications about new shared files.

RBAC scales well for large organizations. Adding a new employee only requires assigning them to a role. The user automatically receives all permissions for that role. The database query in the dashboard routes filters data based on the role claim from the JWT. If you need to change permissions, you update the middleware or dashboard query once. All users with that role receive the updated access immediately.

Managing permissions without RBAC would require individual permission assignments. In a bakery with 50 employees, this means managing 50 separate permission sets. With RBAC, you manage only three role definitions. The administrative overhead stays constant as the organization grows.

**DAC Implementation in BakeSync-IAS102**

The files table implements DAC for document access control. Each file has an owner_id foreign key pointing to the users table. The is_public column determines visibility with 0 for private and 1 for public. These two fields drive all access control decisions.

The GET /api/files/:id endpoint checks DAC permissions before returning file data. The query compares file.owner_id with the authenticated user ID from req.user.id. If they do not match, it checks if is_public equals 1. Access is denied if neither condition is true. The system logs the denied access with the reason not_owner_private.

The DELETE /api/files/:id endpoint enforces owner-only deletion. The backend checks if file.owner_id equals req.user.id. Non-owners receive HTTP 403 with the message only the file owner can delete. The frontend hides the delete button for non-owners, but the backend enforces this rule independently.

The PATCH /api/files/:id/visibility endpoint lets owners toggle visibility. Only the owner can change a file from private to public or back. The system logs both allowed and denied visibility changes. This creates an audit trail for security review.

DAC is flexible for personal resource management. Users control their own data without administrator involvement. File owners decide who can view their documents. However, DAC does not scale as well as RBAC for organizational policies. Each owner makes independent decisions about their resources. There is no central policy that applies to all files.

**Scalability Comparison**

RBAC provides better scalability for enterprise environments. Organizations can add hundreds of users without increasing administrative complexity. Role definitions remain stable while user assignments change frequently. The requireRole middleware checks a single role claim, making authorization fast regardless of user count.

DAC provides good scalability for user-generated content. Each user manages their own files independently. The system does not need central administration for file permissions. However, DAC makes it difficult to enforce organization-wide policies. An admin cannot force all recipe files to be public or private.

BakeSync-IAS102 combines both models effectively. RBAC controls access to business functions through dashboard endpoints and RBAC middleware. DAC controls access to uploaded files through ownership and visibility checks. This hybrid approach provides both organizational control and user flexibility.

---

## 5. Reflection Question 3: What Security Weaknesses Exist in Your Prototype?

The BakeSync-IAS102 prototype has several security weaknesses that require attention. These weaknesses are acceptable for a learning project but need fixes before production deployment.

**Weak Random Number Generation**

The OTP generation uses Math.random() in the otp.js utility file. This function is not cryptographically secure. The JavaScript Math.random() function uses a predictable algorithm. Attackers who understand the random number generator state could predict future OTP codes. The code includes a comment acknowledging this as a known prototype limitation. A secure implementation should use the crypto.randomInt() function instead. This function uses the operating system random number generator which provides cryptographic randomness.

**Simple Password Requirements**

The system only requires passwords to be six characters long. This minimum is too short for modern security standards. OWASP recommends a minimum of eight characters with 12 or more preferred. The system also does not require complexity rules. Users can create passwords without numbers, symbols, or mixed case letters. Passwords like 123456 or password are accepted. Weak passwords are easier to crack through dictionary attacks or brute force. The backend validation in auth.js only checks password.length with a minimum threshold.

**Basic CSRF Protection**

The Cross-Site Request Forgery protection in csrf.js only validates the Origin header. The middleware checks if the Origin header matches allowed origins including localhost and the FRONTEND_URL environment variable. This is better than no protection but not the strongest approach. The middleware also allows requests with missing Origin headers to pass through. This lenient mode exists to avoid breaking legitimate clients but creates a security gap. The Synchronizer Token Pattern provides stronger protection. This pattern uses a unique random token for each user session that attackers cannot predict.

**No Rate Limiting on Login**

While OTP verification has rate limiting through the lockout mechanism, the login endpoint does not. The POST /api/auth/login route processes login attempts without tracking failures. Attackers can try many password combinations without lockout. The only protection is the bcrypt comparison which adds some delay. Adding failed login attempt tracking would slow down brute force attacks on passwords. The system could lock accounts after several failed login attempts or add increasing delays.

**Fixed Lockout Duration**

The OTP lockout lasts 15 minutes regardless of attack patterns. The OTP_LOCK_MINUTES constant is set to 15 in auth.js. A persistent attacker can wait 15 minutes and try again repeatedly. Progressive lockout would increase the duration after repeated violations. The first lockout could be 15 minutes. The second lockout could be one hour. The third could require administrator review. The code includes a comment suggesting this improvement.

**No Session Revocation**

The system uses stateless JWT tokens for authentication. Once issued, a token remains valid until its two-hour expiration. There is no mechanism to revoke tokens before expiration. If an attacker steals a token, they have access until it expires. The user cannot log out from other devices. The database schema includes a user_sessions table, but the code does not use it. Session tracking would enable immediate token revocation.

**SSL Certificate Validation Fallback**

The database configuration in db.js falls back to insecure mode when the CA certificate file is missing. The code sets rejectUnauthorized to false if ca.pem is not found. This allows man-in-the-middle attacks on the database connection. The comment explains this as a development convenience. Production deployments must use proper certificate validation.

**Silent Audit Logging Failures**

The logAccess function in files.js catches and ignores all errors. If the database insert fails, the system continues without recording the access attempt. Security events may be lost without operator knowledge. The comment explains that audit logging should never break the main request. However, persistent failures should trigger alerts to system administrators.

---

## 6. Reflection Question 4: How Would You Improve It for Enterprise Deployment?

Enterprise deployment requires significant security and operational improvements. The following changes would prepare BakeSync-IAS102 for production use.

**Cryptographic Improvements**

Replace Math.random() with crypto.randomInt() for OTP generation. The Node.js crypto module provides cryptographically secure random numbers. Change the call to crypto.randomInt(100000, 999999) to generate six-digit codes securely. Increase bcrypt salt rounds from 10 to 12 or higher. Each additional round doubles the computation time for attackers. Add password complexity requirements including minimum length of 12 characters and checks against common password lists. Consider using the haveibeenpwned API to check passwords against known breaches.

**Enhanced Authentication Features**

Add support for authenticator app OTPs using the TOTP standard. This removes email from the authentication chain for better security. Users can install apps like Google Authenticator or Authy. Implement WebAuthn support for passwordless authentication using hardware security keys. Add single sign-on integration with enterprise identity providers. Support SAML or OIDC protocols for integration with Okta, Azure AD, or Google Workspace.

**Session Management**

Track active sessions in the database using the existing user_sessions table. Store a hash of each issued token with metadata like IP address and user agent. Show users their active sessions on a security settings page. Allow users to revoke individual sessions or all sessions at once. Implement automatic session expiration after inactivity. Add session binding to IP address ranges or device fingerprints to detect stolen tokens.

**Advanced Rate Limiting**

Add rate limiting to all endpoints using a token bucket algorithm. Track failed authentication attempts per IP address and username. Implement progressive delays for repeated failures. Add CAPTCHA challenges after suspicious activity patterns. Use IP reputation services to block known malicious addresses. The express-rate-limit package provides easy implementation for Express applications.

**Audit and Compliance**

Expand audit logging to cover all security events. Log successful and failed authentication attempts with IP addresses. Log permission changes and role assignments. Log data access and modifications for sensitive records. Store logs in a separate append-only system that attackers cannot modify. Implement log monitoring and alerting for suspicious patterns. Consider integration with SIEM systems for enterprise monitoring.

**Infrastructure Security**

Deploy behind a Web Application Firewall to filter malicious requests. Use a Content Delivery Network with DDoS protection. Implement database encryption at rest using MySQL transparent data encryption. Use TLS 1.3 for all connections including internal services. Store secrets in a dedicated secrets manager like AWS Secrets Manager or HashiCorp Vault. Move secrets out of environment variables which can leak through error pages. Implement network segmentation between application tiers.

**Full CSRF Protection**

Replace Origin header validation with the Synchronizer Token Pattern. Generate a random CSRF token for each user session. Store the token in the session and include it in all forms. Validate the token on every state-changing request. Use the csurf package for Express or implement custom middleware. Consider double-submit cookie pattern as an alternative.

**Disaster Recovery**

Create automated database backups with encryption. Test backup restoration procedures regularly through drills. Document incident response procedures for security breaches. Create business continuity plans for various failure scenarios. Implement redundancy across multiple availability zones or data centers.

---

## 7. Reflection Question 5: How Does the Principle of Least Privilege Apply in Your System?

The principle of least privilege states that users should have only the minimum permissions needed for their job. This principle limits the damage from compromised accounts or insider threats. BakeSync-IAS102 implements this principle through its RBAC design and DAC enforcement.

**Role-Based Permission Restrictions**

Each role in BakeSync-IAS102 has carefully limited permissions based on job function. The requireRole middleware enforces these restrictions on every protected endpoint.

User accounts can process sales and view sales-related data. The user dashboard endpoint returns only invoices and reports owned by the user. It also shows public documents and notifications about new shared files. User accounts cannot access the admin dashboard statistics. They cannot view the denied access logs. They cannot see pending unverified accounts. If a user account is compromised, the attacker cannot access sensitive administrative information.

Staff accounts can manage production tasks and view recipes. The staff dashboard returns recipes and schedules relevant to production work. Staff cannot view financial reports or user management data. They cannot access the system alert count showing denied access attempts. Their access is limited to what they need for production duties. This separation protects business data from unauthorized access.

Admin accounts have full access because they need to manage all aspects of the system. However, they are the only role with administrative capabilities. Limiting admin access to a small group reduces the attack surface. In the seed data, only one user has admin role while two others have lesser privileges.

**File Ownership Restrictions**

The DAC implementation also follows least privilege principles. Users can only modify their own files regardless of their role. The owner_id check in files.js runs independently of role checks. Even admin users cannot delete files they do not own through normal endpoints. They cannot change visibility settings for files owned by others. This protects user content from unauthorized modification even by privileged accounts.

The visibility toggle gives owners granular control. A file starts as private by default with is_public set to 0. The owner must explicitly make it public if they want to share it. This default-deny approach follows security best practices. Users must take action to share rather than action to protect.

**Backend Authorization Enforcement**

The system enforces permissions on the backend, not just the frontend. The frontend hides buttons and features based on role and ownership. However, the backend verifies permissions for every request independently. Even if someone bypasses the frontend using tools like Postman, they cannot access unauthorized resources. The code includes comments emphasizing this design decision.

The files.js route includes a specific comment about this principle. It states that frontend-only guards are insufficient. Any authenticated user could call endpoints directly. All authorization must be enforced server-side. This defense in depth ensures least privilege enforcement even against technical attackers.

**JWT Minimal Claims**

The JWT token contains only essential information needed for authorization. It includes the user ID for database lookups. It includes the username for display purposes. It includes the role for RBAC middleware checks. It does not include sensitive data like email or password hash. The token does not contain permission lists or access tokens for other services. If an attacker intercepts a token, they gain limited information. The token is also time-limited to two hours, reducing exposure.

**Areas for Improvement**

The current implementation could be more granular. Staff and User roles have fixed permission sets. A more advanced system would allow custom permission combinations. Some staff members might need recipe editing while others only need viewing. Some users might need report generation access for shift management.

The file system could also add more sharing options. Currently files are either private to the owner or public to everyone. Adding the ability to share with specific users or roles would provide more flexible least privilege enforcement. An owner could share a recipe with specific staff members rather than making it fully public.

The admin role could be split into multiple administrative roles. One role could manage users without accessing files. Another role could view audit logs without modifying system settings. This would reduce the power of any single administrative account.

---

## 8. Conclusion

The BakeSync-IAS102 system demonstrates solid security foundations for a prototype application. It implements multi-factor authentication through email OTP verification. It uses role-based access control with three distinct roles: admin, staff, and user. It applies discretionary access control for file management based on ownership. These mechanisms work together to protect user accounts and business data.

The system has weaknesses typical of prototype software. The random number generation, password requirements, and session management need improvements for production use. The CSRF protection uses a simplified approach. The login endpoint lacks rate limiting. This report identifies specific areas requiring enhancement before enterprise deployment.

For enterprise deployment, the system would need cryptographic improvements using secure random functions. It would need enhanced session management with revocation capabilities. Better rate limiting would protect against brute force attacks. Comprehensive audit logging would support security monitoring. Infrastructure security measures would protect against network attacks.

The principle of least privilege guides the access control design. Each role has only necessary permissions for its job function. File access depends on ownership with private defaults. Backend enforcement prevents privilege escalation regardless of frontend manipulation. These design choices limit the impact of potential security breaches.

The BakeSync-IAS102 prototype successfully demonstrates the core concepts of authentication, authorization, and access control for educational purposes in the IAS102 course.

---

## References

NIST Special Publication 800-63B: Digital Identity Guidelines, Authentication and Lifecycle Management.

OWASP Application Security Verification Standard 4.0.

OWASP Top 10 Web Application Security Risks.

Express.js Security Best Practices Documentation.

---

*Report prepared for IAS 102 course requirements. This document analyzes the BakeSync-IAS102 prototype for educational purposes.*
