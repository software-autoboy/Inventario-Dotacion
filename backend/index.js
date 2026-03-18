const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ruta de prueba para confirmar que el backend funciona en Vercel
app.get('/', (req, res) => {
  res.send('🚀 Backend de Inventario funcionando correctamente');
});

// Auth Middleware
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

// --- AUTH ROUTES ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Credenciales inválidas' });
});

// --- CATEGORÍAS ---
app.get('/api/categorias', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categorias');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categorias', authenticateToken, async (req, res) => {
  const { nombre } = req.body;
  try {
    await db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    res.status(201).json({ message: 'Categoría creada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ARTÍCULOS ---
app.get('/api/articulos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, c.nombre as categoria_nombre 
      FROM articulos a 
      LEFT JOIN categorias c ON a.categoria_id = c.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articulos', authenticateToken, async (req, res) => {
  const { nombre, descripcion, categoria_id, stock_actual, talla } = req.body;
  try {
    await db.query(
      'INSERT INTO articulos (nombre, descripcion, categoria_id, stock_actual, talla) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, categoria_id, stock_actual || 0, talla]
    );
    res.status(201).json({ message: 'Artículo creado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/articulos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, categoria_id, stock_actual, talla } = req.body;
  try {
    await db.query(
      'UPDATE articulos SET nombre=?, descripcion=?, categoria_id=?, stock_actual=?, talla=? WHERE id=?',
      [nombre, descripcion, categoria_id, stock_actual, talla, id]
    );
    res.status(200).json({ message: 'Artículo actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/articulos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM articulos WHERE id=?', [id]);
    res.status(200).json({ message: 'Artículo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- EMPLEADOS ---
app.get('/api/empleados', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/empleados', authenticateToken, async (req, res) => {
  const { documento, nombre_completo, cargo, area } = req.body;
  try {
    await db.query(
      'INSERT INTO empleados (documento, nombre_completo, cargo, area) VALUES (?, ?, ?, ?)',
      [documento, nombre_completo, cargo, area]
    );
    res.status(201).json({ message: 'Empleado creado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MOVIMIENTOS (Dotación Logic) ---
app.post('/api/movimientos', authenticateToken, async (req, res) => {
  let { articulo_id, empleado_id, tipo, cantidad, observaciones } = req.body;

  // Asegurar tipos numéricos
  articulo_id = Number(articulo_id);
  cantidad = Number(cantidad);

  if (tipo === 'ENTRADA') {
    empleado_id = null;
  } else {
    if (!empleado_id) {
      return res.status(400).json({ error: 'empleado_id es obligatorio para este tipo de movimiento' });
    }
    empleado_id = Number(empleado_id);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verificar stock actual si es una ENTREGA
    if (tipo === 'ENTREGA') {
      const [artRows] = await connection.query('SELECT stock_actual, nombre FROM articulos WHERE id = ?', [articulo_id]);
      if (artRows.length === 0) throw new Error('Artículo no encontrado');
      
      const stockDisponible = artRows[0].stock_actual;
      if (stockDisponible < cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente para "${artRows[0].nombre}". Disponible: ${stockDisponible}, Solicitado: ${cantidad}` 
        });
      }
    }

    // 2. Registrar el Movimiento
    await connection.query(
      'INSERT INTO movimientos (articulo_id, empleado_id, tipo, cantidad, observaciones) VALUES (?, ?, ?, ?, ?)',
      [articulo_id, empleado_id, tipo, cantidad, observaciones]
    );

    // 3. Actualizar stock según el tipo
    let stockUpdateQuery = '';
    if (tipo === 'ENTREGA') {
      stockUpdateQuery = 'UPDATE articulos SET stock_actual = stock_actual - ? WHERE id = ?';
    } else if (tipo === 'ENTRADA' || tipo === 'DEVOLUCION') {
      stockUpdateQuery = 'UPDATE articulos SET stock_actual = stock_actual + ? WHERE id = ?';
    }

    if (stockUpdateQuery) {
      await connection.query(stockUpdateQuery, [cantidad, articulo_id]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Movimiento registrado y stock actualizado' });
  } catch (error) {
    await connection.rollback();
    console.error('Error en /api/movimientos:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/movimientos', authenticateToken, async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
