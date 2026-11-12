import {
  validateTransactionInput,
  validateTransactionFilters
} from '../utils/transactionValidation.js';
import {
  findUserCategory,
  createTransaction as insertTransaction,
  getTransactionById as fetchTransactionById,
  getTransactionsByUser as fetchTransactionsByUser,
  updateTransaction as modifyTransaction,
  deleteTransaction as removeTransaction
} from '../models/transactionModel.js';

/**
 * POST /api/transactions
 * Creates a new transaction for the authenticated user.
 */
export async function createTransactionHandler(req, res, next) {
  try {
    const userId = req.user.id;

    // Validate inputs
    const { isValid, errors, cleanData } = validateTransactionInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors
      });
    }

    // Verify category belongs to authenticated user and retrieve its type
    const category = await findUserCategory(cleanData.category_id, userId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or does not belong to the authenticated user.'
      });
    }

    if (category.type !== 'INCOME' && category.type !== 'EXPENSE') {
      return res.status(400).json({
        success: false,
        message: 'Category must be either INCOME or EXPENSE.'
      });
    }

    // Default description to null if omitted during creation
    const description = cleanData.description !== undefined ? cleanData.description : null;

    // Insert transaction
    const newId = await insertTransaction({
      userId,
      categoryId: cleanData.category_id,
      amount: cleanData.amount,
      description,
      transactionDate: cleanData.transaction_date
    });

    // Fetch the newly created record with joined category info
    const createdTransaction = await fetchTransactionById(newId, userId);

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully.',
      data: createdTransaction
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/transactions
 * Retrieves all transactions for the authenticated user with optional filters.
 */
export async function getTransactionsHandler(req, res, next) {
  try {
    const userId = req.user.id;

    // Validate query filters
    const { isValid, errors, cleanFilters } = validateTransactionFilters(req.query);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filter parameters.',
        errors
      });
    }

    const transactions = await fetchTransactionsByUser(userId, cleanFilters);

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/transactions/:id
 * Retrieves a single transaction by ID belonging to authenticated user.
 */
export async function getTransactionByIdHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID parameter.'
      });
    }

    const transaction = await fetchTransactionById(transactionId, userId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/transactions/:id
 * Updates an existing transaction belonging to the authenticated user.
 */
export async function updateTransactionHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID parameter.'
      });
    }

    // Verify existing transaction exists and belongs to user
    const existing = await fetchTransactionById(transactionId, userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    // Validate inputs
    const { isValid, errors, cleanData } = validateTransactionInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors
      });
    }

    // Verify category belongs to authenticated user
    const category = await findUserCategory(cleanData.category_id, userId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or does not belong to the authenticated user.'
      });
    }

    // Description resolution:
    // If description was provided in req.body, use cleanData.description (which is a string or null)
    // If description was omitted from req.body, preserve existing.description
    const descriptionToSave = 'description' in req.body
      ? cleanData.description
      : existing.description;

    await modifyTransaction(transactionId, userId, {
      categoryId: cleanData.category_id,
      amount: cleanData.amount,
      description: descriptionToSave,
      transactionDate: cleanData.transaction_date
    });

    const updatedTransaction = await fetchTransactionById(transactionId, userId);

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully.',
      data: updatedTransaction
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/transactions/:id
 * Deletes a transaction belonging to the authenticated user.
 */
export async function deleteTransactionHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID parameter.'
      });
    }

    const affectedRows = await removeTransaction(transactionId, userId);
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}
