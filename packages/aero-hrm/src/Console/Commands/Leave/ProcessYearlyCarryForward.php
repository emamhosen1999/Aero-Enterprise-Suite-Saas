<?php

namespace Aero\HRM\Commands\Leave;

use Aero\HRM\Services\LeaveBalanceService;
use Illuminate\Console\Command;

class ProcessYearlyCarryForward extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leave:process-carry-forward 
                            {--from-year= : The year to carry forward from (defaults to last year)}
                            {--to-year= : The year to carry forward to (defaults to current year)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process year-end leave carry forward for all employees';

    /**
     * Execute the console command.
     */
    public function handle(LeaveBalanceService $leaveBalanceService): int
    {
        $fromYear = $this->option('from-year') ?? now()->subYear()->year;
        $toYear = $this->option('to-year') ?? now()->year;

        $this->info("Starting leave carry forward from {$fromYear} to {$toYear}...");

        if (! $this->confirm("Are you sure you want to process carry forward from {$fromYear} to {$toYear}?", true)) {
            $this->info('Operation cancelled.');

            return Command::SUCCESS;
        }

        try {
            $leaveBalanceService->processCarryForward($fromYear, $toYear);

            $this->info("Leave carry forward processed successfully from {$fromYear} to {$toYear}!");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error processing carry forward: '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
