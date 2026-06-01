const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bch7al'
    });

    try {
        const [prices] = await db.query(`
            SELECT p.id, p.amount, p.status, p.user_id, u.role, u.name,
                (SELECT COUNT(*) FROM Vote WHERE price_id = p.id AND type = 'upvote') as upvotes
            FROM Price p
            LEFT JOIN User u ON p.user_id = u.id
        `);
        console.log(prices);
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

run();
