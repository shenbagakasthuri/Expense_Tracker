import dotenv from 'dotenv';
import { checkEnvOrExit } from './utils/validateEnv.js';

// 1. Load environment variables first
dotenv.config();

// 2. Validate required environment variables before initializing Express
checkEnvOrExit();

// 3. Dynamically import app so that all sub-modules evaluate with validated environment variables
const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 5001;

// 4. Start persistent HTTP server and retain server instance
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful termination
const gracefulShutdown = () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
