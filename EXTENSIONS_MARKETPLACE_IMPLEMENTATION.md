# Extensions Marketplace Implementation

Complete implementation of the Extensions Marketplace system for managing modules in the Aero Enterprise Suite.

## Overview

The Extensions Marketplace provides a centralized interface for:
- **Viewing installed modules** with activate/deactivate controls
- **Browsing available marketplace modules** from CodeCanyon
- **Uploading purchased module ZIPs** with purchase code validation
- **Checking for updates** across all installed modules
- **Managing module settings** on a per-module basis

---

## Architecture

### Backend Components

#### 1. ExtensionsController (`packages/aero-core/src/Http/Controllers/Admin/ExtensionsController.php`)
**Purpose:** Main controller for Extensions Marketplace operations

**Methods:**
- `index()` - Display marketplace page with installed and available modules
- `toggle($moduleCode)` - Activate or deactivate a module
- `upload(Request)` - Upload and install module ZIP with purchase code validation
- `checkUpdates()` - Check for module updates from marketplace API
- `settings($moduleCode)` - Display module-specific settings page

**Key Features:**
- ZIP extraction and validation
- Purchase code verification via MarketplaceService
- Automatic Composer dependency installation
- Database migration execution
- Module registration and cache clearing

#### 2. MarketplaceService (`packages/aero-core/src/Services/MarketplaceService.php`)
**Purpose:** Handle CodeCanyon/Marketplace API integration

**Methods:**
- `getAvailableModules()` - Fetch marketplace modules (cached for 1 hour)
- `validatePurchaseCode($code)` - Verify Envato purchase codes
- `checkForUpdates()` - Compare installed vs latest versions
- `getPurchasedCodes()` - Get tenant's purchased module codes
- `savePurchaseCode($moduleCode, $code)` - Store purchase information

**Configuration:** Uses `config/marketplace.php` for API endpoints and fallback module data

#### 3. Database Schema

**module_purchases table:**
```sql
CREATE TABLE module_purchases (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(255) INDEX,
    module_code VARCHAR(255) INDEX,
    purchase_code VARCHAR(255) UNIQUE,
    purchased_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, module_code)
);
```

### Frontend Components

#### React Page (`packages/aero-core/resources/js/Pages/Admin/Extensions/Index.jsx`)
**Purpose:** Extensions Marketplace UI with HeroUI components

**Features:**
- **Two-tab interface:** Installed Modules | Marketplace
- **Module cards:** Thumbnail, description, features, pricing
- **Action buttons:**
  - Installed: Activate/Deactivate, Settings
  - Marketplace: Buy on CodeCanyon, Preview
- **Upload modal:** ZIP file + purchase code input
- **Update checker:** Check all modules for updates

**UI Patterns:**
- Follows HeroUI design system
- Theme-aware radius and colors
- Toast notifications with promise pattern
- Responsive grid layout (1/2/3 columns)
- Skeleton loading states

### Configuration

#### marketplace.php (`packages/aero-core/config/marketplace.php`)
**Purpose:** Define marketplace settings and module catalog

**Configuration:**
```php
'api_url' => env('MARKETPLACE_API_URL', 'https://api.marketplace.aerosuite.com'),
'api_key' => env('MARKETPLACE_API_KEY', ''),

'envato' => [
    'enabled' => env('ENVATO_ENABLED', true),
    'api_token' => env('ENVATO_API_TOKEN', ''),
    'author_username' => env('ENVATO_AUTHOR_USERNAME', 'aerosuite'),
],

'modules' => [
    // Complete module definitions with pricing, features, requirements
],

'categories' => [
    'Core Business' => ['hrm'],
    'Sales & Marketing' => ['crm'],
    // ... other categories
],
```

### Routes

#### Registered in `packages/aero-core/routes/web.php`:
```php
Route::prefix('extensions')->name('core.extensions.')->group(function () {
    Route::get('/', [ExtensionsController::class, 'index'])->name('index');
    Route::post('/{moduleCode}/toggle', [ExtensionsController::class, 'toggle'])->name('toggle');
    Route::post('/upload', [ExtensionsController::class, 'upload'])->name('upload');
    Route::get('/check-updates', [ExtensionsController::class, 'checkUpdates'])->name('checkUpdates');
    Route::get('/{moduleCode}/settings', [ExtensionsController::class, 'settings'])->name('settings');
});
```

### Navigation

**Added to Core navigation (`packages/aero-core/resources/js/navigation/pages.jsx`):**
```javascript
{
    name: 'Extensions',
    icon: 'PuzzlePieceIcon',
    route: 'core.extensions.index',
    access: 'core.extensions',
    priority: 4,
}
```

---

## Available Modules

### Marketplace Catalog (Defined in config/marketplace.php)

