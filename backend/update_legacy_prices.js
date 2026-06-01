const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bch7al'
    });

    try {
        const [result] = await db.query(`
            UPDATE Price p 
            SET p.status = 'pending' 
            WHERE p.status = 'active' 
            AND p.user_id NOT IN (SELECT id FROM User WHERE role IN ('admin', 'moderator'))
            AND (
                SELECT IFNULL(SUM(CASE WHEN v.type = 'upvote' THEN 1 ELSE 0 END) - SUM(CASE WHEN v.type = 'downvote' THEN 1 ELSE 0 END), 0) 
                FROM Vote v 
                WHERE v.price_id = p.id
            ) < 2
        `);
        console.log(`Updated ${result.affectedRows} legacy prices to pending.`);
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

run();
