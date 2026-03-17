-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS inventario_dotacion;
USE inventario_dotacion;

-- Tabla de Categorías (Camisas, Pantalones, Botas, EPP, etc.)
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de Artículos (Inventario)
CREATE TABLE IF NOT EXISTS articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    stock_actual INT DEFAULT 0,
    talla VARCHAR(10),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabla de Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documento VARCHAR(20) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    cargo VARCHAR(100),
    area VARCHAR(100)
);

-- Tabla de Movimientos (Entradas de stock y Salidas por dotación)
CREATE TABLE IF NOT EXISTS movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    articulo_id INT,
    empleado_id INT NULL, -- NULL si es una entrada de stock general
    tipo ENUM('ENTRADA', 'ENTREGA', 'DEVOLUCION') NOT NULL,
    cantidad INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (articulo_id) REFERENCES articulos(id),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- Insertar algunas categorías de ejemplo
INSERT IGNORE INTO categorias (nombre) VALUES ('Calzado'), ('Ropa de Trabajo'), ('Protección Personal');
