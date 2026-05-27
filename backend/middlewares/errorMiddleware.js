const errorHandler = (err, req, res, next) => {
    console.error(`[Erreur] ${err.message}`);
    console.error(err.stack);

    // Erreurs SQL
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json({
            message: 'Erreur au niveau de la base de données',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erreur interne du serveur';

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = { errorHandler };
