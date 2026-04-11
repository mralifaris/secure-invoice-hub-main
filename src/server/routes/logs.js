// const express = require('express');
// const router = express.Router();
// const { Log } = require('../models');

// // GET all logs (optional ?userId= filter)
// router.get('/', async (req, res) => {
//   try {
//     const filter = req.query.userId ? { userId: req.query.userId } : {};
//     const logs = await Log.find(filter, '-__v').sort({ timestamp: -1 });
//     res.json(logs);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // POST create log
// router.post('/', async (req, res) => {
//   try {
//     const log = await Log.create(req.body);
//     res.status(201).json(log);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;