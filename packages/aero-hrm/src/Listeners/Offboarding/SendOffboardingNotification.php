<?php

namespace Aero\HRM\Listeners\Offboarding;

use Aero\Core\Models\User;
use Aero\HRM\Events\Offboarding\OffboardingStarted;
use Aero\HRM\Notifications\Offboarding\OffboardingStartedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendOffboardingNotification implements ShouldQueue
{
    public function handle(OffboardingStarted $event): void
    {
        $offboarding = $event->offboarding;
        $employee = $offboarding->employee;
        $user = $employee?->user;

        // Notify the employee
        if ($user) {
            $user->notify(new OffboardingStartedNotification(
                offboarding: $offboarding,
                reason: $event->reason
            ));

            $this->logNotification($user, $offboarding, 'employee');
        }

        // Notify HR team
        $hrUsers = User::role(['HR Manager', 'HR Admin'])->get();
        foreach ($hrUsers as $hrUser) {
            $hrUser->notify(new OffboardingStartedNotification(
                offboarding: $offboarding,
                reason: $event->reason
            ));

            $this->logNotification($hrUser, $offboarding, 'hr');
        }
    }

    public function failed(OffboardingStarted $event, \Throwable $exception): void
    {
        Log::error('Failed to send offboarding notification', [
            'offboarding_id' => $event->offboarding->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $offboarding, string $context): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => OffboardingStartedNotification::class,
                'event_type' => 'offboarding.started',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'context' => $context,
                    'offboarding_id' => $offboarding->id,
                    'employee_id' => $offboarding->employee_id,
                    'last_working_day' => $offboarding->last_working_day->toDateString(),
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log offboarding notification', ['error' => $e->getMessage()]);
        }
    }
}
