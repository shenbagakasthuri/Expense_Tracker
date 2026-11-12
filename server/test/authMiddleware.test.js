import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticate } from '../src/middleware/authMiddleware.js';

test('Auth Middleware Tests', async (t) => {
  const secret = 'test_jwt_secret_key_12345';
  process.env.JWT_SECRET = secret;

  await t.test('Rejects request without Authorization header', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = { headers: {} };
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) {
            jsonBody = body;
          }
        };
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authenticate(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(nextCalled, false);
    assert.match(jsonBody.message, /No token provided/i);
  });

  await t.test('Rejects malformed Authorization header (missing Bearer prefix)', () => {
    let statusCode = null;
    const req = { headers: { authorization: 'Basic 123456' } };
    const res = {
      status(code) {
        statusCode = code;
        return { json() {} };
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authenticate(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(nextCalled, false);
  });

  await t.test('Rejects invalid JWT token signature', () => {
    let statusCode = null;
    const req = { headers: { authorization: 'Bearer invalid.token.payload' } };
    const res = {
      status(code) {
        statusCode = code;
        return { json() {} };
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authenticate(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(nextCalled, false);
  });

  await t.test('Rejects expired JWT token with explicit expiration message', () => {
    let statusCode = null;
    let jsonBody = null;
    // Expired token (issued in the past with 1ms expiry)
    const expiredToken = jwt.sign({ sub: 10 }, secret, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) {
            jsonBody = body;
          }
        };
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authenticate(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(nextCalled, false);
    assert.match(jsonBody.message, /expired/i);
  });

  await t.test('Accepts valid JWT token and attaches user id to req.user', () => {
    const validToken = jwt.sign({ sub: 42, email: 'user42@example.com' }, secret, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authenticate(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 42);
  });
});
