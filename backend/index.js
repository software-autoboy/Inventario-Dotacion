const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// RUTA DE PRUEBA DE BASE DE DATOS
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ 
      success: true, 
      message: "Conexión con Aiven EXITOSA", 
      data: rows 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error conectando a la base de datos", 
      error: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 Backend de Inventario funcionando');
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Credenciales inválidas' });
});

app.get('/categorias', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categorias');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message, detail: 'Error en DB' });
  }
});

app.get('/articulos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT a.*, c.nombre as categoria_nombre FROM articulos a LEFT JOIN categorias c ON a.categoria_id = c.id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/empleados', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/movimientos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT m.*, a.nombre as articulo_nombre, e.nombre_completo as empleado_nombre FROM movimientos m JOIN articulos a ON m.articulo_id = a.id LEFT JOIN empleados e ON m.empleado_id = e.id ORDER BY m.fecha DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para crear movimientos (POST)
app.post('/movimientos', authenticateToken, async (req, res) => {
  let { articulo_id, empleado_id, tipo, cantidad, observaciones } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('INSERT INTO movimientos (articulo_id, empleado_id, tipo, cantidad, observaciones) VALUES (?, ?, ?, ?, ?)', [articulo_id, empleado_id, tipo, cantidad, observaciones]);
    await connection.commit();
    res.status(201).json({ message: 'Movimiento registrado' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});

module.exports = app;
