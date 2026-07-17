import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host: (process.env.DB_HOST || 'localhost').trim(),
  port: Number((process.env.DB_PORT || '').trim()) || 3306,
  user: (process.env.DB_USER || 'root').trim(),
  password: (process.env.DB_PASSWORD || '').trim(),
  database: (process.env.DB_NAME || 'tecnonova').trim(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function queryRun(sql: string, params: any[] = []): Promise<any> {
  const [result] = await pool.execute(sql, params);
  return result;
}

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function queryGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const [rows] = await pool.execute(sql, params);
  const rowsArray = rows as T[];
  return rowsArray.length > 0 ? rowsArray[0] : null;
}

export async function initDatabase(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    console.log('Conexión con el servidor MySQL establecida con éxito.');
    conn.release();
  } catch (error: any) {
    console.error('====================================================');
    console.error(` ERROR: No se pudo conectar al servidor MySQL.`);
    console.error(` Detalles: ${error.message}`);
    console.error(` Asegúrate de que MySQL esté encendido y que las credenciales`);
    console.error(` en tu archivo .env sean correctas.`);
    console.error('====================================================');
    throw error;
  }

  await queryRun(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock INT NOT NULL
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      total DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL,
      created_at VARCHAR(50) NOT NULL
    )
  `);

  // Alter tables safely to add user_id without FK
  try {
    await queryRun(`
      ALTER TABLE orders ADD COLUMN user_id VARCHAR(50) NULL
    `);
    console.log('Columna user_id añadida a la tabla orders.');
  } catch (error: any) {
    if (!error.message.includes('Duplicate column name') && !error.message.includes('already exists')) {
      console.warn('Advertencia al alterar la tabla orders:', error.message);
    }
  }

  // Alter tables safely to add store_id
  try {
    await queryRun("ALTER TABLE products ADD COLUMN store_id VARCHAR(50) NOT NULL DEFAULT 'tienda1'");
    console.log("Columna store_id añadida a la tabla products.");
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name') && !e.message.includes('already exists')) {
      console.warn("Advertencia al alterar products:", e.message);
    }
  }

  try {
    await queryRun("ALTER TABLE orders ADD COLUMN store_id VARCHAR(50) NOT NULL DEFAULT 'tienda1'");
    console.log("Columna store_id añadida a la tabla orders.");
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name') && !e.message.includes('already exists')) {
      console.warn("Advertencia al alterar orders:", e.message);
    }
  }

  await queryRun(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(50) NOT NULL,
      product_id VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      quantity INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  // Seed data if products table is empty
  const rows = await queryAll<{ count: number }>('SELECT COUNT(*) as count FROM products');
  if (rows && rows[0] && rows[0].count === 0) {
    const defaultProducts = [
      // Tienda 1: Productos de hardware de computadora
      ['prod-1', 'Laptop Gamer Pro', 'Laptop con procesador i9 y tarjeta RTX 4080', 35000.00, 10, 'tienda1'],
      ['prod-2', 'Mouse Mecánico Inalámbrico', 'Mouse ergonómico con sensor óptico de 26k DPI', 1200.00, 50, 'tienda1'],
      ['prod-3', 'Teclado Mecánico RGB', 'Teclado hot-swappable con switches lineares', 1800.00, 25, 'tienda1'],
      ['prod-4', 'Monitor Curvo 34"', 'Monitor ultrawide 144Hz 1ms', 8500.00, 15, 'tienda1'],
      // Tienda 2: Accesorios de consolas / Gadgets
      ['prod-t2-1', 'Consola Next-Gen 1TB', 'Consola de videojuegos con soporte de resolución 4K HDR', 14000.00, 8, 'tienda2'],
      ['prod-t2-2', 'Mando Inalámbrico Pro', 'Control con gatillos adaptativos y retroalimentación háptica', 1500.00, 30, 'tienda2'],
      ['prod-t2-3', 'Auriculares 3D Surround', 'Audífonos inalámbricos con sonido espacial inmersivo', 2200.00, 20, 'tienda2']
    ];

    for (const p of defaultProducts) {
      await queryRun('INSERT INTO products (id, name, description, price, stock, store_id) VALUES (?, ?, ?, ?, ?, ?)', p);
    }
    console.log('Tablas inicializadas y productos semilla agregados en MySQL.');
  }
}

export { pool };
