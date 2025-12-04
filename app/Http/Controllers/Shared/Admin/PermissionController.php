<?php

namespace App\Http\Controllers\Shared\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandlordUser;
use App\Services\Shared\Admin\RolePermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Permission;

/**
 * Shared Admin Permission Controller
 *
 * Context-aware permission management controller that works for both:
 * - Platform Admin (landlord guard) - manages platform-level permissions
 * - Tenant Admin (web guard) - manages tenant-level permissions
 *
 * Implements proper authorization checks using Spatie Permission
 */
class PermissionController extends Controller
{
    private RolePermissionService $rolePermissionService;

    public function __construct(RolePermissionService $rolePermissionService)
    {
        $this->rolePermissionService = $rolePermissionService;
        // Middleware is applied at route level to support both landlord and web guards
    }

    /**
     * Determine if current context is platform admin (landlord guard)
     */
    protected function isPlatformContext(): bool
    {
        // Check if authenticated via landlord guard
        if (Auth::guard('landlord')->check()) {
            return true;
        }

        // Check by request domain (admin subdomain = platform context)
        $host = request()->getHost();
        if (str_starts_with($host, 'admin.')) {
            return true;
        }

        // Check by route name (admin.* routes are platform context)
        $routeName = request()->route()?->getName() ?? '';
        if (str_starts_with($routeName, 'admin.')) {
            return true;
        }

        return false;
    }

    /**
     * Get the current authenticated user based on context
     */
    protected function getCurrentUser()
    {
        if ($this->isPlatformContext()) {
            return Auth::guard('landlord')->user();
        }

        return Auth::guard('web')->user();
    }

    /**
     * Check if user is a super administrator (context-aware)
     */
    protected function isSuperAdmin(): bool
    {
        $user = $this->getCurrentUser();

        if ($this->isPlatformContext()) {
            return $user instanceof LandlordUser && $user->isSuperAdmin();
        }

        return $user?->hasRole('Super Administrator') ?? false;
    }

    /**
     * Get the appropriate guard name based on context
     */
    protected function getGuardName(): string
    {
        return $this->isPlatformContext() ? 'landlord' : 'web';
    }

