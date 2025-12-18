# Tenant Provisioning Troubleshooting Guide

## Quick Diagnostics

### Check Tenant Status
```sql
SELECT id, name, subdomain, status, provisioning_step, created_at, updated_at
FROM tenants
WHERE id = 'your-tenant-uuid';
```

### Check Provisioning Errors
```sql
SELECT id, name, subdomain, status, 
       JSON_EXTRACT(data, '$.provisioning_error') as error,
       JSON_EXTRACT(data, '$.provisioning_failed_at') as failed_at
FROM tenants
WHERE status = 'failed';
```

### Check Tenant Database Exists
```sql
SELECT SCHEMA_NAME
FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME = 'tenant{uuid without dashes}';
```

### Check Logs
```bash
tail -f storage/logs/laravel.log | grep "tenant_id: your-tenant-uuid"
```

## Common Issues & Solutions

### Issue 1: "No migration paths found"

**Symptoms:**
- Provisioning fails at Step 0 (Pre-flight validation)
- Error: "No migration paths found - cannot provision without migrations"

**Causes:**
- Composer dependencies not installed
- Migration directories don't exist
- Incorrect package structure

**Solutions:**
```bash
# 1. Install composer dependencies
cd apps/saas-host  # or apps/standalone-host
composer install

# 2. Verify vendor/aero symlinks exist
ls -la vendor/aero/

# 3. Check packages directory structure
ls -la packages/aero-*/database/migrations/
```

**Prevention:**
- Always run `composer install` before testing provisioning
- In development, migration paths fallback to `packages/aero-{module}/` automatically

---

### Issue 2: "Required tables missing" after migration

**Symptoms:**
- Provisioning fails at Step 6 (Verification)
- Error: "Required tables missing: users, roles, modules"

**Causes:**
- Migrations didn't run successfully
- Migration files are missing
- Database connection lost during migration

**Solutions:**
```bash
# 1. Check if tenant database exists
SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME LIKE 'tenant%';

# 2. Check what tables exist in tenant database
USE tenant{uuid};
SHOW TABLES;

# 3. Check migration history
SELECT * FROM migrations ORDER BY id DESC LIMIT 10;

# 4. Manually run migrations (if needed)
php artisan tenants:migrate --tenants={tenant-uuid}
```

**Prevention:**
- Ensure all package migrations exist in `database/migrations/` directories
- Test migrations locally before deploying

---

### Issue 3: "Super Administrator role not found"

**Symptoms:**
- Provisioning fails at Step 6 (Verification)
- Error: "Super Administrator role not found after seeding"

**Causes:**
- Role seeding failed silently
- `roles` table doesn't exist
- Permission package not configured correctly

**Solutions:**
```bash
# 1. Check roles table in tenant database
USE tenant{uuid};
SELECT * FROM roles;

# 2. Manually create role if missing
INSERT INTO roles (name, guard_name, created_at, updated_at)
VALUES ('Super Administrator', 'web', NOW(), NOW());

# 3. Check Spatie Permission package config
cat config/permission.php
```

**Prevention:**
- Ensure Spatie Permission migrations run before role seeding
- Add better error handling in seedDefaultRoles() method

---

### Issue 4: "Database creation failed"

**Symptoms:**
- Provisioning fails at Step 2 (Create Database)
- Error: "Database tenant{uuid} was not created successfully"

**Causes:**
- MySQL user lacks CREATE DATABASE privilege
- Database name too long or invalid characters
- Existing database with same name

**Solutions:**
```sql
-- 1. Check MySQL user privileges
SHOW GRANTS FOR 'your-db-user'@'localhost';

-- 2. Grant CREATE privilege if needed
GRANT CREATE ON *.* TO 'your-db-user'@'localhost';
FLUSH PRIVILEGES;

-- 3. Check if database already exists
SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME = 'tenant{uuid}';

-- 4. Drop orphaned database if needed
DROP DATABASE IF EXISTS tenant{uuid};
```

**Prevention:**
- Ensure DB user has proper privileges before provisioning
- Clean up failed tenants properly (automatic with rollback)

---

### Issue 5: "Module sync failed"

**Symptoms:**
- Provisioning fails at Step 4 (Sync Module Hierarchy)
- Error: "Module sync output: [error message]"

**Causes:**
- Module config files missing or malformed
- Database connection lost
- Modules table doesn't exist yet

**Solutions:**
```bash
# 1. Check module config files exist
ls -la packages/aero-*/config/modules.php

# 2. Manually run module sync (in tenant context)
php artisan aero:sync-module --force

# 3. Check module discovery service
php artisan tinker
>>> app(Aero\Core\Services\Module\ModuleDiscoveryService::class)->getModuleDefinitions();
```

