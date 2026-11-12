import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * Validates JSON Web Tokens passed via the Authorization header (Bearer <token>).
 * Attaches the authenticated user information to `req.user`.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided or invalid format.'
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('Server Configuration Error: JWT_SECRET is not configured in environment variables.');
    return res.status(500).json({
      success: false,
      message: 'Internal server authentication error.'
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Subject (sub) represents the authenticated user's ID
    const userId = Number(decoded.sub);

    if (!userId || isNaN(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.'
      });
    }

    req.user = {
      id: userId
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.'
    });
  }
};
