const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bch7al'
    });

    try {
        const productId = 4;
        const summaryQuery = `
            SELECT 
                (
                    SELECT pr.amount
                    FROM Price pr
                    LEFT JOIN Vote v ON pr.id = v.price_id
                    WHERE pr.product_id = p.product_id AND pr.status = 'active'
                    GROUP BY pr.id
                    ORDER BY (COUNT(CASE WHEN v.type = 'upvote' THEN 1 ELSE 0 END) - COUNT(CASE WHEN v.type = 'downvote' THEN 1 ELSE 0 END)) DESC, pr.amount ASC
                    LIMIT 1
                ) as min_price,
                MAX(p.amount) as max_price,
                AVG(p.amount) as avg_price
            FROM Price p
            WHERE p.product_id = ? AND p.status = 'active'
            GROUP BY p.product_id
        `;
        const [summary] = await db.query(summaryQuery, [productId]);
        console.log("Summary:", summary);
        
        // Let's also check the subquery independently
        const subq = `
            SELECT pr.id, pr.amount, (COUNT(CASE WHEN v.type = 'upvote' THEN 1 ELSE 0 END) - COUNT(CASE WHEN v.type = 'downvote' THEN 1 ELSE 0 END)) as score
            FROM Price pr
            LEFT JOIN Vote v ON pr.id = v.price_id
            WHERE pr.product_id = ? AND pr.status = 'active'
            GROUP BY pr.id
            ORDER BY score DESC, pr.amount ASC
        `;
        const [sub_result] = await db.query(subq, [productId]);
        console.log("Subquery:", sub_result);
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

run();
