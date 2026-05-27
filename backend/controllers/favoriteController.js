const db = require('../config/db');

const addFavorite = async (req, res) => {
    try {
        const productId = req.params.productId;
        
        const [existing] = await db.query('SELECT * FROM Favorite WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Ce produit est déjà dans vos favoris' });
        }

        const [result] = await db.query('INSERT INTO Favorite (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
        res.status(201).json({ id: result.insertId, user_id: req.user.id, product_id: productId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const removeFavorite = async (req, res) => {
    try {
        const productId = req.params.productId;
        
        const [result] = await db.query('DELETE FROM Favorite WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Favori non trouvé' });
        }
        
        res.status(200).json({ message: 'Produit retiré des favoris' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getMyFavorites = async (req, res) => {
    try {
        const query = `
            SELECT f.id as favorite_id, f.createdAt as favorite_addedAt,
                   p.*, c.name as category_name
            FROM Favorite f
            JOIN Product p ON f.product_id = p.id
            LEFT JOIN Category c ON p.category_id = c.id
            WHERE f.user_id = ?
            ORDER BY f.createdAt DESC
        `;
        const [favorites] = await db.query(query, [req.user.id]);
        res.status(200).json(favorites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { addFavorite, removeFavorite, getMyFavorites };
