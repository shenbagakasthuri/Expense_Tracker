import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTransactionInput,
  validateTransactionFilters
} from '../src/utils/transactionValidation.js';

test('Transaction Validation Utilities', async (t) => {
  await t.test('validateTransactionInput: accepts valid payload and normalizes amount to decimal string', () => {
    const input = {
      category_id: 5,
      amount: 150.5,
      description: 'Grocery shopping',
      transaction_date: '2026-11-04'
    };
    const { isValid, errors, cleanData } = validateTransactionInput(input);
    assert.equal(isValid, true);
    assert.equal(errors.length, 0);
    assert.equal(cleanData.category_id, 5);
    assert.equal(typeof cleanData.amount, 'string');
    assert.equal(cleanData.amount, '150.50');
    assert.equal(cleanData.description, 'Grocery shopping');
    assert.equal(cleanData.transaction_date, '2026-11-04');
  });

  await t.test('validateTransactionInput: accepts integer amount and formats to 2 decimal places', () => {
    const input = { category_id: 1, amount: 12, transaction_date: '2026-11-04' };
    const { isValid, cleanData } = validateTransactionInput(input);
    assert.equal(isValid, true);
    assert.equal(cleanData.amount, '12.00');
  });

  await t.test('validateTransactionInput: accepts 1 decimal place and formats to 2 decimal places', () => {
    const input = { category_id: 1, amount: '12.3', transaction_date: '2026-11-04' };
    const { isValid, cleanData } = validateTransactionInput(input);
    assert.equal(isValid, true);
    assert.equal(cleanData.amount, '12.30');
  });

  await t.test('validateTransactionInput: accepts exact 2 decimal places', () => {
    const input = { category_id: 1, amount: '12.30', transaction_date: '2026-11-04' };
    const { isValid, cleanData } = validateTransactionInput(input);
    assert.equal(isValid, true);
    assert.equal(cleanData.amount, '12.30');
  });

  await t.test('validateTransactionInput: rejects amounts with more than two decimal places (e.g. 12.345)', () => {
    const input = { category_id: 1, amount: 12.345, transaction_date: '2026-11-04' };
    const { isValid, errors } = validateTransactionInput(input);
    assert.equal(isValid, false);
    assert.ok(errors.some((e) => e.includes('more than two decimal places')));
  });

  await t.test('validateTransactionInput: accepts max boundary amount 9999999999.99', () => {
    const input = { category_id: 1, amount: '9999999999.99', transaction_date: '2026-11-04' };
    const { isValid, cleanData } = validateTransactionInput(input);
    assert.equal(isValid, true);
    assert.equal(cleanData.amount, '9999999999.99');
  });

  await t.test('validateTransactionInput: rejects amounts exceeding 9999999999.99', () => {
    const input = { category_id: 1, amount: '10000000000.00', transaction_date: '2026-11-04' };
    const { isValid, errors } = validateTransactionInput(input);
    assert.equal(isValid, false);
    assert.ok(errors.some((e) => e.includes('exceeds maximum supported value')));
  });

  await t.test('validateTransactionInput: rejects zero or negative amounts', () => {
    const zeroRes = validateTransactionInput({ category_id: 1, amount: '0', transaction_date: '2026-11-04' });
    assert.equal(zeroRes.isValid, false);
    assert.ok(zeroRes.errors.some((e) => e.includes('greater than zero')));

    const zeroDotRes = validateTransactionInput({ category_id: 1, amount: '0.00', transaction_date: '2026-11-04' });
    assert.equal(zeroDotRes.isValid, false);
    assert.ok(zeroDotRes.errors.some((e) => e.includes('greater than zero')));

    const negRes = validateTransactionInput({ category_id: 1, amount: -45, transaction_date: '2026-11-04' });
    assert.equal(negRes.isValid, false);
  });

  await t.test('validateTransactionInput: rejects missing category_id', () => {
    const input = { amount: 100, transaction_date: '2026-11-04' };
    const { isValid, errors } = validateTransactionInput(input);
    assert.equal(isValid, false);
    assert.ok(errors.some((e) => e.includes('category_id is required')));
  });

  await t.test('validateTransactionInput: rejects non-numeric amount', () => {
    const badRes = validateTransactionInput({ category_id: 1, amount: 'abc', transaction_date: '2026-11-04' });
    assert.equal(badRes.isValid, false);
    assert.ok(badRes.errors.some((e) => e.includes('numeric value')));
  });

  await t.test('validateTransactionInput: description handling (omitted vs null vs empty vs >255)', () => {
    // 1. Omitted description
    const resOmitted = validateTransactionInput({ category_id: 1, amount: '10.00', transaction_date: '2026-11-04' });
    assert.equal(resOmitted.isValid, true);
    assert.equal('description' in resOmitted.cleanData, false);

    // 2. Explicit null
    const resNull = validateTransactionInput({ category_id: 1, amount: '10.00', transaction_date: '2026-11-04', description: null });
    assert.equal(resNull.isValid, true);
    assert.equal(resNull.cleanData.description, null);

    // 3. Explicit empty string
    const resEmpty = validateTransactionInput({ category_id: 1, amount: '10.00', transaction_date: '2026-11-04', description: '' });
    assert.equal(resEmpty.isValid, true);
    assert.equal(resEmpty.cleanData.description, null);

    // 4. Exceeding 255 chars
    const longDesc = 'a'.repeat(256);
    const resLong = validateTransactionInput({ category_id: 1, amount: '10.00', transaction_date: '2026-11-04', description: longDesc });
    assert.equal(resLong.isValid, false);
    assert.ok(resLong.errors.some((e) => e.includes('cannot exceed 255 characters')));
  });

  await t.test('validateTransactionInput: rejects invalid date formats', () => {
    const badDate1 = validateTransactionInput({ category_id: 1, amount: 10, transaction_date: '04-11-2026' });
    assert.equal(badDate1.isValid, false);
    assert.ok(badDate1.errors.some((e) => e.includes('YYYY-MM-DD')));

    const badDate2 = validateTransactionInput({ category_id: 1, amount: 10, transaction_date: '2026-02-31' });
    assert.equal(badDate2.isValid, false);
    assert.ok(badDate2.errors.some((e) => e.includes('valid calendar date')));
  });

  await t.test('validateTransactionFilters: accepts valid filters', () => {
    const query = {
      type: 'expense',
      category_id: '4',
      start_date: '2026-01-01',
      end_date: '2026-12-31'
    };
    const { isValid, errors, cleanFilters } = validateTransactionFilters(query);
    assert.equal(isValid, true);
    assert.equal(errors.length, 0);
    assert.equal(cleanFilters.type, 'EXPENSE');
    assert.equal(cleanFilters.category_id, 4);
    assert.equal(cleanFilters.start_date, '2026-01-01');
    assert.equal(cleanFilters.end_date, '2026-12-31');
  });

  await t.test('validateTransactionFilters: rejects invalid type filter', () => {
    const { isValid, errors } = validateTransactionFilters({ type: 'TRANSFER' });
    assert.equal(isValid, false);
    assert.ok(errors.some((e) => e.includes('either INCOME or EXPENSE')));
  });

  await t.test('validateTransactionFilters: rejects start_date > end_date', () => {
    const { isValid, errors } = validateTransactionFilters({
      start_date: '2026-12-31',
      end_date: '2026-01-01'
    });
    assert.equal(isValid, false);
    assert.ok(errors.some((e) => e.includes('start_date cannot be later than end_date')));
  });
});
