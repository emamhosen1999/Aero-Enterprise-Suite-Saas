<?php

declare(strict_types=1);

namespace Aero\Core\Services;

use DateTimeInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Centralized Notification Logging Service
 *
 * Provides a consistent way to log all notifications across the system.
 * Tracks delivery status, failures, and retries.
 */
class NotificationLoggingService
{
    /**
     * Log a notification attempt.
     *
     * @param  object  $notifiable  The entity being notified (User, Employee, etc.)
     * @param  string  $notificationClass  Full class name of the notification
     * @param  string  $eventType  Event type identifier (e.g., 'employee.created')
     * @param  string  $channel  Delivery channel (database, mail, sms, broadcast)
     * @param  string  $status  Initial status (pending, sent, failed)
     * @param  array  $metadata  Additional context data
     * @return int The log entry ID
     */
    public function log(
        object $notifiable,
        string $notificationClass,
        string $eventType,
        string $channel,
        string $status = 'pending',
        array $metadata = []
    ): int {
        try {
            return DB::table('notification_logs')->insertGetId([
                'notifiable_type' => get_class($notifiable),
                'notifiable_id' => $notifiable->id,
                'notification_type' => $notificationClass,
                'event_type' => $eventType,
                'channel' => $channel,
                'status' => $status,
                'metadata' => json_encode($metadata),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log notification', [
                'notification_class' => $notificationClass,
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return 0;
        }
    }

    /**
     * Mark a notification as successfully sent.
     */
    public function markSent(int $logId): void
    {
        if ($logId <= 0) {
            return;
        }

        try {
            DB::table('notification_logs')
                ->where('id', $logId)
                ->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'updated_at' => now(),
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to update notification log', [
                'log_id' => $logId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Mark a notification as failed.
     */
    public function markFailed(int $logId, string $reason): void
    {
        if ($logId <= 0) {
            return;
        }

        try {
            DB::table('notification_logs')
                ->where('id', $logId)
                ->update([
                    'status' => 'failed',
                    'failed_at' => now(),
                    'failure_reason' => $reason,
                    'retry_count' => DB::raw('retry_count + 1'),
                    'updated_at' => now(),
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to update notification log', [
                'log_id' => $logId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Schedule a retry for a failed notification.
     */
    public function scheduleRetry(int $logId, DateTimeInterface $retryAt): void
    {
        if ($logId <= 0) {
            return;
        }

        try {
            DB::table('notification_logs')
                ->where('id', $logId)
                ->update([
                    'status' => 'retrying',
                    'retry_at' => $retryAt,
                    'updated_at' => now(),
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to schedule notification retry', [
                'log_id' => $logId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get notification logs for a specific entity.
     *
     * @param  object  $notifiable  The entity to get logs for
     * @param  int  $limit  Maximum number of logs to return
     */
    public function getLogsFor(object $notifiable, int $limit = 50): Collection
    {
        return DB::table('notification_logs')
            ->where('notifiable_type', get_class($notifiable))
            ->where('notifiable_id', $notifiable->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get failed notifications that need retry.
     *
     * @param  int  $limit  Maximum number of notifications to return
     */
    public function getPendingRetries(int $limit = 100): Collection
    {
        $maxRetries = $this->getMaxRetryAttempts();

        return DB::table('notification_logs')
            ->whereIn('status', ['failed', 'retrying'])
            ->where('retry_count', '<', $maxRetries)
            ->where(function ($query) {
                $query->whereNull('retry_at')
                    ->orWhere('retry_at', '<=', now());
            })
            ->orderBy('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get notification statistics for a date range.
     *
     * @param  DateTimeInterface|null  $from  Start date
     * @param  DateTimeInterface|null  $to  End date
     */
    public function getStatistics(?DateTimeInterface $from = null, ?DateTimeInterface $to = null): array
    {
        $query = DB::table('notification_logs');

        if ($from) {
            $query->where('created_at', '>=', $from);
        }

        if ($to) {
            $query->where('created_at', '<=', $to);
        }

        $total = (clone $query)->count();
        $sent = (clone $query)->where('status', 'sent')->count();
        $failed = (clone $query)->where('status', 'failed')->count();
        $pending = (clone $query)->where('status', 'pending')->count();
        $retrying = (clone $query)->where('status', 'retrying')->count();

        $byChannel = (clone $query)
            ->select('channel', DB::raw('count(*) as count'))
            ->groupBy('channel')
            ->pluck('count', 'channel')
            ->toArray();

        $byEventType = (clone $query)
            ->select('event_type', DB::raw('count(*) as count'))
            ->groupBy('event_type')
            ->orderByDesc('count')
            ->limit(10)
            ->pluck('count', 'event_type')
            ->toArray();

        return [
            'total' => $total,
            'sent' => $sent,
            'failed' => $failed,
            'pending' => $pending,
            'retrying' => $retrying,
            'success_rate' => $total > 0 ? round(($sent / $total) * 100, 2) : 0,
            'by_channel' => $byChannel,
            'by_event_type' => $byEventType,
        ];
    }

    /**
     * Get the maximum retry attempts from settings.
     */
    protected function getMaxRetryAttempts(): int
    {
        try {
            $value = DB::table('notification_settings')
                ->where('key', 'retry.max_attempts')
                ->value('value');

            return $value ? (int) json_decode($value) : 3;
        } catch (\Exception $e) {
            return 3;
        }
    }

    /**
     * Check if a channel is globally enabled.
     */
    public function isChannelEnabled(string $channel): bool
    {
        try {
            $value = DB::table('notification_settings')
                ->where('key', "channels.{$channel}.enabled")
                ->value('value');

            return $value ? (bool) json_decode($value) : true;
        } catch (\Exception $e) {
            return true;
        }
    }
}
