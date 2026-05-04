# Medicine Expiry Tracking System

A backend API for tracking medicine inventory, expiry dates, and stock alerts. Built with Node.js, Express, and PostgreSQL.

## Features

- **Authentication**: JWT-based auth with admin and pharmacist roles
- **Medicine Management**: CRUD operations for medicines with expiry tracking
- **Alert System**: Automatic alerts for expired, critical, expiring soon, out of stock, and low stock medicines
- **Dashboard**: Statistics and summary of inventory status
- **Admin Panel**: Manage pharmacist accounts (create, activate/deactivate)

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT + bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or Neon)
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd medicine-tracker-backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database - Option 1: Use DATABASE_URL (recommended for Neon/Railway)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Database - Option 2: Use individual variables (for local development)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=medicine_tracker
# DB_USER=your_username
# DB_PASSWORD=your_password

# JWT Secret (generate a strong random string)
JWT_SECRET=your_secret_key_here_minimum_32_characters

# Default Admin Credentials (optional, defaults to admin/admin123)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Setup Database Schema

Connect to your PostgreSQL database and run the schema file:

```bash
# Using psql locally
psql -U your_username -d your_database -f src/utils/schema.sql

# Or using Neon console, copy-paste the contents of src/utils/schema.sql
```

### 4. Seed the Database

**Option A: Seed everything at once (admin + users + medicines)**

```bash
npm run seed:all
```

This runs all seeders in sequence:
1. Creates the admin user (default: admin/admin123)
2. Creates 5 pharmacist accounts (password: pharma123)
3. Inserts 1000 medicines with various categories and expiry dates

**Option B: Seed individually**

```bash
# Only admin account
npm run seed

# Only pharmacist accounts (5 users)
npm run seed:users

# Only medicines (1000 items)
npm run seed:medicines

### 5. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and receive JWT token |

### Medicines (Admin & Pharmacist)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medicines` | List all medicines (sorted by ID, with filters, search, pagination) |
| POST | `/api/medicines` | Create a new medicine |
| GET | `/api/medicines/:id` | Get medicine details |
| PUT | `/api/medicines/:id` | Update medicine |
| DELETE | `/api/medicines/:id` | Delete medicine |

#### Query Parameters for GET /api/medicines

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `search` | string | - | Search by name or category (case-insensitive) |
| `category` | string | - | Filter by exact category |
| `status` | string | - | Filter by `expired` or `active` |

**Example:**
- `?search=panadol&page=1&limit=10` → Search for panadol on page 1

### Alerts (Admin & Pharmacist)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get all computed alerts |

### Dashboard (Admin & Pharmacist)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/pharmacists` | List all pharmacists |
| POST | `/api/admin/pharmacists` | Create pharmacist account |
| PATCH | `/api/admin/pharmacists/:id/status` | Activate/deactivate pharmacist |
| DELETE | `/api/admin/pharmacists/:id` | Delete pharmacist (cannot delete self or admin) |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |

## Design Patterns Implemented

This project follows several core design patterns to ensure scalability and clean architecture:

1.  **Singleton — [Database.js](file:///src/config/Database.js)**: Ensures only one PostgreSQL connection pool is shared across the entire application.
2.  **Factory Method — [AlertFactory.js](file:///src/patterns/AlertFactory.js)**: Centralizes the logic for creating different alert types (Expired, Critical, Out of Stock, etc.) based on medicine status.
3.  **Facade — [MedicineService.js](file:///src/modules/medicine/MedicineService.js)**: Provides a simplified interface for all medicine-related operations, hiding the complexity of repositories and pagination logic.
4.  **Chain of Responsibility — [Middleware Pipeline](file:///src/patterns/middleware/)**: A chain of independent handlers (Auth -> Role -> Validation) that process incoming requests sequentially.

## Testing Suite

The system includes 37 unit tests and a performance testing suite to ensure reliability and speed.

### 1. Unit Testing (Jest)
Covers all 4 design patterns with 37 test cases.
```bash
npm test
```

### 2. Performance Testing (Artillery)
Simulates high traffic (up to 50 users/sec) to measure latency and throughput.
```bash
npm run test:perf
```

### 3. Logic Benchmarking
Measures the computational speed of the design patterns (e.g., processing 10,000 items).
```bash
npm run test:benchmark
```

## Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run all 37 unit tests
npm run test:perf      # Run API load performance test
npm run test:benchmark # Run logic/design pattern benchmark
npm run seed:all       # Seed admin + pharmacists + 1000 medicines
```

## Project Structure

```
medicine_tracker/
├── src/
│   ├── app.js                 # Entry point
│   ├── config/                # [Singleton] DB Configuration
│   ├── middleware/            # Global Middlewares
│   ├── modules/               # [Facade] Business Logic Modules
│   ├── patterns/              # [Factory/Chain] Pattern Implementations
│   ├── tests/                 # Unit & Performance Test Suites
│   └── utils/                 # DB Schema & Seeders
├── babel.config.cjs           # Jest ESM Configuration
├── package.json
└── README.md                  # This file
```

## Alert Categories

The system computes five types of alerts:

| Alert Type | Condition | Severity |
|------------|-----------|----------|
| **EXPIRED** | Expiry date has passed | HIGH |
| **CRITICAL** | Expires within 7 days | HIGH |
| **EXPIRING_SOON** | Expires within 30 days | MEDIUM |
| **OUT_OF_STOCK** | Quantity = 0 | HIGH |
| **RUNNING_LOW** | Quantity ≤ 10 | MEDIUM |

## Deployment

### Railway + Neon

1. Create a Neon PostgreSQL database
2. Connect Railway to your GitHub repo
3. Add environment variables in Railway dashboard:
   - `DATABASE_URL` (from Neon connection string)
   - `NODE_ENV=production`
   - `JWT_SECRET`
   - `PORT` (Railway sets this automatically)
4. Deploy and run `npm run seed` in Railway console

## License

MIT
