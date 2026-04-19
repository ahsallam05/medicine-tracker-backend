/*
  User Repository

  Handles all database queries related to users.
  Repositories use parameterized SQL to prevent SQL injection.
*/

import Database from '../../config/Database.js';

class UserRepository {
  static async findByUsername(username) {
    return await Database.queryOne(
      'SELECT id, username, password, role, is_active, created_at FROM users WHERE username = $1',
      [username]
    );
  }

  static async findById(id) {
    const sql = 'SELECT id, name, username, role, is_active, created_at FROM users WHERE id = $1';
    return await Database.queryOne(sql, [id]);
  }

  static async create(userData) {
    const { name, username, password, role = 'pharmacist' } = userData;
    const sql = `
      INSERT INTO users (name, username, password, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, username, role, is_active, created_at
    `;
    const result = await Database.query(sql, [name, username, password, role, true]);
    return result.rows[0];
  }

  static async findAllByRole(role) {
    const sql = 'SELECT id, name, username, role, is_active, created_at FROM users WHERE role = $1 ORDER BY created_at DESC';
    return await Database.queryAll(sql, [role]);
  }

  static async updateStatus(id, isActive) {
    const sql = 'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, username, role, is_active, created_at';
    return await Database.queryOne(sql, [isActive, id]);
  }

  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await Database.query(sql, [id]);
    return result.rowCount > 0;
  }
}

export default UserRepository;
