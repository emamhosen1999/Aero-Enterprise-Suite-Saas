<?php

namespace Aero\HRM\Leave;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ResetAnnualLeaves extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leave:reset-annual 
                            {--year= : The year to reset (defaults to current year)}
                            {--dry-run : Run without making changes}
                            {--user= : Reset for specific user ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset annual leave balances, handle carry forwards, and recalculate leave entitlements';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $year = $this->option('year') ?? now()->year;
        $dryRun = $this->option('dry-run');
        $userId = $this->option('user');

        $this->info("🔄 Starting Annual Leave Reset for Year: {$year}");

        if ($dryRun) {
            $this->warn('⚠️  DRY RUN MODE - No changes will be made');
        }

        try {
            DB::beginTransaction();

            // Get all active users or specific user
            $users = $userId
                ? Employee::where('id', $userId)->get()
                : User::whereHas('roles', function ($query) {
                    $query->where('name', '!=', 'Super Admin');
                })->get();

            $this->info("👥 Processing {$users->count()} users...");

            $stats = [
                'users_processed' => 0,
                'carry_forwards' => 0,
                'carry_forward_days' => 0,
                'expired_leaves' => 0,
                'notifications_sent' => 0,
            ];

            $progressBar = $this->output->createProgressBar($users->count());
            $progressBar->start();

            foreach ($users as $user) {
                $this->processUserLeaveReset($user, $year, $dryRun, $stats);
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine(2);

            // Display summary
            $this->displaySummary($stats, $dryRun);

            if (! $dryRun) {
                DB::commit();
                $this->info('✅ Annual leave reset completed successfully!');

                // Log the reset
                Log::info('Annual leave reset completed', [
                    'year' => $year,
                    'stats' => $stats,
                    'executed_by' => 'artisan',
                    'executed_at' => now(),
                ]);
            } else {
                DB::rollBack();
                $this->warn('🔄 Dry run completed - no changes made');
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("❌ Error during leave reset: {$e->getMessage()}");
            Log::error('Annual leave reset failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Command::FAILURE;
        }
    }

    /**
     * Process leave reset for a single user
     */
    private function processUserLeaveReset(User $user, int $year, bool $dryRun, array &$stats): void
    {
        $previousYear = $year - 1;

        // Get all leave types
        $leaveTypes = LeaveSetting::all();

        foreach ($leaveTypes as $leaveType) {
            // Calculate previous year balance
            $previousYearBalance = $this->calculateYearEndBalance($user, $leaveType, $previousYear);

            // Handle carry forward if enabled
            if ($leaveType->carry_forward && $previousYearBalance > 0) {
                $carriedDays = $this->handleCarryForward(
                    $user,
                    $leaveType,
                    $previousYearBalance,
                    $year,
                    $dryRun
                );

                if ($carriedDays > 0) {
                    $stats['carry_forwards']++;
                    $stats['carry_forward_days'] += $carriedDays;
                }
            }

            // Expire old carried forward leaves
            $expiredCount = $this->expireOldCarryForwards($user, $leaveType, $year, $dryRun);
            $stats['expired_leaves'] += $expiredCount;
        }

        $stats['users_processed']++;

        // Send notification to user (if not dry run)
        if (! $dryRun) {
            $this->sendResetNotification($user, $year);
            $stats['notifications_sent']++;
        }
    }

    /**
     * Calculate year-end leave balance
     */
    private function calculateYearEndBalance(User $user, LeaveSetting $leaveType, int $year): float
    {
        // Total days allocated
        $totalDays = (float) $leaveType->days;

        // Days used (approved leaves only)
        $daysUsed = Leave::where('user_id', $user->id)
            ->where('leave_type', $leaveType->id)
            ->where('status', 'Approved')
            ->whereYear('from_date', $year)
            ->sum('no_of_days');

        return max(0, $totalDays - $daysUsed);
    }

    /**
     * Handle carry forward of unused leaves
     */
    private function handleCarryForward(User $user, LeaveSetting $leaveType, float $balance, int $year, bool $dryRun): float
    {
        // Implement max carry forward limit (e.g., 50% of total or max 10 days)
        $maxCarryForward = min($leaveType->days * 0.5, 10);
        $carriedDays = min($balance, $maxCarryForward);

        if (! $dryRun && $carriedDays > 0) {
            // Create a record or update leave balance table
            DB::table('leave_carry_forwards')->updateOrInsert(
                [
                    'user_id' => $user->id,
                    'leave_type_id' => $leaveType->id,
                    'year' => $year,
                ],
                [
                    'carried_days' => $carriedDays,
                    'expiry_date' => now()->addMonths(3), // Expires in 3 months
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        return $carriedDays;
    }

    /**
     * Expire old carry forward leaves
     */
    private function expireOldCarryForwards(User $user, LeaveSetting $leaveType, int $year, bool $dryRun): int
    {
        if ($dryRun) {
            return DB::table('leave_carry_forwards')
                ->where('user_id', $user->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('expiry_date', '<', now())
                ->count();
        }

        return DB::table('leave_carry_forwards')
            ->where('user_id', $user->id)
            ->where('leave_type_id', $leaveType->id)
            ->where('expiry_date', '<', now())
            ->delete();
    }

    /**
     * Send notification to user about leave reset
     */
    private function sendResetNotification(User $user, int $year): void
    {
        // Implement notification (email, in-app, etc.)
        // This is a placeholder - implement based on your notification system
        try {
            // Example: Send email or create notification
            // Notification::send($user, new LeaveResetNotification($year));
        } catch (\Exception $e) {
            Log::warning("Failed to send reset notification to user {$user->id}: {$e->getMessage()}");
        }
    }

    /**
     * Display summary of reset operation
     */
    private function displaySummary(array $stats, bool $dryRun): void
    {
        $this->newLine();
        $this->info('📊 Reset Summary:');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Users Processed', $stats['users_processed']],
                ['Carry Forwards Created', $stats['carry_forwards']],
                ['Total Carried Days', number_format($stats['carry_forward_days'], 1)],
                ['Expired Leaves', $stats['expired_leaves']],
                ['Notifications Sent', $dryRun ? '0 (Dry Run)' : $stats['notifications_sent']],
            ]
        );
    }
}
