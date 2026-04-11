const express = require('express');
const router = express.Router();
const { User, Log } = require('../models');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-__v');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user by uid
router.get('/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid }, '-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create/upsert user (called on register + login)
router.post('/', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.body.uid },
      req.body,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update user role
router.patch('/:uid/role', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { role: req.body.role },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:uid', async (req, res) => {
  try {
    const result = await User.findOneAndDelete({ uid: req.params.uid });
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;