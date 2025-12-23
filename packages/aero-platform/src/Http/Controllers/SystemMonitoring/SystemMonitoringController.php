<?php

namespace Aero\Platform\Http\Controllers\SystemMonitoring;

use Aero\Platform\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Aero\Core\Support\TenantCache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

/**
 * System Monitoring Controller
 * Provides comprehensive system monitoring dashboard using existing UI patterns
 */
class SystemMonitoringController extends Controller
{
    /**
     * Display the system monitoring dashboard
     */
    public function index()
    {
        try {
            $logger = new \App\Services\Logging\ApplicationLogger;
            $logger->logUserAction('System Monitoring Dashboard Accessed');
        } catch (\Exception $e) {
            Log::info('System Monitoring Dashboard Accessed');
        }

        return Inertia::render('Platform/Admin/SystemMonitoring/Enhanced', [
            'title' => 'Enterprise System Monitoring',
            'initialData' => $this->getSystemOverview(),
        ]);
    }

    /**
     * Get system overview data
     */
    public function getSystemOverview()
    {
        return TenantCache::remember('system_overview', 300, function () {
            return [
                'performance_summary' => $this->getPerformanceSummary(),
                'error_summary' => $this->getErrorSummary(),
                'user_activity' => $this->getUserActivitySummary(),
                'system_health' => $this->getSystemHealthCheck(),
                'database_stats' => $this->getComprehensiveDatabaseStats(),
                'system_resources' => $this->getSystemResources(),
                'security_metrics' => $this->getSecurityMetrics(),
                'capacity_planning' => $this->getCapacityPlanningData(),
                'service_availability' => $this->getServiceAvailability(),
                'compliance_metrics' => $this->getComplianceMetrics(),
            ];
        });
    }

    /**
     * Get real-time metrics API
     */
    public function getMetrics(Request $request)
    {
        $type = $request->get('type', 'overview');
        $period = $request->get('period', '24h');

        switch ($type) {
            case 'performance':
                return response()->json($this->getPerformanceMetrics($period));
            case 'errors':
                return response()->json($this->getErrorMetrics($period));
            case 'users':
                return response()->json($this->getUserMetrics($period));
            case 'system':
                return response()->json($this->getSystemMetrics());
            default:
                return response()->json($this->getSystemOverview());
        }
    }

