<?php

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\CandidateApplied;
use App\Notifications\NewApplicationNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class NotifyRecruiterOfApplication implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(CandidateApplied $event): void
    {
        $application = $event->application;
        $job = $application->job;

        // Send auto-reply to candidate
        if ($application->email) {
            // Mail::to($application->email)->send(new ApplicationReceivedEmail($application));

            activity()
                ->performedOn($application)
                ->log('Application acknowledgment email sent to candidate');
        }

        // Notify recruiters and hiring managers
        $recruiters = \Aero\Core\Models\User::role(['Recruiter', 'HR Manager'])->get();
        foreach ($recruiters as $recruiter) {
            $recruiter->notify(new NewApplicationNotification($application));
        }

        // Notify job owner if specified
        if ($job && $job->created_by) {
            $jobOwner = \Aero\Core\Models\User::find($job->created_by);
            if ($jobOwner) {
                $jobOwner->notify(new NewApplicationNotification($application));
            }
        }

        // Log the notification activity
        activity()
            ->performedOn($application)
            ->withProperties([
                'job_id' => $job?->id,
                'candidate_email' => $application->email,
            ])
            ->log('Recruiters notified of new application');
    }

    /**
     * Handle a job failure.
     */
    public function failed(CandidateApplied $event, \Throwable $exception): void
    {
        Log::error('Failed to notify recruiter of application', [
            'application_id' => $event->application->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
