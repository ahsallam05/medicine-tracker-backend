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
  
  afterEach(async () => {
    await Database.close();   
    MockPool.mockClear();     
  });

  test('1.1 getInstance() returns a defined object', () => {
    const instance = Database.getInstance();
    expect(instance).toBeDefined();
    expect(typeof instance).toBe('object');
  });

  test('1.2 two consecutive calls return the exact same reference (===)', () => {
    const firstCall  = Database.getInstance();
    const secondCall = Database.getInstance();

    // toBe uses Object.is / === — this proves it is the SAME object in memory
    expect(firstCall).toBe(secondCall);
  });

  test('1.3 ten consecutive calls all return the same reference', () => {
    const instances = Array.from({ length: 10 }, () => Database.getInstance());

    // Every element must be the same reference as the first
    instances.forEach((inst) => expect(inst).toBe(instances[0]));

    // Pool constructor must only have been called ONCE despite 10 getInstance() calls
    expect(MockPool).toHaveBeenCalledTimes(1);
  });

  test('1.4 close() resets instance — next call creates a brand new pool', async () => {
    const first = Database.getInstance();   
    await Database.close();                 
    const second = Database.getInstance(); 

    expect(second).not.toBe(first);

    // Pool constructor must have been called exactly TWICE
    expect(MockPool).toHaveBeenCalledTimes(2);
  });
});
