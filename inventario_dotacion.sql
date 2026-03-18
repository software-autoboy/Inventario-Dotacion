 -- phpMyAdmin SQL Dump
  -- version 5.2.1
  -- https://www.phpmyadmin.net/
  --
  -- Servidor: 127.0.0.1
  -- Tiempo de generación: 18-03-2026 a las 14:19:40
  -- Versión del servidor: 10.4.32-MariaDB
  -- Versión de PHP: 8.0.30

  SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
  START TRANSACTION;
  SET time_zone = "+00:00";


  /*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
  /*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
  /*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
  /*!40101 SET NAMES utf8mb4 */;

  --
  -- Base de datos: `inventario_dotacion`
  --

  -- --------------------------------------------------------

  --
  -- Estructura de tabla para la tabla `articulos`
  --

  CREATE TABLE `articulos` (
    `id` int(11) NOT NULL,
    `nombre` varchar(100) NOT NULL,
    `descripcion` text DEFAULT NULL,
    `categoria_id` int(11) DEFAULT NULL,
    `stock_actual` int(11) DEFAULT 0,
    `talla` varchar(10) DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

  --
  -- Volcado de datos para la tabla `articulos`
  --

  INSERT INTO `articulos` (`id`, `nombre`, `descripcion`, `categoria_id`, `stock_actual`, `talla`) VALUES
  (1, 'Patalon azul', '', 2, 1, 'm'),
  (2, 'tacones ', 'punta de acero para las cosas', 1, 1, '28'),
  (3, 'chaquetas Auto boy', 'chauqeas impermeables, nuevas ', 2, 7, 'xl');

  -- --------------------------------------------------------

  --
  -- Estructura de tabla para la tabla `categorias`
  --

  CREATE TABLE `categorias` (
    `id` int(11) NOT NULL,
    `nombre` varchar(100) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

  --
  -- Volcado de datos para la tabla `categorias`
  --

  INSERT INTO `categorias` (`id`, `nombre`) VALUES
  (1, 'Calzado'),
  (3, 'Protección Personal'),
  (2, 'Ropa de Trabajo');

  -- --------------------------------------------------------

  --
  -- Estructura de tabla para la tabla `empleados`
  --

  CREATE TABLE `empleados` (
    `id` int(11) NOT NULL,
    `documento` varchar(20) NOT NULL,
    `nombre_completo` varchar(150) NOT NULL,
    `cargo` varchar(100) DEFAULT NULL,
    `area` varchar(100) DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

  --
  -- Volcado de datos para la tabla `empleados`
  --

  INSERT INTO `empleados` (`id`, `documento`, `nombre_completo`, `cargo`, `area`) VALUES
  (1, '121323', 'sdvsfgvs', 'fdsdfv', 'sdvdfv'),
  (2, '28384384', 'JUAN PEREZ', 'CONDUICTOR', 'contabilidad');

  -- --------------------------------------------------------

  --
  -- Estructura de tabla para la tabla `movimientos`
  --

  CREATE TABLE `movimientos` (
    `id` int(11) NOT NULL,
    `articulo_id` int(11) DEFAULT NULL,
    `empleado_id` int(11) DEFAULT NULL,
    `tipo` enum('ENTRADA','ENTREGA','DEVOLUCION') NOT NULL,
    `cantidad` int(11) NOT NULL,
    `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
    `observaciones` text DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

  --
  -- Volcado de datos para la tabla `movimientos`
  --

  INSERT INTO `movimientos` (`id`, `articulo_id`, `empleado_id`, `tipo`, `cantidad`, `fecha`, `observaciones`) VALUES
  (4, 1, 1, 'ENTREGA', 1, '2026-03-16 17:11:42', 'ergrtghr'),
  (5, 3, 2, 'ENTREGA', 1, '2026-03-16 19:36:35', 'se le hace entrega de una chaqueta\n'),
  (6, 3, 2, 'ENTREGA', 6, '2026-03-16 20:20:50', '');

  --
  -- Índices para tablas volcadas
  --

  --
  -- Indices de la tabla `articulos`
  --
  ALTER TABLE `articulos`
    ADD PRIMARY KEY (`id`),
    ADD KEY `categoria_id` (`categoria_id`);

  --
  -- Indices de la tabla `categorias`
  --
  ALTER TABLE `categorias`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `nombre` (`nombre`);

  --
  -- Indices de la tabla `empleados`
  --
  ALTER TABLE `empleados`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `documento` (`documento`);

  --
  -- Indices de la tabla `movimientos`
  --
  ALTER TABLE `movimientos`
    ADD PRIMARY KEY (`id`),
    ADD KEY `articulo_id` (`articulo_id`),
    ADD KEY `empleado_id` (`empleado_id`);

  --
  -- AUTO_INCREMENT de las tablas volcadas
  --

  --
  -- AUTO_INCREMENT de la tabla `articulos`
  --
  ALTER TABLE `articulos`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

  --
  -- AUTO_INCREMENT de la tabla `categorias`
  --
  ALTER TABLE `categorias`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

  --
  -- AUTO_INCREMENT de la tabla `empleados`
  --
  ALTER TABLE `empleados`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

  --
  -- AUTO_INCREMENT de la tabla `movimientos`
  --
  ALTER TABLE `movimientos`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

  --
  -- Restricciones para tablas volcadas
  --

  --
  -- Filtros para la tabla `articulos`
  --
  ALTER TABLE `articulos`
    ADD CONSTRAINT `articulos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL;

  --
  -- Filtros para la tabla `movimientos`
  --
  ALTER TABLE `movimientos`
    ADD CONSTRAINT `movimientos_ibfk_1` FOREIGN KEY (`articulo_id`) REFERENCES `articulos` (`id`),
    ADD CONSTRAINT `movimientos_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);
  COMMIT;

  /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
  /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
  /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

