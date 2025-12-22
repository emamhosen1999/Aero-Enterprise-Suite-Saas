<?php

declare(strict_types=1);

namespace Aero\Core\Services\Auth;

use Aero\Core\Models\User;
use Aero\Core\Models\UserSession;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Session Management Service
 *
 * Tracks and manages user sessions across devices.
 *
 * Features:
 * - Track active sessions per user
 * - Session metadata (device, browser, IP, location)
 * - Terminate sessions remotely
 * - Concurrent session limits
 * - Session activity monitoring
 *
 * Usage:
 * ```php
 * $sessionService = app(SessionManagementService::class);
 *
 * // Create session on login
 * $session = $sessionService->createSession($user, $request);
 *
 * // Get user's active sessions
 * $sessions = $sessionService->getUserSessions($user);
 *
 * // Terminate a specific session
 * $sessionService->terminateSession($user, $sessionId);
 *
 * // Terminate all other sessions
 * $sessionService->terminateOtherSessions($user, $currentSessionId);
 * ```
 */
class SessionManagementService
{
    /**
     * Maximum concurrent sessions per user (0 = unlimited).
     */
    protected int $maxSessions = 5;

    /**
     * Session inactivity timeout in minutes.
     */
    protected int $inactivityTimeout = 60;

    public function __construct()
    {
        $this->maxSessions = config('auth.max_sessions', 5);
        $this->inactivityTimeout = config('auth.session_timeout', 60);
    }

    /**
     * Create a new session for a user.
     *
     * @param User $user
     * @param Request $request
     * @return UserSession
     */
    public function createSession(User $user, Request $request): UserSession
    {
        // Check concurrent session limit
        $this->enforceSessionLimit($user);

        $sessionToken = Str::random(64);

        $session = UserSession::create([
            'user_id' => $user->id,
            'session_token' => hash('sha256', $sessionToken),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_type' => $this->detectDeviceType($request->userAgent()),
            'browser' => $this->detectBrowser($request->userAgent()),
            'platform' => $this->detectPlatform($request->userAgent()),
            'location' => $this->getLocationFromIp($request->ip()),
            'is_current' => true,
            'last_active_at' => now(),
            'expires_at' => now()->addMinutes($this->inactivityTimeout),
        ]);

        // Store the plain token for response (only shown once)
        $session->plain_token = $sessionToken;

        return $session;
    }

    /**
     * Update session activity timestamp.
     *
     * @param string $sessionToken
     */
    public function touchSession(string $sessionToken): void
    {
        UserSession::where('session_token', hash('sha256', $sessionToken))
            ->update([
                'last_active_at' => now(),
                'expires_at' => now()->addMinutes($this->inactivityTimeout),
            ]);
    }

    /**
     * Get all active sessions for a user.
     *
     * @param User $user
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getUserSessions(User $user)
    {
        return UserSession::where('user_id', $user->id)
            ->where('expires_at', '>', now())
            ->orderByDesc('last_active_at')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'device_type' => $session->device_type,
                    'browser' => $session->browser,
                    'platform' => $session->platform,
                    'ip_address' => $session->ip_address,
                    'location' => $session->location,
                    'is_current' => $session->is_current,
                    'last_active_at' => $session->last_active_at->diffForHumans(),
                    'created_at' => $session->created_at->diffForHumans(),
                ];
            });
    }

    /**
     * Terminate a specific session.
     *
     * @param User $user
     * @param int $sessionId
     * @return bool
     */
    public function terminateSession(User $user, int $sessionId): bool
    {
        return UserSession::where('user_id', $user->id)
            ->where('id', $sessionId)
            ->delete() > 0;
    }

    /**
     * Terminate all sessions except the current one.
     *
     * @param User $user
     * @param int $currentSessionId
     * @return int Number of sessions terminated
     */
    public function terminateOtherSessions(User $user, int $currentSessionId): int
    {
        return UserSession::where('user_id', $user->id)
            ->where('id', '!=', $currentSessionId)
            ->delete();
    }

    /**
     * Terminate all sessions for a user.
     *
     * @param User $user
     * @return int Number of sessions terminated
     */
    public function terminateAllSessions(User $user): int
    {
        return UserSession::where('user_id', $user->id)->delete();
    }

