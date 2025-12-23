<?php

declare(strict_types=1);

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Recent Activity Widget for Core Dashboard
 *
 * Displays a timeline of recent system activities:
 * - User logins/logouts
 * - Settings changes
 * - Role updates
 * - User management actions
 *
 * This is a FEED widget - activity stream.
 */
class RecentActivityWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';
    protected int $order = 3;
    protected int|string $span = 2;
    protected CoreWidgetCategory $category = CoreWidgetCategory::FEED;
    protected array $requiredPermissions = [];

    public function getKey(): string
    {
        return 'core.recent_activity';
    }

    public function getComponent(): string
    {
        return 'Widgets/Core/RecentActivityWidget';
    }

    public function getTitle(): string
    {
        return 'Recent Activity';
    }

    public function getDescription(): string
    {
        return 'Latest system activities and events';
    }

    public function getModuleCode(): string
    {
        return 'core';
    }

    /**
     * Activity widget is always enabled.
     */
    public function isEnabled(): bool
    {
        return true;
    }

    /**
     * Get widget data for frontend.
     */
    public function getData(): array
    {
        $activities = [];

        // Get authentication events
        try {
            if (Schema::hasTable('authentication_events')) {
                $authEvents = DB::table('authentication_events')
                    ->join('users', 'authentication_events.user_id', '=', 'users.id')
                    ->select([
                        'authentication_events.id',
                        'authentication_events.event_type',
                        'authentication_events.created_at',
                        'authentication_events.ip_address',
                        'users.name as user_name',
                    ])
                    ->orderByDesc('authentication_events.created_at')
                    ->limit(10)
                    ->get();

                foreach ($authEvents as $event) {
                    $activities[] = [
                        'id' => 'auth_' . $event->id,
                        'type' => $this->mapEventType($event->event_type),
                        'icon' => $this->getEventIcon($event->event_type),
                        'color' => $this->getEventColor($event->event_type),
                        'message' => $this->formatEventMessage($event),
                        'user' => $event->user_name,
                        'timestamp' => $event->created_at,
                        'timeAgo' => \Carbon\Carbon::parse($event->created_at)->diffForHumans(),
                    ];
                }
            }
        } catch (\Throwable $e) {
            // Silently ignore
        }

        // Get audit log events if available
        try {
            if (Schema::hasTable('audit_logs')) {
                $auditEvents = DB::table('audit_logs')
                    ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
                    ->select([
                        'audit_logs.id',
                        'audit_logs.action',
                        'audit_logs.auditable_type',
                        'audit_logs.created_at',
                        'users.name as user_name',
                    ])
                    ->orderByDesc('audit_logs.created_at')
                    ->limit(10)
                    ->get();

                foreach ($auditEvents as $event) {
                    $activities[] = [
                        'id' => 'audit_' . $event->id,
                        'type' => $event->action,
                        'icon' => $this->getAuditIcon($event->action),
                        'color' => $this->getAuditColor($event->action),
                        'message' => $this->formatAuditMessage($event),
                        'user' => $event->user_name ?? 'System',
                        'timestamp' => $event->created_at,
                        'timeAgo' => \Carbon\Carbon::parse($event->created_at)->diffForHumans(),
                    ];
                }
            }
        } catch (\Throwable $e) {
            // Silently ignore
        }

        // Sort by timestamp and take most recent 8
        usort($activities, function ($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        $activities = array_slice($activities, 0, 8);

        // If no activities, show placeholder
        if (empty($activities)) {
            $activities = [
                [
                    'id' => 'placeholder_1',
                    'type' => 'info',
                    'icon' => 'InformationCircleIcon',
                    'color' => 'default',
                    'message' => 'No recent activity to display',
                    'user' => 'System',
                    'timestamp' => now()->toDateTimeString(),
                    'timeAgo' => 'just now',
                ],
            ];
        }

        return [
            'activities' => $activities,
            'totalToday' => count($activities),
            'viewAllRoute' => 'audit.logs',
        ];
    }

    /**
     * Map event type to readable label.
     */
    protected function mapEventType(string $eventType): string
    {
        return match ($eventType) {
            'login' => 'login',
            'logout' => 'logout',
            'login_failed' => 'failed_login',
            'password_reset' => 'password_reset',
            default => 'activity',
        };
    }

    /**
     * Get icon for auth event type.
     */
    protected function getEventIcon(string $eventType): string
    {
        return match ($eventType) {
            'login' => 'ArrowRightOnRectangleIcon',
            'logout' => 'ArrowLeftOnRectangleIcon',
            'login_failed' => 'ExclamationTriangleIcon',
            'password_reset' => 'KeyIcon',
            default => 'InformationCircleIcon',
        };
    }

    /**
     * Get color for auth event type.
     */
    protected function getEventColor(string $eventType): string
    {
        return match ($eventType) {
            'login' => 'success',
            'logout' => 'default',
            'login_failed' => 'danger',
            'password_reset' => 'warning',
            default => 'primary',
        };
    }

    /**
     * Format auth event message.
     */
    protected function formatEventMessage(object $event): string
    {
        $action = match ($event->event_type) {
            'login' => 'logged in',
            'logout' => 'logged out',
            'login_failed' => 'failed login attempt',
            'password_reset' => 'reset password',
            default => $event->event_type,
        };

        $ip = $event->ip_address ? " from {$event->ip_address}" : '';
        
        return "{$event->user_name} {$action}{$ip}";
    }

    /**
     * Get icon for audit action.
     */
    protected function getAuditIcon(string $action): string
    {
        return match (strtolower($action)) {
            'create', 'created' => 'PlusCircleIcon',
            'update', 'updated' => 'PencilSquareIcon',
            'delete', 'deleted' => 'TrashIcon',
            default => 'DocumentTextIcon',
        };
    }

    /**
     * Get color for audit action.
     */
    protected function getAuditColor(string $action): string
    {
        return match (strtolower($action)) {
            'create', 'created' => 'success',
            'update', 'updated' => 'primary',
            'delete', 'deleted' => 'danger',
            default => 'default',
        };
    }

    /**
     * Format audit event message.
     */
    protected function formatAuditMessage(object $event): string
    {
        $model = class_basename($event->auditable_type ?? 'Record');
        $action = ucfirst(strtolower($event->action));
        $user = $event->user_name ?? 'System';
        
        return "{$user} {$action} {$model}";
    }
}
