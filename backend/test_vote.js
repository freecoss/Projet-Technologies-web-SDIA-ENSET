const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bch7al'
    });

    try {
        // Find price 7
        let [prices] = await db.query('SELECT id, status FROM Price WHERE id = 7');
        console.log('Before vote cancel:', prices[0]);
        
        let [votes] = await db.query('SELECT * FROM Vote WHERE price_id = 7');
        console.log('Votes before:', votes.length);
        
        if (votes.length > 0) {
            const voteToDelete = votes[0];
            // Delete one vote
            await db.query('DELETE FROM Vote WHERE id = ?', [voteToDelete.id]);
            
            // Run the controller logic
            const [voteStats] = await db.query(`
                SELECT 
                    COUNT(CASE WHEN type = 'upvote' THEN 1 END) as upvotes,
                    COUNT(CASE WHEN type = 'downvote' THEN 1 END) as downvotes
                FROM Vote WHERE price_id = 7
            `);
            const score = voteStats[0].upvotes - voteStats[0].downvotes;
            
            const currentStatus = prices[0].status;
            let newStatus = currentStatus;
            
            const priceAuthorId = 4; // abderahim
            const [authorData] = await db.query('SELECT role FROM User WHERE id = ?', [priceAuthorId]);
            const isAuthorPrivileged = authorData.length > 0 && ['admin', 'moderator'].includes(authorData[0].role);
            
            if (score >= 2) {
                newStatus = 'active';
            } else if (score <= -3) {
                newStatus = 'rejected';
            } else {
                newStatus = isAuthorPrivileged ? 'active' : 'pending';
            }
            
            console.log(`Score: ${score}, newStatus: ${newStatus}, currentStatus: ${currentStatus}`);
            
            if (newStatus !== currentStatus) {
                await db.query("UPDATE Price SET status = ? WHERE id = ?", [newStatus, 7]);
            }
            
            [prices] = await db.query('SELECT id, status FROM Price WHERE id = 7');
            console.log('After vote cancel:', prices[0]);
            
            // Re-insert vote to keep data same
            await db.query('INSERT INTO Vote (type, user_id, price_id) VALUES (?, ?, ?)', [voteToDelete.type, voteToDelete.user_id, voteToDelete.price_id]);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

run();
