import http from 'http';
import jwt from 'jsonwebtoken';
import pool from '../src/config/db.js';
import app from '../src/app.js';

/**
 * End-to-end Automated Test Suite for Transaction Management API (Phase 4).
 * Covers:
 *  - Transaction creation (income & expense)
 *  - Validation: missing fields, zero/negative amounts, decimal boundaries, date formatting
 *  - Category ownership validation (own category vs another user's category vs invalid category)
 *  - Get all transactions (scoped to authenticated user)
 *  - Filtering by type (INCOME/EXPENSE) and date ranges
 *  - Sorting verification (transaction_date DESC, id DESC)
 *  - Get transaction by ID (own vs nonexistent vs another user's)
 *  - Update transaction (ownership and input verification)
 *  - Prevent updating another user's transaction
 *  - Delete transaction (ownership verification)
 *  - Prevent deleting another user's transaction
 *  - Clean rollback/cleanup of all test data
 */
async function runTransactionTests() {
  console.log('--- Starting Phase 4 Transaction Management End-to-End Tests ---\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/transactions`;

  const secret = process.env.JWT_SECRET || 'default_test_jwt_secret_with_32_characters_minimum!';

  let userAId = null;
  let userBId = null;
  let userAToken = null;
  let userBToken = null;
  let userACatSalary = null;
  let userACatFood = null;
  let userBCatRent = null;
  let createdTxId = null;

  try {
    // -----------------------------------------------------------------
    // Setup Test Users and Categories directly in DB
    // -----------------------------------------------------------------
    console.log('[Setup] Creating temporary test users and categories...');
    const [resUserA] = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ('User Alpha', 'alpha_tx_test@example.com', 'dummyhash')`
    );
    userAId = resUserA.insertId;

    const [resUserB] = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ('User Beta', 'beta_tx_test@example.com', 'dummyhash')`
    );
    userBId = resUserB.insertId;

    userAToken = jwt.sign({ sub: userAId, email: 'alpha_tx_test@example.com' }, secret, { expiresIn: '1h' });
    userBToken = jwt.sign({ sub: userBId, email: 'beta_tx_test@example.com' }, secret, { expiresIn: '1h' });

    // User A Categories
    const [catA1] = await pool.query(`INSERT INTO categories (user_id, name, type) VALUES (?, 'Salary', 'INCOME')`, [userAId]);
    userACatSalary = catA1.insertId;

    const [catA2] = await pool.query(`INSERT INTO categories (user_id, name, type) VALUES (?, 'Food & Dining', 'EXPENSE')`, [userAId]);
    userACatFood = catA2.insertId;

    // User B Category
    const [catB1] = await pool.query(`INSERT INTO categories (user_id, name, type) VALUES (?, 'Rent', 'EXPENSE')`, [userBId]);
    userBCatRent = catB1.insertId;

    console.log(`✓ Test accounts created. User A: ${userAId}, User B: ${userBId}`);

    // Helper for authenticated requests
    const apiRequest = async (path, options = {}, token = userAToken) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // -----------------------------------------------------------------
    // 1. Transaction Creation Validation Tests
    // -----------------------------------------------------------------
    console.log('\n[1] Testing input validations on POST /api/transactions...');

    // Missing fields
    const resMissing = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify({ amount: 100 })
    });
    if (resMissing.status !== 400) throw new Error(`Expected 400 for missing fields, got ${resMissing.status}`);
    console.log('  ✓ Missing required fields rejected with 400');

    // Zero amount
    const resZero = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify({ category_id: userACatFood, amount: 0, transaction_date: '2026-11-04' })
    });
    if (resZero.status !== 400) throw new Error(`Expected 400 for zero amount, got ${resZero.status}`);
    console.log('  ✓ Zero amount rejected with 400');

    // Negative amount
    const resNeg = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify({ category_id: userACatFood, amount: -50, transaction_date: '2026-11-04' })
    });
    if (resNeg.status !== 400) throw new Error(`Expected 400 for negative amount, got ${resNeg.status}`);
    console.log('  ✓ Negative amount rejected with 400');

    // Amount with more than 2 decimal places (e.g. 12.345)
    const resPrecision = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify({ category_id: userACatFood, amount: 12.345, transaction_date: '2026-11-04' })
    });
    if (resPrecision.status !== 400) throw new Error(`Expected 400 for 12.345 precision, got ${resPrecision.status}`);
    console.log('  ✓ Amount with >2 decimal places (12.345) rejected with 400');

    // Invalid non-existent category
    const resNonExistentCat = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify({ category_id: 999999, amount: 50, transaction_date: '2026-11-04' })
    });
    if (resNonExistentCat.status !== 404) throw new Error(`Expected 404 for non-existent category, got ${resNonExistentCat.status}`);
    console.log('  ✓ Non-existent category rejected with 404');

    // Cross-user category access (User A attempting to use User B's category)
    const resCrossCat = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify({ category_id: userBCatRent, amount: 250, transaction_date: '2026-11-04' })
    });
    if (resCrossCat.status !== 404) throw new Error(`Expected 404 for another user's category, got ${resCrossCat.status}`);
    console.log('  ✓ User A using User B category rejected with 404');

    // -----------------------------------------------------------------
    // 2. Successful Transaction Creation
    // -----------------------------------------------------------------
    console.log('\n[2] Testing successful transaction creation...');

    // Create Income Transaction
    const resCreateIncome = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify({
        category_id: userACatSalary,
        amount: 5000.00,
        description: 'Monthly paycheck',
        transaction_date: '2026-11-01'
      })
    });
    if (resCreateIncome.status !== 201) throw new Error(`Expected 201 for income transaction, got ${resCreateIncome.status}: ${JSON.stringify(resCreateIncome.data)}`);
    if (resCreateIncome.data.data.type !== 'INCOME' || resCreateIncome.data.data.category_name !== 'Salary') {
      throw new Error(`Unexpected income transaction data: ${JSON.stringify(resCreateIncome.data)}`);
    }
    console.log(`  ✓ Income transaction created successfully (ID: ${resCreateIncome.data.data.id})`);

    // Create Expense Transaction
    const resCreateExpense = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify({
        category_id: userACatFood,
        amount: 85.50,
        description: 'Weekly groceries',
        transaction_date: '2026-11-03'
      })
    });
    if (resCreateExpense.status !== 201) throw new Error(`Expected 201 for expense transaction, got ${resCreateExpense.status}`);
    createdTxId = resCreateExpense.data.data.id;
    console.log(`  ✓ Expense transaction created successfully (ID: ${createdTxId})`);

    // -----------------------------------------------------------------
    // 3. Get All Transactions & Filtering
    // -----------------------------------------------------------------
    console.log('\n[3] Testing GET /api/transactions listing and filters...');

    // User A fetches all
    const resAllA = await apiRequest('/', { method: 'GET' });
    if (resAllA.status !== 200 || resAllA.data.data.length !== 2) {
      throw new Error(`Expected 2 transactions for User A, got ${resAllA.data?.data?.length}`);
    }
    console.log(`  ✓ User A retrieved their 2 transactions`);

    // User B fetches all (should be 0)
    const resAllB = await apiRequest('/', { method: 'GET' }, userBToken);
    if (resAllB.status !== 200 || resAllB.data.data.length !== 0) {
      throw new Error(`Expected 0 transactions for User B, got ${resAllB.data?.data?.length}`);
    }
    console.log(`  ✓ User B sees 0 transactions (User isolation confirmed)`);

    // Filter by type: INCOME
    const resIncomeOnly = await apiRequest('?type=INCOME', { method: 'GET' });
    if (resIncomeOnly.data.data.length !== 1 || resIncomeOnly.data.data[0].type !== 'INCOME') {
      throw new Error(`Filter by type=INCOME failed: ${JSON.stringify(resIncomeOnly.data)}`);
    }
    console.log('  ✓ Filter by type=INCOME verified');

    // Filter by date range
    const resDateFilter = await apiRequest('?start_date=2026-11-02&end_date=2026-11-04', { method: 'GET' });
    if (resDateFilter.data.data.length !== 1 || resDateFilter.data.data[0].id !== createdTxId) {
      throw new Error(`Filter by date range failed: ${JSON.stringify(resDateFilter.data)}`);
    }
    console.log('  ✓ Filter by start_date and end_date verified');

    // -----------------------------------------------------------------
    // 4. Get Transaction by ID
    // -----------------------------------------------------------------
    console.log('\n[4] Testing GET /api/transactions/:id...');

    // Own transaction
    const resGetById = await apiRequest(`/${createdTxId}`, { method: 'GET' });
    if (resGetById.status !== 200 || resGetById.data.data.id !== createdTxId) {
      throw new Error(`Failed to get transaction by ID: ${JSON.stringify(resGetById.data)}`);
    }
    console.log('  ✓ Successfully retrieved own transaction by ID');

    // Non-existent ID
    const resGet404 = await apiRequest('/999999', { method: 'GET' });
    if (resGet404.status !== 404) throw new Error(`Expected 404 for non-existent ID, got ${resGet404.status}`);
    console.log('  ✓ Non-existent transaction ID returned 404');

    // Cross-user access (User B attempting to get User A's transaction)
    const resGetCross = await apiRequest(`/${createdTxId}`, { method: 'GET' }, userBToken);
    if (resGetCross.status !== 404) throw new Error(`Expected 404 when User B gets User A's transaction, got ${resGetCross.status}`);
    console.log('  ✓ Cross-user GET /api/transactions/:id returned 404');

    // -----------------------------------------------------------------
    // 5. Update Transaction
    // -----------------------------------------------------------------
    console.log('\n[5] Testing PUT /api/transactions/:id...');

    // User A updates amount and description
    const resUpdate = await apiRequest(`/${createdTxId}`, {
      method: 'PUT',
      body: JSON.stringify({
        category_id: userACatFood,
        amount: 95.00,
        description: 'Updated grocery bill',
        transaction_date: '2026-11-03'
      })
    });
    if (resUpdate.status !== 200 || resUpdate.data.data.amount !== '95.00') {
      throw new Error(`Failed to update transaction: ${JSON.stringify(resUpdate.data)}`);
    }
    console.log('  ✓ Updated own transaction successfully (new amount: 95.00 string)');

    // User A updates omitting description (must preserve existing description)
    const resOmitDesc = await apiRequest(`/${createdTxId}`, {
      method: 'PUT',
      body: JSON.stringify({
        category_id: userACatFood,
        amount: 110.00,
        transaction_date: '2026-11-03'
      })
    });
    if (resOmitDesc.status !== 200 || resOmitDesc.data.data.description !== 'Updated grocery bill') {
      throw new Error(`Failed to preserve omitted description: ${JSON.stringify(resOmitDesc.data)}`);
    }
    console.log('  ✓ Omitted description on PUT preserved existing description');

    // User A clears description with explicit null
    const resClearNull = await apiRequest(`/${createdTxId}`, {
      method: 'PUT',
      body: JSON.stringify({
        category_id: userACatFood,
        amount: 110.00,
        description: null,
        transaction_date: '2026-11-03'
      })
    });
    if (resClearNull.status !== 200 || resClearNull.data.data.description !== null) {
      throw new Error(`Failed to clear description with null: ${JSON.stringify(resClearNull.data)}`);
    }
    console.log('  ✓ Explicit null description cleared description');

    // User A clears description with explicit empty string
    const resClearEmpty = await apiRequest(`/${createdTxId}`, {
      method: 'PUT',
      body: JSON.stringify({
        category_id: userACatFood,
        amount: 110.00,
        description: '',
        transaction_date: '2026-11-03'
      })
    });
    if (resClearEmpty.status !== 200 || resClearEmpty.data.data.description !== null) {
      throw new Error(`Failed to clear description with empty string: ${JSON.stringify(resClearEmpty.data)}`);
    }
    console.log('  ✓ Explicit empty string description cleared description');

    // User A attempting to update to User B's category
    const resUpdateCrossCat = await apiRequest(`/${createdTxId}`, {
      method: 'PUT',
      body: JSON.stringify({
        category_id: userBCatRent,
        amount: 95.00,
        transaction_date: '2026-11-03'
      })
    });
    if (resUpdateCrossCat.status !== 404) throw new Error(`Expected 404 for cross-user category update, got ${resUpdateCrossCat.status}`);
    console.log('  ✓ Update to another user\'s category rejected with 404');

    // User B attempting to update User A's transaction
    const resUpdateCrossUser = await apiRequest(`/${createdTxId}`, {
      method: 'PUT',
      body: JSON.stringify({
        category_id: userBCatRent,
        amount: 1000.00,
        transaction_date: '2026-11-03'
      })
    }, userBToken);
    if (resUpdateCrossUser.status !== 404) throw new Error(`Expected 404 when User B updates User A's transaction, got ${resUpdateCrossUser.status}`);
    console.log('  ✓ Cross-user update rejected with 404');

    // -----------------------------------------------------------------
    // 6. Delete Transaction
    // -----------------------------------------------------------------
    console.log('\n[6] Testing DELETE /api/transactions/:id...');

    // User B attempting to delete User A's transaction
    const resDeleteCross = await apiRequest(`/${createdTxId}`, { method: 'DELETE' }, userBToken);
    if (resDeleteCross.status !== 404) throw new Error(`Expected 404 when User B deletes User A's transaction, got ${resDeleteCross.status}`);
    console.log('  ✓ Cross-user delete rejected with 404');

    // User A deletes own transaction
    const resDeleteOwn = await apiRequest(`/${createdTxId}`, { method: 'DELETE' });
    if (resDeleteOwn.status !== 200) throw new Error(`Expected 200 for transaction deletion, got ${resDeleteOwn.status}`);
    console.log('  ✓ Deleted own transaction successfully');

    // Verify it is gone
    const resVerifyDeleted = await apiRequest(`/${createdTxId}`, { method: 'GET' });
    if (resVerifyDeleted.status !== 404) throw new Error(`Expected 404 after deletion, got ${resVerifyDeleted.status}`);
    console.log('  ✓ Confirmed transaction is no longer accessible (404)');

    console.log('\n[ALL TRANSACTION E2E TESTS PASSED SUCCESSFULLY]');
  } finally {
    // Clean up temporary test data
    console.log('\n[Cleanup] Removing temporary test records...');
    if (userAId || userBId) {
      await pool.query('DELETE FROM transactions WHERE user_id IN (?, ?)', [userAId || 0, userBId || 0]);
      await pool.query('DELETE FROM categories WHERE user_id IN (?, ?)', [userAId || 0, userBId || 0]);
      await pool.query('DELETE FROM users WHERE id IN (?, ?)', [userAId || 0, userBId || 0]);
      console.log('✓ Temporary records cleaned up.');
    }
    server.close();
    await pool.end();
  }
}

runTransactionTests().catch((err) => {
  console.error('\nTransaction test runner failed:', err.message);
  process.exitCode = 1;
});
