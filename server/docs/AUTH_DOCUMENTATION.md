# Authentication and User Management Documentation (Phase 3)

This document describes the design, architecture, security implementation, and testing procedures for the Expense Tracker Backend Authentication system.

---

## 1. Architectural Overview

Authentication in the Expense Tracker API utilizes a stateless, token-based architecture using **JSON Web Tokens (JWT)** and **bcryptjs** for cryptographically secure password storage.

```
+-------------+         1. POST /api/auth/login          +------------------+
|             | ---------------------------------------> |                  |
|             |                                          |  authController  |
|             | <--------------------------------------- |                  |
|             |         2. HTTP 200 { token, user }      +--------+---------+
|             |                                                   |
|   Client    |                                                   | 3. Query
|             |         4. GET /api/auth/me                       v
|             |            Header: Bearer <token>        +------------------+
|             | ---------------------------------------> | authMiddleware   |
|             |                                          +--------+---------+
|             |                                                   | 5. Next()
|             |                                                   v
|             | <--------------------------------------- +------------------+
|             |         6. HTTP 200 { user profile }     |  getMe Handler   |
+-------------+                                          +------------------+
```

---

## 2. Security Design Principles

### A. Password Hashing with bcryptjs
- Passwords are never stored or logged in plain-text.
- `bcrypt.hash(password, 10)` generates a 10-round salted hash. Salt generation makes rainbow table attacks infeasible, while adaptive work factors protect against brute-force attacks.
- Plain-text passwords and password hashes are filtered out of all API responses.

### B. Normalized Inputs & Parameterized Queries
- Names are trimmed; email addresses are trimmed and converted to lowercase.
- All database operations exclusively use **parameterized prepared queries** (`?` placeholders via `mysql2/promise`) preventing SQL injection.

### C. JWT Structure & Verification
- The user ID is stored strictly within the JWT subject (`sub`) claim.
- Secrets are retrieved exclusively from `process.env.JWT_SECRET`.
- Sensitive fields like user credentials, passwords, or hashes are never placed inside the JWT payload.

### D. Generic Authentication Errors
- When credentials fail during login, the system responds with a generic `401 Unauthorized` ("Invalid email or password"). This avoids account enumeration vulnerabilities by never indicating whether the email or password was the cause of failure.

---

## 3. Database Transactions During Registration

User registration performs two dependent operations:
1. Creating the record in the `users` table.
2. Generating 15 user-scoped default categories (5 Income, 10 Expense) in the `categories` table.

To prevent orphaned users with zero categories or inconsistent database state, the entire operation is wrapped within an atomic MySQL transaction:
```javascript
connection = await pool.getConnection();
await connection.beginTransaction();

// 1. Insert user
const [userResult] = await connection.query('INSERT INTO users ...', [...]);
const userId = userResult.insertId;

// 2. Insert 15 default categories for this user
await connection.query('INSERT INTO categories (user_id, name, type) VALUES ?', [categoryValues]);

// 3. Commit only if both succeed
await connection.commit();
```
If an exception occurs at any point, `connection.rollback()` is invoked, rolling back all uncommitted writes before releasing the connection back to the pool.

---

## 4. Default Categories Initialized

Every newly registered user is automatically seeded with 15 categories:

| Category Name | Type | Purpose |
| :--- | :--- | :--- |
| **Salary** | `INCOME` | Primary employment income |
| **Freelance** | `INCOME` | Independent client earnings |
| **Business** | `INCOME` | Business profits |
| **Investments** | `INCOME` | Dividends, capital gains, interest |
| **Other Income** | `INCOME` | Miscellaneous earnings |
| **Food** | `EXPENSE` | Groceries and dining |
| **Transportation** | `EXPENSE` | Fuel, public transit, rides |
| **Shopping** | `EXPENSE` | Clothing, general goods |
| **Bills & Utilities**| `EXPENSE` | Electricity, water, internet |
| **Entertainment** | `EXPENSE` | Movies, subscriptions, games |
| **Healthcare** | `EXPENSE` | Medical, medicines, insurance |
| **Education** | `EXPENSE` | Tuition, books, courses |
| **Travel** | `EXPENSE` | Vacations, lodging, flights |
| **Rent** | `EXPENSE` | Housing rent |
| **Other Expense** | `EXPENSE` | Miscellaneous outlays |

---

## 5. API Reference & Status Codes

### 1. User Registration
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Arun Kumar",
    "email": "arun@example.com",
    "password": "SecurePass123"
  }
  ```
- **Responses**:
  - `201 Created`: User registered and categories initialized.
  - `400 Bad Request`: Missing field, invalid email format, or password < 8 characters.
  - `409 Conflict`: Email already registered.

### 2. User Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "arun@example.com",
    "password": "SecurePass123"
  }
  ```
- **Responses**:
  - `200 OK`: Login successful; returns `{ token, user: { id, name, email } }`.
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials.

### 3. Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Responses**:
  - `200 OK`: Returns authenticated profile `{ id, name, email, created_at }`.
  - `401 Unauthorized`: Missing, invalid, or expired JWT token.
  - `404 Not Found`: Authenticated user no longer exists in database.

---

## 6. How to Test Using PowerShell

### Step 1: Start the Server
```powershell
cd D:\Auspify\expense-tracker\server
npm run dev
```

### Step 2: Register a New User
```powershell
$registerBody = @{
  name = "Arun Kumar"
  email = "arun@example.com"
  password = "SecurePass123"
} | ConvertTo-Json

$regResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$regResponse | ConvertTo-Json
```

### Step 3: Log In and Capture JWT
```powershell
$loginBody = @{
  email = "arun@example.com"
  password = "SecurePass123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token
Write-Host "Received Token: $token"
```

### Step 4: Access Protected Profile (`/api/auth/me`)
```powershell
$headers = @{
  Authorization = "Bearer $token"
}

$meResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/me" -Method Get -Headers $headers
$meResponse | ConvertTo-Json
```

### Step 5: Run Automated Tests
```powershell
cd D:\Auspify\expense-tracker\server
# Run JWT Middleware unit tests
npm test

# Run full end-to-end authentication tests (requires running MySQL)
npm run test:auth
```
