# Aero Enterprise Suite - Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Installation Steps](#installation-steps)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Multi-Tenant Configuration](#multi-tenant-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Performance Optimization](#performance-optimization)
9. [Security Hardening](#security-hardening)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 📋 Prerequisites

### Required Software
- **PHP**: 8.2 or higher
- **Node.js**: 18.0 or higher
- **Composer**: 2.5 or higher
- **NPM/Yarn**: Latest stable version
- **Git**: For version control

### Server Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2
- **Web Server**: Nginx 1.18+ or Apache 2.4+
- **Database**: MySQL 8.0+ or PostgreSQL 13+
- **Cache**: Redis 6.0+
- **Memory**: 4GB RAM minimum, 8GB+ recommended
- **Storage**: 50GB minimum, SSD preferred
- **CPU**: 2 cores minimum, 4+ cores recommended

---

## 🖥️ Server Requirements

### PHP Extensions
Ensure the following PHP extensions are installed:
```bash
sudo apt update
sudo apt install php8.2-cli php8.2-fpm php8.2-mysql php8.2-pgsql \
                 php8.2-redis php8.2-mbstring php8.2-xml php8.2-curl \
                 php8.2-zip php8.2-bcmath php8.2-intl php8.2-gd \
                 php8.2-imagick php8.2-soap php8.2-ldap
```

### Database Installation

#### MySQL 8.0
```bash
sudo apt install mysql-server-8.0
sudo mysql_secure_installation

# Create application database
mysql -u root -p
CREATE DATABASE eos365 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aero_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON eos365.* TO 'aero_user'@'%';
GRANT CREATE ON *.* TO 'aero_user'@'%'; # For tenant databases
FLUSH PRIVILEGES;
```

#### PostgreSQL 13+
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql

CREATE DATABASE eos365;
CREATE USER aero_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE eos365 TO aero_user;
ALTER USER aero_user CREATEDB; -- For tenant databases
```

### Redis Installation
```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: requirepass your_redis_password
sudo systemctl restart redis-server
```

---

## 🚀 Installation Steps

### 1. Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/your-org/aero-enterprise-suite.git
sudo chown -R www-data:www-data aero-enterprise-suite
cd aero-enterprise-suite
```

### 2. Install Dependencies
```bash
# PHP dependencies
composer install --optimize-autoloader --no-dev

# Node.js dependencies
npm install
npm run build
```

### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit environment file
nano .env
```

### 4. Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/aero-enterprise-suite
sudo chmod -R 755 /var/www/aero-enterprise-suite
sudo chmod -R 777 /var/www/aero-enterprise-suite/storage
sudo chmod -R 777 /var/www/aero-enterprise-suite/bootstrap/cache
```

### 5. Database Migration
```bash
# Run migrations
php artisan migrate

# Seed initial data
php artisan db:seed

# Create admin user
php artisan make:admin-user
```

### 6. Queue Worker Setup
```bash
# Create systemd service for queue worker
sudo nano /etc/systemd/system/aero-worker.service
```

```ini
[Unit]
Description=Aero Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
Restart=always
RestartSec=10
ExecStart=/usr/bin/php /var/www/aero-enterprise-suite/artisan queue:work redis --sleep=3 --tries=3
StandardOutput=journal
StandardError=journal
SyslogIdentifier=aero-worker

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable aero-worker
sudo systemctl start aero-worker
```

---

## ⚙️ Environment Configuration

### Production .env File
```env
# Application Settings
APP_NAME="Aero Enterprise Suite"
APP_ENV=production
APP_KEY=base64:your-app-key-here
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eos365
DB_USERNAME=aero_user
DB_PASSWORD=secure_password

# Multi-Tenancy Settings
PLATFORM_DOMAIN=your-domain.com
ADMIN_DOMAIN=admin.your-domain.com
TENANT_MODEL=App\Models\Tenant

# Cache Configuration
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis Settings
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6379
REDIS_DB=0

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=your-mailgun-username
MAIL_PASSWORD=your-mailgun-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

# File Storage
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=aero-enterprise-files
AWS_URL=https://your-bucket.s3.amazonaws.com

# Security Settings
SESSION_LIFETIME=120
SESSION_EXPIRE_ON_CLOSE=false
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# Performance Settings
OPTIMIZE_PERFORMANCE=true
CACHE_TTL=3600
QUERY_CACHE_ENABLED=true
VIEW_CACHE_ENABLED=true

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=warning
LOG_DEPRECATIONS_CHANNEL=null

# Blockchain Settings (if using blockchain module)
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_DEFAULT_NETWORK=ethereum
ETH_RPC_ENDPOINT=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
INFURA_PROJECT_ID=your-infura-project-id

# Monitoring & Error Tracking
TELESCOPE_ENABLED=false
SENTRY_LARAVEL_DSN=https://your-sentry-dsn
```

---

## 🗄️ Database Setup

### Multi-Tenant Database Configuration

#### Central Database (eos365)
This database stores:
- Tenants and domains
- Subscription plans
- Platform-wide settings
- Landlord users (platform admins)

```sql
-- Create central database
CREATE DATABASE eos365 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Run central migrations
php artisan migrate --database=central
```

#### Tenant Databases
Each tenant gets their own isolated database:
```bash
# Create new tenant (automatically creates database)
php artisan tenant:create \
  --name="Acme Corporation" \
  --domain="acme.your-domain.com" \
  --plan="enterprise"

# This creates:
# - Database: tenant_1
# - Domain: acme.your-domain.com
# - Runs tenant migrations
```

### Database Backup Strategy
```bash
# Create backup script
sudo nano /usr/local/bin/backup-aero.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/aero"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup central database
mysqldump -u aero_user -p'secure_password' eos365 > $BACKUP_DIR/central_$DATE.sql

# Backup all tenant databases
for db in $(mysql -u aero_user -p'secure_password' -e "SHOW DATABASES LIKE 'tenant_%';" -s --skip-column-names); do
    mysqldump -u aero_user -p'secure_password' $db > $BACKUP_DIR/${db}_$DATE.sql
done

# Compress backups older than 1 day
find $BACKUP_DIR -name "*.sql" -mtime +1 -exec gzip {} \;

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-aero.sh

# Add to crontab for daily backups
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-aero.sh
```

---

## 🏢 Multi-Tenant Configuration

### Nginx Virtual Host
```nginx
# Main application
server {
    listen 80;
    listen 443 ssl http2;
    server_name your-domain.com *.your-domain.com;
    root /var/www/aero-enterprise-suite/public;
    index index.php index.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # PHP Configuration
    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
    }

    # Asset Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Laravel Routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ /(storage|vendor|node_modules)/ {
        deny all;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        try_files $uri $uri/ /index.php?$query_string;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com *.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Apache Virtual Host
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias *.your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias *.your-domain.com
    DocumentRoot /var/www/aero-enterprise-suite/public

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
    
    # Security Headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    <Directory /var/www/aero-enterprise-suite/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Asset Caching
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </LocationMatch>
</VirtualHost>
```

---

## 🔒 SSL/HTTPS Setup

### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate for wildcard domain
sudo certbot certonly --manual --preferred-challenges=dns \
  -d your-domain.com -d *.your-domain.com

# Add DNS TXT record as prompted by Certbot
# Then continue the process

# Set up automatic renewal
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet && systemctl reload nginx
```

### SSL Configuration Verification
```bash
# Test SSL configuration
sudo nginx -t
sudo systemctl reload nginx

# Verify SSL setup
curl -I https://your-domain.com
curl -I https://test.your-domain.com
```

---

## ⚡ Performance Optimization

### PHP-FPM Optimization
```ini
# /etc/php/8.2/fpm/pool.d/www.conf
[www]
user = www-data
group = www-data
listen = /var/run/php/php8.2-fpm.sock
listen.owner = www-data
listen.group = www-data
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 1000
request_terminate_timeout = 300
```

```ini
# /etc/php/8.2/fpm/php.ini
memory_limit = 512M
max_execution_time = 300
max_input_vars = 3000
upload_max_filesize = 64M
post_max_size = 64M
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 8
opcache.max_accelerated_files = 4000
opcache.revalidate_freq = 2
opcache.fast_shutdown = 1
```

### MySQL Optimization
```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
query_cache_type = 1
query_cache_limit = 1M
query_cache_size = 32M
max_connections = 200
tmp_table_size = 64M
max_heap_table_size = 64M
```

### Laravel Optimization Commands
```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Cache events
php artisan event:cache

# Optimize autoloader
composer dump-autoload --optimize

# Cache icons (if using Blade Icons)
php artisan icons:cache
```

### Redis Configuration
```redis
# /etc/redis/redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

---

## 🛡️ Security Hardening

### Firewall Configuration
```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific database access (if external)
sudo ufw allow from 10.0.0.0/8 to any port 3306
```

### Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure Fail2Ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[php-url-fopen]
enabled = true
filter = php-url-fopen
logpath = /var/log/nginx/access.log
maxretry = 3
```

### Security Headers
Already included in Nginx/Apache configurations above.

### Regular Security Updates
```bash
# Create update script
sudo nano /usr/local/bin/security-updates.sh
```

```bash
#!/bin/bash
apt update
apt upgrade -y
apt autoremove -y

# Update Composer dependencies
cd /var/www/aero-enterprise-suite
composer update --no-dev

# Clear caches after updates
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart services
systemctl restart php8.2-fpm
systemctl restart nginx
systemctl restart redis-server
```

```bash
sudo chmod +x /usr/local/bin/security-updates.sh

# Schedule weekly security updates
sudo crontab -e
# Add: 0 4 * * 1 /usr/local/bin/security-updates.sh
```

---

## 📊 Monitoring & Maintenance

### Health Monitoring Script
```bash
# Create monitoring script
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash
LOG_FILE="/var/log/aero-health.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check web server
if curl -f -s http://localhost > /dev/null; then
    echo "$DATE - Web server: OK" >> $LOG_FILE
else
    echo "$DATE - Web server: FAILED" >> $LOG_FILE
    systemctl restart nginx
fi

# Check database
if mysql -u aero_user -p'secure_password' -e "SELECT 1" > /dev/null 2>&1; then
    echo "$DATE - Database: OK" >> $LOG_FILE
else
    echo "$DATE - Database: FAILED" >> $LOG_FILE
    systemctl restart mysql
fi

# Check Redis
if redis-cli -a 'your_redis_password' ping > /dev/null 2>&1; then
    echo "$DATE - Redis: OK" >> $LOG_FILE
else
    echo "$DATE - Redis: FAILED" >> $LOG_FILE
    systemctl restart redis-server
fi

# Check queue worker
if pgrep -f "artisan queue:work" > /dev/null; then
    echo "$DATE - Queue worker: OK" >> $LOG_FILE
else
    echo "$DATE - Queue worker: FAILED" >> $LOG_FILE
    systemctl restart aero-worker
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "$DATE - Disk usage: WARNING ($DISK_USAGE%)" >> $LOG_FILE
    # Add alert mechanism here
fi
```

```bash
sudo chmod +x /usr/local/bin/health-check.sh

# Run health check every 5 minutes
sudo crontab -e
# Add: */5 * * * * /usr/local/bin/health-check.sh
```

### Log Rotation
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/aero-enterprise
```

```
/var/www/aero-enterprise-suite/storage/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su www-data www-data
}

/var/log/aero-health.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Permission Issues
```bash
# Fix file permissions
sudo chown -R www-data:www-data /var/www/aero-enterprise-suite
sudo chmod -R 755 /var/www/aero-enterprise-suite
sudo chmod -R 777 /var/www/aero-enterprise-suite/storage
sudo chmod -R 777 /var/www/aero-enterprise-suite/bootstrap/cache
```

#### 2. PHP-FPM Not Starting
```bash
# Check PHP-FPM status
sudo systemctl status php8.2-fpm

# Check PHP-FPM configuration
sudo php-fpm8.2 -t

# View PHP-FPM logs
sudo tail -f /var/log/php8.2-fpm.log
```

#### 3. Database Connection Issues
```bash
# Test database connection
mysql -u aero_user -p'secure_password' -h 127.0.0.1 -e "SELECT 1;"

# Check MySQL status
sudo systemctl status mysql

# View MySQL error logs
sudo tail -f /var/log/mysql/error.log
```

#### 4. Queue Jobs Not Processing
```bash
# Check queue worker status
sudo systemctl status aero-worker

# View queue worker logs
sudo journalctl -u aero-worker -f

# Manually run queue worker for debugging
cd /var/www/aero-enterprise-suite
php artisan queue:work --verbose
```

#### 5. Multi-Tenant Issues
```bash
# List all tenants
php artisan tenant:list

# Check tenant database
php artisan tenant:migrate-status --tenant=1

# Migrate specific tenant
php artisan tenant:migrate --tenant=1

# Clear tenant cache
php artisan tenant:cache:clear --tenant=1
```

### Diagnostic Commands
```bash
# Laravel diagnostics
php artisan about
php artisan config:show
php artisan route:list
php artisan queue:monitor

# System diagnostics
free -m
df -h
top
netstat -tlnp

# Nginx/Apache diagnostics
sudo nginx -t
sudo apache2ctl configtest
```

### Emergency Recovery
```bash
# Emergency maintenance mode
php artisan down --message="System maintenance in progress"

# Restore from backup
/usr/local/bin/restore-backup.sh 20260128_020000

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan queue:clear

# Bring application back online
php artisan up
```

---

## 📞 Support Contacts

- **Technical Support**: support@aeroenterprise.com
- **Emergency Contact**: +1-800-AERO-911
- **Documentation**: https://docs.aeroenterprise.com
- **Status Page**: https://status.aeroenterprise.com

---

*Last updated: January 28, 2026*
*Version: 1.0.0*