/*
  TEST SUITE: Factory Method Pattern — AlertFactory.js
  ======================================================
  Pattern: Factory Method
  File under test: src/patterns/AlertFactory.js

  What we verify:
    2.1  Expired medicine           → ExpiredAlert       (HIGH)
    2.2  Expiry in 3 days           → CriticalAlert      (HIGH)
    2.3  Expiry in 20 days          → ExpiringSoonAlert  (MEDIUM)
    2.4  Expiry in 60 days          → no expiry alert
    2.5  quantity === 0             → OutOfStockAlert    (HIGH)
    2.6  quantity === 5             → RunningLowAlert    (MEDIUM)
    2.7  quantity === 15            → no stock alert
    2.8  Expired AND out-of-stock   → two alerts in array
    2.9  Alert object has all required fields
    2.10 Alert message contains the medicine name

  Mocking strategy:
    NONE — AlertFactory is pure business logic with no I/O or DB dependency.
*/

import AlertFactory, {
  ExpiredAlert,
  CriticalAlert,
  ExpiringSoonAlert,
  OutOfStockAlert,
  RunningLowAlert,
} from '../patterns/AlertFactory.js';

// ─── Helper ────────────────────────────────────────────────────────────────
/**
 * Builds a medicine object whose expiry_date is `daysFromNow` days away.
 * Negative values mean already expired.
 */
function makeMedicine({ daysFromNow = 60, quantity = 50 } = {}) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysFromNow);
  return {
    id: 1,
    name: 'Aspirin',
    category: 'Painkiller',
    quantity,
    expiry_date: expiryDate.toISOString(),
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────
describe('Factory Method Pattern — AlertFactory', () => {

  // ─── TC 2.1 ──────────────────────────────────────────────────────────────
  test('2.1 expired medicine → ExpiredAlert with HIGH severity', () => {
    const medicine = makeMedicine({ daysFromNow: -1 });
    const alerts = AlertFactory.createAlerts(medicine);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toBeInstanceOf(ExpiredAlert);
    expect(alerts[0].type).toBe('EXPIRED');
    expect(alerts[0].severity).toBe('HIGH');
  });

  // ─── TC 2.2 ──────────────────────────────────────────────────────────────
  test('2.2 expiry in 3 days → CriticalAlert with HIGH severity', () => {
    const medicine = makeMedicine({ daysFromNow: 3 });
    const alerts = AlertFactory.createAlerts(medicine);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toBeInstanceOf(CriticalAlert);
    expect(alerts[0].type).toBe('CRITICAL');
    expect(alerts[0].severity).toBe('HIGH');
  });

  // ─── TC 2.3 ──────────────────────────────────────────────────────────────
  test('2.3 expiry in 20 days → ExpiringSoonAlert with MEDIUM severity', () => {
    const medicine = makeMedicine({ daysFromNow: 20 });
    const alerts = AlertFactory.createAlerts(medicine);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toBeInstanceOf(ExpiringSoonAlert);
    expect(alerts[0].type).toBe('EXPIRING_SOON');
    expect(alerts[0].severity).toBe('MEDIUM');
  });

  // ─── TC 2.4 ──────────────────────────────────────────────────────────────
  test('2.4 expiry in 60 days → no expiry alert produced', () => {
    const medicine = makeMedicine({ daysFromNow: 60 });
    const alerts = AlertFactory.createAlerts(medicine);

    const expiryTypes = ['EXPIRED', 'CRITICAL', 'EXPIRING_SOON'];
    const expiryAlerts = alerts.filter((a) => expiryTypes.includes(a.type));
    expect(expiryAlerts).toHaveLength(0);
  });

  // ─── TC 2.5 ──────────────────────────────────────────────────────────────
  test('2.5 quantity === 0 → OutOfStockAlert with HIGH severity', () => {
    const medicine = makeMedicine({ daysFromNow: 60, quantity: 0 });
    const alerts = AlertFactory.createAlerts(medicine);

    const stockAlert = alerts.find((a) => a.type === 'OUT_OF_STOCK');
    expect(stockAlert).toBeInstanceOf(OutOfStockAlert);
    expect(stockAlert.severity).toBe('HIGH');
  });

  // ─── TC 2.6 ──────────────────────────────────────────────────────────────
  test('2.6 quantity === 5 → RunningLowAlert with MEDIUM severity', () => {
    const medicine = makeMedicine({ daysFromNow: 60, quantity: 5 });
    const alerts = AlertFactory.createAlerts(medicine);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toBeInstanceOf(RunningLowAlert);
    expect(alerts[0].type).toBe('RUNNING_LOW');
    expect(alerts[0].severity).toBe('MEDIUM');
  });

  // ─── TC 2.7 ──────────────────────────────────────────────────────────────
  test('2.7 quantity === 15 → no stock alert produced', () => {
    const medicine = makeMedicine({ daysFromNow: 60, quantity: 15 });
    const alerts = AlertFactory.createAlerts(medicine);

    const stockTypes = ['OUT_OF_STOCK', 'RUNNING_LOW'];
    const stockAlerts = alerts.filter((a) => stockTypes.includes(a.type));
    expect(stockAlerts).toHaveLength(0);
  });

  // ─── TC 2.8 ──────────────────────────────────────────────────────────────
  test('2.8 expired AND out-of-stock → two alerts (ExpiredAlert + OutOfStockAlert)', () => {
    const medicine = makeMedicine({ daysFromNow: -5, quantity: 0 });
    const alerts = AlertFactory.createAlerts(medicine);

    // Factory must create BOTH alert types independently
    expect(alerts).toHaveLength(2);

    const types = alerts.map((a) => a.type);
    expect(types).toContain('EXPIRED');
    expect(types).toContain('OUT_OF_STOCK');
  });

  // ─── TC 2.9 ──────────────────────────────────────────────────────────────
  test('2.9 every alert object carries the correct medicine fields', () => {
    const medicine = makeMedicine({ daysFromNow: -1 });
    const alerts = AlertFactory.createAlerts(medicine);
    const alert = alerts[0];

    // All fields from the base Alert class must be populated
    expect(alert.medicine_id).toBe(medicine.id);
    expect(alert.medicine_name).toBe(medicine.name);
    expect(alert.category).toBe(medicine.category);
    expect(alert.quantity).toBe(medicine.quantity);
    expect(alert.expiry_date).toBe(medicine.expiry_date);
    expect(alert.type).toBeDefined();
    expect(alert.severity).toBeDefined();
    expect(alert.message).toBeDefined();
  });

  // ─── TC 2.10 ─────────────────────────────────────────────────────────────
  test('2.10 alert message contains the medicine name', () => {
    const medicine = makeMedicine({ daysFromNow: -1 });
    const alerts = AlertFactory.createAlerts(medicine);

    expect(alerts[0].message).toContain(medicine.name);
  });
});
