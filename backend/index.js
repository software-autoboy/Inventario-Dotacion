const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Backend de Inventario Autoboy funcionando');
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

// --- CATEGORÍAS ---
app.get('/categorias', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/categorias', authenticateToken, async (req, res) => {
  const { nombre } = req.body;
  try {
    await db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    res.status(201).json({ message: 'Categoría creada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ARTÍCULOS ---
app.get('/articulos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT a.*, c.nombre as categoria_nombre FROM articulos a LEFT JOIN categorias c ON a.categoria_id = c.id ORDER BY a.nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/articulos', authenticateToken, async (req, res) => {
  const { nombre, descripcion, categoria_id, stock_actual, talla, valor } = req.body;
  try {
    await db.query('INSERT INTO articulos (nombre, descripcion, categoria_id, stock_actual, talla, valor) VALUES (?, ?, ?, ?, ?, ?)', [nombre, descripcion, categoria_id, stock_actual || 0, talla, valor || 0]);
    res.status(201).json({ message: 'Artículo creado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/articulos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, categoria_id, stock_actual, talla, valor } = req.body;
  try {
    await db.query('UPDATE articulos SET nombre=?, descripcion=?, categoria_id=?, stock_actual=?, talla=?, valor=? WHERE id=?', [nombre, descripcion, categoria_id, stock_actual, talla, valor || 0, id]);
    res.status(200).json({ message: 'Artículo actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/articulos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM articulos WHERE id=?', [id]);
    res.status(200).json({ message: 'Artículo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- EMPLEADOS ---
app.get('/empleados', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados ORDER BY nombre_completo ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/empleados', authenticateToken, async (req, res) => {
  const { documento, nombre_completo, cargo, area } = req.body;
  try {
    await db.query('INSERT INTO empleados (documento, nombre_completo, cargo, area) VALUES (?, ?, ?, ?)', [documento, nombre_completo, cargo, area]);
    res.status(201).json({ message: 'Empleado creado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/empleados/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Primero verificamos si el empleado tiene movimientos asociados
    const [movs] = await db.query('SELECT id FROM movimientos WHERE empleado_id = ? LIMIT 1', [id]);
    if (movs.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un empleado con movimientos registrados. Debe eliminar primero sus movimientos o marcarlos como huérfanos.' });
    }
    await db.query('DELETE FROM empleados WHERE id = ?', [id]);
    res.status(200).json({ message: 'Empleado eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MOVIMIENTOS ---
app.get('/movimientos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, a.nombre as articulo_nombre, a.valor as articulo_valor, e.nombre_completo as empleado_nombre 
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

app.post('/movimientos', authenticateToken, async (req, res) => {
  let { 
    articulo_id, empleado_id, tipo, cantidad, observaciones, 
    codigo, sucursal, numero_factura, tercero, estado, valor_total 
  } = req.body;
  
  articulo_id = Number(articulo_id);
  cantidad = Number(cantidad);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Obtener datos del artículo para el stock y el valor
    const [artRows] = await connection.query('SELECT stock_actual, nombre, valor FROM articulos WHERE id = ?', [articulo_id]);
    if (artRows.length === 0) throw new Error('Artículo no encontrado');
    
    const valorUnitario = artRows[0].valor || 0;
    const totalCalculado = valor_total || (valorUnitario * cantidad);

    // 2. Validar stock para salidas/entregas
    if (tipo === 'ENTREGA' || tipo === 'SALIDA') {
      if (artRows[0].stock_actual < cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para ${artRows[0].nombre}` });
      }
      await connection.query('UPDATE articulos SET stock_actual = stock_actual - ? WHERE id = ?', [cantidad, articulo_id]);
    } else {
      await connection.query('UPDATE articulos SET stock_actual = stock_actual + ? WHERE id = ?', [cantidad, articulo_id]);
    }

    // 3. Insertar movimiento con nuevos campos
    const query = `
      INSERT INTO movimientos 
      (articulo_id, empleado_id, tipo, cantidad, observaciones, codigo, sucursal, numero_factura, tercero, estado, valor_total) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      articulo_id, empleado_id || null, tipo, cantidad, observaciones, 
      codigo || null, sucursal || null, numero_factura || null, tercero || null, estado || null, totalCalculado
    ];

    await connection.query(query, params);
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
