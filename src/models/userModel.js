const { getDatabase } = require('../config/database');

class UserModel {
  static create({ name, email, passwordHash, role = 'user' }) {
    const db = getDatabase();
    const query = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    const result = query.run(name, email, passwordHash, role);
    return {
      id: Number(result.lastInsertRowid),
      name,
      email,
      role
    };
  }

  static findByEmail(email) {
    const db = getDatabase();
    const query = db.prepare('SELECT * FROM users WHERE email = ?');
    return query.get(email) || null;
  }

  static findById(id) {
    const db = getDatabase();
    const query = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?');
    return query.get(id) || null;
  }
}

module.exports = UserModel;
