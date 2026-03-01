<?php

namespace Aero\HRM\Listeners\Recruitment;

use Aero\HRM\Events\Recruitment\OfferExtended;
use Aero\HRM\Notifications\Recruitment\OfferExtendedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Sends offer letter notification to the candidate.
 */
class SendOfferLetterNotification implements ShouldQueue
{
    public function handle(OfferExtended $event): void
    {
        $offer = $event->offer;
        $application = $offer->application;

        if (! $application) {
            Log::warning('Job offer has no associated application', [
                'offer_id' => $offer->id,
            ]);

            return;
        }

        try {
            // Get candidate user if they have an account
            $candidateUser = $this->getCandidateUser($application);

            if ($candidateUser) {
                $candidateUser->notify(new OfferExtendedNotification($offer));
                $this->logNotification($candidateUser, $offer, 'recruitment.offer_extended');
            }

            // Also send email directly to candidate email if different or no user account
            $this->sendDirectEmail($offer, $application);

            // Notify HR/Recruitment team
            $this->notifyRecruitmentTeam($offer);

            Log::info('Offer letter notifications sent', [
                'offer_id' => $offer->id,
                'application_id' => $application->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send offer letter notification', [
                'offer_id' => $offer->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function getCandidateUser($application)
    {
        // Check if candidate has a user account
        if ($application->user_id) {
            return \Aero\Core\Models\User::find($application->user_id);
        }

        // Try to find by email
        $email = $application->candidate_email ?? $application->email;
        if ($email) {
            return \Aero\Core\Models\User::where('email', $email)->first();
        }

        return null;
    }

    protected function sendDirectEmail($offer, $application): void
    {
        $email = $application->candidate_email ?? $application->email;

        if (! $email) {
            return;
        }

        // Use Laravel's Mail facade for direct email
        // This ensures the candidate gets the offer even without an account
        try {
            \Illuminate\Support\Facades\Mail::send(
                'hrm::emails.offer-letter',
                [
                    'offer' => $offer,
                    'application' => $application,
                    'candidateName' => $application->candidate_name,
                ],
                function ($message) use ($email, $application) {
                    $message->to($email, $application->candidate_name)
                        ->subject('Job Offer - '.($application->job?->title ?? 'Position').' at '.config('app.name'));
                }
            );
        } catch (\Exception $e) {
            // View might not exist, fall back to notification
            Log::warning('Could not send direct offer email, view may not exist', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function notifyRecruitmentTeam($offer): void
    {
        try {
            // Get users with HRM recruitment access using HRMAC
            $recruiters = \Aero\HRMAC\Facades\HRMAC::getUsersWithSubModuleAccess('hrm', 'recruitment');

            foreach ($recruiters as $recruiter) {
                $recruiter->notify(new OfferExtendedNotification($offer, [
                    'notification_target' => 'recruitment_team',
                ]));
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify recruitment team', [
                'offer_id' => $offer->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function logNotification($user, $offer, string $eventType): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => OfferExtendedNotification::class,
                'event_type' => $eventType,
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'offer_id' => $offer->id,
                    'application_id' => $offer->application_id,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log notification', ['error' => $e->getMessage()]);
        }
    }

    public function failed(OfferExtended $event, \Throwable $exception): void
    {
        Log::error('Failed to send offer letter notification', [
            'offer_id' => $event->offer->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
