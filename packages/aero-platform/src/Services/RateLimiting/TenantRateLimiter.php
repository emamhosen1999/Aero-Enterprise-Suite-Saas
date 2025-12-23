<?php

declare(strict_types=1);

namespace Aero\Platform\Services\RateLimiting;

use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Tenant;
use Illuminate\Cache\RateLimiter;
use Aero\Core\Support\TenantCache;
use Illuminate\Http\Request;

/**
 * Tenant Rate Limiter Service
 *
 * Provides per-tenant API rate limiting based on subscription plan.
 * Enforces different limits for different actions/endpoints.
 *
 * Rate Limit Tiers:
 * - Free: 100 requests/minute
 * - Starter: 500 requests/minute
 * - Professional: 2000 requests/minute
 * - Enterprise: 10000 requests/minute
 *
 * Usage:
 * ```php
 * $rateLimiter = app(TenantRateLimiter::class);
 * if (!$rateLimiter->attempt($tenant, 'api')) {
 *     return response()->json(['error' => 'Rate limit exceeded'], 429);
 * }
 * ```
 */
class TenantRateLimiter
{
    /**
     * Default rate limits per plan (requests per minute).
     */
    protected array $defaultLimits = [
        'free' => 100,
        'starter' => 500,
        'professional' => 2000,
        'enterprise' => 10000,
    ];

    /**
     * Endpoint-specific multipliers.
     * Some endpoints are more expensive than others.
     */
    protected array $endpointMultipliers = [
        'api' => 1.0,           // Standard API calls
        'export' => 10.0,       // Export operations are expensive
        'import' => 10.0,       // Import operations are expensive
        'report' => 5.0,        // Report generation
        'search' => 2.0,        // Search operations
        'upload' => 3.0,        // File uploads
        'webhook' => 0.5,       // Webhooks are lightweight
    ];

    /**
     * Cache key prefix for rate limiting.
     */
    protected string $cachePrefix = 'tenant_rate_limit:';

    /**
     * Check if the tenant can make a request for a given action.
     *
     * @param Tenant|string $tenant The tenant instance or ID
     * @param string $action The action type (api, export, import, etc.)
     * @return bool True if allowed, false if rate limited
     */
    public function attempt(Tenant|string $tenant, string $action = 'api'): bool
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $limit = $this->getLimit($tenant, $action);
        $key = $this->getCacheKey($tenantId, $action);

        $current = (int) TenantCache::get($key, 0);

        if ($current >= $limit) {
            return false;
        }

        TenantCache::put($key, $current + 1, now()->addMinute());

