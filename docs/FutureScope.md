# Future Scope — Medicine Expiry Date Tracking System

This document lists features that were designed and discussed but deliberately excluded
from the current version. Each item includes a brief explanation of its value and why
it was deferred.

---

## FS-01 — Activity / Audit Logging

**What it is:**
A persistent log of every write action performed in the system, recording who did what
and when (e.g., "Pharmacist John deleted Medicine #42 at 14:32").

**Value:**
Audit trails are a legal and regulatory requirement in most pharmacy and healthcare
environments. They provide accountability, help with incident investigation, and detect
insider threats.

**Why deferred:**
Requires an additional `activity_logs` database table, an interceptor layer injected
into every service method, and a query endpoint for admins. Adds non-trivial complexity
without changing the core functionality of the system.

**Implementation approach when ready:**
Create an `ActivityLogRepository` that is called from each service after every successful
write. Store: user_id, action (CREATE/UPDATE/DELETE), entity_type, entity_id, timestamp.

---

## FS-02 — Email / Push Notifications for Alerts

**What it is:**
Automated email or push notification delivery when medicines reach critical thresholds
(e.g., "Medicine X expires in 3 days").

**Value:**
Proactive alerts mean staff do not need to log into the system to discover problems.
Expired medicines go unnoticed less often.

**Why deferred:**
Requires integrating an email provider (SendGrid, Nodemailer) or a push notification
service. Also requires a background scheduler (node-cron) to run alert checks on a
schedule rather than only on request. Both significantly increase infrastructure
complexity.

**Implementation approach when ready:**
Add a cron job (daily at 08:00) that queries alert data and sends emails to all active
users. Use a queue (Bull/BullMQ) to handle notification delivery reliably.

---

## FS-03 — JWT Refresh Tokens and Logout Blacklist

**What it is:**
A two-token system where a short-lived access token (15 minutes) is paired with a
long-lived refresh token (7 days). On logout, the refresh token is invalidated. Access
tokens that have not yet expired are tracked in a blacklist (Redis) and rejected.

**Value:**
Gives the system true logout capability. Currently a user who logs out still has a
valid token for up to 8 hours. A blacklist eliminates this window.

**Why deferred:**
Requires a Redis instance for the blacklist and a /auth/refresh endpoint. The stateless
simplicity of the current JWT approach was preferred for the initial version.

**Implementation approach when ready:**
Use `ioredis` to store blacklisted token JTIs on logout. Add a `jti` (JWT ID) claim
to every issued token. Check the blacklist in AuthHandler before accepting any token.

---

## FS-04 — Automated Testing (Jest + Supertest)

**What it is:**
A suite of unit tests (service and repository logic) and integration tests (HTTP endpoint
behavior) using Jest and Supertest.

**Value:**
Automated tests catch regressions, validate security controls, and serve as living
documentation of intended behavior. Critical for any production system.

**Why deferred:**
Writing meaningful tests requires time comparable to writing the application itself.
Given the solo development constraint and course deadline, tests were excluded in favor
of a complete working implementation.

**Implementation approach when ready:**
- Unit tests: mock the database pool, test each service method in isolation.
- Integration tests: use a separate test database, seed it before each suite, and use
  Supertest to fire real HTTP requests through the Express app.
- Target: 80%+ branch coverage on services and middleware.

---

## FS-05 — Cloud Deployment

**What it is:**
Deploying the application to a managed cloud platform (e.g., Railway, Render, AWS EC2)
with a managed PostgreSQL instance, environment variable management, and HTTPS.

**Value:**
Makes the system accessible over the internet with proper TLS, monitoring, and uptime
guarantees.

**Why deferred:**
Cloud deployment requires infrastructure decisions (provider choice, cost, CI/CD pipeline)
that are outside the scope of the course project. The application runs locally using a
local or Docker PostgreSQL instance.

**Implementation approach when ready:**
1. Containerize the app with Docker.
2. Write a docker-compose.yml for local development (app + postgres).
3. Deploy to Railway or Render with automatic PostgreSQL provisioning.
4. Use GitHub Actions for CI: run tests on every push, deploy on merge to main.

---

## FS-06 — Account Lockout After Failed Login Attempts

**What it is:**
After N consecutive failed login attempts for a given username, the account is temporarily
locked for a configurable duration (e.g., 15 minutes).

**Value:**
Provides targeted protection against brute-force attacks that stay under the global rate
limit by targeting one account slowly.

**Why deferred:**
Requires tracking per-username failure counts in the database or Redis, a lockout
mechanism, and an admin unlock feature. Added complexity for a marginal security gain
given bcrypt's inherent slowness.

---

## FS-07 — Medicine Batch / Supplier Tracking

**What it is:**
Extending the medicines table to include batch number, supplier name, and purchase date,
enabling full traceability of each medicine unit from procurement to dispensing.

**Value:**
Real pharmacies require batch-level traceability for recalls and regulatory compliance.

**Why deferred:**
Schema change that would require a medicine_batches join table and significant changes to
CRUD logic. Deferred until core functionality is stable.
