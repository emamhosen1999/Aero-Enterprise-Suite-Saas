<?php

namespace Aero\RFI\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Inspection Scheduling Service
 *
 * Manages calendar-based scheduling for inspections with
 * resource allocation, conflict detection, and recurrence support.
 */
class InspectionSchedulingService
{
    /**
     * Schedule statuses.
     */
    public const STATUS_DRAFT = 'draft';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_RESCHEDULED = 'rescheduled';

    public const STATUS_NO_SHOW = 'no_show';

    /**
     * Recurrence patterns.
     */
    public const RECURRENCE_NONE = 'none';

    public const RECURRENCE_DAILY = 'daily';

    public const RECURRENCE_WEEKLY = 'weekly';

    public const RECURRENCE_BI_WEEKLY = 'bi_weekly';

    public const RECURRENCE_MONTHLY = 'monthly';

    public const RECURRENCE_QUARTERLY = 'quarterly';

    public const RECURRENCE_YEARLY = 'yearly';

    /**
     * Priority levels.
     */
    public const PRIORITY_LOW = 'low';

    public const PRIORITY_NORMAL = 'normal';

    public const PRIORITY_HIGH = 'high';

    public const PRIORITY_URGENT = 'urgent';

    /**
     * Schedule an inspection.
     */
    public function scheduleInspection(array $data): array
    {
        // Validate scheduling data
        $validation = $this->validateScheduleData($data);
        if (! $validation['valid']) {
            return [
                'success' => false,
                'errors' => $validation['errors'],
            ];
        }

        // Check for conflicts
        $conflicts = $this->detectConflicts($data);
        if (! empty($conflicts) && ! ($data['allow_conflicts'] ?? false)) {
            return [
                'success' => false,
                'error' => 'Schedule conflicts detected',
                'conflicts' => $conflicts,
            ];
        }

        $scheduleId = Str::uuid()->toString();

        $schedule = [
            'id' => $scheduleId,
            'inspection_id' => $data['inspection_id'] ?? null,
            'rfi_id' => $data['rfi_id'] ?? null,
            'template_id' => $data['template_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'location' => $data['location'] ?? null,
            'location_coordinates' => $data['coordinates'] ?? null,
            'status' => self::STATUS_SCHEDULED,
            'priority' => $data['priority'] ?? self::PRIORITY_NORMAL,
            'scheduled_date' => Carbon::parse($data['date'])->toDateString(),
            'scheduled_time' => $data['time'] ?? null,
            'duration_minutes' => $data['duration_minutes'] ?? 60,
            'end_time' => $this->calculateEndTime($data['date'], $data['time'], $data['duration_minutes'] ?? 60),
            'timezone' => $data['timezone'] ?? 'UTC',
            'inspector_id' => $data['inspector_id'],
            'inspector_name' => $data['inspector_name'] ?? null,
            'team_members' => $data['team_members'] ?? [],
            'client_id' => $data['client_id'] ?? null,
            'client_name' => $data['client_name'] ?? null,
            'client_contact' => $data['client_contact'] ?? null,
            'recurrence' => $this->processRecurrence($data['recurrence'] ?? []),
            'reminders' => $data['reminders'] ?? [
                ['type' => 'email', 'minutes_before' => 1440], // 24 hours
                ['type' => 'email', 'minutes_before' => 60],   // 1 hour
            ],
            'checklist_items' => $data['checklist_items'] ?? [],
            'equipment_required' => $data['equipment_required'] ?? [],
            'notes' => $data['notes'] ?? null,
            'attachments' => $data['attachments'] ?? [],
            'created_by' => $data['created_by'] ?? null,
            'created_at' => now()->toIso8601String(),
            'metadata' => $data['metadata'] ?? [],
        ];

        // Generate recurrence instances if applicable
        if ($schedule['recurrence']['enabled']) {
            $schedule['recurrence_instances'] = $this->generateRecurrenceInstances($schedule);
        }

        Log::info('Inspection scheduled', [
            'schedule_id' => $scheduleId,
            'inspector_id' => $data['inspector_id'],
            'date' => $schedule['scheduled_date'],
        ]);

        // Send notifications
        $this->sendScheduleNotifications($schedule, 'created');

        return [
            'success' => true,
            'schedule' => $schedule,
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Reschedule an inspection.
     */
    public function reschedule(
        string $scheduleId,
        Carbon $newDate,
        ?string $newTime = null,
        ?string $reason = null
    ): array {
        $schedule = $this->getSchedule($scheduleId);

        if (! $schedule) {
            return ['success' => false, 'error' => 'Schedule not found'];
        }

        $originalDate = $schedule['scheduled_date'];
        $originalTime = $schedule['scheduled_time'];

        // Check for conflicts at new time
        $conflicts = $this->detectConflicts([
            'inspector_id' => $schedule['inspector_id'],
            'date' => $newDate->toDateString(),
            'time' => $newTime ?? $schedule['scheduled_time'],
            'duration_minutes' => $schedule['duration_minutes'],
            'exclude_schedule_id' => $scheduleId,
        ]);

        if (! empty($conflicts)) {
            return [
                'success' => false,
                'error' => 'Conflicts at new time slot',
                'conflicts' => $conflicts,
            ];
        }

        $schedule['status'] = self::STATUS_RESCHEDULED;
        $schedule['scheduled_date'] = $newDate->toDateString();
        $schedule['scheduled_time'] = $newTime ?? $schedule['scheduled_time'];
        $schedule['end_time'] = $this->calculateEndTime(
            $newDate->toDateString(),
            $schedule['scheduled_time'],
            $schedule['duration_minutes']
        );
        $schedule['rescheduled_from'] = [
            'date' => $originalDate,
            'time' => $originalTime,
            'reason' => $reason,
            'rescheduled_at' => now()->toIso8601String(),
        ];

        Log::info('Inspection rescheduled', [
            'schedule_id' => $scheduleId,
            'from' => "{$originalDate} {$originalTime}",
            'to' => "{$schedule['scheduled_date']} {$schedule['scheduled_time']}",
        ]);

        // Notify affected parties
        $this->sendScheduleNotifications($schedule, 'rescheduled');

        return [
            'success' => true,
            'schedule' => $schedule,
        ];
    }

    /**
     * Cancel a scheduled inspection.
     */
    public function cancel(string $scheduleId, ?string $reason = null, ?int $cancelledBy = null): array
    {
        $schedule = $this->getSchedule($scheduleId);

        if (! $schedule) {
            return ['success' => false, 'error' => 'Schedule not found'];
        }

        $schedule['status'] = self::STATUS_CANCELLED;
        $schedule['cancelled_at'] = now()->toIso8601String();
        $schedule['cancelled_by'] = $cancelledBy;
        $schedule['cancellation_reason'] = $reason;

        Log::info('Inspection cancelled', [
            'schedule_id' => $scheduleId,
            'reason' => $reason,
        ]);

        // Notify affected parties
        $this->sendScheduleNotifications($schedule, 'cancelled');

        return [
            'success' => true,
            'schedule' => $schedule,
        ];
    }

    /**
     * Get inspector's calendar.
     */
    public function getInspectorCalendar(
        int $inspectorId,
        Carbon $startDate,
        Carbon $endDate,
        array $options = []
    ): array {
        $schedules = $this->getSchedulesInRange($inspectorId, $startDate, $endDate);

        // Convert to calendar events format
        $events = [];
        foreach ($schedules as $schedule) {
            $events[] = $this->formatAsCalendarEvent($schedule);
        }

        // Add availability slots if requested
        if ($options['include_availability'] ?? false) {
            $availability = $this->getAvailabilitySlots($inspectorId, $startDate, $endDate);
            foreach ($availability as $slot) {
                $events[] = [
                    'type' => 'availability',
                    'start' => $slot['start'],
                    'end' => $slot['end'],
                    'available' => $slot['available'],
                ];
            }
        }

        return [
            'inspector_id' => $inspectorId,
            'period' => [
                'start' => $startDate->toIso8601String(),
                'end' => $endDate->toIso8601String(),
            ],
            'events' => $events,
            'total_scheduled' => count($schedules),
            'total_hours' => $this->calculateTotalHours($schedules),
        ];
    }

    /**
     * Find available time slots.
     */
    public function findAvailableSlots(
        int $inspectorId,
        Carbon $date,
        int $durationMinutes = 60,
        array $options = []
    ): array {
        $workingHours = $options['working_hours'] ?? [
            'start' => '09:00',
            'end' => '17:00',
        ];

        $slotInterval = $options['slot_interval'] ?? 30; // minutes

        // Get existing schedules for the day
        $existingSchedules = $this->getSchedulesForDate($inspectorId, $date);

        // Generate all possible slots
        $slots = [];
        $currentTime = Carbon::parse($date->toDateString().' '.$workingHours['start']);
        $endOfDay = Carbon::parse($date->toDateString().' '.$workingHours['end']);

        while ($currentTime->copy()->addMinutes($durationMinutes)->lte($endOfDay)) {
            $slotEnd = $currentTime->copy()->addMinutes($durationMinutes);

            // Check if slot conflicts with existing schedules
            $isAvailable = true;
            foreach ($existingSchedules as $schedule) {
                $scheduleStart = Carbon::parse($schedule['scheduled_date'].' '.$schedule['scheduled_time']);
                $scheduleEnd = Carbon::parse($schedule['end_time']);

                if ($currentTime->lt($scheduleEnd) && $slotEnd->gt($scheduleStart)) {
                    $isAvailable = false;
                    break;
                }
            }

            if ($isAvailable) {
                $slots[] = [
                    'start' => $currentTime->format('H:i'),
                    'end' => $slotEnd->format('H:i'),
                    'duration_minutes' => $durationMinutes,
                ];
            }

            $currentTime->addMinutes($slotInterval);
        }

        return [
            'date' => $date->toDateString(),
            'inspector_id' => $inspectorId,
            'duration_minutes' => $durationMinutes,
            'available_slots' => $slots,
            'total_available' => count($slots),
        ];
    }

    /**
     * Bulk schedule inspections.
     */
    public function bulkSchedule(array $schedules): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'scheduled' => [],
            'errors' => [],
        ];

        foreach ($schedules as $index => $scheduleData) {
            $result = $this->scheduleInspection($scheduleData);

            if ($result['success']) {
                $results['success']++;
                $results['scheduled'][] = $result['schedule'];
            } else {
                $results['failed']++;
                $results['errors'][] = [
                    'index' => $index,
                    'data' => $scheduleData,
                    'error' => $result['error'] ?? $result['errors'] ?? 'Unknown error',
                ];
            }
        }

        return $results;
    }

    /**
     * Get schedule statistics.
     */
    public function getStatistics(array $filters = []): array
    {
        $startDate = isset($filters['start_date']) ? Carbon::parse($filters['start_date']) : now()->startOfMonth();
        $endDate = isset($filters['end_date']) ? Carbon::parse($filters['end_date']) : now()->endOfMonth();

        return [
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'summary' => [
                'total_scheduled' => 0,
                'completed' => 0,
                'cancelled' => 0,
                'rescheduled' => 0,
                'no_show' => 0,
                'pending' => 0,
            ],
            'by_priority' => [
                self::PRIORITY_URGENT => 0,
                self::PRIORITY_HIGH => 0,
                self::PRIORITY_NORMAL => 0,
                self::PRIORITY_LOW => 0,
            ],
            'by_inspector' => [],
            'average_duration_minutes' => 0,
            'completion_rate' => 0,
        ];
    }

    /**
     * Export calendar to iCal format.
     */
    public function exportToICal(int $inspectorId, Carbon $startDate, Carbon $endDate): string
    {
        $schedules = $this->getSchedulesInRange($inspectorId, $startDate, $endDate);

        $ical = "BEGIN:VCALENDAR\r\n";
        $ical .= "VERSION:2.0\r\n";
        $ical .= "PRODID:-//Aero RFI//Inspection Calendar//EN\r\n";
        $ical .= "CALSCALE:GREGORIAN\r\n";
        $ical .= "METHOD:PUBLISH\r\n";

        foreach ($schedules as $schedule) {
            $ical .= $this->formatAsICalEvent($schedule);
        }

        $ical .= "END:VCALENDAR\r\n";

        return $ical;
    }

    /**
     * Sync with external calendar.
     */
    public function syncWithExternalCalendar(int $inspectorId, string $provider, array $credentials): array
    {
        // Supported providers: google, outlook, apple
        $supportedProviders = ['google', 'outlook', 'apple'];

        if (! in_array($provider, $supportedProviders)) {
            return [
                'success' => false,
                'error' => 'Unsupported calendar provider',
            ];
        }

        Log::info('Calendar sync initiated', [
            'inspector_id' => $inspectorId,
            'provider' => $provider,
        ]);

        // In production, implement OAuth and API calls
        return [
            'success' => true,
            'provider' => $provider,
            'synced_at' => now()->toIso8601String(),
            'events_synced' => 0,
        ];
    }

    /**
     * Validate schedule data.
     */
    protected function validateScheduleData(array $data): array
    {
        $errors = [];

        if (empty($data['title'])) {
            $errors[] = 'Title is required';
        }

        if (empty($data['date'])) {
            $errors[] = 'Date is required';
        } elseif (Carbon::parse($data['date'])->isPast()) {
            $errors[] = 'Cannot schedule in the past';
        }

        if (empty($data['inspector_id'])) {
            $errors[] = 'Inspector is required';
        }

        if (isset($data['duration_minutes']) && $data['duration_minutes'] < 15) {
            $errors[] = 'Minimum duration is 15 minutes';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Detect scheduling conflicts.
     */
    protected function detectConflicts(array $data): array
    {
        $conflicts = [];

        // Check inspector availability
        $inspectorId = $data['inspector_id'];
        $date = Carbon::parse($data['date']);
        $time = $data['time'] ?? '09:00';
        $duration = $data['duration_minutes'] ?? 60;

        $existingSchedules = $this->getSchedulesForDate($inspectorId, $date);

        $newStart = Carbon::parse($date->toDateString().' '.$time);
        $newEnd = $newStart->copy()->addMinutes($duration);

        foreach ($existingSchedules as $schedule) {
            if (isset($data['exclude_schedule_id']) && $schedule['id'] === $data['exclude_schedule_id']) {
                continue;
            }

            $scheduleStart = Carbon::parse($schedule['scheduled_date'].' '.$schedule['scheduled_time']);
            $scheduleEnd = Carbon::parse($schedule['end_time']);

            if ($newStart->lt($scheduleEnd) && $newEnd->gt($scheduleStart)) {
                $conflicts[] = [
                    'schedule_id' => $schedule['id'],
                    'title' => $schedule['title'],
                    'time' => $schedule['scheduled_time'],
                    'duration' => $schedule['duration_minutes'],
                ];
            }
        }

        return $conflicts;
    }

    /**
     * Process recurrence settings.
     */
    protected function processRecurrence(array $recurrence): array
    {
        if (empty($recurrence) || ($recurrence['pattern'] ?? self::RECURRENCE_NONE) === self::RECURRENCE_NONE) {
            return ['enabled' => false];
        }

        return [
            'enabled' => true,
            'pattern' => $recurrence['pattern'],
            'interval' => $recurrence['interval'] ?? 1,
            'days_of_week' => $recurrence['days_of_week'] ?? [],
            'day_of_month' => $recurrence['day_of_month'] ?? null,
            'end_type' => $recurrence['end_type'] ?? 'never', // never, after, on_date
            'end_after_occurrences' => $recurrence['end_after_occurrences'] ?? null,
            'end_date' => $recurrence['end_date'] ?? null,
            'exceptions' => $recurrence['exceptions'] ?? [],
        ];
    }

    /**
     * Generate recurrence instances.
     */
    protected function generateRecurrenceInstances(array $schedule): array
    {
        $instances = [];
        $recurrence = $schedule['recurrence'];
        $startDate = Carbon::parse($schedule['scheduled_date']);

        $maxInstances = 52; // Max 1 year of weekly
        $count = 0;

        $currentDate = $startDate->copy();
        $endDate = isset($recurrence['end_date'])
            ? Carbon::parse($recurrence['end_date'])
            : $startDate->copy()->addYear();

        while ($currentDate->lte($endDate) && $count < $maxInstances) {
            if ($recurrence['end_type'] === 'after' && $count >= ($recurrence['end_after_occurrences'] ?? 10)) {
                break;
            }

            // Skip exceptions
            if (in_array($currentDate->toDateString(), $recurrence['exceptions'] ?? [])) {
                $currentDate = $this->advanceByPattern($currentDate, $recurrence['pattern'], $recurrence['interval'] ?? 1);

                continue;
            }

            $instances[] = [
                'date' => $currentDate->toDateString(),
                'time' => $schedule['scheduled_time'],
                'instance_number' => $count + 1,
            ];

            $count++;
            $currentDate = $this->advanceByPattern($currentDate, $recurrence['pattern'], $recurrence['interval'] ?? 1);
        }

        return $instances;
    }

    /**
     * Advance date by recurrence pattern.
     */
    protected function advanceByPattern(Carbon $date, string $pattern, int $interval): Carbon
    {
        return match ($pattern) {
            self::RECURRENCE_DAILY => $date->addDays($interval),
            self::RECURRENCE_WEEKLY => $date->addWeeks($interval),
            self::RECURRENCE_BI_WEEKLY => $date->addWeeks(2 * $interval),
            self::RECURRENCE_MONTHLY => $date->addMonths($interval),
            self::RECURRENCE_QUARTERLY => $date->addMonths(3 * $interval),
            self::RECURRENCE_YEARLY => $date->addYears($interval),
            default => $date->addDays($interval),
        };
    }

    /**
     * Calculate end time from start.
     */
    protected function calculateEndTime(string $date, ?string $time, int $durationMinutes): string
    {
        $start = Carbon::parse($date.' '.($time ?? '09:00'));

        return $start->addMinutes($durationMinutes)->toIso8601String();
    }

    /**
     * Format schedule as calendar event.
     */
    protected function formatAsCalendarEvent(array $schedule): array
    {
        $startDateTime = Carbon::parse($schedule['scheduled_date'].' '.($schedule['scheduled_time'] ?? '09:00'));

        return [
            'id' => $schedule['id'],
            'title' => $schedule['title'],
            'start' => $startDateTime->toIso8601String(),
            'end' => $schedule['end_time'],
            'allDay' => empty($schedule['scheduled_time']),
            'color' => $this->getPriorityColor($schedule['priority']),
            'status' => $schedule['status'],
            'location' => $schedule['location'],
            'extendedProps' => [
                'inspector_id' => $schedule['inspector_id'],
                'client_name' => $schedule['client_name'],
                'priority' => $schedule['priority'],
                'rfi_id' => $schedule['rfi_id'],
            ],
        ];
    }

    /**
     * Format as iCal event.
     */
    protected function formatAsICalEvent(array $schedule): string
    {
        $startDateTime = Carbon::parse($schedule['scheduled_date'].' '.($schedule['scheduled_time'] ?? '09:00'));
        $endDateTime = Carbon::parse($schedule['end_time']);

        $event = "BEGIN:VEVENT\r\n";
        $event .= "UID:{$schedule['id']}@aero-rfi\r\n";
        $event .= 'DTSTAMP:'.now()->format('Ymd\THis\Z')."\r\n";
        $event .= 'DTSTART:'.$startDateTime->format('Ymd\THis')."\r\n";
        $event .= 'DTEND:'.$endDateTime->format('Ymd\THis')."\r\n";
        $event .= 'SUMMARY:'.$this->escapeIcalText($schedule['title'])."\r\n";

        if (! empty($schedule['description'])) {
            $event .= 'DESCRIPTION:'.$this->escapeIcalText($schedule['description'])."\r\n";
        }

        if (! empty($schedule['location'])) {
            $event .= 'LOCATION:'.$this->escapeIcalText($schedule['location'])."\r\n";
        }

        $event .= 'STATUS:'.strtoupper($schedule['status'])."\r\n";
        $event .= "END:VEVENT\r\n";

        return $event;
    }

    /**
     * Escape text for iCal format.
     */
    protected function escapeIcalText(string $text): string
    {
        return str_replace(["\n", "\r", ';', ','], ['\\n', '', '\\;', '\\,'], $text);
    }

    /**
     * Get priority color for calendar.
     */
    protected function getPriorityColor(string $priority): string
    {
        return match ($priority) {
            self::PRIORITY_URGENT => '#dc2626', // Red
            self::PRIORITY_HIGH => '#f97316',   // Orange
            self::PRIORITY_NORMAL => '#3b82f6', // Blue
            self::PRIORITY_LOW => '#6b7280',    // Gray
            default => '#3b82f6',
        };
    }

    /**
     * Calculate total hours from schedules.
     */
    protected function calculateTotalHours(array $schedules): float
    {
        $totalMinutes = 0;
        foreach ($schedules as $schedule) {
            $totalMinutes += $schedule['duration_minutes'] ?? 60;
        }

        return round($totalMinutes / 60, 2);
    }

    /**
     * Send schedule notifications.
     */
    protected function sendScheduleNotifications(array $schedule, string $eventType): void
    {
        Log::info('Schedule notification sent', [
            'schedule_id' => $schedule['id'],
            'event_type' => $eventType,
        ]);
    }

    // Placeholder methods for database operations
    protected function getSchedule(string $scheduleId): ?array
    {
        return null;
    }

    protected function getSchedulesInRange(int $inspectorId, Carbon $startDate, Carbon $endDate): array
    {
        return [];
    }

    protected function getSchedulesForDate(int $inspectorId, Carbon $date): array
    {
        return [];
    }

    protected function getAvailabilitySlots(int $inspectorId, Carbon $startDate, Carbon $endDate): array
    {
        return [];
    }
}
