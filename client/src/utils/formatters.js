/**
 * Financial & Date Formatting Utilities
 * Handles INR currency formatting, exact two-decimal precision, and calendar dates.
 */

/**
 * Formats a numeric or decimal string value into Indian Rupee format (e.g., ₹1,25,000.00).
 * Preserves two decimal places accurately.
 *
 * @param {string|number} amount
 * @returns {string} Formatted INR currency string
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }

  // Convert to string and handle negative signs if present
  let str = String(amount).trim();
  const isNegative = str.startsWith('-');
  if (isNegative) {
    str = str.substring(1);
  }

  const parts = str.split('.');
  const integerPart = parts[0] || '0';
  let decimalPart = parts[1] || '00';

  if (decimalPart.length === 1) decimalPart += '0';
  else if (decimalPart.length > 2) decimalPart = decimalPart.substring(0, 2);

  // Apply Indian number grouping:
  // The last three digits get grouped together, and then all preceding digits in pairs of two.
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }

  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const result = `₹${formattedInteger}.${decimalPart}`;

  return isNegative ? `-${result}` : result;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into user-friendly format (e.g. "04 Nov, 2026").
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const mIndex = parseInt(month, 10) - 1;
  return `${day} ${monthNames[mIndex] || month}, ${year}`;
}

/**
 * Safely sums an array of decimal strings or numbers in cents (integers) to avoid IEEE 754 precision drift.
 *
 * @param {Array<string|number>} amounts
 * @returns {string} Total sum as exact decimal string (e.g. "1250.50")
 */
export function sumDecimalAmounts(amounts) {
  let totalCents = 0;

  for (const amt of amounts) {
    if (!amt) continue;
    const str = String(amt).trim();
    const parts = str.split('.');
    const intPart = parseInt(parts[0] || '0', 10);
    const fracPart = parseInt((parts[1] || '00').padEnd(2, '0').slice(0, 2), 10);

    const sign = str.startsWith('-') ? -1 : 1;
    totalCents += sign * (Math.abs(intPart) * 100 + fracPart);
  }

  const signStr = totalCents < 0 ? '-' : '';
  const absCents = Math.abs(totalCents);
  const dollars = Math.floor(absCents / 100);
  const cents = (absCents % 100).toString().padStart(2, '0');

  return `${signStr}${dollars}.${cents}`;
}
