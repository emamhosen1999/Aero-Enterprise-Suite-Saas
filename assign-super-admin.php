<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Initialize tenant context
$tenant = App\Models\Tenant::find('424e6131-e2cb-4c06-bfd1-fc80a290287a');
tenancy()->initialize($tenant);

// Clear permission cache
app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

// Create Super Administrator role
$role = Spatie\Permission\Models\Role::firstOrCreate([
    'name' => 'Super Administrator',
    'guard_name' => 'web'
], [
    'description' => 'Full system access with all privileges',
]);

// Assign role to user 1
$user = App\Models\User::find(1);
if ($user) {
    // Remove any existing roles first
    $user->syncRoles([]);
    
    // Assign role directly (teams feature disabled, no tenant_id column)
    $user->assignRole($role);
    
    echo "✅ User '{$user->name}' ({$user->email}) assigned Super Administrator role\n";
    echo "✅ User can now login at: https://{$tenant->subdomain}.aero-enterprise-suite-saas.com\n";
} else {
    echo "❌ User not found\n";
}
