const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// Strict monetary regex: optional integer digits, optional decimal point with up to 2 digits.
// No negative sign, no exponents, no whitespace.
const AMOUNT_REGEX = /^\d+(\.\d+)?$/;
const MAX_AMOUNT_STR = '9999999999.99';

/**
 * Compares two positive decimal strings (without signs or exponents) of format "INTEGER.DECIMAL" (both padded to 2 decimal places).
 * Returns >0 if a > b, 0 if a == b, <0 if a < b.
 */
function compareDecimalStrings(a, b) {
  const [aInt, aFrac = '00'] = a.split('.');
  const [bInt, bFrac = '00'] = b.split('.');

  // Remove leading zeros for integer comparison
  const cleanAInt = aInt.replace(/^0+/, '') || '0';
  const cleanBInt = bInt.replace(/^0+/, '') || '0';

  if (cleanAInt.length !== cleanBInt.length) {
    return cleanAInt.length - cleanBInt.length;
  }
  if (cleanAInt !== cleanBInt) {
    return cleanAInt.localeCompare(cleanBInt);
  }

  // Compare fraction parts (normalized to 2 digits)
  const normAFrac = (aFrac + '00').slice(0, 2);
  const normBFrac = (bFrac + '00').slice(0, 2);
  return normAFrac.localeCompare(normBFrac);
}

/**
 * Checks whether a given string is a valid ISO calendar date (YYYY-MM-DD).
 * Ensures months (01-12) and days match real calendar days (e.g., rejecting Feb 31).
 *
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidCalendarDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Validates transaction input fields.
 *
 * @param {object} input
 * @param {boolean} isPartial - If true (e.g. for PATCH), missing fields aren't errors
 * @returns {{ isValid: boolean, errors: string[], cleanData: object }}
 */
export function validateTransactionInput(input, isPartial = false) {
  const errors = [];
  const cleanData = {};

  // 1. Category ID
  if (input.category_id !== undefined) {
    const catId = Number(input.category_id);
    if (!Number.isInteger(catId) || catId <= 0) {
      errors.push('category_id must be a positive integer.');
    } else {
      cleanData.category_id = catId;
    }
  } else if (!isPartial) {
    errors.push('category_id is required.');
  }

  // 2. Amount
  if (input.amount !== undefined) {
    const raw = input.amount;

    if (raw === null || raw === '' || (typeof raw !== 'string' && typeof raw !== 'number')) {
      errors.push('amount must be a valid numeric value.');
    } else {
      const str = String(raw).trim();

      if (!AMOUNT_REGEX.test(str)) {
        errors.push('amount must be a positive numeric value without signs or symbols.');
      } else {
        const parts = str.split('.');
        const intPart = parts[0];
        const fracPart = parts[1] || '';

        if (fracPart.length > 2) {
          errors.push('amount cannot have more than two decimal places.');
        } else {
          // Normalize to exactly 2 decimal places as a decimal string
          const normalizedInt = intPart.replace(/^0+(?=\d)/, ''); // keep at least one digit
          let normalizedFrac = fracPart;
          if (normalizedFrac.length === 0) normalizedFrac = '00';
          else if (normalizedFrac.length === 1) normalizedFrac += '0';

          const normalizedStr = `${normalizedInt}.${normalizedFrac}`;

          // Check positive (> 0.00)
          if (normalizedStr === '0.00' || /^0+\.00$/.test(normalizedStr)) {
            errors.push('amount must be greater than zero.');
          } else if (compareDecimalStrings(normalizedStr, MAX_AMOUNT_STR) > 0) {
            errors.push('amount exceeds maximum supported value (9999999999.99).');
          } else {
            cleanData.amount = normalizedStr;
          }
        }
      }
    }
  } else if (!isPartial) {
    errors.push('amount is required.');
  }

  // 3. Transaction Date (YYYY-MM-DD)
  if (input.transaction_date !== undefined) {
    const dateStr = String(input.transaction_date).trim();
    if (!isValidCalendarDate(dateStr)) {
      errors.push('transaction_date must be a valid calendar date in YYYY-MM-DD format.');
    } else {
      cleanData.transaction_date = dateStr;
    }
  } else if (!isPartial) {
    errors.push('transaction_date is required.');
  }

  // 4. Description
  // Note: Differentiate between property omitted (undefined), explicit null/empty string (cleared), and non-empty string.
  if ('description' in input && input.description !== undefined) {
    if (input.description === null) {
      cleanData.description = null;
    } else if (typeof input.description !== 'string') {
      errors.push('description must be a string or null.');
    } else if (input.description.length > 255) {
      errors.push('description cannot exceed 255 characters.');
    } else {
      cleanData.description = input.description.trim() || null;
    }
  }
  // If description is omitted, cleanData.description remains undefined so caller knows it wasn't provided.

  return {
    isValid: errors.length === 0,
    errors,
    cleanData
  };
}

/**
 * Validates query filters for GET /api/transactions.
 *
 * @param {object} query
 * @returns {{ isValid: boolean, errors: string[], cleanFilters: object }}
 */
export function validateTransactionFilters(query) {
  const errors = [];
  const cleanFilters = {};

  // type (INCOME or EXPENSE)
  if (query.type !== undefined && query.type !== '') {
    const upperType = String(query.type).trim().toUpperCase();
    if (upperType !== 'INCOME' && upperType !== 'EXPENSE') {
      errors.push('type filter must be either INCOME or EXPENSE.');
    } else {
      cleanFilters.type = upperType;
    }
  }

  // category_id
  if (query.category_id !== undefined && query.category_id !== '') {
    const catId = Number(query.category_id);
    if (!Number.isInteger(catId) || catId <= 0) {
      errors.push('category_id filter must be a positive integer.');
    } else {
      cleanFilters.category_id = catId;
    }
  }

  // start_date (YYYY-MM-DD)
  if (query.start_date !== undefined && query.start_date !== '') {
    const dateStr = String(query.start_date).trim();
    if (!isValidCalendarDate(dateStr)) {
      errors.push('start_date must be a valid date in YYYY-MM-DD format.');
    } else {
      cleanFilters.start_date = dateStr;
    }
  }

  // end_date (YYYY-MM-DD)
  if (query.end_date !== undefined && query.end_date !== '') {
    const dateStr = String(query.end_date).trim();
    if (!isValidCalendarDate(dateStr)) {
      errors.push('end_date must be a valid date in YYYY-MM-DD format.');
    } else {
      cleanFilters.end_date = dateStr;
    }
  }

  if (cleanFilters.start_date && cleanFilters.end_date && cleanFilters.start_date > cleanFilters.end_date) {
    errors.push('start_date cannot be later than end_date.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanFilters
  };
}
