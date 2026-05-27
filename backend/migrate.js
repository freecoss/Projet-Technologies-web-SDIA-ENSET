const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bch7al',
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connecté à la BDD');
        
        try {
            await connection.query("ALTER TABLE Product ADD COLUMN status VARCHAR(50) DEFAULT 'pending'");
            console.log('Colonne status ajoutée.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('La colonne status existe déjà.');
            } else {
                throw e;
            }
        }
        
        await connection.query("UPDATE Product SET status = 'approved' WHERE status = 'pending'");
        console.log('Produits existants passés en approved.');
        
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
