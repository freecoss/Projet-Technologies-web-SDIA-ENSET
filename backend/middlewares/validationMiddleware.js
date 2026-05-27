const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    next();
};

const validateProduct = (req, res, next) => {
    const { name, category_id } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Le nom du produit est requis' });
    }

    if (category_id && isNaN(parseInt(category_id))) {
        return res.status(400).json({ message: 'L\'ID de catégorie doit être un nombre valide' });
    }

    next();
};

const validatePrice = (req, res, next) => {
    const { amount, store_id, product_id } = req.body;

    if (amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Un montant valide supérieur à 0 est requis' });
    }

    if (store_id && isNaN(parseInt(store_id))) {
        return res.status(400).json({ message: 'L\'ID du magasin doit être un entier valide' });
    }
    
    if (product_id && isNaN(parseInt(product_id))) {
        return res.status(400).json({ message: 'L\'ID du produit doit être un entier valide' });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateProduct,
    validatePrice
};
