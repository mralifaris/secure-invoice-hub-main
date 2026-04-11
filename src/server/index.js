/**
 * Express Backend Server
 * Connects React frontend to MongoDB localhost:27017
 * Runs on localhost:3001
 */

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const usersRouter = require('./routes/users');
const invoicesRouter = require('./routes/invoices');
const transactionsRouter = require('./routes/transactions');
// const logsRouter = require('./routes/logs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: '*' })); // Vite dev server
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', usersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/transactions', transactionsRouter);
// app.use('/api/logs', logsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'mongodb', port: PORT });
});

app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`);
});