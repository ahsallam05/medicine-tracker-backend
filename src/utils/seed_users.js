/*
  Users Seeder

  Seeds the database with pharmacist accounts.

  Run with: npm run seed:users
*/

import 'dotenv/config';
import Database from '../config/Database.js';

const PHARMA_PASSWORD_HASH = '$2a$12$CITHeZ8an5s8s5Z7wT1/HOgWse194B6E5hf2BTrG39Y3rpB2anTsC';

async function seedUsers() {
  try {
    console.log('Starting users seeding...\n');

    // Check if users already exist
    const existingUsers = await Database.queryOne('SELECT COUNT(*) FROM users WHERE role = $1', ['pharmacist']);
    if (parseInt(existingUsers.count, 10) > 0) {
      console.log('⚠️  Database already contains pharmacist accounts. Skipping seed.');
      console.log('   Run this on a fresh database or truncate tables first.\n');
      await Database.close();
      process.exit(0);
    }

    // ============================================================================
    // SEED PHARMACISTS (5 accounts)
    // ============================================================================
    console.log('👤 Creating pharmacist accounts...');

    const pharmacists = [
      { name: 'Ahmed Sallam', username: 'ahmed' },
      { name: 'Mohamed Ali', username: 'mohamed' },
      { name: 'Mostafa Ibrahim', username: 'mostafa' },
      { name: 'Ramez', username: 'ramez' },
      { name: 'Sayed Ali', username: 'sayed' }
    ];

    for (const p of pharmacists) {
      await Database.query(
        `INSERT INTO users (name, username, password, role, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (username) DO NOTHING`,
        [p.name, p.username, PHARMA_PASSWORD_HASH, 'pharmacist', true]
      );
      console.log(`   ✓ ${p.name} (${p.username})`);
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n✅ Mock data seeding completed successfully!\n');
    console.log(`  • ${pharmacists.length} pharmacist accounts created (password: "pharma123")`);
    console.log('\nNote: For medicines data, run: npm run seed:medicines');

    await Database.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seed error:', error.message);
    if (error.stack) console.error(error.stack);
    await Database.close();
    process.exit(1);
  }
}

seedUsers();
