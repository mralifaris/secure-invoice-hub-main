// ─── transactions.js ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { Transaction } = require('../models');

// GET all transactions (optional ?invoiceId= or ?userId= filter)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.invoiceId) filter.invoiceId = req.query.invoiceId;
    if (req.query.userId) filter.userId = req.query.userId;
    const txs = await Transaction.find(filter, '-__v').sort({ timestamp: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create transaction manually
router.post('/', async (req, res) => {
  try {
    const tx = await Transaction.create(req.body);
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;