**Prevention:**
- Validate module config syntax before deploying
- Ensure `modules` table migration runs before sync

---

### Issue 6: "Provisioning stuck in 'provisioning' status"

**Symptoms:**
- Tenant status stuck at 'provisioning' for more than 5 minutes
- Provisioning page keeps polling but never completes

**Causes:**
- Queue worker not running
- Job failed silently without triggering failed() method
- Database deadlock

**Solutions:**
```bash
# 1. Check queue worker is running
php artisan queue:work --once

# 2. Check failed jobs table
php artisan queue:failed

# 3. Retry failed job
php artisan queue:retry {job-id}

# 4. Check job logs
tail -f storage/logs/laravel.log | grep ProvisionTenant
```

**Prevention:**
- Ensure queue workers are running: `php artisan queue:work`
- Use supervisor for production queue management
- Set proper timeout values in config

---

### Issue 7: "Admin setup page not accessible"

**Symptoms:**
- Cannot access https://{subdomain}.{domain}/admin-setup
- Redirects to login page
- Shows "Admin already exists" error

**Causes:**
- Admin user already created (from previous attempt)
- Middleware redirecting incorrectly
- Domain routing not configured

**Solutions:**
```sql
-- 1. Check if users exist in tenant database
USE tenant{uuid};
SELECT * FROM users;

-- 2. Delete users if testing (BE CAREFUL in production)
DELETE FROM users WHERE id = 'user-id';

-- 3. Check admin setup completion flag
SELECT JSON_EXTRACT(data, '$.admin_setup_completed') as admin_setup_done
FROM tenants
WHERE id = 'tenant-uuid';
```

**Prevention:**
- Use `PRESERVE_FAILED_TENANTS=true` in development
- Clear tenant database before retrying provisioning

---

### Issue 8: "Migration path resolution fails"

**Symptoms:**
- Warning: "Module {module} has no migrations at vendor/aero/{module}"
- Migrations not running for selected modules

**Causes:**
- Module code doesn't match directory name (e.g., `hrm` vs `aero-hrm`)
- Vendor symlinks not created
- Development vs production path mismatch

**Solutions:**
```bash
# 1. Check module codes in plan
php artisan tinker
>>> $tenant = \Aero\Platform\Models\Tenant::find('tenant-uuid');
>>> $tenant->plan->modules()->pluck('code')->toArray();

# 2. Check if migration directories exist
ls -la vendor/aero/*/database/migrations/
ls -la packages/aero-*/database/migrations/

# 3. Verify composer autoload
composer dump-autoload
```

**Prevention:**
- ✅ FIXED: Migration path resolution now tries both vendor and packages paths
- Ensure module codes in database match package names (without `aero-` prefix)

---

## Rollback & Recovery

### Automatic Rollback (on provisioning failure)

**Development Mode** (`PRESERVE_FAILED_TENANTS=true`):
1. Tenant status → 'failed'
2. Error stored in `tenant.data.provisioning_error`
3. Tenant database dropped
4. Tenant record preserved for debugging
5. Can retry provisioning from admin panel

**Production Mode** (`PRESERVE_FAILED_TENANTS=false`):
1. Tenant status → 'failed'
2. Tenant database dropped
3. Domain records deleted
4. Tenant record deleted completely
5. User can re-register with same email/subdomain

### Manual Rollback

```sql
-- 1. Mark tenant as failed manually
UPDATE tenants
SET status = 'failed',
    provisioning_step = NULL,
    data = JSON_SET(data, '$.provisioning_error', 'Manual rollback')
WHERE id = 'tenant-uuid';

-- 2. Drop tenant database
DROP DATABASE IF EXISTS tenant{uuid};

-- 3. Delete tenant and domains (if needed)
DELETE FROM domains WHERE tenant_id = 'tenant-uuid';
DELETE FROM tenants WHERE id = 'tenant-uuid';
```

### Retry Provisioning

```bash
# Via API (if tenant still exists)
curl -X POST https://platform.domain/platform/register/provisioning/{tenant-uuid}/retry

# Or via tinker
php artisan tinker
>>> $tenant = \Aero\Platform\Models\Tenant::find('tenant-uuid');
>>> \Aero\Platform\Jobs\ProvisionTenant::dispatch($tenant);
```

---

## Performance Optimization

### Speed Up Provisioning

1. **Use Queue Workers:**
   ```bash
   # Run multiple workers for parallel processing
   php artisan queue:work --queue=default --tries=3 --timeout=300 &
   php artisan queue:work --queue=default --tries=3 --timeout=300 &
   ```

