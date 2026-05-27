const db = require('../config/db');
const Product = require('../models/Product');

const getProducts = async (req, res, next) => {
    try {
        const { search, category, store, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { products, total } = await Product.findAll({
            search, category, store, minPrice, maxPrice, limit, offset
        });

        res.status(200).json({
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const { name, description, brand, category_id } = req.body;
        const image = req.file ? req.file.path : null;

        const insertId = await Product.create({
            name, description, brand, category_id, image, user_id: req.user.id
        });
        
        res.status(201).json({ 
            id: insertId, name, description, brand, category_id, image, user_id: req.user.id, status: 'pending' 
        });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res) => {
    const { name, description, brand, image, category_id } = req.body;
    
    try {
        const [product] = await db.query('SELECT * FROM Product WHERE id = ?', [req.params.id]);
        
        if (product.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        if (product[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé à modifier ce produit' });
        }

        await db.query(
            'UPDATE Product SET name = ?, description = ?, brand = ?, image = ?, category_id = ? WHERE id = ?',
            [name || product[0].name, description || product[0].description, brand || product[0].brand, image || product[0].image, category_id || product[0].category_id, req.params.id]
        );
        
        res.status(200).json({ id: req.params.id, message: 'Produit mis à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const [product] = await db.query('SELECT * FROM Product WHERE id = ?', [req.params.id]);
        
        if (product.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        if (product[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé à supprimer ce produit' });
        }

        await db.query('DELETE FROM Product WHERE id = ?', [req.params.id]);
        
        res.status(200).json({ message: 'Produit supprimé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getPendingProducts = async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.name as category_name, u.name as user_name
            FROM Product p
            LEFT JOIN Category c ON p.category_id = c.id
            LEFT JOIN User u ON p.user_id = u.id
            WHERE p.status = 'pending'
            ORDER BY p.createdAt ASC
        `;
        const [products] = await db.query(query);
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const updateProductStatus = async (req, res) => {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }

    try {
        const [product] = await db.query('SELECT * FROM Product WHERE id = ?', [req.params.id]);
        
        if (product.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        await db.query('UPDATE Product SET status = ? WHERE id = ?', [status, req.params.id]);
        
        // Notification
        const notifTitle = status === 'approved' ? 'Produit validé !' : 'Produit refusé';
        const notifMsg = status === 'approved' 
            ? `Votre produit "${product[0].name}" a été approuvé et est maintenant visible par tous.`
            : `Votre produit "${product[0].name}" a été refusé par la modération.`;

        await db.query(
            'INSERT INTO Notification (title, message, user_id) VALUES (?, ?, ?)',
            [notifTitle, notifMsg, product[0].user_id]
        );
        
        // Impact réputation si approuvé
        if (status === 'approved' && product[0].user_id) {
            await db.query('UPDATE User SET reputation = reputation + 10 WHERE id = ?', [product[0].user_id]);
        }
        
        res.status(200).json({ message: `Produit ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getMyProducts = async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.name as category_name
            FROM Product p
            LEFT JOIN Category c ON p.category_id = c.id
            WHERE p.user_id = ?
            ORDER BY p.createdAt DESC
        `;
        const [products] = await db.query(query, [req.user.id]);
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getPendingProducts, 
    updateProductStatus,
    getMyProducts
};
