<?php

declare(strict_types=1);

namespace Aero\HRMAC\Http\Middleware;

use Aero\HRMAC\Contracts\RoleModuleAccessInterface;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check Role Module Access Middleware
 *
 * Enforces role-based module/sub-module access using the role_module_access table.
 * This is different from permission-based access - it checks what modules/sub-modules
 * are assigned to the user's role(s).
 *
 * Usage in routes:
 *   - role.access:core,dashboard       - Check sub-module access (module code, submodule code)
 *   - role.access:hrm                  - Check module-level access
 *   - role.access:hrm,employees        - Check sub-module access within HRM
 */
class CheckRoleModuleAccess
{
    public function __construct(
        protected RoleModuleAccessInterface $roleModuleAccessService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  string  $moduleCode  The module code (e.g., 'core', 'hrm')
     * @param  string|null  $subModuleCode  The sub-module code (optional, e.g., 'dashboard', 'employees')
     */
    public function handle(
        Request $request,
        Closure $next,
        string $moduleCode,
        ?string $subModuleCode = null
    ): Response {
        // Try to get user from request first (supports multiple guards)
        // This ensures we get the authenticated user regardless of which guard was used
        $user = $request->user() ?? Auth::user();

        if (! $user) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            // Check if we're on admin domain to use appropriate login route
            return redirect()->to($this->getLoginUrl($request));
        }

        // Super admin bypasses all checks
        if ($this->isSuperAdmin($user)) {
            return $next($request);
        }

        // Check access based on level
        $hasAccess = $subModuleCode
            ? $this->roleModuleAccessService->userCanAccessSubModule($user, $moduleCode, $subModuleCode)
            : $this->roleModuleAccessService->userCanAccessModule($user, $moduleCode);

        if (! $hasAccess) {
            Log::warning('Role module access denied', [
                'user_id' => $user->id,
                'module' => $moduleCode,
                'sub_module' => $subModuleCode,
                'user_roles' => $user->roles->pluck('name')->toArray(),
            ]);

            return $this->denyAccess($request, $moduleCode, $subModuleCode);
        }

        return $next($request);
    }

    /**
     * Check if user is a super admin.
     */
    protected function isSuperAdmin($user): bool
    {
        $superAdminRoles = config('hrmac.super_admin_roles', [
            'Super Administrator',
            'super-admin',
            'tenant_super_administrator',
        ]);

        // Check for hasAnyRole first (supports array of roles)
        if (method_exists($user, 'hasAnyRole')) {
            return $user->hasAnyRole($superAdminRoles);
        }

        // Fallback to hasRole with individual checks
        if (method_exists($user, 'hasRole')) {
            foreach ($superAdminRoles as $role) {
                if ($user->hasRole($role)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Deny access with appropriate response.
     */
    protected function denyAccess(Request $request, string $moduleCode, ?string $subModuleCode): Response
    {
        $message = $subModuleCode
            ? "You don't have access to the {$subModuleCode} section."
            : "You don't have access to the {$moduleCode} module.";

        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $message,
                'reason' => 'module_access_denied',
            ], 403);
        }

        // Inertia response
        if ($request->header('X-Inertia')) {
            return response()->json([
                'component' => 'Errors/UnifiedError',
                'props' => [
                    'error' => [
                        'code' => 403,
                        'type' => 'AccessDenied',
                        'title' => 'Access Denied',
                        'message' => $message,
                        'trace_id' => \Illuminate\Support\Str::uuid()->toString(),
                        'showHomeButton' => true,
                        'showRetryButton' => false,
                        'timestamp' => now()->toISOString(),
                    ],
                ],
                'url' => $request->url(),
                'version' => '',
            ], 403, ['X-Inertia' => 'true']);
        }

        // Try to redirect to an accessible route
        $redirectRoute = $this->roleModuleAccessService->getFirstAccessibleRoute($request->user());
        if ($redirectRoute) {
            return redirect()->route($redirectRoute)->with('warning', $message);
        }

        return redirect()->to($this->getLoginUrl($request))->with('error', $message);
    }

    /**
     * Get the appropriate login URL based on domain context.
     */
    protected function getLoginUrl(Request $request): string
    {
        // Check if we're on admin domain
        $host = $request->getHost();
        $adminDomain = config('tenancy.admin_domain', 'admin.'.config('tenancy.platform_domain'));

        if ($host === $adminDomain || str_starts_with($host, 'admin.')) {
            return url('/login'); // Admin domain login
        }

        // Try named route for regular login
        if (\Illuminate\Support\Facades\Route::has('login')) {
            return route('login');
        }

        return url('/login');
    }
}
