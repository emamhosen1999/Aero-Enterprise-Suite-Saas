# Aero Module System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### For Module Developers

#### 1. Add AeroTenantable to Models
```php
use Aero\Core\Traits\AeroTenantable;

class Employee extends Model
{
    use AeroTenantable;
}
```

#### 2. Create module.json
```json
{
  "name": "aero-hrm",
  "namespace": "Aero\\Hrm",
  "providers": ["Aero\\Hrm\\AeroHrmServiceProvider"]
}
```

#### 3. Configure Vite for Library Mode
```bash
cp packages/aero-hrm/vite.config.js your-module/
```

#### 4. Build Module
```bash
npm run build
```

Done! Your module now works in both SaaS and Standalone modes.

---

## 🎯 Testing Your Module

### Test in SaaS Mode
```bash
# Install via Composer
composer require aero/your-module

# Run
php artisan serve
```

### Test in Standalone Mode
```bash
# Copy built module
cp -r dist/ public/modules/aero-your-module/

# Set mode
echo "AERO_MODE=standalone" >> .env

# Run
php artisan serve
```

---

## 📋 Pre-flight Checklist

Before deploying your module:

- [ ] Models use `AeroTenantable` trait
- [ ] Routes use correct middleware
- [ ] `module.json` is complete
- [ ] Vite builds without errors
- [ ] Tested in both SaaS and Standalone
- [ ] No hardcoded tenant references

---

## 🔧 Common Issues

### "Cannot redeclare class"
**Solution:** RuntimeLoader already checks `class_exists()`. Verify:
```php
if (!class_exists($class, false)) {
    // Load class
}
```

### "Component not found"
**Solution:** Check `window.Aero.modules` in browser console:
```javascript
console.log(window.Aero.modules);
```

### Tenant scope not working
**Solution:** Ensure column exists:
```php
$table->integer('tenant_id')->default(1);
```

---

## 📚 Full Documentation

See [INTEGRATION_PILLARS_IMPLEMENTATION.md](./INTEGRATION_PILLARS_IMPLEMENTATION.md) for complete details.

---

## 🆘 Need Help?

1. Check browser console for errors
2. Check Laravel logs: `storage/logs/laravel.log`
3. Enable debug mode: `APP_DEBUG=true`
4. Review the implementation guide

---

## 🎓 Example Module

Reference implementation: `packages/aero-hrm/`

Study these files:
- `vite.config.js` - Build configuration
- `module.json` - Module metadata
- `resources/js/index.jsx` - Entry point
- `src/Models/Employee.php` - Model with trait

---

**That's it!** Write once, deploy anywhere. 🚀
