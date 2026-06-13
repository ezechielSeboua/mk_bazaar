FROM php:8.4-apache

# 1. Installation des dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev \
    libzip-dev \
    libpq-dev \
    postgresql-server-dev-all \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 2. Installation des extensions PHP
RUN docker-php-ext-install pdo_pgsql pdo_mysql gd zip

# 3. Configuration Apache
RUN a2enmod rewrite
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# 4. Installation de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Copie du code et installation des dépendances Laravel
COPY . /var/www/html
RUN composer install --no-dev --optimize-autoloader

# 6. Gestion des permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 7. Entrypoint : Nettoyage, Migration, Lien de stockage et démarrage d'Apache
RUN echo '#!/bin/sh' > /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "Nettoyage des caches Laravel..."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'php /var/www/html/artisan optimize:clear' >> /usr/local/bin/docker-entrypoint.sh && \
    # echo 'echo "Configuration du lien de stockage..."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'php /var/www/html/artisan storage:link --force' >> /usr/local/bin/docker-entrypoint.sh && \
    # echo 'echo "Lancement des migrations et seeders..."' >> /usr/local/bin/docker-entrypoint.sh && \
    # echo 'php /var/www/html/artisan migrate:fresh --seed --force' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'php /var/www/html/artisan migrate --force' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'apache2-foreground' >> /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]