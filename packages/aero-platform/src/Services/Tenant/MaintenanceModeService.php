<?php

namespace Aero\Platform\Services\Tenant;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Maintenance Mode Service
 *
 * Manages per-tenant maintenance mode with bypass tokens,
 * scheduling, and custom maintenance pages.
 */
class MaintenanceModeService
{
    /**
     * Maintenance mode statuses.
     */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Maintenance types.
     */
    public const TYPE_PLANNED = 'planned';
    public const TYPE_EMERGENCY = 'emergency';
    public const TYPE_UPGRADE = 'upgrade';
    public const TYPE_MIGRATION = 'migration';

    /**
     * Cache key prefix.
     */
    protected string $cachePrefix = 'maintenance_mode:';

    /**
     * Enable maintenance mode for a tenant.
     */
    public function enable(
        string $tenantId,
        array $options = []
    ): array {
        $maintenanceData = [
            'tenant_id' => $tenantId,
            'status' => self::STATUS_ACTIVE,
            'type' => $options['type'] ?? self::TYPE_PLANNED,
            'message' => $options['message'] ?? 'We are currently performing scheduled maintenance.',
            'retry_after' => $options['retry_after'] ?? 60, // minutes
            'started_at' => now()->toIso8601String(),
            'estimated_end' => isset($options['duration_minutes'])
                ? now()->addMinutes($options['duration_minutes'])->toIso8601String()
                : null,
            'bypass_token' => $this->generateBypassToken(),
            'bypass_ips' => $options['bypass_ips'] ?? [],
            'bypass_users' => $options['bypass_users'] ?? [], // Admin user IDs
            'allowed_routes' => $options['allowed_routes'] ?? [
                'login',
                'logout',
                'maintenance',
                'health-check',
            ],
            'custom_template' => $options['custom_template'] ?? null,
            'notify_users' => $options['notify_users'] ?? true,
            'initiated_by' => $options['initiated_by'] ?? null,
            'reason' => $options['reason'] ?? null,
            'metadata' => $options['metadata'] ?? [],
        ];

        // Store in cache
        $this->storeMaintenanceData($tenantId, $maintenanceData);

        // Log the event
        Log::info('Maintenance mode enabled', [
            'tenant_id' => $tenantId,
            'type' => $maintenanceData['type'],
            'initiated_by' => $maintenanceData['initiated_by'],
        ]);

        // Send notifications if enabled
        if ($maintenanceData['notify_users']) {
            $this->notifyUsers($tenantId, 'maintenance_started', $maintenanceData);
        }

        return [
            'success' => true,
            'maintenance' => $maintenanceData,
            'bypass_url' => $this->generateBypassUrl($tenantId, $maintenanceData['bypass_token']),
        ];
    }

    /**
     * Disable maintenance mode for a tenant.
     */
    public function disable(string $tenantId, ?string $disabledBy = null): array
    {
        $maintenanceData = $this->getMaintenanceData($tenantId);

        if (!$maintenanceData || $maintenanceData['status'] !== self::STATUS_ACTIVE) {
            return [
                'success' => false,
                'error' => 'Maintenance mode is not active',
            ];
        }

        $maintenanceData['status'] = self::STATUS_COMPLETED;
        $maintenanceData['ended_at'] = now()->toIso8601String();
        $maintenanceData['disabled_by'] = $disabledBy;
        $maintenanceData['duration_minutes'] = Carbon::parse($maintenanceData['started_at'])
            ->diffInMinutes(now());

        // Clear from cache
        $this->clearMaintenanceData($tenantId);

        // Archive the maintenance record
        $this->archiveMaintenance($tenantId, $maintenanceData);

        Log::info('Maintenance mode disabled', [
            'tenant_id' => $tenantId,
            'duration_minutes' => $maintenanceData['duration_minutes'],
        ]);

        // Notify users
        if ($maintenanceData['notify_users'] ?? false) {
            $this->notifyUsers($tenantId, 'maintenance_ended', $maintenanceData);
        }

        return [
            'success' => true,
            'maintenance' => $maintenanceData,
        ];
    }

