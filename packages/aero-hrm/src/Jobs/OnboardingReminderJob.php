<?php

namespace Aero\Hrm\Jobs;

use Aero\Hrm\Models\Onboarding;
use Aero\Hrm\Notifications\OnboardingReminderNotification;
use Aero\Hrm\Notifications\ManagerOnboardingReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Contracts\Tenant;

class OnboardingReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The tenant instance (for SaaS mode).
     *
     * @var \Stancl\Tenancy\Contracts\Tenant|null
     */
    public ?Tenant $tenant = null;

    /**
     * Number of days before sending reminder
     */
    protected int $reminderThresholdDays = 3;

    /**
     * Create a new job instance.
     *
     * @param \Stancl\Tenancy\Contracts\Tenant|null $tenant
     */
    public function __construct(?Tenant $tenant = null)
    {
        // Store tenant for SaaS mode
        if (is_saas_mode() && $tenant) {
            $this->tenant = $tenant;
        } elseif (is_saas_mode() && tenancy()->initialized) {
            $this->tenant = tenant();
        }
    }

    /**
     * Get the middleware the job should pass through.
     *
     * @return array
     */
    public function middleware(): array
    {
        return [\Aero\Core\Jobs\Middleware\InitializeTenantForJob::class];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('OnboardingReminderJob: Starting reminder job');

        // Find incomplete onboardings older than threshold
        $incompleteOnboardings = Onboarding::with(['employee.user', 'employee.manager', 'tasks'])
            ->whereIn('status', ['pending', 'in_progress'])
            ->where('created_at', '<=', now()->subDays($this->reminderThresholdDays))
            ->get();

        $remindersSent = 0;

        foreach ($incompleteOnboardings as $onboarding) {
            try {
                // Calculate progress
                $totalTasks = $onboarding->tasks->count();
                $completedTasks = $onboarding->tasks->where('is_completed', true)->count();
                $progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;

                // Skip if already completed
                if ($progress >= 100) {
                    continue;
                }

                // Send reminder to employee
                if ($onboarding->employee && $onboarding->employee->user) {
                    $onboarding->employee->user->notify(
                        new OnboardingReminderNotification($onboarding, $progress)
                    );
                    
                    Log::info('OnboardingReminderJob: Sent reminder to employee', [
                        'employee_id' => $onboarding->employee_id,
                        'user_id' => $onboarding->employee->user->id,
                        'progress' => $progress,
                    ]);
                }

                // Send reminder to manager if assigned
                if ($onboarding->employee && $onboarding->employee->manager) {
                    $onboarding->employee->manager->user->notify(
                        new ManagerOnboardingReminderNotification($onboarding, $progress)
                    );
                    
                    Log::info('OnboardingReminderJob: Sent reminder to manager', [
                        'employee_id' => $onboarding->employee_id,
                        'manager_id' => $onboarding->employee->manager_id,
                        'progress' => $progress,
                    ]);
                }

                $remindersSent++;

                // Update last reminder sent timestamp (optional - add column if needed)
                // $onboarding->update(['last_reminder_sent_at' => now()]);

            } catch (\Exception $e) {
                Log::error('OnboardingReminderJob: Failed to send reminder', [
                    'onboarding_id' => $onboarding->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('OnboardingReminderJob: Completed reminder job', [
            'found' => $incompleteOnboardings->count(),
            'sent' => $remindersSent,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('OnboardingReminderJob: Job failed', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
