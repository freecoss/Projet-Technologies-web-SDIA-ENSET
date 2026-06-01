const db = require('../config/db');

const addPrice = async (req, res) => {
    const { amount, product_id, store_id } = req.body;
    const proofImage = req.file ? req.file.path : (req.body.proofImage || null);

    if (!amount || !product_id || !store_id) {
        return res.status(400).json({ message: 'Le montant, le produit et le magasin sont requis' });
    }

    try {
        const initialStatus = (req.user.role === 'admin' || req.user.role === 'moderator') ? 'active' : 'pending';

        const [result] = await db.query(
            'INSERT INTO Price (amount, proofImage, status, user_id, product_id, store_id) VALUES (?, ?, ?, ?, ?, ?)',
            [amount, proofImage || null, initialStatus, req.user.id, product_id, store_id]
        );
        
        // Notifications pour les favoris
        const [product] = await db.query('SELECT name FROM Product WHERE id = ?', [product_id]);
        const productName = product.length > 0 ? product[0].name : 'Un produit';
        
        const [favorites] = await db.query('SELECT user_id FROM Favorite WHERE product_id = ? AND user_id != ?', [product_id, req.user.id]);
        if (favorites.length > 0) {
            const notifValues = favorites.map(f => [
                'Nouveau prix signalé !', 
                `Un nouveau prix de ${amount} DH a été signalé pour ${productName} (dans vos favoris).`, 
                f.user_id
            ]);
            await db.query('INSERT INTO Notification (title, message, user_id) VALUES ?', [notifValues]);
        }

        // Déclenchement des alertes de prix
        const [alerts] = await db.query('SELECT id, user_id, targetPrice FROM Alert WHERE product_id = ? AND active = TRUE', [product_id]);
        const triggeredAlerts = alerts.filter(a => parseFloat(amount) <= parseFloat(a.targetPrice));
        
        if (triggeredAlerts.length > 0) {
            const alertNotifValues = triggeredAlerts.map(a => [
                '🚨 Alerte de prix atteinte !', 
                `Le prix de ${productName} a baissé à ${amount} DH (votre objectif était de ${a.targetPrice} DH).`, 
                a.user_id
            ]);
            await db.query('INSERT INTO Notification (title, message, user_id) VALUES ?', [alertNotifValues]);
            
            // Désactiver les alertes déclenchées
            const triggeredAlertIds = triggeredAlerts.map(a => a.id);
            await db.query('UPDATE Alert SET active = FALSE WHERE id IN (?)', [triggeredAlertIds]);
        }

        res.status(201).json({ id: result.insertId, amount, product_id, store_id, user_id: req.user.id, status: 'active' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const updatePrice = async (req, res) => {
    const { amount, proofImage, status } = req.body;
    
    try {
        const [prices] = await db.query('SELECT * FROM Price WHERE id = ?', [req.params.id]);
        
        if (prices.length === 0) {
            return res.status(404).json({ message: 'Prix non trouvé' });
        }

        const price = prices[0];

        if (price.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({ message: 'Non autorisé à modifier ce prix' });
        }

        const newStatus = ((req.user.role === 'admin' || req.user.role === 'moderator') && status) ? status : price.status;

        await db.query(
            'UPDATE Price SET amount = ?, proofImage = ?, status = ? WHERE id = ?',
            [amount || price.amount, proofImage || price.proofImage, newStatus, req.params.id]
        );
        
        res.status(200).json({ id: req.params.id, message: 'Prix mis à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getPricesByProduct = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const query = `
            SELECT p.id, p.amount, p.observedAt, p.status, p.proofImage, 
                   s.name as store_name, s.logo as store_logo,
                   u.name as user_name,
                   prod.name as product_name,
                   IFNULL(SUM(CASE WHEN v.type = 'upvote' THEN v.weight END), 0) as upvotes,
                   IFNULL(SUM(CASE WHEN v.type = 'downvote' THEN v.weight END), 0) as downvotes,
                   MAX(CASE WHEN v.user_id = ? THEN v.type ELSE NULL END) as userVote
            FROM Price p
            JOIN Store s ON p.store_id = s.id
            JOIN User u ON p.user_id = u.id
            JOIN Product prod ON p.product_id = prod.id
            LEFT JOIN Vote v ON p.id = v.price_id
            WHERE p.product_id = ? AND p.status != 'rejected'
            GROUP BY p.id
            ORDER BY 
                CASE WHEN p.status = 'active' THEN 0 ELSE 1 END, 
                (IFNULL(SUM(CASE WHEN v.type = 'upvote' THEN v.weight END), 0) - IFNULL(SUM(CASE WHEN v.type = 'downvote' THEN v.weight END), 0)) DESC, 
                p.amount ASC
        `;
        const [prices] = await db.query(query, [userId, req.params.productId]);
        res.status(200).json(prices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getPriceStats = async (req, res) => {
    try {
        const productId = req.params.productId;
        
        const summaryQuery = `
            SELECT 
                (
                    SELECT pr.amount
                    FROM Price pr
                    LEFT JOIN Vote v ON pr.id = v.price_id
                    WHERE pr.product_id = p.product_id AND pr.status = 'active'
                    GROUP BY pr.id
                    ORDER BY (IFNULL(SUM(CASE WHEN v.type = 'upvote' THEN v.weight END), 0) - IFNULL(SUM(CASE WHEN v.type = 'downvote' THEN v.weight END), 0)) DESC, pr.amount ASC
                    LIMIT 1
                ) as min_price,
                MAX(p.amount) as max_price,
                AVG(p.amount) as avg_price
            FROM Price p
            WHERE p.product_id = ? AND p.status = 'active'
            GROUP BY p.product_id
        `;
        const [summary] = await db.query(summaryQuery, [productId, productId]);

        const historyQuery = `
            SELECT 
                DATE(observedAt) as date,
                MIN(amount) as min_price,
                AVG(amount) as avg_price
            FROM Price
            WHERE product_id = ? AND status = 'active'
            GROUP BY DATE(observedAt)
            ORDER BY date ASC
        `;
        const [history] = await db.query(historyQuery, [productId]);

        res.status(200).json({
            summary: summary[0],
            history: history
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { addPrice, updatePrice, getPricesByProduct, getPriceStats };
