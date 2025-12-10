<?php

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Models\UserDevice;
use Illuminate\Console\Command;

class ResetDevicesForSecurityUpdate extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'devices:reset-for-security-update
                            {--force : Force the operation without confirmation}';

    /**
     * The console command description.
     */
    protected $description = 'Reset all user devices for security update (fixes cross-account device fingerprinting vulnerability)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (! $this->option('force')) {
            if (! $this->confirm('This will clear ALL user devices and force users to re-login. Continue?')) {
                $this->info('Operation cancelled.');

                return Command::SUCCESS;
            }
        }

        $this->info('Starting device reset for security update...');

        // Get count before deletion
        $deviceCount = UserDevice::count();
        $userCount = UserDevice::distinct('user_id')->count('user_id');

        // Delete all devices
        UserDevice::truncate();

        $this->info("✓ Cleared {$deviceCount} devices for {$userCount} users");
        $this->info('✓ All users will be required to re-login from their devices');
        $this->info('✓ New secure device fingerprinting will be applied on next login');

        $this->newLine();
        $this->warn('IMPORTANT: Users will be logged out on their next request and must re-authenticate.');

        return Command::SUCCESS;
    }
}
