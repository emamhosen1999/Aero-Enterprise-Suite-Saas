<?php

namespace Aero\Core\Database\Seeders;

use Aero\Core\Models\Module;
use Aero\Core\Models\ModuleComponent;
use Aero\Core\Models\ModuleComponentAction;
use Aero\Core\Models\SubModule;
use Illuminate\Database\Seeder;

/**
 * Module Seeder - Seeds from config/modules.php
 *
 * Reads module hierarchy from configuration and populates
 * the database with modules, submodules, components, and actions.
 */
class ModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $count = 0;

        // Seed modules from config
        $modules = config('aero-core.modules.modules', []);
        
        if (empty($modules)) {
            $this->command?->error('❌ No module hierarchy found in config/aero-core/modules.php');
            return;
        }

        foreach ($modules as $moduleData) {
            $this->seedModule($moduleData);
            $count++;
        }

        $this->command?->info("✅ Module hierarchy seeded: {$count} modules");
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
                'scope' => $moduleData['scope'] ?? 'tenant',
                'name' => $moduleData['name'],
                'description' => $moduleData['description'] ?? null,
                'icon' => $moduleData['icon'] ?? null,
                'route_prefix' => $moduleData['route_prefix'] ?? null,
                'category' => $moduleData['category'] ?? 'core',
                'priority' => $moduleData['priority'] ?? 100,
                'is_active' => $moduleData['is_active'] ?? true,
                'is_core' => $moduleData['is_core'] ?? false,
                'settings' => $moduleData['settings'] ?? [],
                'version' => $moduleData['version'] ?? null,
                'min_plan' => $moduleData['min_plan'] ?? null,
                'license_type' => $moduleData['license_type'] ?? null,
                'dependencies' => $moduleData['dependencies'] ?? [],
                'release_date' => $moduleData['release_date'] ?? null,
            ]
        );

        // Seed submodules
        if (!empty($moduleData['sub_modules'])) {
            foreach ($moduleData['sub_modules'] as $submoduleData) {
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
        if (!empty($submoduleData['components'])) {
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
                'route' => $componentData['route'] ?? $componentData['route_name'] ?? null,
                'is_active' => $componentData['is_active'] ?? true,
            ]
        );

        // Seed actions
        if (!empty($componentData['actions'])) {
            foreach ($componentData['actions'] as $actionData) {
                $this->seedAction($component, $actionData);
            }
        }
    }

    /**
     * Seed a component action.
     */
    protected function seedAction(ModuleComponent $component, array $actionData): void
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
