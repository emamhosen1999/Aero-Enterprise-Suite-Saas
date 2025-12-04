<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seeds platform module permissions from config/modules.php
 *
 * This seeder extracts all permissions defined in the platform_hierarchy
 * and creates them in the database with the 'landlord' guard.
 *
 * Run with: php artisan db:seed --class=PlatformModulePermissionSeeder
 */
class PlatformModulePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear permission cache
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = 'landlord';
        $platformModules = config('modules.platform_hierarchy', []);

        if (empty($platformModules)) {
            $this->command?->warn('⚠️  No platform_hierarchy found in config/modules.php');

            return;
        }

        $permissions = $this->extractPermissions($platformModules);
        $created = 0;
        $existing = 0;

        foreach ($permissions as $permission => $metadata) {
            $result = Permission::firstOrCreate(
                [
                    'name' => $permission,
                    'guard_name' => $guard,
                ],
                [
                    'description' => $metadata['description'] ?? null,
                ]
            );

            if ($result->wasRecentlyCreated) {
                $created++;
            } else {
                $existing++;
            }
        }

        $this->command?->info("✅ Platform permissions synced: {$created} created, {$existing} already existed.");

        // Assign all permissions to Super Administrator role
        $this->assignToSuperAdmin($guard, array_keys($permissions));
    }

    /**
     * Extract all unique permissions from the module hierarchy.
     *
     * @return array<string, array{description: string|null, module: string, level: string}>
     */
    protected function extractPermissions(array $modules): array
    {
        $permissions = [];

        foreach ($modules as $module) {
            $moduleName = $module['name'] ?? $module['code'];

            // Module level permissions
            foreach ($module['default_required_permissions'] ?? [] as $perm) {
                $permissions[$perm] = [
                    'description' => "Access {$moduleName} module",
                    'module' => $module['code'],
                    'level' => 'module',
                ];
            }

            // Submodule level
            foreach ($module['submodules'] ?? [] as $submodule) {
                $submoduleName = $submodule['name'] ?? $submodule['code'];

                foreach ($submodule['default_required_permissions'] ?? [] as $perm) {
                    $permissions[$perm] = [
                        'description' => "Access {$submoduleName} in {$moduleName}",
                        'module' => $module['code'],
                        'level' => 'submodule',
                    ];
                }

                // Component level
                foreach ($submodule['components'] ?? [] as $component) {
                    $componentName = $component['name'] ?? $component['code'];

                    foreach ($component['default_required_permissions'] ?? [] as $perm) {
                        $permissions[$perm] = [
                            'description' => "Access {$componentName} component",
                            'module' => $module['code'],
                            'level' => 'component',
                        ];
                    }

                    // Action level
                    foreach ($component['actions'] ?? [] as $action) {
                        $actionName = $action['name'] ?? $action['code'];

                        foreach ($action['default_required_permissions'] ?? [] as $perm) {
                            if (! isset($permissions[$perm])) {
                                $permissions[$perm] = [
                                    'description' => $actionName,
                                    'module' => $module['code'],
                                    'level' => 'action',
                                ];
                            }
                        }
                    }
                }
            }
        }

        ksort($permissions);

        return $permissions;
    }

    /**
     * Assign all platform permissions to the Super Administrator role.
     */
    protected function assignToSuperAdmin(string $guard, array $permissionNames): void
    {
        $role = Role::where('name', 'Super Administrator')
            ->where('guard_name', $guard)
            ->first();

        if (! $role) {
            $this->command?->warn('⚠️  Super Administrator role not found. Creating it...');

            $role = Role::create([
                'name' => 'Super Administrator',
                'guard_name' => $guard,
                'description' => 'Full access to all platform features',
            ]);
        }

        // Get all permissions
        $permissions = Permission::whereIn('name', $permissionNames)
            ->where('guard_name', $guard)
            ->get();

        // Sync permissions to role
        $role->syncPermissions($permissions);

        $this->command?->info("✅ Assigned {$permissions->count()} permissions to Super Administrator role.");
    }
}
