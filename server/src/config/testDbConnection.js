import pool from './db.js';

/**
 * Diagnostic test script to verify MySQL database connectivity
 * Safe: Never outputs database credentials or passwords to console.
 */
async function testDbConnection() {
  console.log('Testing MySQL database connection...');
  console.log(`Connecting to host: ${process.env.DB_HOST || 'localhost'}, port: ${process.env.DB_PORT || 3306}, database: ${process.env.DB_NAME || 'expense_tracker'}`);

  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✓ Successfully acquired a connection from the pool.');

    const [rows] = await connection.query('SELECT DATABASE() AS current_db, VERSION() AS mysql_version');
    const currentDb = rows[0]?.current_db;
    const mysqlVersion = rows[0]?.mysql_version;

    console.log(`✓ Connected Database: ${currentDb || '(none selected)'}`);
    console.log(`✓ MySQL Server Version: ${mysqlVersion}`);

    // Check existing tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map((row) => Object.values(row)[0]);
    console.log(`✓ Discovered Tables (${tableNames.length}):`, tableNames.length > 0 ? tableNames.join(', ') : 'No tables found yet');

    console.log('\n[SUCCESS] Database connection verified successfully.');
    process.exitCode = 0;
  } catch (error) {
    console.error('\n[ERROR] Database connection failed:');
    console.error(`- Code: ${error.code || 'UNKNOWN'}`);
    console.error(`- Message: ${error.message}`);
    console.error('\nTip: Ensure MySQL server is running, credentials in .env are correct, and the database exists.');
    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }
    // Cleanly close pool so node process exits
    await pool.end();
  }
}

testDbConnection();
