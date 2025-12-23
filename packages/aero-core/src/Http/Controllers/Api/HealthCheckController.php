<?php

namespace Aero\Core\Http\Controllers\Api;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Support\TenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Throwable;

class HealthCheckController extends Controller
{
    /**
     * Basic health check endpoint.
     * Returns simple status for load balancers and uptime monitors.
     */
    public function index(): JsonResponse
    {
        $healthy = $this->checkDatabase() && $this->checkCache();

        return response()->json([
            'status' => $healthy ? 'healthy' : 'unhealthy',
            'timestamp' => now()->toIso8601String(),
        ], $healthy ? 200 : 503);
    }

    /**
     * Detailed health check endpoint.
     * Returns comprehensive status of all services.
     */
    public function detailed(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabaseDetailed(),
            'cache' => $this->checkCacheDetailed(),
            'storage' => $this->checkStorageDetailed(),
            'queue' => $this->checkQueueDetailed(),
            'redis' => $this->checkRedisDetailed(),
            'memory' => $this->checkMemory(),
            'disk' => $this->checkDisk(),
        ];

        // Determine overall health - only 'unhealthy' status is critical
        // 'skipped', 'warning', and 'healthy' are acceptable
        $hasUnhealthy = collect($checks)->contains(fn ($check) => $check['status'] === 'unhealthy');
        $allHealthy = collect($checks)->every(fn ($check) => in_array($check['status'], ['healthy', 'skipped']));

        $overallStatus = match (true) {
            $hasUnhealthy => 'unhealthy',
            $allHealthy => 'healthy',
            default => 'degraded',
        };

