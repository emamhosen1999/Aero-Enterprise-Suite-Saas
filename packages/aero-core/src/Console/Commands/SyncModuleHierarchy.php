<?php

namespace Aero\Core\Console\Commands;

use Aero\Core\Models\Module;
use Aero\Core\Models\ModuleComponent;
use Aero\Core\Models\ModuleComponentAction;
use Aero\Core\Models\SubModule;
use Aero\Core\Services\Module\ModuleDiscoveryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sync Module Hierarchy Command
 *
 * Syncs module definitions from packages to the custom 4-level hierarchy:
 * - modules (top level)
 * - sub_modules (second level)
 * - module_components (third level)
 * - module_component_actions (fourth level - leaf)
 *
 * This command does NOT use Spatie Permissions. It uses custom hierarchy tables
 * with role_module_access for authorization.
 *
 * Usage: php artisan aero:sync-module-hierarchy
 */
class SyncModuleHierarchy extends Command
{
    protected $signature = 'aero:sync-module-hierarchy
                          {--scope= : Sync only specific scope (platform or tenant)}
                          {--force : Force sync even if modules table does not exist}';

    protected $description = 'Sync module hierarchy from package configs to database (modules, sub_modules, components, actions)';

    protected ModuleDiscoveryService $moduleDiscovery;

    protected array $stats = [
        'modules_created' => 0,
        'modules_updated' => 0,
        'submodules_created' => 0,
        'submodules_updated' => 0,
        'components_created' => 0,
        'components_updated' => 0,
        'actions_created' => 0,
        'actions_updated' => 0,
    ];

    public function __construct(ModuleDiscoveryService $moduleDiscovery)
    {
        parent::__construct();
        $this->moduleDiscovery = $moduleDiscovery;
    }

