# 🚀 MK BAZAAR Quick Start Guide

## What's Been Created ✅

A **complete Laravel 11 + React 18 + Inertia.js** e-commerce platform with:
- Backend API with product/category management
- Image optimization (WebP auto-conversion)
- React frontend with Tailwind CSS
- WhatsApp dynamic link generation
- Admin dashboard
- Mobile-first responsive design

## 📦 Installation (5 minutes)

### Windows
```bash
cd "c:\Projects\MK BAZAAR"
install.bat
```

### Linux/macOS
```bash
cd "c:\Projects\MK BAZAAR"
bash install.sh
```

### Manual
```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

## 🔧 Configure Database

Edit `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mk_bazaar
DB_USERNAME=root
DB_PASSWORD=yourpassword

WHATSAPP_PHONE=+225XXXXXXXXXX
```

Then:
```bash
php artisan migrate
php artisan db:seed
```

## 🎯 Run Development

**Terminal 1** (Frontend):
```bash
npm run dev
```

**Terminal 2** (Backend):
```bash
php artisan serve
```

Access: **http://localhost:8000**

## 📂 Key Files to Know

### Frontend
- `resources/js/app.jsx` - React entry point
- `resources/js/pages/Home.jsx` - Homepage
- `resources/js/pages/ProductDetail.jsx` - Product page (has WhatsApp integration!)
- `resources/js/components/WhatsAppButton.jsx` - WhatsApp message generator
- `resources/js/components/ImageCarousel.jsx` - Product image gallery
- `tailwind.config.js` - Customize colors/fonts

### Backend
- `app/Http/Controllers/ProductController.php` - Product API
- `app/Http/Controllers/ImageController.php` - Image upload & optimization
- `app/Models/Product.php` - Product model
- `routes/api.php` - API routes
- `routes/web.php` - Web/Inertia routes
- `database/seeders/DatabaseSeeder.php` - Sample data

### Config
- `.env.example` - Environment template
- `vite.config.js` - Frontend bundler
- `postcss.config.js` - CSS processor
- `tailwind.config.js` - Tailwind setup
- `package.json` - Node dependencies
- `composer.json` - PHP dependencies

## 🔗 WhatsApp Integration

**Location**: [resources/js/components/WhatsAppButton.jsx](resources/js/components/WhatsAppButton.jsx#L5)

When user clicks "Acheter via WhatsApp", this generates:
```
Bonjour MK Bazaar, je souhaite commander l'article suivant:

Produit: [Product Name]
Option: [Selected Options]
Prix: [Price] FCFA
Lien: [Product URL]

Merci de me confirmer la disponibilité pour une livraison.
```

**To update phone number:**
1. `.env` → `WHATSAPP_PHONE=+225XXXXXXXXXX`
2. [resources/js/pages/Home.jsx](resources/js/pages/Home.jsx#L88) → Line 88
3. [resources/js/components/WhatsAppButton.jsx](resources/js/components/WhatsAppButton.jsx#L18) → Line 18

## 🎨 Customization

**Brand Colors**: [tailwind.config.js](tailwind.config.js#L6-L8)
- Primary: `#1f2937` (dark)
- Accent: `#f97316` (orange)

**Delivery Fees**: 
- [resources/js/pages/Home.jsx](resources/js/pages/Home.jsx#L81) (Homepage)
- [resources/js/pages/ProductDetail.jsx](resources/js/pages/ProductDetail.jsx#L67) (Product page)

**Categories**: Edit in admin dashboard or modify [database/seeders/DatabaseSeeder.php](database/seeders/DatabaseSeeder.php#L10)

## 📊 Admin Dashboard

Access: `http://localhost:8000/admin`

- Dashboard with stats
- Product management (create, edit, delete)
- Category management
- Image upload with automatic WebP optimization

## 📱 Responsive Design

- **Mobile (< 768px)**: 2-column grid, full-width
- **Desktop (≥ 768px)**: 4-column grid, optimized layout
- **Performance**: Optimized for 3G/4G networks

## 🐛 Troubleshooting

**Port 8000 already in use?**
```bash
php artisan serve --port=8001
```

**Database connection error?**
- Check `.env` database credentials
- Ensure MySQL is running
- Create database: `CREATE DATABASE mk_bazaar;`

**Images not uploading?**
```bash
php artisan storage:link
```

**Vite not compiling?**
```bash
rm -rf node_modules
npm install
npm run dev
```

## 📚 Documentation

- [Full README.md](README.md) - Complete project documentation
- [API Routes](routes/api.php) - All endpoint definitions
- [Database Schema](database/migrations/) - Table structures
- [Installation Scripts](install.bat) - Automated setup

## ✨ Next Steps

1. ✅ Project is scaffolded
2. ⏭️ Run `install.bat` or `composer install && npm install`
3. ⏭️ Configure `.env` with database
4. ⏭️ Run migrations: `php artisan migrate`
5. ⏭️ Start dev servers: `npm run dev` + `php artisan serve`
6. ⏭️ Access app at `http://localhost:8000`
7. ⏭️ Customize colors, phone number, and content

---

**Ready?** Start with step 2! 🚀
