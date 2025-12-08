<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class TrackSecurityActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only track for authenticated tenant users (not landlord/admin users)
        // The user_sessions_tracking table only exists in tenant databases
        if (Auth::guard('web')->check() && ! Auth::guard('landlord')->check()) {
            $this->updateSessionActivity($request);
        }

        return $response;
    }

    /**
     * Update session activity tracking
     */
    private function updateSessionActivity(Request $request): void
    {
        try {
            $sessionId = $request->session()->getId();
            $userId = Auth::id();

            // Update last activity for the current session
            DB::table('user_sessions_tracking')
                ->where('session_id', $sessionId)
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->update([
                    'last_activity' => now(),
                    'updated_at' => now(),
                ]);

            // Detect potential security anomalies
            $this->detectSecurityAnomalies($request, $userId);

        } catch (\Exception $e) {
            // Don't break the application flow
            Log::debug('Failed to update session activity: '.$e->getMessage());
        }
    }

    /**
     * Detect potential security anomalies
     */
    private function detectSecurityAnomalies(Request $request, int $userId): void
    {
        try {
            $currentIp = $request->ip();
            $currentUserAgent = $request->userAgent();

            // Check for IP address changes within active sessions
            $existingSessions = DB::table('user_sessions_tracking')
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->where('ip_address', '!=', $currentIp)
                ->count();

            if ($existingSessions > 0) {
                // Different IP detected for same user
                $this->logSecurityEvent('ip_address_change', [
                    'user_id' => $userId,
                    'current_ip' => $currentIp,
                    'user_agent' => $currentUserAgent,
                    'session_id' => $request->session()->getId(),
                ]);
            }

            // Check for unusual login patterns (e.g., multiple devices)
            $activeSessionsCount = DB::table('user_sessions_tracking')
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->count();

            if ($activeSessionsCount > 3) { // Configurable threshold
                $this->logSecurityEvent('multiple_active_sessions', [
                    'user_id' => $userId,
                    'active_sessions_count' => $activeSessionsCount,
                    'ip_address' => $currentIp,
                    'user_agent' => $currentUserAgent,
                ]);
            }

        } catch (\Exception $e) {
            Log::debug('Failed to detect security anomalies: '.$e->getMessage());
        }
    }

    /**
     * Log security event
     */
    private function logSecurityEvent(string $eventType, array $data): void
    {
        try {
            DB::table('security_events')->insert([
                'user_id' => $data['user_id'] ?? null,
                'event_type' => $eventType,
                'severity' => $this->getSeverityForEvent($eventType),
                'ip_address' => $data['ip_address'] ?? null,
                'user_agent' => $data['user_agent'] ?? null,
                'metadata' => json_encode($data),
                'risk_score' => $this->getRiskScoreForEvent($eventType),
                'investigated' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log security event: '.$e->getMessage());
        }
    }

    /**
     * Get severity level for event type
     */
    private function getSeverityForEvent(string $eventType): string
    {
        $severityMap = [
            'ip_address_change' => 'warning',
            'multiple_active_sessions' => 'info',
            'suspicious_activity' => 'critical',
            'failed_login' => 'warning',
        ];

        return $severityMap[$eventType] ?? 'info';
    }

    /**
     * Get risk score for event type
     */
    private function getRiskScoreForEvent(string $eventType): string
    {
        $riskMap = [
            'ip_address_change' => 'medium',
            'multiple_active_sessions' => 'low',
            'suspicious_activity' => 'high',
            'failed_login' => 'medium',
        ];

        return $riskMap[$eventType] ?? 'low';
    }
}
