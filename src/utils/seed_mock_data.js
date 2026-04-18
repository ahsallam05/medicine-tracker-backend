import 'dotenv/config';
import bcrypt from 'bcryptjs';
import Database from '../config/Database.js';

async function seedMockData() {
  try {
    console.log('Starting mock data seeding...');

    // 1. Get Admin User ID (needed for medicines)
    const admin = await Database.queryOne('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    if (!admin) {
      console.error('Error: Admin account not found. Run "npm run seed" first.');
      process.exit(1);
    }
    const adminId = admin.id;

    // 2. Create Pharmacists
    const pharmacists = [
      { name: 'John Pharmacist', username: 'john_p', password: 'password123' },
      { name: 'Jane Pharmacist', username: 'jane_p', password: 'password123' },
    ];

    for (const p of pharmacists) {
      const exists = await Database.queryOne('SELECT id FROM users WHERE username = $1', [p.username]);
      if (!exists) {
        const hashedPassword = await bcrypt.hash(p.password, 10);
        await Database.query(
          'INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, $4)',
          [p.name, p.username, hashedPassword, 'pharmacist']
        );
        console.log(`✓ Pharmacist created: ${p.username}`);
      }
    }

    // 3. Create Medicines
    const today = new Date();
    const medicines = [
      // Expired
      { name: 'Old Amoxicillin', quantity: 50, expiry_date: new Date(new Date().setDate(today.getDate() - 10)), category: 'Antibiotic' },
      { name: 'Past Paracetamol', quantity: 20, expiry_date: new Date(new Date().setDate(today.getDate() - 5)), category: 'Painkiller' },
      
      // Critical (expiring within 7 days)
      { name: 'Critical Insulin', quantity: 15, expiry_date: new Date(new Date().setDate(today.getDate() + 3)), category: 'Diabetes' },
      
      // Expiring Soon (within 30 days)
      { name: 'Soon Aspirin', quantity: 100, expiry_date: new Date(new Date().setDate(today.getDate() + 20)), category: 'Heart' },
      
      // Out of Stock
      { name: 'Empty Vitamin C', quantity: 0, expiry_date: new Date(new Date().setDate(today.getDate() + 60)), category: 'Supplement' },
      
      // Running Low (stock <= 10)
      { name: 'Low Stock Cough Syrup', quantity: 5, expiry_date: new Date(new Date().setDate(today.getDate() + 90)), category: 'Respiratory' },
      
      // Healthy Stock
      { name: 'Healthy Ibuprofen', quantity: 500, expiry_date: new Date(new Date().setDate(today.getDate() + 365)), category: 'Painkiller' },
    ];

    for (const m of medicines) {
      const exists = await Database.queryOne('SELECT id FROM medicines WHERE name = $1', [m.name]);
      if (!exists) {
        await Database.query(
          'INSERT INTO medicines (name, quantity, expiry_date, category, created_by) VALUES ($1, $2, $3, $4, $5)',
          [m.name, m.quantity, m.expiry_date, m.category, adminId]
        );
        console.log(`✓ Medicine created: ${m.name}`);
      }
    }

    console.log('Mock data seeding completed successfully!');
    await Database.close();
    process.exit(0);
  } catch (error) {
    console.error('Mock seed error:', error.message);
    await Database.close();
    process.exit(1);
  }
}

seedMockData();
