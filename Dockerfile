FROM php:8.3-cli-alpine

# Install required packages
RUN apk add --no-cache \
    git \
    curl \
    unzip \
    zip \
    libpng-dev \
    libxml2-dev \
    oniguruma-dev \
    zlib-dev \
    libzip-dev \
    mariadb-client \
    autoconf \
    g++ \
    make

# Install PHP extensions required by Laravel
RUN docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/bin --filename=composer

WORKDIR /var/www/html

