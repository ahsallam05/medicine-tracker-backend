# Security Report — Medicine Expiry Date Tracking System

**Course:** Software Engineering 2
**Project:** Medicine Expiry Date Tracking System
**Standard Referenced:** OWASP Top 10 (2021)

---

## Executive Summary

This report documents the security measures implemented in the Medicine Expiry Date Tracking
System, the known vulnerabilities that were identified during design and development, and a
clear account of which mitigations were applied, which were deferred, and why. The system
targets a basic but honest security posture suitable for a college project scope, with
transparency about its limitations.

---

## Section 1 — Security Measures Implemented

### 1.1 Password Hashing (bcrypt)

**OWASP Reference:** A02:2021 — Cryptographic Failures

**What was done:**
All user passwords are hashed using bcrypt with a cost factor of 12 before being stored in
the database. The plaintext password is never stored and never logged.

**Why bcrypt:**
bcrypt is an adaptive hashing algorithm. Its cost factor can be increased over time as
hardware gets faster, keeping brute-force attacks expensive. It also includes a built-in
salt per hash, which prevents rainbow table attacks.

**Implementation location:** `src/modules/auth/auth.service.js`

---

### 1.2 JWT-Based Authentication

**OWASP Reference:** A07:2021 — Identification and Authentication Failures

**What was done:**
After a successful login, the server issues a signed JSON Web Token (JWT). The token
payload contains: user id, username, and role. The token is signed using a secret key
stored in the environment variable JWT_SECRET. Token expiry is set to 8 hours.

All protected routes verify the token via the AuthHandler middleware before processing
any request. If the token is missing, malformed, or expired, the request is rejected
with HTTP 401 Unauthorized.

**Implementation location:** `src/patterns/middleware/AuthHandler.js`

---

### 1.3 Role-Based Access Control (RBAC)

**OWASP Reference:** A01:2021 — Broken Access Control

**What was done:**
User roles (admin, pharmacist) are embedded in the JWT payload. The RoleHandler
middleware checks the user's role against the list of allowed roles for each route.
If the role does not match, the request is rejected with HTTP 403 Forbidden.
Role checking is enforced at the route level, not inside controllers, ensuring it
cannot be bypassed by controller logic.

**Implementation location:** `src/patterns/middleware/RoleHandler.js`

---

### 1.4 Input Validation (Joi)

**OWASP Reference:** A03:2021 — Injection

**What was done:**
All incoming request bodies are validated against strict Joi schemas before reaching
any business logic. The ValidationHandler middleware runs Joi validation and rejects
requests that do not match the expected shape (wrong types, missing fields, out-of-range
values) with HTTP 400 Bad Request. Validation messages are returned to the client but
internal error details are not.

**Implementation location:** `src/patterns/middleware/ValidationHandler.js`

---

### 1.5 Parameterized SQL Queries

**OWASP Reference:** A03:2021 — Injection

**What was done:**
All database queries use the `pg` library's parameterized query syntax ($1, $2, ...).
User-supplied values are never concatenated into SQL strings. This completely eliminates
SQL injection as an attack vector for the queries written in this project.

**Example (safe):**
```js
const result = await pool.query(
  'SELECT * FROM medicines WHERE id = $1',
  [req.params.id]
);
```

**Example (what was avoided):**
```js
// NEVER done — this would be vulnerable to SQL injection
const result = await pool.query(
  `SELECT * FROM medicines WHERE id = ${req.params.id}`
);
```

**Implementation location:** All `*.repository.js` files

---

### 1.6 HTTP Security Headers (Helmet.js)

**OWASP Reference:** A05:2021 — Security Misconfiguration

**What was done:**
The `helmet` npm package is applied as global middleware on the Express app. Helmet
sets the following headers automatically:

| Header                        | Purpose                                           |
|-------------------------------|---------------------------------------------------|
| X-Content-Type-Options        | Prevents MIME-type sniffing                       |
| X-Frame-Options               | Prevents clickjacking via iframes                 |
| X-XSS-Protection              | Enables browser XSS filter (legacy browsers)      |
| Strict-Transport-Security     | Forces HTTPS connections                          |
| Content-Security-Policy       | Restricts resource loading origins                |
| Referrer-Policy               | Controls referrer header information leakage      |

