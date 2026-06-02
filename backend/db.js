const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  // Prueba con DB_PASS o DB_PASSWORD por si hubo un error al nombrarla
  password: process.env.DB_PASS || process.env.DB_PASSWORD, 
  database: process.env.DB_NAME || 'defaultdb',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Solo usar SSL si no es localhost o si se solicita explícitamente
  ssl: (process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost') || process.env.DB_SSL === 'true' 
    ? { rejectUnauthorized: false } 
    : null
});

module.exports = pool;
