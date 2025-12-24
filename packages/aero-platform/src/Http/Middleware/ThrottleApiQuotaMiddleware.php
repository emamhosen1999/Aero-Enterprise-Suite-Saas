<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Aero\Platform\Services\Quotas\QuotaEnforcementService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Progressive API Throttling Middleware
 *
 * Implements progressive speed reduction based on API quota usage:
 * - 95-98%: 75% speed (1 second delay)
 * - 99%: 50% speed (2 second delay)
 * - 100%: Hard block with 429 response
 *
 * Adds rate limit headers to all responses:
 * - X-RateLimit-Limit: Total API calls allowed
 * - X-RateLimit-Remaining: Remaining calls this period
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 */
class ThrottleApiQuotaMiddleware
{
    public function __construct(
        protected QuotaEnforcementService $quotaService
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $tenant = tenant();
        
        if (!$tenant) {
            return $next($request);
        }

        // Get current API usage for this month
        $current = $this->quotaService->getCurrentUsage($tenant, 'api_calls');
        $limit = $this->quotaService->getQuotaLimit($tenant, 'api_calls');

        // Unlimited API calls
        if ($limit === -1) {
            return $next($request);
        }

        $percentage = ($current / $limit) * 100;
        $remaining = max(0, $limit - $current - 1);

        // Hard block at 100% usage
        if ($percentage >= 100) {
            Log::warning("API quota exceeded for tenant {$tenant->id}");
            
            return response()->json([
                'error' => 'API quota exceeded',
                'message' => 'Your monthly API call limit has been reached. Please upgrade your plan or wait until the next billing cycle.',
                'current' => $current,
                'limit' => $limit,
                'reset_at' => $this->getResetTimestamp(),
            ], 429)->withHeaders([
                'X-RateLimit-Limit' => $limit,
                'X-RateLimit-Remaining' => 0,
                'X-RateLimit-Reset' => $this->getResetTimestamp(),
                'Retry-After' => $this->getRetryAfterSeconds(),
            ]);
        }

        // Progressive throttling
        if ($percentage >= 99) {
            // 50% speed reduction - 2 second delay
            sleep(2);
            Log::info("API throttled (50%) for tenant {$tenant->id} at {$percentage}% usage");
        } elseif ($percentage >= 95) {
            // 75% speed reduction - 1 second delay
            sleep(1);
            Log::info("API throttled (75%) for tenant {$tenant->id} at {$percentage}% usage");
        }

        // Increment API usage counter
        $this->quotaService->recordUsage($tenant, 'api_calls', 'increment');

        // Process request
        $response = $next($request);

        // Add rate limit headers
        return $response->withHeaders([
            'X-RateLimit-Limit' => $limit,
            'X-RateLimit-Remaining' => $remaining,
            'X-RateLimit-Reset' => $this->getResetTimestamp(),
        ]);
    }

    /**
     * Get the Unix timestamp when the rate limit resets (end of current month).
     */
    protected function getResetTimestamp(): int
    {
        return now()->endOfMonth()->timestamp;
    }

    /**
     * Get seconds until rate limit resets.
     */
    protected function getRetryAfterSeconds(): int
    {
        return now()->diffInSeconds(now()->endOfMonth());
    }
}
