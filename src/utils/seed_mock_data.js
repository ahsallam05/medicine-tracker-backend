/*
  Mock Data Seeder

  Seeds the database with realistic sample data:
  - 5 pharmacist accounts (ahmed, mohamed, mostafa, ramez, sayed)
  - 30 medicines covering all alert scenarios

  Run with: npm run seed:mock
*/

import 'dotenv/config';
import Database from '../config/Database.js';

const PHARMA_PASSWORD_HASH = '$2a$12$CITHeZ8an5s8s5Z7wT1/HOgWse194B6E5hf2BTrG39Y3rpB2anTsC';

async function seedMockData() {
  try {
    console.log('Starting mock data seeding...\n');

    // Check if mock data already exists
    const existingMedicines = await Database.queryOne('SELECT COUNT(*) FROM medicines');
    if (parseInt(existingMedicines.count, 10) > 0) {
      console.log('⚠️  Database already contains medicines. Skipping mock data seed.');
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
        `INSERT INTO users (name, username, password, role, is_active) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO NOTHING`,
        [p.name, p.username, PHARMA_PASSWORD_HASH, 'pharmacist', true]
      );
      console.log(`   ✓ ${p.name} (${p.username})`);
    }

    // ============================================================================
    // SEED MEDICINES (30 items covering all alert scenarios)
    // ============================================================================
    console.log('\n💊 Creating medicines...');

    // Get admin id (created_by = 1)
    const adminResult = await Database.queryOne('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    const createdBy = adminResult?.id || 1;

    const medicines = [
      // ---------------------------------------------------------------------------
      // EXPIRED MEDICINES (5 items - expiry in the past)
      // ---------------------------------------------------------------------------
      { name: 'Panadol Extra', quantity: 50, expiry: 'CURRENT_DATE - INTERVAL \'10 days\'', category: 'Painkiller' },
      { name: 'Amoxicillin 500mg', quantity: 0, expiry: 'CURRENT_DATE - INTERVAL \'15 days\'', category: 'Antibiotic' },
      { name: 'Ibuprofen 400mg', quantity: 5, expiry: 'CURRENT_DATE - INTERVAL \'20 days\'', category: 'Painkiller' },
      { name: 'Vitamin C 1000mg', quantity: 30, expiry: 'CURRENT_DATE - INTERVAL \'5 days\'', category: 'Vitamin' },
      { name: 'Omeprazole 20mg', quantity: 0, expiry: 'CURRENT_DATE - INTERVAL \'30 days\'', category: 'Antacid' },

      // ---------------------------------------------------------------------------
      // CRITICAL MEDICINES (5 items - expiry within 7 days)
      // ---------------------------------------------------------------------------
      { name: 'Paracetamol', quantity: 100, expiry: 'CURRENT_DATE + INTERVAL \'2 days\'', category: 'Painkiller' },
      { name: 'Azithromycin', quantity: 0, expiry: 'CURRENT_DATE + INTERVAL \'5 days\'', category: 'Antibiotic' },
      { name: 'Oseltamivir', quantity: 8, expiry: 'CURRENT_DATE + INTERVAL \'3 days\'', category: 'Antiviral' },
      { name: 'Vitamin D3', quantity: 45, expiry: 'CURRENT_DATE + INTERVAL \'7 days\'', category: 'Vitamin' },
      { name: 'Ranitidine', quantity: 3, expiry: 'CURRENT_DATE + INTERVAL \'4 days\'', category: 'Antacid' },

      // ---------------------------------------------------------------------------
      // EXPIRING SOON MEDICINES (5 items - expiry within 8-30 days)
      // ---------------------------------------------------------------------------
      { name: 'Aspirin', quantity: 80, expiry: 'CURRENT_DATE + INTERVAL \'15 days\'', category: 'Painkiller' },
      { name: 'Ciprofloxacin', quantity: 0, expiry: 'CURRENT_DATE + INTERVAL \'20 days\'', category: 'Antibiotic' },
      { name: 'Acyclovir', quantity: 6, expiry: 'CURRENT_DATE + INTERVAL \'25 days\'', category: 'Antiviral' },
      { name: 'Vitamin B Complex', quantity: 120, expiry: 'CURRENT_DATE + INTERVAL \'30 days\'', category: 'Vitamin' },
      { name: 'Pantoprazole', quantity: 2, expiry: 'CURRENT_DATE + INTERVAL \'12 days\'', category: 'Antacid' },

      // ---------------------------------------------------------------------------
      // GOOD STOCK MEDICINES (5 items - expiry far in the future)
      // ---------------------------------------------------------------------------
      { name: 'Diclofenac', quantity: 200, expiry: 'CURRENT_DATE + INTERVAL \'180 days\'', category: 'Painkiller' },
      { name: 'Doxycycline', quantity: 150, expiry: 'CURRENT_DATE + INTERVAL \'200 days\'', category: 'Antibiotic' },
      { name: 'Valacyclovir', quantity: 75, expiry: 'CURRENT_DATE + INTERVAL \'150 days\'', category: 'Antiviral' },
      { name: 'Multivitamin', quantity: 500, expiry: 'CURRENT_DATE + INTERVAL \'365 days\'', category: 'Vitamin' },
      { name: 'Esomeprazole', quantity: 100, expiry: 'CURRENT_DATE + INTERVAL \'120 days\'', category: 'Antacid' },

      // ---------------------------------------------------------------------------
      // OUT OF STOCK MEDICINES (5 items - quantity = 0, good expiry)
      // ---------------------------------------------------------------------------
      { name: 'Ketoprofen', quantity: 0, expiry: 'CURRENT_DATE + INTERVAL \'90 days\'', category: 'Painkiller' },
      { name: 'Clarithromycin', quantity: 0, expiry: 'CURRENT_DATE + INTERVAL \'60 days\'', category: 'Antibiotic' },
      { name: 'Zanamivir', quantity: 0, expiry: 'CURRENT_DATE + INTERVAL \'100 days\'', category: 'Antiviral' },
      { name: 'Vitamin E', quantity: 0, expiry: 'CURRENT_DATE + INTERVAL \'240 days\'', category: 'Vitamin' },
      { name: 'Lansoprazole', quantity: 0, expiry: 'CURRENT_DATE + INTERVAL \'180 days\'', category: 'Antacid' },

      // ---------------------------------------------------------------------------
      // RUNNING LOW MEDICINES (5 items - quantity between 1-10, good expiry)
      // ---------------------------------------------------------------------------
      { name: 'Naproxen', quantity: 4, expiry: 'CURRENT_DATE + INTERVAL \'200 days\'', category: 'Painkiller' },
      { name: 'Metronidazole', quantity: 7, expiry: 'CURRENT_DATE + INTERVAL \'90 days\'', category: 'Antibiotic' },
      { name: 'Rimantadine', quantity: 2, expiry: 'CURRENT_DATE + INTERVAL \'110 days\'', category: 'Antiviral' },
      { name: 'Vitamin B12', quantity: 9, expiry: 'CURRENT_DATE + INTERVAL \'300 days\'', category: 'Vitamin' },
      { name: 'Famotidine', quantity: 1, expiry: 'CURRENT_DATE + INTERVAL \'150 days\'', category: 'Antacid' }
    ];

    let count = 0;
    for (const m of medicines) {
      await Database.query(
        `INSERT INTO medicines (name, quantity, expiry_date, category, created_by) 
         VALUES ($1, $2, ${m.expiry}, $3, $4)`,
        [m.name, m.quantity, m.category, createdBy]
      );
      count++;
    }

    console.log(`   ✓ ${count} medicines created`);

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n✅ Mock data seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  • ${pharmacists.length} pharmacist accounts (password: "pharma123")`);
    console.log(`  • ${count} medicines across 5 categories`);
    console.log('\nAlert scenarios covered:');
    console.log('  • 5 Expired medicines (including overlaps with stock alerts)');
    console.log('  • 5 Critical medicines (expiring within 7 days)');
    console.log('  • 5 Expiring Soon medicines (within 30 days)');
    console.log('  • 5 Good Stock medicines (healthy expiry and quantity)');
    console.log('  • 5 Out of Stock medicines');
    console.log('  • 5 Running Low medicines (quantity 1-10)');

    await Database.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seed error:', error.message);
    if (error.stack) console.error(error.stack);
    await Database.close();
    process.exit(1);
  }
}

seedMockData();
