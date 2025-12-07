tall ---

## 🐳 Dockerized Setup

You can run the entire ERP system—including backend (Laravel), frontend (React/Inertia.js), MySQL database, and Android Java build—using Docker Compose for a consistent, production-like environment.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (latest)
- [Docker Compose](https://docs.docker.com/compose/) (v2+ recommended)

### 1. Environment Variables

- Copy `.env.example` to `.env` and update database credentials as needed:
  - `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` (see `docker-compose.yml`)
- For production, change all default passwords!

### 2. Build & Run

From the project root, run:

```bash
docker compose up --build
```

This will build and start the following services:

- **php-app** (Laravel backend + built frontend)
  - PHP 8.2 FPM (Alpine)
  - Composer 2.7, Node 20 (for asset build)
  - Exposes port **9000** (php-fpm)
- **java-android** (Android Java build)
  - Eclipse Temurin JDK 17
  - Exposes port **8080**
- **mysql-db** (MySQL database)
  - MySQL (latest)
  - Exposes port **3306**
  - Data persisted in `mysql-data` Docker volume

### 3. Accessing the Application

- The backend (php-fpm) runs on port **9000** inside the container. To serve HTTP traffic, you may need to add a web server (e.g., Nginx or Apache) as a reverse proxy, or use Laravel's built-in server for local development.
- The MySQL database is available on **localhost:3306** (if you map ports).
- The Android Java service exposes **8080** (adjust as needed for your workflow).

### 4. Special Notes

- The Docker setup builds frontend assets automatically and ensures correct permissions for storage and cache directories.
- For custom domains, SSL, or production deployment, further configuration is required.
- If you add a web server container, link it to `php-app:9000`.

---

## 📚 Database Migrations

This application uses a **multi-tenant architecture** with separate migration folders:

- **Central/Landlord migrations** (`database/migrations/`): Platform-level tables (tenants, plans, subscriptions, modules)
- **Tenant migrations** (`database/migrations/tenant/`): Tenant-specific tables (users, employees, HRM, payroll)

### Migration Commands

```bash
# Central database migrations
php artisan migrate

# Tenant database migrations (all tenants)
php artisan tenants:migrate

# Check migration status
php artisan migrate:status                    # Central
php artisan tenants:run migrate:status       # Tenants
```

### Documentation

- **[Migration Organization Guide](MIGRATION_ORGANIZATION_GUIDE.md)** - Comprehensive guide on migration structure
- **[Migration Verification Report](docs/MIGRATION_VERIFICATION_REPORT.md)** - Complete migration inventory and verification

---
