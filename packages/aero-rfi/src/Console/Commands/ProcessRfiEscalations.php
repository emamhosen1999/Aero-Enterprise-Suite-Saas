<?php

declare(strict_types=1);

namespace Aero\Rfi\Console\Commands;

use Aero\Rfi\Services\RfiEscalationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Process RFI Escalations Command
 *
 * Scheduled command to process all pending RFI escalations.
 * Should be run hourly via the Laravel scheduler.
 *
 * Usage:
 * ```bash
 * php artisan rfi:process-escalations
 * ```
 *
 * In Console/Kernel.php:
 * ```php
 * $schedule->command('rfi:process-escalations')->hourly();
 * ```
 */
class ProcessRfiEscalations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rfi:process-escalations
                            {--dry-run : Run without making changes}
                            {--tenant= : Process for specific tenant only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process all pending RFI escalations based on configured rules';

    /**
     * Execute the console command.
     */
    public function handle(RfiEscalationService $escalationService): int
    {
        $dryRun = $this->option('dry-run');
        $tenantId = $this->option('tenant');

        $this->info('Processing RFI escalations...');

        if ($dryRun) {
            $this->warn('Running in dry-run mode - no changes will be made.');
        }

        try {
            $results = $escalationService->processEscalations();

            $this->info("Processed: {$results['processed']} RFIs");
            $this->info("Escalated: {$results['escalated']} RFIs");

            if ($results['errors'] > 0) {
                $this->warn("Errors: {$results['errors']}");
            }

            if (! empty($results['details'])) {
                $this->table(
                    ['RFI ID', 'RFI Number', 'New Level', 'Notified'],
                    array_map(fn ($d) => [
                        $d['rfi_id'],
                        $d['rfi_number'],
                        $d['new_level'],
                        implode(', ', $d['notified']),
                    ], $results['details'])
                );
            }

            Log::info('RFI escalation processing completed', $results);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Error processing escalations: {$e->getMessage()}");
            Log::error('RFI escalation processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return self::FAILURE;
        }
    }
}
