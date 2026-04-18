# System Architecture — Medicine Expiry Date Tracking System

## Overview

This document describes the internal structure and request flow of the Medicine Expiry Date
Tracking System backend. It explains how data moves through the application, how each layer
is responsible, and the reasoning behind each architectural decision.

---

## 1. Architectural Pattern: Clean Architecture

The application follows **Clean Architecture**, separating concerns into four distinct layers:

```
┌─────────────────────────────────────────┐
│         HTTP Request / Response         │
├─────────────────────────────────────────┤
│     ROUTES (Express Router)             │
├─────────────────────────────────────────┤
│     CONTROLLERS (Request Handlers)      │
├─────────────────────────────────────────┤
│   SERVICES / FACADES (Business Logic)   │
├─────────────────────────────────────────┤
│  REPOSITORIES (Data Access Layer)       │
├─────────────────────────────────────────┤
│     DATABASE (PostgreSQL + Singleton)   │
└─────────────────────────────────────────┘
```

### Layer 1: Routes

**Responsibility:** Map HTTP methods and URLs to controller methods.

**File Location:** `src/modules/{module}/routes.js`

**Example:**
```javascript
router.post('/login', authController.login);
router.get('/medicines', authenticate, authorize(['admin', 'pharmacist']), medicineController.list);
```

**Key Point:** Routes define the API contract (method + path). They do NOT contain business logic.

---

### Layer 2: Middleware Pipeline

**Responsibility:** Intercept and validate requests before they reach the controller.

The middleware chain runs in this order:

```
Request
  │
  ├─ errorHandler (wraps everything, catches exceptions)
  ├─ helmet (HTTP security headers)
  ├─ rateLimit (100 requests / 15 minutes)
  ├─ express.json() (parse JSON body)
  │
  └─ Route-specific middleware:
     ├─ AuthHandler (verify JWT)
     ├─ RoleHandler (check role)
     └─ ValidationHandler (validate req.body)
```

Each handler is an **ES6 class**. If a handler rejects the request, it returns an error
response and the chain stops. Otherwise, it calls `next()` and the next handler runs.

**Design Pattern:** Chain of Responsibility

---

### Layer 3: Controllers

**Responsibility:** Parse HTTP request, delegate to service, format response.

**File Location:** `src/modules/{module}/{module}.controller.js`

**Example:**
```javascript
class AuthController {
  async login(req, res) {
    const { username, password } = req.body; // Already validated
    const result = await authService.login(username, password);
    return res.json({ token: result.token, user: result.user });
  }
}
```

**Key Points:**
- Controllers receive only validated data (validation happened in middleware)
- Controllers do NOT touch the database directly
- Controllers do NOT contain business logic — they delegate to services
- Controllers format responses (JSON, status codes, headers)

---

### Layer 4: Services & Facades

**Responsibility:** Implement business logic, coordinate repositories, and prepare data.

**File Location:** `src/modules/{module}/{Module}Service.js` (PascalCase for classes)

**Design Pattern:** Facade

**Why:** Services hide the complexity of databases, alerts, and validation behind simple
method names. Controllers call `medicineService.listMedicines(query)` and get back
clean, paginated data. The service handles sorting, filtering, pagination, and alert
classification internally.

**Example:**
```javascript
class MedicineService {
  async listMedicines(query) {
    // Normalize and validate query params
    // Call repository with filters
    // Optionally classify alerts for each medicine
    // Return clean, formatted result
  }

  async createMedicine(data, userId) {
    // Business logic: validate, check permissions, compute defaults
    // Call repository
    // Return created medicine
  }
}
```

---

### Layer 5: Repositories

**Responsibility:** Direct database access via parameterized SQL.

**File Location:** `src/modules/{module}/{module}.repository.js`

**Example:**
```javascript
class MedicineRepository {
  async findAll(filters) {
    // Build parameterized SQL query with placeholders ($1, $2, ...)
    // User inputs are ALWAYS in the values array, never in the SQL string
    const result = await db.query(sql, values);
    return result.rows;
  }

  async findById(id) {
    return await db.query(
      'SELECT * FROM medicines WHERE id = $1',
      [id] // Safe from SQL injection
    );
  }
}
```

**Key Point:** SQL is ALWAYS parameterized. User input NEVER goes into the SQL string.

---

### Layer 6: Database (Singleton)

