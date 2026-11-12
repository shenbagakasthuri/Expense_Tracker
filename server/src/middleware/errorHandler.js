/**
 * Centralized error-handling middleware.
 * Maps known database and application errors to appropriate HTTP status codes,
 * preventing leakage of internal SQL errors, stack traces, or credentials.
 */
export const errorHandler = (err, req, res, next) => {
  // 1. Errors with an explicit statusCode set by application logic
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // 2. MySQL Error Mappings
  // Match both MySQL symbolic string codes and numeric error numbers
  const errCode = err.code;
  const errNo = err.errno;

  // Duplicate key entry (e.g. unique constraint violation)
  if (errCode === 'ER_DUP_ENTRY' || errNo === 1062) {
    return res.status(409).json({
      success: false,
      message: 'A duplicate record already exists.'
    });
  }

  // Foreign key constraint failure (e.g. referenced category/user missing or mismatched)
  if (
    errCode === 'ER_NO_REFERENCED_ROW_2' ||
    errCode === 'ER_NO_REFERENCED_ROW' ||
    errNo === 1452 ||
    errNo === 1216
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference: referenced entity does not exist or cannot be accessed.'
    });
  }

  // Check constraint violation (e.g. positive amount constraint chk_transactions_amount)
  if (errCode === 'ER_CHECK_CONSTRAINT_VIOLATED' || errNo === 3819) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: a database constraint was violated.'
    });
  }

  // 3. Fallback for unexpected system or database errors (logged securely, generic client message)
  console.error('Unhandled Application/Database Error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error occurred.'
  });
};