    /**
     * List all permissions
     */
    public function index(Request $request)
    {
        try {
            $user = $this->getCurrentUser();

            // Super admins have full access, others need permissions.view
            if (! $this->isSuperAdmin() && ! $user->can('permissions.view')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $guardName = $this->getGuardName();
            $query = Permission::query();

            // Filter by guard for context-appropriate permissions
            if ($request->has('guard')) {
                $query->where('guard_name', $request->input('guard'));
            }

            // Optional search filter
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where('name', 'like', "%{$search}%");
            }

            // Optional module filter
            if ($request->has('module')) {
                $module = $request->input('module');
                $query->where('name', 'like', "{$module}.%");
            }

            $permissions = $query->orderBy('name')->get();

            return response()->json([
                'permissions' => $permissions,
                'total' => $permissions->count(),
                'guard' => $guardName,
                'is_platform_context' => $this->isPlatformContext(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to list permissions: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to retrieve permissions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get permissions grouped by module
     */
    public function groupedByModule()
    {
        try {
            $user = $this->getCurrentUser();

            if (! $this->isSuperAdmin() && ! $user->can('permissions.view')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permissionsGrouped = $this->rolePermissionService->getPermissionsGroupedByModule();

            return response()->json([
                'permissionsGrouped' => $permissionsGrouped,
                'enterprise_modules' => $this->rolePermissionService->getEnterpriseModules(),
                'is_platform_context' => $this->isPlatformContext(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get grouped permissions: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to retrieve grouped permissions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a new permission
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:permissions,name',
            'guard_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $this->getCurrentUser();

            if (! $this->isSuperAdmin() && ! $user->can('permissions.create')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Determine context
            $isPlatform = $this->isPlatformContext();
            $routeName = request()->route()?->getName() ?? 'unknown';
            $host = request()->getHost();

            Log::info('Permission creation context check', [
                'isPlatformContext' => $isPlatform,
                'landlord_guard_check' => Auth::guard('landlord')->check(),
                'route_name' => $routeName,
                'host' => $host,
                'request_guard_name' => $request->guard_name,
            ]);

            // Use context-appropriate guard name and scope - DO NOT trust request input for guard
            $guardName = $this->getGuardName();
            $scope = $isPlatform ? 'platform' : 'tenant';

            $permission = Permission::create([
                'name' => $request->name,
                'guard_name' => $guardName,
                'scope' => $scope,
            ]);

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            Log::info('Permission created', [
                'permission_id' => $permission->id,
                'permission_name' => $permission->name,
                'guard_name' => $guardName,
                'scope' => $scope,
                'created_by' => $user->id ?? null,
                'context' => $this->isPlatformContext() ? 'platform' : 'tenant',
            ]);

            return response()->json([
                'message' => 'Permission created successfully',
                'permission' => $permission,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create permission: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to create permission',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show a specific permission
     */
    public function show($id)
    {
        try {
            $user = $this->getCurrentUser();

            if (! $this->isSuperAdmin() && ! $user->can('permissions.view')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::with('roles')->find($id);

            if (! $permission) {
                return response()->json(['error' => 'Permission not found'], 404);
            }

            return response()->json([
                'permission' => $permission,
                'roles' => $permission->roles->pluck('name'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to show permission: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to retrieve permission',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a permission
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:permissions,name,'.$id,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $this->getCurrentUser();

            if (! $this->isSuperAdmin() && ! $user->can('permissions.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::find($id);

            if (! $permission) {
                return response()->json(['error' => 'Permission not found'], 404);
            }

            $oldName = $permission->name;
            $permission->name = $request->name;
            $permission->save();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            Log::info('Permission updated', [
                'permission_id' => $permission->id,
                'old_name' => $oldName,
                'new_name' => $permission->name,
                'updated_by' => $user->id ?? null,
                'context' => $this->isPlatformContext() ? 'platform' : 'tenant',
            ]);

            return response()->json([
                'message' => 'Permission updated successfully',
                'permission' => $permission,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update permission: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to update permission',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a permission
     */
    public function destroy($id)
    {
        try {
            $user = $this->getCurrentUser();

            if (! $this->isSuperAdmin() && ! $user->can('permissions.delete')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::find($id);

            if (! $permission) {
                return response()->json(['error' => 'Permission not found'], 404);
            }

            // Check if permission is assigned to any roles
            $rolesCount = $permission->roles()->count();
            if ($rolesCount > 0) {
                return response()->json([
                    'error' => "Cannot delete permission. It is assigned to {$rolesCount} role(s).",
                ], 409);
            }

            $permissionName = $permission->name;
            $permission->delete();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            Log::warning('Permission deleted', [
                'permission_name' => $permissionName,
                'deleted_by' => $user->id ?? null,
                'context' => $this->isPlatformContext() ? 'platform' : 'tenant',
            ]);

            return response()->json([
                'message' => 'Permission deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete permission: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to delete permission',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync roles for a permission
     */
    public function syncRoles(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $this->getCurrentUser();

            if (! $this->isSuperAdmin() && ! $user->can('permissions.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::find($id);

            if (! $permission) {
                return response()->json(['error' => 'Permission not found'], 404);
            }

            // Sync roles using Spatie's method
            $permission->syncRoles($request->roles);

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            Log::info('Permission roles synced', [
                'permission_id' => $permission->id,
                'permission_name' => $permission->name,
                'roles' => $request->roles,
                'synced_by' => $user->id ?? null,
                'context' => $this->isPlatformContext() ? 'platform' : 'tenant',
            ]);

            return response()->json([
                'message' => 'Permission roles synced successfully',
                'permission' => $permission->fresh('roles'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync permission roles: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to sync permission roles',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
