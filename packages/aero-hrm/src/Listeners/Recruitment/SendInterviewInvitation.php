<?php

namespace Aero\HRM\Listeners\Recruitment;

use Aero\HRM\Events\Recruitment\InterviewScheduled;
use Aero\HRM\Notifications\Recruitment\InterviewScheduledNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendInterviewInvitation implements ShouldQueue
{
    public function handle(InterviewScheduled $event): void
    {
        $interview = $event->interview;
        $application = $interview->application;

        // For now, log the interview notification
        // In production, this would send email to applicant
        
        Log::info('Interview scheduled', [
            'interview_id' => $interview->id,
            'application_id' => $application->id,
            'applicant_email' => $application->email,
            'scheduled_at' => $interview->scheduled_at->toIso8601String(),
        ]);

        // Log notification
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => 'JobApplicant',
                'notifiable_id' => $application->id,
                'notification_type' => InterviewScheduledNotification::class,
                'event_type' => 'recruitment.interview_scheduled',
                'channel' => 'email',
                'status' => 'pending',
                'metadata' => json_encode([
                    'interview_id' => $interview->id,
                    'application_id' => $application->id,
                    'applicant_email' => $application->email,
                    'scheduled_at' => $interview->scheduled_at->toIso8601String(),
                    'interview_type' => $interview->type,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log interview notification', ['error' => $e->getMessage()]);
        }
    }

    public function failed(InterviewScheduled $event, \Throwable $exception): void
    {
        Log::error('Failed to send interview invitation', [
            'interview_id' => $event->interview->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
