# Transaction Management Documentation (Phase 4)

This document describes the design, implementation, validation rules, security controls, and testing for the Expense Tracker Transaction Management API.

---

## 1. Architectural Overview

The transaction management module adheres to a strict layered design:

```
[Client / Frontend]
         │ (HTTP + Authorization: Bearer <token>)
         ▼
[Express Router: src/routes/transactionRoutes.js]
         │ (Guarded by authMiddleware.js)
         ▼
[Controller: src/controllers/transactionController.js]
         │ ───► Validates input using utils/transactionValidation.js
         │ ───► Enforces ownership checks via authenticated req.user.id
         ▼
[Data Model: src/models/transactionModel.js]
         │ (Parameterized prepared statements)
         ▼
[MySQL Database: transactions & categories tables]
```

---

## 2. API Endpoints

All endpoints require a valid JWT token via the `Authorization: Bearer <token>` header.

### 1. Create Transaction
- **Method & Path**: `POST /api/transactions`
- **Request Body**:
  ```json
  {
    "category_id": 1,
    "amount": 500.00,
    "description": "Freelance payment",
    "transaction_date": "2026-11-04"
  }
  ```
- **Responses**:
  - `201 Created`: Transaction created successfully.
  - `400 Bad Request`: Validation failure (missing required fields, negative amount, invalid date format, etc.).
  - `404 Not Found`: Category does not exist or does not belong to the authenticated user.

### 2. Get All Transactions
- **Method & Path**: `GET /api/transactions`
- **Optional Query Filters**:
  - `type`: `INCOME` or `EXPENSE`
  - `category_id`: Positive integer
  - `start_date`: `YYYY-MM-DD`
  - `end_date`: `YYYY-MM-DD`
- **Responses**:
  - `200 OK`: Array of transactions sorted by `transaction_date DESC, id DESC`.
  - `400 Bad Request`: Invalid filter parameters.

### 3. Get Transaction By ID
- **Method & Path**: `GET /api/transactions/:id`
- **Responses**:
  - `200 OK`: Single transaction object with joined category details.
  - `400 Bad Request`: Invalid ID parameter.
  - `404 Not Found`: Transaction does not exist or belongs to another user.

### 4. Update Transaction
- **Method & Path**: `PUT /api/transactions/:id`
- **Request Body**:
  ```json
  {
    "category_id": 2,
    "amount": 120.00,
    "description": "Updated grocery bill",
    "transaction_date": "2026-11-04"
  }
  ```
- **Responses**:
  - `200 OK`: Updated transaction details.
  - `400 Bad Request`: Validation error.
  - `404 Not Found`: Transaction or replacement category does not exist or belongs to another user.

### 5. Delete Transaction
- **Method & Path**: `DELETE /api/transactions/:id`
- **Responses**:
  - `200 OK`: `{ "success": true, "message": "Transaction deleted successfully." }`
  - `404 Not Found`: Transaction does not exist or belongs to another user.

---

## 3. Data Integrity & Security Controls

1. **User Identity from JWT Only**:
   - `user_id` is never accepted from the request body or query params.
   - It is strictly assigned from `req.user.id` set by `authMiddleware.js`.
2. **Cross-Tenant Category & Transaction Isolation**:
   - Before inserting or updating, the system verifies `SELECT id FROM categories WHERE id = ? AND user_id = ?`.
   - Queries retrieving or mutating transactions enforce `WHERE id = ? AND user_id = ?`.
   - The database composite foreign key `(category_id, user_id) REFERENCES categories(id, user_id)` guarantees database-level integrity as a secondary boundary.
3. **Derived Transaction Type**:
   - The type (`INCOME` or `EXPENSE`) is dynamically joined from the referenced category, guaranteeing 3NF consistency and preventing type mismatches.
4. **DECIMAL(12,2) Precision**:
   - Transaction amounts are capped at `9,999,999,999.99` and rounded/stored to 2 decimal places, preventing floating-point representation drift.
5. **SQL Injection Defense**:
   - 100% of SQL statements utilize parameterized prepared queries (`?` placeholders).

---

## 4. Testing & Verification

Automated test commands:
```bash
# Run validation and unit tests
npm test

# Run transaction end-to-end integration tests
npm run test:tx

# Run authentication end-to-end integration tests
npm run test:auth
```
