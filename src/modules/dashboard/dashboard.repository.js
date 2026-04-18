import Database from '../../config/Database.js';

class DashboardRepository {
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE) as expired_count,
        COUNT(*) FILTER (WHERE expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '7 days') as critical_count,
        COUNT(*) FILTER (WHERE expiry_date > CURRENT_DATE + INTERVAL '7 days' AND expiry_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_soon_count,
        COUNT(*) FILTER (WHERE quantity = 0) as out_of_stock_count,
        COUNT(*) FILTER (WHERE quantity > 0 AND quantity <= 10) as running_low_count,
        COUNT(*) as total_medicines
      FROM medicines
    `;
    const result = await Database.queryOne(sql);
    return {
      expired: parseInt(result.expired_count, 10),
      critical: parseInt(result.critical_count, 10),
      expiring_soon: parseInt(result.expiring_soon_count, 10),
      out_of_stock: parseInt(result.out_of_stock_count, 10),
      running_low: parseInt(result.running_low_count, 10),
      total: parseInt(result.total_medicines, 10),
    };
  }
}

export default DashboardRepository;
