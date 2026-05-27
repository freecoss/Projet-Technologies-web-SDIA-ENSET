const db = require('../config/db');

const getPublicStats = async (req, res) => {
    try {
        const [usersResult] = await db.query('SELECT COUNT(*) as count FROM User');
        const [productsResult] = await db.query('SELECT COUNT(*) as count FROM Product WHERE status = "approved"');
        const [pricesResult] = await db.query('SELECT COUNT(*) as count FROM Price WHERE status = "active"');
        const [storesResult] = await db.query('SELECT COUNT(*) as count FROM Store');

        res.status(200).json({
            users: usersResult[0].count,
            products: productsResult[0].count,
            prices: pricesResult[0].count,
            stores: storesResult[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getPublicStats };
