const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bch7al'
    });

    try {
        const [users] = await db.query(`SELECT id, name, role FROM User WHERE name = 'abderahim'`);
        console.log(users);
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

run();
