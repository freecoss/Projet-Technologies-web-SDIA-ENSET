const db = require('../config/db');

const getMyNotifications = async (req, res) => {
    try {
        const [notifications] = await db.query(
            'SELECT * FROM Notification WHERE user_id = ? ORDER BY createdAt DESC',
            [req.user.id]
        );
        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE Notification SET isRead = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        res.status(200).json({ message: 'Notification lue' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE Notification SET isRead = TRUE WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json({ message: 'Toutes les notifications sont lues' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
