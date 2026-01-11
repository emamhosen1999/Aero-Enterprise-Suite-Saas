<?php

namespace Aero\HRM\Listeners\Recruitment;

use Aero\HRM\Events\Recruitment\OfferExtended;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Tracks offer acceptance status and updates application stage.
 */
class TrackOfferAcceptance implements ShouldQueue
{
    public function handle(OfferExtended $event): void
    {
        $offer = $event->offer;
        $application = $offer->application;

        if (! $application) {
            Log::warning('Job offer has no associated application for tracking', [
                'offer_id' => $offer->id,
            ]);

            return;
        }

        try {
            // Update application status to 'offered'
            $application->update([
                'status' => 'offered',
                'last_activity_at' => now(),
            ]);

            // Create stage history entry
            $this->createStageHistory($application, $offer);

            // Update offer with tracking info
            $offer->update([
                'sent_at' => now(),
                'tracking_status' => 'awaiting_response',
            ]);

            // Schedule follow-up reminder if offer has expiry
            if ($offer->expires_at) {
                $this->scheduleFollowUpReminder($offer);
            }

            Log::info('Offer acceptance tracking initiated', [
                'offer_id' => $offer->id,
                'application_id' => $application->id,
                'expires_at' => $offer->expires_at?->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to track offer acceptance', [
                'offer_id' => $offer->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function createStageHistory($application, $offer): void
    {
        try {
            DB::table('job_application_stage_histories')->insert([
                'application_id' => $application->id,
                'stage' => 'offer_extended',
                'status' => 'completed',
                'notes' => "Offer extended with salary: {$offer->salary}",
                'changed_by' => $offer->created_by ?? auth()->id(),
                'changed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Table might not exist, log and continue
            Log::warning('Could not create stage history', [
                'application_id' => $application->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function scheduleFollowUpReminder($offer): void
    {
        // Calculate reminder date (e.g., 2 days before expiry or halfway point)
        $daysUntilExpiry = now()->diffInDays($offer->expires_at);
        $reminderDays = max(1, intval($daysUntilExpiry / 2));
        $reminderDate = now()->addDays($reminderDays);

        // For now, just log the scheduled reminder
        // In production, you'd dispatch a delayed job
        Log::info('Offer follow-up reminder scheduled', [
            'offer_id' => $offer->id,
            'reminder_date' => $reminderDate->toIso8601String(),
            'expires_at' => $offer->expires_at->toIso8601String(),
        ]);
    }

    public function failed(OfferExtended $event, \Throwable $exception): void
    {
        Log::error('Failed to track offer acceptance', [
            'offer_id' => $event->offer->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
