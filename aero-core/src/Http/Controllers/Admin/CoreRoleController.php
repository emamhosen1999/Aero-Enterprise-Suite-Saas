<?php

namespace Aero\Core\Http\Controllers\Admin;

use Aero\Core\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Core Role Controller
 *
 * Handles role and permission management.
 */
class CoreRoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(Request $request): Response
    {
        $roles = Role::query()
            ->withCount(['users', 'permissions'])
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return Inertia::render('Roles/Index', [
            'title' => 'Roles & Permissions',
            'roles' => $roles,
            'filters' => $request->only(['search']),
            'stats' => [
                'totalRoles' => Role::count(),
                'totalPermissions' => Permission::count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        $permissions = Permission::all()
            ->groupBy(function ($permission) {
                $parts = explode('.', $permission->name);
                return $parts[0] ?? 'general';
            });

        return Inertia::render('Roles/Create', [
            'title' => 'Create Role',
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if (! empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->route('core.roles.index')
            ->with('success', 'Role created successfully.');
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
        $role->load(['permissions', 'users']);

        return Inertia::render('Roles/Show', [
            'title' => $role->name,
            'role' => $role,
            'permissions' => $role->permissions->groupBy(function ($permission) {
                $parts = explode('.', $permission->name);
                return $parts[0] ?? 'general';
            }),
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        $role->load(['permissions']);

        $allPermissions = Permission::all()
            ->groupBy(function ($permission) {
                $parts = explode('.', $permission->name);
                return $parts[0] ?? 'general';
            });

        return Inertia::render('Roles/Edit', [
            'title' => 'Edit Role',
            'role' => $role,
            'permissions' => $allPermissions,
            'rolePermissions' => $role->permissions->pluck('name'),
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->route('core.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role)
    {
        // Prevent deletion of system roles
        $protectedRoles = ['super-admin', 'admin', 'Super Admin', 'Admin'];
        if (in_array($role->name, $protectedRoles)) {
            return back()->with('error', 'Cannot delete system roles.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return back()->with('error', 'Cannot delete role with assigned users.');
        }

        $role->delete();

        return redirect()->route('core.roles.index')
            ->with('success', 'Role deleted successfully.');
    }

    /**
     * Get all permissions as JSON (for API/AJAX).
     */
    public function permissions()
    {
        $permissions = Permission::all()
            ->groupBy(function ($permission) {
                $parts = explode('.', $permission->name);
                return $parts[0] ?? 'general';
            });

        return response()->json($permissions);
    }
}
