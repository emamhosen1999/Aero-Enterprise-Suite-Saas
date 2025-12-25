<?php

namespace Aero\Platform\Services;

use Aero\Platform\Models\RateLimitConfig;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Rate Limit Configuration Service
 * 
 * Manages rate limit configurations for tenants and global settings
 */
class RateLimitConfigService
{
    protected string $cachePrefix = 'rate_limit_config:';
    protected int $cacheTtl = 3600; // 1 hour

    /**
     * Get rate limit configuration for a tenant
     *
     * @param string|null $tenantId
     * @param string $limitType
     * @return array
     */
    public function getConfig(?string $tenantId, string $limitType = 'api'): array
    {
        $cacheKey = $this->cachePrefix . ($tenantId ?? 'global') . ':' . $limitType;

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($tenantId, $limitType) {
            // Try tenant-specific config first
            if ($tenantId) {
                $config = RateLimitConfig::where('tenant_id', $tenantId)
                    ->where('limit_type', $limitType)
                    ->where('is_active', true)
                    ->first();

                if ($config) {
                    return $this->formatConfig($config);
                }
            }

            // Fall back to global config
            $config = RateLimitConfig::whereNull('tenant_id')
                ->where('limit_type', $limitType)
                ->where('is_active', true)
                ->first();

            return $config ? $this->formatConfig($config) : $this->getDefaultConfig($limitType);
        });
    }

    /**
     * Create or update rate limit configuration
     *
     * @param array $data
     * @return RateLimitConfig
     */
    public function createOrUpdate(array $data): RateLimitConfig
    {
        $config = RateLimitConfig::updateOrCreate(
            [
                'tenant_id' => $data['tenant_id'] ?? null,
                'limit_type' => $data['limit_type'],
            ],
            [
                'max_requests' => $data['max_requests'],
                'time_window_seconds' => $data['time_window_seconds'],
                'burst_limit' => $data['burst_limit'] ?? null,
                'throttle_percentage' => $data['throttle_percentage'] ?? 100,
                'block_duration_seconds' => $data['block_duration_seconds'] ?? 3600,
                'whitelist_ips' => $data['whitelist_ips'] ?? [],
                'blacklist_ips' => $data['blacklist_ips'] ?? [],
                'is_active' => $data['is_active'] ?? true,
            ]
        );

        // Clear cache
        $this->clearCache($data['tenant_id'] ?? null, $data['limit_type']);

        return $config;
    }

    /**
     * Delete rate limit configuration
     *
     * @param string $configId
     * @return bool
     */
    public function delete(string $configId): bool
    {
        $config = RateLimitConfig::findOrFail($configId);
        $this->clearCache($config->tenant_id, $config->limit_type);
        
        return $config->delete();
    }

    /**
     * Get all configurations for a tenant
     *
     * @param string|null $tenantId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTenantConfigs(?string $tenantId)
    {
        return RateLimitConfig::where('tenant_id', $tenantId)
            ->orWhereNull('tenant_id')
            ->orderBy('limit_type')
            ->get();
    }

    /**
     * Check if IP is whitelisted
     *
     * @param string|null $tenantId
     * @param string $ip
     * @return bool
     */
    public function isWhitelisted(?string $tenantId, string $ip): bool
    {
        $configs = RateLimitConfig::where('tenant_id', $tenantId)
            ->orWhereNull('tenant_id')
            ->where('is_active', true)
            ->get();

        foreach ($configs as $config) {
            if (in_array($ip, $config->whitelist_ips ?? [])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if IP is blacklisted
     *
     * @param string|null $tenantId
     * @param string $ip
     * @return bool
     */
    public function isBlacklisted(?string $tenantId, string $ip): bool
    {
        $configs = RateLimitConfig::where('tenant_id', $tenantId)
            ->orWhereNull('tenant_id')
            ->where('is_active', true)
            ->get();

        foreach ($configs as $config) {
            if (in_array($ip, $config->blacklist_ips ?? [])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get rate limit statistics
     *
     * @param string|null $tenantId
     * @return array
     */
    public function getStats(?string $tenantId): array
    {
        // Get from cache or calculate
        $cacheKey = $this->cachePrefix . 'stats:' . ($tenantId ?? 'global');

        return Cache::remember($cacheKey, 300, function () use ($tenantId) {
            // TODO: Implement statistics calculation from logs
            return [
                'total_requests' => 0,
                'blocked_requests' => 0,
                'throttled_requests' => 0,
                'peak_requests_per_minute' => 0,
            ];
        });
    }

    /**
     * Format configuration for output
     *
     * @param RateLimitConfig $config
     * @return array
     */
    protected function formatConfig(RateLimitConfig $config): array
    {
        return [
            'id' => $config->id,
            'limit_type' => $config->limit_type,
            'max_requests' => $config->max_requests,
            'time_window_seconds' => $config->time_window_seconds,
            'burst_limit' => $config->burst_limit,
            'throttle_percentage' => $config->throttle_percentage,
            'block_duration_seconds' => $config->block_duration_seconds,
            'whitelist_ips' => $config->whitelist_ips ?? [],
            'blacklist_ips' => $config->blacklist_ips ?? [],
            'is_active' => $config->is_active,
        ];
    }

    /**
     * Get default configuration
     *
     * @param string $limitType
     * @return array
     */
    protected function getDefaultConfig(string $limitType): array
    {
        return match ($limitType) {
            'api' => [
                'max_requests' => 1000,
                'time_window_seconds' => 3600,
                'burst_limit' => 100,
                'throttle_percentage' => 100,
                'block_duration_seconds' => 3600,
                'whitelist_ips' => [],
                'blacklist_ips' => [],
                'is_active' => true,
            ],
            'web' => [
                'max_requests' => 300,
                'time_window_seconds' => 60,
                'burst_limit' => 50,
                'throttle_percentage' => 100,
                'block_duration_seconds' => 300,
                'whitelist_ips' => [],
                'blacklist_ips' => [],
                'is_active' => true,
            ],
            'webhook' => [
                'max_requests' => 100,
                'time_window_seconds' => 60,
                'burst_limit' => 10,
                'throttle_percentage' => 100,
                'block_duration_seconds' => 600,
                'whitelist_ips' => [],
                'blacklist_ips' => [],
                'is_active' => true,
            ],
            default => [
                'max_requests' => 60,
                'time_window_seconds' => 60,
                'burst_limit' => 10,
                'throttle_percentage' => 100,
                'block_duration_seconds' => 300,
                'whitelist_ips' => [],
                'blacklist_ips' => [],
                'is_active' => true,
            ],
        };
    }

    /**
     * Clear configuration cache
     *
     * @param string|null $tenantId
     * @param string|null $limitType
     * @return void
     */
    protected function clearCache(?string $tenantId, ?string $limitType = null): void
    {
        $pattern = $this->cachePrefix . ($tenantId ?? 'global');
        
        if ($limitType) {
            Cache::forget($pattern . ':' . $limitType);
        } else {
            Cache::forget($pattern . ':api');
            Cache::forget($pattern . ':web');
            Cache::forget($pattern . ':webhook');
        }

        Cache::forget($this->cachePrefix . 'stats:' . ($tenantId ?? 'global'));
    }
}