    public function handle(): int
    {
        $this->info('🚀 Starting Module Hierarchy Sync...');
        $this->newLine();

        // CRITICAL: Schema validation to prevent crashes in Standalone mode
        if (! $this->validateSchema()) {
            return self::FAILURE;
        }

        $scope = $this->option('scope');

        try {
            DB::beginTransaction();

            $modules = $this->moduleDiscovery->getModuleDefinitions();

            if ($modules->isEmpty()) {
                $this->warn('⚠️  No module definitions found in packages.');
                DB::rollBack();

                return self::SUCCESS;
            }

            $this->info("📦 Found {$modules->count()} module(s) to sync");
            $this->newLine();

            $progressBar = $this->output->createProgressBar($modules->count());
            $progressBar->setFormat('verbose');

            foreach ($modules as $moduleDef) {
                // Filter by scope if specified
                $moduleScope = $moduleDef['scope'] ?? 'tenant';
                if ($scope && $moduleScope !== $scope) {
                    $progressBar->advance();
                    continue;
                }

                $this->syncModule($moduleDef);
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine(2);

            DB::commit();

            $this->displayStats();

            $this->info('✅ Module hierarchy sync completed successfully!');

            return self::SUCCESS;
        } catch (\Exception $e) {
            DB::rollBack();

            $this->error('❌ Sync failed: '.$e->getMessage());
            $this->error('Stack trace: '.$e->getTraceAsString());

            return self::FAILURE;
        }
    }

    /**
     * Validate database schema before syncing.
     * Prevents crashes in Standalone mode if migrations haven't run.
     */
    protected function validateSchema(): bool
    {
        if ($this->option('force')) {
            $this->warn('⚠️  Skipping schema validation (--force flag)');

            return true;
        }

        $requiredTables = ['modules', 'sub_modules', 'module_components', 'module_component_actions'];
        $missingTables = [];

        foreach ($requiredTables as $table) {
            if (! Schema::hasTable($table)) {
                $missingTables[] = $table;
            }
        }

        if (! empty($missingTables)) {
            $this->error('❌ Required tables do not exist: '.implode(', ', $missingTables));
            $this->error('Run migrations first: php artisan migrate');
            $this->newLine();
            $this->info('💡 Or use --force flag to skip validation (not recommended)');

            return false;
        }

        $this->info('✅ Schema validation passed');
        $this->newLine();

        return true;
    }

    /**
     * Sync a module and its hierarchy.
     */
    protected function syncModule(array $moduleDef): void
    {
        // Sync module (top level)
        $module = Module::updateOrCreate(
            ['code' => $moduleDef['code']],
            [
                'name' => $moduleDef['name'],
                'scope' => $moduleDef['scope'] ?? 'tenant',
                'description' => $moduleDef['description'] ?? null,
                'icon' => $moduleDef['icon'] ?? null,
                'route_prefix' => $moduleDef['route_prefix'] ?? null,
                'category' => $moduleDef['category'] ?? 'core_system',
                'priority' => $moduleDef['priority'] ?? 100,
                'is_active' => $moduleDef['is_active'] ?? true,
                'is_core' => $moduleDef['is_core'] ?? false,
                'settings' => $moduleDef['settings'] ?? null,
                'version' => $moduleDef['version'] ?? '1.0.0',
                'min_plan' => $moduleDef['min_plan'] ?? null,
                'license_type' => $moduleDef['license_type'] ?? null,
                'dependencies' => $moduleDef['dependencies'] ?? null,
                'release_date' => $moduleDef['release_date'] ?? null,
            ]
        );

        if ($module->wasRecentlyCreated) {
            $this->stats['modules_created']++;
        } else {
            $this->stats['modules_updated']++;
        }

        // Sync submodules
        if (isset($moduleDef['submodules']) && is_array($moduleDef['submodules'])) {
            $this->syncSubModules($module, $moduleDef['submodules']);
        }
    }

    /**
     * Sync submodules for a module.
     */
    protected function syncSubModules(Module $module, array $subModules): void
    {
        foreach ($subModules as $subModuleDef) {
            $subModule = SubModule::updateOrCreate(
                [
                    'module_id' => $module->id,
                    'code' => $subModuleDef['code'],
                ],
                [
                    'name' => $subModuleDef['name'],
                    'description' => $subModuleDef['description'] ?? null,
                    'icon' => $subModuleDef['icon'] ?? null,
                    'route' => $subModuleDef['route'] ?? null,
                    'priority' => $subModuleDef['priority'] ?? 100,
                    'is_active' => $subModuleDef['is_active'] ?? true,
                ]
            );

            if ($subModule->wasRecentlyCreated) {
                $this->stats['submodules_created']++;
            } else {
                $this->stats['submodules_updated']++;
            }

            // Sync components
            if (isset($subModuleDef['components']) && is_array($subModuleDef['components'])) {
                $this->syncComponents($module, $subModule, $subModuleDef['components']);
            }
        }
    }

    /**
     * Sync components for a submodule.
     */
    protected function syncComponents(Module $module, SubModule $subModule, array $components): void
    {
        foreach ($components as $componentDef) {
            $component = ModuleComponent::updateOrCreate(
                [
                    'module_id' => $module->id,
                    'sub_module_id' => $subModule->id,
                    'code' => $componentDef['code'],
                ],
                [
                    'name' => $componentDef['name'],
                    'description' => $componentDef['description'] ?? null,
                    'type' => $componentDef['type'] ?? 'page',
                    'route' => $componentDef['route'] ?? null,
                    'priority' => $componentDef['priority'] ?? 100,
                    'is_active' => $componentDef['is_active'] ?? true,
                ]
            );

            if ($component->wasRecentlyCreated) {
                $this->stats['components_created']++;
            } else {
                $this->stats['components_updated']++;
            }

            // Sync actions
            if (isset($componentDef['actions']) && is_array($componentDef['actions'])) {
                $this->syncActions($component, $componentDef['actions']);
            }
        }
    }

    /**
     * Sync actions for a component.
     */
    protected function syncActions(ModuleComponent $component, array $actions): void
    {
        foreach ($actions as $actionDef) {
            $action = ModuleComponentAction::updateOrCreate(
                [
                    'module_component_id' => $component->id,
                    'code' => $actionDef['code'],
                ],
                [
                    'name' => $actionDef['name'],
                    'description' => $actionDef['description'] ?? null,
                    'is_active' => $actionDef['is_active'] ?? true,
                ]
            );

            if ($action->wasRecentlyCreated) {
                $this->stats['actions_created']++;
            } else {
                $this->stats['actions_updated']++;
            }
        }
    }

    /**
     * Display sync statistics.
     */
    protected function displayStats(): void
    {
        $this->info('📊 Sync Statistics:');
        $this->table(
            ['Entity', 'Created', 'Updated'],
            [
                ['Modules', $this->stats['modules_created'], $this->stats['modules_updated']],
                ['Sub-Modules', $this->stats['submodules_created'], $this->stats['submodules_updated']],
                ['Components', $this->stats['components_created'], $this->stats['components_updated']],
                ['Actions', $this->stats['actions_created'], $this->stats['actions_updated']],
            ]
        );

        $totalCreated = array_sum(array_filter($this->stats, fn ($key) => str_ends_with($key, '_created'), ARRAY_FILTER_USE_KEY));
        $totalUpdated = array_sum(array_filter($this->stats, fn ($key) => str_ends_with($key, '_updated'), ARRAY_FILTER_USE_KEY));

        $this->newLine();
        $this->info("📈 Total: {$totalCreated} created, {$totalUpdated} updated");
    }
}
