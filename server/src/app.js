import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174']
}));
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Expense Tracker API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Expense Tracker Backend API is active');
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Transaction Routes
app.use('/api/transactions', transactionRoutes);

// Category Routes
app.use('/api/categories', categoryRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
