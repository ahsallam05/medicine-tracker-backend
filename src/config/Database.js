import pg from 'pg';

const { Pool } = pg;

class Database {
  static #instance = null;

  static getInstance() {
    if (!Database.#instance) {
      const isProduction = process.env.NODE_ENV === 'production';
      let config;

      if (process.env.DATABASE_URL) {
        
        config = {
          connectionString: process.env.DATABASE_URL,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        };

        // Enable SSL in production for Neon/Railway
        if (isProduction) {
          config.ssl = { rejectUnauthorized: false };
        }
      } else {
        
        config = {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '5432', 10),
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        };
      }

      Database.#instance = new Pool(config);

      Database.#instance.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });
    }

    return Database.#instance;
  }

  static async query(sql, values) {
    const pool = Database.getInstance();
    return await pool.query(sql, values);
  }

  static async queryOne(sql, values) {
    const result = await Database.query(sql, values);
    return result.rows[0];
  }

  static async queryAll(sql, values) {
    const result = await Database.query(sql, values);
    return result.rows;
  }

  static async close() {
    if (Database.#instance) {
      await Database.#instance.end();
      Database.#instance = null;
    }
  }
}

export default Database;
