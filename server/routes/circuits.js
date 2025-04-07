// routes/circuits.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /circuits -> lista de circuitos con id y nombre
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM circuits');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener circuitos:', err);
    res.status(500).send('Error al obtener circuitos');
  }
});

module.exports = router;