    /**
     * Schedule maintenance for a future time.
     */
    public function schedule(
        string $tenantId,
        Carbon $startTime,
        int $durationMinutes,
        array $options = []
    ): array {
        if ($startTime->isPast()) {
            return [
                'success' => false,
                'error' => 'Start time cannot be in the past',
            ];
        }

        $scheduleId = Str::uuid()->toString();

        $scheduledMaintenance = [
            'id' => $scheduleId,
            'tenant_id' => $tenantId,
            'status' => self::STATUS_SCHEDULED,
            'type' => $options['type'] ?? self::TYPE_PLANNED,
            'message' => $options['message'] ?? 'Scheduled maintenance window.',
            'scheduled_start' => $startTime->toIso8601String(),
            'scheduled_end' => $startTime->copy()->addMinutes($durationMinutes)->toIso8601String(),
            'duration_minutes' => $durationMinutes,
            'bypass_ips' => $options['bypass_ips'] ?? [],
            'bypass_users' => $options['bypass_users'] ?? [],
            'notify_before_minutes' => $options['notify_before_minutes'] ?? [60, 30, 15, 5],
            'notify_users' => $options['notify_users'] ?? true,
            'auto_enable' => $options['auto_enable'] ?? true,
            'auto_disable' => $options['auto_disable'] ?? true,
            'created_by' => $options['created_by'] ?? null,
            'reason' => $options['reason'] ?? null,
            'created_at' => now()->toIso8601String(),
        ];

        // Store scheduled maintenance
        $this->storeScheduledMaintenance($tenantId, $scheduleId, $scheduledMaintenance);

        Log::info('Maintenance scheduled', [
            'tenant_id' => $tenantId,
            'schedule_id' => $scheduleId,
            'scheduled_start' => $startTime->toIso8601String(),
        ]);

        // Send advance notification
        if ($scheduledMaintenance['notify_users']) {
            $this->notifyUsers($tenantId, 'maintenance_scheduled', $scheduledMaintenance);
        }

        return [
            'success' => true,
            'schedule' => $scheduledMaintenance,
        ];
    }

    /**
     * Cancel scheduled maintenance.
     */
    public function cancelScheduled(string $tenantId, string $scheduleId, ?string $cancelledBy = null): array
    {
        $scheduled = $this->getScheduledMaintenance($tenantId, $scheduleId);

        if (!$scheduled) {
            return [
                'success' => false,
                'error' => 'Scheduled maintenance not found',
            ];
        }

        if ($scheduled['status'] !== self::STATUS_SCHEDULED) {
            return [
                'success' => false,
                'error' => 'Maintenance is not in scheduled status',
            ];
        }

        $scheduled['status'] = self::STATUS_CANCELLED;
        $scheduled['cancelled_at'] = now()->toIso8601String();
        $scheduled['cancelled_by'] = $cancelledBy;

        // Remove from scheduled list
        $this->removeScheduledMaintenance($tenantId, $scheduleId);

        // Archive
        $this->archiveMaintenance($tenantId, $scheduled);

        Log::info('Scheduled maintenance cancelled', [
            'tenant_id' => $tenantId,
            'schedule_id' => $scheduleId,
        ]);

        // Notify users
        if ($scheduled['notify_users'] ?? false) {
            $this->notifyUsers($tenantId, 'maintenance_cancelled', $scheduled);
        }

        return [
            'success' => true,
            'schedule' => $scheduled,
        ];
    }

    /**
     * Check if tenant is in maintenance mode.
     */
    public function isInMaintenance(string $tenantId): bool
    {
        $data = $this->getMaintenanceData($tenantId);
        return $data && $data['status'] === self::STATUS_ACTIVE;
    }

    /**
     * Check if request can bypass maintenance.
     */
    public function canBypass(string $tenantId, array $request): bool
    {
        $data = $this->getMaintenanceData($tenantId);

        if (!$data || $data['status'] !== self::STATUS_ACTIVE) {
            return true; // Not in maintenance
        }

        // Check bypass token
        if (isset($request['bypass_token']) && $request['bypass_token'] === $data['bypass_token']) {
            return true;
        }

        // Check bypass IPs
        if (isset($request['ip']) && in_array($request['ip'], $data['bypass_ips'])) {
            return true;
        }

        // Check bypass users
        if (isset($request['user_id']) && in_array($request['user_id'], $data['bypass_users'])) {
            return true;
        }

        // Check allowed routes
        if (isset($request['route']) && in_array($request['route'], $data['allowed_routes'])) {
            return true;
        }

        return false;
    }

