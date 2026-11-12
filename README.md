# Expense Tracker Web Application

A full-stack, responsive, and secure personal finance SaaS application developed for the **Auspify Technologies Full Stack Development Internship**.

Built with **React 19 + Vite** on the frontend, **Node.js + Express.js** on the backend, and **MySQL 8** for normalized, multi-tenant financial data isolation.

---

## 1. Project Overview & Features

### Core Capabilities:
- **User Authentication & Session Management**:
  - Secure registration and login using salted password hashing (**bcryptjs**).
  - Stateless JSON Web Token (**JWT**) bearer authentication.
  - Automatic seeding of **15 default categories** (5 Income, 10 Expense) on registration.
  - Automatic session restoration via `GET /api/auth/me`.
- **Financial Dashboard**:
  - Live summary metrics: **Total Balance**, **Total Income**, **Total Expenses**, and **Transaction Count**.
  - Interactive **Recharts** visualizations: Income vs. Expense monthly trends and Category Expense donut distribution.
  - Quick transaction launcher and latest 5 transactions table.
- **Transaction Management (CRUD)**:
  - Add, view, edit, and delete income and expense records.
  - Category assignment based strictly on user ownership.
  - Real-time search across descriptions, categories, and amounts.
  - Multi-criteria filtering by Type (`INCOME`/`EXPENSE`), Category, and Date ranges (`start_date`, `end_date`).
- **Financial Reports & Analytics**:
  - Annual and monthly breakdown of earnings, spendings, net savings, and savings rates.
  - Monthly surplus/deficit indicators and cashflow charts.
- **Financial Accuracy**:
  - Exact `DECIMAL(12,2)` precision handling on both client and server (avoids IEEE 754 floating-point drift).
  - Indian Rupee (INR ₹) formatting with standard Indian numbering groupings (`₹1,25,000.00`).
- **Responsive SaaS UI/UX**:
  - Professional, minimal design using Lucide icons, accessible inputs, subtle modal dialogues, and responsive mobile drawers.

---

## 2. Technology Stack

### Frontend:
- **React 19**
- **Vite** (Build tool & dev server)
- **Axios** (Centralized API client with JWT interceptors)
- **Recharts** (Interactive financial charts)
- **Lucide React** (Modern, consistent iconography)
- **Pure CSS3** (Custom responsive SaaS layout without bloated third-party CSS dependencies)

### Backend:
- **Node.js (v25.9+)**
- **Express.js (v5.3+)**
- **mysql2/promise** (High-performance connection pooling)
- **jsonwebtoken** (Token creation & verification)
- **bcryptjs** (10-round salted password hashing)
- **dotenv** (Secure environment configuration)

### Database:
- **MySQL 8.0**
  - Storage Engine: **InnoDB**
  - Charset: **utf8mb4** (`utf8mb4_unicode_ci`)
  - Strict Foreign Keys: Composite FK `(category_id, user_id) REFERENCES categories(id, user_id)` preventing cross-tenant leakage.

---

## 3. Architecture & Directory Structure

```
expense-tracker/
├── client/
│   ├── .env.example                     # Frontend environment template
│   ├── index.html                       # HTML entry point
│   ├── vite.config.js                   # Vite configuration
│   └── src/
│       ├── App.jsx                      # Main app shell & screen routing
│       ├── App.css                      # SaaS application styles
│       ├── index.css                    # Global typography & root design variables
│       ├── main.jsx                     # Application bootstrap
│       ├── context/
│       │   └── AuthContext.jsx          # User session & token state
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx          # Desktop & mobile responsive sidebar
│       │   │   └── Header.jsx           # Top header & quick actions
│       │   ├── dashboard/
│       │   │   ├── SummaryCards.jsx     # Financial overview metrics
│       │   │   ├── DashboardCharts.jsx  # Recharts visualizations
│       │   │   └── RecentTransactionsTable.jsx
│       │   ├── transactions/
│       │   │   └── TransactionModal.jsx # Add / Edit transaction dialog
│       │   └── common/
│       │       └── DeleteConfirmModal.jsx
│       ├── pages/
│       │   ├── Login.jsx                # Login view
│       │   ├── Register.jsx             # Register view
│       │   ├── Dashboard.jsx            # Main dashboard overview
│       │   ├── Transactions.jsx         # Full ledger, search & filters
│       │   ├── Reports.jsx              # Annual & monthly financial reports
│       │   └── Profile.jsx              # User details & database status
│       ├── services/
│       │   ├── api.js                   # Central Axios client with interceptors
│       │   ├── authService.js           # Auth endpoint integration
│       │   ├── transactionService.js    # Transaction CRUD endpoints
│       │   └── categoryService.js       # Category endpoints
│       └── utils/
│           └── formatters.js            # INR currency & exact decimal math
└── server/
    ├── .env.example                     # Backend environment template
    ├── database/
    │   ├── schema.sql                   # Normalized MySQL DDL schema
    │   └── README.md                    # Database design & ER diagram
    ├── src/
    │   ├── app.js                       # Express app configuration & routes
    │   ├── server.js                    # Server startup & env validation
    │   ├── config/
    │   │   └── db.js                    # MySQL connection pool
    │   ├── controllers/
    │   │   ├── authController.js        # Register, login, me handlers
    │   │   ├── transactionController.js # Transaction CRUD handlers
    │   │   └── categoryController.js    # User categories handler
    │   ├── middleware/
    │   │   ├── authMiddleware.js        # JWT verification
    │   │   └── errorHandler.js          # MySQL & safe error mapping
    │   ├── models/
    │   │   ├── transactionModel.js      # Parameterized transaction SQL queries
    │   │   └── categoryModel.js         # Parameterized category queries
    │   └── utils/
    │       ├── defaultCategories.js     # Default seeded categories
    │       ├── transactionValidation.js # Exact decimal & date validation
    │       └── validateEnv.js           # Pre-flight environment check
    └── test/                            # Comprehensive Node.js unit & E2E tests
```

