<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Aero\Platform\Services\RateLimiting\TenantRateLimiter;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tenant Rate Limit Middleware
 *
 * Enforces per-tenant rate limits based on subscription plan.
 * Should be applied to API routes and resource-intensive endpoints.
 *
 * Usage in routes:
 * ```php
 * Route::middleware(['tenant', TenantRateLimit::class])->group(...);
 * Route::middleware(['tenant', TenantRateLimit::class.':export'])->group(...);
 * ```
 */
class TenantRateLimit
{
    public function __construct(
        protected TenantRateLimiter $rateLimiter
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @param string $action The action type (api, export, import, etc.)
     * @return Response
     */
    public function handle(Request $request, Closure $next, string $action = 'api'): Response
    {
        $tenant = tenant();

        if (! $tenant) {
            // No tenant context - skip rate limiting
            return $next($request);
        }

        // Check if rate limited
        if (! $this->rateLimiter->attempt($tenant, $action)) {
            return $this->buildRateLimitResponse($tenant, $action);
        }

        // Add rate limit headers to response
        $response = $next($request);

        return $this->addRateLimitHeaders($response, $tenant, $action);
    }

    /**
     * Build rate limit exceeded response.
     *
     * @param mixed $tenant
     * @param string $action
     * @return Response
     */
    protected function buildRateLimitResponse(mixed $tenant, string $action): Response
    {
        $retryAfter = $this->rateLimiter->retryAfter();
        $headers = $this->rateLimiter->getHeaders($tenant, $action);
        $headers['Retry-After'] = $retryAfter;

        return response()->json([
            'error' => 'Too Many Requests',
            'message' => 'Rate limit exceeded. Please wait before making more requests.',
            'retry_after' => $retryAfter,
            'limit' => $headers['X-RateLimit-Limit'],
        ], 429, $headers);
    }

    /**
     * Add rate limit headers to response.
     *
     * @param Response $response
     * @param mixed $tenant
     * @param string $action
     * @return Response
     */
    protected function addRateLimitHeaders(Response $response, mixed $tenant, string $action): Response
    {
        $headers = $this->rateLimiter->getHeaders($tenant, $action);

        foreach ($headers as $key => $value) {
            $response->headers->set($key, (string) $value);
        }

        return $response;
    }
}
