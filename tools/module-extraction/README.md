# Module Extraction Tool

This toolset automatically extracts modules from the monolithic Aero Enterprise Suite application into independent, distributable Composer packages.

## Overview

The extraction tool takes a module (e.g., HRM, CRM, Finance) from the main application and creates a standalone package that:

- Works independently in any Laravel application
- Integrates seamlessly with the multi-tenant platform
- Includes all models, controllers, services, migrations, and frontend assets
- Has proper PSR-4 autoloading and Laravel auto-discovery
- Contains comprehensive tests and documentation

## Quick Start

```bash
# Extract HRM module
php tools/module-extraction/extract.php hrm

# Extract to custom location
php tools/module-extraction/extract.php crm --output=../packages/aero-crm

# Dry run (see what would be extracted)
php tools/module-extraction/extract.php finance --dry-run
```

## What Gets Extracted

### Backend Components:
- ✅ Models from `app/Models/{Module}/`
- ✅ Controllers from `app/Http/Controllers/{Module}/`
- ✅ Services from `app/Services/{Module}/`
- ✅ Middleware (module-specific)
- ✅ Form Requests from `app/Http/Requests/{Module}/`
- ✅ Policies from `app/Policies/{Module}/`
- ✅ Migrations from `database/migrations/tenant/`
- ✅ Seeders
- ✅ Routes from `routes/{module}.php`
- ✅ Configuration from `config/modules.php`

### Frontend Components:
- ✅ Pages from `resources/js/Tenant/Pages/{Module}/`
- ✅ Components (module-related)
- ✅ Tables (module-related)
- ✅ Forms (module-related)
- ✅ Frontend entry point

### Package Files:
- ✅ `composer.json` with proper autoloading
- ✅ Smart `ServiceProvider` with mode detection
- ✅ Comprehensive `README.md`
- ✅ `LICENSE.md`
- ✅ `CHANGELOG.md`
- ✅ `phpunit.xml` configuration
- ✅ Test files with TestCase base class

## Package Structure

After extraction, you'll get:

```
packages/aero-{module}/
├── composer.json              # Package definition
├── README.md                  # Documentation
├── LICENSE.md                 # License
├── CHANGELOG.md               # Version history
├── phpunit.xml               # Test configuration
├── src/
│   ├── {Module}ServiceProvider.php  # Smart provider
│   ├── Models/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Services/
│   └── Policies/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   └── {module}.php
├── config/
│   └── aero-{module}.php     # Module configuration
├── resources/
│   ├── js/
│   │   ├── app.jsx           # Frontend entry
│   │   ├── Pages/
│   │   ├── Components/
│   │   └── Forms/
│   └── views/
└── tests/
    ├── TestCase.php
    ├── Feature/
    └── Unit/
```

## How It Works

### 1. Namespace Transformation
```php
// From:
namespace App\Models\HRM;

// To:
namespace AeroModules\Hrm\Models;
```

### 2. Import Transformation
```php
// From:
use App\Models\HRM\Employee;

// To:
use AeroModules\Hrm\Models\Employee;
```

### 3. User Model Flexibility
```php
// Package uses configurable User model
$userModel = config('aero-hrm.auth.user_model', \App\Models\User::class);
```

### 4. Mode Detection
The generated ServiceProvider automatically detects:
- **Standalone mode**: Standard Laravel app
- **Platform mode**: Multi-tenant platform (platform context)
- **Tenant mode**: Multi-tenant platform (tenant context)

## Post-Extraction Steps

### 1. Review Extracted Files
```bash
cd packages/aero-{module}
tree -L 2
```

### 2. Install Dependencies
```bash
composer install
```

### 3. Run Tests
```bash
./vendor/bin/phpunit
```

### 4. Test Installation

In your main application:
```json
// composer.json
{
    "repositories": [
        {
            "type": "path",
            "url": "../packages/aero-{module}"
        }
    ]
}
```

```bash
composer require aero-modules/{module}:@dev
```

## Configuration

The extraction tool can be configured by modifying the `$config` array in `ModuleExtractor.php`:

```php
$config = [
    'vendor_name' => 'aero-modules',
    'author_name' => 'Your Company',
    'author_email' => 'dev@yourcompany.com',
    'license' => 'proprietary',
    'php_version' => '^8.2',
    'laravel_version' => '^11.0',
    'include_auth' => false,
    'include_frontend' => true,
    'include_tests' => true,
    'tenancy_support' => true,
    'standalone_support' => true,
];
```

## Troubleshooting

### Issue: Missing files
**Solution**: Check that the module follows the standard directory structure. The tool looks for files in specific locations.

### Issue: Namespace errors after extraction
**Solution**: Review the transformation patterns in `BaseExtractor.php` and adjust for your specific naming conventions.

### Issue: Frontend assets not found
**Solution**: Verify that frontend files contain module-related keywords that the tool can detect.

### Issue: Tests failing
**Solution**: Ensure all dependencies are installed and update the TestCase base class with proper configuration.

## Advanced Usage

### Custom Output Directory
```bash
php extract.php hrm --output=/custom/path
```

### Batch Extraction Script
```bash
#!/bin/bash
modules=("hrm" "crm" "finance" "project")
for module in "${modules[@]}"; do
    php extract.php "$module"
done
```

## Next Steps After Extraction

1. **Test the Package**: Install in a fresh Laravel app and test all functionality
2. **Refine Configuration**: Adjust the generated config file for your needs
3. **Add Documentation**: Expand the README with usage examples
4. **Setup CI/CD**: Add GitHub Actions for automated testing
5. **Publish**: Push to your package registry (Packagist, GitHub Packages, or Satis)

## Support

For issues or questions:
- Check the main documentation: `docs/module-independence-architecture.md`
- Review the flowcharts for understanding the architecture
- Contact the development team

## License

This tool is part of the Aero Enterprise Suite and follows the same license as the main application.
