<?php

namespace Aero\Core\Console\Commands;

use Aero\Core\Services\Module\ModuleDiscoveryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncModuleRegistryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'aero:sync-module-registry {--force=false}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Discover all modules and sync them to the module_installations registry';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $force = $this->option('force');

        $this->info('=== Module Registry Sync ===');
        $this->newLine();

        // Get discovery service
        $discoveryService = app(ModuleDiscoveryService::class);

        // Discover modules
        $this->info('Discovering modules...');
        $discovered = $discoveryService->discoverModules();

        if (empty($discovered)) {
            $this->warn('No modules discovered.');

            return 1;
        }

        $this->info("Found {$discovered->count()} modules.");
        $this->newLine();

        // Sync to registry
        $this->info('Syncing to module_installations registry...');

        $created = 0;
        $updated = 0;
        $errors = [];

        foreach ($discovered as $module) {
            $moduleCode = $module['code'] ?? null;
            if (! $moduleCode) {
                $errors[] = 'Module missing code: '.json_encode($module);

                continue;
            }

            // Normalize code
            $normalizedCode = $this->normalizeModuleCode($moduleCode);

            // Check if exists
            $existing = DB::table('module_installations')
                ->where('module_code', $normalizedCode)
                ->first();

            if ($existing && ! $force) {
                $status = $existing->status;
                $this->line("  ⊙ {$normalizedCode} already registered (status: {$status})");

                continue;
            }

            try {
                if ($existing && $force) {
                    // Update existing
                    DB::table('module_installations')
                        ->where('module_code', $normalizedCode)
                        ->update([
                            'module_name' => $module['name'] ?? ucfirst($moduleCode),
                            'version' => $module['version'] ?? '1.0.0',
                            'metadata' => json_encode([
                                'package' => $module['package'] ?? null,
                                'category' => $module['category'] ?? 'general',
                                'description' => $module['description'] ?? '',
                                'dependencies' => $module['dependencies'] ?? [],
                            ]),
                            'updated_at' => now(),
                        ]);
                    $this->line("  ↻ <fg=cyan>{$normalizedCode}</> updated");
                    $updated++;
                } else {
                    // Create new
                    DB::table('module_installations')->insert([
                        'module_code' => $normalizedCode,
                        'module_name' => $module['name'] ?? ucfirst($moduleCode),
                        'version' => $module['version'] ?? '1.0.0',
                        'status' => 'pending',
                        'metadata' => json_encode([
                            'package' => $module['package'] ?? null,
                            'category' => $module['category'] ?? 'general',
                            'description' => $module['description'] ?? '',
                            'dependencies' => $module['dependencies'] ?? [],
                        ]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $this->line("  ✓ <fg=green>{$normalizedCode}</> registered");
                    $created++;
                }
            } catch (\Exception $e) {
                $errors[] = "Failed to sync {$normalizedCode}: ".$e->getMessage();
                $this->line("  ✗ <fg=red>{$normalizedCode}</> error: ".$e->getMessage());
            }
        }

        $this->newLine();
        $this->info('=== Summary ===');
        $this->line("  Created: {$created}");
        $this->line("  Updated: {$updated}");

        if (! empty($errors)) {
            $this->line('  <fg=red>Errors:</> '.count($errors));
            foreach ($errors as $error) {
                $this->line("    • {$error}");
            }
        }

        $this->newLine();

        if (empty($errors)) {
            $this->info('<fg=green>✓ Module registry synced successfully!</>');
            $this->line('Next step: Run "php artisan aero:verify-modules" to verify all modules.');

            return 0;
        } else {
            $this->warn('Module registry sync completed with '.count($errors).' error(s).');

            return 1;
        }
    }

    /**
     * Normalize module code format
     */
    protected function normalizeModuleCode(string $code): string
    {
        if (strpos($code, 'aero:') === 0) {
            return $code;
        }

        $code = str_replace(['aero-', 'aero:'], '', $code);

        return "aero:{$code}";
    }
}
