const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');

// Decide qué archivo .env cargar
const envFile = fs.existsSync('.env.local')
  ? '.env.local'
  : process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

dotenv.config({ path: envFile });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

module.exports = pool;