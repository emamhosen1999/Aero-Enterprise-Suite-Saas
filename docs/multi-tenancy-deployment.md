# Multi-Tenancy Deployment Guide

This guide explains how to deploy the application with support for:
- `aeos365.com` - Public landing page and tenant registration
- `admin.aeos365.com` - Admin panel for platform management
- `{tenant}.aeos365.com` - Individual tenant applications

## Domain Architecture

```
aeos365.com                → Landing page, registration, public info
admin.aeos365.com          → Super admin panel (central DB)
{tenant}.aeos365.com       → Tenant application (tenant DB)
  ├── acme.aeos365.com
  ├── startup.aeos365.com
  └── enterprise.aeos365.com
```

## 1. Namecheap Shared Hosting Setup

### Step 1: Create Subdomains in cPanel

1. Login to your **cPanel** (usually at `https://aeos365.com/cpanel` or via Namecheap dashboard)
2. Go to **Domains** → **Subdomains**
3. Create these subdomains:

| Subdomain | Document Root |
|-----------|---------------|
| `admin` | `public_html` (same as main domain) |

> **Note**: For tenant subdomains, you'll need to create each one manually OR use a wildcard subdomain (see below).

### Step 2: Wildcard Subdomain (for dynamic tenants)

If your Namecheap plan supports wildcard subdomains:

1. In cPanel → **Subdomains**
2. Create subdomain: `*`
3. Document Root: `public_html` (same as main domain)

> ⚠️ **Note**: Some shared hosting plans don't support wildcard subdomains. Contact Namecheap support to confirm.

### Step 3: SSL Certificate

Namecheap shared hosting typically includes free SSL via AutoSSL or Let's Encrypt:

1. Go to **cPanel** → **SSL/TLS Status**
2. Enable SSL for:
   - `aeos365.com`
   - `admin.aeos365.com`
   - Each tenant subdomain (or wildcard if supported)

For wildcard SSL:
1. Go to **cPanel** → **SSL/TLS**
2. You may need to purchase a wildcard SSL certificate from Namecheap

## 2. File Upload

Upload your Laravel project to `public_html`:

### Option A: Via File Manager
1. Zip your project (excluding `node_modules` and `vendor`)
2. Upload to `public_html`
3. Extract

### Option B: Via SSH (if available)
```bash
cd ~/public_html
git clone your-repo .
composer install --no-dev --optimize-autoloader
```

### Option C: Via FTP
Use FileZilla or similar FTP client with your cPanel FTP credentials.

## 3. Directory Structure for Shared Hosting

For Laravel on shared hosting, you need to move files properly:

```
/home/username/
├── public_html/           ← Laravel's public folder contents go here
│   ├── index.php         ← Modified to point to app folder
│   ├── .htaccess
│   ├── build/
│   └── storage → ../aeos365_app/storage/app/public (symlink)
│
└── aeos365_app/           ← Laravel app (outside public_html)
    ├── app/
    ├── bootstrap/
    ├── config/
    ├── database/
    ├── resources/
    ├── routes/
    ├── storage/
    ├── vendor/
    ├── .env
    └── artisan
```

### Modified `public_html/index.php`:

```php
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../aeos365_app/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../aeos365_app/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../aeos365_app/bootstrap/app.php')
    ->handleRequest(Request::capture());
```

## 4. Environment Configuration

Create/update `.env` in your Laravel app folder:

```dotenv
APP_NAME=AEOS365
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://aeos365.com

# Multi-Tenancy Domains
APP_DOMAIN=aeos365.com
CENTRAL_DOMAIN=aeos365.com
ADMIN_DOMAIN=admin.aeos365.com

# Session - CRITICAL for subdomain sharing
SESSION_DRIVER=database
SESSION_DOMAIN=.aeos365.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# Database (Central/Platform database)
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_cpanel_username_aeos365
DB_USERNAME=your_cpanel_username_dbuser
DB_PASSWORD=your_database_password
```

### Important Session Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `SESSION_DOMAIN` | `.aeos365.com` | Leading dot enables subdomain cookie sharing |
| `SESSION_SECURE_COOKIE` | `true` | Required for HTTPS |
| `SESSION_SAME_SITE` | `lax` | Allows subdomain redirects |

## 5. Database Setup

### Create Databases in cPanel

1. Go to **cPanel** → **MySQL Databases**
2. Create central database: `aeos365_central`
3. Create database user with strong password
4. Add user to database with ALL PRIVILEGES

For tenant databases, you'll create them as needed:
- `aeos365_tenant_acme`
- `aeos365_tenant_startup`
- etc.

