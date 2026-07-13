import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tecnonova',
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

  // Create tables in MySQL if they do not exist
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
      ['prod-1', 'Laptop Gamer Pro', 'Laptop con procesador i9 y tarjeta RTX 4080', 2500.00, 10],
      ['prod-2', 'Mouse Mecánico Inalámbrico', 'Mouse ergonómico con sensor óptico de 26k DPI', 120.00, 50],
      ['prod-3', 'Teclado Mecánico RGB', 'Teclado hot-swappable con switches lineares', 180.00, 25],
      ['prod-4', 'Monitor Curvo 34"', 'Monitor ultrawide 144Hz 1ms', 600.00, 15]
    ];

    for (const p of defaultProducts) {
      await queryRun('INSERT INTO products (id, name, description, price, stock) VALUES (?, ?, ?, ?, ?)', p);
    }
    console.log('Tablas inicializadas y productos semilla agregados en MySQL.');
  }
}

export { pool };
