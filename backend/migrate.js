const db = require('./db');

async function migrate() {
  try {
    console.log('--- Iniciando Migración ---');
    
    // 1. Agregar columna valor si no existe
    console.log('Agregando columna valor a articulos...');
    try {
      await db.query('ALTER TABLE articulos ADD COLUMN valor INT DEFAULT 0');
      console.log('Columna valor agregada con éxito.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('La columna valor ya existe.');
      } else {
        throw err;
      }
    }

    // 2. Actualizar categorías
    console.log('Actualizando categorías...');
    await db.query("UPDATE categorias SET nombre = 'Dotaciones' WHERE nombre = 'Calzado'");
    await db.query("UPDATE categorias SET nombre = 'Aseo' WHERE nombre = 'Protección Personal'");
    await db.query("UPDATE categorias SET nombre = 'Papelería' WHERE nombre = 'Ropa de Trabajo'");
    
    // 3. Asegurar que las categorías existan si no estaban (por si acaso)
    const [rows] = await db.query('SELECT nombre FROM categorias');
    const existing = rows.map(r => r.nombre);
    
    if (!existing.includes('Dotaciones')) await db.query("INSERT INTO categorias (nombre) VALUES ('Dotaciones')");
    if (!existing.includes('Aseo')) await db.query("INSERT INTO categorias (nombre) VALUES ('Aseo')");
    if (!existing.includes('Papelería')) await db.query("INSERT INTO categorias (nombre) VALUES ('Papelería')");

    console.log('Categorías actualizadas correctamente.');
    console.log('--- Migración Finalizada con Éxito ---');
    process.exit(0);
  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

migrate();
