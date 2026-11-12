import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories.js';

// Simple RFC 5322 compliant regex for basic email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Register a new user and initialize 15 default categories using an atomic MySQL transaction.
 */
export const register = async (req, res, next) => {
  let connection;
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.'
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    // 2. Acquire a connection from the pool and start an atomic transaction
    connection = await pool.getConnection();

    // Check for duplicate email
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    await connection.beginTransaction();

    // 3. Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insert user
    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [trimmedName, normalizedEmail, passwordHash]
    );
    const userId = userResult.insertId;

    // 5. Bulk insert default categories for this user
    // DEFAULT_CATEGORIES: 5 income, 10 expense
    const categoryValues = DEFAULT_CATEGORIES.map((cat) => [
      userId,
      cat.name,
      cat.type
    ]);

    await connection.query(
      'INSERT INTO categories (user_id, name, type) VALUES ?',
      [categoryValues]
    );

    // 6. Commit transaction
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully with default categories.',
      data: {
        id: userId,
        name: trimmedName,
        email: normalizedEmail
      }
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error rolling back registration transaction:', rollbackErr.message);
      }
    }
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns a signed JWT.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user by email
    const [users] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [normalizedEmail]
    );

    // Constant-time compare safe pattern: Generic 401 error avoids revealing user existence
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // 2. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 3. Generate JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('Server Configuration Error: JWT_SECRET is not configured in environment variables.');
      return res.status(500).json({
        success: false,
        message: 'Internal authentication configuration error.'
      });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email
      },
      secret,
      { expiresIn }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Retrieves current authenticated user details.
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const user = users[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};
