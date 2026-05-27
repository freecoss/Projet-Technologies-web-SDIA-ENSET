# 🛒 Bch7al - Plateforme Collaborative de Suivi de Prix

**Bch7al** (qui signifie "Combien ?" en Darija marocaine) est une application web collaborative permettant aux consommateurs marocains de comparer, signaler et suivre les prix des produits du quotidien dans différents magasins et supermarchés.

## ✨ Fonctionnalités Principales

- **Recherche & Filtrage** : Trouvez rapidement un produit et filtrez les résultats par magasin ou catégorie.
- **Signalement de Prix (Crowdsourcing)** : La communauté peut ajouter et mettre à jour les prix observés en magasin avec preuve à l'appui.
- **Suivi & Historique** : Visualisez l'évolution des prix au fil du temps (prix moyen, prix minimum) via des graphiques.
- **Alertes de Prix** : Définissez un prix cible et recevez une notification dès que la communauté signale une baisse.
- **Réputation et Votes** : Gagnez des points de réputation en contribuant. La communauté peut voter pour confirmer ou infirmer un prix signalé.
- **Tableau de Bord Administrateur** : Modération des produits soumis, gestion des utilisateurs, catégories et magasins.

## 🛠️ Stack Technique

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (Styling moderne et responsive)
- **React Router** (Navigation)
- **Recharts** (Graphiques d'évolution des prix)

### Backend
- **Node.js / Express**
- **MySQL** (Base de données relationnelle) avec `mysql2`
- **JWT (JSON Web Tokens)** pour l'authentification
- **Cloudinary** (Hébergement des images de produits et de preuves)

---

## 🚀 Installation et Lancement

### 1. Prérequis
- Node.js (v16 ou supérieur)
- MySQL Server en cours d'exécution
- Un compte Cloudinary (pour le stockage d'images)

### 2. Configuration de la Base de Données
1. Créez une base de données nommée `bch7al` dans votre serveur MySQL.
2. Un script de seeding est fourni pour initialiser les tables et injecter quelques données de test (y compris un compte Administrateur).

### 3. Configuration du Backend
```bash
cd backend
npm install
```

Créez un fichier `.env` à la racine du dossier `backend` avec les variables suivantes :
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=bch7al
JWT_SECRET=une_cle_secrete_tres_complexe_et_longue
CORS_ORIGIN=http://localhost:5173

# Configuration Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

Lancez le serveur de développement :
```bash
npm run dev
```

### 4. Configuration du Frontend
```bash
cd frontend
npm install
```

Lancez le serveur frontend :
```bash
npm run dev
```

### 5. Accès
L'application sera accessible sur `http://localhost:5173`.

**Compte Administrateur par défaut (si script seed exécuté) :**
- Email : `admin@bch7al.ma`
- Mot de passe : `Admin123!`

---

## 🏗️ Architecture Récente
Ce projet bénéficie d'une architecture MVC robuste :
- **Couche Modèles** : Abstraction des requêtes SQL.
- **Sécurité** : Intercepteurs JWT frontend, middlewares de validation et protection des routes.
- **Gestion des Erreurs** : Middleware centralisé de gestion d'erreurs backend.

## 📝 Licence
Ce projet est développé dans le cadre académique/personnel.
