-- Script de Inicialización de la Base de Datos para MySQL Workbench

-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS tecnonova;
USE tecnonova;

-- 2. Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL
);

-- 3. Crear tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at VARCHAR(50) NOT NULL
);

-- 4. Crear tabla de items de la orden
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 5. Insertar productos semilla
INSERT INTO products (id, name, description, price, stock) 
VALUES 
    ('prod-1', 'Laptop Gamer Pro', 'Laptop con procesador i9 y tarjeta RTX 4080', 2500.00, 10),
    ('prod-2', 'Mouse Mecánico Inalámbrico', 'Mouse ergonómico con sensor óptico de 26k DPI', 120.00, 50),
    ('prod-3', 'Teclado Mecánico RGB', 'Teclado hot-swappable con switches lineares', 180.00, 25),
    ('prod-4', 'Monitor Curvo 34"', 'Monitor ultrawide 144Hz 1ms', 600.00, 15)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    price = VALUES(price),
    stock = VALUES(stock);
