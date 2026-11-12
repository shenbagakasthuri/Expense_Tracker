import pool from '../src/config/db.js';
import app from '../src/app.js';
import http from 'http';

/**
 * End-to-end API test script for Registration, Login, and Current User APIs.
 * Connects to live server and performs all test assertions.
 * Cleans up created test records at the end.
 */
async function runAuthApiTests() {
  console.log('--- Starting Phase 3 Backend Authentication Verification ---\n');

  // Start internal test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;
  console.log(`✓ Test HTTP server listening on port ${port}`);

  const testUser = {
    name: '  Arun Kumar  ',
    email: 'Arun.Kumar@Example.com',
    password: 'SecurePass123'
  };

  let registeredUserId = null;
  let authToken = null;

  try {
    // -------------------------------------------------------------
    // 1. Missing fields validation tests
    // -------------------------------------------------------------
    console.log('\n[1] Testing input validations on /register...');

    const resNoName = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    if (resNoName.status !== 400) throw new Error(`Expected 400 for missing name, got ${resNoName.status}`);
    console.log('  ✓ Missing name rejected with 400');

    const resBadEmail = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Arun', email: 'not-an-email', password: testUser.password })
    });
    if (resBadEmail.status !== 400) throw new Error(`Expected 400 for invalid email, got ${resBadEmail.status}`);
    console.log('  ✓ Invalid email format rejected with 400');

    const resShortPass = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Arun', email: testUser.email, password: 'short' })
    });
    if (resShortPass.status !== 400) throw new Error(`Expected 400 for short password, got ${resShortPass.status}`);
    console.log('  ✓ Short password (< 8 chars) rejected with 400');

    // -------------------------------------------------------------
    // 2. Successful Registration
    // -------------------------------------------------------------
    console.log('\n[2] Testing successful registration...');
    const resRegister = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const regData = await resRegister.json();
    if (resRegister.status !== 201) {
      throw new Error(`Registration failed with status ${resRegister.status}: ${JSON.stringify(regData)}`);
    }

    if (!regData.data?.id || regData.data.name !== 'Arun Kumar' || regData.data.email !== 'arun.kumar@example.com') {
      throw new Error(`Unexpected registration response data: ${JSON.stringify(regData)}`);
    }

    if (regData.data.password_hash || regData.data.password) {
      throw new Error('Security Violation: Password or password hash exposed in registration response!');
    }

    registeredUserId = regData.data.id;
    console.log(`  ✓ User registered with ID: ${registeredUserId} (HTTP 201)`);
    console.log(`  ✓ Name trimmed: "${regData.data.name}"`);
    console.log(`  ✓ Email normalized: "${regData.data.email}"`);

    // Verify in database: password hashed and 15 default categories created
    const [dbUsers] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [registeredUserId]);
    const storedHash = dbUsers[0]?.password_hash;
    if (!storedHash || !storedHash.startsWith('$2')) {
      throw new Error('Password hash does not match bcrypt format.');
    }
    console.log('  ✓ Confirmed password is stored as secure bcrypt hash in MySQL.');

    const [dbCats] = await pool.query('SELECT name, type FROM categories WHERE user_id = ? ORDER BY type, name', [registeredUserId]);
    if (dbCats.length !== 15) {
      throw new Error(`Expected 15 default categories, found ${dbCats.length}`);
    }
    const incomeCount = dbCats.filter((c) => c.type === 'INCOME').length;
    const expenseCount = dbCats.filter((c) => c.type === 'EXPENSE').length;
    console.log(`  ✓ Created all 15 default categories (Income: ${incomeCount}, Expense: ${expenseCount})`);

    // -------------------------------------------------------------
    // 3. Duplicate email registration rejected
    // -------------------------------------------------------------
    console.log('\n[3] Testing duplicate email rejection...');
    const resDuplicate = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Another User', email: 'arun.kumar@example.com', password: 'DifferentPass123' })
    });
    if (resDuplicate.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate email, got ${resDuplicate.status}`);
    }
    console.log('  ✓ Duplicate registration rejected with 409 Conflict');

    // -------------------------------------------------------------
    // 4. Login Tests
    // -------------------------------------------------------------
    console.log('\n[4] Testing login endpoint...');

    // Missing credentials
    const resLoginEmpty = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (resLoginEmpty.status !== 400) throw new Error(`Expected 400 for empty login, got ${resLoginEmpty.status}`);
    console.log('  ✓ Empty credentials rejected with 400');

    // Unknown email
    const resUnknownUser = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.com', password: 'Password123' })
    });
    if (resUnknownUser.status !== 401) throw new Error(`Expected 401 for unknown user, got ${resUnknownUser.status}`);
    console.log('  ✓ Non-existent email rejected with 401');

    // Wrong password
    const resWrongPass = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'WrongPassword999' })
    });
    if (resWrongPass.status !== 401) throw new Error(`Expected 401 for wrong password, got ${resWrongPass.status}`);
    console.log('  ✓ Wrong password rejected with 401');

    // Correct credentials
    const resLoginOk = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ARUN.KUMAR@example.com', password: 'SecurePass123' })
    });
    if (resLoginOk.status !== 200) throw new Error(`Expected 200 for valid login, got ${resLoginOk.status}`);
    const loginData = await resLoginOk.json();

    if (!loginData.data?.token || !loginData.data?.user) {
      throw new Error(`Missing token or user object in login response: ${JSON.stringify(loginData)}`);
    }
    if (loginData.data.user.password_hash) {
      throw new Error('Security Violation: Password hash exposed in login response!');
    }
    authToken = loginData.data.token;
    console.log('  ✓ Successful login returned valid JWT token (HTTP 200)');
    console.log(`  ✓ Logged in User ID: ${loginData.data.user.id}, Email: ${loginData.data.user.email}`);

    // -------------------------------------------------------------
    // 5. Current User Protected Route (/api/auth/me)
    // -------------------------------------------------------------
    console.log('\n[5] Testing /api/auth/me protected endpoint...');

    // No token
    const resNoToken = await fetch(`${baseUrl}/me`);
    if (resNoToken.status !== 401) throw new Error(`Expected 401 for missing token, got ${resNoToken.status}`);
    console.log('  ✓ Request without token rejected with 401');

    // Invalid token
    const resBadToken = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' }
    });
    if (resBadToken.status !== 401) throw new Error(`Expected 401 for invalid token, got ${resBadToken.status}`);
    console.log('  ✓ Request with invalid token rejected with 401');

    // Valid token
    const resMeOk = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (resMeOk.status !== 200) throw new Error(`Expected 200 for valid /me request, got ${resMeOk.status}`);
    const meData = await resMeOk.json();

    if (meData.data.id !== registeredUserId || meData.data.email !== 'arun.kumar@example.com') {
      throw new Error(`Unexpected /me response data: ${JSON.stringify(meData)}`);
    }
    if (meData.data.password_hash) {
      throw new Error('Security Violation: password_hash exposed in /me response!');
    }
    console.log('  ✓ /me endpoint authenticated and returned user profile matching JWT subject');
    console.log(`  ✓ Returned fields: ${Object.keys(meData.data).join(', ')} (no password_hash)`);

    console.log('\n[ALL END-TO-END AUTH TESTS PASSED SUCCESSFULLY]');
  } finally {
    // Clean up temporary user and categories
    if (registeredUserId) {
      console.log(`\nCleaning up test user ID ${registeredUserId}...`);
      await pool.query('DELETE FROM categories WHERE user_id = ?', [registeredUserId]);
      await pool.query('DELETE FROM users WHERE id = ?', [registeredUserId]);
      console.log('✓ Cleaned up test data cleanly.');
    }
    server.close();
    await pool.end();
  }
}

runAuthApiTests().catch((err) => {
  console.error('\nTest runner failed:', err.message);
  process.exitCode = 1;
});
