const db = require('../config/db');

const getStores = async (req, res) => {
    try {
        const [stores] = await db.query('SELECT * FROM Store');
        res.status(200).json(stores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getStoreById = async (req, res) => {
    try {
        const [store] = await db.query('SELECT * FROM Store WHERE id = ?', [req.params.id]);
        if (store.length === 0) {
            return res.status(404).json({ message: 'Magasin non trouvé' });
        }
        res.status(200).json(store[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const createStore = async (req, res) => {
    const { name, website, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom est requis' });

    let logoUrl = req.body.logo || null;
    if (req.file) {
        logoUrl = req.file.path;
    }

    try {
        const [result] = await db.query('INSERT INTO Store (name, logo, website, address) VALUES (?, ?, ?, ?)', [name, logoUrl, website || null, address || null]);
        res.status(201).json({ id: result.insertId, name, logo: logoUrl, website, address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const updateStore = async (req, res) => {
    const { name, website, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom est requis' });

    let logoUrl = req.body.logo || null;
    if (req.file) {
        logoUrl = req.file.path;
    }

    try {
        const [result] = await db.query('UPDATE Store SET name = ?, logo = ?, website = ?, address = ? WHERE id = ?', [name, logoUrl, website || null, address || null, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Magasin non trouvé' });
        res.status(200).json({ id: req.params.id, name, logo: logoUrl, website, address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const deleteStore = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Store WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Magasin non trouvé' });
        res.status(200).json({ message: 'Magasin supprimé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getStores, getStoreById, createStore, updateStore, deleteStore };
