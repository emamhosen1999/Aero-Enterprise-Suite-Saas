<?php

namespace Aero\HRM\Listeners\Onboarding;

use Aero\HRM\Events\Onboarding\OnboardingStarted;
use Aero\HRM\Notifications\Onboarding\OnboardingStartedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendOnboardingWelcomeNotification implements ShouldQueue
{
    public function handle(OnboardingStarted $event): void
    {
        $onboarding = $event->onboarding;
        $employee = $onboarding->employee;
        $user = $employee?->user;

        if (!$user) {
            Log::warning('Employee has no user for onboarding notification', [
                'onboarding_id' => $onboarding->id,
            ]);
            return;
        }

        // Send onboarding welcome notification
        $user->notify(new OnboardingStartedNotification($onboarding));

        // Log notification
        $this->logNotification($user, $onboarding);
    }

    public function failed(OnboardingStarted $event, \Throwable $exception): void
    {
        Log::error('Failed to send onboarding welcome notification', [
            'onboarding_id' => $event->onboarding->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $onboarding): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => OnboardingStartedNotification::class,
                'event_type' => 'onboarding.started',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'onboarding_id' => $onboarding->id,
                    'employee_id' => $onboarding->employee_id,
                    'start_date' => $onboarding->start_date->toDateString(),
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log onboarding notification', ['error' => $e->getMessage()]);
        }
    }
}
