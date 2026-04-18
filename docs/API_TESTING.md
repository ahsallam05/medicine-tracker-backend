# API Testing Guide — Medicine Tracker

This document shows how to test the authentication system using curl or Postman.

---

## Prerequisites

1. Start the server: `npm run dev`
2. Create the default admin account: `npm run seed`
3. Have curl or Postman installed

---

## 1. Login Endpoint

**Endpoint:** `POST /api/auth/login`

**URL:** `http://localhost:3000/api/auth/login`

### Using curl:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Expected Response (HTTP 200 OK):

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcxMDc1MDAwMCwiZXhwIjoxNzEwNzgzODAwfQ.signature...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "is_active": true,
      "created_at": "2025-04-16T10:30:00Z"
    }
  }
}
```

### Error Cases:

**Missing username/password (HTTP 400 Bad Request):**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}'
```

Response:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "password": "Password is required"
  }
}
```

**Invalid credentials (HTTP 401 Unauthorized):**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }'
```

Response:
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Deactivated account (HTTP 401 Unauthorized):**

Response:
```json
{
  "success": false,
  "error": "Account is deactivated"
}
```

---

## 2. Using the JWT Token

Once you have a token, include it in protected routes using the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/medicines \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcxMDc1MDAwMCwiZXhwIjoxNzEwNzgzODAwfQ.signature..."
```

---

## 3. Middleware Chain Demonstration

### Valid Request Flow:

```
POST /api/medicines
Authorization: Bearer <valid-token>
Content-Type: application/json

{
  "name": "Aspirin",
  "quantity": 50,
  "expiry_date": "2025-12-31",
  "category": "Analgesic"
}
```

**Chain of Handlers:**

1. **errorHandler** — Wraps request in try/catch
2. **helmet** — Adds security headers
3. **rateLimit** — Checks IP (100/15min)
4. **express.json()** — Parses body
5. **AuthHandler** — Verifies JWT token, attaches `req.user`
6. **RoleHandler** — Checks if role in ['admin', 'pharmacist']
7. **ValidationHandler** — Validates body against medicineCreateSchema
8. **Controller** — Processes the request

**If any handler rejects:** Request stops and error is returned.

---

## 4. Postman Collection (JSON format)

You can import this into Postman:

```json
{
  "info": {
    "name": "Medicine Tracker API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/login",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"admin123\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## 5. Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Server not running | Run `npm run dev` |
| `connect ECONNREFUSED 127.0.0.1:5432` | Seed script can't connect to database | Check SUPABASE_DB_URL in .env |
| `invalid token` | Token is malformed or tampered | Get a new token from login |
| `token expired` | Token is older than 8 hours | Log in again |
| `Validation failed` | Request body doesn't match schema | Check field names and types |
| `Insufficient permissions` | User role not in allowed list | Use admin account or different user |

---

## 6. Security Notes

- Tokens are valid for **8 hours**
- Passwords are hashed with **bcrypt (cost 12)**
- All requests limited to **100 per 15 minutes per IP**
- Stack traces never exposed in responses (except development)
- All SQL is parameterized (no injection possible)
