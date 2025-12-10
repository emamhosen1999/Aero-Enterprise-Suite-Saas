<?php

namespace Aero\Core\Console\Commands;

use Aero\Core\Services\ModuleRegistry;
use Illuminate\Console\Command;

/**
 * List Modules Command
 *
 * Displays all registered modules and their status.
 */
class ModuleListCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'aero:module-list
                            {--enabled : Only show enabled modules}
                            {--category= : Filter by category}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all registered modules';

    /**
     * Execute the console command.
     */
    public function handle(ModuleRegistry $registry): int
    {
        $modules = $registry->all();

        // Filter by enabled
        if ($this->option('enabled')) {
            $modules = $registry->enabled();
        }

        // Filter by category
        if ($category = $this->option('category')) {
            $modules = $registry->byCategory($category);
        }

        if ($modules->isEmpty()) {
            $this->warn('No modules found.');
            return self::SUCCESS;
        }

        // Prepare table data
        $tableData = $modules->map(function ($provider) {
            return [
                'code' => $provider->getModuleCode(),
                'name' => $provider->getModuleName(),
                'version' => $provider->getModuleVersion(),
                'category' => $provider->getModuleCategory(),
                'priority' => $provider->getModulePriority(),
                'enabled' => $provider->isEnabled() ? '✓' : '✗',
                'dependencies' => implode(', ', $provider->getDependencies()) ?: '-',
                'min_plan' => $provider->getMinimumPlan() ?? '-',
            ];
        })->values()->toArray();

        // Display table
        $this->table(
            ['Code', 'Name', 'Version', 'Category', 'Priority', 'Enabled', 'Dependencies', 'Min Plan'],
            $tableData
        );

        // Display summary
        $this->newLine();
        $this->info('Total modules: ' . $registry->count());
        $this->info('Enabled modules: ' . $registry->countEnabled());

        return self::SUCCESS;
    }
}
