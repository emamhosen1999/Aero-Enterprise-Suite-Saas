<?php

namespace App\Http\Middleware;

use App\Services\Role\RolePermissionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Role Permission Sync Middleware
 *
 * Ensures role-permission data is always available and synced for admin interfaces
 */
class EnsureRolePermissionSync
{
    private RolePermissionService $rolePermissionService;

    public function __construct(RolePermissionService $rolePermissionService)
    {
        $this->rolePermissionService = $rolePermissionService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Only apply to role management routes
        if (! $this->isRoleManagementRoute($request)) {
            return $next($request);
        }

        try {
            // Get current user for logging
            $user = Auth::user();

            // Validate data integrity and attempt repair if needed
            $validationReport = $this->rolePermissionService->validateAndRepairDataIntegrity();

            if (! $validationReport['validation_passed']) {
                Log::warning('Role permission data integrity issues detected', [
                    'user_id' => $user->id,
                    'route' => $request->route()->getName(),
                    'issues' => $validationReport['issues_found'],
                    'repairs' => $validationReport['repairs_made'],
                ]);
            }

            // Ensure fresh data is available for the request
            $this->ensureFreshData();

        } catch (\Exception $e) {
            Log::error('Role permission sync middleware failed', [
                'error' => $e->getMessage(),
                'route' => $request->route()->getName(),
                'user_id' => Auth::id(),
            ]);

            // Don't block the request, but log the issue
        }

        return $next($request);
    }

    /**
     * Check if this is a role management route
     */
    private function isRoleManagementRoute(Request $request): bool
    {
        $route = $request->route();
        if (! $route) {
            return false;
        }

        $routeName = $route->getName();
        $routeUri = $route->uri();

        return str_contains($routeName, 'roles') ||
               str_contains($routeUri, 'roles') ||
               str_contains($routeName, 'admin.roles');
    }

    /**
     * Ensure fresh data is available
     */
    private function ensureFreshData(): void
    {
        try {
            // Clear stale cache if data seems corrupted
            $frontendData = $this->rolePermissionService->getRolesWithPermissionsForFrontend();

            $roleCount = count($frontendData['roles'] ?? []);
            $permissionCount = count($frontendData['permissions'] ?? []);
            $relationshipCount = count($frontendData['role_has_permissions'] ?? []);

            // If we have roles and permissions but no relationships, clear cache and retry
            if ($roleCount > 0 && $permissionCount > 0 && $relationshipCount === 0) {
                Log::warning('Detected missing role-permission relationships, clearing cache');
                $this->rolePermissionService->resetCache();

                // Force fresh data retrieval
                $this->rolePermissionService->getRolesWithPermissionsForFrontend();
            }

        } catch (\Exception $e) {
            Log::error('Failed to ensure fresh role permission data', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
