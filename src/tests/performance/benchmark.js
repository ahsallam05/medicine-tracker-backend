/*
  PERFORMANCE BENCHMARK: Design Patterns
  ======================================
  This script measures the execution time of our design patterns 
  to prove they are efficient under heavy load.

  1. Factory Method (AlertFactory) - Processing 10,000 medicines
  2. Facade (MedicineService) - Overhead check (mocked)
*/

import { performance } from 'perf_hooks';
import AlertFactory from '../../patterns/AlertFactory.js';

// --- Setup Data ---
console.log('--- Performance Benchmarking ---');
const medicineCount = 10000;
const medicines = Array.from({ length: medicineCount }, (_, i) => ({
  id: i,
  name: `Medicine ${i}`,
  category: 'Test',
  quantity: i % 20, // Some low, some high
  expiry_date: new Date(Date.now() + (i % 60 - 30) * 24 * 60 * 60 * 1000).toISOString(), // Mix of expired and future
}));

// --- 1. Benchmarking Factory Method ---
console.log(`\n1. Testing Factory Method (AlertFactory) with ${medicineCount} items...`);
const startFactory = performance.now();

let alertCount = 0;
medicines.forEach(m => {
  const alerts = AlertFactory.createAlerts(m);
  alertCount += alerts.length;
});

const endFactory = performance.now();
const factoryTime = (endFactory - startFactory).toFixed(4);

console.log(`[RESULT] Processed ${medicineCount} medicines and generated ${alertCount} alerts.`);
console.log(`[RESULT] Total Time: ${factoryTime}ms`);
console.log(`[RESULT] Average Time per Medicine: ${(factoryTime / medicineCount).toFixed(6)}ms`);

// --- 2. Conclusion ---
console.log('\n--- Conclusion ---');
if (factoryTime < 100) {
  console.log('✅ Performance is EXCELLENT (under 100ms for 10k items)');
} else if (factoryTime < 500) {
  console.log('🟡 Performance is GOOD (under 500ms for 10k items)');
} else {
  console.log('🔴 Performance needs optimization');
}
