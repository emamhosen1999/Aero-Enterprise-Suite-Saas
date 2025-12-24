# Installation Guide (Aero HRM)

This guide covers both Standalone (single-tenant) and SaaS (multi-tenant) setups.

## Requirements
- PHP: 8.2+
- Database: MySQL 8+ or MariaDB 10.5+
- Node.js: 18+
- Composer: 2+
- Web Server: Nginx/Apache
- Optional: Redis for queues/cache

## 1. File Upload
- Upload/unzip the provided `aero-hrm-release.zip` to your web root.
- Point your virtual host to `public/`.

## 2. Environment Setup
Copy `.env.example` to `.env` and set:

- Standalone:
  - `APP_URL=http://your-domain.test`
  - `DB_CONNECTION=mysql`
  - `DB_DATABASE=your_db`
  - `DB_USERNAME=your_user`
  - `DB_PASSWORD=your_password`

- SaaS (multi-tenant):
  - `APP_URL=http://platform.test`
  - `PLATFORM_DOMAIN=platform.test`
  - `ADMIN_DOMAIN=admin.platform.test`
  - `DB_CONNECTION=mysql`
  - `DB_DATABASE=eos365`

## 3. Install Dependencies
```bash
composer install --no-dev --prefer-dist
npm ci
npm run build
```

## 4. Application Setup
```bash
php artisan key:generate
php artisan migrate --force
php artisan storage:link
```

## 5. Create Admin User
```bash
php artisan tinker
// Create landlord/admin or initial user based on your mode
```

## 6. SaaS Tenants (SaaS mode only)
```bash
php artisan tenant:create
php artisan tenant:migrate
```

## 7. Production Optimizations
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 8. Queue & Scheduler (optional)
Configure your supervisor/cron:
```bash
php artisan queue:work --tries=3
* * * * * php artisan schedule:run >> /dev/null 2>&1
```

## Troubleshooting
- If assets aren’t loading: run `npm run build`.
- If routes/config changed: `php artisan config:clear && php artisan route:clear && php artisan cache:clear`.
