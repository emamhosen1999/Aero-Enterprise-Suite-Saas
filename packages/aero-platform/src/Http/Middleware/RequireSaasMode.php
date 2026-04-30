<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Require SaaS Mode Middleware
 *
 * Blocks access to SaaS-only features (like tenant management) when
 * the platform is running in standalone mode.
 *
 * Usage in routes:
 * Route::middleware(['require-saas-mode'])->group(function () { ... });
 */
class RequireSaasMode
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Use the standard aero.mode config from aero-core
        $mode = config('aero.mode', 'standalone');

        if ($mode !== 'saas') {
            // For API requests, return JSON 404
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'This feature is not available in standalone mode.',
                    'error' => 'standalone_mode',
                ], 404);
            }

            // For web requests, abort with 404
            abort(404, 'This feature is not available in standalone mode.');
        }

        return $next($request);
    }
}
