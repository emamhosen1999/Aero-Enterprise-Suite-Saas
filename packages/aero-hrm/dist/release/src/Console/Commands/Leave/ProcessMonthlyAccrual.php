<?php

namespace Aero\HRM\Commands\Leave;

use Aero\HRM\Services\LeaveBalanceService;
use Illuminate\Console\Command;

class ProcessMonthlyAccrual extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leave:process-monthly-accrual';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process monthly leave accrual for all employees with monthly accrual leave types';

    /**
     * Execute the console command.
     */
    public function handle(LeaveBalanceService $leaveBalanceService): int
    {
        $this->info('Starting monthly leave accrual process...');

        try {
            $leaveBalanceService->processMonthlyAccrual();

            $this->info('Monthly leave accrual processed successfully!');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error processing monthly accrual: '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
