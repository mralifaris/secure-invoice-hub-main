const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/secure-invoice-hub';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected: localhost:27017/invoice_hub');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };