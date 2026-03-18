const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CONFIGURACIÓN DE CORS ---
// Esto permite que tu frontend en Vercel se comunique con este backend
app.use(cors({
  origin: '*', // Permite todos los orígenes temporalmente para debugear, o pon tu URL de Vercel del frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ruta de prueba para confirmar que el backend funciona
app.get('/', (req, res) => {
  res.send('🚀 Backend de Inventario Autoboy funcionando correctamente');
});

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Usar variables de entorno para mayor seguridad
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  
  res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
});

// --- CATEGORÍAS ---
app.get('/api/categorias', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categorias', authenticateToken, async (req, res) => {
  const { nombre } = req.body;
  try {
    await db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    res.status(201).json({ message: 'Categoría creada con éxito' });
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
      ORDER BY a.nombre ASC
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
    res.status(201).json({ message: 'Artículo creado con éxito' });
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
    const [rows] = await db.query('SELECT * FROM empleados ORDER BY nombre_completo ASC');
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
    res.status(201).json({ message: 'Empleado creado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MOVIMIENTOS ---
app.post('/api/movimientos', authenticateToken, async (req, res) => {
  let { articulo_id, empleado_id, tipo, cantidad, observaciones } = req.body;
  articulo_id = Number(articulo_id);
  cantidad = Number(cantidad);

  if (tipo === 'ENTRADA') {
    empleado_id = null;
  } else if (!empleado_id) {
    return res.status(400).json({ error: 'empleado_id es obligatorio para este tipo de movimiento' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (tipo === 'ENTREGA') {
      const [artRows] = await connection.query('SELECT stock_actual, nombre FROM articulos WHERE id = ?', [articulo_id]);
      if (artRows.length === 0) throw new Error('Artículo no encontrado');
      if (artRows[0].stock_actual < cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente para "${artRows[0].nombre}". Disponible: ${artRows[0].stock_actual}` 
        });
      }
    }

    await connection.query(
      'INSERT INTO movimientos (articulo_id, empleado_id, tipo, cantidad, observaciones) VALUES (?, ?, ?, ?, ?)',
      [articulo_id, empleado_id, tipo, cantidad, observaciones]
    );

    let stockUpdateQuery = '';
    if (tipo === 'ENTREGA') {
      stockUpdateQuery = 'UPDATE articulos SET stock_actual = stock_actual - ? WHERE id = ?';
    } else {
      stockUpdateQuery = 'UPDATE articulos SET stock_actual = stock_actual + ? WHERE id = ?';
    }

    await connection.query(stockUpdateQuery, [cantidad, articulo_id]);
    await connection.commit();
    res.status(201).json({ message: 'Movimiento registrado correctamente' });
  } catch (error) {
    await connection.rollback();
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

// Para que funcione en local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor local corriendo en puerto ${PORT}`);
  });
}

module.exports = app;