const db = require('../config/db');

class Product {
    static async findAll(params = {}) {
        const { search, category, store, minPrice, maxPrice, limit, offset } = params;
        
        let query = `
            SELECT p.*, c.name as category_name, u.name as user_name,
                   (
                       SELECT pr.amount
                       FROM Price pr
                       LEFT JOIN Vote v ON pr.id = v.price_id
                       WHERE pr.product_id = p.id AND pr.status = 'active'
                       GROUP BY pr.id
                       ORDER BY (IFNULL(SUM(CASE WHEN v.type = 'upvote' THEN v.weight END), 0) - IFNULL(SUM(CASE WHEN v.type = 'downvote' THEN v.weight END), 0)) DESC, pr.amount ASC
                       LIMIT 1
                   ) as current_price
            FROM Product p
            LEFT JOIN Category c ON p.category_id = c.id
            LEFT JOIN User u ON p.user_id = u.id
            WHERE p.status = 'approved'
        `;
        const queryParams = [];
        
        if (search) {
            query += ` AND (p.name LIKE ? OR p.brand LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            query += ` AND p.category_id = ?`;
            queryParams.push(category);
        }
        if (store) {
            query += ` AND EXISTS (SELECT 1 FROM Price pr_store WHERE pr_store.product_id = p.id AND pr_store.store_id = ? AND pr_store.status = 'active')`;
            queryParams.push(store);
        }
        
        query += ` GROUP BY p.id`;
        
        let having = [];
        if (minPrice) {
            having.push(`current_price >= ?`);
            queryParams.push(minPrice);
        }
        if (maxPrice) {
            having.push(`current_price <= ?`);
            queryParams.push(maxPrice);
        }
        
        if (having.length > 0) {
            query += ` HAVING ` + having.join(' AND ');
        }

        // Count total
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
        const [countResult] = await db.query(countQuery, queryParams);
        const total = countResult[0].total;

        if (limit !== undefined && offset !== undefined) {
            query += ` ORDER BY p.createdAt DESC LIMIT ? OFFSET ?`;
            queryParams.push(parseInt(limit), offset);
        } else {
            query += ` ORDER BY p.createdAt DESC`;
        }

        const [products] = await db.query(query, queryParams);
        return { products, total };
    }

    static async findById(id) {
        const query = `
            SELECT p.*, c.name as category_name, u.name as user_name
            FROM Product p
            LEFT JOIN Category c ON p.category_id = c.id
            LEFT JOIN User u ON p.user_id = u.id
            WHERE p.id = ?
        `;
        const [products] = await db.query(query, [id]);
        return products.length ? products[0] : null;
    }

    static async create(productData) {
        const { name, description, brand, category_id, image, user_id } = productData;
        const [result] = await db.query(
            'INSERT INTO Product (name, description, brand, category_id, image, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description || null, brand || null, category_id, image || null, user_id, 'pending']
        );
        return result.insertId;
    }
}

module.exports = Product;
