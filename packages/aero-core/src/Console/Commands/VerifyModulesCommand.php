<?php

namespace Aero\Core\Console\Commands;

use Aero\Core\Services\Module\ModuleVerificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class VerifyModulesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'aero:verify-modules {--verbose=false} {--module=*}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Verify that all installed modules are correctly configured and ready';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $verbose = $this->option('verbose');
        $specificModules = $this->option('module');

        $this->info('=== Module Verification Report ===');
        $this->newLine();

        $verifier = new ModuleVerificationService;

        // Get modules to verify
        $query = DB::table('module_installations');

        if (! empty($specificModules) && $specificModules !== ['*']) {
            $query->whereIn('module_code', $specificModules);
        } else {
            $query->where('status', '!=', 'disabled');
        }

        $modules = $query->get();

        if ($modules->isEmpty()) {
            $this->warn('No modules found to verify.');

            return 0;
        }

        $this->info("Verifying {$modules->count()} modules...");
        $this->newLine();

        $results = [];
        $totalChecks = 0;
        $passedChecks = 0;
        $failedChecks = 0;
        $warningChecks = 0;

        foreach ($modules as $module) {
            $this->line("  Checking <fg=cyan>{$module->module_code}</> (<fg=gray>{$module->module_name}</>) ...");

            $result = $verifier->verifyModule($module->module_code);
            $results[$module->module_code] = $result;

            $totalChecks += 6; // 6 check types per module

            // Display checks
            foreach ($result['checks'] as $checkName => $checkStatus) {
                $icon = match ($checkStatus) {
                    'ok', 'exists' => '✓',
                    'missing', 'not-loaded', 'not-registered', 'not-synced', 'incomplete', 'unknown' => '⚠',
                    'failed' => '✗',
                    default => '?',
                };

                $color = match ($checkStatus) {
                    'ok', 'exists' => 'green',
                    'missing', 'not-loaded', 'not-registered', 'not-synced', 'incomplete', 'unknown' => 'yellow',
                    'failed' => 'red',
                    default => 'gray',
                };

                if ($verbose) {
                    $this->line("     <fg={$color}>{$icon}</> {$checkName}: {$checkStatus}");
                }

                match ($checkStatus) {
                    'ok', 'exists' => $passedChecks++,
                    'missing', 'not-loaded', 'not-registered', 'not-synced', 'incomplete', 'unknown' => $warningChecks++,
                    'failed' => $failedChecks++,
                    default => null,
                };
            }

            // Display result
            $resultColor = match ($result['status']) {
                'ok' => 'green',
                'warning' => 'yellow',
                'failed' => 'red',
                default => 'gray',
            };

            $resultIcon = match ($result['status']) {
                'ok' => '✓',
                'warning' => '⚠',
                'failed' => '✗',
                default => '?',
            };

            $this->line("     <fg={$resultColor}>{$resultIcon} {$result['status']}</>");

            if (! empty($result['errors'])) {
                foreach ($result['errors'] as $error) {
                    $this->line("        <fg=red>ERROR:</> {$error}");
                }
            }

            if ($verbose && ! empty($result['warnings'])) {
                foreach ($result['warnings'] as $warning) {
                    $this->line("        <fg=yellow>WARNING:</> {$warning}");
                }
            }

            $this->newLine();
        }

        // Summary
        $this->info('=== Summary ===');
        $this->line("  Total checks: {$totalChecks}");
        $this->line("  <fg=green>Passed:</> {$passedChecks}");
        $this->line("  <fg=yellow>Warnings:</> {$warningChecks}");
        $this->line("  <fg=red>Failed:</> {$failedChecks}");

        $this->newLine();

        // Verify all modules
        $report = $verifier->generateReport($results);
        $this->info('Module Summary:');
        $this->line("  <fg=green>Active:</> {$report['active']}");
        $this->line("  <fg=yellow>Warnings:</> {$report['warnings']}");
        $this->line("  <fg=red>Failed:</> {$report['failed']}");

        $this->newLine();

        if ($report['failed'] === 0) {
            $this->info('<fg=green>✓ All modules verified successfully!</>');

            return 0;
        } else {
            $this->error("<fg=red>✗ {$report['failed']} module(s) failed verification.</>");

            return 1;
        }
    }
}
