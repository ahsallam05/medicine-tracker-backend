import Database from '../../config/Database.js';

class MedicineRepository {
  static async create(medicineData) {
    const { name, quantity, expiry_date, category, created_by } = medicineData;
    const sql = `
      INSERT INTO medicines (name, quantity, expiry_date, category, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await Database.query(sql, [name, quantity, expiry_date, category, created_by]);
    return result.rows[0];
  }

  static async findAll(params) {
    const { search, category, status, sortBy, order, limit, offset } = params;
    let sql = 'SELECT * FROM medicines WHERE 1=1';
    const values = [];
    let counter = 1;

    if (search) {
      sql += ` AND (name ILIKE $${counter} OR category ILIKE $${counter})`;
      values.push(`%${search}%`);
      counter++;
    }

    if (category) {
      sql += ` AND category = $${counter}`;
      values.push(category);
      counter++;
    }

    if (status === 'expired') {
      sql += ' AND expiry_date < CURRENT_DATE';
    } else if (status === 'active') {
      sql += ' AND expiry_date >= CURRENT_DATE';
    }

    if (sortBy) {
      const allowedSort = ['name', 'expiry_date', 'quantity', 'created_at'];
      const field = allowedSort.includes(sortBy) ? sortBy : 'created_at';
      const direction = order === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${field} ${direction}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    sql += ` LIMIT $${counter} OFFSET $${counter + 1}`;
    values.push(limit, offset);

    const result = await Database.query(sql, values);
    return result.rows;
  }

  static async count(params) {
    const { search, category, status } = params;
    let sql = 'SELECT COUNT(*) FROM medicines WHERE 1=1';
    const values = [];
    let counter = 1;

    if (search) {
      sql += ` AND (name ILIKE $${counter} OR category ILIKE $${counter})`;
      values.push(`%${search}%`);
      counter++;
    }

    if (category) {
      sql += ` AND category = $${counter}`;
      values.push(category);
      counter++;
    }

    if (status === 'expired') {
      sql += ' AND expiry_date < CURRENT_DATE';
    } else if (status === 'active') {
      sql += ' AND expiry_date >= CURRENT_DATE';
    }

    const result = await Database.query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findById(id) {
    const sql = 'SELECT * FROM medicines WHERE id = $1';
    const result = await Database.query(sql, [id]);
    return result.rows[0];
  }

  static async update(id, medicineData) {
    const { name, quantity, expiry_date, category } = medicineData;
    const sql = `
      UPDATE medicines
      SET name = $1, quantity = $2, expiry_date = $3, category = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const result = await Database.query(sql, [name, quantity, expiry_date, category, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = 'DELETE FROM medicines WHERE id = $1 RETURNING id';
    const result = await Database.query(sql, [id]);
    return result.rowCount > 0;
  }
}

export default MedicineRepository;