    /**
     * Get maintenance status for a tenant.
     */
    public function getStatus(string $tenantId): array
    {
        $active = $this->getMaintenanceData($tenantId);
        $scheduled = $this->getUpcomingScheduled($tenantId);

        return [
            'is_active' => $active && $active['status'] === self::STATUS_ACTIVE,
            'active_maintenance' => $active,
            'scheduled_maintenance' => $scheduled,
            'has_upcoming' => !empty($scheduled),
        ];
    }

    /**
     * Get maintenance page data.
     */
    public function getMaintenancePage(string $tenantId): array
    {
        $data = $this->getMaintenanceData($tenantId);

        if (!$data) {
            return [
                'in_maintenance' => false,
            ];
        }

        return [
            'in_maintenance' => true,
            'message' => $data['message'],
            'type' => $data['type'],
            'started_at' => $data['started_at'],
            'estimated_end' => $data['estimated_end'],
            'retry_after' => $data['retry_after'],
            'custom_template' => $data['custom_template'],
        ];
    }

    /**
     * Extend maintenance duration.
     */
    public function extend(string $tenantId, int $additionalMinutes): array
    {
        $data = $this->getMaintenanceData($tenantId);

        if (!$data || $data['status'] !== self::STATUS_ACTIVE) {
            return [
                'success' => false,
                'error' => 'Maintenance mode is not active',
            ];
        }

        $currentEnd = $data['estimated_end'] ? Carbon::parse($data['estimated_end']) : now();
        $newEnd = $currentEnd->addMinutes($additionalMinutes);

        $data['estimated_end'] = $newEnd->toIso8601String();
        $data['extended_at'] = now()->toIso8601String();
        $data['extended_by_minutes'] = ($data['extended_by_minutes'] ?? 0) + $additionalMinutes;

        $this->storeMaintenanceData($tenantId, $data);

        Log::info('Maintenance extended', [
            'tenant_id' => $tenantId,
            'additional_minutes' => $additionalMinutes,
            'new_estimated_end' => $newEnd->toIso8601String(),
        ]);

        return [
            'success' => true,
            'maintenance' => $data,
            'new_estimated_end' => $newEnd->toIso8601String(),
        ];
    }

    /**
     * Update maintenance message.
     */
    public function updateMessage(string $tenantId, string $message): array
    {
        $data = $this->getMaintenanceData($tenantId);

        if (!$data || $data['status'] !== self::STATUS_ACTIVE) {
            return [
                'success' => false,
                'error' => 'Maintenance mode is not active',
            ];
        }

        $data['message'] = $message;
        $data['message_updated_at'] = now()->toIso8601String();

        $this->storeMaintenanceData($tenantId, $data);

        return [
            'success' => true,
            'message' => $message,
        ];
    }

    /**
     * Get maintenance history for a tenant.
     */
    public function getHistory(string $tenantId, int $limit = 10): array
    {
        // In production, fetch from database
        $cacheKey = $this->cachePrefix . 'history:' . $tenantId;
        $history = Cache::get($cacheKey, []);

        return array_slice($history, 0, $limit);
    }