> **Shared Hosting Limitation**: You may have a limit on number of databases. Check your plan.

### Run Migrations

Via SSH (if available):
```bash
cd ~/aeos365_app
php artisan migrate --force --seed
```

Or via cPanel Terminal (if available).

## 6. `.htaccess` Configuration

Ensure `public_html/.htaccess` has:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

## 7. Storage Symlink

Create the storage symlink via SSH or cPanel Terminal:

```bash
cd ~/public_html
ln -s ../aeos365_app/storage/app/public storage
```

Or via PHP (one-time script):
```php
<?php
// create-symlink.php in public_html - DELETE AFTER RUNNING!
symlink('../aeos365_app/storage/app/public', 'storage');
echo 'Symlink created!';
```

## 8. Cron Jobs (Queue & Scheduler)

In cPanel → **Cron Jobs**, add:

```
* * * * * cd ~/aeos365_app && php artisan schedule:run >> /dev/null 2>&1
```

For queue worker (simple approach for shared hosting):
```
*/5 * * * * cd ~/aeos365_app && php artisan queue:work --stop-when-empty >> /dev/null 2>&1
```

## 9. Creating Tenants

### Via Admin Panel

1. Go to `admin.aeos365.com`
2. Login with admin credentials
3. Navigate to Tenants → Create
4. Fill in tenant details and subdomain

### Via Tinker (SSH)

```bash
cd ~/aeos365_app
php artisan tinker
```

```php
$tenant = \App\Models\Tenant::create([
    'id' => 'acme',
    'name' => 'Acme Corporation',
    'email' => 'admin@acme.com',
    'subdomain' => 'acme',
    'subscription_plan' => 'trial',
]);
$tenant->domains()->create(['domain' => 'acme.aeos365.com']);
```

> **Remember**: On shared hosting, you must manually create each tenant subdomain in cPanel first (unless wildcard is supported).

## 10. Route Structure

| Domain | Routes File | Database | Purpose |
|--------|-------------|----------|---------|
| `aeos365.com` | `routes/platform.php` | Central | Landing, registration |
| `admin.aeos365.com` | `routes/admin.php` | Central | Admin panel |
| `*.aeos365.com` | `routes/tenant.php` + `web.php` | Tenant | Application |

## 11. Deployment Checklist

### Before Upload

- [ ] Run `composer install --no-dev --optimize-autoloader` locally
- [ ] Run `npm run build`
- [ ] Update `.env` with production values
- [ ] Set `APP_DEBUG=false`

### After Upload

- [ ] Create database in cPanel
- [ ] Upload/configure `.env`
- [ ] Create storage symlink
- [ ] Run migrations
- [ ] Set up cron jobs
- [ ] Test all domains

### Cache Commands (via SSH or cPanel Terminal)

```bash
cd ~/aeos365_app
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 12. Troubleshooting

### Session Not Persisting Across Subdomains

1. Verify `SESSION_DOMAIN` starts with a dot: `.aeos365.com`
2. Clear browser cookies for all subdomains
3. Run `php artisan config:clear`

### 500 Error

1. Check `storage/logs/laravel.log`
2. Ensure `storage/` and `bootstrap/cache/` are writable (chmod 775)
3. Verify `.env` exists and has correct values

### Tenant Subdomain Not Working

1. Verify subdomain is created in cPanel
2. Check tenant exists in `tenants` table
3. Verify domain exists in `domains` table

### Admin Panel 404

1. Verify `admin` subdomain created in cPanel
2. Verify `ADMIN_DOMAIN=admin.aeos365.com` in `.env`
3. Clear route cache: `php artisan route:clear`

## 13. Namecheap-Specific Notes

### Shared Hosting Limitations

- **Database limit**: Check your plan for max databases allowed
- **Wildcard subdomain**: May not be supported on all plans
- **SSH access**: Available on higher-tier plans only
- **PHP version**: Ensure PHP 8.2+ is selected in cPanel

### If No SSH Access

1. Use cPanel's **Terminal** (if available)
2. Or create a `deploy.php` script to run artisan commands via browser (delete after use!)

```php
<?php
// deploy.php - DELETE AFTER RUNNING!
chdir(__DIR__ . '/../aeos365_app');
echo '<pre>';
echo shell_exec('php artisan migrate --force 2>&1');
echo shell_exec('php artisan config:cache 2>&1');
echo shell_exec('php artisan route:cache 2>&1');
echo '</pre>';
```

### Contact Namecheap Support For

- Enabling wildcard subdomains
- Increasing database limit
- SSH access if not available
- Wildcard SSL certificate
