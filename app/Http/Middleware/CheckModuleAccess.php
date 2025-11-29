<?php

namespace App\Http\Middleware;

use App\Services\Module\ModulePermissionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check Module Access Middleware
 *
 * Validates user access based on the Module Permission Registry.
 * Supports checking module, sub-module, and component level access.
 *
 * Usage:
 *   - module:hrm                           - Check module access
 *   - module:hrm,employees                 - Check sub-module access
 *   - module:hrm,employees,list            - Check component access
 *   - module:hrm,,dashboard                - Check module-level component (no sub-module)
 */
class CheckModuleAccess
{
    protected ModulePermissionService $modulePermissionService;

    public function __construct(ModulePermissionService $modulePermissionService)
    {
        $this->modulePermissionService = $modulePermissionService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $moduleCode  The module code (e.g., 'hrm')
     * @param  string|null  $subModuleCode  The sub-module code (optional, e.g., 'employees')
     * @param  string|null  $componentCode  The component code (optional, e.g., 'list')
     */
    public function handle(
        Request $request,
        Closure $next,
        string $moduleCode,
        ?string $subModuleCode = null,
        ?string $componentCode = null
    ): Response {
        if (! Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            return redirect()->route('login');
        }

        $user = Auth::user();
        $canAccess = false;
        $accessType = 'module';
        $accessPath = $moduleCode;

        // Determine the level of access to check
        if ($componentCode && $componentCode !== '') {
            // Check component access
            $accessType = 'component';
            $accessPath = $subModuleCode
                ? "{$moduleCode}/{$subModuleCode}/{$componentCode}"
                : "{$moduleCode}/{$componentCode}";

            $canAccess = $this->modulePermissionService->userCanAccessComponent(
                $moduleCode,
                $subModuleCode ?: null,
                $componentCode,
                $user
            );
        } elseif ($subModuleCode && $subModuleCode !== '') {
            // Check sub-module access
            $accessType = 'sub-module';
            $accessPath = "{$moduleCode}/{$subModuleCode}";

            $canAccess = $this->modulePermissionService->userCanAccessSubModule(
                $moduleCode,
                $subModuleCode,
                $user
            );
        } else {
            // Check module access
            $canAccess = $this->modulePermissionService->userCanAccessModule(
                $moduleCode,
                $user
            );
        }

        if (! $canAccess) {
            // Log unauthorized access attempt
            Log::warning('Module access denied', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'access_type' => $accessType,
                'access_path' => $accessPath,
                'route' => $request->route()?->getName(),
                'url' => $request->url(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => "You do not have permission to access this {$accessType}.",
                    'access_type' => $accessType,
                    'access_path' => $accessPath,
                ], 403);
            }

            // For Inertia requests, return a proper error response
            if ($request->header('X-Inertia')) {
                return response()->json([
                    'component' => 'Errors/Forbidden',
                    'props' => [
                        'message' => "You do not have permission to access this {$accessType}.",
                        'accessType' => $accessType,
                        'accessPath' => $accessPath,
                    ],
                    'url' => $request->url(),
                    'version' => '',
                ], 403, ['X-Inertia' => 'true']);
            }

            return back()->with('error', "You don't have permission to access this {$accessType}. Access path: {$accessPath}");
        }

        return $next($request);
    }
}
