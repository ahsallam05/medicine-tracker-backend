import Database from '../../config/Database.js';

class AlertsRepository {
  static async getMedicinesForAlerts() {
    // We only need medicines that might have alerts (expired, expiring soon, out of stock, or low stock)
    const sql = `
      SELECT * FROM medicines 
      WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days'
         OR quantity <= 10
    `;
    return await Database.queryAll(sql);
  }
}

export default AlertsRepository;
