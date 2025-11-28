# Device Authentication System - Live Server Deployment Guide

## Current Status
The device authentication middleware has been temporarily disabled in `routes/web.php` to prevent the "Target class [device_auth] does not exist" error.

## Deployment Checklist for Live Server

### 1. Verify All Files Are Deployed
Ensure these files exist on your live server:

```bash
# Check middleware exists
ls -la app/Http/Middleware/DeviceAuthMiddleware.php

# Check service exists
ls -la app/Services/DeviceAuthService.php

# Check model exists
ls -la app/Models/UserDevice.php

# Check controller exists
ls -la app/Http/Controllers/DeviceController.php

# Check compatibility shim exists
ls -la app/Http/Controllers/UserDeviceController.php
```

### 2. Run Database Migration
```bash
# On live server
php artisan migrate

# Verify the user_devices table was created
php artisan tinker
>>> \DB::select('SHOW TABLES LIKE "user_devices"');
```

### 3. Regenerate Autoload (CRITICAL)
```bash
# On live server - run these in order
composer dump-autoload --optimize

# Clear all Laravel caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear

# Rebuild optimized cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### 4. Verify Middleware Registration
Check `app/Http/Kernel.php` has this line in the `$middlewareAliases` array:

```php
'device_auth' => \App\Http\Middleware\DeviceAuthMiddleware::class,
```

### 5. Test Middleware Loading
Run this command on the live server to verify the middleware class can be loaded:

```bash
php artisan tinker
>>> app(\App\Http\Middleware\DeviceAuthMiddleware::class);
# Should return an instance without errors
```

### 6. Check PHP OPcache (If Enabled)
If your live server has OPcache enabled, you MUST restart PHP-FPM or clear OPcache:

```bash
# Option 1: Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Option 2: Clear OPcache via artisan
php artisan opcache:clear

# Option 3: Programmatically clear (if you have access)
php -r "opcache_reset();"
```

### 7. Restart Web Server
```bash
# For Apache
sudo systemctl restart apache2

# For Nginx (with PHP-FPM)
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
```

### 8. Re-enable Device Auth Middleware
Once steps 1-7 are complete and verified, edit `routes/web.php`:

**Change this:**
```php
$middlewareStack = ['auth', 'verified']; // 'device_auth' - temporarily disabled
```

**To this:**
```php
$middlewareStack = ['auth', 'verified', 'device_auth'];
```

Then run:
```bash
php artisan route:clear
php artisan route:cache
```

### 9. Test the System
Visit your application and try to:
1. Login (should work normally)
2. Access protected routes (should verify device)
3. Check browser console for device_id header being sent

---

## Troubleshooting

### If "Target class [device_auth] does not exist" persists:

1. **Check the actual file exists on server:**
   ```bash
   cat app/Http/Middleware/DeviceAuthMiddleware.php
   ```

2. **Check for syntax errors:**
   ```bash
   php -l app/Http/Middleware/DeviceAuthMiddleware.php
   ```

3. **Check Composer autoload files:**
   ```bash
   grep -r "DeviceAuthMiddleware" vendor/composer/
   ```

4. **Manually register in bootstrap (emergency fix):**
   Add to `bootstrap/app.php` or `app/Providers/AppServiceProvider.php`:
   ```php
   public function boot()
   {
       Route::aliasMiddleware('device_auth', \App\Http\Middleware\DeviceAuthMiddleware::class);
   }
   ```

5. **Check file permissions:**
   ```bash
   # Ensure web server can read the files
   chmod 644 app/Http/Middleware/DeviceAuthMiddleware.php
   chown www-data:www-data app/Http/Middleware/DeviceAuthMiddleware.php
   ```

### Alternative: Use Full Class Path in Routes
If the alias still doesn't work, you can use the full class path in routes:

In `routes/web.php`:
```php
// Instead of 'device_auth' in middleware array, use:
$middlewareStack = ['auth', 'verified', \App\Http\Middleware\DeviceAuthMiddleware::class];
```

---

## Quick Verification Script

Run this on your live server to check everything:

```bash
#!/bin/bash
echo "=== Device Auth Deployment Verification ==="
echo ""

echo "1. Checking files exist..."
test -f app/Http/Middleware/DeviceAuthMiddleware.php && echo "✓ Middleware exists" || echo "✗ Middleware missing"
test -f app/Services/DeviceAuthService.php && echo "✓ Service exists" || echo "✗ Service missing"
test -f app/Models/UserDevice.php && echo "✓ Model exists" || echo "✗ Model missing"
test -f app/Http/Controllers/DeviceController.php && echo "✓ Controller exists" || echo "✗ Controller missing"

echo ""
echo "2. Checking syntax..."
php -l app/Http/Middleware/DeviceAuthMiddleware.php

echo ""
echo "3. Checking database migration..."
php artisan migrate:status | grep user_devices

echo ""
echo "4. Testing middleware load..."
php artisan tinker --execute="dd(app(\App\Http\Middleware\DeviceAuthMiddleware::class));"

echo ""
echo "=== Deployment verification complete ==="
```

Save this as `check-device-auth.sh`, make it executable (`chmod +x check-device-auth.sh`), and run it.
