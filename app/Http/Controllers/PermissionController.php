<?php

namespace App\Http\Controllers;

use App\Services\Role\RolePermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Permission;

/**
 * Permission Controller
 *
 * Handles CRUD operations for permissions via API
 * Implements proper authorization checks using Spatie Permission
 */
class PermissionController extends Controller
{
    private RolePermissionService $rolePermissionService;

    public function __construct(RolePermissionService $rolePermissionService)
    {
        $this->rolePermissionService = $rolePermissionService;
        $this->middleware('auth');
    }

    /**
     * List all permissions
     */
    public function index(Request $request)
    {
        try {
            if (! Auth::user()->can('permissions.view')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $query = Permission::query();

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
            if (! Auth::user()->can('permissions.view')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permissionsGrouped = $this->rolePermissionService->getPermissionsGroupedByModule();

            return response()->json([
                'permissionsGrouped' => $permissionsGrouped,
                'enterprise_modules' => $this->rolePermissionService->getEnterpriseModules(),
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
            if (! Auth::user()->can('permissions.create')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::create([
                'name' => $request->name,
                'guard_name' => $request->guard_name ?? 'web',
            ]);

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            Log::info('Permission created', [
                'permission_id' => $permission->id,
                'permission_name' => $permission->name,
                'created_by' => Auth::id(),
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
            if (! Auth::user()->can('permissions.view')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::with('roles')->findById($id);

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
            if (! Auth::user()->can('permissions.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::findById($id);

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
                'updated_by' => Auth::id(),
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
            if (! Auth::user()->can('permissions.delete')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::findById($id);

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
                'deleted_by' => Auth::id(),
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
            if (! Auth::user()->can('permissions.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $permission = Permission::findById($id);

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
                'synced_by' => Auth::id(),
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
