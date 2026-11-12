import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../src/middleware/errorHandler.js';

test('Centralized Error Handler Middleware Tests', async (t) => {
  const createMockRes = () => {
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
    return res;
  };

  await t.test('Maps ER_DUP_ENTRY to HTTP 409', () => {
    const res = createMockRes();
    const err = { code: 'ER_DUP_ENTRY', errno: 1062, message: 'Duplicate entry for key' };
    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /duplicate record/i);
  });

  await t.test('Maps MySQL errno 1062 to HTTP 409', () => {
    const res = createMockRes();
    const err = { errno: 1062, message: 'Duplicate entry' };
    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
  });

  await t.test('Maps ER_NO_REFERENCED_ROW_2 (foreign key error) to HTTP 400', () => {
    const res = createMockRes();
    const err = { code: 'ER_NO_REFERENCED_ROW_2', errno: 1452, message: 'Cannot add or update a child row' };
    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid reference/i);
  });

  await t.test('Maps ER_CHECK_CONSTRAINT_VIOLATED to HTTP 400', () => {
    const res = createMockRes();
    const err = { code: 'ER_CHECK_CONSTRAINT_VIOLATED', errno: 3819, message: 'Check constraint violated' };
    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /constraint was violated/i);
  });

  await t.test('Preserves explicit application error statusCode', () => {
    const res = createMockRes();
    const err = { statusCode: 403, message: 'Forbidden custom error' };
    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Forbidden custom error');
  });

  await t.test('Falls back to HTTP 500 for unexpected errors and does not expose internal messages', () => {
    const res = createMockRes();
    const err = new Error('Sensitive database credentials leak or stack trace');
    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Internal server error occurred.');
  });
});
