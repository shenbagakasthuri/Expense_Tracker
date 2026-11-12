import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../src/app.js';
import pool from '../src/config/db.js';

test('Category API Endpoints', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/categories`;

  const secret = process.env.JWT_SECRET || 'test_jwt_secret_with_32_characters_minimum!';

  await t.test('GET /api/categories rejects unauthenticated request', async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 401);
  });

  await t.test('GET /api/categories rejects invalid token', async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer bad.token.here' }
    });
    assert.equal(res.status, 401);
  });

  server.close();
});