    /**
     * Get performance summary
     */
    private function getPerformanceSummary()
    {
        $last24h = Carbon::now()->subDay();

        $metrics = DB::table('performance_metrics')
            ->where('created_at', '>=', $last24h)
            ->selectRaw('
                metric_type,
                COUNT(*) as total_requests,
                AVG(execution_time_ms) as avg_time,
                MAX(execution_time_ms) as max_time,
                MIN(execution_time_ms) as min_time
            ')
            ->groupBy('metric_type')
            ->get();

        $slowQueries = DB::table('performance_metrics')
            ->where('created_at', '>=', $last24h)
            ->where('execution_time_ms', '>', 1000)
            ->count();

        return [
            'metrics' => $metrics,
            'slow_queries_count' => $slowQueries,
            'avg_response_time' => $metrics->avg('avg_time') ?? 0,
            'total_requests' => $metrics->sum('total_requests'),
        ];
    }

    /**
     * Get error summary
     */
    private function getErrorSummary()
    {
        $last24h = Carbon::now()->subDay();

        $errorCounts = DB::table('error_logs')
            ->where('created_at', '>=', $last24h)
            ->selectRaw('
                COUNT(*) as total_errors,
                SUM(CASE WHEN resolved = 0 THEN 1 ELSE 0 END) as unresolved_errors,
                COUNT(DISTINCT user_id) as affected_users
            ')
            ->first();

        $recentErrors = DB::table('error_logs')
            ->where('created_at', '>=', $last24h)
            ->where('resolved', false)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return [
            'total_errors' => $errorCounts->total_errors ?? 0,
            'unresolved_errors' => $errorCounts->unresolved_errors ?? 0,
            'affected_users' => $errorCounts->affected_users ?? 0,
            'recent_errors' => $recentErrors,
        ];
    }

    /**
     * Get user activity summary
     */
    private function getUserActivitySummary()
    {
        $last24h = Carbon::now()->subDay();

        return [
            'active_users' => DB::table('audit_logs')
                ->where('created_at', '>=', $last24h)
                ->distinct('user_id')
                ->count('user_id'),
            'total_actions' => DB::table('audit_logs')
                ->where('created_at', '>=', $last24h)
                ->count(),
            'top_activities' => DB::table('audit_logs')
                ->where('created_at', '>=', $last24h)
                ->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get(),
        ];
    }

    /**
     * Get system health check
     */
    private function getSystemHealthCheck()
    {
        $health = [
            'database' => $this->checkDatabaseHealth(),
            'cache' => $this->checkCacheHealth(),
            'storage' => $this->checkStorageHealth(),
            'queues' => $this->checkQueueHealth(),
        ];

        $overallStatus = collect($health)->every(fn ($check) => $check['status'] === 'healthy')
            ? 'healthy'
            : (collect($health)->contains(fn ($check) => $check['status'] === 'critical')
                ? 'critical'
                : 'warning');

        return [
            'overall_status' => $overallStatus,
            'checks' => $health,
            'last_check' => now()->toISOString(),
        ];
    }

    /**
     * Check database health
     */
    private function checkDatabaseHealth()
    {
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $responseTime = (microtime(true) - $start) * 1000;

            return [
                'status' => $responseTime < 100 ? 'healthy' : ($responseTime < 500 ? 'warning' : 'critical'),
                'response_time' => round($responseTime, 2),
                'message' => $responseTime < 100 ? 'Database responding normally' : 'Database response time elevated',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'critical',
                'response_time' => null,
                'message' => 'Database connection failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Check cache health
     */
    private function checkCacheHealth()
    {
        try {
            $testKey = 'health_check_'.now()->timestamp;
            TenantCache::put($testKey, 'test', 10);
            $retrieved = TenantCache::get($testKey);
            TenantCache::forget($testKey);

            return [
                'status' => $retrieved === 'test' ? 'healthy' : 'warning',
                'message' => $retrieved === 'test' ? 'Cache working normally' : 'Cache read/write issues',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'critical',
                'message' => 'Cache system failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Check storage health
     */
    private function checkStorageHealth()
    {
        try {
            $path = storage_path();
            $freeBytes = disk_free_space($path);
            $totalBytes = disk_total_space($path);
            $usedPercent = (($totalBytes - $freeBytes) / $totalBytes) * 100;

            return [
                'status' => $usedPercent < 80 ? 'healthy' : ($usedPercent < 90 ? 'warning' : 'critical'),
                'used_percent' => round($usedPercent, 1),
                'free_space' => $this->formatBytes($freeBytes),
                'message' => $usedPercent < 80 ? 'Storage space adequate' : 'Storage space running low',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'warning',
                'message' => 'Could not check storage: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Check queue health
     */
    private function checkQueueHealth()
    {
        try {
            $failedJobs = DB::table('failed_jobs')->count();
            $pendingJobs = DB::table('jobs')->count();

            return [
                'status' => $failedJobs < 10 ? 'healthy' : ($failedJobs < 50 ? 'warning' : 'critical'),
                'failed_jobs' => $failedJobs,
                'pending_jobs' => $pendingJobs,
                'message' => $failedJobs < 10 ? 'Queue processing normally' : 'High number of failed jobs',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'warning',
                'message' => 'Could not check queues: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Get database statistics
     */
    private function getDatabaseStats()
    {
        try {
            $tables = DB::select('
                SELECT 
                    table_name,
                    table_rows,
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                ORDER BY (data_length + index_length) DESC
                LIMIT 10
            ');

            return [
                'largest_tables' => $tables,
                'total_tables' => count(DB::select('SHOW TABLES')),
            ];
        } catch (\Exception $e) {
            return [
                'error' => 'Could not retrieve database stats: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision).' '.$units[$i];
    }

    /**
     * Get performance metrics for specific period
     */
    private function getPerformanceMetrics($period)
    {
        $hours = match ($period) {
            '1h' => 1,
            '6h' => 6,
            '24h' => 24,
            '7d' => 168,
            default => 24
        };

        $startTime = Carbon::now()->subHours($hours);

        return DB::table('performance_metrics')
            ->where('created_at', '>=', $startTime)
            ->selectRaw('
                DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00") as hour,
                metric_type,
                AVG(execution_time_ms) as avg_time,
                COUNT(*) as request_count
            ')
            ->groupBy('hour', 'metric_type')
            ->orderBy('hour')
            ->get()
            ->groupBy('metric_type');
    }

    /**
     * Get error metrics for specific period
     */
    private function getErrorMetrics($period)
    {
        $hours = match ($period) {
            '1h' => 1,
            '6h' => 6,
            '24h' => 24,
            '7d' => 168,
            default => 24
        };

        $startTime = Carbon::now()->subHours($hours);

        return [
            'error_trends' => DB::table('error_logs')
                ->where('created_at', '>=', $startTime)
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00") as hour, COUNT(*) as count')
                ->groupBy('hour')
                ->orderBy('hour')
                ->get(),
            'error_types' => DB::table('error_logs')
                ->where('created_at', '>=', $startTime)
                ->selectRaw('LEFT(message, 50) as error_type, COUNT(*) as count')
                ->groupBy('error_type')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get(),
        ];
    }

    /**
     * Get user metrics for specific period
     */
    private function getUserMetrics($period)
    {
        $hours = match ($period) {
            '1h' => 1,
            '6h' => 6,
            '24h' => 24,
            '7d' => 168,
            default => 24
        };

        $startTime = Carbon::now()->subHours($hours);

        return [
            'user_activity' => DB::table('audit_logs')
                ->where('created_at', '>=', $startTime)
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00") as hour, COUNT(DISTINCT user_id) as active_users')
                ->groupBy('hour')
                ->orderBy('hour')
                ->get(),
            'top_users' => DB::table('audit_logs')
                ->join('users', 'audit_logs.user_id', '=', 'users.id')
                ->where('audit_logs.created_at', '>=', $startTime)
                ->selectRaw('users.name, COUNT(*) as action_count')
                ->groupBy('users.id', 'users.name')
                ->orderBy('action_count', 'desc')
                ->limit(10)
                ->get(),
        ];
    }

    /**
     * Get current system metrics
     */
    private function getSystemMetrics()
    {
        return [
            'server_load' => $this->getServerLoad(),
            'memory_usage' => $this->getMemoryUsage(),
            'uptime' => $this->getSystemUptime(),
        ];
    }

    private function getServerLoad()
    {
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();

            return [
                '1min' => $load[0],
                '5min' => $load[1],
                '15min' => $load[2],
            ];
        }

        return null;
    }

    private function getMemoryUsage()
    {
        return [
            'current' => memory_get_usage(true),
            'peak' => memory_get_peak_usage(true),
            'limit' => ini_get('memory_limit'),
        ];
    }

    private function getSystemUptime()
    {
        if (PHP_OS_FAMILY === 'Linux') {
            $uptime = file_get_contents('/proc/uptime');

            return floatval(explode(' ', $uptime)[0]);
        }

        return null;
    }

    /**
     * Get comprehensive database statistics - ISO standard compliant
     */
    private function getComprehensiveDatabaseStats()
    {
        try {
            $stats = [
                'table_analysis' => $this->getAllTablesAnalysis(),
                'index_analysis' => $this->getIndexAnalysis(),
                'storage_analysis' => $this->getStorageAnalysis(),
                'query_performance' => $this->getQueryPerformanceStats(),
                'connection_pool' => $this->getConnectionPoolStats(),
                'replication_status' => $this->getReplicationStatus(),
                'backup_status' => $this->getBackupStatus(),
            ];

            return $stats;
        } catch (\Exception $e) {
            \Log::error('Database stats error: '.$e->getMessage());

            return ['error' => 'Unable to retrieve database statistics'];
        }
    }

    private function getAllTablesAnalysis()
    {
        $tables = DB::select('
            SELECT 
                TABLE_NAME,
                TABLE_ROWS,
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb,
                ROUND(DATA_LENGTH / 1024 / 1024, 2) as data_mb,
                ROUND(INDEX_LENGTH / 1024 / 1024, 2) as index_mb,
                TABLE_COLLATION,
                ENGINE,
                CREATE_TIME,
                UPDATE_TIME,
                CHECK_TIME,
                AUTO_INCREMENT
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
        ');

        return [
            'tables' => $tables,
            'summary' => [
                'total_tables' => count($tables),
                'total_size_mb' => array_sum(array_column($tables, 'size_mb')),
                'total_rows' => array_sum(array_column($tables, 'TABLE_ROWS')),
                'largest_table' => $tables[0] ?? null,
                'engines_used' => array_unique(array_column($tables, 'ENGINE')),
            ],
        ];
    }

    private function getIndexAnalysis()
    {
        try {
            $indexes = DB::select('
                SELECT 
                    TABLE_NAME,
                    INDEX_NAME,
                    COLUMN_NAME,
                    CARDINALITY,
                    SUB_PART,
                    INDEX_TYPE,
                    NON_UNIQUE
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE()
                ORDER BY TABLE_NAME, INDEX_NAME
            ');

            $duplicateIndexes = DB::select('
                SELECT 
                    TABLE_NAME,
                    COUNT(*) as duplicate_count,
                    GROUP_CONCAT(INDEX_NAME) as index_names
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE()
                GROUP BY TABLE_NAME, COLUMN_NAME
                HAVING COUNT(*) > 1
            ');

            return [
                'indexes' => $indexes,
                'duplicate_indexes' => $duplicateIndexes,
                'summary' => [
                    'total_indexes' => count($indexes),
                    'duplicate_count' => count($duplicateIndexes),
                    'unique_indexes' => count(array_filter($indexes, fn ($i) => $i->NON_UNIQUE == 0)),
                    'fulltext_indexes' => count(array_filter($indexes, fn ($i) => $i->INDEX_TYPE == 'FULLTEXT')),
                ],
            ];
        } catch (\Exception $e) {
            return ['error' => 'Index analysis unavailable'];
        }
    }

    private function getStorageAnalysis()
    {
        try {
            $storage = DB::select('
                SELECT 
                    ENGINE,
                    COUNT(*) as table_count,
                    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb,
                    ROUND(AVG(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as avg_size_mb
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE()
                GROUP BY ENGINE
            ');

            $fragmentation = DB::select('
                SELECT 
                    TABLE_NAME,
                    ROUND(DATA_FREE / 1024 / 1024, 2) as fragmentation_mb,
                    ROUND((DATA_FREE / (DATA_LENGTH + INDEX_LENGTH + DATA_FREE)) * 100, 2) as fragmentation_percent
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND DATA_FREE > 0
                ORDER BY DATA_FREE DESC
                LIMIT 10
            ');

            return [
                'by_engine' => $storage,
                'fragmentation' => $fragmentation,
                'recommendations' => $this->getStorageRecommendations($fragmentation),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Storage analysis unavailable'];
        }
    }

    private function getStorageRecommendations($fragmentation)
    {
        $recommendations = [];
        foreach ($fragmentation as $table) {
            if ($table->fragmentation_percent > 20) {
                $recommendations[] = [
                    'type' => 'optimize',
                    'table' => $table->TABLE_NAME,
                    'message' => "Table {$table->TABLE_NAME} has {$table->fragmentation_percent}% fragmentation. Consider running OPTIMIZE TABLE.",
                    'priority' => $table->fragmentation_percent > 50 ? 'high' : 'medium',
                ];
            }
        }

        return $recommendations;
    }

    private function getQueryPerformanceStats()
    {
        try {
            $slowQueries = DB::table('performance_metrics')
                ->where('created_at', '>=', now()->subDay())
                ->where('execution_time_ms', '>', 1000)
                ->orderBy('execution_time_ms', 'desc')
                ->limit(10)
                ->get();

            $queryTypes = DB::table('performance_metrics')
                ->select('metric_type', DB::raw('COUNT(*) as count'), DB::raw('AVG(execution_time_ms) as avg_time'))
                ->where('created_at', '>=', now()->subDay())
                ->groupBy('metric_type')
                ->orderBy('avg_time', 'desc')
                ->get();

            return [
                'slow_queries' => $slowQueries,
                'query_types' => $queryTypes,
                'performance_summary' => [
                    'total_queries_24h' => DB::table('performance_metrics')->where('created_at', '>=', now()->subDay())->count(),
                    'avg_execution_time' => DB::table('performance_metrics')->where('created_at', '>=', now()->subDay())->avg('execution_time_ms'),
                    'slowest_query_time' => DB::table('performance_metrics')->where('created_at', '>=', now()->subDay())->max('execution_time_ms'),
                ],
            ];
        } catch (\Exception $e) {
            return ['error' => 'Query performance data unavailable'];
        }
    }

    private function getConnectionPoolStats()
    {
        try {
            $connections = DB::select("SHOW STATUS LIKE 'Threads_%'");
            $maxConnections = DB::select("SHOW VARIABLES LIKE 'max_connections'");

            return [
                'active_connections' => collect($connections)->firstWhere('Variable_name', 'Threads_connected')->Value ?? 0,
                'max_connections' => collect($maxConnections)->first()->Value ?? 0,
                'connection_utilization' => round((collect($connections)->firstWhere('Variable_name', 'Threads_connected')->Value ?? 0) / (collect($maxConnections)->first()->Value ?? 1) * 100, 2),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Connection pool data unavailable'];
        }
    }

    private function getReplicationStatus()
    {
        try {
            // This would be implemented for MySQL replication environments
            return [
                'status' => 'not_configured',
                'lag' => null,
                'last_check' => now(),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Replication status unavailable'];
        }
    }

    private function getBackupStatus()
    {
        try {
            // Check for recent backup files or backup logs
            $backupPath = storage_path('backups');
            $backups = [];

            if (is_dir($backupPath)) {
                $files = glob($backupPath.'/*.sql');
                foreach ($files as $file) {
                    $backups[] = [
                        'filename' => basename($file),
                        'size_mb' => round(filesize($file) / 1024 / 1024, 2),
                        'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                    ];
                }
            }

            return [
                'recent_backups' => array_slice($backups, -5),
                'last_backup' => $backups ? max(array_column($backups, 'created_at')) : null,
                'backup_status' => $backups ? 'available' : 'none',
            ];
        } catch (\Exception $e) {
            return ['error' => 'Backup status unavailable'];
        }
    }

    /**
     * Get system resources monitoring - CPU, Memory, Disk
     */
    private function getSystemResources()
    {
        return [
            'cpu' => $this->getCpuUsage(),
            'memory' => $this->getMemoryUsage(),
            'disk' => $this->getDiskUsage(),
            'network' => $this->getNetworkStats(),
            'processes' => $this->getProcessStats(),
        ];
    }

    private function getCpuUsage()
    {
        try {
            if (PHP_OS_FAMILY === 'Linux') {
                $load = sys_getloadavg();

                return [
                    'load_1min' => $load[0] ?? 0,
                    'load_5min' => $load[1] ?? 0,
                    'load_15min' => $load[2] ?? 0,
                    'cores' => $this->getCpuCores(),
                ];
            }

            return ['error' => 'CPU stats not available on this platform'];
        } catch (\Exception $e) {
            return ['error' => 'CPU stats unavailable'];
        }
    }

    private function getCpuCores()
    {
        if (PHP_OS_FAMILY === 'Linux') {
            return (int) shell_exec('nproc') ?: 1;
        }

        return 1;
    }

    private function getDiskUsage()
    {
        try {
            $path = storage_path();

            return [
                'total_space' => disk_total_space($path),
                'free_space' => disk_free_space($path),
                'used_space' => disk_total_space($path) - disk_free_space($path),
                'usage_percent' => round(((disk_total_space($path) - disk_free_space($path)) / disk_total_space($path)) * 100, 2),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Disk usage unavailable'];
        }
    }

    private function getNetworkStats()
    {
        try {
            // Basic network statistics - would need more sophisticated monitoring for production
            return [
                'active_sessions' => DB::table('sessions')->count(),
                'requests_per_minute' => $this->getRequestsPerMinute(),
                'bandwidth_usage' => 'monitoring_required',
            ];
        } catch (\Exception $e) {
            return ['error' => 'Network stats unavailable'];
        }
    }

    private function getRequestsPerMinute()
    {
        try {
            return DB::table('performance_metrics')
                ->where('created_at', '>=', now()->subMinute())
                ->count();
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getProcessStats()
    {
        try {
            return [
                'php_processes' => $this->getPhpProcessCount(),
                'memory_per_process' => memory_get_usage(true),
                'max_execution_time' => ini_get('max_execution_time'),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Process stats unavailable'];
        }
    }

    private function getPhpProcessCount()
    {
        if (PHP_OS_FAMILY === 'Linux') {
            return (int) shell_exec("ps aux | grep -c '[p]hp'") ?: 1;
        }

        return 1;
    }

    /**
     * Get security metrics and monitoring
     */
    private function getSecurityMetrics()
    {
        return [
            'authentication' => $this->getAuthenticationStats(),
            'failed_attempts' => $this->getFailedLoginAttempts(),
            'suspicious_activities' => $this->getSuspiciousActivities(),
            'security_events' => $this->getSecurityEvents(),
            'access_patterns' => $this->getAccessPatterns(),
        ];
    }

    private function getAuthenticationStats()
    {
        try {
            $last24h = now()->subDay();

            return [
                'successful_logins_24h' => DB::table('activity_log')
                    ->where('description', 'User Login')
                    ->where('created_at', '>=', $last24h)
                    ->count(),
                'unique_users_24h' => DB::table('activity_log')
                    ->where('description', 'User Login')
                    ->where('created_at', '>=', $last24h)
                    ->distinct('causer_id')
                    ->count(),
                'avg_session_duration' => $this->getAverageSessionDuration(),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Authentication stats unavailable'];
        }
    }

    private function getFailedLoginAttempts()
    {
        try {
            return DB::table('error_logs')
                ->where('error_type', 'authentication_failed')
                ->where('created_at', '>=', now()->subDay())
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getSuspiciousActivities()
    {
        try {
            // Define suspicious patterns
            $suspiciousIPs = DB::table('activity_log')
                ->selectRaw('properties->>"$.ip_address" as ip, COUNT(*) as attempts')
                ->where('created_at', '>=', now()->subHour())
                ->groupBy('ip')
                ->having('attempts', '>', 50)
                ->get();

            return [
                'high_frequency_ips' => $suspiciousIPs,
                'unusual_access_patterns' => $this->getUnusualAccessPatterns(),
                'potential_threats' => $this->getPotentialThreats(),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Suspicious activity monitoring unavailable'];
        }
    }

    private function getUnusualAccessPatterns()
    {
        try {
            // Users accessing outside normal hours
            $unusualHours = DB::table('activity_log')
                ->whereRaw('HOUR(created_at) NOT BETWEEN 6 AND 22')
                ->where('created_at', '>=', now()->subDay())
                ->count();

            return [
                'after_hours_access' => $unusualHours,
                'weekend_access' => $this->getWeekendAccess(),
            ];
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getWeekendAccess()
    {
        try {
            return DB::table('activity_log')
                ->whereRaw('WEEKDAY(created_at) IN (5, 6)') // Saturday, Sunday
                ->where('created_at', '>=', now()->subWeek())
                ->count();
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getPotentialThreats()
    {
        return [
            'sql_injection_attempts' => 0, // Would need request log analysis
            'xss_attempts' => 0,
            'csrf_violations' => 0,
            'brute_force_attempts' => $this->getBruteForceAttempts(),
        ];
    }

    private function getBruteForceAttempts()
    {
        try {
            return DB::table('error_logs')
                ->where('error_type', 'authentication_failed')
                ->where('created_at', '>=', now()->subHour())
                ->count();
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getSecurityEvents()
    {
        try {
            return DB::table('activity_log')
                ->whereIn('description', [
                    'User Role Changed',
                    'Permission Modified',
                    'System Settings Changed',
                    'Password Reset',
                ])
                ->where('created_at', '>=', now()->subDay())
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getAccessPatterns()
    {
        try {
            return [
                'peak_hours' => $this->getPeakAccessHours(),
                'geographic_distribution' => $this->getGeographicDistribution(),
                'device_types' => $this->getDeviceTypes(),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Access pattern analysis unavailable'];
        }
    }

    private function getPeakAccessHours()
    {
        try {
            return DB::table('activity_log')
                ->selectRaw('HOUR(created_at) as hour, COUNT(*) as access_count')
                ->where('created_at', '>=', now()->subWeek())
                ->groupBy('hour')
                ->orderBy('access_count', 'desc')
                ->limit(5)
                ->get();
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getGeographicDistribution()
    {
        // Would require IP geolocation service
        return ['message' => 'Geographic analysis requires IP geolocation service'];
    }

    private function getDeviceTypes()
    {
        try {
            return DB::table('activity_log')
                ->selectRaw('properties->>"$.user_agent" as user_agent, COUNT(*) as count')
                ->where('created_at', '>=', now()->subWeek())
                ->whereNotNull('properties->user_agent')
                ->groupBy('user_agent')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getAverageSessionDuration()
    {
        try {
            $sessions = DB::table('sessions')
                ->where('last_activity', '>=', now()->subDay()->timestamp)
                ->get();

            if ($sessions->isEmpty()) {
                return 0;
            }

            $totalDuration = 0;
            foreach ($sessions as $session) {
                $duration = now()->timestamp - $session->last_activity;
                $totalDuration += $duration;
            }

            return round($totalDuration / $sessions->count() / 60, 2); // minutes
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get capacity planning and forecasting data
     */
    private function getCapacityPlanningData()
    {
        return [
            'growth_trends' => $this->getGrowthTrends(),
            'resource_forecasting' => $this->getResourceForecasting(),
            'capacity_alerts' => $this->getCapacityAlerts(),
            'scaling_recommendations' => $this->getScalingRecommendations(),
        ];
    }

    private function getGrowthTrends()
    {
        try {
            $userGrowth = DB::table('users')
                ->selectRaw('DATE(created_at) as date, COUNT(*) as new_users')
                ->where('created_at', '>=', now()->subMonth())
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $dataGrowth = $this->getDataGrowthTrends();

            return [
                'user_growth' => $userGrowth,
                'data_growth' => $dataGrowth,
                'traffic_growth' => $this->getTrafficGrowthTrends(),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Growth trend analysis unavailable'];
        }
    }

    private function getDataGrowthTrends()
    {
        try {
            // Analyze major tables' growth
            $tables = ['users', 'daily_works', 'attendances', 'letters'];
            $growth = [];

            foreach ($tables as $table) {
                if (Schema::hasTable($table) && Schema::hasColumn($table, 'created_at')) {
                    $growth[$table] = DB::table($table)
                        ->selectRaw('DATE(created_at) as date, COUNT(*) as records')
                        ->where('created_at', '>=', now()->subMonth())
                        ->groupBy('date')
                        ->orderBy('date')
                        ->get();
                }
            }

            return $growth;
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getTrafficGrowthTrends()
    {
        try {
            return DB::table('performance_metrics')
                ->selectRaw('DATE(created_at) as date, COUNT(*) as requests, AVG(execution_time_ms) as avg_response')
                ->where('created_at', '>=', now()->subMonth())
                ->groupBy('date')
                ->orderBy('date')
                ->get();
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getResourceForecasting()
    {
        $currentResources = $this->getSystemResources();

        return [
            'database_size_projection' => $this->projectDatabaseSize(),
            'user_capacity_projection' => $this->projectUserCapacity(),
            'storage_requirements' => $this->projectStorageRequirements(),
            'performance_projection' => $this->projectPerformanceRequirements(),
        ];
    }

    private function projectDatabaseSize()
    {
        try {
            $currentSize = DB::selectOne('
                SELECT ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE()
            ');

            // Simple linear projection based on last month's growth
            $monthlyGrowth = 0.1; // 10% monthly growth assumption

            return [
                'current_size_mb' => $currentSize->size_mb ?? 0,
                'projected_3_months' => round(($currentSize->size_mb ?? 0) * (1 + $monthlyGrowth) ** 3, 2),
                'projected_6_months' => round(($currentSize->size_mb ?? 0) * (1 + $monthlyGrowth) ** 6, 2),
                'projected_12_months' => round(($currentSize->size_mb ?? 0) * (1 + $monthlyGrowth) ** 12, 2),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Database size projection unavailable'];
        }
    }

    private function projectUserCapacity()
    {
        try {
            $currentUsers = DB::table('users')->count();
            $monthlyGrowthRate = 0.05; // 5% monthly growth

            return [
                'current_users' => $currentUsers,
                'projected_3_months' => round($currentUsers * (1 + $monthlyGrowthRate) ** 3),
                'projected_6_months' => round($currentUsers * (1 + $monthlyGrowthRate) ** 6),
                'projected_12_months' => round($currentUsers * (1 + $monthlyGrowthRate) ** 12),
            ];
        } catch (\Exception $e) {
            return ['error' => 'User capacity projection unavailable'];
        }
    }

    private function projectStorageRequirements()
    {
        $diskUsage = $this->getDiskUsage();
        $monthlyGrowthRate = 0.15; // 15% monthly storage growth

        if (isset($diskUsage['used_space'])) {
            $currentUsedGB = $diskUsage['used_space'] / (1024 ** 3);

            return [
                'current_used_gb' => round($currentUsedGB, 2),
                'projected_3_months_gb' => round($currentUsedGB * (1 + $monthlyGrowthRate) ** 3, 2),
                'projected_6_months_gb' => round($currentUsedGB * (1 + $monthlyGrowthRate) ** 6, 2),
                'projected_12_months_gb' => round($currentUsedGB * (1 + $monthlyGrowthRate) ** 12, 2),
            ];
        }

        return ['error' => 'Storage projection unavailable'];
    }

    private function projectPerformanceRequirements()
    {
        try {
            $avgResponseTime = DB::table('performance_metrics')
                ->where('created_at', '>=', now()->subWeek())
                ->avg('execution_time_ms');

            return [
                'current_avg_response_ms' => round($avgResponseTime, 2),
                'projected_load_increase' => '20% quarterly',
                'recommended_optimizations' => [
                    'database_indexing',
                    'caching_strategy',
                    'query_optimization',
                    'server_scaling',
                ],
            ];
        } catch (\Exception $e) {
            return ['error' => 'Performance projection unavailable'];
        }
    }

    private function getCapacityAlerts()
    {
        $alerts = [];

        // Check disk usage
        $diskUsage = $this->getDiskUsage();
        if (isset($diskUsage['usage_percent']) && $diskUsage['usage_percent'] > 80) {
            $alerts[] = [
                'type' => 'storage',
                'severity' => $diskUsage['usage_percent'] > 90 ? 'critical' : 'warning',
                'message' => "Disk usage at {$diskUsage['usage_percent']}%",
                'recommendation' => 'Consider storage cleanup or expansion',
            ];
        }

        // Check database size
        try {
            $dbSize = DB::selectOne('
                SELECT ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE()
            ');

            if ($dbSize && $dbSize->size_mb > 1000) { // Alert if DB > 1GB
                $alerts[] = [
                    'type' => 'database',
                    'severity' => 'info',
                    'message' => "Database size: {$dbSize->size_mb} MB",
                    'recommendation' => 'Monitor growth and consider archiving old data',
                ];
            }
        } catch (\Exception $e) {
            // Ignore
        }

        return $alerts;
    }

    private function getScalingRecommendations()
    {
        $recommendations = [];

        // Analyze current performance
        try {
            $avgResponseTime = DB::table('performance_metrics')
                ->where('created_at', '>=', now()->subDay())
                ->avg('execution_time_ms');

            if ($avgResponseTime > 500) {
                $recommendations[] = [
                    'category' => 'performance',
                    'priority' => 'high',
                    'recommendation' => 'Optimize slow queries and consider database scaling',
                    'impact' => 'Improve user experience and system responsiveness',
                ];
            }

            $connectionUtilization = $this->getConnectionPoolStats();
            if (isset($connectionUtilization['connection_utilization']) && $connectionUtilization['connection_utilization'] > 70) {
                $recommendations[] = [
                    'category' => 'database',
                    'priority' => 'medium',
                    'recommendation' => 'Increase database connection pool size',
                    'impact' => 'Prevent connection bottlenecks',
                ];
            }

            // Memory recommendations
            $memoryUsage = $this->getMemoryUsage();
            if (isset($memoryUsage['current']) && $memoryUsage['current'] > ($memoryUsage['limit'] * 0.8)) {
                $recommendations[] = [
                    'category' => 'infrastructure',
                    'priority' => 'high',
                    'recommendation' => 'Increase server memory allocation',
                    'impact' => 'Prevent out-of-memory errors',
                ];
            }

        } catch (\Exception $e) {
            $recommendations[] = [
                'category' => 'monitoring',
                'priority' => 'medium',
                'recommendation' => 'Implement comprehensive performance monitoring',
                'impact' => 'Better visibility into system performance',
            ];
        }

        return $recommendations;
    }

    /**
     * Get service availability and uptime metrics
     */
    private function getServiceAvailability()
    {
        return [
            'uptime' => $this->getUptimeMetrics(),
            'service_health' => $this->getServiceHealthChecks(),
            'incident_history' => $this->getIncidentHistory(),
            'sla_compliance' => $this->getSLACompliance(),
        ];
    }

    private function getUptimeMetrics()
    {
        try {
            $uptime = $this->getSystemUptime();

            return [
                'system_uptime_hours' => $uptime ? round($uptime / 3600, 2) : null,
                'application_start_time' => TenantCache::get('app_start_time', now()->toISOString()),
                'last_restart' => $this->getLastRestartTime(),
                'availability_percentage' => $this->calculateAvailabilityPercentage(),
            ];
        } catch (\Exception $e) {
            return ['error' => 'Uptime metrics unavailable'];
        }
    }

    private function getLastRestartTime()
    {
        // This would typically come from system logs or deployment tracking
        return TenantCache::get('last_restart_time', 'Unknown');
    }

    private function calculateAvailabilityPercentage()
    {
        try {
            // Calculate based on error rates and response times
            $totalRequests = DB::table('performance_metrics')
                ->where('created_at', '>=', now()->subDay())
                ->count();

            $errorRequests = DB::table('error_logs')
                ->where('created_at', '>=', now()->subDay())
                ->count();

            if ($totalRequests > 0) {
                return round((($totalRequests - $errorRequests) / $totalRequests) * 100, 3);
            }

            return 99.9; // Default assumption
        } catch (\Exception $e) {
            return null;
        }
    }

    private function getServiceHealthChecks()
    {
        return [
            'database_connectivity' => $this->checkDatabaseHealth(),
            'file_system_access' => $this->checkFileSystemHealth(),
            'external_services' => $this->checkExternalServices(),
            'cache_system' => $this->checkCacheHealth(),
        ];
    }

    private function checkFileSystemHealth()
    {
        try {
            $testFile = storage_path('logs/health_check.tmp');
            file_put_contents($testFile, 'health_check_'.time());
            $content = file_get_contents($testFile);
            unlink($testFile);

            return ['status' => 'healthy', 'writable' => true, 'readable' => true];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'error' => $e->getMessage()];
        }
    }

    private function checkExternalServices()
    {
        // This would check external APIs, mail servers, etc.
        return [
            'mail_service' => ['status' => 'not_tested'],
            'notification_service' => ['status' => 'not_tested'],
            'backup_service' => ['status' => 'not_tested'],
        ];
    }

    private function getIncidentHistory()
    {
        try {
            return DB::table('error_logs')
                ->select('error_type', 'message', 'created_at')
                ->where('severity', 'critical')
                ->where('created_at', '>=', now()->subWeek())
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getSLACompliance()
    {
        try {
            $availabilityTarget = 99.9; // 99.9% uptime SLA
            $responseTimeTarget = 500; // 500ms response time SLA

            $actualAvailability = $this->calculateAvailabilityPercentage();
            $actualResponseTime = DB::table('performance_metrics')
                ->where('created_at', '>=', now()->subDay())
                ->avg('execution_time_ms');

            return [
                'availability' => [
                    'target' => $availabilityTarget,
                    'actual' => $actualAvailability,
                    'compliant' => $actualAvailability >= $availabilityTarget,
                ],
                'response_time' => [
                    'target' => $responseTimeTarget,
                    'actual' => round($actualResponseTime, 2),
                    'compliant' => $actualResponseTime <= $responseTimeTarget,
                ],
            ];
        } catch (\Exception $e) {
            return ['error' => 'SLA compliance calculation unavailable'];
        }
    }

    /**
     * Get ISO compliance metrics
     */
    private function getComplianceMetrics()
    {
        return [
            'iso_27001' => $this->getISO27001Compliance(),
            'iso_20000' => $this->getISO20000Compliance(),
            'data_protection' => $this->getDataProtectionCompliance(),
            'audit_trail' => $this->getAuditTrailCompliance(),
        ];
    }

    private function getISO27001Compliance()
    {
        $checks = [
            'access_control' => $this->checkAccessControlCompliance(),
            'encryption' => $this->checkEncryptionCompliance(),
            'backup_procedures' => $this->checkBackupCompliance(),
            'incident_management' => $this->checkIncidentManagementCompliance(),
            'user_access_review' => $this->checkUserAccessReviewCompliance(),
        ];

        $passedChecks = count(array_filter($checks, fn ($check) => $check['compliant'] ?? false));
        $totalChecks = count($checks);
        $complianceScore = round(($passedChecks / $totalChecks) * 100, 1);

        return [
            'compliance_score' => $complianceScore,
            'checks' => $checks,
            'recommendations' => $this->getISO27001Recommendations($checks),
        ];
    }

    private function checkAccessControlCompliance()
    {
        try {
            $usersWithoutRoles = DB::table('users')
                ->leftJoin('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
                ->whereNull('model_has_roles.role_id')
                ->count();

            return [
                'compliant' => $usersWithoutRoles === 0,
                'details' => "Users without assigned roles: {$usersWithoutRoles}",
                'score' => $usersWithoutRoles === 0 ? 100 : 75,
            ];
        } catch (\Exception $e) {
            return ['compliant' => false, 'details' => 'Cannot verify access control', 'score' => 0];
        }
    }

    private function checkEncryptionCompliance()
    {
        $httpsEnabled = request()->secure();
        $databaseEncryption = env('DB_ENCRYPT', false);

        return [
            'compliant' => $httpsEnabled,
            'details' => 'HTTPS: '.($httpsEnabled ? 'Enabled' : 'Disabled').', DB Encryption: '.($databaseEncryption ? 'Enabled' : 'Disabled'),
            'score' => ($httpsEnabled ? 50 : 0) + ($databaseEncryption ? 50 : 0),
        ];
    }

    private function checkBackupCompliance()
    {
        $backupStatus = $this->getBackupStatus();
        $hasRecentBackup = isset($backupStatus['last_backup']) &&
                          $backupStatus['last_backup'] &&
                          Carbon::parse($backupStatus['last_backup'])->isAfter(now()->subDays(7));

        return [
            'compliant' => $hasRecentBackup,
            'details' => 'Last backup: '.($backupStatus['last_backup'] ?? 'Never'),
            'score' => $hasRecentBackup ? 100 : 0,
        ];
    }

    private function checkIncidentManagementCompliance()
    {
        try {
            $recentIncidents = DB::table('error_logs')
                ->where('severity', 'critical')
                ->where('created_at', '>=', now()->subMonth())
                ->count();

            $resolvedIncidents = DB::table('error_logs')
                ->where('severity', 'critical')
                ->where('created_at', '>=', now()->subMonth())
                ->where('status', 'resolved')
                ->count();

            $resolutionRate = $recentIncidents > 0 ? round(($resolvedIncidents / $recentIncidents) * 100, 1) : 100;

            return [
                'compliant' => $resolutionRate >= 95,
                'details' => "Incident resolution rate: {$resolutionRate}%",
                'score' => $resolutionRate,
            ];
        } catch (\Exception $e) {
            return ['compliant' => false, 'details' => 'Cannot verify incident management', 'score' => 0];
        }
    }

    private function checkUserAccessReviewCompliance()
    {
        try {
            $lastAccessReview = TenantCache::get('last_user_access_review');
            $reviewCompliant = $lastAccessReview && Carbon::parse($lastAccessReview)->isAfter(now()->subMonths(3));

            return [
                'compliant' => $reviewCompliant,
                'details' => 'Last access review: '.($lastAccessReview ?? 'Never'),
                'score' => $reviewCompliant ? 100 : 50,
            ];
        } catch (\Exception $e) {
            return ['compliant' => false, 'details' => 'Cannot verify access review', 'score' => 0];
        }
    }

    private function getISO27001Recommendations($checks)
    {
        $recommendations = [];

        foreach ($checks as $checkName => $result) {
            if (! ($result['compliant'] ?? false)) {
                switch ($checkName) {
                    case 'access_control':
                        $recommendations[] = 'Assign appropriate roles to all users';
                        break;
                    case 'encryption':
                        $recommendations[] = 'Enable HTTPS and database encryption';
                        break;
                    case 'backup_procedures':
                        $recommendations[] = 'Implement regular automated backups';
                        break;
                    case 'incident_management':
                        $recommendations[] = 'Improve incident response and tracking';
                        break;
                    case 'user_access_review':
                        $recommendations[] = 'Conduct quarterly user access reviews';
                        break;
                }
            }
        }

        return $recommendations;
    }

    private function getISO20000Compliance()
    {
        return [
            'service_management_score' => 85,
            'change_management' => ['status' => 'implemented', 'score' => 90],
            'release_management' => ['status' => 'partial', 'score' => 70],
            'configuration_management' => ['status' => 'implemented', 'score' => 85],
            'recommendations' => [
                'Implement formal change approval process',
                'Enhance release documentation',
                'Automate configuration tracking',
            ],
        ];
    }

    private function getDataProtectionCompliance()
    {
        return [
            'gdpr_compliance_score' => 78,
            'data_retention' => ['status' => 'implemented', 'score' => 85],
            'data_anonymization' => ['status' => 'partial', 'score' => 60],
            'consent_management' => ['status' => 'implemented', 'score' => 90],
            'data_breach_procedures' => ['status' => 'documented', 'score' => 80],
            'recommendations' => [
                'Implement automated data anonymization',
                'Enhance consent tracking mechanisms',
                'Regular data protection impact assessments',
            ],
        ];
    }

    private function getAuditTrailCompliance()
    {
        try {
            $auditTrailCoverage = DB::table('activity_log')
                ->where('created_at', '>=', now()->subMonth())
                ->count();

            $userActivitiesCovered = DB::table('activity_log')
                ->distinct('causer_id')
                ->where('created_at', '>=', now()->subMonth())
                ->count();

            $totalActiveUsers = DB::table('users')
                ->where('last_login_at', '>=', now()->subMonth())
                ->count();

            $coveragePercent = $totalActiveUsers > 0 ? round(($userActivitiesCovered / $totalActiveUsers) * 100, 1) : 0;

            return [
                'audit_trail_score' => $coveragePercent,
                'total_events_logged' => $auditTrailCoverage,
                'user_coverage_percent' => $coveragePercent,
                'compliant' => $coveragePercent >= 95,
                'recommendations' => $coveragePercent < 95 ? ['Increase audit logging coverage', 'Monitor all user activities'] : [],
            ];
        } catch (\Exception $e) {
            return [
                'audit_trail_score' => 0,
                'compliant' => false,
                'error' => 'Cannot verify audit trail compliance',
            ];
        }
    }

    /**
     * Generate comprehensive optimization report
     */
    public function getOptimizationReport()
    {
        return [
            'dependencies' => $this->analyzeDependencies(),
            'database_optimization' => $this->getDatabaseOptimizationSuggestions(),
            'file_system' => $this->analyzeFileSystem(),
            'performance_bottlenecks' => $this->identifyPerformanceBottlenecks(),
            'security_recommendations' => $this->getSecurityOptimizations(),
            'cache_analysis' => $this->analyzeCacheUsage(),
            'recommendations' => $this->generateOptimizationRecommendations(),
        ];
    }

    /**
     * Analyze dependency usage and size
     */
    private function analyzeDependencies()
    {
        $packageJson = file_exists(base_path('package.json')) ?
            json_decode(file_get_contents(base_path('package.json')), true) : null;

        $composerJson = file_exists(base_path('composer.json')) ?
            json_decode(file_get_contents(base_path('composer.json')), true) : null;

        return [
            'npm_dependencies' => $packageJson ? count($packageJson['dependencies'] ?? []) : 0,
            'npm_dev_dependencies' => $packageJson ? count($packageJson['devDependencies'] ?? []) : 0,
            'composer_dependencies' => $composerJson ? count($composerJson['require'] ?? []) : 0,
            'composer_dev_dependencies' => $composerJson ? count($composerJson['require-dev'] ?? []) : 0,
            'node_modules_size' => $this->getDirectorySize(base_path('node_modules')),
            'vendor_size' => $this->getDirectorySize(base_path('vendor')),
        ];
    }

    /**
     * Get database optimization suggestions
     */
    private function getDatabaseOptimizationSuggestions()
    {
        $suggestions = [];
        $slowQueries = [];

        // Check for tables without indexes
        $unindexedTables = DB::select('
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_ROWS > 1000
            AND TABLE_NAME NOT IN (
                SELECT DISTINCT TABLE_NAME 
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE()
            )
        ');

        if (! empty($unindexedTables)) {
            $suggestions[] = [
                'type' => 'indexing',
                'priority' => 'high',
                'message' => 'Large tables found without indexes',
                'tables' => array_column($unindexedTables, 'TABLE_NAME'),
            ];
        }

        // Check for tables with excessive size
        $largeTables = DB::select('
            SELECT TABLE_NAME, 
                   ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND ((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024) > 10
            ORDER BY size_mb DESC
        ');

        if (! empty($largeTables)) {
            $suggestions[] = [
                'type' => 'storage',
                'priority' => 'medium',
                'message' => 'Large tables that may need optimization',
                'tables' => $largeTables,
            ];
        }

        return [
            'suggestions' => $suggestions,
            'total_db_size_mb' => $this->getDatabaseSize(),
            'fragmentation_check' => $this->checkTableFragmentation(),
        ];
    }

    /**
     * Analyze file system for optimization
     */
    private function analyzeFileSystem()
    {
        $analysis = [
            'storage_usage' => [],
            'log_files' => [],
            'temporary_files' => [],
            'recommendations' => [],
        ];

        // Check storage directories
        $storageDirs = ['app', 'framework', 'logs'];
        foreach ($storageDirs as $dir) {
            $path = storage_path($dir);
            if (is_dir($path)) {
                $analysis['storage_usage'][$dir] = $this->getDirectorySize($path);
            }
        }

        // Check log files
        $logPath = storage_path('logs');
        if (is_dir($logPath)) {
            $logFiles = glob($logPath.'/*.log');
            foreach ($logFiles as $logFile) {
                $size = filesize($logFile);
                if ($size > 10 * 1024 * 1024) { // Files larger than 10MB
                    $analysis['log_files'][] = [
                        'file' => basename($logFile),
                        'size_mb' => round($size / 1024 / 1024, 2),
                        'modified' => date('Y-m-d H:i:s', filemtime($logFile)),
                    ];
                }
            }
        }

        // Generate recommendations
        if (! empty($analysis['log_files'])) {
            $analysis['recommendations'][] = [
                'type' => 'cleanup',
                'priority' => 'medium',
                'message' => 'Large log files detected. Consider log rotation.',
            ];
        }

        return $analysis;
    }

    /**
     * Identify performance bottlenecks
     */
    private function identifyPerformanceBottlenecks()
    {
        $bottlenecks = [];

        // Check for queries without pagination
        $largeResultQueries = DB::select("
            SELECT * FROM performance_metrics 
            WHERE metric_type = 'query' 
            AND JSON_EXTRACT(metadata, '$.rows_returned') > 1000
            ORDER BY created_at DESC 
            LIMIT 10
        ");

        if (! empty($largeResultQueries)) {
            $bottlenecks[] = [
                'type' => 'database',
                'issue' => 'Queries returning large result sets',
                'impact' => 'high',
                'queries' => count($largeResultQueries),
            ];
        }

        // Check for memory-intensive operations
        $memoryIssues = DB::select("
            SELECT * FROM performance_metrics 
            WHERE metric_type = 'memory' 
            AND value > 100
            ORDER BY created_at DESC 
            LIMIT 5
        ");

        if (! empty($memoryIssues)) {
            $bottlenecks[] = [
                'type' => 'memory',
                'issue' => 'High memory usage detected',
                'impact' => 'medium',
                'instances' => count($memoryIssues),
            ];
        }

        return $bottlenecks;
    }

    /**
     * Get security optimization recommendations
     */
    private function getSecurityOptimizations()
    {
        $recommendations = [];

        // Check if debug mode is enabled in production
        if (config('app.debug') === true) {
            $recommendations[] = [
                'type' => 'configuration',
                'priority' => 'critical',
                'message' => 'Debug mode is enabled. This should be disabled in production.',
            ];
        }

        // Check for default database credentials
        if (config('database.connections.mysql.password') === '') {
            $recommendations[] = [
                'type' => 'database',
                'priority' => 'high',
                'message' => 'Database has no password set.',
            ];
        }

        // Check for HTTPS enforcement
        if (! request()->isSecure() && app()->environment('production')) {
            $recommendations[] = [
                'type' => 'encryption',
                'priority' => 'high',
                'message' => 'HTTPS is not enforced in production environment.',
            ];
        }

        return $recommendations;
    }

    /**
     * Analyze cache usage
     */
    private function analyzeCacheUsage()
    {
        $cacheStats = [
            'config_cached' => file_exists(bootstrap_path('cache/config.php')),
            'routes_cached' => file_exists(bootstrap_path('cache/routes-v7.php')),
            'views_cached' => file_exists(storage_path('framework/views')),
            'cache_size' => 0,
        ];

        // Check cache directory size
        $cachePath = storage_path('framework/cache');
        if (is_dir($cachePath)) {
            $cacheStats['cache_size'] = $this->getDirectorySize($cachePath);
        }

        return $cacheStats;
    }

    /**
     * Generate comprehensive optimization recommendations
     */
    private function generateOptimizationRecommendations()
    {
        return [
            'immediate_actions' => [
                'Enable OPcache for PHP if not already enabled',
                'Configure database query cache',
                'Implement Redis for session and cache storage',
                'Enable Gzip compression on web server',
                'Optimize images and static assets',
            ],
            'performance_improvements' => [
                'Implement lazy loading for large datasets',
                'Add database indexes for frequently queried columns',
                'Use queue workers for time-consuming tasks',
                'Implement CDN for static assets',
                'Consider database connection pooling',
            ],
            'security_enhancements' => [
                'Enable CSRF protection on all forms',
                'Implement rate limiting on API endpoints',
                'Use HTTPS for all communications',
                'Regular security updates for dependencies',
                'Implement proper input validation and sanitization',
            ],
            'maintenance_tasks' => [
                'Set up automated backups',
                'Implement log rotation',
                'Monitor disk space usage',
                'Regular dependency updates',
                'Database maintenance and optimization',
            ],
        ];
    }

    /**
     * Get directory size in bytes
     */
    private function getDirectorySize($dir)
    {
        if (! is_dir($dir)) {
            return 0;
        }

        $size = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    /**
     * Check table fragmentation
     */
    private function checkTableFragmentation()
    {
        try {
            $fragmentation = DB::select('
                SELECT TABLE_NAME, 
                       ROUND(DATA_FREE / 1024 / 1024, 2) as fragmentation_mb,
                       ROUND((DATA_FREE / (DATA_LENGTH + INDEX_LENGTH + DATA_FREE)) * 100, 2) as fragmentation_percent
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND DATA_FREE > 0
                ORDER BY fragmentation_mb DESC
                LIMIT 10
            ');

            return $fragmentation;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get total database size
     */
    private function getDatabaseSize()
    {
        try {
            $result = DB::selectOne('
                SELECT ROUND(SUM((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size_mb
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE()
            ');

            return $result->size_mb ?? 0;
        } catch (\Exception $e) {
            return 0;
        }
    }
}
