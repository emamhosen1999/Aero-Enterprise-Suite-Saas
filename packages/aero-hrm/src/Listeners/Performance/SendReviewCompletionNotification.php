<?php

namespace Aero\HRM\Listeners\Performance;

use Aero\HRM\Events\Performance\PerformanceReviewCompleted;
use Aero\HRM\Notifications\Performance\PerformanceReviewCompletedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendReviewCompletionNotification implements ShouldQueue
{
    public function handle(PerformanceReviewCompleted $event): void
    {
        $review = $event->review;
        $employee = $review->employee;
        $user = $employee?->user;

        if (!$user) {
            Log::warning('Employee has no user for review completion notification', [
                'review_id' => $review->id,
            ]);
            return;
        }

        // Send notification to employee
        $user->notify(new PerformanceReviewCompletedNotification($review));

        // Log notification
        $this->logNotification($user, $review);
    }

    public function failed(PerformanceReviewCompleted $event, \Throwable $exception): void
    {
        Log::error('Failed to send review completion notification', [
            'review_id' => $event->review->id,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $review): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => PerformanceReviewCompletedNotification::class,
                'event_type' => 'performance.review_completed',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'review_id' => $review->id,
                    'employee_id' => $review->employee_id,
                    'overall_rating' => $review->overall_rating,
                    'review_period' => [
                        'start' => $review->review_period_start->toDateString(),
                        'end' => $review->review_period_end->toDateString(),
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log review notification', ['error' => $e->getMessage()]);
        }
    }
}
