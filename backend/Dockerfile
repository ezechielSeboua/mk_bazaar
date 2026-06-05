FROM php:8.4-apache

# Installer les dépendances système et PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev \
    libzip-dev \
    libpq-dev \
    zip \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Installer les extensions PHP nécessaires (incluant pdo_pgsql pour PostgreSQL)
RUN docker-php-ext-install pdo_pgsql pdo_mysql gd zip

# Activer le module rewrite d'Apache (nécessaire pour les routes Laravel)
RUN a2enmod rewrite

# Copier le code du projet
COPY . /var/www/html

# Configurer Apache pour pointer sur le dossier 'public'
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Installer les dépendances PHP
RUN composer install --no-dev --optimize-autoloader

# Donner les permissions nécessaires
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80