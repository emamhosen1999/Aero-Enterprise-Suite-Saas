<?php

namespace Aero\HRM\Listeners\Safety;

use Aero\Core\Models\User;
use Aero\HRM\Events\Safety\SafetyIncidentReported;
use Aero\HRM\Notifications\Safety\SafetyIncidentReportedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotifySafetyTeam implements ShouldQueue
{
    public function handle(SafetyIncidentReported $event): void
    {
        $incident = $event->incident;

        try {
            // Notify users with HRM employee access (includes safety officers)
            $hrUsers = \Aero\HRMAC\Facades\HRMAC::getUsersWithSubModuleAccess('hrm', 'employees');

            foreach ($hrUsers as $user) {
                $user->notify(new SafetyIncidentReportedNotification(
                    incident: $incident,
                    requiresImmediateAction: $event->requiresImmediateAction
                ));

                $this->logNotification($user, $incident, $event);
            }

            // If high severity, also notify users with admin access
            if ($event->requiresImmediateAction) {
                $adminUsers = \Aero\HRMAC\Facades\HRMAC::getUsersWithModuleAccess('hrm');
                
                foreach ($adminUsers as $user) {
                    // Skip if already notified
                    if ($hrUsers->contains('id', $user->id)) {
                        continue;
                    }
                    
                    $user->notify(new SafetyIncidentReportedNotification(
                        incident: $incident,
                        requiresImmediateAction: $event->requiresImmediateAction
                    ));

                    $this->logNotification($user, $incident, $event, 'management');
                }
            }
        } catch (\Exception $e) {
            Log::warning('HRMAC not available for safety notification', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function failed(SafetyIncidentReported $event, \Throwable $exception): void
    {
        Log::error('Failed to notify safety team of incident', [
            'incident_id' => $event->incident->id,
            'severity' => $event->incident->severity,
            'requires_immediate_action' => $event->requiresImmediateAction,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function logNotification($user, $incident, SafetyIncidentReported $event, string $context = 'safety_team'): void
    {
        try {
            DB::table('notification_logs')->insert([
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'notification_type' => SafetyIncidentReportedNotification::class,
                'event_type' => 'safety.incident_reported',
                'channel' => 'database',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'context' => $context,
                    'incident_id' => $incident->id,
                    'incident_type' => $incident->incident_type,
                    'severity' => $incident->severity,
                    'requires_immediate_action' => $event->requiresImmediateAction,
                    'incident_date' => $incident->incident_date->toIso8601String(),
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log safety incident notification', ['error' => $e->getMessage()]);
        }
    }
}
