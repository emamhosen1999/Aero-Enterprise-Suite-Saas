<?php

namespace Aero\Core\Http\Controllers\Admin;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Aero\Core\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

/**
 * Shared Admin Role Controller
 *
 * Context-aware role management controller that works for both:
 * - Platform Admin (landlord guard) - manages platform-level roles
 * - Tenant Admin (web guard) - manages tenant-level roles
 *
 * Simplified version using only roles (no permissions table)
 */
class RoleController extends Controller
{
    /**
     * Get the current authenticated user
     */
    protected function getCurrentUser()
    {
        return auth()->user();
    }

    /**
     * Determine the Inertia page path based on context
     */
    protected function getViewPath(): string
    {
        return 'Roles/Index';
    }

    /**
     * Check if user is a super administrator
     */
    protected function isSuperAdmin(): bool
    {
        $user = $this->getCurrentUser();
        return $user?->hasRole('Super Administrator') ?? false;
    }

    /**
     * Display the main role management interface
     */
    public function index()
    {
        // Disable caching for this endpoint
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        try {
            $user = $this->getCurrentUser();
            $isSuperAdmin = $this->isSuperAdmin();

            // Get all roles (Super Admin can see all, others see limited)
            // Always fetch fresh data from database
            $roles = Role::query()
                ->when(! $isSuperAdmin, function ($query) {
                    return $query->whereNotIn('name', ['Super Administrator']);
                })
                ->orderBy('name')
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'description' => $role->description ?? '',
                        'guard_name' => $role->guard_name,
                        'scope' => $role->scope ?? 'platform',
                        'is_protected' => $role->is_protected ?? false,
                        'users_count' => $role->users()->count(),
                        'created_at' => $role->created_at,
                        'updated_at' => $role->updated_at,
                    ];
                });

            // Get users with their roles
            $users = User::with('roles')
                ->select(['id', 'name', 'email'])
                ->orderBy('name')
                ->get()
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'roles' => $u->roles->map(fn($role) => [
                            'id' => $role->id,
                            'name' => $role->name,
                        ]),
                    ];
                });

            // Get module hierarchy for permission assignment
            // Only if the modules table exists (avoid crashes in Standalone mode)
            $moduleHierarchy = [];
            if (Schema::hasTable('modules')) {
                try {
                    $moduleHierarchy = Module::with([
                        'subModules' => function ($query) {
                            $query->where('is_active', true)->orderBy('priority');
                        },
                        'subModules.components' => function ($query) {
                            $query->where('is_active', true)->orderBy('priority');
                        },
                        'subModules.components.actions' => function ($query) {
                            $query->where('is_active', true)->orderBy('priority');
                        }
                    ])
                    ->where('is_active', true)
                    ->orderBy('priority')
                    ->get()
                    ->map(function ($module) {
                        return [
                            'id' => $module->id,
                            'code' => $module->code,
                            'name' => $module->name,
                            'description' => $module->description,
                            'icon' => $module->icon,
                            'is_core' => $module->is_core,
                            'sub_modules' => $module->subModules->map(function ($subModule) {
                                return [
                                    'id' => $subModule->id,
                                    'code' => $subModule->code,
                                    'name' => $subModule->name,
                                    'description' => $subModule->description,
                                    'components' => $subModule->components->map(function ($component) {
                                        return [
                                            'id' => $component->id,
                                            'code' => $component->code,
                                            'name' => $component->name,
                                            'description' => $component->description,
                                            'type' => $component->type,
                                            'actions' => $component->actions->map(function ($action) {
                                                return [
                                                    'id' => $action->id,
                                                    'code' => $action->code,
                                                    'name' => $action->name,
                                                    'description' => $action->description,
                                                ];
                                            })->values(),
                                        ];
                                    })->values(),
                                ];
                            })->values(),
                        ];
                    });
                } catch (\Exception $e) {
                    Log::warning('Could not load module hierarchy: ' . $e->getMessage());
                }
            }

            return Inertia::render($this->getViewPath(), [
                'title' => 'Role Management',
                'roles' => $roles->toArray(),
                'permissions' => [], // Empty - not using permissions
                'permissionsGrouped' => [], // Empty - not using permissions
                'role_has_permissions' => [], // Empty - not using permissions
                'enterprise_modules' => [], // Empty - not using permissions
                'module_hierarchy' => $moduleHierarchy, // NEW: Module hierarchy for permission assignment
                'can_manage_super_admin' => $isSuperAdmin,
                'is_platform_context' => false,
                'users' => $users,
                'server_info' => [
                    'environment' => app()->environment(),
                    'timestamp' => now()->toISOString(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to load role management interface: ' . $e->getMessage(), [
                'stack_trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render($this->getViewPath(), [
                'title' => 'Role Management - Error',
                'roles' => [],
                'permissions' => [],
                'permissionsGrouped' => [],
                'role_has_permissions' => [],
                'enterprise_modules' => [],
                'can_manage_super_admin' => false,
                'is_platform_context' => false,
                'users' => [],
                'error' => [
                    'message' => 'Failed to load role management data',
                    'details' => $e->getMessage(),
                ],
            ]);
        }
    }

    /**
     * Alias for index - backward compatibility
     */
    public function getRolesAndPermissions()
    {
        return $this->index();
    }

    /**
     * Store a new role
     */
    public function storeRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            if (! $this->isSuperAdmin()) {
                return response()->json([
                    'error' => 'Insufficient permissions to create roles',
                ], 403);
            }

            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web',
            ]);

            // Update description
            if ($request->has('description')) {
                DB::table('roles')->where('id', $role->id)->update([
                    'description' => $request->description ?? null,
                    'updated_at' => now(),
                ]);
            }

            Log::info('Role created', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'created_by' => Auth::id(),
            ]);

            DB::commit();
            $this->clearCache();

            return response()->json([
                'message' => 'Role created successfully',
                'role' => $role->fresh(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Role creation failed: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to create role',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing role
     */
    public function updateRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name,' . $id,
            'description' => 'nullable|string|max:500',
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

            if ($this->isProtectedRole($role)) {
                return response()->json([
                    'error' => 'Super Administrator role cannot be edited.',
                ], 403);
            }

            $role->name = $request->name;
            $role->save();

            if ($request->has('description')) {
                DB::table('roles')->where('id', $role->id)->update([
                    'description' => $request->description,
                    'updated_at' => now(),
                ]);
            }

            Log::info('Role updated', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'updated_by' => Auth::id(),
            ]);

            DB::commit();
            $this->clearCache();

            return response()->json([
                'message' => 'Role updated successfully',
                'role' => $role->fresh(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Role update failed: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to update role',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a role
     */
    public function deleteRole($id)
    {
        DB::beginTransaction();

        try {
            $role = Role::findById($id);

            if (! $role) {
                return response()->json(['error' => 'Role not found'], 404);
            }

            if ($this->isProtectedRole($role)) {
                return response()->json([
                    'error' => 'Super Administrator role cannot be deleted.',
                ], 403);
            }

            $usersCount = $role->users()->count();
            if ($usersCount > 0) {
                return response()->json([
                    'error' => "Cannot delete role. It is assigned to {$usersCount} user(s).",
                ], 409);
            }

            Log::warning('Role deleted', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'deleted_by' => Auth::id(),
            ]);

            $role->delete();

            DB::commit();
            $this->clearCache();

            return response()->json([
                'message' => 'Role deleted successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Role deletion failed: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to delete role',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Assign roles to a user
     */
    public function assignRolesToUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer',
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::findOrFail($request->user_id);

            // Sync roles
            $user->syncRoles($request->roles);

            Log::info('Roles assigned to user', [
                'user_id' => $user->id,
                'roles' => $request->roles,
                'assigned_by' => Auth::id(),
            ]);

            $this->clearCache();

            return response()->json([
                'message' => 'Roles assigned successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'roles' => $user->roles->pluck('name'),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Role assignment failed: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to assign roles',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if role is protected (cannot be modified)
     */
    protected function isProtectedRole(Role $role): bool
    {
        return $role->name === 'Super Administrator' || ($role->is_protected ?? false);
    }

    /**
     * Clear role-related caches
     */
    protected function clearCache(): void
    {
        try {
            Cache::forget('roles_list');
            Cache::forget('roles_with_users');
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        } catch (\Exception $e) {
            Log::warning('Cache clear failed: ' . $e->getMessage());
        }
    }

    /**
     * Export roles data
     */
    public function exportRoles()
    {
        try {
            $roles = Role::all()->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description ?? '',
                    'guard_name' => $role->guard_name,
                    'users_count' => $role->users()->count(),
                ];
            });

            return response()->json([
                'roles' => $roles,
                'exported_at' => now()->toISOString(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Export failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Refresh roles data for frontend
     */
    public function refreshData()
    {
        $this->clearCache();
        
        return response()->json([
            'message' => 'Data refreshed successfully',
            'timestamp' => now()->toISOString(),
        ]);
    }
}
