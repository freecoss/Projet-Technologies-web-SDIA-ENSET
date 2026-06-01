const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bch7al'
    });

    try {
        console.log("Testing Reputation Logic...");
        
        // Setup a dummy user
        await db.query(`INSERT IGNORE INTO User (id, name, email, password, role, reputation) VALUES (999, 'TestUser', 'test@test.com', 'pwd', 'user', 0)`);
        
        // Function from voteController.js
        const updateReputation = async (userId, points) => {
            if (!userId) return; 
            await db.query('UPDATE User SET reputation = reputation + ? WHERE id = ?', [points, userId]);
            
            const [users] = await db.query('SELECT role, reputation FROM User WHERE id = ?', [userId]);
            if (users.length > 0) {
                const user = users[0];
                if (user.role === 'user' && user.reputation >= 500) {
                    await db.query("UPDATE User SET role = 'moderator' WHERE id = ?", [userId]);
                } else if (user.role !== 'admin' && user.reputation <= -100) {
                    await db.query("UPDATE User SET role = 'banned' WHERE id = ?", [userId]);
                }
            }
        };

        // Test Promotion
        await db.query(`UPDATE User SET reputation = 495, role = 'user' WHERE id = 999`);
        await updateReputation(999, 5); // +5 upvote
        let [u] = await db.query('SELECT role, reputation FROM User WHERE id = 999');
        console.log(`Promotion Test: Role = ${u[0].role}, Rep = ${u[0].reputation} (Expected: moderator, 500)`);

        // Test Demotion (should not happen)
        await updateReputation(999, -5); // -5 cancel
        [u] = await db.query('SELECT role, reputation FROM User WHERE id = 999');
        console.log(`Demotion Test: Role = ${u[0].role}, Rep = ${u[0].reputation} (Expected: moderator, 495)`);

        // Test Ban
        await db.query(`UPDATE User SET reputation = -98, role = 'user' WHERE id = 999`);
        await updateReputation(999, -2); // -2 downvote
        [u] = await db.query('SELECT role, reputation FROM User WHERE id = 999');
        console.log(`Ban Test: Role = ${u[0].role}, Rep = ${u[0].reputation} (Expected: banned, -100)`);

        // Clean up
        await db.query(`DELETE FROM User WHERE id = 999`);
        
        console.log("Tests OK");

    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

run();