    /**
     * Validate a session token.
     *
     * @param string $sessionToken
     * @return UserSession|null
     */
    public function validateSession(string $sessionToken): ?UserSession
    {
        $session = UserSession::where('session_token', hash('sha256', $sessionToken))
            ->where('expires_at', '>', now())
            ->first();

        if ($session) {
            $this->touchSession($sessionToken);
        }

        return $session;
    }

    /**
     * Get active session count for a user.
     *
     * @param User $user
     * @return int
     */
    public function getActiveSessionCount(User $user): int
    {
        return UserSession::where('user_id', $user->id)
            ->where('expires_at', '>', now())
            ->count();
    }

    /**
     * Clean up expired sessions.
     *
     * @return int Number of sessions cleaned
     */
    public function cleanupExpiredSessions(): int
    {
        return UserSession::where('expires_at', '<', now())->delete();
    }

    /**
     * Enforce maximum session limit for a user.
     *
     * @param User $user
     */
    protected function enforceSessionLimit(User $user): void
    {
        if ($this->maxSessions <= 0) {
            return; // Unlimited
        }

        $activeCount = $this->getActiveSessionCount($user);

        if ($activeCount >= $this->maxSessions) {
            // Terminate oldest session
            UserSession::where('user_id', $user->id)
                ->where('expires_at', '>', now())
                ->orderBy('last_active_at')
                ->limit($activeCount - $this->maxSessions + 1)
                ->delete();
        }
    }

    /**
     * Detect device type from user agent.
     *
     * @param string|null $userAgent
     * @return string
     */
    protected function detectDeviceType(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'unknown';
        }

        $userAgent = strtolower($userAgent);

        if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i', $userAgent)) {
            return 'tablet';
        }

        if (preg_match('/(mobile|iphone|ipod|phone|android|blackberry|opera mini|iemobile)/i', $userAgent)) {
            return 'mobile';
        }

        return 'desktop';
    }

    /**
     * Detect browser from user agent.
     *
     * @param string|null $userAgent
     * @return string
     */
    protected function detectBrowser(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'Unknown';
        }

        $browsers = [
            'Edge' => '/edg/i',
            'Chrome' => '/chrome/i',
            'Firefox' => '/firefox/i',
            'Safari' => '/safari/i',
            'Opera' => '/opera|opr/i',
            'IE' => '/msie|trident/i',
        ];

        foreach ($browsers as $browser => $pattern) {
            if (preg_match($pattern, $userAgent)) {
                return $browser;
            }
        }

        return 'Unknown';
    }

    /**
     * Detect platform/OS from user agent.
     *
     * @param string|null $userAgent
     * @return string
     */
    protected function detectPlatform(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'Unknown';
        }

        $platforms = [
            'Windows' => '/windows/i',
            'macOS' => '/macintosh|mac os/i',
            'Linux' => '/linux/i',
            'iOS' => '/iphone|ipad|ipod/i',
            'Android' => '/android/i',
        ];

        foreach ($platforms as $platform => $pattern) {
            if (preg_match($pattern, $userAgent)) {
                return $platform;
            }
        }

        return 'Unknown';
    }

    /**
     * Get approximate location from IP address.
     *
     * @param string|null $ip
     * @return string|null
     */
    protected function getLocationFromIp(?string $ip): ?string
    {
        // Skip for local IPs
        if (! $ip || in_array($ip, ['127.0.0.1', '::1', 'localhost'])) {
            return 'Local';
        }

        // In production, integrate with a geolocation service like:
        // - MaxMind GeoIP
        // - ip-api.com
        // - ipinfo.io

        return null;
    }

    /**
     * Get sessions that will expire soon (within X minutes).
     *
     * @param int $minutes
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getSessionsExpiringSoon(int $minutes = 5)
    {
        return UserSession::where('expires_at', '>', now())
            ->where('expires_at', '<', now()->addMinutes($minutes))
            ->get();
    }

    /**
     * Get session statistics for a user.
     *
     * @param User $user
     * @return array
     */
    public function getSessionStats(User $user): array
    {
        $sessions = UserSession::where('user_id', $user->id)
            ->where('expires_at', '>', now())
            ->get();

        return [
            'total_active' => $sessions->count(),
            'max_allowed' => $this->maxSessions ?: 'Unlimited',
            'by_device' => $sessions->groupBy('device_type')->map->count(),
            'by_browser' => $sessions->groupBy('browser')->map->count(),
            'by_platform' => $sessions->groupBy('platform')->map->count(),
        ];
    }
}
