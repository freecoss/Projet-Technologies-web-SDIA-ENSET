const db = require('../config/db');

class User {
    static async findByEmail(email) {
        const [users] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
        return users.length ? users[0] : null;
    }

    static async findById(id) {
        const [users] = await db.query('SELECT id, name, email, role, avatar, reputation, createdAt FROM User WHERE id = ?', [id]);
        return users.length ? users[0] : null;
    }

    static async create(userData) {
        const { name, email, password, avatar } = userData;
        const [result] = await db.query(
            'INSERT INTO User (name, email, password, avatar, role, reputation) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, password, avatar || null, 'user', 0]
        );
        return result.insertId;
    }

    static async update(id, updateData) {
        const keys = Object.keys(updateData);
        if (keys.length === 0) return null;

        const setString = keys.map(k => `${k} = ?`).join(', ');
        const values = Object.values(updateData);
        
        await db.query(`UPDATE User SET ${setString} WHERE id = ?`, [...values, id]);
        return this.findById(id);
    }
}

module.exports = User;
