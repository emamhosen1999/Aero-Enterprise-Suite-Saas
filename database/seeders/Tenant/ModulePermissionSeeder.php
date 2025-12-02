<?php

namespace Database\Seeders\Tenant;

use App\Models\Module;
use App\Models\ModuleComponent;
use App\Models\ModuleComponentAction;
use App\Models\ModulePermission;
use App\Models\SubModule;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

/**
 * Tenant Module Permission Seeder
 *
 * Seeds module_permissions table in tenant databases by reading from config/modules.php.
 * Creates permission records and links them to the module hierarchy.
 *
 * This seeder:
 * 1. Creates all permissions defined in default_required_permissions
 * 2. Links permissions to modules/submodules/components/actions
 * 3. Runs in TENANT context only
 */
class ModulePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command?->info('🔐 Starting Module Permission Seeding for Tenant...');

        // Get module hierarchy from config
        $moduleHierarchy = config('modules.hierarchy', []);

        if (empty($moduleHierarchy)) {
            $this->command?->error('❌ No module hierarchy found in config/modules.php');

            return;
        }

        foreach ($moduleHierarchy as $moduleData) {
            $this->seedModulePermissions($moduleData);
        }

        $this->command?->info('✅ Module permissions seeded successfully!');
    }

    /**
     * Seed permissions for a module and its hierarchy.
     */
    protected function seedModulePermissions(array $moduleData): void
    {
        // Find the module from landlord database
        $module = Module::where('code', $moduleData['code'])->first();

        if (! $module) {
            $this->command?->warn("⚠️  Module '{$moduleData['code']}' not found in landlord database");

            return;
        }

        // Link module-level permissions
        if (! empty($moduleData['default_required_permissions'])) {
            $this->linkPermissions(
                $module->id,
                null,
                null,
                null,
                $moduleData['default_required_permissions']
            );
        }

        // Process submodules
        if (! empty($moduleData['submodules'])) {
            foreach ($moduleData['submodules'] as $submoduleData) {
                $this->seedSubModulePermissions($module, $submoduleData);
            }
        }
    }

    /**
     * Seed permissions for a submodule and its components.
     */
    protected function seedSubModulePermissions(Module $module, array $submoduleData): void
    {
        $subModule = SubModule::where('module_id', $module->id)
            ->where('code', $submoduleData['code'])
            ->first();

        if (! $subModule) {
            $this->command?->warn("⚠️  SubModule '{$submoduleData['code']}' not found");

            return;
        }

        // Link submodule-level permissions
        if (! empty($submoduleData['default_required_permissions'])) {
            $this->linkPermissions(
                $module->id,
                $subModule->id,
                null,
                null,
                $submoduleData['default_required_permissions']
            );
        }

        // Process components
        if (! empty($submoduleData['components'])) {
            foreach ($submoduleData['components'] as $componentData) {
                $this->seedComponentPermissions($module, $subModule, $componentData);
            }
        }
    }

    /**
     * Seed permissions for a component and its actions.
     */
    protected function seedComponentPermissions(Module $module, SubModule $subModule, array $componentData): void
    {
        $component = ModuleComponent::where('module_id', $module->id)
            ->where('sub_module_id', $subModule->id)
            ->where('code', $componentData['code'])
            ->first();

        if (! $component) {
            $this->command?->warn("⚠️  Component '{$componentData['code']}' not found");

            return;
        }

        // Link component-level permissions
        if (! empty($componentData['default_required_permissions'])) {
            $this->linkPermissions(
                $module->id,
                $subModule->id,
                $component->id,
                null,
                $componentData['default_required_permissions']
            );
        }

        // Process actions
        if (! empty($componentData['actions'])) {
            foreach ($componentData['actions'] as $actionData) {
                $this->seedActionPermissions($module, $subModule, $component, $actionData);
            }
        }
    }

    /**
     * Seed permissions for a component action.
     */
    protected function seedActionPermissions(
        Module $module,
        SubModule $subModule,
        ModuleComponent $component,
        array $actionData
    ): void {
        $action = ModuleComponentAction::where('module_component_id', $component->id)
            ->where('code', $actionData['code'])
            ->first();

        if (! $action) {
            $this->command?->warn("⚠️  Action '{$actionData['code']}' not found for component '{$component->code}'");

            return;
        }

        // Link action-level permissions
        if (! empty($actionData['default_required_permissions'])) {
            $this->linkPermissions(
                $module->id,
                $subModule->id,
                $component->id,
                $action->id,
                $actionData['default_required_permissions']
            );
        }
    }

    /**
     * Link permissions to module hierarchy.
     *
     * Creates permission records in tenant database and links them via module_permissions table.
     */
    protected function linkPermissions(
        int $moduleId,
        ?int $subModuleId,
        ?int $componentId,
        ?int $actionId,
        array $permissionNames
    ): void {
        foreach ($permissionNames as $permissionName) {
            // Create or find permission in tenant database
            $permission = Permission::firstOrCreate(
                [
                    'name' => $permissionName,
                    'guard_name' => 'web',
                ],
                [
                    'description' => $this->generatePermissionDescription($permissionName),
                ]
            );

            // Link to module hierarchy
            ModulePermission::updateOrCreate(
                [
                    'module_id' => $moduleId,
                    'sub_module_id' => $subModuleId,
                    'component_id' => $componentId,
                    'module_component_action_id' => $actionId,
                    'permission_id' => $permission->id,
                ],
                [
                    'is_required' => true,
                    'is_active' => true,
                ]
            );
        }
    }

    /**
     * Generate a human-readable description for a permission.
     */
    protected function generatePermissionDescription(string $permissionName): string
    {
        // Convert 'hr.employees.view' to 'HR Employees View'
        $parts = explode('.', $permissionName);
        $readable = array_map(fn ($part) => ucfirst(str_replace(['-', '_'], ' ', $part)), $parts);

        return 'Permission for '.implode(' - ', $readable);
    }
}
