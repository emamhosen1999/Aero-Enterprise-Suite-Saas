<?php

declare(strict_types=1);

namespace Aero\Core\Console\Commands;

use Aero\Auth\Services\SessionManagementService;
use Aero\Core\Models\UserSession;
use Illuminate\Console\Command;

/**
 * Cleanup Expired Sessions Command
 *
 * Removes expired user sessions from the database to prevent table growth
 * and maintain data hygiene. Should be run periodically (hourly recommended).
 */
class CleanupExpiredSessions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:cleanup
                          {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired user sessions from the database';

    /**
     * Execute the console command.
     */
    public function handle(SessionManagementService $sessionService): int
    {
        $this->info('Starting expired session cleanup...');

        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No sessions will be deleted');
            $count = UserSession::where('expires_at', '<', now())->count();
            $this->info("Would delete {$count} expired session(s)");

            return self::SUCCESS;
        }

        $count = $sessionService->cleanupExpiredSessions();

        if ($count > 0) {
            $this->info("Successfully cleaned up {$count} expired session(s)");
        } else {
            $this->comment('No expired sessions found');
        }

        return self::SUCCESS;
    }
}
