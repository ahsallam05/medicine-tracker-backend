/*
  TEST SUITE: Singleton Pattern — Database.js
  ============================================
  Pattern: Singleton
  File under test: src/config/Database.js

  What we verify:
    1. getInstance() returns an object (basic sanity)
    2. Multiple calls return the EXACT same reference (===) — core Singleton guarantee
    3. Ten calls all share the same reference (stress test)
    4. close() resets the instance so the next call creates a fresh one

  Mocking strategy:
    - We mock the 'pg' module so no real PostgreSQL connection is opened.
    - pg.Pool is replaced with a Jest constructor spy.
*/

jest.mock('pg', () => {
  const MockPool = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
  }));
  return { Pool: MockPool };
});

import pg from 'pg';
import Database from '../config/Database.js';

const { Pool: MockPool } = pg;

describe('Singleton Pattern — Database', () => {
  // Reset the singleton and mock call counts after every test
  afterEach(async () => {
    await Database.close();   // sets #instance = null
    MockPool.mockClear();     // resets call counter
  });

  // ─── TC 1.1 ────────────────────────────────────────────────────────────────
  test('1.1 getInstance() returns a defined object', () => {
    const instance = Database.getInstance();
    expect(instance).toBeDefined();
    expect(typeof instance).toBe('object');
  });

  // ─── TC 1.2 ────────────────────────────────────────────────────────────────
  test('1.2 two consecutive calls return the exact same reference (===)', () => {
    const firstCall  = Database.getInstance();
    const secondCall = Database.getInstance();

    // toBe uses Object.is / === — this proves it is the SAME object in memory
    expect(firstCall).toBe(secondCall);
  });

  // ─── TC 1.3 ────────────────────────────────────────────────────────────────
  test('1.3 ten consecutive calls all return the same reference', () => {
    const instances = Array.from({ length: 10 }, () => Database.getInstance());

    // Every element must be the same reference as the first
    instances.forEach((inst) => expect(inst).toBe(instances[0]));

    // Pool constructor must only have been called ONCE despite 10 getInstance() calls
    expect(MockPool).toHaveBeenCalledTimes(1);
  });

  // ─── TC 1.4 ────────────────────────────────────────────────────────────────
  test('1.4 close() resets instance — next call creates a brand new pool', async () => {
    const first = Database.getInstance();   // Pool called once → instance A
    await Database.close();                 // #instance = null
    const second = Database.getInstance(); // Pool called again → instance B

    // Must be different objects — the singleton was reset
    expect(second).not.toBe(first);

    // Pool constructor must have been called exactly TWICE
    expect(MockPool).toHaveBeenCalledTimes(2);
  });
});
