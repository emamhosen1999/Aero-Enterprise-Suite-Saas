<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\ModuleComponent;
use App\Models\ModuleComponentAction;
use App\Models\SubModule;
use Illuminate\Database\Seeder;

/**
 * Module Seeder - Seeds from config/modules.php (LANDLORD ONLY)
 *
 * Reads the hardcoded module hierarchy from configuration and populates
 * the LANDLORD database with modules, submodules, components, and actions.
 *
 * Note: This seeder does NOT create permissions or module_permissions.
 * Permission mapping is done per-tenant via Tenant\ModulePermissionSeeder.
 */
class ModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get module hierarchy from config
        $moduleHierarchy = config('modules.hierarchy', []);

        if (empty($moduleHierarchy)) {
            if ($this->command) {
                $this->command->error('❌ No module hierarchy found in config/modules.php');
            }

            return;
        }

        foreach ($moduleHierarchy as $moduleData) {
            $this->seedModule($moduleData);
        }

        if ($this->command) {
            $this->command->info('✅ Module hierarchy seeded successfully from config/modules.php');
        }
    }

    /**
     * Seed a single module with its complete hierarchy.
     */
    protected function seedModule(array $moduleData): void
    {
        // Create or update the module
        $module = Module::updateOrCreate(
            ['code' => $moduleData['code']],
            [
                'name' => $moduleData['name'],
                'description' => $moduleData['description'] ?? null,
                'icon' => $moduleData['icon'] ?? null,
                'route_prefix' => $moduleData['route_prefix'] ?? null,
                'category' => $moduleData['category'] ?? 'core_system',
                'priority' => $moduleData['priority'] ?? 100,
                'is_active' => $moduleData['is_active'] ?? true,
                'is_core' => $moduleData['is_core'] ?? false,
                'settings' => $moduleData['settings'] ?? [],
            ]
        );

        // Seed submodules
        if (! empty($moduleData['submodules'])) {
            foreach ($moduleData['submodules'] as $submoduleData) {
                $this->seedSubModule($module, $submoduleData);
            }
        }
    }

    /**
     * Seed a submodule with its components.
     */
    protected function seedSubModule(Module $module, array $submoduleData): void
    {
        $subModule = SubModule::updateOrCreate(
            [
                'module_id' => $module->id,
                'code' => $submoduleData['code'],
            ],
            [
                'name' => $submoduleData['name'],
                'description' => $submoduleData['description'] ?? null,
                'icon' => $submoduleData['icon'] ?? null,
                'route' => $submoduleData['route'] ?? null,
                'priority' => $submoduleData['priority'] ?? 100,
                'is_active' => $submoduleData['is_active'] ?? true,
            ]
        );

        // Seed components
        if (! empty($submoduleData['components'])) {
            foreach ($submoduleData['components'] as $componentData) {
                $this->seedComponent($module, $subModule, $componentData);
            }
        }
    }

    /**
     * Seed a component with its actions.
     */
    protected function seedComponent(Module $module, SubModule $subModule, array $componentData): void
    {
        $component = ModuleComponent::updateOrCreate(
            [
                'module_id' => $module->id,
                'sub_module_id' => $subModule->id,
                'code' => $componentData['code'],
            ],
            [
                'name' => $componentData['name'],
                'description' => $componentData['description'] ?? null,
                'type' => $componentData['type'] ?? 'page',
                'route' => $componentData['route'] ?? null,
                'is_active' => $componentData['is_active'] ?? true,
            ]
        );

        // Seed actions
        if (! empty($componentData['actions'])) {
            foreach ($componentData['actions'] as $actionData) {
                $this->seedAction($module, $subModule, $component, $actionData);
            }
        }
    }

    /**
     * Seed a component action.
     */
    protected function seedAction(Module $module, SubModule $subModule, ModuleComponent $component, array $actionData): void
    {
        ModuleComponentAction::updateOrCreate(
            [
                'module_component_id' => $component->id,
                'code' => $actionData['code'],
            ],
            [
                'name' => $actionData['name'],
                'description' => $actionData['description'] ?? null,
            ]
        );
    }
}
