<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Module Access Middleware
 *
 * Checks if authenticated user has access to the requested module/component.
 * Uses route parameters to determine module hierarchy.
 *
 * Usage in routes:
 * Route::get('/users', [UserController::class, 'index'])
 *     ->middleware('module.access:user_management,users,user_list');
 */
class ModuleAccessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  string|null  $moduleCode  Module code (required)
     * @param  string|null  $subModuleCode  SubModule code (optional)
     * @param  string|null  $componentCode  Component code (optional)
     */
    public function handle(Request $request, Closure $next, ?string $moduleCode = null, ?string $subModuleCode = null, ?string $componentCode = null): Response
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        $user = $request->user();
        $service = app(\Aero\Core\Services\ModuleAccessService::class);

        // Check module access
        if ($moduleCode) {
            $access = $service->canAccessModule($user, $moduleCode);
            if (! $access['allowed']) {
                abort(403, $access['reason']);
            }
        }

        // Check sub-module access
        if ($moduleCode && $subModuleCode) {
            $access = $service->canAccessSubModule($user, $moduleCode, $subModuleCode);
            if (! $access['allowed']) {
                abort(403, $access['reason']);
            }
        }

        // Check component access
        if ($moduleCode && $subModuleCode && $componentCode) {
            $access = $service->canAccessComponent($user, $moduleCode, $subModuleCode, $componentCode);
            if (! $access['allowed']) {
                abort(403, $access['reason']);
            }
        }

        return $next($request);
    }
}
