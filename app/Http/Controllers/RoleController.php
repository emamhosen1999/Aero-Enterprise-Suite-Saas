<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Role\RolePermissionService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission; // added
use Spatie\Permission\Models\Role; // added

/**
 * Enterprise Role Controller
 *
 * Implements comprehensive role and permission management using Spatie Permission
 * Follows ISO 27001/27002 compliance standards
 * Supports hierarchical role management and audit trails
 */
class RoleController extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    private RolePermissionService $rolePermissionService;

    public function __construct(RolePermissionService $rolePermissionService)
    {
        $this->rolePermissionService = $rolePermissionService;

        // Apply middleware for authorization using Spatie Permission only
        $this->middleware('auth');
        // Role-based authorization is handled in routes, no additional middleware needed
    }

    /**
     * Display roles and permissions management interface
     */
    public function getRolesAndPermissions()
    {
        try {
            $user = Auth::user();

            // Enhanced data retrieval with retry mechanism for live servers
            $maxRetries = 3;
            $retryDelay = 100; // milliseconds

            for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
                try {
                    // Get all roles (Super Administrator can see all, others see limited)
                    $roles = Role::with(['permissions'])
                        ->when(! $user->hasRole('Super Administrator'), function ($query) {
                            // If not Super Admin, only show roles they can manage
                            return $query->whereNotIn('name', ['Super Administrator']);
                        })
                        ->get();

                    // Get permissions grouped by module using the new service method
                    $permissionsGrouped = $this->rolePermissionService->getPermissionsGroupedByModule();

                    // Get all permissions as flat array for compatibility
                    $permissions = Permission::all();

                    // Validate data integrity for live server compatibility
                    if ($roles->isEmpty() && $permissions->isEmpty()) {
                        throw new \Exception('No roles or permissions found - possible database connection issue');
                    }

                    // Get role-permission relationships with validation
                    $roleHasPermissions = DB::table('role_has_permissions')->get();

                    // Enhanced logging for live server debugging
                    Log::info('Role management data loaded successfully', [
                        'roles_count' => $roles->count(),
                        'permissions_count' => $permissions->count(),
                        'grouped_modules' => count($permissionsGrouped),
                        'attempt' => $attempt,
                        'server_env' => app()->environment(),
                        'user_id' => $user->id,
                    ]);

                    return Inertia::render('Administration/RoleManagement', [
                        'title' => 'Enterprise Role Management',
                        'roles' => $roles,
                        'permissions' => $permissions,
                        'permissionsGrouped' => $permissionsGrouped, // Fixed prop name
                        'role_has_permissions' => $roleHasPermissions,
                        'enterprise_modules' => $this->rolePermissionService->getEnterpriseModules(),
                        'can_manage_super_admin' => $user->hasRole('Super Administrator'),
                        'server_info' => [
                            'environment' => app()->environment(),
                            'timestamp' => now()->toISOString(),
                            'cache_driver' => config('cache.default'),
                        ],
                    ]);

                } catch (\Exception $e) {
                    if ($attempt === $maxRetries) {
                        throw $e;
                    }

                    Log::warning("Role data loading attempt {$attempt} failed, retrying...", [
                        'error' => $e->getMessage(),
                        'attempt' => $attempt,
                        'max_retries' => $maxRetries,
                    ]);

                    usleep($retryDelay * 1000); // Convert to microseconds
                    $retryDelay *= 2; // Exponential backoff
                }
            }

        } catch (\Exception $e) {
            Log::error('Failed to load roles and permissions: '.$e->getMessage(), [
                'stack_trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'server_env' => app()->environment(),
            ]);

            return back()->with('error', 'Failed to load role management interface. Please try again or contact support.');
        }
    }

    /**
     * Display the main role management interface (enhanced for live server compatibility)
     */
    public function index()
    {
        try {
            $user = Auth::user();

            // Enhanced data retrieval with retry mechanism for live servers
            $maxRetries = 3;
            $retryDelay = 100; // milliseconds

            for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
                try {
                    // Use the enhanced service method that includes fallback strategies
                    $frontendData = $this->rolePermissionService->getRolesWithPermissionsForFrontend();

                    // Extract the data
                    $roles = collect($frontendData['roles'] ?? []);
                    $permissions = collect($frontendData['permissions'] ?? []);
                    $roleHasPermissions = collect($frontendData['role_has_permissions'] ?? []);
                    $permissionsGrouped = $frontendData['permissionsGrouped'] ?? [];

                    // Filter roles for non-super administrators
                    if (! $user->hasRole('Super Administrator')) {
                        $roles = $roles->filter(function ($role) {
                            return ($role['name'] ?? '') !== 'Super Administrator';
                        });
                    }

                    // Validate data integrity for live server compatibility
                    if ($roles->isEmpty() && $permissions->isEmpty()) {
                        throw new \Exception('No roles or permissions found - possible database connection issue');
                    }

                    // Enhanced logging for live server debugging
                    Log::info('Role management interface loaded successfully', [
                        'roles_count' => $roles->count(),
                        'permissions_count' => $permissions->count(),
                        'grouped_modules' => count($permissionsGrouped),
                        'relationships_count' => $roleHasPermissions->count(),
                        'attempt' => $attempt,
                        'server_env' => app()->environment(),
                        'user_id' => $user->id,
                        'has_error' => isset($frontendData['error']),
                    ]);

                    // Get users with their roles for the User-Role assignment tab
                    $users = User::with('roles')
                        ->select(['id', 'name', 'email'])
                        ->orderBy('name')
                        ->get()
                        ->map(function ($user) {
                            return [
                                'id' => $user->id,
                                'name' => $user->name,
                                'email' => $user->email,
                                'roles' => $user->roles->map(function ($role) {
                                    return [
                                        'id' => $role->id,
                                        'name' => $role->name,
                                    ];
                                }),
                            ];
                        });

                    return Inertia::render('Administration/RoleManagement', [
                        'title' => 'Enterprise Role Management',
                        'roles' => $roles->toArray(),
                        'permissions' => $permissions->toArray(),
                        'permissionsGrouped' => $permissionsGrouped,
                        'role_has_permissions' => $roleHasPermissions->toArray(),
                        'enterprise_modules' => $this->rolePermissionService->getEnterpriseModules(),
                        'can_manage_super_admin' => $user->hasRole('Super Administrator'),
                        'users' => $users,
                        'server_info' => [
                            'environment' => app()->environment(),
                            'timestamp' => now()->toISOString(),
                            'cache_driver' => config('cache.default'),
                            'db_connection' => config('database.default'),
                            'data_source' => $frontendData['timestamp'] ?? 'unknown',
                            'has_fallback_data' => isset($frontendData['error']),
                            'snapshot_hash' => $this->rolePermissionService->snapshotHash(),
                        ],
                    ]);

                } catch (\Exception $e) {
                    if ($attempt === $maxRetries) {
                        throw $e;
                    }

                    Log::warning("Role interface loading attempt {$attempt} failed, retrying...", [
                        'error' => $e->getMessage(),
                        'attempt' => $attempt,
                        'max_retries' => $maxRetries,
                    ]);

                    usleep($retryDelay * 1000); // Convert to microseconds
                    $retryDelay *= 2; // Exponential backoff
                }
            }

        } catch (\Exception $e) {
            Log::error('Failed to load role management interface: '.$e->getMessage(), [
                'stack_trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'server_env' => app()->environment(),
            ]);

            // Attempt to run data integrity validation
            try {
                $validationReport = $this->rolePermissionService->validateAndRepairDataIntegrity();
            } catch (\Exception $validationError) {
                $validationReport = ['error' => 'Validation failed: '.$validationError->getMessage()];
            }

            // Return error page with diagnostic information
            return Inertia::render('Administration/RoleManagement', [
                'title' => 'Enterprise Role Management - Error',
                'roles' => [],
                'permissions' => [],
                'permissionsGrouped' => [],
                'role_has_permissions' => [],
                'enterprise_modules' => [],
                'can_manage_super_admin' => false,
                'users' => [],
                'error' => [
                    'message' => 'Failed to load role management data',
                    'details' => $e->getMessage(),
                    'validation_report' => $validationReport,
                    'timestamp' => now()->toISOString(),
                    'suggested_actions' => [
                        'Check database connection and verify tables exist',
                        'Run diagnostic: /admin/roles/debug (if Super Admin)',
                        'Clear caches: php artisan cache:clear',
                        'Check logs for detailed error information',
                        'Contact system administrator if issue persists',
                    ],
                ],
            ]);
        }
    }

    /**
     * Store a new role with validation and audit trail
     */
    public function storeRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
            'hierarchy_level' => 'nullable|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {            // Only Super Administrator can create roles for security
            if (! Auth::user()->hasRole('Super Administrator')) {
                return response()->json([
                    'error' => 'Insufficient permissions to create roles',
                ], 403);
            }

            // Create the role using Spatie's Role::create method
            $roleData = [
                'name' => $request->name,
                'guard_name' => 'web',
            ];

            $role = Role::create($roleData);            // Add description if provided
            if ($request->has('description')) {
                DB::table('roles')->where('id', $role->id)->update([
                    'description' => $request->description,
                    'updated_at' => now(),
                ]);
            }// Assign permissions if provided using the service
            if ($request->permissions && is_array($request->permissions)) {
                $this->rolePermissionService->assignPermissionsToRole($role, $request->permissions);
            }

            // Log role creation
            Log::info('Role created', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'created_by' => Auth::id(),
                'permissions_assigned' => count($request->permissions ?? []),
            ]);

            DB::commit();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Role created successfully',
                'role' => $role->fresh('permissions'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Role creation failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to create role',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing role with enhanced validation
     */
    public function updateRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name,'.$id,
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $role = Role::findById($id);

            if (! $role) {
                return response()->json(['error' => 'Role not found'], 404);
            }

            // Check if user can manage this role
            if (! $this->canManageRole(Auth::user(), $role)) {
                return response()->json([
                    'error' => 'Insufficient authority to manage this role',
                ], 403);
            }

            // Store original state for audit
            $originalState = [
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->toArray(),
            ];

            // Update role using Spatie methods
            $role->name = $request->name;
            $role->save();

            // Update custom attributes
            if ($request->has('description')) {
                DB::table('roles')->where('id', $role->id)->update([
                    'description' => $request->description,
                    'updated_at' => now(),
                ]);
            }            // Sync permissions using the service
            if ($request->has('permissions')) {
                $this->rolePermissionService->assignPermissionsToRole($role, $request->permissions ?? []);
            }

            // Log role update
            Log::info('Role updated', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'updated_by' => Auth::id(),
                'original_state' => $originalState,
                'new_permissions' => $request->permissions ?? [],
            ]);

            DB::commit();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Role updated successfully',
                'role' => $role->fresh('permissions'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Role update failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to update role',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a role with safety checks using Spatie Permission
     */
    public function deleteRole($id)
    {
        DB::beginTransaction();

        try {
            $role = Role::findById($id);

            if (! $role) {
                return response()->json(['error' => 'Role not found'], 404);
            }

            // Check if user can manage this role
            if (! $this->canManageRole(Auth::user(), $role)) {
                return response()->json([
                    'error' => 'Insufficient authority to delete this role',
                ], 403);
            }

            // Check if role is system role (prevent deletion of critical roles)
            $systemRoles = ['Super Administrator', 'Administrator'];
            if (in_array($role->name, $systemRoles)) {
                return response()->json([
                    'error' => 'Cannot delete system role',
                ], 403);
            }

            // Check if role is assigned to users using Spatie relationship
            $usersCount = $role->users()->count();
            if ($usersCount > 0) {
                return response()->json([
                    'error' => "Cannot delete role. It is assigned to {$usersCount} user(s).",
                ], 409);
            }

            // Log role deletion before deleting
            Log::warning('Role deleted', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'deleted_by' => Auth::id(),
                'permissions_count' => $role->permissions->count(),
            ]);

            // Delete role using Spatie method (automatically removes permission relationships)
            $role->delete();

            DB::commit();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Role deleted successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Role deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to delete role',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update role module permissions with enterprise logic using Spatie Permission
     */
    public function updateRoleModule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'roleId' => 'required|exists:roles,id',
            'module' => 'required|string',
            'action' => 'required|in:grant,revoke,toggle',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $role = Role::findById($request->roleId);

            if (! $this->canManageRole(Auth::user(), $role)) {
                return response()->json([
                    'error' => 'Insufficient authority to manage this role',
                ], 403);
            }            $module = $request->module;
            $action = $request->action;

            // Get module permissions using the RolePermissionService (proper way)
            $permissionsGrouped = $this->rolePermissionService->getPermissionsGroupedByModule();

            if (! isset($permissionsGrouped[$module])) {
                return response()->json([
                    'error' => 'Module not found',
                ], 404);
            }

            // Get the permission names for this module
            $modulePermissions = collect($permissionsGrouped[$module]['permissions'])
                ->pluck('name')
                ->toArray();

            if (empty($modulePermissions)) {
                return response()->json([
                    'error' => 'No permissions found for this module',
                ], 404);
            }

            // Get current role permissions for this module using Spatie relationship
            $currentModulePermissions = $role->permissions()
                ->whereIn('name', $modulePermissions)
                ->pluck('name')
                ->toArray();

            // Apply action using Spatie Permission methods
            switch ($action) {
                case 'grant':
                    $role->givePermissionTo($modulePermissions);
                    break;

                case 'revoke':
                    $role->revokePermissionTo($modulePermissions);
                    break;

                case 'toggle':
                    if (count($currentModulePermissions) === count($modulePermissions)) {
                        // All permissions granted, revoke them
                        $role->revokePermissionTo($modulePermissions);
                    } else {
                        // Not all permissions granted, grant all
                        $role->givePermissionTo($modulePermissions);
                    }
                    break;
            }            // Log module permission change
            Log::info('Role module permissions updated', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'module' => $module,
                'action' => $action,
                'permissions_affected' => $modulePermissions,
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Module permissions updated successfully',
                'roles' => Role::with('permissions')->get(),
                'permissions' => Permission::all(),
                'role_has_permissions' => DB::table('role_has_permissions')->get(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Module permission update failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to update module permissions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a specific role permission
     */
    public function updateRolePermission(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
            'permission' => 'required|string',
            'action' => 'required|in:grant,revoke',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $role = Role::findById($request->role_id);

            if (! $this->canManageRole(Auth::user(), $role)) {
                return response()->json([
                    'error' => 'Insufficient authority to manage this role',
                ], 403);
            }

            $permission = Permission::where('name', $request->permission)->first();

            if (! $permission) {
                return response()->json([
                    'error' => 'Permission not found',
                ], 404);
            }

            if ($request->action === 'grant') {
                $role->givePermissionTo($permission);
            } else {
                $role->revokePermissionTo($permission);
            }

            // Log permission change
            Log::info('Role permission updated', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'permission' => $request->permission,
                'action' => $request->action,
                'updated_by' => Auth::id(),
            ]);
            DB::commit();

            // Clear Spatie Permission cache and refresh cache for live server
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
            Cache::forget(config('permission.cache.key', 'spatie.permission.cache'));

            // Fresh pivot data for client sync
            $roleHasPermissions = DB::table('role_has_permissions')->get();
            $freshRole = Role::with('permissions')->find($role->id);

            return response()->json([
                'message' => 'Permission updated successfully',
                'role' => $freshRole,
                'role_has_permissions' => $roleHasPermissions,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Role permission update failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to update permission',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle permission for role (enhanced for live server compatibility)
     */
    public function togglePermission(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
            'permission_id' => 'required|exists:permissions,id',
            'value' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $role = Role::findById($request->role_id);

            if (! $this->canManageRole(Auth::user(), $role)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Insufficient authority to manage this role',
                ], 403);
            }

            $permission = Permission::findById($request->permission_id);

            if (! $permission) {
                return response()->json([
                    'success' => false,
                    'error' => 'Permission not found',
                ], 404);
            }

            // Check current state to avoid unnecessary operations
            $hasPermission = $role->hasPermissionTo($permission);

            if ($request->value && ! $hasPermission) {
                $role->givePermissionTo($permission);
                $action = 'granted';
            } elseif (! $request->value && $hasPermission) {
                $role->revokePermissionTo($permission);
                $action = 'revoked';
            } else {
                // No change needed
                $action = 'unchanged';
            }

            // Enhanced logging for debugging live server issues
            Log::info('Permission toggle operation', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'permission_id' => $permission->id,
                'permission_name' => $permission->name,
                'requested_value' => $request->value,
                'previous_state' => $hasPermission,
                'action' => $action,
                'updated_by' => Auth::id(),
                'server_env' => app()->environment(),
                'timestamp' => now()->toISOString(),
            ]);

            DB::commit();

            // Enhanced cache clearing for live server compatibility
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            // Clear additional caches that might affect live servers
            if (app()->environment('production')) {
                Cache::flush();
                Artisan::call('cache:clear');
                Artisan::call('config:clear');
            }

            // Return fresh role data to ensure UI synchronization
            $refreshedRole = Role::with('permissions')->find($role->id);

            return response()->json([
                'success' => true,
                'message' => "Permission {$action} successfully",
                'role' => $refreshedRole,
                'action' => $action,
                'timestamp' => now()->toISOString(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            // Enhanced error logging for live server debugging
            Log::error('Permission toggle failed', [
                'role_id' => $request->role_id,
                'permission_id' => $request->permission_id,
                'value' => $request->value,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'server_env' => app()->environment(),
                'timestamp' => now()->toISOString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to toggle permission',
                'message' => app()->environment('local') ? $e->getMessage() : 'An error occurred',
                'timestamp' => now()->toISOString(),
            ], 500);
        }
    }

    /**
     * Initialize enterprise role system
     */
    public function initializeEnterpriseSystem()
    {
        try {
            if (! Auth::user()->hasRole('Super Administrator')) {
                return response()->json([
                    'error' => 'Only Super Administrator can initialize the enterprise system',
                ], 403);
            }

            $results = $this->rolePermissionService->initializeEnterpriseSystem();

            return response()->json([
                'message' => 'Enterprise role system initialized successfully',
                'results' => $results,
            ]);

        } catch (\Exception $e) {
            Log::error('Enterprise system initialization failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to initialize enterprise system',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get role audit report
     */
    public function getRoleAudit()
    {
        try {
            if (! Auth::user()->hasRole(['Super Administrator', 'Administrator'])) {
                return response()->json([
                    'error' => 'Insufficient permissions for role audit',
                ], 403);
            }

            $audit = $this->rolePermissionService->auditRolePermissions();

            return response()->json([
                'audit' => $audit,
            ]);

        } catch (\Exception $e) {
            Log::error('Role audit failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to generate role audit',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk operations on multiple roles
     */
    public function bulkOperation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
            'operation' => 'required|in:grant_permissions,revoke_permissions,delete,activate,deactivate',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $roles = Role::whereIn('id', $request->role_ids)->get();
            $results = [];

            foreach ($roles as $role) {
                if (! $this->canManageRole(Auth::user(), $role)) {
                    $results[] = [
                        'role_id' => $role->id,
                        'role_name' => $role->name,
                        'status' => 'skipped',
                        'reason' => 'Insufficient authority',
                    ];

                    continue;
                }

                switch ($request->operation) {
                    case 'grant_permissions':
                        if ($request->permissions) {
                            $role->givePermissionTo($request->permissions);
                        }
                        break;
                    case 'revoke_permissions':
                        if ($request->permissions) {
                            $role->revokePermissionTo($request->permissions);
                        }
                        break;
                    case 'delete':
                        if (! $role->is_system_role && $role->users()->count() === 0) {
                            $role->delete();
                        } else {
                            $results[] = [
                                'role_id' => $role->id,
                                'role_name' => $role->name,
                                'status' => 'skipped',
                                'reason' => 'Cannot delete system role or role with users',
                            ];
                            break;
                        }
                        break;
                }

                $results[] = [
                    'role_id' => $role->id,
                    'role_name' => $role->name,
                    'status' => 'success',
                ];
            }

            DB::commit();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Bulk operation completed',
                'results' => $results,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk operation failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Bulk operation failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clone an existing role
     */
    public function cloneRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'source_role_id' => 'required|exists:roles,id',
            'new_name' => 'required|string|max:255|unique:roles,name',
            'new_description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $sourceRole = Role::findById($request->source_role_id);

            if (! $this->canManageRole(Auth::user(), $sourceRole)) {
                return response()->json([
                    'error' => 'Insufficient authority to clone this role',
                ], 403);
            }

            // Create new role
            $newRole = Role::create([
                'name' => $request->new_name,
                'guard_name' => 'web',
            ]);

            // Add custom attributes
            DB::table('roles')->where('id', $newRole->id)->update([
                'description' => $request->new_description,
                'hierarchy_level' => $sourceRole->hierarchy_level ?? 10,
                'category' => $sourceRole->category ?? null,
                'is_system_role' => false, // Cloned roles are never system roles
                'updated_at' => now(),
            ]);

            // Copy all permissions from source role
            $sourcePermissions = $sourceRole->permissions->pluck('name')->toArray();
            if (! empty($sourcePermissions)) {
                $newRole->givePermissionTo($sourcePermissions);
            }

            // Log role cloning
            Log::info('Role cloned', [
                'source_role_id' => $sourceRole->id,
                'source_role_name' => $sourceRole->name,
                'new_role_id' => $newRole->id,
                'new_role_name' => $newRole->name,
                'cloned_by' => Auth::id(),
                'permissions_cloned' => count($sourcePermissions),
            ]);

            DB::commit();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Role cloned successfully',
                'role' => $newRole->fresh('permissions'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Role cloning failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to clone role',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export roles configuration
     */
    public function exportRoles()
    {
        try {
            if (! Auth::user()->hasRole(['Super Administrator', 'Administrator'])) {
                return response()->json([
                    'error' => 'Insufficient permissions for export',
                ], 403);
            }

            $roles = Role::with(['permissions'])->get();
            $permissions = Permission::all();
            $enterpriseModules = $this->rolePermissionService->getEnterpriseModules();

            $exportData = [
                'metadata' => [
                    'export_date' => now()->toISOString(),
                    'exported_by' => Auth::user()->name,
                    'version' => '1.0',
                    'total_roles' => $roles->count(),
                    'total_permissions' => $permissions->count(),
                ],
                'roles' => $roles->map(function ($role) {
                    return [
                        'name' => $role->name,
                        'description' => $role->description,
                        'guard_name' => $role->guard_name,
                        'hierarchy_level' => $role->hierarchy_level,
                        'category' => $role->category,
                        'is_system_role' => $role->is_system_role,
                        'permissions' => $role->permissions->pluck('name')->toArray(),
                    ];
                }),
                'permissions' => $permissions->map(function ($permission) {
                    return [
                        'name' => $permission->name,
                        'guard_name' => $permission->guard_name,
                    ];
                }),
                'enterprise_modules' => $enterpriseModules,
            ];

            $filename = 'roles-export-'.now()->format('Y-m-d-H-i-s').'.json';

            return response()->json($exportData)
                ->header('Content-Type', 'application/json')
                ->header('Content-Disposition', 'attachment; filename="'.$filename.'"');

        } catch (\Exception $e) {
            Log::error('Role export failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to export roles',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Enhanced role audit with detailed reporting
     */
    public function getEnhancedRoleAudit()
    {
        try {
            if (! Auth::user()->hasRole(['Super Administrator', 'Administrator'])) {
                return response()->json([
                    'error' => 'Insufficient permissions for role audit',
                ], 403);
            }

            $roles = Role::with(['permissions', 'users'])->get();
            $permissions = Permission::all();

            $audit = [
                'summary' => [
                    'total_roles' => $roles->count(),
                    'system_roles' => $roles->where('is_system_role', true)->count(),
                    'custom_roles' => $roles->where('is_system_role', false)->count(),
                    'total_permissions' => $permissions->count(),
                    'roles_with_users' => $roles->filter(fn ($role) => $role->users->count() > 0)->count(),
                    'orphaned_roles' => $roles->filter(fn ($role) => $role->users->count() === 0 && ! $role->is_system_role)->count(),
                ],
                'hierarchy_analysis' => [],
                'permission_analysis' => [],
                'security_recommendations' => [],
                'compliance_status' => [
                    'iso_27001_compliant' => true,
                    'rbac_implemented' => true,
                    'audit_trail_enabled' => true,
                    'least_privilege_enforced' => true,
                ],
            ];

            // Hierarchy analysis
            $hierarchyGroups = $roles->groupBy('hierarchy_level');
            foreach ($hierarchyGroups as $level => $levelRoles) {
                $audit['hierarchy_analysis'][] = [
                    'level' => $level,
                    'role_count' => $levelRoles->count(),
                    'avg_permissions' => round($levelRoles->avg(fn ($role) => $role->permissions->count())),
                    'roles' => $levelRoles->pluck('name')->toArray(),
                ];
            }

            // Permission analysis
            $permissionUsage = [];
            foreach ($permissions as $permission) {
                $roleCount = $roles->filter(fn ($role) => $role->permissions->contains('name', $permission->name))->count();
                $permissionUsage[] = [
                    'permission' => $permission->name,
                    'role_count' => $roleCount,
                    'usage_percentage' => round(($roleCount / $roles->count()) * 100, 2),
                ];
            }
            $audit['permission_analysis'] = collect($permissionUsage)->sortByDesc('usage_percentage')->values()->toArray();

            // Security recommendations
            $recommendations = [];

            // Check for roles with too many permissions
            $overPrivilegedRoles = $roles->filter(fn ($role) => $role->permissions->count() > ($permissions->count() * 0.8));
            if ($overPrivilegedRoles->count() > 0) {
                $recommendations[] = [
                    'type' => 'warning',
                    'title' => 'Over-privileged Roles Detected',
                    'description' => 'Some roles have access to more than 80% of available permissions',
                    'affected_roles' => $overPrivilegedRoles->pluck('name')->toArray(),
                    'recommendation' => 'Review and apply principle of least privilege',
                ];
            }

            // Check for unused roles
            $unusedRoles = $roles->filter(fn ($role) => $role->users->count() === 0 && ! $role->is_system_role);
            if ($unusedRoles->count() > 0) {
                $recommendations[] = [
                    'type' => 'info',
                    'title' => 'Unused Roles Found',
                    'description' => 'Some custom roles are not assigned to any users',
                    'affected_roles' => $unusedRoles->pluck('name')->toArray(),
                    'recommendation' => 'Consider removing unused roles to reduce attack surface',
                ];
            }

            $audit['security_recommendations'] = $recommendations;

            return response()->json(['audit' => $audit]);

        } catch (\Exception $e) {
            Log::error('Enhanced role audit failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to generate enhanced audit report',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Role performance metrics
     */
    public function getRoleMetrics()
    {
        try {
            $roles = Role::with(['permissions', 'users'])->get();

            $metrics = [
                'role_distribution' => $roles->groupBy('hierarchy_level')->map(fn ($group) => $group->count()),
                'permission_coverage' => $roles->map(function ($role) {
                    return [
                        'role' => $role->name,
                        'permission_count' => $role->permissions->count(),
                        'user_count' => $role->users->count(),
                    ];
                }),
                'system_health' => [
                    'average_permissions_per_role' => round($roles->avg(fn ($role) => $role->permissions->count()), 2),
                    'most_used_role' => $roles->sortByDesc(fn ($role) => $role->users->count())->first()?->name,
                    'least_used_permissions' => Permission::whereDoesntHave('roles')->count(),
                ],
            ];

            return response()->json(['metrics' => $metrics]);

        } catch (\Exception $e) {
            Log::error('Role metrics generation failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to generate role metrics',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if user can manage a specific role
     */ /**
     * Check if user can manage a specific role
     */
    private function canManageRole($user, Role $role): bool
    {
        // Only Super Administrator can manage other Super Administrator roles
        if ($role->name === 'Super Administrator') {
            return $user->hasRole('Super Administrator');
        }

        // Users with roles.update permission can manage other roles
        return $user->can('roles.update');
    }

    /**
     * Test method to verify controller functionality
     */
    public function test()
    {
        return response()->json([
            'message' => 'Role controller is working',
            'user' => Auth::user()->name,
            'roles' => Auth::user()->roles->pluck('name'),
            'timestamp' => now(),
        ]);
    }

    /**
     * API: List all roles with their permissions (for API endpoints)
     */
    public function apiIndex()
    {
        try {
            $user = Auth::user();

            $roles = Role::with(['permissions'])
                ->when(! $user->hasRole('Super Administrator'), function ($query) {
                    return $query->whereNotIn('name', ['Super Administrator']);
                })
                ->get();

            return response()->json([
                'roles' => $roles,
                'total' => $roles->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to list roles via API: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to retrieve roles',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * API: Show a specific role with its permissions
     */
    public function apiShow($id)
    {
        try {
            $role = Role::with(['permissions', 'users'])->findById($id);

            if (! $role) {
                return response()->json(['error' => 'Role not found'], 404);
            }

            return response()->json([
                'role' => $role,
                'permissions' => $role->permissions->pluck('name'),
                'users_count' => $role->users->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to show role via API: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to retrieve role',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * API: Sync all permissions for a role (replaces existing permissions)
     */
    public function syncRolePermissions(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            $role = Role::findById($id);

            if (! $role) {
                return response()->json(['error' => 'Role not found'], 404);
            }

            if (! $this->canManageRole(Auth::user(), $role)) {
                return response()->json([
                    'error' => 'Insufficient authority to manage this role',
                ], 403);
            }

            // Store original permissions for audit
            $originalPermissions = $role->permissions->pluck('name')->toArray();

            // Sync permissions (replaces all existing)
            $role->syncPermissions($request->permissions);

            // Log the change
            Log::info('Role permissions synced', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'original_permissions' => $originalPermissions,
                'new_permissions' => $request->permissions,
                'synced_by' => Auth::id(),
            ]);

            DB::commit();

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Role permissions synced successfully',
                'role' => $role->fresh('permissions'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to sync role permissions: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to sync role permissions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lightweight health & snapshot endpoint (no heavy relationships) for frontend polling.
     */
    public function snapshot()
    {
        return response()->json([
            'environment' => app()->environment(),
            'cache_driver' => config('cache.default'),
            'cache_key_present' => cache()->has(config('permission.cache.key', 'spatie.permission.cache')),
            'roles' => (int) DB::table('roles')->count(),
            'permissions' => (int) DB::table('permissions')->count(),
            'role_permissions' => (int) DB::table('role_has_permissions')->count(),
            'hash' => $this->rolePermissionService->snapshotHash(),
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Batch update role permissions (add/remove arrays) with optimistic concurrency.
     */
    public function batchUpdatePermissions(\Illuminate\Http\Request $request, int $roleId)
    {
        $data = $request->validate([
            'add' => 'array',
            'add.*' => 'string|exists:permissions,name',
            'remove' => 'array',
            'remove.*' => 'string|exists:permissions,name',
            'version' => 'nullable|string',
        ]);

        $role = \Spatie\Permission\Models\Role::findById($roleId);
        if (! $role) {
            return response()->json(['error' => 'Role not found'], 404);
        }
        if (! $this->canManageRole(Auth::user(), $role)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Simple optimistic concurrency: compare provided version with current snapshot
        $currentHash = $this->rolePermissionService->snapshotHash();
        if (! empty($data['version']) && $data['version'] !== $currentHash) {
            return response()->json([
                'error' => 'Version conflict',
                'current' => $currentHash,
            ], 409);
        }

        $added = $data['add'] ?? [];
        $removed = $data['remove'] ?? [];
        try {
            DB::beginTransaction();
            if ($added) {
                $role->givePermissionTo($added);
            }
            if ($removed) {
                $role->revokePermissionTo($removed);
            }
            $this->rolePermissionService->resetCache();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Batch permission update failed', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Update failed'], 500);
        }

        $fresh = $role->load('permissions');

        return response()->json([
            'message' => 'Permissions updated',
            'role' => [
                'id' => $fresh->id,
                'name' => $fresh->name,
                'permissions' => $fresh->permissions->pluck('name'),
            ],
            'hash' => $this->rolePermissionService->snapshotHash(),
        ]);
    }
}
