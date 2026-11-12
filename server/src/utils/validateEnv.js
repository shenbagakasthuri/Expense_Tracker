/**
 * Validates environment variables required for server startup.
 * Ensures the system does not start up with missing or insecure configuration.
 *
 * Requirements:
 * - JWT_SECRET must exist and be at least 32 characters long.
 * - DB_HOST, DB_USER, DB_NAME must exist and not be empty strings.
 * - DB_PASSWORD may be empty (if local MySQL configuration permits it).
 *
 * @param {NodeJS.ProcessEnv} env - Environment variables dictionary
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateEnv(env = process.env) {
  const errors = [];

  // 1. JWT_SECRET Validation
  if (!env.JWT_SECRET || typeof env.JWT_SECRET !== 'string' || env.JWT_SECRET.trim() === '') {
    errors.push('Missing required environment variable: JWT_SECRET');
  } else if (env.JWT_SECRET.length < 32) {
    errors.push('Invalid environment variable: JWT_SECRET must be at least 32 characters long for security');
  }

  // 2. Required Database Environment Variables
  const requiredDbVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  for (const varName of requiredDbVars) {
    if (!env[varName] || typeof env[varName] !== 'string' || env[varName].trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // DB_PASSWORD is intentionally optional / allowed to be empty string for local dev setups

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Enforces environment variable validation.
 * If invalid, prints safe error messages (without exposing secrets) and exits the process.
 *
 * @param {NodeJS.ProcessEnv} env
 */
export function checkEnvOrExit(env = process.env) {
  const { isValid, errors } = validateEnv(env);

  if (!isValid) {
    console.error('\n[FATAL] Startup configuration error:');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('\nPlease verify your server .env file before starting the application.\n');
    process.exit(1);
  }
}
