<?php

declare(strict_types=1);

namespace Aero\Core\Http\Middleware;

use Aero\Core\Services\Auth\IPWhitelistService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check IP Whitelist Middleware
 *
 * Enforces IP-based access control for tenant routes.
 * Should be applied to protected routes that require IP validation.
 *
 * Usage in routes:
 * ```php
 * Route::middleware(['auth', CheckIPWhitelist::class])->group(...);
 * ```
 */
class CheckIPWhitelist
{
    public function __construct(
        protected IPWhitelistService $ipService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $ip = $request->ip();

        if (! $this->ipService->isIpAllowed($ip, $user)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Access Denied',
                    'message' => 'Your IP address is not authorized to access this resource.',
                    'ip' => $ip,
                ], 403);
            }

            abort(403, 'Access denied from your IP address.');
        }

        return $next($request);
    }
}
