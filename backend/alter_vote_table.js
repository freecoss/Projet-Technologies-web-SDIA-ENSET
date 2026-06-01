const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bch7al'
    });

    try {
        await db.query('ALTER TABLE Vote ADD COLUMN weight INT DEFAULT 1');
        console.log("Column 'weight' added to 'Vote' table successfully.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'weight' already exists.");
        } else {
            console.error(err);
        }
    } finally {
        await db.end();
    }
}

run();
