@echo off
echo 🚀 MK BAZAAR Installation Script
echo ==================================

REM Install PHP dependencies
echo 📦 Installing PHP dependencies...
call composer install

REM Install Node dependencies
echo 📦 Installing Node dependencies...
call npm install

REM Create .env file
echo ⚙️  Creating .env file...
copy .env.example .env

REM Generate app key
echo 🔑 Generating application key...
call php artisan key:generate

REM Create storage symlink
echo 🔗 Creating storage symlink...
call php artisan storage:link

echo.
echo ✅ Installation complete!
echo.
echo 📝 Next steps:
echo 1. Configure your database in .env
echo 2. Run migrations: php artisan migrate
echo 3. Seed database: php artisan db:seed
echo 4. Start dev server: npm run dev (in one terminal)
echo 5. Start Laravel: php artisan serve (in another terminal)
echo.
echo 🌐 Access the app at: http://localhost:8000
