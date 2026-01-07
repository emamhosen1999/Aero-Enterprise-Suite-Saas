<?php

namespace Aero\Platform\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

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

            // Show final counts
            $this->newLine();
            $this->info('=== FINAL COUNTS ===');
            $totalRoles = Role::count();
            $totalPermissions = Permission::count();
            $this->info("Total Roles: {$totalRoles}");
            $this->info("Total Permissions: {$totalPermissions}");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Failed to cleanup permissions: '.$e->getMessage());

            return 1;
        }

        return 0;
    }
}
