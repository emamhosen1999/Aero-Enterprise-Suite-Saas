# Manual Module Extraction Checklist

Use this checklist when manually extracting a module to ensure nothing is missed.

## Module: ________________     Date: ________________

---

## Phase 1: Pre-Extraction Analysis

- [ ] Run dependency analyzer: `php tools/module-analysis/analyze.php {module} --save`
- [ ] Review analysis report thoroughly
- [ ] Document all files to be extracted
- [ ] Identify model relationships
- [ ] Note shared dependencies
- [ ] Review warnings and plan mitigation
- [ ] Create extraction plan document

---

## Phase 2: Package Structure Setup

- [ ] Create package root directory: `packages/aero-{module}/`
- [ ] Create `src/` directory
- [ ] Create `src/Models/` directory
- [ ] Create `src/Http/Controllers/` directory
- [ ] Create `src/Http/Middleware/` directory
- [ ] Create `src/Http/Requests/` directory
- [ ] Create `src/Services/` directory
- [ ] Create `src/Policies/` directory
- [ ] Create `database/migrations/` directory
- [ ] Create `database/seeders/` directory
- [ ] Create `database/factories/` directory
- [ ] Create `routes/` directory
- [ ] Create `config/` directory
- [ ] Create `resources/js/` directory
- [ ] Create `resources/views/` directory (if needed)
- [ ] Create `tests/Feature/` directory
- [ ] Create `tests/Unit/` directory

---

## Phase 3: Backend Files Extraction

### Models
- [ ] Copy models from `app/Models/{Module}/` to `src/Models/`
- [ ] List all models copied: ___________________________________
- [ ] Verify all model files have no shared dependencies

### Controllers
- [ ] Copy controllers from `app/Http/Controllers/{Module}/` to `src/Http/Controllers/`
- [ ] List all controllers copied: ___________________________________

### Services
- [ ] Copy services from `app/Services/{Module}/` to `src/Services/`
- [ ] List all services copied: ___________________________________

### Middleware
- [ ] Copy module-specific middleware to `src/Http/Middleware/`
- [ ] List middleware copied: ___________________________________

### Form Requests
- [ ] Copy form requests from `app/Http/Requests/{Module}/` to `src/Http/Requests/`
- [ ] List requests copied: ___________________________________

### Policies
- [ ] Copy policies from `app/Policies/{Module}/` to `src/Policies/`
- [ ] List policies copied: ___________________________________

### Migrations
- [ ] Copy migrations to `database/migrations/`
- [ ] List migrations copied (count): ___________
- [ ] Verify migration order is maintained

### Seeders
- [ ] Copy seeders to `database/seeders/`
- [ ] List seeders copied: ___________________________________

### Routes
- [ ] Copy routes from `routes/{module}.php` to `routes/{module}.php`
- [ ] Extract relevant routes from `routes/tenant.php` if needed
- [ ] Verify route names are unique to module

### Config
- [ ] Extract module config from `config/modules.php`
- [ ] Create `config/aero-{module}.php`
- [ ] Include all module-specific configuration

---

## Phase 4: Frontend Files Extraction

### Pages
- [ ] Copy pages from `resources/js/Tenant/Pages/{Module}/` to `resources/js/Pages/`
- [ ] List pages copied: ___________________________________

### Components
- [ ] Copy components from `resources/js/Components/{Module}/` to `resources/js/Components/`
- [ ] Copy module-related components from shared components
- [ ] List components copied: ___________________________________

### Tables
- [ ] Copy table components that reference module
- [ ] List tables copied: ___________________________________

### Forms
- [ ] Copy form components that reference module
- [ ] List forms copied: ___________________________________

### Layouts (if module-specific)
- [ ] Copy any module-specific layouts
- [ ] List layouts copied: ___________________________________

---

## Phase 5: Namespace & Import Updates

