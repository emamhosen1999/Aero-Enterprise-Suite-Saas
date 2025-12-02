# Tenant Provisioning with Automatic Seeding

## Overview

Tenant provisioning now automatically seeds roles, permissions, and module permissions during the provisioning process. This ensures every new tenant has a fully functional system immediately after creation.

## Provisioning Flow

The `ProvisionTenant` job now includes the following steps:

1. **Mark as Provisioning** - Set tenant status to 'provisioning'
2. **Create Database** - Create dedicated tenant database
3. **Run Migrations** - Apply all tenant-specific migrations
4. **Seed Admin User** - Create initial admin user account
5. **Seed Roles & Permissions** - Create 10 roles and 700+ permissions
6. **Seed Module Permissions** - Map permissions to modules
7. **Assign Super Administrator** - Grant admin user full access
8. **Activate Tenant** - Mark tenant as active and clear sensitive data

## Seeder Organization

### Landlord Seeders
Location: `database/seeders/`
- Platform-level data
- Module structure definitions
- Plan configurations

### Tenant Seeders
Location: `database/seeders/Tenant/`
- `ComprehensiveRolePermissionSeeder.php` - 10 roles and 700+ permissions
- `ModulePermissionSeeder.php` - Module permission mappings

## Seeding Methods

### seedRolesAndPermissions()
```php
protected function seedRolesAndPermissions(): void
{
    tenancy()->initialize($this->tenant);
    
    try {
        $seeder = new \Database\Seeders\Tenant\ComprehensiveRolePermissionSeeder;
        $seeder->run();
    } finally {
        tenancy()->end();
    }
}
```

**Creates:**
- Super Administrator (full access)
- Administrator (high-level access)
- HR Manager (HR-specific permissions)
- Project Manager (project-specific permissions)
- Department Manager (department-specific permissions)
- Team Lead (team management permissions)
- Senior Employee (extended permissions)
- Employee (standard permissions)
- Contractor (limited permissions)
- Intern (minimal permissions)

### seedModulePermissions()
```php
protected function seedModulePermissions(): void
{
    tenancy()->initialize($this->tenant);
    
    try {
        $seeder = new \Database\Seeders\Tenant\ModulePermissionSeeder;
        $seeder->run();
    } finally {
        tenancy()->end();
    }
}
```

**Maps permissions to:**
- Dashboard components
- Self Service module
- HRM module
- CRM module
- Project Management module
- Analytics components
- And more...

### assignSuperAdminRole()
```php
protected function assignSuperAdminRole(): void
{
    tenancy()->initialize($this->tenant);
    
    try {
        $user = \App\Models\User::first();
        $role = \Spatie\Permission\Models\Role::where('name', 'Super Administrator')->first();
        
        $user->syncRoles([]);
        $user->assignRole($role);
    } finally {
        tenancy()->end();
    }
}
```

**Ensures:**
- Admin user can login immediately
- Full system access granted
- No manual role assignment needed

## Testing New Provisioning

### 1. Queue Worker Setup
```bash
php artisan queue:work
```

### 2. Create Test Tenant
Through registration flow or admin panel

### 3. Monitor Logs
```bash
tail -f storage/logs/laravel.log
```

### 4. Verify Database
```bash
php artisan tenants:run "SELECT COUNT(*) FROM roles" --tenant=YOUR_TENANT_ID
php artisan tenants:run "SELECT COUNT(*) FROM permissions" --tenant=YOUR_TENANT_ID
php artisan tenants:run "SELECT COUNT(*) FROM module_permissions" --tenant=YOUR_TENANT_ID
```

### 5. Test Admin Login
- Navigate to tenant subdomain
- Login with admin credentials
- Verify Super Administrator access
- Check module management page

## Expected Results

After provisioning completes:
- ✅ 10 roles created in tenant database
- ✅ 700+ permissions created
- ✅ Module permission mappings established
- ✅ Admin user has Super Administrator role
- ✅ Admin can login and access all features
- ✅ Module management page shows subscribed modules
- ✅ Permission assignment UI functional

## Error Handling

All seeding methods include:
- Proper tenant context initialization
- Try-catch blocks for error handling
- Detailed logging for debugging
- Automatic cleanup (tenancy()->end())
- Exception propagation for rollback

If seeding fails:
1. Tenant status set to 'failed'
2. Error logged with context
3. Database optionally cleaned up
4. Admin notified via logs

## Manual Seeding (If Needed)

To manually seed an existing tenant:

```bash
# Seed roles and permissions
php artisan tenants:seed --class="Database\Seeders\Tenant\ComprehensiveRolePermissionSeeder" --tenants=YOUR_TENANT_ID

# Seed module permissions
php artisan tenants:seed --class="Database\Seeders\Tenant\ModulePermissionSeeder" --tenants=YOUR_TENANT_ID

# Assign admin role manually
php artisan tinker
$tenant = Tenant::find('YOUR_TENANT_ID');
tenancy()->initialize($tenant);
$user = User::first();
$role = Role::where('name', 'Super Administrator')->first();
$user->assignRole($role);
tenancy()->end();
```

## Architecture Notes

### Landlord vs Tenant Tables

**Landlord (Central Database):**
- `modules` - Module definitions
- `sub_modules` - Sub-module definitions
- `module_components` - Component definitions
- Managed by platform admin only

**Tenant (Individual Databases):**
- `module_permissions` - Permission mappings
- `roles` - Tenant-specific roles
- `permissions` - Tenant-specific permissions
- Managed by tenant admin

### Database Connections

Models specify connection:
```php
// Landlord models
protected $connection = 'mysql';

// Tenant models
// (no connection specified, uses tenant context)
```

### Cross-Database Foreign Keys

Module permissions reference landlord tables:
```php
$table->foreignId('module_id')->constrained('mysql.modules');
$table->foreignId('sub_module_id')->nullable()->constrained('mysql.sub_modules');
$table->foreignId('component_id')->nullable()->constrained('mysql.module_components');
```

## Related Documentation

- [Multi-Tenancy Deployment](multi-tenancy-deployment.md)
- [Multi-Tenancy Requirements](multi-tenancy-requirements.md)
- [Tenant Provisioning Transaction Safety](tenant-provisioning-transaction-safety.md)
- [Tenant Provisioning Verification](tenant-provisioning-verification.md)
- [Hierarchical Module Access Control](hierarchical-module-access-control.md)

## Maintenance

### Adding New Roles
Update `ComprehensiveRolePermissionSeeder.php` in `database/seeders/Tenant/`

### Adding New Permissions
Update `ComprehensiveRolePermissionSeeder.php` in `database/seeders/Tenant/`

### Adding Module Permission Mappings
Update `ModulePermissionSeeder.php` in `database/seeders/Tenant/`

### Updating Existing Tenants
Run seeders manually for existing tenants using `php artisan tenants:seed`
