// routes/circuit.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /circuit?id=1 -> circuito completo con sectores, mini_sectores y longitud total
router.get('/', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Falta el parámetro ?id=');
  }

  try {
    const [circuitRows] = await pool.query('SELECT * FROM circuits WHERE id = ?', [id]);
    const [miniSectorRows] = await pool.query('SELECT * FROM mini_sectors WHERE circuit_id = ?', [id]);
    const [sectorRows] = await pool.query('SELECT * FROM sectors WHERE circuit_id = ?', [id]);

    const totalLengthCm = miniSectorRows.reduce((sum, ms) => sum + ms.length_cm, 0);
    const totalLengthM = Math.round(totalLengthCm / 100);

    res.json({
      circuit: {
        ...circuitRows[0],
        total_length_m: totalLengthM
      },
      mini_sectors: miniSectorRows,
      sectors: sectorRows.map(sector => ({
        ...sector,
        mini_sector_ids: sector.mini_sector_ids.split(',').map(Number)
      }))
    });
  } catch (err) {
    console.error('Error al obtener circuito:', err);
    res.status(500).send('Error al obtener circuito');
  }
});

module.exports = router;