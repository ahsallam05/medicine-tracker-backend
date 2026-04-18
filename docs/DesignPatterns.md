# Design Patterns — Medicine Expiry Date Tracking System

This document describes the four design patterns applied in this project.
Each pattern is implemented using ES6 classes and follows the GoF (Gang of Four) definitions.

---

## 1. Singleton — Database.js

### What it is
The Singleton pattern ensures that a class has only one instance, and provides a global
point of access to that instance.

### Where it is used
`src/config/Database.js`

### Why it fits
A PostgreSQL connection pool is expensive to create. Creating a new pool on every database
call would exhaust server resources and slow the application down. By making the pool a
Singleton, the entire application shares one pool instance with a fixed maximum of 10
connections. Every repository imports Database.js and calls `Database.getInstance()` — they
all receive the same object.

### How it works
```
First call  → Database.getInstance() → creates pool → stores in static variable → returns it
Second call → Database.getInstance() → static variable exists → returns same pool
```

### Code Reference
```js
class Database {
  static #instance = null;

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Pool({
        connectionString: process.env.DATABASE_URL,
        // ...other config
      });
    }
    return Database.#instance;
  }
}
```

---

## 2. Factory Method — AlertFactory.js

### What it is
The Factory Method pattern defines an interface for creating an object, but lets subclasses
(or a factory) decide which class to instantiate.

### Where it is used
`src/patterns/AlertFactory.js`

### Why it fits
There are 5 distinct alert types, each with its own threshold logic and label. Without a
factory, every place in the code that categorizes a medicine would need a long if/else block.
AlertFactory encapsulates that decision in one place. You pass in a medicine object and get
back the correct alert instance — the caller never needs to know which class was selected.

### Alert types
| Class           | Condition                                   |
|-----------------|---------------------------------------------|
| ExpiredAlert    | expiry_date < today                         |
| CriticalAlert   | expiry_date within 7 days (not expired)     |
| ExpiringSoon    | expiry_date within 30 days (not critical)   |
| OutOfStockAlert | quantity = 0                                |
| RunningLowAlert | quantity > 0 AND quantity <= 10             |

### How it works
```
AlertFactory.create(medicine)
  → checks conditions in order
  → returns new ExpiredAlert(medicine) | new CriticalAlert(medicine) | ...
```

### Code Reference
```js
class AlertFactory {
  static createAlerts(medicine) {
    const alerts = [];
    const today = new Date();
    const expiryDate = new Date(medicine.expiry_date);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Expiry Alerts
    if (diffDays < 0) {
      alerts.push(new ExpiredAlert(medicine));
    } else if (diffDays <= 7) {
      alerts.push(new CriticalAlert(medicine));
    } else if (diffDays <= 30) {
      alerts.push(new ExpiringSoonAlert(medicine));
    }

    // Stock Alerts
    if (medicine.quantity === 0) {
      alerts.push(new OutOfStockAlert(medicine));
    } else if (medicine.quantity <= 10) {
      alerts.push(new RunningLowAlert(medicine));
    }

    return alerts;
  }
}
```

---

## 3. Facade — MedicineService.js

### What it is
The Facade pattern provides a simplified, unified interface to a complex subsystem.

### Where it is used
`src/modules/medicine/MedicineService.js`

### Why it fits
Medicine operations involve multiple steps: validate pagination params, build dynamic SQL
filters, call the repository, and optionally run alert classification on each result.
Controllers should not contain this logic. MedicineService hides all of it behind simple,
named methods. The controller calls `medicineService.listMedicines(query)` and gets back
clean data — it never touches the repository or the SQL directly.

### How it works
```
Controller → medicineService.listMedicines(query)
               → validates and normalizes query params
               → calls medicineRepository.findAll(filters)
               → returns paginated result
```

### Code Reference
```js
class MedicineService {
  async listMedicines(query) { ... }
  async getMedicineById(id) { ... }
  async createMedicine(data, userId) { ... }
  async updateMedicine(id, data) { ... }
  async deleteMedicine(id) { ... }
}
```

---

## 4. Chain of Responsibility — Middleware Pipeline

### What it is
The Chain of Responsibility pattern passes a request along a chain of handlers. Each handler
decides to process the request or pass it to the next handler.

### Where it is used
```
src/patterns/middleware/AuthHandler.js
src/patterns/middleware/RoleHandler.js
src/patterns/middleware/ValidationHandler.js
```

### Why it fits
HTTP request validation has three distinct concerns: is the token valid? does the user have
the right role? is the request body correctly structured? Mixing all three into one middleware
function violates the Single Responsibility Principle. Separating them into a chain means
each handler does exactly one job. Adding a new check (e.g., IP whitelist) means adding one
new handler class without touching any existing code.

### Chain order
```
Incoming Request
      │
  AuthHandler          ← Verifies JWT. Rejects with 401 if invalid.
      │
  RoleHandler          ← Checks role against allowed roles. Rejects with 403.
      │
  ValidationHandler    ← Validates req.body with a Joi schema. Rejects with 400.
      │
  Controller           ← Request is clean and authorized. Process it.
```

### Code Reference
```js
class AuthHandler {
  handle(req, res, next) {
    // verify JWT → attach user to req → call next()
  }
}

class RoleHandler {
  constructor(allowedRoles) { this.allowedRoles = allowedRoles; }
  handle(req, res, next) {
    // check req.user.role → call next() or reject
  }
}

class ValidationHandler {
  constructor(schema) { this.schema = schema; }
  handle(req, res, next) {
    // validate req.body against schema → call next() or reject
  }
}
```

---

## Pattern Summary Table

| Pattern                  | File                          | Problem Solved                              |
|--------------------------|-------------------------------|---------------------------------------------|
| Singleton                | src/config/Database.js        | One shared DB pool across the entire app    |
| Factory Method           | src/patterns/AlertFactory.js  | Centralised alert-type classification logic |
| Facade                   | src/modules/medicine/MedicineService.js | Simple interface to complex medicine operations |
| Chain of Responsibility  | src/patterns/middleware/      | Separated, reusable request validation steps|
