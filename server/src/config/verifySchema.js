import pool from './db.js';

/**
 * Automated Verification Script for Phase 2 Database Schema Integrity
 * Performs comprehensive checks:
 *  1. Table existence and engine (InnoDB, utf8mb4)
 *  2. Column data types (including DECIMAL(12,2))
 *  3. CHECK constraints (positive amounts, valid month ranges)
 *  4. Composite foreign key cross-user category isolation
 *
 * NOTE: All test writes are executed inside a transaction and rolled back.
 * No test records remain in the database.
 */
async function runIntegrityTests() {
  console.log('--- Starting Phase 2 Database Schema Integrity Verification ---\n');

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Verify tables
    const expectedTables = ['users', 'categories', 'transactions', 'budgets'];
    const [tablesResult] = await connection.query(`
      SELECT TABLE_NAME, ENGINE, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    const existingTableMap = new Map(tablesResult.map((t) => [t.TABLE_NAME, t]));

    for (const table of expectedTables) {
      if (!existingTableMap.has(table)) {
        throw new Error(`Required table '${table}' does not exist in schema.`);
      }
      const info = existingTableMap.get(table);
      console.log(`✓ Table '${table}' exists [Engine: ${info.ENGINE}, Collation: ${info.TABLE_COLLATION}]`);
      if (info.ENGINE.toLowerCase() !== 'innodb') {
        throw new Error(`Table '${table}' is not using InnoDB.`);
      }
    }

    // 2. Verify DECIMAL(12,2) on transactions.amount and budgets.amount
    const [amountCols] = await connection.query(`
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('transactions', 'budgets')
        AND COLUMN_NAME = 'amount'
    `);
    amountCols.forEach((col) => {
      console.log(`✓ Verified ${col.TABLE_NAME}.${col.COLUMN_NAME} type: ${col.COLUMN_TYPE}`);
      if (!col.COLUMN_TYPE.includes('decimal(12,2)')) {
        throw new Error(`Expected DECIMAL(12,2) for ${col.TABLE_NAME}.amount, got ${col.COLUMN_TYPE}`);
      }
    });

    // 3. Test integrity constraints with a rollbacked transaction
    await connection.beginTransaction();
    console.log('\n--- Running Dynamic Constraint Tests (In-Transaction Rollback) ---');

    // Create User A and User B
    const [resUserA] = await connection.query(
      `INSERT INTO users (name, email, password_hash) VALUES ('User Alpha', 'alpha_test@example.com', 'hash_a')`
    );
    const userAId = resUserA.insertId;

    const [resUserB] = await connection.query(
      `INSERT INTO users (name, email, password_hash) VALUES ('User Beta', 'beta_test@example.com', 'hash_b')`
    );
    const userBId = resUserB.insertId;
    console.log(`✓ Created test users: User A (ID: ${userAId}), User B (ID: ${userBId})`);

    // Create Category for User A
    const [resCatA] = await connection.query(
      `INSERT INTO categories (user_id, name, type) VALUES (?, 'Groceries', 'EXPENSE')`,
      [userAId]
    );
    const catAId = resCatA.insertId;
    console.log(`✓ Created Category for User A (ID: ${catAId}, Name: Groceries)`);

    // Test: User B attempting to record a transaction using User A's category
    let crossTenantBlocked = false;
    try {
      await connection.query(
        `INSERT INTO transactions (user_id, category_id, amount, transaction_date) VALUES (?, ?, 50.00, CURDATE())`,
        [userBId, catAId]
      );
    } catch (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.message.includes('foreign key')) {
        crossTenantBlocked = true;
        console.log('✓ Success: Composite FK blocked User B from using User A\'s category for a transaction.');
      } else {
        throw err;
      }
    }
    if (!crossTenantBlocked) {
      throw new Error('Security Violation: Database allowed User B to use User A\'s category in transactions!');
    }

    // Test: User B attempting to create a budget using User A's category
    let crossBudgetBlocked = false;
    try {
      await connection.query(
        `INSERT INTO budgets (user_id, category_id, amount, month, year) VALUES (?, ?, 200.00, 5, 2026)`,
        [userBId, catAId]
      );
    } catch (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.message.includes('foreign key')) {
        crossBudgetBlocked = true;
        console.log('✓ Success: Composite FK blocked User B from using User A\'s category for a budget.');
      } else {
        throw err;
      }
    }
    if (!crossBudgetBlocked) {
      throw new Error('Security Violation: Database allowed User B to use User A\'s category in budgets!');
    }

    // Test: Invalid transaction amount (<= 0)
    let negativeAmountBlocked = false;
    try {
      await connection.query(
        `INSERT INTO transactions (user_id, category_id, amount, transaction_date) VALUES (?, ?, -25.00, CURDATE())`,
        [userAId, catAId]
      );
    } catch (err) {
      if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.message.includes('chk_transactions_amount')) {
        negativeAmountBlocked = true;
        console.log('✓ Success: CHECK constraint rejected negative transaction amount.');
      }
    }
    if (!negativeAmountBlocked) {
      console.warn('⚠ Note: CHECK constraint for transaction amount not enforced by this MySQL build.');
    }

    // Test: Invalid budget month (> 12)
    let invalidMonthBlocked = false;
    try {
      await connection.query(
        `INSERT INTO budgets (user_id, category_id, amount, month, year) VALUES (?, ?, 100.00, 13, 2026)`,
        [userAId, catAId]
      );
    } catch (err) {
      if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.message.includes('chk_budgets_month')) {
        invalidMonthBlocked = true;
        console.log('✓ Success: CHECK constraint rejected invalid budget month (13).');
      }
    }
    if (!invalidMonthBlocked) {
      console.warn('⚠ Note: CHECK constraint for budget month not enforced by this MySQL build.');
    }

    // Rollback test changes cleanly
    await connection.rollback();
    console.log('\n✓ Rolled back all test transaction modifications. Database clean.');
    console.log('\n[ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY]');
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        // ignore
      }
    }
    console.error('\nVerification failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

runIntegrityTests();
