# Module Extraction Tools

This directory contains automation scripts to help extract modules from the monolithic Aero Enterprise Suite SaaS application.

## Scripts

### 1. extract-module.sh

Automates the extraction of a module into a separate package repository.

**Usage:**
```bash
./extract-module.sh <module-name> [module-path]
```

**Examples:**
```bash
# Extract Support module
./extract-module.sh support Support

# Extract HRM module
./extract-module.sh hrm HRM

# Extract CRM module
./extract-module.sh crm CRM
```

**What it does:**
- Creates a new package repository structure
- Copies relevant files from the monolithic app
- Updates composer.json and package.json
- Creates service provider
- Initializes git repository
- Updates basic documentation

**Output:**
The script creates a new directory structure at `../extracted-modules/aero-<module-name>-module/`

### 2. update-namespaces.sh

Updates PHP namespaces from monolithic structure to package structure.

**Usage:**
```bash
./update-namespaces.sh <module-name> <module-path> [target-directory]
```

**Examples:**
```bash
# Update namespaces in current directory
./update-namespaces.sh support Support .

# Update namespaces in src directory
./update-namespaces.sh hrm HRM ./src
```

**What it does:**
- Updates namespace declarations
- Updates use statements
- Preserves certain shared dependencies (User model, base controllers)
- Updates Inertia::render() calls to use module namespace

## Workflow

### Complete Module Extraction Process

1. **Extract the module:**
   ```bash
   ./tools/extract-module.sh <module-name> <MODULE_PATH>
   ```

2. **Review extracted files:**
   ```bash
   cd ../extracted-modules/aero-<module-name>-module
   ```

3. **Manual adjustments:**
   - Review namespace updates
   - Check for missing dependencies
   - Update routes if needed
   - Verify frontend imports

4. **Install dependencies:**
   ```bash
   composer install
   npm install
   ```

5. **Run tests:**
   ```bash
   vendor/bin/phpunit
   ```

6. **Create remote repository:**
   ```bash
   # On GitHub/GitLab, create new repository
   git remote add origin <repository-url>
   git push -u origin main
   ```

7. **Install in main platform:**
   ```bash
   cd /path/to/Aero-Enterprise-Suite-Saas
   
   # Add to composer.json
   "repositories": [
       {
           "type": "vcs",
           "url": "<repository-url>"
       }
   ],
   "require": {
       "aero/<module-name>-module": "^1.0"
   }
   
   # Install
   composer require aero/<module-name>-module
   
   # Publish assets
   php artisan vendor:publish --tag=<module-name>-assets
   
   # Run migrations
   php artisan migrate
   ```

## Configuration

### Environment Variables

You can customize the output directory by setting:

```bash
export MODULES_OUTPUT_DIR="/path/to/output/directory"
./tools/extract-module.sh support Support
```

## Troubleshooting

### Issue: Files not copied

**Solution:** Check that the paths in the main repository match the expected structure. Update the script's copy commands if needed.

### Issue: Namespace updates incomplete

**Solution:** Run the update-namespaces.sh script manually on specific directories:
```bash
./tools/update-namespaces.sh <module> <MODULE> ./path/to/files
```

### Issue: Tests failing after extraction

**Solution:** Ensure test base classes and factories are either:
- Copied to the module repository
- Available in a shared core package
- Included via dev dependencies

## Best Practices

1. **Always review manually** after running scripts
2. **Test thoroughly** before committing
3. **Document changes** in CHANGELOG.md
4. **Version appropriately** using semantic versioning
5. **Update dependencies** to match main platform

## Support

For questions or issues, contact the development team or refer to:
- [Module Extraction Guide](../docs/MODULE_EXTRACTION_GUIDE.md)
- [Module Extraction Example](../docs/MODULE_EXTRACTION_EXAMPLE.md)
