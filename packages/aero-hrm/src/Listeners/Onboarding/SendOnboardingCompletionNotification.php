<?php

namespace Aero\HRM\Listeners\Onboarding;

use Aero\HRM\Events\Onboarding\OnboardingCompleted;
use Aero\HRM\Notifications\Onboarding\OnboardingCompletedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendOnboardingCompletionNotification implements ShouldQueue
{
    public function handle(OnboardingCompleted $event): void
    {
        $onboarding = $event->onboarding;
        $employee = $onboarding->employee;
        $user = $employee?->user;

        if (! $user) {
            Log::warning('Employee has no user for onboarding completion notification', [
                'onboarding_id' => $onboarding->id,
            ]);

            return;
        }

        // Send completion notification
        $user->notify(new OnboardingCompletedNotification(
            onboarding: $onboarding,
            daysTaken: $event->daysTaken
        ));

        // Log notification
        $this->logNotification($user, $onboarding, $event);
    }

    public function failed(OnboardingCompleted $event, \Throwable $exception): void
    {
        Log::error('Failed to send onboarding completion notification', [
            'onboarding_id' => $event->onboarding->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $onboarding, OnboardingCompleted $event): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => OnboardingCompletedNotification::class,
                'event_type' => 'onboarding.completed',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'onboarding_id' => $onboarding->id,
                    'employee_id' => $onboarding->employee_id,
                    'completion_date' => $event->completionDate->toDateString(),
                    'days_taken' => $event->daysTaken,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log onboarding completion notification', ['error' => $e->getMessage()]);
        }
    }
}