**Responsibility:** Maintain a single shared PostgreSQL connection pool.

**File Location:** `src/config/Database.js`

**Design Pattern:** Singleton

**Why:** Creating a new database connection for every query is expensive. A connection pool
maintains 10 open connections and reuses them. Making it a Singleton ensures the entire
app shares one pool instance.

**Example:**
```javascript
class Database {
  static #instance = null;

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
      });
    }
    return Database.#instance;
  }

  async query(sql, values) {
    return await Database.getInstance().query(sql, values);
  }
}
```

Every repository imports and calls `Database.getInstance()` — they all get the same object.

---

## 2. Request/Response Flow Examples

### Example A: Login Request

```
POST /api/auth/login
Content-Type: application/json

{ "username": "admin", "password": "secret123" }
```

**Flow:**

1. **Express receives request**
2. **errorHandler middleware** — wraps everything in try/catch
3. **helmet middleware** — adds security headers (X-Frame-Options, CSP, etc.)
4. **rateLimit middleware** — checks IP against 100/15min limit
5. **express.json() middleware** — parses request body
6. **Route handler** — matches POST /api/auth/login
7. **ValidationHandler middleware** — validates body against loginSchema
   ```javascript
   const loginSchema = Joi.object({
     username: Joi.string().required(),
     password: Joi.string().required(),
   });
   ```
8. **Controller** — calls `authService.login(username, password)`
9. **Service** —
   - Calls `userRepository.findByUsername(username)`
   - Compares password with bcrypt
   - Generates JWT token
   - Returns { token, user }
10. **Repository** — executes parameterized SQL:
    ```sql
    SELECT * FROM users WHERE username = $1
    ```
11. **Database (Singleton)** — uses the shared connection pool
12. **PostgreSQL** — returns user record
13. **Response travels back up the stack**
14. **Express sends HTTP response:**
    ```
    HTTP 200 OK
    Content-Type: application/json

    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": { "id": 1, "username": "admin", "role": "admin" }
    }
    ```

---

### Example B: Create Medicine Request (Protected)

```
POST /api/medicines
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Aspirin",
  "quantity": 50,
  "expiry_date": "2025-12-31",
  "category": "Analgesic"
}
```

**Flow:**

1-5. **Global middleware** (errorHandler, helmet, rateLimit, express.json())

6. **Route handler** — matches POST /api/medicines

7. **AuthHandler middleware** — Chain of Responsibility
   - Extracts JWT from Authorization header
   - Verifies signature using JWT_SECRET
   - Attaches user to req.user = { id: 1, username: 'admin', role: 'admin' }
   - Calls next()

8. **RoleHandler middleware** — Chain of Responsibility
   - Checks if req.user.role is in allowed roles ['admin', 'pharmacist']
   - Role check passes ✓
   - Calls next()

9. **ValidationHandler middleware** — Chain of Responsibility
   - Validates req.body against medicineCreateSchema
   - Schema defines: name (required string), quantity (required int >= 0), etc.
   - Body is valid ✓
   - Calls next()

10. **Controller** — `medicineController.create(req, res)`
    ```javascript
    const result = await medicineService.createMedicine(
      req.body,
      req.user.id  // User is now attached
    );
    ```

11. **Service** — `medicineService.createMedicine(data, userId)`
    - Performs additional business logic if needed
    - Calls `medicineRepository.create(data, userId)`

12. **Repository** — `medicineRepository.create(data, userId)`
    - Builds INSERT statement with placeholders
    - Executes:
      ```sql
      INSERT INTO medicines (name, quantity, expiry_date, category, created_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
      ```

13. **Database** — uses Singleton pool

14. **PostgreSQL** — inserts row, returns full record

15. **Response back up:**
    ```
    HTTP 201 Created
    Content-Type: application/json

    {
      "id": 5,
      "name": "Aspirin",
      "quantity": 50,
      "expiry_date": "2025-12-31",
      "category": "Analgesic",
      "created_by": 1,
      "created_at": "2025-04-16T10:30:00Z",
      "updated_at": "2025-04-16T10:30:00Z"
    }
    ```

---

## 3. Database Schema

### users table