**Implementation location:** `src/app.js`

---

### 1.7 Rate Limiting

**OWASP Reference:** A07:2021 — Identification and Authentication Failures

**What was done:**
The `express-rate-limit` package is applied globally. The default configuration allows
a maximum of 100 requests per 15-minute window per IP address. Once exceeded, further
requests receive HTTP 429 Too Many Requests. This limits the effectiveness of brute-force
attacks against the login endpoint and general API abuse.

**Implementation location:** `src/app.js`

---

### 1.8 Centralized Error Handling (No Stack Trace Exposure)

**OWASP Reference:** A05:2021 — Security Misconfiguration

**What was done:**
A global error-handling middleware catches all unhandled errors. In production mode
(NODE_ENV=production), the response contains only a generic message and an HTTP status
code. The stack trace is printed to the server console (for debugging) but is never
sent to the client. This prevents attackers from using error messages to map the
internal structure of the application.

**Implementation location:** `src/middleware/errorHandler.js`

---

### 1.9 Environment Variables for Secrets

**OWASP Reference:** A02:2021 — Cryptographic Failures

**What was done:**
All sensitive configuration values are stored in a `.env` file and loaded via the
`dotenv` package. This includes the database connection string, JWT secret, and default
admin credentials. The `.env` file is listed in `.gitignore` and is never committed to
version control. An `.env.example` file with placeholder values is committed instead,
so other developers know what variables are required.

**Values stored in .env (never hardcoded):**
- DATABASE_URL
- JWT_SECRET
- ADMIN_USERNAME
- ADMIN_PASSWORD
- PORT

---

### 1.10 Account Deactivation (Soft Ban)

**What was done:**
Pharmacist accounts can be deactivated by an Admin. The `is_active` column is set to
`false`. The AuthHandler middleware checks this flag on every request — even if a
deactivated user still holds a valid JWT token, their requests are rejected with
HTTP 403 Forbidden. This gives administrators immediate revocation capability without
waiting for the token to expire.

---

## Section 2 — Known Vulnerabilities and Deliberate Omissions

The following security weaknesses exist in the current implementation. Each was identified,
discussed, and consciously left out of scope for this project version. They are documented
here for full transparency.

---

### 2.1 No JWT Refresh Token / Logout Blacklist

**Vulnerability:**
Once a JWT is issued, it remains valid until it expires (8 hours), even if:
- The user logs out
- The user's account is deactivated
- The admin revokes access

The is_active database check on every request partially mitigates the deactivation
scenario, but a truly secure system would also maintain a token blacklist (e.g., in Redis)
so that logout immediately invalidates the token.

**Why it was not implemented:**
Implementing a token blacklist requires either a Redis instance or a database table for
revoked tokens, along with a cleanup job. This was considered out of scope for a
single-developer college project. The 8-hour expiry window is an accepted trade-off.

**Risk Level:** Medium

---

### 2.2 No HTTPS Enforcement at Application Level

**Vulnerability:**
The application does not redirect HTTP to HTTPS and does not terminate TLS. Tokens
transmitted over plain HTTP can be intercepted by a network attacker (man-in-the-middle
attack).

**Why it was not implemented:**
TLS termination is typically handled by a reverse proxy (Nginx, Caddy) or a cloud load
balancer, not by the Node.js application itself. Since this project is not deployed to
a production server, this is handled at the infrastructure level in a real deployment.

**Risk Level:** High in production — Not applicable in local development.

---

### 2.3 No Account Lockout After Failed Login Attempts

**Vulnerability:**
The rate limiter (100 requests per 15 minutes) slows down brute-force attacks but does
not lock a specific account after, for example, 5 consecutive failed login attempts for
that username. A targeted, slow brute-force attack that stays under the rate limit could
still enumerate credentials.

**Why it was not implemented:**
Account lockout requires tracking failed attempts per username in the database or cache.
This adds complexity (lockout duration, unlock mechanism, admin override) that was
considered beyond the current scope.

**Risk Level:** Low-Medium (partially mitigated by rate limiting and bcrypt cost)

