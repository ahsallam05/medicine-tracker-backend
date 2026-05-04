/*
  SIMPLE PERFORMANCE REPORTER
  ===========================
  This script runs Artillery, saves the results to a JSON file,
  and then prints a human-readable 5-line summary.
*/

import { execSync } from 'child_process';
import fs from 'fs';

const reportJson = 'src/tests/performance/report.json';
const configPath = 'src/tests/performance/load-test.yml';

console.log('\n🚀 Running Performance Test (this will take ~80 seconds)...');

try {
  // 1. Run Artillery and output to JSON
  // Using --quiet to reduce console noise
  execSync(`npx artillery run --quiet --output ${reportJson} ${configPath}`, { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });

  // 2. Read and Parse the JSON results
  const data = JSON.parse(fs.readFileSync(reportJson, 'utf8'));
  const aggregate = data.aggregate;
  const http = aggregate.counters['http.requests'] || 0;
  const codes = aggregate.counters;
  const latency = aggregate.summaries['http.response_time'];

  // 4. Print Simple Summary
  console.log('\n' + '='.repeat(40));
  console.log('       PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(40));
  console.log(`✅ Total Requests:    ${http}`);
  console.log(`⏱️ Average Latency:   ${latency.mean.toFixed(2)} ms`);
  console.log(`🚀 P95 Latency:       ${latency.p95.toFixed(2)} ms (95% of users)`);
  console.log(`📊 Status 200 (OK):   ${codes['http.codes.200'] || 0}`);

  if (codes['http.codes.429']) {
    console.log(`⚠️  Rate Limited:      ${codes['http.codes.429']} (Blocked by Middleware)`);
  }

  console.log('='.repeat(40) + '\n');

} catch (error) {
  console.error('\n❌ Performance test failed:', error.message);
}
