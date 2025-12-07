# Module Analysis Tools

**Manual-First Module Extraction Support Tools**

These tools support manual module extraction by providing analysis and validation capabilities. They **do NOT** perform automated extraction to maintain developer control and avoid inappropriate automated decisions.

## Tools Overview

### 1. 🔍 Dependency Analyzer
Analyzes module dependencies and generates reports for manual extraction planning.

**What it does:**
- Identifies all files related to a module
- Maps model relationships
- Detects shared dependencies
- Finds potential issues
- Generates comprehensive reports

**What it does NOT do:**
- Does NOT extract or copy files
- Does NOT modify any code
- Does NOT make extraction decisions

### 2. ✅ Extraction Validator
Validates manually extracted packages for completeness and correctness.

**What it does:**
- Checks package structure
- Validates composer.json
- Verifies namespaces were updated
- Checks for broken references
- Validates documentation

**What it does NOT do:**
- Does NOT perform extraction
- Does NOT fix issues automatically
- Does NOT modify extracted files

## Quick Start

### Analyze a Module

```bash
# Basic analysis
php tools/module-analysis/analyze.php hrm

# Save analysis report to file
php tools/module-analysis/analyze.php hrm --save

# Get JSON output
php tools/module-analysis/analyze.php crm --format=json
```

### Validate Extracted Package

```bash
# Validate package
php tools/module-analysis/validate.php ../packages/aero-hrm

# Save validation report
php tools/module-analysis/validate.php ../packages/aero-hrm --save
```

## Manual Extraction Workflow

### Step 1: Analyze Dependencies

```bash
php tools/module-analysis/analyze.php hrm --save
```

Review the generated report:
- **storage/module-analysis/dependency-analysis-Hrm-YYYY-MM-DD-HHMMSS.txt** (human-readable)
- **storage/module-analysis/dependency-analysis-Hrm-YYYY-MM-DD-HHMMSS.json** (machine-readable)

### Step 2: Plan Extraction

Review the analysis report and:
1. ✅ Identify all files to extract
2. ✅ Note model relationships
3. ✅ Check for shared dependencies
4. ✅ Review warnings
5. ✅ Create extraction checklist

### Step 3: Manual Extraction

Create package structure:
```bash
mkdir -p packages/aero-hrm/{src,database/migrations,routes,config,resources,tests}
```

Manually copy files:
1. Copy models to `packages/aero-hrm/src/Models/`
2. Copy controllers to `packages/aero-hrm/src/Http/Controllers/`
3. Copy services to `packages/aero-hrm/src/Services/`
4. Copy migrations to `packages/aero-hrm/database/migrations/`
5. Copy routes to `packages/aero-hrm/routes/`
6. Copy frontend files to `packages/aero-hrm/resources/js/`
7. Copy config to `packages/aero-hrm/config/`

### Step 4: Update Namespaces

Manually update all namespaces in copied files:

**From:**
```php
namespace App\Models\Tenant\Hrm;
use App\Models\Tenant\Hrm\Employee;
```

**To:**
```php
namespace AeroModules\Hrm\Models;
use AeroModules\Hrm\Models\Employee;
```

### Step 5: Create Package Files

Create required files manually:
- `composer.json` - Package definition
- `README.md` - Documentation
- Service Provider with mode detection
- `LICENSE` - License file
- `CHANGELOG.md` - Version history

### Step 6: Validate Extraction

```bash
php tools/module-analysis/validate.php packages/aero-hrm --save
```

Review validation report and fix any issues found.

### Step 7: Test Package

```bash
cd packages/aero-hrm
composer install
./vendor/bin/phpunit
```

## Analysis Report Structure

### Dependency Analysis Report

```
===============================================================================
  DEPENDENCY ANALYSIS REPORT: Hrm
===============================================================================
Generated: 2025-12-07 16:00:00

📊 SUMMARY
--------------------------------------------------------------------------------
  Migrations:          15 files
  Models:              8 files
  Controllers:         12 files
  Services:            5 files
  Frontend Pages:      10 files
  Frontend Components: 20 files

⚠️  WARNINGS
--------------------------------------------------------------------------------
  [CRITICAL] Module has shared dependencies
  └─ Review shared dependencies carefully before extraction

🔗 SHARED DEPENDENCIES
--------------------------------------------------------------------------------
  [model] User
  └─ Shared model - may be used by other modules

📦 MODELS & RELATIONSHIPS
--------------------------------------------------------------------------------
  Employee
    └─ belongsTo: User::class
    └─ belongsTo: Department::class
    └─ hasMany: Attendance::class
```

### Validation Report

```
===============================================================================
  EXTRACTION VALIDATION REPORT
===============================================================================
Package: packages/aero-hrm
Generated: 2025-12-07 16:00:00

Status: ✅ PASSED

⚠️  WARNINGS (2)
--------------------------------------------------------------------------------
  • Missing recommended file: LICENSE
  • README missing Requirements section

ℹ️  VALIDATION CHECKS
--------------------------------------------------------------------------------
  ✓ Directory exists: src
  ✓ Directory exists: database/migrations
  ✓ File exists: composer.json
  ✓ PSR-4 autoloading configured
  ✓ All namespaces updated correctly
  ✓ No hard-coded path references found
```

## Tips for Manual Extraction

### ✅ DO:
- Review analysis report thoroughly before starting
- Keep a checklist of files to extract
- Update namespaces systematically
- Test after each major change
- Validate frequently during extraction
- Document decisions and challenges

### ❌ DON'T:
- Copy files without reviewing them
- Skip namespace updates
- Ignore validation warnings
- Extract without understanding dependencies
- Rush the process

## Why Manual-First?

1. **Developer Control** - You make all decisions about what to include/exclude
2. **Complex Dependencies** - Properly handle relationships that automation might miss
3. **Quality Assurance** - Careful review of each file ensures correctness
4. **Learning** - Understand the module's structure deeply
5. **Flexibility** - Adapt to unique situations per module

## File Locations

- **Analysis Reports:** `storage/module-analysis/`
- **Validation Reports:** `packages/aero-{module}/validation-reports/`

## Troubleshooting

### Issue: Analysis finds no files
**Solution:** Verify module name matches directory structure. Module names are case-sensitive.

### Issue: Validation shows namespace errors
**Solution:** Search and replace all `App\` namespaces with your package namespace in all files.

### Issue: Validation shows broken references
**Solution:** Review and update any hard-coded paths to use relative paths or config values.

## Support

For questions or issues with these tools:
- Review the main documentation: `docs/MODULE_INDEPENDENCE_ARCHITECTURE_IMPROVEMENTS.md`
- Check the quick reference: `docs/MODULE_INDEPENDENCE_QUICK_REFERENCE.md`
- Review the executive summary: `ARCHITECTURE_REVIEW_SUMMARY.md`

## License

These tools are part of the Aero Enterprise Suite and follow the same license as the main application.
