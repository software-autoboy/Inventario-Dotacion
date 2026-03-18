const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ruta de prueba para confirmar que el backend funciona
app.get('/', (req, res) => {
  res.send('🚀 Backend de Inventario funcionando correctamente');
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Credenciales inválidas' });
});

// --- CATEGORÍAS ---
app.get('/categorias', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categorias');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

app.post('/categorias', authenticateToken, async (req, res) => {
  const { nombre } = req.body;
  try {
    await db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    res.status(201).json({ message: 'Categoría creada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

// --- ARTÍCULOS ---
app.get('/articulos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, c.nombre as categoria_nombre 
      FROM articulos a 
      LEFT JOIN categorias c ON a.categoria_id = c.id
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

app.post('/articulos', authenticateToken, async (req, res) => {
  const { nombre, descripcion, categoria_id, stock_actual, talla } = req.body;
  try {
    await db.query(
      'INSERT INTO articulos (nombre, descripcion, categoria_id, stock_actual, talla) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, categoria_id, stock_actual || 0, talla]
    );
    res.status(201).json({ message: 'Artículo creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

app.put('/articulos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, categoria_id, stock_actual, talla } = req.body;
  try {
    await db.query(
      'UPDATE articulos SET nombre=?, descripcion=?, categoria_id=?, stock_actual=?, talla=? WHERE id=?',
      [nombre, descripcion, categoria_id, stock_actual, talla, id]
    );
    res.status(200).json({ message: 'Artículo actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

app.delete('/articulos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM articulos WHERE id=?', [id]);
    res.status(200).json({ message: 'Artículo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

// --- EMPLEADOS ---
app.get('/empleados', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

app.post('/empleados', authenticateToken, async (req, res) => {
  const { documento, nombre_completo, cargo, area } = req.body;
  try {
    await db.query(
      'INSERT INTO empleados (documento, nombre_completo, cargo, area) VALUES (?, ?, ?, ?)',
      [documento, nombre_completo, cargo, area]
    );
    res.status(201).json({ message: 'Empleado creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

// --- MOVIMIENTOS ---
app.post('/movimientos', authenticateToken, async (req, res) => {
  let { articulo_id, empleado_id, tipo, cantidad, observaciones } = req.body;
  articulo_id = Number(articulo_id);
  cantidad = Number(cantidad);

  if (tipo === 'ENTRADA') {
    empleado_id = null;
  } else if (!empleado_id) {
    return res.status(400).json({ error: 'empleado_id es obligatorio' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (tipo === 'ENTREGA') {
      const [artRows] = await connection.query('SELECT stock_actual, nombre FROM articulos WHERE id = ?', [articulo_id]);
      if (artRows.length === 0) throw new Error('Artículo no encontrado');
      if (artRows[0].stock_actual < cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para ${artRows[0].nombre}` });
      }
      await connection.query('UPDATE articulos SET stock_actual = stock_actual - ? WHERE id = ?', [cantidad, articulo_id]);
    } else {
      await connection.query('UPDATE articulos SET stock_actual = stock_actual + ? WHERE id = ?', [cantidad, articulo_id]);
    }

    await connection.query(
      'INSERT INTO movimientos (articulo_id, empleado_id, tipo, cantidad, observaciones) VALUES (?, ?, ?, ?, ?)',
      [articulo_id, empleado_id, tipo, cantidad, observaciones]
    );

    await connection.commit();
    res.status(201).json({ message: 'Movimiento registrado' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.get('/movimientos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, a.nombre as articulo_nombre, e.nombre_completo as empleado_nombre 
      FROM movimientos m
      JOIN articulos a ON m.articulo_id = a.id
      LEFT JOIN empleados e ON m.empleado_id = e.id
      ORDER BY m.fecha DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: 'Error en la base de datos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
