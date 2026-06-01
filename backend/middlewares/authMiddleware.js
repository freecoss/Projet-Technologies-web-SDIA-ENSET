const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const [users] = await db.query('SELECT id, name, email, avatar, role, reputation FROM User WHERE id = ?', [decoded.id]);
            
            if (users.length === 0) {
                return res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé' });
            }
            
            if (users[0].role === 'banned') {
                return res.status(403).json({ message: 'Accès interdit, votre compte a été banni suite à un score de réputation trop faible.' });
            }

            req.user = users[0];
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Non autorisé, token invalide' });
        }
    } else {
        return res.status(401).json({ message: 'Non autorisé, pas de token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Non autorisé : le rôle '${req.user ? req.user.role : 'inconnu'}' n'a pas accès à cette ressource` });
        }
        next();
    };
};

const optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [users] = await db.query('SELECT id, role FROM User WHERE id = ?', [decoded.id]);
            if (users.length > 0) {
                req.user = users[0];
            }
        } catch (error) {
            // Ne pas bloquer si le token est invalide, continuer en tant que visiteur
        }
    }
    return next();
};

module.exports = { protect, authorize, optionalAuth };
