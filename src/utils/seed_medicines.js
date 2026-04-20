/*
  Medicines Seeder

  Executes seed_medicines.sql to populate the database with 1000 medicines.

  Run with: npm run seed:medicines
*/

import 'dotenv/config';
import Database from '../config/Database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedMedicines() {
  try {
    console.log('Starting medicines seeding...\n');

    // Check if medicines already exist
    const existingMedicines = await Database.queryOne('SELECT COUNT(*) FROM medicines');
    if (parseInt(existingMedicines.count, 10) > 0) {
      console.log('⚠️  Database already contains medicines. Skipping seed.');
      console.log('   Run this on a fresh database or truncate tables first.\n');
      await Database.close();
      process.exit(0);
    }

    // Read and execute SQL file
    console.log('📄 Reading seed_medicines.sql...');
    const sqlPath = join(__dirname, 'seed_medicines.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('💊 Executing SQL to insert 1000 medicines...');
    await Database.query(sqlContent);

    const result = await Database.queryOne('SELECT COUNT(*) FROM medicines');
    const count = parseInt(result.count, 10);

    console.log('\n✅ Medicines seeding completed successfully!\n');
    console.log(`  • ${count} medicines created`);
    console.log('  • Categories: Antipyretics, Antibiotics, Antidiabetics, Cardiovascular,');
    console.log('                Respiratory, Gastrointestinal, Neurological, Supplements,');
    console.log('                Dermatology, Ophthalmology, Endocrinology, Antivirals, Urology');

    await Database.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seed error:', error.message);
    if (error.stack) console.error(error.stack);
    await Database.close();
    process.exit(1);
  }
}

seedMedicines();
