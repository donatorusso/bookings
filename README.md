# Bookings — Laravel 12 on Ubuntu (Docker + Nginx, Development Setup)

> **Technical Test: Booking Platform**  
> This project is a **development-only** environment for a Laravel 12 booking application.  
> It is designed for local testing and demonstration purposes — **not for production use**.

---

This README explains how to install and run the **bookings** Laravel **v12** project on an **Ubuntu** server.

Files and app layout:
- `docker-compose.yml` at repo root (services: `app`, `node`, `mysql`, `nginx`).
- Nginx vhost: `./nginx/bookings.conf` (443/80) proxying to `http://app:8000`.
- TLS files at `./nginx/ssl/` (see below).
- Laravel app lives at `./booking_app`.
- Domain accessed as **https://bookings** (use `/etc/hosts` for dev).

> Target stack: Ubuntu + Docker + Docker Compose v2 • Laravel **12**

---

## Table of Contents

1. [Prerequisites (Ubuntu 22.04/24.04)](#1-prerequisites-ubuntu-22042404)
2. [Repository layout](#2-repository-layout)
3. [Domain & TLS](#3-domain--tls)
4. [Environment (`booking_app/.env`)](#4-environment-booking_appenv)
5. [Dockerfile](#5-dockerfile)
6. [Create the database (no passwords in repo)](#6-create-the-database-no-passwords-in-repo)
7. [Installation steps](#7-installation-steps)
8. [First-time Laravel setup](#8-first-time-laravel-setup)
9. [Access the app](#9-access-the-app)
10. [Run without Docker or Nginx](#10-run-without-docker-or-nginx)
11. [Testing](#11-testing)
12. [Quick start](#12-quick-start)

---

## 1) Prerequisites (Ubuntu 22.04/24.04)

- Git  
- Docker Engine and Docker Compose v2  

Install Docker (if needed):

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2) Repository layout

```
.
├── docker-compose.yml
├── Dockerfile
├── nginx/
│   ├── bookings.conf
│   └── ssl/
│       ├── bookings.local.pem
│       └── bookings.local-key.pem
└── booking_app/
    ├── public/
    ├── tests/
    │   └── Feature/
    │       ├── CreateBookingTest.php
	│       ├── PreventOverlappingBookingTest
    │       └── RetrieveWeeklyBookingsTest.php
    ├── .env.testing
    └── (Laravel source)
```

---

## 3) Domain & TLS

Nginx config expects `server_name bookings` and redirects HTTP→HTTPS.

Add this line to your `/etc/hosts`:
```
<SERVER_IP>  bookings
```

Create self-signed certs (for dev/testing):

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048   -keyout nginx/ssl/bookings.local-key.pem   -out nginx/ssl/bookings.local.pem   -subj "/C=GB/ST=England/L=London/O=MyCompany/OU=Dev/CN=bookings"
```

---

## 4) Environment (`booking_app/.env`)

Keep `.env` **out of version control** and replace secrets with your own values.

```dotenv
APP_NAME=Bookings
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=https://bookings

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=<DB_NAME>
DB_USERNAME=<DB_USER>
DB_PASSWORD=<DB_PASSWORD>

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
```

---

## 5) Dockerfile

- PHP **8.3** runtime  
- Composer installed  
- Working directory `/var/www/html`  
- Runs `php artisan serve` on port 8000  
- PHP extensions for a typical Laravel setup: `pdo_mysql`, `mbstring`, `zip`, `exif`, `bcmath`.

If switching to PHP-FPM, update Nginx to `fastcgi_pass app:9000`.

---

## 6) Create the database (no passwords in repo)

You can either **let Docker create the database automatically** (recommended for local development)  
or **create it manually** inside the MySQL container.

**Option A — Docker automatic creation**

Add the database credentials to the MySQL service in the docker-compose.yml file, then start MySQL
```bash
docker compose up -d mysql
```
Add the same credentials in the Laravel .env file.

**Option B — Manual creation**
```bash
docker compose exec mysql mysql -uroot -p
CREATE DATABASE <DB_NAME> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '<DB_USER>'@'%' IDENTIFIED BY '<DB_PASSWORD>';
GRANT ALL PRIVILEGES ON <DB_NAME>.* TO '<DB_USER>'@'%';
FLUSH PRIVILEGES;
```

---

## 7) Installation steps

Follow these steps to build and launch the entire Laravel environment.

### Step 1 — Build Docker images
```bash
docker compose build
```

### Step 2 — Install backend dependencies (Composer)
```bash
docker compose exec app composer install --no-interaction --prefer-dist
```

### Step 3 — Install frontend dependencies (Node)
```bash
docker compose run --rm -u $(id -u):$(id -g) node npm ci
```

### Step 4 — Start all containers
```bash
docker compose up -d
```

### Step 5 — Verify services
```bash
docker compose ps
```

You should see containers for: `app`, `mysql`, `node`, `nginx`.

---

## 8) First-time Laravel setup

```bash
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan storage:link
```

Build frontend (Laravel Mix / webpack):
```bash
docker compose run --rm -u $(id -u):$(id -g) node npm ci
```

---

## 9) Access the app

Visit **https://bookings**

---

## 10) Run without Docker or Nginx

If you prefer to run the project **without Docker**, you can set it up directly on your Ubuntu system.

### Steps

```bash
# 1. Clone the repository
git clone <repo_url> bookings
cd bookings/booking_app

# 2. Install PHP dependencies
composer install

# 3. Copy environment file
cp .env.example .env

# 4. Generate application key
php artisan key:generate

# 5. Create the database manually
mysql -u root -p
CREATE DATABASE bookings CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 6. Update the .env file with your DB credentials
# Example:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=bookings
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# 7. Run migrations and seed data
php artisan migrate --seed

# 8. Create storage link
php artisan storage:link

# 9. Install Node.js dependencies
npm install

# 10. Build frontend assets (for development)
npm run dev

# 11. Start Laravel’s built-in development server
php artisan serve
```

Then visit the app at **http://127.0.0.1:8000**

---

## 11) Testing

Laravel includes PHPUnit for automated testing.  
You can run the test suite from within the **app** container.

Note: make sure the APP_KEY in .env.testing matches the one in your .env file 

### Run all tests
```bash
docker compose exec app php artisan test
```

### Run specific test file or class
```bash
docker compose exec app php artisan test tests/Feature/BookingTest.php
```

---

## 12) Quick start

```bash
docker compose build
docker compose up -d
docker compose exec app composer install --no-interaction --prefer-dist
docker compose exec app php artisan key:generate --force
docker compose exec app php artisan migrate --force
docker compose exec app php artisan storage:link
docker compose exec node npm ci
docker compose exec node npm run dev
```

Then open **https://bookings**
