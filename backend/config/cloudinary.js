const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configuration de Cloudinary avec les variables d'environnement
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration du stockage Multer pour uploader directement vers Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'bch7al_products', // Le dossier dans lequel les images seront stockées sur Cloudinary
        allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }] // Redimensionnement automatique pour optimiser
    }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