        return true;
    }

    /**
     * Check if rate limit is exceeded without incrementing.
     *
     * @param Tenant|string $tenant
     * @param string $action
     * @return bool True if would be rate limited
     */
    public function tooManyAttempts(Tenant|string $tenant, string $action = 'api'): bool
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $limit = $this->getLimit($tenant, $action);
        $key = $this->getCacheKey($tenantId, $action);

        return (int) TenantCache::get($key, 0) >= $limit;
    }

    /**
     * Get remaining attempts for the tenant.
     *
     * @param Tenant|string $tenant
     * @param string $action
     * @return int
     */
    public function remaining(Tenant|string $tenant, string $action = 'api'): int
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $limit = $this->getLimit($tenant, $action);
        $key = $this->getCacheKey($tenantId, $action);

        $current = (int) TenantCache::get($key, 0);

        return max(0, $limit - $current);
    }

    /**
     * Get the rate limit for a tenant and action.
     *
     * @param Tenant|string $tenant
     * @param string $action
     * @return int
     */
    public function getLimit(Tenant|string $tenant, string $action = 'api'): int
    {
        $baseLimit = $this->getPlanLimit($tenant);
        $multiplier = $this->endpointMultipliers[$action] ?? 1.0;

        // For expensive operations, reduce the limit
        if ($multiplier > 1.0) {
            return (int) floor($baseLimit / $multiplier);
        }

        // For lightweight operations, increase the limit
        return (int) floor($baseLimit * (1 / $multiplier));
    }

    /**
     * Get the base rate limit for a tenant's plan.
     *
     * @param Tenant|string $tenant
     * @return int
     */
    protected function getPlanLimit(Tenant|string $tenant): int
    {
        if (is_string($tenant)) {
            $tenant = Tenant::find($tenant);
        }

        if (! $tenant) {
            return $this->defaultLimits['free'];
        }

        // Get plan from tenant's active subscription
        $plan = $tenant->plan;

        if (! $plan) {
            return $this->defaultLimits['free'];
        }

        // Check if plan has custom rate limit
        $customLimit = $plan->metadata['rate_limit'] ?? null;
        if ($customLimit) {
            return (int) $customLimit;
        }

        // Fall back to default limits by plan code
        $planCode = strtolower($plan->code ?? 'free');

        return $this->defaultLimits[$planCode] ?? $this->defaultLimits['free'];
    }

    /**
     * Get cache key for rate limiting.
     *
     * @param string $tenantId
     * @param string $action
     * @return string
     */
    protected function getCacheKey(string $tenantId, string $action): string
    {
        $minute = now()->format('Y-m-d-H-i');
        return "{$this->cachePrefix}{$tenantId}:{$action}:{$minute}";
    }

    /**
     * Get rate limit headers for response.
     *
     * @param Tenant|string $tenant
     * @param string $action
     * @return array
     */
    public function getHeaders(Tenant|string $tenant, string $action = 'api'): array
    {
        $limit = $this->getLimit($tenant, $action);
        $remaining = $this->remaining($tenant, $action);
        $resetAt = now()->addMinute()->timestamp;

        return [
            'X-RateLimit-Limit' => $limit,
            'X-RateLimit-Remaining' => $remaining,
            'X-RateLimit-Reset' => $resetAt,
        ];
    }

    /**
     * Get retry-after seconds when rate limited.
     *
     * @return int
     */
    public function retryAfter(): int
    {
        return 60 - now()->second;
    }

    /**
     * Clear rate limit for a tenant.
     *
     * @param Tenant|string $tenant
     * @param string|null $action If null, clears all actions
     */
    public function clear(Tenant|string $tenant, ?string $action = null): void
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $minute = now()->format('Y-m-d-H-i');

        if ($action) {
            TenantCache::forget("{$this->cachePrefix}{$tenantId}:{$action}:{$minute}");
        } else {
            foreach (array_keys($this->endpointMultipliers) as $act) {
                TenantCache::forget("{$this->cachePrefix}{$tenantId}:{$act}:{$minute}");
            }
        }
    }

    /**
     * Set custom rate limits for a tenant (override plan limits).
     *
     * @param Tenant $tenant
     * @param array $limits ['api' => 5000, 'export' => 100]
     */
    public function setCustomLimits(Tenant $tenant, array $limits): void
    {
        $metadata = $tenant->metadata ?? [];
        $metadata['rate_limits'] = $limits;
        $tenant->update(['metadata' => $metadata]);
    }

    /**
     * Get usage statistics for a tenant.
     *
     * @param Tenant|string $tenant
     * @return array
     */
    public function getUsageStats(Tenant|string $tenant): array
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $minute = now()->format('Y-m-d-H-i');
        $stats = [];

        foreach (array_keys($this->endpointMultipliers) as $action) {
            $key = "{$this->cachePrefix}{$tenantId}:{$action}:{$minute}";
            $current = (int) TenantCache::get($key, 0);
            $limit = $this->getLimit($tenant, $action);

            $stats[$action] = [
                'used' => $current,
                'limit' => $limit,
                'remaining' => max(0, $limit - $current),
                'percentage' => $limit > 0 ? round(($current / $limit) * 100, 2) : 0,
            ];
        }

        return $stats;
    }
}
