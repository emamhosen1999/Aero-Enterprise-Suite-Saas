<?php

namespace Aero\HRM\Commands\Leave;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\LeaveSetting;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccrueMonthlyLeaves extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leave:accrue-monthly
                            {--user= : Process specific user ID only}
                            {--month= : Process specific month (YYYY-MM), defaults to current}
                            {--dry-run : Show what would be accrued without saving}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Accrue monthly earned leave for all eligible employees';

    protected int $processedCount = 0;

    protected int $skippedCount = 0;

    protected int $errorCount = 0;

    protected array $stats = [
        'total_days_accrued' => 0,
        'users_processed' => [],
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $userId = $this->option('user');
        $month = $this->option('month') ?? now()->format('Y-m');

        try {
            $accrualDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        } catch (\Exception $e) {
            $this->error('Invalid month format. Use YYYY-MM (e.g., 2025-01)');

            return Command::FAILURE;
        }

        $this->info("Starting monthly leave accrual for {$month}...");
        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be saved');
        }

        // Get eligible leave types for accrual
        $earnedLeaveTypes = LeaveSetting::where('earned_leave', true)
            ->orWhere('type', 'LIKE', '%Earned%')
            ->orWhere('type', 'LIKE', '%Annual%')
            ->get();

        if ($earnedLeaveTypes->isEmpty()) {
            $this->warn('No earned leave types found. Skipping accrual.');

            return Command::SUCCESS;
        }

        $this->info('Found '.$earnedLeaveTypes->count().' earned leave type(s)');

        // Get users to process
        $query = Employee::query()
            ->whereNotNull('joining_date')
            ->where('status', 'active');

        if ($userId) {
            $query->where('id', $userId);
        }

        $users = $query->get();
        $this->info("Processing {$users->count()} user(s)...");

        $progressBar = $this->output->createProgressBar($users->count());
        $progressBar->start();

        foreach ($users as $user) {
            $this->processUserAccrual($user, $earnedLeaveTypes, $accrualDate, $isDryRun);
            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Display summary
        $this->displaySummary($isDryRun);

        Log::info('Monthly leave accrual completed', [
            'month' => $month,
            'dry_run' => $isDryRun,
            'processed' => $this->processedCount,
            'skipped' => $this->skippedCount,
            'errors' => $this->errorCount,
            'total_days' => $this->stats['total_days_accrued'],
        ]);

        return Command::SUCCESS;
    }

    /**
     * Process leave accrual for a single user
     */
    protected function processUserAccrual(
        Employee $user,
        $earnedLeaveTypes,
        Carbon $accrualDate,
        bool $isDryRun
    ): void {
        try {
            // Check if user was employed during accrual month
            $joiningDate = Carbon::parse($user->joining_date);
            if ($joiningDate->isAfter($accrualDate->endOfMonth())) {
                $this->skippedCount++;

                return;
            }

            foreach ($earnedLeaveTypes as $leaveType) {
                // Calculate accrual amount
                $accrualAmount = $this->calculateAccrualAmount(
                    $user,
                    $leaveType,
                    $accrualDate
                );

                if ($accrualAmount <= 0) {
                    continue;
                }

                // Check if already accrued for this month
                if ($this->hasAccrualForMonth($user->id, $leaveType->id, $accrualDate)) {
                    $this->skippedCount++;

                    continue;
                }

                if (! $isDryRun) {
                    // Save accrual record
                    DB::table('leave_accruals')->insert([
                        'user_id' => $user->id,
                        'leave_type_id' => $leaveType->id,
                        'accrual_date' => $accrualDate->format('Y-m-d'),
                        'accrued_days' => $accrualAmount,
                        'balance_after_accrual' => $this->calculateNewBalance($user, $leaveType, $accrualAmount),
                        'accrual_type' => 'monthly',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $this->processedCount++;
                $this->stats['total_days_accrued'] += $accrualAmount;
                $this->stats['users_processed'][] = [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'leave_type' => $leaveType->type,
                    'accrued_days' => $accrualAmount,
                ];
            }
        } catch (\Exception $e) {
            $this->errorCount++;
            $this->error("Error processing user {$user->id}: {$e->getMessage()}");
            Log::error("Leave accrual error for user {$user->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Calculate monthly accrual amount for a user
     */
    protected function calculateAccrualAmount(
        User $user,
        LeaveSetting $leaveType,
        Carbon $accrualDate
    ): float {
        $annualAllocation = $leaveType->days ?? 0;

        // Monthly accrual = Annual allocation / 12
        $monthlyAccrual = round($annualAllocation / 12, 2);

        // Pro-rate for joining month
        $joiningDate = Carbon::parse($user->joining_date);
        if ($joiningDate->year === $accrualDate->year && $joiningDate->month === $accrualDate->month) {
            $daysInMonth = $accrualDate->daysInMonth;
            $daysWorked = $daysInMonth - $joiningDate->day + 1;
            $monthlyAccrual = round(($monthlyAccrual / $daysInMonth) * $daysWorked, 2);
        }

        // Check minimum service period (e.g., no accrual for first 3 months)
        $serviceMonths = $joiningDate->diffInMonths($accrualDate);
        if ($serviceMonths < 3) {
            return 0;
        }

        return $monthlyAccrual;
    }

    /**
     * Calculate new balance after accrual
     */
    protected function calculateNewBalance(User $user, LeaveSetting $leaveType, float $accrualAmount): float
    {
        // Get current year's consumed leaves
        $consumed = DB::table('leaves')
            ->where('user_id', $user->id)
            ->where('leave_type_id', $leaveType->id)
            ->whereYear('from_date', now()->year)
            ->where('status', 'approved')
            ->sum('no_of_days');

        // Get total accrued so far this year
        $totalAccrued = DB::table('leave_accruals')
            ->where('user_id', $user->id)
            ->where('leave_type_id', $leaveType->id)
            ->whereYear('accrual_date', now()->year)
            ->sum('accrued_days');

        // Get carried forward from previous year
        $carriedForward = DB::table('leave_carry_forwards')
            ->where('user_id', $user->id)
            ->where('leave_type_id', $leaveType->id)
            ->where('year', now()->year)
            ->where('is_expired', false)
            ->sum('carried_days');

        return ($totalAccrued + $accrualAmount + $carriedForward) - $consumed;
    }

    /**
     * Check if accrual already exists for the month
     */
    protected function hasAccrualForMonth(int $userId, int $leaveTypeId, Carbon $accrualDate): bool
    {
        return DB::table('leave_accruals')
            ->where('user_id', $userId)
            ->where('leave_type_id', $leaveTypeId)
            ->whereYear('accrual_date', $accrualDate->year)
            ->whereMonth('accrual_date', $accrualDate->month)
            ->exists();
    }

    /**
     * Display accrual summary
     */
    protected function displaySummary(bool $isDryRun): void
    {
        $this->info('=== Leave Accrual Summary ===');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Processed', $this->processedCount],
                ['Skipped', $this->skippedCount],
                ['Errors', $this->errorCount],
                ['Total Days Accrued', number_format($this->stats['total_days_accrued'], 2)],
            ]
        );

        if ($isDryRun && count($this->stats['users_processed']) > 0) {
            $this->newLine();
            $this->info('Sample Accruals (showing first 10):');
            $this->table(
                ['User ID', 'User Name', 'Leave Type', 'Days Accrued'],
                array_slice(array_map(function ($record) {
                    return [
                        $record['user_id'],
                        $record['user_name'],
                        $record['leave_type'],
                        number_format($record['accrued_days'], 2),
                    ];
                }, $this->stats['users_processed']), 0, 10)
            );
        }

        if ($this->errorCount > 0) {
            $this->warn('Some errors occurred. Check logs for details.');
        }
    }
}
