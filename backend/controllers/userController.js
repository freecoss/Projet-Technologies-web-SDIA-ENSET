const db = require('../config/db');
const User = require('../models/User');

const getUsers = async (req, res, next) => {
    try {
        const [users] = await db.query('SELECT id, name, email, avatar, role, reputation, createdAt FROM User ORDER BY createdAt DESC');
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

const updateUserRole = async (req, res, next) => {
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide' });
    }

    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        await db.query('UPDATE User SET role = ? WHERE id = ?', [role, req.params.id]);
        
        res.status(200).json({ message: 'Rôle mis à jour avec succès' });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res) => {
    try {
        const [user] = await db.query('SELECT * FROM User WHERE id = ?', [req.params.id]);
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (user[0].id === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte admin' });
        }

        await db.query('DELETE FROM User WHERE id = ?', [req.params.id]);
        
        res.status(200).json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getUsers, getUserById, updateUserRole, deleteUser };
