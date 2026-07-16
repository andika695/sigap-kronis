# syntax=docker/dockerfile:1
#
# SIGAP-Kronis — image aplikasi (Apache + PHP 8.2 + hasil build React).
# MySQL & phpMyAdmin TIDAK ada di sini; keduanya sudah berjalan sebagai
# container terpisah di network `mybridge`.

# ── Tahap 1: build aset frontend ─────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Dependensi disalin lebih dulu supaya layer npm ci tidak ikut batal
# cache-nya setiap kali kode sumber berubah.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Di Docker aplikasi dilayani dari root, bukan /SIGAP-Kronis/dist/ seperti
# XAMPP. Satu variabel ini mengatur path aset, basename router, dan alamat API.
ENV APP_BASE=/
RUN npm run build

# ── Tahap 2: runtime PHP + Apache ────────────────────────────────────────
FROM php:8.2-apache

# pdo_mysql: driver basis data. rewrite: routing SPA & front controller API.
# headers: aturan Cache-Control di .htaccess.
RUN docker-php-ext-install pdo_mysql \
 && a2enmod rewrite headers \
 && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/apache.conf /etc/apache2/conf-enabled/sigap.conf

# Hasil build ada di root; API jadi subdirektori /api.
COPY --from=build /app/dist/ /var/www/html/
COPY api/ /var/www/html/api/

# .htaccess bawaan proyek memakai RewriteBase /SIGAP-Kronis/… (khas XAMPP).
# Di Docker path-nya root, jadi keduanya ditimpa versi Docker.
COPY docker/app.htaccess /var/www/html/.htaccess
COPY docker/api.htaccess /var/www/html/api/.htaccess

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD php -r 'exit(@file_get_contents("http://localhost/api") ? 0 : 1);'
