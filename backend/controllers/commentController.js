const db = require('../config/db');

const getCommentsByProduct = async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.content, c.createdAt, u.name as user_name, u.avatar as user_avatar, u.id as user_id
            FROM Comment c
            JOIN User u ON c.user_id = u.id
            WHERE c.product_id = ?
            ORDER BY c.createdAt DESC
        `;
        const [comments] = await db.query(query, [req.params.productId]);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const addComment = async (req, res) => {
    const { content } = req.body;
    const productId = req.params.productId;

    if (!content) {
        return res.status(400).json({ message: 'Le contenu est requis' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO Comment (content, user_id, product_id) VALUES (?, ?, ?)',
            [content, req.user.id, productId]
        );
        
        // Notification pour le créateur du produit
        const [product] = await db.query('SELECT name, user_id FROM Product WHERE id = ?', [productId]);
        if (product.length > 0 && product[0].user_id && product[0].user_id !== req.user.id) {
            await db.query(
                'INSERT INTO Notification (title, message, user_id) VALUES (?, ?, ?)',
                ['Nouveau commentaire', `Quelqu'un a commenté votre produit ${product[0].name}.`, product[0].user_id]
            );
        }

        res.status(201).json({ id: result.insertId, content, user_id: req.user.id, product_id: productId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const updateComment = async (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ message: 'Le contenu est requis' });
    }

    try {
        const [comments] = await db.query('SELECT * FROM Comment WHERE id = ?', [req.params.id]);
        
        if (comments.length === 0) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }

        if (comments[0].user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({ message: 'Non autorisé à modifier ce commentaire' });
        }

        await db.query('UPDATE Comment SET content = ? WHERE id = ?', [content, req.params.id]);
        
        res.status(200).json({ id: req.params.id, message: 'Commentaire mis à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const deleteComment = async (req, res) => {
    try {
        const [comments] = await db.query('SELECT * FROM Comment WHERE id = ?', [req.params.id]);
        
        if (comments.length === 0) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }

        if (comments[0].user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({ message: 'Non autorisé à supprimer ce commentaire' });
        }

        await db.query('DELETE FROM Comment WHERE id = ?', [req.params.id]);
        
        res.status(200).json({ message: 'Commentaire supprimé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getCommentsByProduct, addComment, updateComment, deleteComment };
