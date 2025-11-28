# Production Deployment Guide - Multi-Tenant SaaS Platform

This guide provides step-by-step instructions for deploying the subscription plans and central data in production.

## Prerequisites

1. Production server with Laravel 11 environment
2. Database configured and accessible
3. Environment variables properly set
4. Application deployed and accessible

## Production Deployment Steps

### 1. Database Migration

Run the core migrations to create the subscription system tables:

```bash
# Run all pending migrations
php artisan migrate --force

# Check migration status
php artisan migrate:status
```

### 2. Seed Subscription Plans and Modules

Run the subscription system seeder to populate plans and modules:

```bash
# Seed subscription plans and modules
php artisan db:seed --class=SubscriptionSystemSeeder --force

# Alternative: Run all seeders (if configured in DatabaseSeeder)
php artisan db:seed --force
```

### 3. Create Super Administrator

Create the central admin user for managing the platform:

```bash
# Create super admin user (interactive)
php artisan admin:create-super-admin

# Or create with specific details (non-interactive)
php artisan admin:create-super-admin --name="Platform Admin" --email="admin@yourcompany.com" --password="secure-password"
```

### 4. Verify Data

Check that all data has been properly seeded:

```bash
# Check subscription plans
php artisan tinker --execute="
use App\Models\SubscriptionPlan;
echo 'Subscription Plans: ' . SubscriptionPlan::count();
"

# Check modules
php artisan tinker --execute="
use App\Models\Module;
echo 'Modules: ' . Module::count();
"

# Check admin users
php artisan tinker --execute="
use App\Models\User;
use Spatie\Permission\Models\Role;
echo 'Super Admins: ' . User::role('Super Administrator')->count();
"
```

### 5. Tenant Setup (When Needed)

For each new tenant that registers:

```bash
# Migrate tenant databases (automatically handled by tenant creation)
php artisan tenants:migrate

# Seed tenant-specific data if needed
php artisan tenants:seed --tenants=tenant-id
```

## Production Safety Commands

### Safe Migration Check
```bash
# Dry run - check what will be migrated
php artisan migrate --pretend

# Run with output to see what's happening
php artisan migrate --verbose
```

### Backup Before Changes
```bash
# Always backup database before major changes
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Environment-Specific Seeders

For production-safe seeding, use:

```bash
# Only run production-safe seeders
php artisan db:seed --class=ProductionSeeder --force
```

## Troubleshooting

### If Seeder Fails Due to Existing Data

```bash
# Reset specific tables and reseed
php artisan tinker --execute="
use App\Models\SubscriptionPlan;
use App\Models\Module;
SubscriptionPlan::truncate();
Module::truncate();
"

# Then re-run seeder
php artisan db:seed --class=SubscriptionSystemSeeder --force
```

### If Admin User Already Exists

```bash
# Ensure super admin role is assigned
php artisan users:ensure-superadmin --email="admin@yourcompany.com"
```

## Verification Checklist

- [ ] All migrations have run successfully
- [ ] Subscription plans are created (Basic, Professional, Enterprise)
- [ ] All 8 modules are available
- [ ] Super administrator user exists and can log in
- [ ] Central login page is accessible
- [ ] Admin dashboard is accessible to super admin
- [ ] Tenant registration flow works
- [ ] New tenants can be created successfully

## Post-Deployment

1. Test the complete registration flow
2. Verify admin can access subscription management
3. Test tenant creation and login
4. Monitor application logs for any errors
5. Set up monitoring and alerting

## Environment Variables

Ensure these are set in production `.env`:

```env
# Database
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=your-database
DB_USERNAME=your-username
DB_PASSWORD=your-password

# Tenancy
TENANCY_DATABASE_PREFIX=tenant_
TENANCY_DOMAIN_SUFFIX=.yourapp.com

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# App Settings
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourapp.com
```

## Security Notes

1. Use strong passwords for admin accounts
2. Enable 2FA for admin users if available
3. Regularly backup the central database
4. Monitor for unusual tenant creation patterns
5. Set up proper SSL certificates
6. Configure rate limiting for registration endpoints