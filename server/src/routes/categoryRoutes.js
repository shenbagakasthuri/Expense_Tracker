import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getCategoriesHandler } from '../controllers/categoryController.js';

const router = Router();

// Protect all category routes with JWT authentication
router.use(authenticate);

// GET /api/categories
router.get('/', getCategoriesHandler);

export default router;
