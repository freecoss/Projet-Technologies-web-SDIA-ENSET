const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    try {
        const [userExists] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
        if (userExists.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO User (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            email,
            role: 'user',
            token: generateToken(result.insertId)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe' });
    }

    try {
        const [users] = await db.query('SELECT * FROM User WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                token: generateToken(user.id)
            });
        } else {
            res.status(401).json({ message: 'Identifiants invalides' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

const logoutUser = (req, res) => {
    res.status(200).json({ message: 'Déconnexion réussie' });
};

const updateProfile = async (req, res) => {
    const { name, email, password } = req.body;
    const avatar = req.file ? req.file.path : req.body.avatar;

    try {
        let updateQuery = 'UPDATE User SET ';
        const queryParams = [];
        const updates = [];

        if (name) {
            updates.push('name = ?');
            queryParams.push(name);
        }
        if (email) {
            updates.push('email = ?');
            queryParams.push(email);
        }
        if (avatar) {
            updates.push('avatar = ?');
            queryParams.push(avatar);
        }
        
        const oldPassword = req.body.oldPassword;
        const newPassword = req.body.newPassword;
        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ message: "L'ancien mot de passe est requis pour le modifier" });
            }
            
            // Fetch current user to verify old password
            const [currentUser] = await db.query('SELECT password FROM User WHERE id = ?', [req.user.id]);
            const isMatch = await bcrypt.compare(oldPassword, currentUser[0].password);
            
            if (!isMatch) {
                return res.status(401).json({ message: "L'ancien mot de passe est incorrect" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            updates.push('password = ?');
            queryParams.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        queryParams.push(req.user.id);

        await db.query(updateQuery, queryParams);

        const [users] = await db.query('SELECT id, name, email, avatar, role, reputation FROM User WHERE id = ?', [req.user.id]);
        
        res.status(200).json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser,
    updateProfile
};
