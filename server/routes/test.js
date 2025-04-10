const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() as now');
    res.json({ success: true, now: rows[0].now });
  } catch (err) {
    console.error('Error al conectar con la DB:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;