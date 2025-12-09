<?php

namespace Aero\Core\Http\Controllers\Admin;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

/**
 * Core User Controller
 *
 * Handles user management for core functionality.
 * This controller is independent of HRM or other modules.
 */
class CoreUserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $query = User::query()
            ->with(['roles'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('user_name', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($q, $status) {
                if ($status === 'active') {
                    $q->where('active', true);
                } elseif ($status === 'inactive') {
                    $q->where('active', false);
                }
            })
            ->when($request->role, function ($q, $role) {
                $q->whereHas('roles', fn ($query) => $query->where('name', $role));
            })
            ->latest();

        $users = $query->paginate($request->per_page ?? 15);

        return Inertia::render('Users/Index', [
            'title' => 'Users',
            'users' => $users,
            'roles' => Role::all(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'role']),
            'stats' => [
                'total' => User::count(),
                'active' => User::where('active', true)->count(),
                'inactive' => User::where('active', false)->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        return Inertia::render('Users/Create', [
            'title' => 'Create User',
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'user_name' => 'nullable|string|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
            'active' => 'boolean',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'user_name' => $validated['user_name'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'active' => $validated['active'] ?? true,
        ]);

        if (! empty($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return redirect()->route('core.users.index')
            ->with('success', 'User created successfully.');
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): Response
    {
        $user->load(['roles', 'permissions']);

        return Inertia::render('Users/Show', [
            'title' => $user->name,
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $user->load(['roles']);

        return Inertia::render('Users/Edit', [
            'title' => 'Edit User',
            'user' => $user,
            'roles' => Role::all(['id', 'name']),
            'userRoles' => $user->roles->pluck('name'),
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'user_name' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
            'active' => 'boolean',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'user_name' => $validated['user_name'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'active' => $validated['active'] ?? $user->active,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return redirect()->route('core.users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->route('core.users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(User $user)
    {
        // Prevent self-deactivation
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['active' => ! $user->active]);

        $status = $user->active ? 'activated' : 'deactivated';

        return back()->with('success', "User {$status} successfully.");
    }
}
