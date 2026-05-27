const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bch7al',
};

async function seed() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connecté à la base de données:', dbConfig.database);

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const queries = [
            `CREATE TABLE IF NOT EXISTS User (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                avatar VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user',
                reputation INT DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS Category (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS Badge (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS Store (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                logo VARCHAR(255),
                website VARCHAR(255),
                address VARCHAR(255)
            )`,
            `CREATE TABLE IF NOT EXISTS Product (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                brand VARCHAR(255),
                image VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                category_id INT,
                user_id INT,
                FOREIGN KEY (category_id) REFERENCES Category(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE SET NULL
            )`,
            `CREATE TABLE IF NOT EXISTS UserBadge (
                user_id INT,
                badge_id INT,
                PRIMARY KEY (user_id, badge_id),
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
                FOREIGN KEY (badge_id) REFERENCES Badge(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS Price (
                id INT AUTO_INCREMENT PRIMARY KEY,
                amount DECIMAL(10, 2) NOT NULL,
                observedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                proofImage VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                user_id INT,
                product_id INT,
                store_id INT,
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE SET NULL,
                FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE,
                FOREIGN KEY (store_id) REFERENCES Store(id) ON DELETE SET NULL
            )`,
            `CREATE TABLE IF NOT EXISTS Comment (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INT,
                product_id INT,
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS Alert (
                id INT AUTO_INCREMENT PRIMARY KEY,
                targetPrice DECIMAL(10, 2) NOT NULL,
                active BOOLEAN DEFAULT TRUE,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INT,
                product_id INT,
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS Favorite (
                id INT AUTO_INCREMENT PRIMARY KEY,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INT,
                product_id INT,
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS Notification (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                isRead BOOLEAN DEFAULT FALSE,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INT,
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS ProductView (
                id INT AUTO_INCREMENT PRIMARY KEY,
                viewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INT,
                product_id INT,
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE SET NULL,
                FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS Vote (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INT,
                price_id INT,
                FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
                FOREIGN KEY (price_id) REFERENCES Price(id) ON DELETE CASCADE
            )`
        ];

        for (const query of queries) {
            await connection.query(query);
        }

        const tables = ['Vote', 'ProductView', 'Notification', 'Favorite', 'Alert', 'Comment', 'Price', 'UserBadge', 'Product', 'Store', 'Badge', 'Category', 'User'];
        for (const table of tables) {
            await connection.query(`TRUNCATE TABLE ${table}`);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedAdminPwd = await bcrypt.hash('admin123', salt);
        const hashedUserPwd = await bcrypt.hash('user123', salt);

        // Utilisation de paramètres préparés pour éviter toute injection SQL
        await connection.query(
            `INSERT INTO User (name, email, password, avatar, role, reputation) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)`,
            [
                'Admin', 'admin@bch7al.ma', hashedAdminPwd, 'avatar_admin.png', 'admin', 1000,
                'User1', 'user1@example.com', hashedUserPwd, 'avatar1.png', 'user', 50,
                'User2', 'user2@example.com', hashedUserPwd, 'avatar2.png', 'user', 120
            ]
        );

        await connection.query(`
            INSERT INTO Category (name, description) VALUES
            ('Électronique', 'Produits électroniques et gadgets'),
            ('Alimentation', 'Produits alimentaires de tous les jours'),
            ('Électroménager', 'Gros et petits appareils électroménagers')
        `);

        await connection.query(`
            INSERT INTO Store (name, logo, website, address) VALUES
            ('Marjane', 'marjane.png', 'www.marjane.ma', 'Casablanca, Maroc'),
            ('Carrefour', 'carrefour.png', 'www.carrefour.ma', 'Rabat, Maroc'),
            ('Electroplanet', 'electroplanet.png', 'www.electroplanet.ma', 'Tanger, Maroc')
        `);

        await connection.query(`
            INSERT INTO Badge (name, description) VALUES
            ('Chasseur de Prix', 'Trouve les meilleurs prix régulièrement'),
            ('Fiable', 'Propose des prix validés par la communauté'),
            ('Nouveau', 'Nouveau membre de la communauté')
        `);

        await connection.query(`
            INSERT INTO Product (name, description, brand, image, status, category_id, user_id) VALUES
            ('Samsung Galaxy S23', 'Smartphone haut de gamme', 'Samsung', 's23.png', 'approved', 1, 1),
            ('Lait Entier 1L', 'Lait UHT entier', 'Centrale', 'lait.png', 'approved', 2, 2),
            ('Réfrigérateur LG', 'Réfrigérateur No Frost', 'LG', 'refrigo.png', 'approved', 3, 1)
        `);

        await connection.query(`
            INSERT INTO Price (amount, proofImage, status, user_id, product_id, store_id) VALUES
            (8500.00, 'proof_s23_marjane.png', 'validated', 2, 1, 1),
            (9.50, 'proof_lait_carrefour.png', 'pending', 3, 2, 2),
            (6500.00, 'proof_refrigo_electro.png', 'validated', 1, 3, 3)
        `);

        await connection.query(`
            INSERT INTO Comment (content, user_id, product_id) VALUES
            ('Très bon prix, je confirme !', 3, 1),
            ('Ce lait est souvent en rupture.', 2, 2)
        `);

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Seeding terminé avec succès !');

    } catch (error) {
        console.error('Erreur lors du seeding:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connexion à la base de données fermée.');
        }
    }
}

seed();
