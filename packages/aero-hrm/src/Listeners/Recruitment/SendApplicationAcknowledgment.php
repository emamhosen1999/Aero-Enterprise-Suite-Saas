<?php

namespace Aero\HRM\Listeners\Recruitment;

use Aero\HRM\Events\Recruitment\ApplicationReceived;
use Aero\HRM\Notifications\Recruitment\ApplicationReceivedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendApplicationAcknowledgment implements ShouldQueue
{
    public function handle(ApplicationReceived $event): void
    {
        $application = $event->application;

        // For now, we'll log this as we don't have a direct user for the applicant
        // In the future, this could send an email directly to the applicant's email

        Log::info('Job application received', [
            'application_id' => $application->id,
            'application_number' => $application->application_number,
            'applicant_email' => $application->email,
            'job_id' => $application->job_id,
        ]);

        // Log notification attempt
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => 'JobApplicant',
                'notifiable_id' => $application->id,
                'notification_type' => ApplicationReceivedNotification::class,
                'event_type' => 'recruitment.application_received',
                'channel' => 'email',
                'status' => 'pending',
                'metadata' => json_encode([
                    'application_id' => $application->id,
                    'applicant_email' => $application->email,
                    'job_title' => $application->job?->title,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log application notification', ['error' => $e->getMessage()]);
        }
    }

    public function failed(ApplicationReceived $event, \Throwable $exception): void
    {
        Log::error('Failed to send application acknowledgment', [
            'application_id' => $event->application->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
