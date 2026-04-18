import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from '../config/Database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const db = Database.getInstance();
  
  try {
    console.log('Starting database seeding...');

    // 1. Clear existing data
    console.log('Clearing existing data...');
    await db.query('DELETE FROM medicines');
    // Keep the default admin (usually username 'admin')
    // We use a transaction or specific order to avoid constraint issues
    await db.query("DELETE FROM users WHERE username != 'admin'");
    
    // 2. Read and execute Users.sql
    console.log('Seeding users...');
    const usersSqlPath = path.join(__dirname, 'Users.sql');
    let usersSql = fs.readFileSync(usersSqlPath, 'utf8');
    
    // Fix table name case if necessary
    usersSql = usersSql.replace(/insert into Users/g, 'INSERT INTO users');
    
    // Split by semicolons and execute each statement
    const userStatements = usersSql.split(';').filter(stmt => stmt.trim());
    for (const stmt of userStatements) {
      // Correctly place ON CONFLICT (id) DO NOTHING after the VALUES part
      // The statement format is: INSERT INTO users (cols) VALUES (vals)
      const conflictStmt = stmt.trim() + ' ON CONFLICT (id) DO NOTHING';
      await db.query(conflictStmt);
    }
    console.log(`Seeded ${userStatements.length} users.`);

    // 3. Read and execute Medicine.sql
    console.log('Seeding medicines...');
    const medicineSqlPath = path.join(__dirname, 'Medicine.sql');
    let medicineSql = fs.readFileSync(medicineSqlPath, 'utf8');
    
    // Fix table name case if necessary
    medicineSql = medicineSql.replace(/insert into Medicine/g, 'INSERT INTO medicines');
    
    // Split by semicolons and execute each statement
    const medicineStatements = medicineSql.split(';').filter(stmt => stmt.trim());
    
    // Execute in batches to be more efficient
    const batchSize = 100;
    for (let i = 0; i < medicineStatements.length; i += batchSize) {
      const batch = medicineStatements.slice(i, i + batchSize);
      await Promise.all(batch.map(stmt => db.query(stmt)));
      console.log(`Processed ${Math.min(i + batchSize, medicineStatements.length)}/${medicineStatements.length} medicines...`);
    }
    
    console.log('Seeding completed successfully!');

    // 4. Reset sequences
    console.log('Syncing database sequences...');
    await db.query("SELECT setval(pg_get_serial_sequence('medicines', 'id'), (SELECT MAX(id) FROM medicines))");
    await db.query("SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users))");
    console.log('Sequences synced.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
