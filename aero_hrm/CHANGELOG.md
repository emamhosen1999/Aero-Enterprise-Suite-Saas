# Changelog

All notable changes to the Aero Core package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for v1.1.0
- Controllers (UserController, RoleController, ProfileController)
- API Resources (UserResource, RoleResource, ModuleResource)
- Frontend layouts (AuthenticatedLayout, Sidebar, Header)
- Frontend pages (Login, Register, Dashboard, Profile, Users, Roles)
- Navigation system (pages.jsx)
- Factory classes for testing
- Seeder classes for default data
- Feature tests
- Unit tests

## [1.0.0] - 2025-01-01

### Added - Foundation Release

#### Models
- **User Model** - Complete user authentication with:
  - Laravel Fortify integration (2FA, email verification)
  - OAuth support (provider, token, refresh token)
  - Spatie Permission integration (roles & permissions)
  - Device management (single-device login, device tracking)
  - Module access helper methods
  - Account management (lock/unlock, activate/deactivate)
  - Multi-tenancy support
  - Profile management with Media Library
  - Push notifications support
  
- **UserDevice Model** - Device tracking and management:
  - Device identification and fingerprinting
  - Browser and platform detection
  - IP address logging
  - Active/inactive device status
  - Last used timestamps
  
- **Module Model** - Top-level module hierarchy:
  - Code-based identification
  - Priority ordering
  - Active/inactive status
  - Subscription requirement flag
  - Route prefix configuration
  - Package reference
  
- **SubModule Model** - Sub-module under module:
  - Parent module relationship
  - Component associations
  - Priority ordering
  
- **Component Model** - Component under sub-module:
  - Route name mapping
  - Action associations
  
- **Action Model** - Action within component:
  - Granular permission control

#### Services
- **ModuleAccessService** - Module access control logic:
  - Hierarchical access checking (Module → SubModule → Component → Action)
  - Subscription-based access control
  - Role-based permission checking
  - Caching with tag-based invalidation
  - Super admin bypass
  - Accessible modules retrieval
  
- **RoleModuleAccessService** - Role-module assignment:
  - Role access tree generation
  - Module/SubModule/Component/Action assignment
  - Bulk access synchronization
  - Permission auto-creation
  - Cache management

#### Traits
- **TenantScoped** - Automatic tenant scoping:
  - Global scope for tenant isolation
  - Automatic tenant_id assignment on create
  - Tenant relationship
  - Scope removal for admin queries

#### Middleware
- **ModuleAccessMiddleware** - Route-level access enforcement:
  - Module access checking
  - SubModule access checking
  - Component access checking
  - Action access checking (future)
  - 403 Forbidden responses with reasons

#### Routes
- **Web Routes** (`/core` prefix):
  - Authentication (login, register, logout)
  - Dashboard
  - Profile management (view, update, avatar upload)
  - User management (CRUD, invite, password reset, lock/unlock)
  - Role management (CRUD, module access sync)
  
- **API Routes** (`/api/core` prefix):
  - User API (CRUD)
  - Role API (list, show, access tree)
  - Module API (list, accessible, show)

#### Migrations
- `create_users_table` - Complete user schema with OAuth, 2FA, devices, preferences
- `create_user_devices_table` - Device tracking schema
- `create_modules_table` - Module hierarchy root
- `create_sub_modules_table` - Sub-modules
- `create_components_table` - Components
- `create_actions_table` - Actions

#### Configuration
- **modules.php** - Core module definitions:
  - Dashboard module
  - User Management module
  - Roles & Permissions module
  - Settings module
  - Access control settings (super admin role, cache TTL)

#### Service Provider
- **AeroCoreServiceProvider**:
  - Service registration (singleton bindings)
  - Config merging
  - Migration loading
  - Route registration (web + API)
  - Asset publishing (migrations, config, JS assets, views)
  - View namespace registration

#### Documentation
- **README.md** - Comprehensive package documentation (489 lines)
- **QUICK_START.md** - Quick start integration guide (400+ lines)
- **BATCH_1_COMPLETION.md** - Implementation completion report (500+ lines)
- **CHANGELOG.md** - This file

#### Package Configuration
- **composer.json**:
  - Package metadata and description
  - PHP 8.2+ requirement
  - Laravel 11 compatibility
  - Dependencies (Tenancy, Spatie Permission, Inertia, Fortify, Sanctum, Media Library)
  - PSR-4 autoloading
  - Service provider auto-discovery
  - Development dependencies (PHPUnit, Orchestra Testbench)

### Dependencies
- `php: ^8.2`
- `laravel/framework: ^11.0`
- `stancl/tenancy: ^3.9`
- `spatie/laravel-permission: ^6.20`
- `inertiajs/inertia-laravel: ^2.0`
- `laravel/fortify: ^1.24`
- `laravel/sanctum: ^4.0`
- `spatie/laravel-medialibrary: ^11.0`

### Architecture Decisions
- Used Aero\Core namespace for all package classes
- Implemented dot notation for permissions (e.g., `module.hrm.employee_management.employee_list.create`)
- Cached access checks with 1-hour TTL and tag-based invalidation
- Super admin role (`super-admin`) bypasses all module checks
- Automatic tenant scoping via global scope in TenantScoped trait
- Route prefix `/core` for web, `/api/core` for API
- Middleware alias `module.access` for route protection

### Performance
- Implemented aggressive caching strategy for module access checks
- Used cache tags for efficient invalidation
- Added database indexes on frequently queried columns
- Lazy loading of relationships where appropriate

### Security
- All routes protected with authentication middleware
- Module access middleware for authorization
- Password hashing via Laravel's bcrypt
- Two-factor authentication support
- Device tracking and single-device login enforcement
- Account locking mechanism
- Sanctum token-based API authentication

### Statistics
- **Total Files Created:** 22
- **Total Lines of Code:** ~2,700+
- **Models:** 7 files (863 lines)
- **Services:** 2 files (523 lines)
- **Migrations:** 6 files
- **Documentation:** 4 files (1,500+ lines)

## [0.1.0] - 2024-12-20

### Added
- Initial package structure
- Composer.json with dependencies
- Basic directory layout

---

## Version History

- **v1.0.0** (2025-01-01) - Foundation Release (current)
- **v0.1.0** (2024-12-20) - Initial Structure

---

## Migration Guide

### From Platform's User Model to Aero Core

If migrating from the platform's `App\Models\Shared\User` model:

1. **Update imports:**
   ```php
   // Old
   use App\Models\Shared\User;
   
   // New
   use Aero\Core\Models\User;
   ```

2. **No functionality lost** - All 622 lines of the original User model functionality preserved

3. **Run migrations:**
   ```bash
   php artisan migrate
   ```

4. **Clear caches:**
   ```bash
   php artisan config:clear
   php artisan permission:cache-reset
   composer dump-autoload
   ```

---

## Breaking Changes

None - Initial release.

---

## Known Issues

- Controllers not yet implemented (planned for v1.1.0)
- Frontend layouts not yet implemented (planned for v1.1.0)
- Tests not yet implemented (planned for v1.1.0)
- Seeders not yet implemented (planned for v1.1.0)

---

## Credits

- **Aero Development Team** - Initial development
- **Spatie** - Laravel Permission package
- **Stancl** - Tenancy for Laravel
- **Laravel Team** - Framework, Fortify, Sanctum

---

## License

Proprietary - Aero Enterprise Suite

---

**Note:** This is a living document. All notable changes will be documented here as the package evolves.
