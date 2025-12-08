<?php

namespace Aero\Core\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Enhanced Application Logging Service
 * Provides structured logging with context and performance monitoring
 */
class ApplicationLogger
{
    private const LOG_LEVELS = [
        'emergency' => 0,
        'alert' => 1,
        'critical' => 2,
        'error' => 3,
        'warning' => 4,
        'notice' => 5,
        'info' => 6,
        'debug' => 7,
    ];

    /**
     * Log user action with context
     */
    public function logUserAction(string $action, array $context = [], string $level = 'info')
    {
        $user = auth()->user();
        $enrichedContext = array_merge([
            'user_id' => $user?->id,
            'user_email' => $user?->email,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'route' => request()->route()?->getName(),
            'method' => request()->method(),
            'url' => request()->fullUrl(),
            'timestamp' => Carbon::now()->toISOString(),
            'session_id' => session()->getId(),
        ], $context);

        Log::log($level, $action, $enrichedContext);

        // Store in database for audit trail
        $this->storeAuditLog($action, $enrichedContext, $level);
    }

    /**
     * Log database query performance
     */
    public function logSlowQuery(string $query, float $executionTime, array $bindings = [])
    {
        if ($executionTime > 1000) { // Log queries slower than 1 second
            $this->logUserAction('Slow Query Detected', [
                'query' => $query,
                'execution_time_ms' => $executionTime,
                'bindings' => $bindings,
                'performance_impact' => 'high',
            ], 'warning');
        }
    }

    /**
     * Log security events
     */
    public function logSecurityEvent(string $event, array $context = [], string $severity = 'warning')
    {
        $securityContext = array_merge([
            'event_type' => 'security',
            'severity' => $severity,
            'requires_investigation' => in_array($severity, ['critical', 'alert', 'emergency']),
        ], $context);

        $this->logUserAction($event, $securityContext, $severity);

        // Immediate notification for critical security events
        if (in_array($severity, ['critical', 'alert', 'emergency'])) {
            $this->notifySecurityTeam($event, $securityContext);
        }
    }

    /**
     * Log business process events
     */
    public function logBusinessProcess(string $process, string $status, array $data = [])
    {
        $this->logUserAction("Business Process: {$process}", [
            'process_name' => $process,
            'process_status' => $status,
            'business_data' => $data,
            'process_type' => 'business_logic',
        ], $status === 'failed' ? 'error' : 'info');
    }

    /**
     * Store audit log in database
     */
    private function storeAuditLog(string $action, array $context, string $level)
    {
        try {
            DB::table('audit_logs')->insert([
                'action' => $action,
                'context' => json_encode($context),
                'level' => $level,
                'user_id' => $context['user_id'] ?? null,
                'ip_address' => $context['ip_address'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Fallback to file logging if database fails
            Log::error('Failed to store audit log', [
                'original_action' => $action,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify security team of critical events
     */
    private function notifySecurityTeam(string $event, array $context)
    {
        // Implementation would depend on your notification system
        // This could send emails, Slack messages, SMS, etc.
        Log::critical("SECURITY ALERT: {$event}", $context);
    }

    /**
     * Generate performance report
     */
    public function generatePerformanceReport(int $days = 7): array
    {
        try {
            $startDate = Carbon::now()->subDays($days);

            $logs = DB::table('audit_logs')
                ->where('created_at', '>=', $startDate)
                ->where('context', 'like', '%execution_time_ms%')
                ->get();

            $slowQueries = [];
            $averageResponseTime = 0;
            $totalQueries = 0;

            foreach ($logs as $log) {
                $context = json_decode($log->context, true);
                if (isset($context['execution_time_ms'])) {
                    $totalQueries++;
                    $averageResponseTime += $context['execution_time_ms'];

                    if ($context['execution_time_ms'] > 1000) {
                        $slowQueries[] = $context;
                    }
                }
            }

            return [
                'period' => "{$days} days",
                'total_queries' => $totalQueries,
                'average_response_time' => $totalQueries > 0 ? round($averageResponseTime / $totalQueries, 2) : 0,
                'slow_queries_count' => count($slowQueries),
                'slow_queries' => array_slice($slowQueries, 0, 10), // Top 10 slowest
                'generated_at' => Carbon::now()->toISOString(),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Failed to generate performance report: '.$e->getMessage()];
        }
    }
}
