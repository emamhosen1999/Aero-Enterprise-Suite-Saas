<?php

namespace App\Http\Controllers;

use App\Services\Role\RolePermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Role Debug Controller
 *
 * Helps diagnose live server role/permission issues
 */
class RoleDebugController extends Controller
{
    private RolePermissionService $rolePermissionService;

    public function __construct(RolePermissionService $rolePermissionService)
    {
        $this->rolePermissionService = $rolePermissionService;
    }

    /**
     * Debug endpoint to check role and permission data
     */
    public function debug()
    {
        $debug = [
            'timestamp' => now()->toISOString(),
            'environment' => app()->environment(),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
        ];

        try {
            // Check database connection
            $debug['database'] = [
                'connection' => config('database.default'),
                'connected' => DB::connection()->getPdo() ? true : false,
            ];

            // Check tables exist
            $debug['tables'] = [
                'roles_exists' => DB::getSchemaBuilder()->hasTable('roles'),
                'permissions_exists' => DB::getSchemaBuilder()->hasTable('permissions'),
                'role_has_permissions_exists' => DB::getSchemaBuilder()->hasTable('role_has_permissions'),
                'model_has_roles_exists' => DB::getSchemaBuilder()->hasTable('model_has_roles'),
                'model_has_permissions_exists' => DB::getSchemaBuilder()->hasTable('model_has_permissions'),
            ];

            // Check counts
            $debug['counts'] = [
                'total_roles' => Role::count(),
                'total_permissions' => Permission::count(),
                'role_permission_relationships' => DB::table('role_has_permissions')->count(),
                'users_with_roles' => DB::table('model_has_roles')->count(),
            ];

            // Check specific role data
            $roles = Role::with('permissions')->get();
            $debug['roles_sample'] = $roles->take(3)->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions_count' => $role->permissions->count(),
                    'first_few_permissions' => $role->permissions->take(3)->pluck('name')->toArray(),
                ];
            });

            // Check raw role_has_permissions data
            $roleHasPermissions = DB::table('role_has_permissions')->take(10)->get();
            $debug['role_has_permissions_sample'] = $roleHasPermissions->map(function ($rp) {
                return [
                    'role_id' => $rp->role_id,
                    'permission_id' => $rp->permission_id,
                ];
            });

            // Check permissions data structure
            $debug['permissions_grouped'] = $this->rolePermissionService->getPermissionsGroupedByModule();
            $debug['permissions_grouped_count'] = count($debug['permissions_grouped']);

            // Check cache
            $debug['cache'] = [
                'driver' => config('cache.default'),
                'permission_cache_key' => config('permission.cache.key', 'spatie.permission.cache'),
                'permission_cache_exists' => Cache::has(config('permission.cache.key', 'spatie.permission.cache')),
            ];

            // Check snapshot hash
            $debug['snapshot_hash'] = $this->rolePermissionService->snapshotHash();

            // Simulate what the frontend receives
            $debug['frontend_data_simulation'] = [
                'roles' => Role::with('permissions')->take(2)->get(),
                'permissions' => Permission::take(5)->get(),
                'role_has_permissions' => DB::table('role_has_permissions')->take(10)->get(),
                'permissionsGrouped' => array_slice($debug['permissions_grouped'], 0, 2, true),
            ];

        } catch (\Exception $e) {
            $debug['error'] = [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ];
        }

        return response()->json($debug, 200, [], JSON_PRETTY_PRINT);
    }

    /**
     * Test endpoint to refresh permissions cache
     */
    public function refreshCache()
    {
        try {
            $this->rolePermissionService->resetCache();

            return response()->json([
                'success' => true,
                'message' => 'Permission cache cleared successfully',
                'timestamp' => now()->toISOString(),
                'new_snapshot_hash' => $this->rolePermissionService->snapshotHash(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString(),
            ], 500);
        }
    }

    /**
     * Test specific role permissions
     */
    public function testRole(Request $request)
    {
        $roleId = $request->get('role_id', 1);

        try {
            $role = Role::with('permissions')->findOrFail($roleId);

            $debug = [
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'guard_name' => $role->guard_name,
                    'created_at' => $role->created_at,
                    'updated_at' => $role->updated_at,
                ],
                'permissions_via_eloquent' => $role->permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'guard_name' => $permission->guard_name,
                    ];
                }),
                'permissions_via_query' => DB::table('role_has_permissions')
                    ->join('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
                    ->where('role_has_permissions.role_id', $roleId)
                    ->select('permissions.id', 'permissions.name', 'permissions.guard_name')
                    ->get(),
                'raw_role_has_permissions' => DB::table('role_has_permissions')
                    ->where('role_id', $roleId)
                    ->get(),
            ];

            return response()->json($debug, 200, [], JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'role_id' => $roleId,
            ], 404);
        }
    }

    /**
     * Test permission assignment
     */
    public function testPermissionAssignment(Request $request)
    {
        $roleId = $request->get('role_id', 1);
        $permissionName = $request->get('permission', 'core.dashboard.view');

        try {
            $role = Role::findOrFail($roleId);
            $permission = Permission::where('name', $permissionName)->firstOrFail();

            $beforeState = [
                'has_permission_via_eloquent' => $role->hasPermissionTo($permission),
                'has_permission_via_can' => $role->hasPermissionTo($permissionName),
                'role_permissions_count' => $role->permissions()->count(),
                'raw_relationship_exists' => DB::table('role_has_permissions')
                    ->where('role_id', $roleId)
                    ->where('permission_id', $permission->id)
                    ->exists(),
            ];

            // Toggle permission
            if ($role->hasPermissionTo($permission)) {
                $role->revokePermissionTo($permission);
                $action = 'revoked';
            } else {
                $role->givePermissionTo($permission);
                $action = 'granted';
            }

            $afterState = [
                'has_permission_via_eloquent' => $role->fresh()->hasPermissionTo($permission),
                'has_permission_via_can' => $role->fresh()->hasPermissionTo($permissionName),
                'role_permissions_count' => $role->fresh()->permissions()->count(),
                'raw_relationship_exists' => DB::table('role_has_permissions')
                    ->where('role_id', $roleId)
                    ->where('permission_id', $permission->id)
                    ->exists(),
            ];

            return response()->json([
                'role_id' => $roleId,
                'permission' => $permissionName,
                'action' => $action,
                'before' => $beforeState,
                'after' => $afterState,
                'timestamp' => now()->toISOString(),
            ], 200, [], JSON_PRETTY_PRINT);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'role_id' => $roleId,
                'permission' => $permissionName,
            ], 500);
        }
    }
}
