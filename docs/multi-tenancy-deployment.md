# Multi-Tenancy Deployment Guide

This guide explains how to deploy the application with support for:
- `platform.com` - Public landing page and tenant registration
- `admin.platform.com` - Admin panel for platform management
- `{tenant}.platform.com` - Individual tenant applications

## Domain Architecture

```
platform.com                → Landing page, registration, public info
admin.platform.com          → Super admin panel (central DB)
{tenant}.platform.com       → Tenant application (tenant DB)
  ├── acme.platform.com
  ├── startup.platform.com
  └── enterprise.platform.com
```

## 1. DNS Configuration

Configure your DNS provider with the following records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 3600 |
| A | admin | YOUR_SERVER_IP | 3600 |
| A | * | YOUR_SERVER_IP | 3600 |

The wildcard (`*`) record enables dynamic tenant subdomains.

## 2. SSL Certificate

You need a wildcard SSL certificate to cover all subdomains.

### Option A: Let's Encrypt with Certbot (Recommended)

```bash
# Install certbot with DNS plugin
sudo apt install certbot python3-certbot-nginx python3-certbot-dns-cloudflare

# For wildcard certificate (requires DNS challenge)
sudo certbot certonly --manual --preferred-challenges dns \
  -d platform.com \
  -d "*.platform.com"
```

### Option B: Cloudflare (Easier)

If using Cloudflare, enable their free Universal SSL which includes wildcard support.

## 3. Web Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/platform.com`:

```nginx
# Main server block for all domains
server {
    listen 80;
    listen [::]:80;
    server_name platform.com admin.platform.com *.platform.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name platform.com admin.platform.com *.platform.com;

    root /var/www/platform.com/public;
    index index.php;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/platform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/platform.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/platform.com.access.log;
    error_log /var/log/nginx/platform.com.error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml;

    # Laravel application
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/platform.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache Configuration

Create `/etc/apache2/sites-available/platform.com.conf`:

```apache
<VirtualHost *:80>
    ServerName platform.com
    ServerAlias admin.platform.com *.platform.com
    Redirect permanent / https://platform.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName platform.com
    ServerAlias admin.platform.com *.platform.com
    
    DocumentRoot /var/www/platform.com/public

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/platform.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/platform.com/privkey.pem

    <Directory /var/www/platform.com/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/platform.com.error.log
    CustomLog ${APACHE_LOG_DIR}/platform.com.access.log combined
</VirtualHost>
```

Enable the site:

```bash
sudo a2ensite platform.com.conf
sudo a2enmod ssl rewrite
sudo systemctl reload apache2
```

## 4. Environment Configuration

Update your `.env` file on the production server:

```dotenv
APP_NAME="Your Platform Name"
APP_ENV=production
APP_KEY=base64:your-app-key-here
APP_DEBUG=false
APP_URL=https://platform.com

# Multi-Tenancy Domains
APP_DOMAIN=platform.com
CENTRAL_DOMAIN=platform.com
ADMIN_DOMAIN=admin.platform.com

# Session - CRITICAL for subdomain sharing
# The leading dot allows cookies across all subdomains
SESSION_DRIVER=database
SESSION_DOMAIN=.platform.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# Database (Central/Platform database)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=platform_central
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password
```

### Important Session Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `SESSION_DOMAIN` | `.platform.com` | Leading dot enables subdomain cookie sharing |
| `SESSION_SECURE_COOKIE` | `true` | Required for HTTPS |
| `SESSION_SAME_SITE` | `lax` | Allows subdomain redirects |

## 5. Database Setup

### Central Database

The central database stores:
- Platform users (admins)
- Tenants metadata
- Domains configuration
- Subscription plans
- Global settings

```bash
# Create central database
mysql -u root -p -e "CREATE DATABASE platform_central CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
php artisan migrate --seed
```

### Tenant Databases

Tenant databases are created automatically when registering new tenants. Each tenant gets their own database named `tenant{tenant_id}`.

## 6. Creating Tenants

### Via Admin Panel

1. Go to `admin.platform.com`
2. Login with admin credentials
3. Navigate to Tenants → Create
4. Fill in tenant details and subdomain

### Via Artisan Command

```bash
# Create a new tenant
php artisan tenant:create acme "Acme Corporation" admin@acme.com

# Or via tinker
php artisan tinker

>>> $tenant = \App\Models\Tenant::create([
...     'id' => 'acme',
...     'name' => 'Acme Corporation',
...     'email' => 'admin@acme.com',
...     'subdomain' => 'acme',
...     'subscription_plan' => 'trial',
... ]);
>>> $tenant->domains()->create(['domain' => 'acme.platform.com']);
```

## 7. Route Structure

The application routes are organized as follows:

| Domain | Routes File | Database | Purpose |
|--------|-------------|----------|---------|
| `platform.com` | `routes/platform.php` | Central | Landing, registration |
| `admin.platform.com` | `routes/admin.php` | Central | Admin panel |
| `*.platform.com` | `routes/tenant.php` + `web.php` | Tenant | Application |

## 8. Deployment Checklist

### Before Deployment

- [ ] Update `.env` with production values
- [ ] Set `APP_DEBUG=false`
- [ ] Configure database credentials
- [ ] Set `SESSION_DOMAIN=.platform.com`
- [ ] Configure mail settings

### Server Setup

- [ ] DNS records configured (A, wildcard)
- [ ] SSL certificate installed (wildcard)
- [ ] Web server configured
- [ ] PHP 8.2+ installed
- [ ] Required PHP extensions installed

### Post-Deployment

```bash
# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Build frontend assets
npm ci
npm run build

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Restart queue workers
php artisan queue:restart
```

## 9. Troubleshooting

### Session Not Persisting Across Subdomains

1. Verify `SESSION_DOMAIN` starts with a dot: `.platform.com`
2. Clear browser cookies for all subdomains
3. Run `php artisan config:clear`

### Tenant Not Found

1. Check if tenant exists in `tenants` table
2. Verify domain exists in `domains` table
3. Check `central_domains` in `config/tenancy.php`

### 404 on Tenant Subdomain

1. Verify wildcard DNS is configured
2. Check Nginx/Apache accepts wildcard
3. Ensure tenant database exists and is migrated

### Admin Panel 404

1. Verify `ADMIN_DOMAIN` is set correctly
2. Check `routes/admin.php` exists
3. Clear route cache: `php artisan route:clear`

## 10. Useful Commands

```bash
# List all tenants
php artisan tenant:list

# Run tenant migrations
php artisan tenants:migrate

# Seed tenant databases
php artisan tenants:seed

# Run artisan on specific tenant
php artisan tenant:artisan acme "migrate --seed"

# Clear tenant caches
php artisan tenants:artisan "cache:clear"
```

## 11. Security Recommendations

1. **Use HTTPS everywhere** - Set `SESSION_SECURE_COOKIE=true`
2. **Separate databases** - Each tenant should have isolated database
3. **Rate limiting** - Configure API rate limits per tenant
4. **Input validation** - Validate tenant subdomains strictly
5. **Backup strategy** - Backup both central and tenant databases