| Column    | Type         | Constraints | Purpose |
|-----------|--------------|-------------|---------|
| id        | SERIAL       | PRIMARY KEY | Unique user ID |
| name      | VARCHAR(100) | NOT NULL    | Display name |
| username  | VARCHAR(50)  | UNIQUE      | Login identifier |
| password  | VARCHAR(255) | NOT NULL    | bcrypt hash |
| role      | user_role    | DEFAULT 'pharmacist' | 'admin' or 'pharmacist' |
| is_active | BOOLEAN      | DEFAULT true | Soft deactivation flag |
| created_at | TIMESTAMP   | DEFAULT NOW() | Account creation time |

**Indexes:**
- `idx_users_username` on username (for fast login lookups)

### medicines table

| Column      | Type         | Constraints | Purpose |
|-------------|--------------|-------------|---------|
| id          | SERIAL       | PRIMARY KEY | Unique medicine ID |
| name        | VARCHAR(150) | NOT NULL    | Medicine name |
| quantity    | INTEGER      | DEFAULT 0   | Stock count |
| expiry_date | DATE         | NOT NULL    | Expiration date |
| category    | VARCHAR(100) | nullable    | Classification (Analgesic, etc.) |
| created_by  | INTEGER      | FK users.id | Who recorded it (audit trail) |
| created_at  | TIMESTAMP    | DEFAULT NOW() | When recorded |
| updated_at  | TIMESTAMP    | DEFAULT NOW() | Last modification time |

**Indexes:**
- `idx_medicines_expiry_date` (for alert queries)
- `idx_medicines_quantity` (for stock queries)
- `idx_medicines_category` (for filtering)
- `idx_medicines_created_by` (for user medicines)

**Important:** There is NO alerts table. Alerts are computed queries at runtime.

---

## 4. Design Patterns Applied

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Singleton** | src/config/Database.js | Single shared DB pool across entire app |
| **Factory Method** | src/patterns/AlertFactory.js | Classify medicine into correct alert type |
| **Facade** | src/modules/medicine/MedicineService.js | Simple interface to complex medicine operations |
| **Chain of Responsibility** | src/patterns/middleware/ | Separated, reusable request validation steps |

---

## 5. Error Handling Strategy

All errors are caught by the global `errorHandler` middleware.

**In development (NODE_ENV=development):**
```
HTTP 500 Internal Server Error
{
  "error": "Error message",
  "details": { "field": "error" },
  "stack": "... full stack trace ..."
}
```

**In production (NODE_ENV=production):**
```
HTTP 500 Internal Server Error
{
  "error": "Internal server error. Please contact support."
}
```

The stack trace is logged to `console.error()` (server logs) but NEVER sent to the client.

---

## 6. Authentication & Authorization Flow

### Authentication (Who are you?)

1. User POSTs `/api/auth/login` with username + password
2. AuthService compares password with bcrypt hash
3. If match, JWT is issued: `sign({ id, username, role }, JWT_SECRET, { expiresIn: '8h' })`
4. User stores token on client
5. User includes token in future requests: `Authorization: Bearer <token>`
6. AuthHandler middleware verifies signature and expiry
7. If valid, req.user is attached with id, username, role

### Authorization (Are you allowed to do this?)

1. RoleHandler middleware checks `req.user.role` against allowed roles
2. If role matches, request proceeds
3. If role doesn't match, HTTP 403 Forbidden is returned

Example:
```javascript
// Only admins can create pharmacists
router.post(
  '/pharmacists',
  authenticateToken,
  authorizeRole(['admin']),
  createPharmacistValidator,
  adminController.createPharmacist
);
```

---

## 7. Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| JWT_SECRET | Signing key for tokens | 64-char random string |
| PORT | Server port | 3000 |
| NODE_ENV | Runtime mode | development or production |
| ADMIN_USERNAME | Default admin login | admin |
| ADMIN_PASSWORD | Default admin password | admin123 |

All are loaded from `.env` via `dotenv` package on startup.

---

## 8. Summary Table: Where Each Pattern Lives

| Pattern | File | What Problem It Solves |
|---------|------|------------------------|
| **Singleton** | `src/config/Database.js` | One pool, not dozens of connections |
| **Factory** | `src/patterns/AlertFactory.js` | Centralized alert classification |
| **Facade** | `src/modules/medicine/MedicineService.js` | Hide DB + filtering complexity |
| **Chain of Responsibility** | `src/patterns/middleware/Auth|Role|ValidationHandler.js` | Separated, reusable validation |
