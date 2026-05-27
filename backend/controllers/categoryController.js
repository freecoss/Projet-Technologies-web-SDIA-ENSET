const db = require('../config/db');

const getCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM Category');
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const [category] = await db.query('SELECT * FROM Category WHERE id = ?', [req.params.id]);
        if (category.length === 0) {
            return res.status(404).json({ message: 'Catégorie non trouvée' });
        }
        res.status(200).json(category[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const createCategory = async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom est requis' });

    try {
        const [result] = await db.query('INSERT INTO Category (name, description) VALUES (?, ?)', [name, description || null]);
        res.status(201).json({ id: result.insertId, name, description });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const updateCategory = async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom est requis' });

    try {
        const [result] = await db.query('UPDATE Category SET name = ?, description = ? WHERE id = ?', [name, description || null, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Catégorie non trouvée' });
        res.status(200).json({ id: req.params.id, name, description });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Category WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Catégorie non trouvée' });
        res.status(200).json({ message: 'Catégorie supprimée' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
