import pool from '../config/db.js';

/**
 * Transaction Model
 * Encapsulates all direct database SQL queries for transactions.
 * Enforces user isolation via parameterized queries and joins.
 */

/**
 * Finds category belonging to user to verify ownership and retrieve type.
 *
 * @param {number} categoryId
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
export async function findUserCategory(categoryId, userId) {
  const [rows] = await pool.query(
    'SELECT id, user_id, name, type FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
  return rows[0] || null;
}

/**
 * Inserts a new transaction.
 *
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.categoryId
 * @param {number} params.amount
 * @param {string|null} params.description
 * @param {string} params.transactionDate
 * @returns {Promise<number>} Inserted transaction ID
 */
export async function createTransaction({ userId, categoryId, amount, description, transactionDate }) {
  const [result] = await pool.query(
    `INSERT INTO transactions (user_id, category_id, amount, description, transaction_date)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, categoryId, amount, description, transactionDate]
  );
  return result.insertId;
}

/**
 * Retrieves a single transaction by ID and user ID, joining category details.
 *
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
export async function getTransactionById(id, userId) {
  const [rows] = await pool.query(
    `SELECT 
        t.id,
        t.user_id,
        t.category_id,
        c.name AS category_name,
        c.type AS type,
        t.amount,
        t.description,
        DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
        t.created_at,
        t.updated_at
     FROM transactions t
     INNER JOIN categories c ON t.category_id = c.id
     WHERE t.id = ? AND t.user_id = ?`,
    [id, userId]
  );
  return rows[0] || null;
}

/**
 * Retrieves transactions for a user with optional filters, sorted by date DESC, then id DESC.
 *
 * @param {number} userId
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getTransactionsByUser(userId, filters = {}) {
  let sql = `
    SELECT 
        t.id,
        t.user_id,
        t.category_id,
        c.name AS category_name,
        c.type AS type,
        t.amount,
        t.description,
        DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
        t.created_at,
        t.updated_at
     FROM transactions t
     INNER JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = ?
  `;
  const params = [userId];

  if (filters.type) {
    sql += ' AND c.type = ?';
    params.push(filters.type);
  }

  if (filters.category_id) {
    sql += ' AND t.category_id = ?';
    params.push(filters.category_id);
  }

  if (filters.start_date) {
    sql += ' AND t.transaction_date >= ?';
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    sql += ' AND t.transaction_date <= ?';
    params.push(filters.end_date);
  }

  sql += ' ORDER BY t.transaction_date DESC, t.id DESC';

  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Updates an existing transaction for an authenticated user.
 *
 * @param {number} id
 * @param {number} userId
 * @param {object} updates
 * @returns {Promise<number>} Number of affected rows
 */
export async function updateTransaction(id, userId, { categoryId, amount, description, transactionDate }) {
  const [result] = await pool.query(
    `UPDATE transactions 
     SET category_id = ?, amount = ?, description = ?, transaction_date = ?
     WHERE id = ? AND user_id = ?`,
    [categoryId, amount, description, transactionDate, id, userId]
  );
  return result.affectedRows;
}

/**
 * Deletes a transaction by ID for an authenticated user.
 *
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<number>} Number of affected rows
 */
export async function deleteTransaction(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows;
}
