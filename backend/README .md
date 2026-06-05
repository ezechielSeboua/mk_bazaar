# MK BAZAAR - Accessoires de Mode Haut de Gamme

Boutique e-commerce ivoirienne pour accessoires de mode (bagues, colliers, montres, sacs) avec catalogue interactif et intégration WhatsApp.

## 🎯 Tech Stack

- **Backend**: Laravel 11+ avec API REST
- **Frontend**: React 18+ avec Tailwind CSS
- **Integration**: Inertia.js (Laravel + React sans API séparée)
- **Database**: MySQL/PostgreSQL
- **Image Optimization**: WebP avec Intervention Image
- **Bundler**: Vite

## 📋 Fonctionnalités

### Frontend
- ✅ Homepage avec hero section et catégories
- ✅ Galerie produits avec filtrage/tri (2 col mobile, 4 col desktop)
- ✅ Carrousel d'images tactile
- ✅ Gestion dynamique des options (couleur, taille)
- ✅ Bouton WhatsApp avec message auto-généré
- ✅ Indicateur de stock
- ✅ Widget WhatsApp flottant
- ✅ Performance <1s sur mobile (3G/4G)

### Backend
- ✅ Authentification admin sécurisée
- ✅ CRUD Produits avec images multi-upload
- ✅ CRUD Catégories
- ✅ Optimisation images automatique (WebP)
- ✅ API RESTful pour toutes les opérations

### Admin
- ✅ Tableau de bord statistiques
- ✅ Gestion produits/catégories
- ✅ Upload images optimisées
- ✅ Mobile-first design pour gestion smartphone

## 🚀 Installation

### Prérequis
- PHP 8.2+
- Node.js 18+
- MySQL 8+ ou PostgreSQL
- Composer

### Setup Développement

```bash
# 1. Cloner le projet
cd "c:\Projects\MK BAZAAR"

# 2. Copier l'env et configurer la DB
cp .env.example .env

# 3. Installer dépendances Laravel
composer install

# 4. Générer clé app
php artisan key:generate

# 5. Créer DB et lancer migrations
php artisan migrate

# 6. Installer dépendances Node
npm install

# 7. Démarrer dev server
npm run dev

# 8. Démarrer Laravel (dans autre terminal)
php artisan serve
```

L'app sera accessible sur `http://localhost:8000`

## 📱 Tunnel WhatsApp

Quand un client clique sur "Acheter via WhatsApp", un message pré-formaté est généré:

```
Bonjour MK Bazaar, je souhaite commander l'article suivant:

Produit: [Nom]
Option: [Couleur/Taille]
Prix: [Prix] FCFA
Lien: [URL fiche produit]

Merci de me confirmer la disponibilité pour une livraison.
```

**À configurer dans `.env`:**
```
WHATSAPP_PHONE=+225XXXXXXXXXX
```

## 🎨 Customization

### Couleurs Brand
Modifier dans `tailwind.config.js`:
```js
colors: {
  primary: '#1f2937',
  accent: '#f97316',
}
```

### Tarifs Livraison
Mettre à jour dans:
- [resources/js/pages/Home.jsx](resources/js/pages/Home.jsx) (affichage client)
- [resources/js/pages/ProductDetail.jsx](resources/js/pages/ProductDetail.jsx)

### Logo & Branding
- Mettre logo dans `public/logo.png`
- Mettre favicon dans `public/favicon.ico`

## 📂 Structure Projet

```
.
├── app/
│   ├── Http/Controllers/          # Controllers API
│   │   ├── ProductController.php
│   │   ├── CategoryController.php
│   │   └── ImageController.php
│   └── Models/                    # Eloquent Models
│       ├── Product.php
│       ├── Category.php
│       └── ProductImage.php
├── database/
│   ├── migrations/                # Schéma DB
│   └── seeders/                   # Données test
├── resources/
│   ├── js/
│   │   ├── pages/                 # Pages React
│   │   ├── components/            # Composants React
│   │   └── app.jsx                # Entry point
│   └── views/
│       └── app.blade.php          # Main layout
├── routes/
│   ├── api.php                    # Routes API
│   └── web.php                    # Routes Web/Inertia
├── public/                        # Assets statiques
└── storage/
    └── app/products/              # Images produits
```

## 🔐 Sécurité

- ✅ HTTPS en production
- ✅ CSRF protection
- ✅ Rate limiting API
- ✅ Authentification middleware
- ✅ Validation input côté serveur

## 🚀 Déploiement

### Heroku / Vercel / AWS

```bash
# Build frontend
npm run build

# Préparer Laravel
composer install --no-dev
php artisan config:cache
php artisan route:cache

# Migrater DB
php artisan migrate --force
```

## 📞 Support

Pour WhatsApp intégration: https://wa.me/225XXXXXXXXXX

## 📄 License

MIT
