const db = require('../config/db');

const createAlert = async (req, res) => {
    const { targetPrice, productId } = req.body;

    if (!targetPrice || !productId) {
        return res.status(400).json({ message: 'Veuillez fournir un prix cible et un produit' });
    }

    try {
        // Vérifier si une alerte existe déjà pour ce produit et cet utilisateur
        const [existingAlert] = await db.query(
            'SELECT * FROM Alert WHERE user_id = ? AND product_id = ?',
            [req.user.id, productId]
        );

        if (existingAlert.length > 0) {
            // Mettre à jour l'alerte existante
            await db.query(
                'UPDATE Alert SET targetPrice = ?, active = TRUE WHERE id = ?',
                [targetPrice, existingAlert[0].id]
            );
            return res.status(200).json({ message: 'Alerte mise à jour avec succès' });
        }

        // Créer une nouvelle alerte
        await db.query(
            'INSERT INTO Alert (targetPrice, user_id, product_id) VALUES (?, ?, ?)',
            [targetPrice, req.user.id, productId]
        );

        res.status(201).json({ message: 'Alerte créée avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'alerte' });
    }
};

const getMyAlerts = async (req, res) => {
    try {
        const query = `
            SELECT a.*, p.name as product_name, p.image as product_image
            FROM Alert a
            JOIN Product p ON a.product_id = p.id
            WHERE a.user_id = ?
            ORDER BY a.createdAt DESC
        `;
        const [alerts] = await db.query(query, [req.user.id]);
        res.status(200).json(alerts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const deleteAlert = async (req, res) => {
    try {
        const [alert] = await db.query('SELECT * FROM Alert WHERE id = ?', [req.params.id]);

        if (alert.length === 0) {
            return res.status(404).json({ message: 'Alerte non trouvée' });
        }

        if (alert[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé à supprimer cette alerte' });
        }

        await db.query('DELETE FROM Alert WHERE id = ?', [req.params.id]);
        res.status(200).json({ message: 'Alerte supprimée' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    createAlert,
    getMyAlerts,
    deleteAlert
};
