<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\DocumentExpiring;
use Aero\HRM\Notifications\DocumentExpiryNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that sends document expiry notifications.
 */
class SendDocumentExpiryNotifications implements ShouldQueue
{
    /**
     * Handle the document expiring event.
     */
    public function handle(DocumentExpiring $event): void
    {
        $document = $event->document;
        $user = $document->user;

        if (! $user) {
            Log::warning('DocumentExpiring event: No user found for document', [
                'document_id' => $document->id,
            ]);

            return;
        }

        // Notify the user (document owner)
        $user->notify(new DocumentExpiryNotification($document, $event->daysUntilExpiry));

        // Notify HR for urgent documents (expiring within 7 days)
        if ($event->daysUntilExpiry <= 7) {
            $this->notifyHr($document, $event->daysUntilExpiry);
        }

        // Notify manager for expired/expiring soon documents (0-7 days)
        if ($event->daysUntilExpiry <= 7) {
            $this->notifyManager($document, $event->daysUntilExpiry);
        }
    }

    /**
     * Notify HR users.
     */
    protected function notifyHr($document, int $daysUntilExpiry): void
    {
        if (class_exists('Spatie\Permission\Models\Role')) {
            $hrRoleNames = ['HR Admin', 'HR Manager', 'hr', 'hr_manager', 'hr-manager', 'human_resources'];
            $hrUsers = \Aero\Core\Models\User::role($hrRoleNames)->get();

            foreach ($hrUsers as $hrUser) {
                if ($hrUser->id !== $document->user_id) {
                    $hrUser->notify(new DocumentExpiryNotification($document, $daysUntilExpiry));
                }
            }
        }
    }

    /**
     * Notify manager of the document owner.
     */
    protected function notifyManager($document, int $daysUntilExpiry): void
    {
        // Find the employee record for the document owner
        $employee = \Aero\HRM\Models\Employee::where('user_id', $document->user_id)->first();
        
        if ($employee && $employee->manager_id) {
            $manager = \Aero\Core\Models\User::find($employee->manager_id);
            if ($manager) {
                $manager->notify(new DocumentExpiryNotification($document, $daysUntilExpiry));
            }
        }
    }

    /**
     * Handle a failed job.
     */
    public function failed(DocumentExpiring $event, \Throwable $exception): void
    {
        Log::error('Failed to send document expiry notifications', [
            'document_id' => $event->document->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
