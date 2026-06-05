# Utiliser une image PHP officielle
FROM php:8.4-apache

# Installer les dépendances système
RUN apt-get update && apt-get install -y libpng-dev libzip-dev zip unzip

# Installer les extensions PHP nécessaires
RUN docker-php-ext-install pdo_pgsql gd zip

# Copier le code du projet
COPY . /var/www/html

# Configurer Apache
RUN sed -i 's/var\/www\/html/var\/www\/html\/public/g' /etc/apache2/sites-available/000-default.conf

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Donner les permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80