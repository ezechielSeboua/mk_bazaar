#!/bin/bash

echo "🚀 MK BAZAAR Installation Script"
echo "=================================="

# Install PHP dependencies
echo "📦 Installing PHP dependencies..."
composer install

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install

# Create .env file
echo "⚙️  Creating .env file..."
cp .env.example .env

# Generate app key
echo "🔑 Generating application key..."
php artisan key:generate

# Create storage symlink
echo "🔗 Creating storage symlink..."
php artisan storage:link

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure your database in .env"
echo "2. Run migrations: php artisan migrate"
echo "3. Seed database: php artisan db:seed"
echo "4. Start dev server: npm run dev (in one terminal)"
echo "5. Start Laravel: php artisan serve (in another terminal)"
echo ""
echo "🌐 Access the app at: http://localhost:8000"