1. **HRM** - Human Resource Management ($29)
2. **CRM** - Customer Relationship Management ($29)
3. **Finance** - Finance & Accounting ($39)
4. **Project** - Project Management ($35)
5. **POS** - Point of Sale ($49)
6. **SCM** - Supply Chain Management ($59)
7. **IMS** - Inventory Management ($35)
8. **DMS** - Document Management ($25)
9. **Quality** - Quality Management ($45)
10. **Compliance** - Compliance Management ($49)

Each module includes:
- Version information
- CodeCanyon URL
- Preview/demo URL
- Feature list
- Requirements (PHP version, dependencies)
- Pricing (USD)
- Category classification

---

## User Workflows

### Workflow 1: Customer Purchases Module from CodeCanyon

1. Customer browses CodeCanyon marketplace
2. Purchases module (e.g., HRM for $29)
3. Receives purchase code: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
4. Downloads module ZIP file

### Workflow 2: Customer Installs Module via Upload

1. Navigate to **Extensions** page in Core
2. Click **"Upload Module"** button
3. Select downloaded ZIP file
4. Enter purchase code
5. Click **"Install Module"**

**Backend Process:**
- Validates purchase code with Envato API
- Extracts ZIP to temporary directory
- Validates `module.json` structure
- Copies files to `packages/aero-{module}/`
- Runs `composer install` in module directory
- Executes database migrations
- Registers module in ModuleManager
- Stores purchase code in `module_purchases` table
- Clears application cache

### Workflow 3: Customer Activates/Deactivates Module

1. Navigate to **Extensions** → **Installed Modules** tab
2. View module card with current status
3. Click **"Activate"** or **"Deactivate"** button
4. System updates `module.json` `enabled` field
5. Refreshes module registry cache

### Workflow 4: Customer Checks for Updates

1. Click **"Check Updates"** button
2. System queries marketplace API for each installed module
3. Compares current version vs latest version
4. Displays notification: "X update(s) available"
5. Future: Download and install updates automatically

---

## Module Upload Process (Detailed)

### 1. File Validation
```php
// Validate ZIP file
$file->extension() === 'zip'
$file->getSize() <= 100MB
```

### 2. Purchase Code Verification
```php
$validation = $marketplaceService->validatePurchaseCode($purchaseCode);
if (!$validation['valid']) {
    throw ValidationException('Invalid purchase code');
}
```

### 3. ZIP Extraction
```php
$zip = new ZipArchive();
$zip->extractTo($tempDir);
```

### 4. Module.json Validation
```php
$moduleJson = json_decode(file_get_contents("$tempDir/module.json"));
// Required fields: name, short_name, version, providers
```

### 5. File Copy to Packages
```php
$destination = base_path("packages/aero-{$moduleCode}");
recursiveCopy($tempDir, $destination);
```

### 6. Composer Install
```php
exec("cd $destination && composer install --no-dev --optimize-autoloader");
```

### 7. Database Migrations
```php
Artisan::call('migrate', [
    '--path' => "packages/aero-{$moduleCode}/database/migrations",
    '--force' => true,
]);
```

### 8. Module Registration
```php
$moduleManager->register($moduleCode);
Cache::tags(['modules'])->flush();
```

### 9. Purchase Code Storage
```php
$marketplaceService->savePurchaseCode($moduleCode, $purchaseCode);
```

---

## Integration with Build System

### Product Builder (build-product.ps1)
When building products, modules are included as part of the package:
```powershell
.\scripts\build-product.ps1 -Product hrm-crm-bundle
# Output: aero-hrm-crm-bundle-v1.0.0.zip (includes HRM + CRM modules)
```

### Module Builder (build-module.ps1)
Build lightweight add-on modules for existing customers:
```powershell
.\scripts\build-module.ps1 -Modules finance,project
# Output: aero-finance-v1.0.0.zip, aero-project-v1.0.0.zip
```

### Sales Flow
1. **Sell Full Product:** Customer purchases "HRM Standalone" from CodeCanyon
2. **Upsell Add-ons:** Customer sees "Finance" and "Project" in Extensions marketplace
3. **Purchase Add-on:** Customer buys "Finance" module separately
4. **Install Add-on:** Customer uploads ZIP via Extensions page

---

## Security Considerations

### Purchase Code Validation
- All uploads require valid Envato purchase code
- Purchase codes stored per tenant
- One purchase code = one module instance per tenant

### File Upload Security
- ZIP file validation (magic bytes, size limits)
- Sandbox extraction to temporary directory
- Validation before copying to production directories
- No executable file execution during installation

### Module Isolation
- Each module in separate `packages/aero-{module}/` directory
- Module-specific Composer dependencies
- Tenant-scoped database migrations
- Cache namespace isolation

---

## Environment Configuration

### Required Environment Variables