        return response()->json([
            'status' => $overallStatus,
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
            'environment' => config('app.env'),
            'checks' => $checks,
        ], $hasUnhealthy ? 503 : 200);
    }

    /**
     * Check basic database connectivity.
     */
    protected function checkDatabase(): bool
    {
        try {
            DB::connection()->getPdo();

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * Check detailed database status.
     */
    protected function checkDatabaseDetailed(): array
    {
        try {
            $start = microtime(true);
            $pdo = DB::connection()->getPdo();
            $latency = round((microtime(true) - $start) * 1000, 2);

            // Get connection info
            $driver = DB::connection()->getDriverName();
            $database = DB::connection()->getDatabaseName();

            // Check if we can execute a query
            $version = match ($driver) {
                'mysql' => DB::selectOne('SELECT VERSION() as version')?->version ?? 'unknown',
                'pgsql' => DB::selectOne('SELECT version()')?->version ?? 'unknown',
                'sqlite' => DB::selectOne('SELECT sqlite_version() as version')?->version ?? 'unknown',
                default => 'unknown',
            };

            return [
                'status' => 'healthy',
                'driver' => $driver,
                'database' => $database,
                'version' => $version,
                'latency_ms' => $latency,
            ];
        } catch (Throwable $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check basic cache connectivity.
     */
    protected function checkCache(): bool
    {
        try {
            $key = 'health_check_'.uniqid();
            TenantCache::put($key, 'test', 10);
            $value = TenantCache::get($key);
            TenantCache::forget($key);

            return $value === 'test';
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * Check detailed cache status.
     */
    protected function checkCacheDetailed(): array
    {
        try {
            $start = microtime(true);
            $key = 'health_check_'.uniqid();
            TenantCache::put($key, 'test', 10);
            $value = TenantCache::get($key);
            TenantCache::forget($key);
            $latency = round((microtime(true) - $start) * 1000, 2);

            if ($value !== 'test') {
                return [
                    'status' => 'unhealthy',
                    'error' => 'Cache read/write verification failed',
                ];
            }

            return [
                'status' => 'healthy',
                'driver' => config('cache.default'),
                'latency_ms' => $latency,
            ];
        } catch (Throwable $e) {
            return [
                'status' => 'unhealthy',
                'driver' => config('cache.default'),
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check storage status.
     */
    protected function checkStorageDetailed(): array
    {
        try {
            $disk = config('filesystems.default');
            $testFile = 'health_check_'.uniqid().'.txt';

            $start = microtime(true);
            Storage::put($testFile, 'health check');
            $exists = Storage::exists($testFile);
            Storage::delete($testFile);
            $latency = round((microtime(true) - $start) * 1000, 2);

            if (! $exists) {
                return [
                    'status' => 'unhealthy',
                    'disk' => $disk,
                    'error' => 'Storage write/read verification failed',
                ];
            }

            return [
                'status' => 'healthy',
                'disk' => $disk,
                'latency_ms' => $latency,
            ];
        } catch (Throwable $e) {
            return [
                'status' => 'unhealthy',
                'disk' => config('filesystems.default'),
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check queue status.
     */
    protected function checkQueueDetailed(): array
    {
        try {
            $connection = config('queue.default');
            $driver = config("queue.connections.{$connection}.driver");

            // For sync driver, just report healthy
            if ($driver === 'sync') {
                return [
                    'status' => 'healthy',
                    'driver' => $driver,
                    'connection' => $connection,
                    'message' => 'Sync driver - jobs run immediately',
                ];
            }

            // For database queue, check the jobs table
            if ($driver === 'database') {
                $table = config("queue.connections.{$connection}.table", 'jobs');

                // Check if jobs table exists
                if (! Schema::hasTable($table)) {
                    return [
                        'status' => 'warning',
                        'driver' => $driver,
                        'connection' => $connection,
                        'message' => "Jobs table '{$table}' does not exist",
                    ];
                }

                $pending = DB::table($table)->count();

                // Check failed_jobs table
                $failed = 0;
                if (Schema::hasTable('failed_jobs')) {
                    $failed = DB::table('failed_jobs')->count();
                }

                return [
                    'status' => 'healthy',
                    'driver' => $driver,
                    'connection' => $connection,
                    'pending_jobs' => $pending,
                    'failed_jobs' => $failed,
                ];
            }

            // For Redis queue
            if ($driver === 'redis') {
                $queueName = config("queue.connections.{$connection}.queue", 'default');

                return [
                    'status' => 'healthy',
                    'driver' => $driver,
                    'connection' => $connection,
                    'queue' => $queueName,
                ];
            }

            return [
                'status' => 'healthy',
                'driver' => $driver,
                'connection' => $connection,
            ];
        } catch (Throwable $e) {
            return [
                'status' => 'unhealthy',
                'driver' => config('queue.default'),
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Redis status.
     */
    protected function checkRedisDetailed(): array
    {
        // Check if Redis extension is available
        if (! extension_loaded('redis') && ! class_exists(\Redis::class)) {
            return [
                'status' => 'skipped',
                'message' => 'Redis extension not installed',
            ];
        }

        if (config('database.redis.client') === null) {
            return [
                'status' => 'skipped',
                'message' => 'Redis not configured',
            ];
        }

        try {
            $start = microtime(true);
            $pong = Redis::ping();
            $latency = round((microtime(true) - $start) * 1000, 2);

            // Get Redis info
            $info = Redis::info();

            return [
                'status' => 'healthy',
                'latency_ms' => $latency,
                'version' => $info['redis_version'] ?? 'unknown',
                'connected_clients' => $info['connected_clients'] ?? 0,
                'used_memory_human' => $info['used_memory_human'] ?? 'unknown',
            ];
        } catch (Throwable $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check memory usage.
     */
    protected function checkMemory(): array
    {
        $memoryUsage = memory_get_usage(true);
        $memoryPeak = memory_get_peak_usage(true);
        $memoryLimit = $this->parseMemoryLimit(ini_get('memory_limit'));

        $usagePercent = $memoryLimit > 0
            ? round(($memoryUsage / $memoryLimit) * 100, 2)
            : 0;

        return [
            'status' => $usagePercent < 90 ? 'healthy' : 'warning',
            'current' => $this->formatBytes($memoryUsage),
            'peak' => $this->formatBytes($memoryPeak),
            'limit' => $this->formatBytes($memoryLimit),
            'usage_percent' => $usagePercent,
        ];
    }

    /**
     * Check disk usage.
     */
    protected function checkDisk(): array
    {
        $storagePath = storage_path();
        $totalSpace = disk_total_space($storagePath);
        $freeSpace = disk_free_space($storagePath);
        $usedSpace = $totalSpace - $freeSpace;
        $usagePercent = round(($usedSpace / $totalSpace) * 100, 2);

        return [
            'status' => $usagePercent < 90 ? 'healthy' : ($usagePercent < 95 ? 'warning' : 'critical'),
            'total' => $this->formatBytes($totalSpace),
            'free' => $this->formatBytes($freeSpace),
            'used' => $this->formatBytes($usedSpace),
            'usage_percent' => $usagePercent,
        ];
    }

    /**
     * Parse memory limit string to bytes.
     */
    protected function parseMemoryLimit(string $limit): int
    {
        if ($limit === '-1') {
            return PHP_INT_MAX;
        }

        $unit = strtolower(substr($limit, -1));
        $value = (int) substr($limit, 0, -1);

        return match ($unit) {
            'g' => $value * 1024 * 1024 * 1024,
            'm' => $value * 1024 * 1024,
            'k' => $value * 1024,
            default => (int) $limit,
        };
    }

    /**
     * Format bytes to human-readable string.
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor((strlen((string) $bytes) - 1) / 3);

        return sprintf('%.2f %s', $bytes / pow(1024, $factor), $units[$factor] ?? 'B');
    }
}