---

## 4. API Endpoints

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register new user + 15 default categories (atomic transaction) |
| **POST** | `/api/auth/login` | Public | Verify credentials & issue signed JWT |
| **GET** | `/api/auth/me` | JWT | Get authenticated profile |
| **GET** | `/api/categories` | JWT | Get user's financial categories |
| **GET** | `/api/transactions` | JWT | List transactions (supports `type`, `category_id`, `start_date`, `end_date`) |
| **POST** | `/api/transactions` | JWT | Create income/expense transaction |
| **GET** | `/api/transactions/:id` | JWT | Get single transaction by ID |
| **PUT** | `/api/transactions/:id` | JWT | Update transaction (supports selective description) |
| **DELETE**| `/api/transactions/:id` | JWT | Delete transaction |
| **GET** | `/api/health` | Public | Service health probe |

---

## 5. Local Setup & Installation Instructions

### Prerequisites
- Node.js (v18+)
- MySQL Server 8.0+

### Step 1: Clone or Open Workspace
```powershell
cd D:\Auspify\expense-tracker
```

### Step 2: Database Setup
1. Configure credentials in `server/.env`:
   ```env
   PORT=5001
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=expense_tracker
   DB_PORT=3306
   JWT_SECRET=your_super_secret_jwt_key_with_at_least_32_characters!
   JWT_EXPIRES_IN=24h
   CLIENT_URL=http://localhost:5173
   ```
2. Apply the database schema:
   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < server\database\schema.sql
   ```

### Step 3: Run Backend Server
```powershell
cd server
npm install
npm run dev
```
*Backend runs on `http://localhost:5001`.*

### Step 4: Run Frontend Client
```powershell
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 6. Running Automated Tests

From the `server` directory:
```powershell
# Run all unit tests (Auth middleware, Error handler, Validation, Env checks)
npm test

# Run transaction end-to-end integration tests
npm run test:tx

# Run authentication end-to-end integration tests
npm run test:auth
```
- Total unit tests: **42 passed, 0 failed**.

---

## 7. Internship Demonstration Checklist

- [x] **Registration**: Register a new user and confirm 15 categories created.
- [x] **Login**: Sign in and observe JWT issuance.
- [x] **Session Persistence**: Refresh the browser page and verify the session remains active via `/api/auth/me`.
- [x] **Add Transactions**: Add an income entry (e.g. Salary ₹50,000) and an expense entry (e.g. Food ₹2,500).
- [x] **Financial Accuracy**: Check that Net Balance updates to exact difference (`₹47,500.00`).
- [x] **Visual Charts**: Verify Recharts updates bar and donut charts instantly.
- [x] **Transaction Ledger**: Test searching, filtering by type, and date ranges.
- [x] **Editing & Deleting**: Edit description/amount, delete an entry with modal confirmation.
- [x] **Reports View**: Review monthly breakdown and savings rate.
- [x] **Mobile Drawer**: Resize window or inspect in mobile mode to demonstrate responsive design.
- [x] **Sign Out**: Clean logout clearing client tokens and returning to sign-in screen.
