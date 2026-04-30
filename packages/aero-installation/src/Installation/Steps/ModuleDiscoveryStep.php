<?php

namespace Aero\Installation\Installation\Steps;

use Illuminate\Support\Facades\Artisan;

/**
 * Module Discovery Step
 *
 * Discovers all installed packages and syncs to module registry
 * Verifies that all modules are properly loaded and bootstrapped
 */
class ModuleDiscoveryStep extends BaseInstallationStep
{
    public function name(): string
    {
        return 'modules';
    }

    public function description(): string
    {
        return 'Discover and register installed modules';
    }

    public function order(): int
    {
        return 4;
    }

    public function dependencies(): array
    {
        return ['config', 'database', 'migration'];
    }

    public function execute(): array
    {
        $this->log('Starting module discovery');

        // Run module sync command
        $exitCode = Artisan::call('aero:sync-module-registry', [
            '--force' => true,
        ]);

        if ($exitCode !== 0) {
            throw new \Exception('Module sync failed with exit code: '.$exitCode);
        }

        // Verify modules
        $exitCode = Artisan::call('aero:verify-modules', [
            '--verbose' => true,
        ]);

        if ($exitCode !== 0) {
            $this->warn('Module verification completed with warnings');
        }

        $this->log('Module discovery completed');

        return [
            'sync_status' => 'success',
            'verify_status' => $exitCode === 0 ? 'success' : 'warnings',
        ];
    }

    public function validate(): bool
    {
        // Check that at least core module is registered
        try {
            $coreModule = \DB::table('module_installations')
                ->where('package_name', 'aero-core')
                ->first();

            return $coreModule !== null;

        } catch (\Exception) {
            return false;
        }
    }

    public function canSkip(): bool
    {
        return false;
    }

    public function isRetriable(): bool
    {
        return true;
    }
}
