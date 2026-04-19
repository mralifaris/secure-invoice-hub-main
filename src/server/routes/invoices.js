const express = require('express');
const router = express.Router();
const { Invoice, Transaction } = require('../models');

// GET all invoices
// ?userId=        → invoices created by this user (sender)
// ?receiverEmail= → invoices received by this email
// both together   → union of sent + received
router.get('/', async (req, res) => {
  try {
    const { userId, receiverEmail } = req.query;

    let filter = {};

    if (userId && receiverEmail) {
      filter = {
        $or: [
          { createdBy: userId },
          { 'receiver.email': { $regex: new RegExp(`^${receiverEmail}$`, 'i') } },
        ],
      };
    } else if (userId) {
      filter = { createdBy: userId };
    } else if (receiverEmail) {
      filter = { 'receiver.email': { $regex: new RegExp(`^${receiverEmail}$`, 'i') } };
    }

    const invoices = await Invoice.find(filter, '-__v').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET invoice by id
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id }, '-__v');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create invoice
router.post('/', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();

    await Transaction.create({
      invoiceId: invoice.id,
      userId: invoice.createdBy,
      type: 'created',
      amount: invoice.total,
      note: `Invoice ${invoice.invoiceNumber} created`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, userId } = req.body;
    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const previousStatus = invoice.status;
    invoice.status = status;
    invoice.updatedAt = new Date().toISOString();
    await invoice.save();

    if (userId) {
      await Transaction.create({
        invoiceId: invoice.id,
        userId,
        type: 'status_change',
        previousStatus,
        newStatus: status,
        note: `Status: ${previousStatus} → ${status}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE invoice
router.delete('/:id', async (req, res) => {
  try {
    const result = await Invoice.findOneAndDelete({ id: req.params.id });
    if (!result) return res.status(404).json({ error: 'Invoice not found' });

    if (req.query.userId) {
      await Transaction.create({
        invoiceId: req.params.id,
        userId: req.query.userId,
        type: 'deleted',
        note: `Invoice ${result.invoiceNumber} deleted`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET invoice stats
router.get('/stats/summary', async (req, res) => {
  try {
    const invoices = await Invoice.find({});
    res.json({
      total: invoices.length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      pending: invoices.filter((i) => i.status === 'pending').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
      totalRevenue: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0),
      pendingRevenue: invoices
        .filter((i) => i.status === 'pending' || i.status === 'overdue')
        .reduce((s, i) => s + i.total, 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;