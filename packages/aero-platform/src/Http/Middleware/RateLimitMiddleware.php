<?php

namespace Aero\Platform\Http\Middleware;

use Aero\Platform\Services\RateLimitConfigService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Configurable Rate Limit Middleware
 * 
 * Applies rate limiting based on configurations from RateLimitConfigService
 */
class RateLimitMiddleware
{
    protected RateLimitConfigService $configService;

    public function __construct(RateLimitConfigService $configService)
    {
        $this->configService = $configService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $limitType = 'api'): Response
    {
        $tenantId = $this->getTenantId($request);
        $ip = $request->ip();

        // Check if IP is whitelisted (bypass rate limiting)
        if ($this->configService->isWhitelisted($tenantId, $ip)) {
            return $next($request);
        }

        // Check if IP is blacklisted (immediate block)
        if ($this->configService->isBlacklisted($tenantId, $ip)) {
            return $this->blockedResponse('IP address is blacklisted');
        }

        // Get rate limit configuration
        $config = $this->configService->getConfig($tenantId, $limitType);

        if (!$config['is_active']) {
            return $next($request);
        }

        // Generate rate limit key
        $key = $this->getRateLimitKey($tenantId, $ip, $limitType);

        // Get current request count
        $attempts = (int) Cache::get($key, 0);
        $maxRequests = $config['max_requests'];
        $timeWindow = $config['time_window_seconds'];

        // Check if rate limit exceeded
        if ($attempts >= $maxRequests) {
            Log::warning('Rate limit exceeded', [
                'tenant_id' => $tenantId,
                'ip' => $ip,
                'limit_type' => $limitType,
                'attempts' => $attempts,
                'max_requests' => $maxRequests,
            ]);

            return $this->rateLimitedResponse($maxRequests, $timeWindow, $config);
        }

        // Check if throttling should be applied (progressive throttling)
        if ($attempts >= ($maxRequests * 0.95)) {
            $this->applyThrottle($config['throttle_percentage']);
        }

        // Increment request count
        if ($attempts === 0) {
            Cache::put($key, 1, $timeWindow);
        } else {
            Cache::increment($key);
        }

        // Continue with request
        $response = $next($request);

        // Add rate limit headers
        return $this->addRateLimitHeaders($response, $maxRequests, $attempts + 1, $timeWindow);
    }

    /**
     * Get tenant ID from request
     */
    protected function getTenantId(Request $request): ?string
    {
        // Try to get tenant from request context
        if (function_exists('tenant')) {
            $tenant = tenant();
            return $tenant?->id;
        }

        // Fallback: check if tenant_id is in request
        return $request->input('tenant_id') ?? $request->header('X-Tenant-ID');
    }

    /**
     * Generate rate limit cache key
     */
    protected function getRateLimitKey(?string $tenantId, string $ip, string $limitType): string
    {
        $prefix = 'rate_limit';
        $identifier = $tenantId ?? $ip;
        
        return "{$prefix}:{$identifier}:{$limitType}";
    }

    /**
     * Apply progressive throttling
     */
    protected function applyThrottle(int $throttlePercentage): void
    {
        if ($throttlePercentage < 100) {
            $delayMs = (int) ((100 - $throttlePercentage) / 100 * 1000);
            usleep($delayMs * 1000); // Convert to microseconds
        }
    }

    /**
     * Return rate limited response
     */
    protected function rateLimitedResponse(int $maxRequests, int $timeWindow, array $config): Response
    {
        $retryAfter = $timeWindow;
        $blockDuration = $config['block_duration_seconds'] ?? $timeWindow;

        return response()->json([
            'message' => 'Too many requests. Please try again later.',
            'error' => 'rate_limit_exceeded',
            'max_requests' => $maxRequests,
            'time_window' => $timeWindow,
            'retry_after' => $retryAfter,
        ], 429)
        ->withHeaders([
            'X-RateLimit-Limit' => $maxRequests,
            'X-RateLimit-Remaining' => 0,
            'X-RateLimit-Reset' => now()->addSeconds($timeWindow)->timestamp,
            'Retry-After' => $retryAfter,
        ]);
    }

    /**
     * Return blocked response
     */
    protected function blockedResponse(string $reason): Response
    {
        return response()->json([
            'message' => 'Access blocked',
            'error' => 'ip_blocked',
            'reason' => $reason,
        ], 403);
    }

    /**
     * Add rate limit headers to response
     */
    protected function addRateLimitHeaders(Response $response, int $limit, int $used, int $window): Response
    {
        $remaining = max(0, $limit - $used);
        $resetAt = now()->addSeconds($window)->timestamp;

        return $response->withHeaders([
            'X-RateLimit-Limit' => $limit,
            'X-RateLimit-Remaining' => $remaining,
            'X-RateLimit-Reset' => $resetAt,
        ]);
    }
}
