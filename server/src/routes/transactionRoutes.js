import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createTransactionHandler,
  getTransactionsHandler,
  getTransactionByIdHandler,
  updateTransactionHandler,
  deleteTransactionHandler
} from '../controllers/transactionController.js';

const router = Router();

// All transaction endpoints require valid JWT authentication
router.use(authenticate);

router.post('/', createTransactionHandler);
router.get('/', getTransactionsHandler);
router.get('/:id', getTransactionByIdHandler);
router.put('/:id', updateTransactionHandler);
router.delete('/:id', deleteTransactionHandler);

export default router;