---

### 2.4 No Activity / Audit Logging

**Vulnerability:**
The system does not log which user performed which action (e.g., who deleted a medicine,
who deactivated an account). In a real pharmacy system, this is both a security and a
regulatory requirement (audit trail).

**Why it was not implemented:**
Audit logging requires an additional database table (activity_logs), an interceptor layer
on every write operation, and a query interface for admins. It was deliberately deferred
to a future version.

**Risk Level:** Medium (compliance risk in production, not exploitable by attackers)

---

### 2.5 No Automated Security Testing

**Vulnerability:**
There are no automated tests to verify that security controls (auth checks, role checks,
input validation) are functioning correctly. A regression could silently remove a
security control without any automated detection.

**Why it was not implemented:**
Writing a comprehensive test suite for authorization, validation, and edge cases requires
significant time investment. The scope of this project prioritizes working implementation
over test coverage.

**Risk Level:** Medium (operational risk, not a direct attack vector)

---

### 2.6 JWT Secret Strength Depends on Developer

**Vulnerability:**
The JWT_SECRET value is set by whoever deploys the application. If a weak secret is used
(e.g., "secret" or "password"), the JWT can be brute-forced offline. The application
does not enforce a minimum entropy requirement on the secret.

**Mitigation applied:**
The `.env.example` file includes a comment instructing the developer to use a randomly
generated 64-character string (e.g., from `openssl rand -hex 64`).

**Risk Level:** Low (if instructions are followed) — High (if ignored)

---

## Section 3 — OWASP Top 10 Coverage Summary

| OWASP 2021 Category                          | Status         | Mitigation Applied                        |
|----------------------------------------------|----------------|-------------------------------------------|
| A01 — Broken Access Control                  | Mitigated      | RBAC via RoleHandler middleware           |
| A02 — Cryptographic Failures                 | Mitigated      | bcrypt hashing, env vars for secrets      |
| A03 — Injection                              | Mitigated      | Joi validation + parameterized SQL        |
| A04 — Insecure Design                        | Partial        | Design patterns applied, no threat model  |
| A05 — Security Misconfiguration              | Mitigated      | Helmet headers, no stack trace exposure   |
| A06 — Vulnerable Components                  | Partial        | Used stable, common libraries (no audit)  |
| A07 — Auth & Identification Failures         | Partial        | JWT + rate limit; no lockout, no refresh  |
| A08 — Software Integrity Failures            | Not addressed  | No SRI, no supply chain checks            |
| A09 — Logging & Monitoring Failures          | Not addressed  | No audit logging implemented              |
| A10 — SSRF                                   | Not applicable | No outbound HTTP calls in this system     |

---

## Section 3 — Local Backend and Database Migration

### 3.1 Migration from Cloud (Supabase) to Local PostgreSQL

**What was done:**
The application was originally designed to use Supabase (a cloud-hosted PostgreSQL provider).
For better control, privacy, and reduced external dependency, the backend was migrated to
a local PostgreSQL instance running on the developer's machine.

**Security Implications:**
- **No External Data Exposure:** Medicine and user data no longer traverse the public
  internet to a third-party cloud provider.
- **Local Secret Management:** Credentials (DB_PASSWORD, JWT_SECRET) are managed
  exclusively on the local machine within the `.env` file.
- **Controlled Access:** The database is only accessible via `localhost` (127.0.0.1)
  and requires authentication with a strong password.

### 3.2 Random JWT Secret Generation

**What was done:**
A random 64-character hex string was generated and set as the `JWT_SECRET` in the `.env`
file. This ensures that the cryptographic signing of tokens is mathematically robust
against brute-force or dictionary attacks, even if an attacker gains access to public
information about the application.

---

## Conclusion

The Medicine Expiry Date Tracking System implements a "defense-in-depth" approach,
addressing the most critical OWASP Top 10 risks (Injection, Broken Access Control,
Identification and Authentication Failures) through modern, industry-standard
libraries and patterns. While some advanced security features (like token blacklisting
and audit logging) are omitted for simplicity, the current implementation provides a
solid foundation for a production-ready pharmacy management system.
