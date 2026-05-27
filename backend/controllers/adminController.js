const db = require('../config/db');

const getStats = async (req, res) => {
    try {
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM User');
        const [[{ totalProducts }]] = await db.query("SELECT COUNT(*) as totalProducts FROM Product WHERE status = 'approved'");
        const [[{ pendingProducts }]] = await db.query("SELECT COUNT(*) as pendingProducts FROM Product WHERE status = 'pending'");
        const [[{ rejectedProducts }]] = await db.query("SELECT COUNT(*) as rejectedProducts FROM Product WHERE status = 'rejected'");
        const [[{ totalPrices }]] = await db.query('SELECT COUNT(*) as totalPrices FROM Price');
        const [[{ totalComments }]] = await db.query('SELECT COUNT(*) as totalComments FROM Comment');

        res.status(200).json({
            totalUsers,
            totalProducts,
            pendingProducts,
            rejectedProducts,
            totalPrices,
            totalComments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getStats };
