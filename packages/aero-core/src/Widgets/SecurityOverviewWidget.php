<?php

declare(strict_types=1);

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Security Overview Widget for Core Dashboard
 *
 * Displays security-related tenant statistics:
 * - Failed login attempts (today)
 * - Active sessions count
 * - Last login time for current user
 * - Registered devices count
 *
 * This is an ALERT widget - draws attention to security events.
 */
class SecurityOverviewWidget extends AbstractDashboardWidget
{
    protected string $position = 'sidebar';
    protected int $order = 2;
    protected int|string $span = 1;
    protected CoreWidgetCategory $category = CoreWidgetCategory::ALERT;
    protected array $requiredPermissions = [];

    public function getKey(): string
    {
        return 'core.security_overview';
    }

    public function getComponent(): string
    {
        return 'Widgets/Core/SecurityOverviewWidget';
    }

    public function getTitle(): string
    {
        return 'Security Overview';
    }

    public function getDescription(): string
    {
        return 'Login attempts, sessions, and security events';
    }

    public function getModuleCode(): string
    {
        return 'core';
    }

    /**
     * Security widget is always enabled.
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
        $user = auth()->user();
        
        // Failed login attempts today
        $failedLoginsToday = 0;
        try {
            if (Schema::hasTable('failed_login_attempts')) {
                $failedLoginsToday = DB::table('failed_login_attempts')
                    ->whereDate('created_at', today())
                    ->count();
            } elseif (Schema::hasTable('authentication_events')) {
                $failedLoginsToday = DB::table('authentication_events')
                    ->where('event_type', 'login_failed')
                    ->whereDate('created_at', today())
                    ->count();
            }
        } catch (\Throwable $e) {
            // Silently ignore
        }

        // Active sessions
        $activeSessions = 0;
        try {
            if (Schema::hasTable('sessions')) {
                $activeSessions = DB::table('sessions')
                    ->where('last_activity', '>', now()->subMinutes(30)->timestamp)
                    ->count();
            }
        } catch (\Throwable $e) {
            // Silently ignore
        }

        // User's last login
        $lastLogin = null;
        try {
            if ($user && Schema::hasTable('authentication_events')) {
                $lastLoginEvent = DB::table('authentication_events')
                    ->where('user_id', $user->id)
                    ->where('event_type', 'login')
                    ->orderByDesc('created_at')
                    ->skip(1) // Skip current login
                    ->first();
                
                if ($lastLoginEvent) {
                    $lastLogin = $lastLoginEvent->created_at;
                }
            }
        } catch (\Throwable $e) {
            // Silently ignore
        }

        // Registered devices
        $registeredDevices = 0;
        try {
            if (Schema::hasTable('user_devices')) {
                $registeredDevices = DB::table('user_devices')->count();
            }
        } catch (\Throwable $e) {
            // Silently ignore
        }

        // Security events today
        $securityEventsToday = 0;
        try {
            if (Schema::hasTable('security_events')) {
                $securityEventsToday = DB::table('security_events')
                    ->whereDate('created_at', today())
                    ->count();
            }
        } catch (\Throwable $e) {
            // Silently ignore
        }

        // Determine alert level
        $alertLevel = 'success'; // Green - all good
        if ($failedLoginsToday > 10) {
            $alertLevel = 'danger'; // Red - concerning
        } elseif ($failedLoginsToday > 3) {
            $alertLevel = 'warning'; // Orange - watch
        }

        return [
            'failedLoginsToday' => $failedLoginsToday,
            'activeSessions' => $activeSessions,
            'lastLogin' => $lastLogin,
            'registeredDevices' => $registeredDevices,
            'securityEventsToday' => $securityEventsToday,
            'alertLevel' => $alertLevel,
            'items' => [
                [
                    'label' => 'Failed Logins Today',
                    'value' => $failedLoginsToday,
                    'icon' => 'ShieldExclamationIcon',
                    'status' => $failedLoginsToday > 5 ? 'danger' : ($failedLoginsToday > 0 ? 'warning' : 'success'),
                ],
                [
                    'label' => 'Active Sessions',
                    'value' => $activeSessions,
                    'icon' => 'ComputerDesktopIcon',
                    'status' => 'success',
                ],
                [
                    'label' => 'Registered Devices',
                    'value' => $registeredDevices,
                    'icon' => 'DevicePhoneMobileIcon',
                    'status' => 'default',
                ],
                [
                    'label' => 'Last Login',
                    'value' => $lastLogin ? \Carbon\Carbon::parse($lastLogin)->diffForHumans() : 'First login',
                    'icon' => 'ClockIcon',
                    'status' => 'default',
                ],
            ],
        ];
    }
}