```env
# Marketplace API (Optional - uses fallback if not set)
MARKETPLACE_API_URL=https://api.marketplace.aerosuite.com
MARKETPLACE_API_KEY=your-api-key-here

# Envato Integration (Required for purchase code validation)
ENVATO_ENABLED=true
ENVATO_API_TOKEN=your-envato-token
ENVATO_AUTHOR_USERNAME=aerosuite
```

### Publish Config Files
```bash
php artisan vendor:publish --tag=marketplace-config
```

---

## Testing

### Manual Testing Checklist

**Installed Modules Tab:**
- [ ] View all installed modules with correct status
- [ ] Activate inactive module
- [ ] Deactivate active module
- [ ] Navigate to module settings page
- [ ] View module thumbnails (or placeholder)

**Marketplace Tab:**
- [ ] View all available modules
- [ ] See correct pricing and features
- [ ] Click "Buy on CodeCanyon" opens correct URL
- [ ] Click "Preview" opens demo site

**Upload Module:**
- [ ] Open upload modal
- [ ] Select ZIP file
- [ ] Enter purchase code
- [ ] Submit and see loading state
- [ ] See success message
- [ ] Module appears in Installed tab
- [ ] Module is registered and accessible

**Check Updates:**
- [ ] Click "Check Updates" button
- [ ] See loading state
- [ ] Get notification of available updates
- [ ] Or "All modules up to date" message

### Error Scenarios
- [ ] Upload non-ZIP file → Error message
- [ ] Upload without purchase code → Error message
- [ ] Invalid purchase code → Error message
- [ ] Corrupt ZIP file → Error message
- [ ] Missing module.json → Error message
- [ ] Duplicate module upload → Error message

---

## Future Enhancements

### Phase 2: Automatic Updates
- One-click update installation
- Changelog display
- Rollback capability
- Backup before update

### Phase 3: Module Dependencies
- Check required modules before activation
- Auto-install dependencies
- Dependency graph visualization

### Phase 4: Module Marketplace Ratings
- User reviews and ratings
- Module popularity metrics
- Featured modules section

### Phase 5: License Management
- Multi-site licenses
- License key validation
- Usage analytics per license

---

## Troubleshooting

### Module Upload Fails
**Symptom:** "Failed to install module" error

**Solutions:**
1. Check disk space: `df -h`
2. Check file permissions: `chmod -R 755 packages/`
3. Check Composer availability: `composer --version`
4. Check purchase code validity
5. Review Laravel logs: `storage/logs/laravel.log`

### Module Not Appearing After Upload
**Symptom:** Module uploaded but not visible

**Solutions:**
1. Clear cache: `php artisan cache:clear`
2. Clear config: `php artisan config:clear`
3. Rebuild module registry: `php artisan aero:sync-module`

### Purchase Code Validation Fails
**Symptom:** "Invalid purchase code" error

**Solutions:**
1. Verify Envato API token in `.env`
2. Check purchase code format (UUID)
3. Ensure purchase code not already used
4. Check Envato API status

---

## Related Documentation

- **Build Guide:** `BUILD_GUIDE.md` - Product and module building strategy
- **Product Config:** `config/products.php` - Product definitions
- **Module Config:** `config/marketplace.php` - Marketplace module catalog
- **Module Extraction:** `docs/MODULE_EXTRACTION_GUIDE.md` - Creating new modules

---

## File Reference

### Backend Files
```
packages/aero-core/
├── src/
│   ├── Http/Controllers/Admin/
│   │   └── ExtensionsController.php
│   ├── Services/
│   │   └── MarketplaceService.php
│   └── AeroCoreServiceProvider.php
├── config/
│   └── marketplace.php
├── database/migrations/
│   └── 2025_12_11_170827_create_module_purchases_table.php
└── routes/
    └── web.php
```

### Frontend Files
```
packages/aero-core/resources/js/
├── Pages/Admin/Extensions/
│   └── Index.jsx
└── navigation/
    └── pages.jsx
```

### Build Files
```
scripts/
├── build-product.ps1
└── build-module.ps1
```

---

## Summary

The Extensions Marketplace system provides a complete solution for:
- ✅ Managing installed modules (activate/deactivate)
- ✅ Browsing available marketplace modules
- ✅ Installing purchased modules via ZIP upload
- ✅ Validating purchase codes with Envato
- ✅ Checking for module updates
- ✅ Module-specific settings pages

**Complete integration** with the existing build system allows selling:
1. **Standalone products** (HRM only, CRM only, etc.)
2. **Bundle products** (HRM + CRM, Full ERP Suite)
3. **Add-on modules** (Finance, Project, POS, etc.)

Customers can purchase base products and later expand with add-on modules through the Extensions Marketplace, creating a flexible and scalable product ecosystem.
