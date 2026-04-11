const mongoose = require('mongoose');

// ─── User ─────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'business', 'user'], default: 'business' },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// ─── Invoice ──────────────────────────────────────────────────────────────────
const InvoiceItemSchema = new mongoose.Schema({
  id: String,
  description: String,
  quantity: Number,
  unitPrice: Number,
  total: Number,
});

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Firebase doc ID
  invoiceNumber: { type: String, required: true, unique: true },
  sender: {
    name: String,
    email: String,
    address: String,
  },
  receiver: {
    name: String,
    email: String,
    address: String,
  },
  items: [InvoiceItemSchema],
  subtotal: Number,
  tax: Number,
  total: Number,
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  dueDate: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  createdBy: String, // Firebase UID
  blockchainHash: String,
  aiAnalysis: {
    fraudRisk: { type: String, enum: ['Low', 'Medium', 'High'] },
    confidence: Number,
    reason: String,
  },
});

// ─── Transaction ──────────────────────────────────────────────────────────────
const TransactionSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true },
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: ['created', 'updated', 'status_change', 'deleted', 'payment'],
  },
  amount: Number,
  previousStatus: String,
  newStatus: String,
  note: String,
  timestamp: { type: String, default: () => new Date().toISOString() },
});

// ─── Log ──────────────────────────────────────────────────────────────────────
const LogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  details: String,
  timestamp: { type: String, default: () => new Date().toISOString() },
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Invoice: mongoose.model('Invoice', InvoiceSchema),
  Transaction: mongoose.model('Transaction', TransactionSchema),
  Log: mongoose.model('Log', LogSchema),
};