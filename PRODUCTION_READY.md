# Production Deployment - Quick Guide

## 🚀 Deploy to Production

Your multi-tenant SaaS platform is ready for production! Use the custom deployment command:

### Option 1: Full Deployment (Recommended for new servers)
```bash
php artisan deploy:production --all
```

### Option 2: Step-by-Step Deployment
```bash
# 1. Run migrations
php artisan deploy:production --migrate

# 2. Seed subscription data
php artisan deploy:production --seed

# 3. Create super admin
php artisan deploy:production --admin

# 4. Verify deployment
php artisan deploy:production --verify
```

### Option 3: Individual Steps
```bash
# Just migrations
php artisan deploy:production --migrate

# Just seeding
php artisan deploy:production --seed

# Just admin creation
php artisan deploy:production --admin

# Just verification
php artisan deploy:production --verify
```

## ✅ Current Status
Your local environment shows:
- ✅ Database: Connected
- ✅ Subscription Plans: 3 plans
- ✅ Modules: 8 modules  
- ✅ Super Admins: 2 admins
- ✅ Admin Role: Configured

## 🔧 Production Environment Setup

1. **Server Requirements:**
   - PHP 8.2+
   - MySQL/PostgreSQL
   - Composer
   - Node.js & NPM

2. **Environment Configuration:**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Configure your production settings:
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://yourdomain.com
   
   # Database settings
   DB_CONNECTION=mysql
   DB_HOST=your-db-host
   DB_DATABASE=your-db-name
   DB_USERNAME=your-db-user
   DB_PASSWORD=your-db-password
   
   # Tenancy settings
   TENANCY_DATABASE_AUTO_DELETE=false
   ```

3. **Install Dependencies:**
   ```bash
   composer install --no-dev --optimize-autoloader
   npm install && npm run build
   ```

4. **Generate Application Key:**
   ```bash
   php artisan key:generate --force
   ```

5. **Deploy Your Platform:**
   ```bash
   php artisan deploy:production --all
   ```

## 🎯 What Gets Deployed

### Subscription Plans:
- **Starter Plan** ($29/month) - Basic features
- **Professional Plan** ($79/month) - Advanced features  
- **Enterprise Plan** ($199/month) - All features

### Available Modules:
- HR Management
- Employee Management  
- Payroll Management
- Performance Management
- Recruitment Management
- Training Management
- Document Management
- Analytics & Reporting

### Admin Access:
- Super Administrator role with full platform access
- Central admin panel for managing tenants and subscriptions
- Company registration and onboarding flow

## 🔒 Security Checklist

- [ ] Set `APP_DEBUG=false` in production
- [ ] Use HTTPS (SSL certificate)
- [ ] Configure secure database credentials
- [ ] Set up regular backups
- [ ] Configure proper file permissions
- [ ] Enable Laravel's security features

## 📱 Multi-Tenant Features

- **Central Landing Page** - Company registration and plan selection
- **Tenant Isolation** - Complete data separation between companies
- **Subscription Management** - Automatic plan enforcement
- **Module Access Control** - Feature access based on subscription
- **Admin Dashboard** - Central platform management

## 🆘 Troubleshooting

If deployment fails:

1. **Check Requirements:**
   ```bash
   php -v  # Should be 8.2+
   composer --version
   ```

2. **Verify Database:**
   ```bash
   php artisan migrate:status
   ```

3. **Test Connection:**
   ```bash
   php artisan deploy:production --verify
   ```

4. **Reset if Needed:**
   ```bash
   php artisan migrate:refresh --force
   php artisan deploy:production --seed --admin
   ```

## 🎉 Go Live!

Once deployed, your platform will be accessible at:
- **Landing Page:** `https://yourdomain.com`
- **Admin Panel:** `https://yourdomain.com/admin` 
- **Company Dashboards:** `https://company.yourdomain.com`

Your multi-tenant SaaS platform is ready for business! 🚀