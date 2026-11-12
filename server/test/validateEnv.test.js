import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../src/utils/validateEnv.js';

test('Environment Variable Validation Tests', async (t) => {
  const validBaseEnv = {
    PORT: '5001',
    DB_HOST: 'localhost',
    DB_USER: 'root',
    DB_PASSWORD: '',
    DB_NAME: 'expense_tracker',
    DB_PORT: '3306',
    JWT_SECRET: 'this_is_a_very_secure_jwt_secret_with_32_chars_or_more'
  };

  await t.test('Accepts valid environment configuration', () => {
    const result = validateEnv(validBaseEnv);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
  });

  await t.test('Accepts valid environment configuration when DB_PASSWORD is empty', () => {
    const env = { ...validBaseEnv, DB_PASSWORD: '' };
    const result = validateEnv(env);
    assert.equal(result.isValid, true);
  });

  await t.test('Fails when JWT_SECRET is completely missing', () => {
    const env = { ...validBaseEnv };
    delete env.JWT_SECRET;

    const result = validateEnv(env);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((err) => err.includes('Missing required environment variable: JWT_SECRET')));
  });

  await t.test('Fails when JWT_SECRET is an empty or whitespace string', () => {
    const env = { ...validBaseEnv, JWT_SECRET: '   ' };

    const result = validateEnv(env);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((err) => err.includes('Missing required environment variable: JWT_SECRET')));
  });

  await t.test('Fails when JWT_SECRET is shorter than 32 characters', () => {
    const env = { ...validBaseEnv, JWT_SECRET: 'short_secret_under_32_chars' };

    const result = validateEnv(env);
    assert.equal(result.isValid, false);
    assert.ok(
      result.errors.some((err) =>
        err.includes('JWT_SECRET must be at least 32 characters long')
      )
    );
  });

  await t.test('Fails when DB_HOST is missing or empty', () => {
    const env = { ...validBaseEnv };
    delete env.DB_HOST;

    const result = validateEnv(env);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((err) => err.includes('Missing required environment variable: DB_HOST')));
  });

  await t.test('Fails when DB_USER is missing or empty', () => {
    const env = { ...validBaseEnv, DB_USER: '' };

    const result = validateEnv(env);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((err) => err.includes('Missing required environment variable: DB_USER')));
  });

  await t.test('Fails when DB_NAME is missing or empty', () => {
    const env = { ...validBaseEnv };
    delete env.DB_NAME;

    const result = validateEnv(env);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((err) => err.includes('Missing required environment variable: DB_NAME')));
  });

  await t.test('Reports multiple missing variables cleanly without exposing values', () => {
    const emptyEnv = {};
    const result = validateEnv(emptyEnv);

    assert.equal(result.isValid, false);
    assert.ok(result.errors.length >= 4);
    assert.ok(result.errors.some((e) => e.includes('JWT_SECRET')));
    assert.ok(result.errors.some((e) => e.includes('DB_HOST')));
    assert.ok(result.errors.some((e) => e.includes('DB_USER')));
    assert.ok(result.errors.some((e) => e.includes('DB_NAME')));
  });
});
