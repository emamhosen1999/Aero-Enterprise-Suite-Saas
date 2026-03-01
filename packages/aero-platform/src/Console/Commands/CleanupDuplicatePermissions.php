<?php

namespace Aero\Platform\Console\Commands;

use Illuminate\Console\Command;

/**
 * @deprecated Permissions are no longer used. Module access is handled by role_module_access.
 */
class CleanupDuplicatePermissions extends Command
{
    protected $signature = 'permissions:cleanup';

    protected $description = '[DEPRECATED] Clean up duplicate permissions - no longer needed as we use role_module_access';

    public function handle()
    {
        $this->warn('This command is deprecated.');
        $this->info('Permissions are no longer used. Module access is handled by role_module_access table.');
        $this->info('Use the HRMAC package for role-based module access control.');

        return 0;
    }
}
