/*
  Database Seeder

  On first startup, this script checks if an admin account exists.
  If not, it creates one using credentials from environment variables.

  Run with: npm run seed
*/

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import Database from '../config/Database.js';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    const existingAdmin = await Database.queryOne(
      `SELECT id FROM users WHERE role = $1 AND username = $2`,
      ['admin', ADMIN_USERNAME]
    );

    if (existingAdmin) {
      console.log(`✓ Admin account "${ADMIN_USERNAME}" already exists. Skipping seed.`);
      await Database.close();
      process.exit(0);
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    const result = await Database.query(
      `INSERT INTO users (name, username, password, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, role, is_active, created_at`,
      ['Default Administrator', ADMIN_USERNAME, hashedPassword, 'admin', true]
    );

    const admin = result.rows[0];
    console.log(`✓ Admin account created successfully:`);
    console.log(`  ID: ${admin.id}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Active: ${admin.is_active}`);
    console.log(`  Created: ${admin.created_at}`);
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
