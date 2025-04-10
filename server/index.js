require('dotenv').config(); // opcional si ya lo hace db.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

const circuitsRouter = require('./routes/circuits');
const circuitRoutes = require('./routes/circuit');
const testRoutes = require('./routes/test');

app.use(cors());
app.use(express.json());

// Montar router para todas las rutas relacionadas con circuitos
app.use('/circuits', circuitsRouter);
app.use('/circuit', circuitRoutes);
app.use('/', testRoutes);

app.listen(port, () => {
  console.log(`✅ Backend running on http://localhost:${port}`);
});