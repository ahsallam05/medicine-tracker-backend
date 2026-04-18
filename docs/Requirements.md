# Requirements — Medicine Expiry Date Tracking System

## 1. Project Overview

A backend REST API that helps pharmacies track medicine expiry dates, stock levels, and generate
alerts for expired or low-stock medicines. The system enforces role-based access between
Administrators and Pharmacists.

---

## 2. Roles and Permissions

| Action                              | Admin | Pharmacist |
|-------------------------------------|-------|------------|
| Login                               | YES   | YES        |
| Create pharmacist account           | YES   | NO         |
| Deactivate/reactivate pharmacist    | YES   | NO         |
| View all pharmacists                | YES   | NO         |
| Create medicine                     | YES   | YES        |
| Read / list medicines               | YES   | YES        |
| Update medicine                     | YES   | YES        |
| Delete medicine                     | YES   | YES        |
| View dashboard stats                | YES   | YES        |
| View alerts lists                   | YES   | YES        |

---

## 3. Functional Requirements

### FR-01 — Authentication
- The system must expose a POST /api/auth/login endpoint.
- The endpoint accepts a username and password.
- On success it returns a signed JWT token.
- The token payload contains: id, username, role.
- Token expiry is set to 8 hours.

### FR-02 — Default Admin Seeding
- On startup the system checks if an admin account exists.
- If none exists it creates one with preset credentials loaded from environment variables.
- This ensures the system is always bootstrappable from a clean database.

### FR-03 — Medicine Management
- Full CRUD operations on the medicines table.
- List endpoint supports:
  - Search by name or category (partial match, case-insensitive)
  - Filter by category or by expiry status (expired, critical, soon, ok)
  - Sort by expiry_date or name (ASC or DESC)
  - Pagination via limit and offset query parameters

### FR-04 — Dashboard (aggregate counts)
The GET /api/dashboard endpoint returns exactly 6 counts:
1. Total medicines in the system
2. Expired medicines (expiry_date < today)
3. Critical — expiring within 7 days (expiry_date between today and today+7)
4. Expiring soon — expiring within 30 days (expiry_date between today and today+30)
5. Out of stock (quantity = 0)
6. Running low (quantity > 0 AND quantity <= 10)

### FR-05 — Alerts (full medicine records)
The GET /api/alerts endpoint returns 5 categorized lists of full medicine objects:
1. Expired
2. Critical (within 7 days)
3. Expiring soon (within 30 days)
4. Out of stock
5. Running low

A medicine can appear in multiple categories simultaneously.

### FR-06 — Admin Panel
- POST /api/admin/pharmacists — create a new pharmacist account
- GET /api/admin/pharmacists — list all pharmacist accounts
- PATCH /api/admin/pharmacists/:id/deactivate — set is_active = false
- PATCH /api/admin/pharmacists/:id/reactivate — set is_active = true
- Admin cannot deactivate another admin.

---

## 4. Non-Functional Requirements

### NFR-01 — Security
- All passwords stored as bcrypt hashes (cost factor 12).
- All routes except login are protected by JWT middleware.
- Role enforcement is handled by dedicated middleware (not inside controllers).
- All request inputs validated with Joi schemas before reaching business logic.
- Rate limiting applied globally (100 requests per 15 minutes per IP).
- HTTP security headers applied via Helmet.js.
- No stack traces or internal error messages exposed in API responses.

### NFR-02 — Code Quality
- ES6 classes used throughout.
- Clean architecture: routes → controllers → services → repositories.
- Environment variables for all configuration (no hardcoded secrets).
- Async/await used exclusively (no callbacks).
- Centralized error handling middleware.

### NFR-03 — Performance
- PostgreSQL connection pool (max 10 connections) shared as a Singleton.
- Pagination enforced on all list endpoints to prevent full-table dumps.

---

## 5. API Endpoint Summary

| Method | Endpoint                                  | Role Required      |
|--------|-------------------------------------------|--------------------|
| POST   | /api/auth/login                           | Public             |
| GET    | /api/dashboard                            | Admin, Pharmacist  |
| GET    | /api/alerts                               | Admin, Pharmacist  |
| GET    | /api/medicines                            | Admin, Pharmacist  |
| POST   | /api/medicines                            | Admin, Pharmacist  |
| GET    | /api/medicines/:id                        | Admin, Pharmacist  |
| PUT    | /api/medicines/:id                        | Admin, Pharmacist  |
| DELETE | /api/medicines/:id                        | Admin, Pharmacist  |
| POST   | /api/admin/pharmacists                    | Admin only         |
| GET    | /api/admin/pharmacists                    | Admin only         |
| PATCH  | /api/admin/pharmacists/:id/deactivate     | Admin only         |
| PATCH  | /api/admin/pharmacists/:id/reactivate     | Admin only         |

---

## 6. Out of Scope

The following features were considered but explicitly excluded from this version:

- Activity / audit logging
- Email or push notifications for expiry alerts
- JWT refresh tokens and token blacklist on logout
- Automated unit and integration tests
- Cloud deployment (AWS, GCP, etc.)
- Frontend / UI layer

These items are documented in FutureScope.md.