### Backend Namespace Updates
- [ ] Update model namespaces: `App\Models\{Module}` → `AeroModules\{Module}\Models`
- [ ] Update controller namespaces: `App\Http\Controllers\{Module}` → `AeroModules\{Module}\Http\Controllers`
- [ ] Update service namespaces: `App\Services\{Module}` → `AeroModules\{Module}\Services`
- [ ] Update middleware namespaces
- [ ] Update request namespaces
- [ ] Update policy namespaces
- [ ] Update all `use` statements in all files
- [ ] Search for remaining `App\` namespaces: `grep -r "namespace App" src/`

### Frontend Import Updates
- [ ] Update import paths in all React files
- [ ] Update route imports
- [ ] Update API endpoint references
- [ ] Verify no hard-coded paths remain

---

## Phase 6: Package Files Creation

### composer.json
- [ ] Create `composer.json`
- [ ] Set package name: `aero-modules/{module}`
- [ ] Set description
- [ ] Set type: `library`
- [ ] Configure PSR-4 autoloading
- [ ] Add Laravel service provider auto-discovery
- [ ] Add dependencies
- [ ] Set PHP version requirement
- [ ] Add author information
- [ ] Set license

### Service Provider
- [ ] Create `src/{Module}ServiceProvider.php`
- [ ] Implement `register()` method
- [ ] Implement `boot()` method
- [ ] Add mode detection (standalone/platform/tenant)
- [ ] Register routes
- [ ] Load migrations
- [ ] Load views (if any)
- [ ] Publish config
- [ ] Publish migrations
- [ ] Publish assets
- [ ] Register console commands (if any)

### README.md
- [ ] Create `README.md`
- [ ] Add module description
- [ ] Add requirements section
- [ ] Add installation instructions
- [ ] Add usage examples
- [ ] Add configuration guide
- [ ] Add API documentation (if applicable)
- [ ] Add troubleshooting section

### LICENSE
- [ ] Create `LICENSE` file
- [ ] Add appropriate license text

### CHANGELOG.md
- [ ] Create `CHANGELOG.md`
- [ ] Add initial version entry (1.0.0)

### phpunit.xml
- [ ] Create `phpunit.xml` configuration
- [ ] Configure test directories
- [ ] Set coverage settings

---

## Phase 7: Tests

- [ ] Copy existing tests related to module
- [ ] Create `tests/TestCase.php` base class
- [ ] Update test namespaces
- [ ] Write new tests for critical paths
- [ ] Ensure minimum 80% coverage for models
- [ ] Test standalone mode
- [ ] Test platform mode (if applicable)
- [ ] Test tenant mode (if applicable)

---

## Phase 8: Validation

- [ ] Run extraction validator: `php tools/module-analysis/validate.php packages/aero-{module} --save`
- [ ] Review validation report
- [ ] Fix all errors
- [ ] Address warnings (document if can't fix)
- [ ] Verify no `App\` namespaces remain: `grep -r "App\\\\" src/`
- [ ] Verify no hard-coded paths: `grep -r "app/Models" src/`
- [ ] Check for debugging statements: `grep -r "dd(" src/`
- [ ] Check for debugging statements: `grep -r "dump(" src/`

---

## Phase 9: Testing

- [ ] Run `composer install` in package directory
- [ ] Run `composer dump-autoload`
- [ ] Run PHPUnit tests: `./vendor/bin/phpunit`
- [ ] Verify all tests pass
- [ ] Test in standalone Laravel app
- [ ] Install package via composer local path
- [ ] Run migrations
- [ ] Test basic CRUD operations
- [ ] Test relationships
- [ ] Test frontend pages load correctly

---

## Phase 10: Documentation

- [ ] Update main package README with actual usage
- [ ] Document any known limitations
- [ ] Document configuration options
- [ ] Add code examples
- [ ] Document breaking changes from monolith
- [ ] Create migration guide for existing users

---

## Phase 11: Final Review

- [ ] Code review by peer
- [ ] Security review
- [ ] Performance review
- [ ] Accessibility check (frontend)
- [ ] Documentation review
- [ ] License compliance check
- [ ] Verify no secrets or sensitive data included

---

## Phase 12: Lessons Learned

Document challenges and solutions:

### Challenges Encountered:
1. ___________________________________________________________________________
2. ___________________________________________________________________________
3. ___________________________________________________________________________

### Solutions Applied:
1. ___________________________________________________________________________
2. ___________________________________________________________________________
3. ___________________________________________________________________________

### Improvements for Next Extraction:
1. ___________________________________________________________________________
2. ___________________________________________________________________________
3. ___________________________________________________________________________

---

## Sign-off

- [ ] All checklist items completed
- [ ] Package validated successfully
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Ready for deployment/publication

**Extracted by:** ___________________     **Date:** ___________________

**Reviewed by:** ___________________     **Date:** ___________________

**Approved by:** ___________________     **Date:** ___________________

---

## Notes

Use this space for any additional notes or special considerations:

___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
