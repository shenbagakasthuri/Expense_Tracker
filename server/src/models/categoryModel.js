import pool from '../config/db.js';

/**
 * Category Model
 * Encapsulates database queries for user categories.
 */

/**
 * Retrieves all categories belonging to the authenticated user.
 * Sorted by type (INCOME first, then EXPENSE) and name ascending.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export async function getCategoriesByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, name, type, created_at
     FROM categories
     WHERE user_id = ?
     ORDER BY type ASC, name ASC`,
    [userId]
  );
  return rows;
}