    /**
     * Process scheduled maintenance (run by scheduler).
     */
    public function processScheduledMaintenance(): array
    {
        $results = [
            'started' => 0,
            'ended' => 0,
            'notified' => 0,
            'errors' => 0,
        ];

        // Get all scheduled maintenance across tenants
        $allScheduled = $this->getAllScheduledMaintenance();

        foreach ($allScheduled as $scheduled) {
            try {
                $startTime = Carbon::parse($scheduled['scheduled_start']);
                $endTime = Carbon::parse($scheduled['scheduled_end']);

                // Auto-enable if start time reached
                if ($scheduled['auto_enable'] && $startTime->isPast() && !$endTime->isPast()) {
                    if ($scheduled['status'] === self::STATUS_SCHEDULED) {
                        $this->enable($scheduled['tenant_id'], [
                            'type' => $scheduled['type'],
                            'message' => $scheduled['message'],
                            'duration_minutes' => $scheduled['duration_minutes'],
                            'bypass_ips' => $scheduled['bypass_ips'],
                            'bypass_users' => $scheduled['bypass_users'],
                            'notify_users' => false, // Already notified
                        ]);
                        $results['started']++;
                    }
                }

                // Auto-disable if end time reached
                if ($scheduled['auto_disable'] && $endTime->isPast()) {
                    $this->disable($scheduled['tenant_id']);
                    $this->removeScheduledMaintenance($scheduled['tenant_id'], $scheduled['id']);
                    $results['ended']++;
                }

                // Send pre-maintenance notifications
                if ($scheduled['notify_users'] && $startTime->isFuture()) {
                    $minutesUntilStart = now()->diffInMinutes($startTime);
                    foreach ($scheduled['notify_before_minutes'] ?? [] as $notifyMinutes) {
                        if ($minutesUntilStart <= $notifyMinutes && $minutesUntilStart > $notifyMinutes - 1) {
                            $this->notifyUsers($scheduled['tenant_id'], 'maintenance_reminder', $scheduled);
                            $results['notified']++;
                        }
                    }
                }
            } catch (\Exception $e) {
                $results['errors']++;
                Log::error('Error processing scheduled maintenance', [
                    'tenant_id' => $scheduled['tenant_id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Generate a bypass token.
     */
    protected function generateBypassToken(): string
    {
        return Str::random(64);
    }

    /**
     * Generate bypass URL.
     */
    protected function generateBypassUrl(string $tenantId, string $token): string
    {
        return "/{$tenantId}?bypass_token={$token}";
    }

    /**
     * Store maintenance data in cache.
     */
    protected function storeMaintenanceData(string $tenantId, array $data): void
    {
        $cacheKey = $this->cachePrefix . $tenantId;
        Cache::put($cacheKey, $data, now()->addDays(7));
    }

    /**
     * Get maintenance data from cache.
     */
    protected function getMaintenanceData(string $tenantId): ?array
    {
        $cacheKey = $this->cachePrefix . $tenantId;
        return Cache::get($cacheKey);
    }

    /**
     * Clear maintenance data from cache.
     */
    protected function clearMaintenanceData(string $tenantId): void
    {
        $cacheKey = $this->cachePrefix . $tenantId;
        Cache::forget($cacheKey);
    }

    /**
     * Store scheduled maintenance.
     */
    protected function storeScheduledMaintenance(string $tenantId, string $scheduleId, array $data): void
    {
        $cacheKey = $this->cachePrefix . 'scheduled:' . $tenantId . ':' . $scheduleId;
        Cache::put($cacheKey, $data, Carbon::parse($data['scheduled_end'])->addDay());
    }

    /**
     * Get scheduled maintenance.
     */
    protected function getScheduledMaintenance(string $tenantId, string $scheduleId): ?array
    {
        $cacheKey = $this->cachePrefix . 'scheduled:' . $tenantId . ':' . $scheduleId;
        return Cache::get($cacheKey);
    }

    /**
     * Remove scheduled maintenance.
     */
    protected function removeScheduledMaintenance(string $tenantId, string $scheduleId): void
    {
        $cacheKey = $this->cachePrefix . 'scheduled:' . $tenantId . ':' . $scheduleId;
        Cache::forget($cacheKey);
    }

    /**
     * Get upcoming scheduled maintenance.
     */
    protected function getUpcomingScheduled(string $tenantId): array
    {
        // In production, query from database
        return [];
    }

    /**
     * Get all scheduled maintenance across tenants.
     */
    protected function getAllScheduledMaintenance(): array
    {
        // In production, query from database
        return [];
    }

    /**
     * Archive maintenance record.
     */
    protected function archiveMaintenance(string $tenantId, array $data): void
    {
        $cacheKey = $this->cachePrefix . 'history:' . $tenantId;
        $history = Cache::get($cacheKey, []);
        array_unshift($history, $data);
        $history = array_slice($history, 0, 50); // Keep last 50
        Cache::put($cacheKey, $history, now()->addYear());
    }

    /**
     * Notify users about maintenance.
     */
    protected function notifyUsers(string $tenantId, string $eventType, array $data): void
    {
        // In production, dispatch notification jobs
        Log::info('Maintenance notification', [
            'tenant_id' => $tenantId,
            'event_type' => $eventType,
        ]);
    }
}
