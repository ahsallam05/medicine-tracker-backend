/*
  Database Seeder

  Clears all existing data and creates a fresh admin account.
  WARNING: This will DELETE all existing data!

  Run with: npm run seed
*/

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import Database from '../config/Database.js';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...\n');

    // ============================================================================
    // CLEAR ALL EXISTING DATA
    // ============================================================================
    console.log('🗑️  Clearing existing data...');

    // Delete medicines first (due to foreign key constraint)
    await Database.query('DELETE FROM medicines');
    console.log('   ✓ Cleared medicines table');

    // Delete all users
    await Database.query('DELETE FROM users');
    console.log('   ✓ Cleared users table');

    // Reset sequences to start from 1
    await Database.query('ALTER SEQUENCE medicines_id_seq RESTART WITH 1');
    await Database.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    console.log('   ✓ Reset ID sequences\n');

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    const result = await Database.query(
      `INSERT INTO users (name, username, password, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, username, role, is_active, created_at, updated_at`,
      ['Default Administrator', ADMIN_USERNAME, hashedPassword, 'admin', true]
    );

    const admin = result.rows[0];
    console.log(`✓ Admin account created successfully:`);
    console.log(`  ID: ${admin.id}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Active: ${admin.is_active}`);
    console.log(`  Created: ${admin.created_at}`);
    console.log(`  Updated: ${admin.updated_at}`);
    console.log('\nIMPORTANT: Change the admin password after first login!');

    await Database.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    if (error.stack) console.error(error.stack);
    await Database.close();
    process.exit(1);
  }
}

seedDatabase();