2. **Optimize Migrations:**
   - Reduce number of migrations (combine when possible)
   - Use Schema::disableForeignKeyConstraints() during seeding
   - Index frequently queried columns

3. **Cache Module Definitions:**
   - Module discovery already cached automatically
   - Clear cache if modules change: `php artisan cache:clear`

4. **Database Connection Pooling:**
   - Use persistent connections for MySQL
   - Configure connection pool size in database config

---

## Monitoring & Alerts

### Log Levels

- `info`: Normal provisioning progress
- `warning`: Non-critical issues (missing optional features)
- `error`: Provisioning failures
- `critical`: System-level failures (should never happen)

### Set Up Monitoring

1. **Log Aggregation:**
   - Use Laravel Telescope for local development
   - Use Sentry/Bugsnag for production error tracking
   - Forward logs to external service (e.g., Papertrail, Loggly)

2. **Metrics to Track:**
   - Provisioning success rate
   - Average provisioning time
   - Failed provisioning reasons (by step)
   - Queue depth and processing time

3. **Alerts to Configure:**
   - Alert when provisioning fails 3+ times in 1 hour
   - Alert when queue depth exceeds 50 jobs
   - Alert when average provisioning time exceeds 2 minutes

---

## Testing Provisioning Locally

```bash
# 1. Set up test environment
cp .env.example .env
php artisan key:generate

# 2. Configure database
# Edit .env: DB_DATABASE=eos365_test

# 3. Run migrations on central database
php artisan migrate

# 4. Seed plans and modules (if seeders exist)
php artisan db:seed --class=PlanSeeder
php artisan db:seed --class=ModuleSeeder

# 5. Start queue worker
php artisan queue:work --queue=default &

# 6. Test registration flow
# Visit: http://localhost:8000/platform/register

# 7. Monitor logs in real-time
tail -f storage/logs/laravel.log | grep -E "PROVISIONING|tenant_id"
```

---

## Debugging Tips

### Enable Detailed Logging

```php
// In ProvisionTenant job, temporarily add:
Log::debug('Migration path details', [
    'base_path' => base_path(),
    'vendor_path' => base_path('vendor/aero'),
    'packages_path' => base_path('packages'),
    'migration_paths' => $migrationPaths,
]);
```

### Test Individual Steps

```php
php artisan tinker

// Get a tenant
$tenant = \Aero\Platform\Models\Tenant::where('subdomain', 'test-company')->first();

// Test migration path resolution
$job = new \Aero\Platform\Jobs\ProvisionTenant($tenant);
$paths = $job->getTenantMigrationPaths(); // Note: method is protected, may need to make public temporarily

// Test module sync
tenancy()->initialize($tenant);
\Illuminate\Support\Facades\Artisan::call('aero:sync-module', ['--fresh' => true, '--force' => true]);
tenancy()->end();
```

### Check Queue Jobs

```bash
# List queued jobs
php artisan queue:monitor

# Check failed jobs
php artisan queue:failed

# View specific failed job
php artisan queue:failed {job-id}

# Retry failed job
php artisan queue:retry {job-id}

# Clear all failed jobs
php artisan queue:flush
```

---

## Production Checklist

Before deploying provisioning to production:

- [ ] Queue workers running with supervisor
- [ ] Database user has CREATE DATABASE privilege
- [ ] All package migrations tested locally
- [ ] Module configs validated and synced
- [ ] Email service configured (for welcome emails)
- [ ] SMS service configured (if phone verification enabled)
- [ ] Error tracking configured (Sentry/Bugsnag)
- [ ] Log rotation configured
- [ ] Backup strategy in place
- [ ] Rollback strategy tested
- [ ] Performance benchmarks established
- [ ] Monitoring and alerts configured
- [ ] `PRESERVE_FAILED_TENANTS=false` in production .env
- [ ] Domain DNS wildcards configured (*.yourdomain.com)
- [ ] SSL certificates for wildcard domain

---

## Getting Help

If you encounter an issue not covered in this guide:

1. **Check Logs:** `storage/logs/laravel.log` with tenant_id context
2. **Review Documentation:** `docs/TENANT_PROVISIONING_FLOW.md`
3. **Test Locally:** Reproduce in local environment with detailed logging
4. **Search Issues:** Check GitHub issues for similar problems
5. **Ask Team:** Reach out to platform team with:
   - Tenant UUID
   - Error message
   - Provisioning step that failed
   - Relevant log excerpts
   - Environment (dev/staging/production)
