# Medicine Expiry Tracking System

A backend API for tracking medicine inventory, expiry dates, and stock alerts. Built with Node.js, Express, and PostgreSQL.

## Features

*   **Authentication & Authorization:** JWT-based login with Admin and Pharmacist role-based access control.
*   **Medicine Management:** Full CRUD operations with automatic expiry tracking and custom queries.
*   **Dynamic Alert System:** Instantly computes alerts for expired, critical, expiring soon, out of stock, and low stock medicines.
*   **Dashboard & Metrics:** Inventory health summary statistics.
*   **Admin Panel:** Create and toggle active status for Pharmacist accounts.
*   **Full Testing Suite:** Armed with Jest unit tests.

## Tech Stack

*   **Runtime:** Node.js (ES Modules)
*   **Framework:** Express.js
*   **Database:** PostgreSQL (Neon / pg.Pool connection pooling)
*   **Security:** Helmet, CORS, Express Rate Limit, BcryptJS, JWT

---

## Setup Instructions

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd medicine-tracker-backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development

# Database Connection (Neon or local PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Security Secrets
JWT_SECRET=your_32_character_security_key_here
```

### 3. Setup Database Schema
Import the database schema using your PostgreSQL client or CLI:
```bash
psql -U your_username -d your_database -f src/utils/schema.sql
```

### 4. Seed the Database
Seed default users and 1,000 randomized medicines:
```bash
npm run seed:all
```

### 5. Start the Application
```bash
# Development (with nodemon auto-reload)
npm run dev

# Production
npm start
```

---

## Available Scripts

*   `npm start` - Starts the production server.
*   `npm run dev` - Starts the development server with live reload.
*   `npm run seed:all` - Seeds admin, pharmacists, and medicines.
*   `npm test` - Runs Jest unit tests.

---

## 🧪 API Testing (Postman)

A pre-configured Postman collection is available in the root of the project to test all endpoints:
👉 **[Medicine_Tracker_Postman_Collection.json]**

### How to use:
1.  **Import the Collection:** Open Postman, click **Import**, and choose the `Medicine_Tracker_Postman_Collection.json` file.
2.  **Set Up Variables:** Edit the imported collection's **Variables** tab:
    *   Set `baseUrl` to `http://localhost:3000` for local testing, or set it to `https://medicine-tracker-backend-production.up.railway.app` for production.
    *   Set `token` after authenticating to store your JWT token.
3.  **Execute Requests:** Run **Admin Login** or **Pharmacist Login**, copy the returned JWT, and save it in the collection's `token` variable. All other routes will automatically authenticate using this token!
