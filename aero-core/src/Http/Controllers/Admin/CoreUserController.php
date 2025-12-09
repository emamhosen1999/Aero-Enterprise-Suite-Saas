<?php

namespace Aero\Core\Http\Controllers\Admin;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Aero\Core\Services\UserInvitationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
    protected UserInvitationService $invitationService;

    public function __construct(UserInvitationService $invitationService)
    {
        $this->invitationService = $invitationService;
    }

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
     * Paginate users with filters (AJAX endpoint)
     */
    public function paginate(Request $request)
    {
        try {
            $perPage = $request->input('perPage', 10);
            $page = $request->input('page', 1);
            $search = $request->input('search');
            $role = $request->input('role');
            $status = $request->input('status');

            // Base query with relations
            $query = User::with(['roles']);

            // Search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('user_name', 'like', "%{$search}%");
                    
                    if (in_array('phone', (new User())->getFillable())) {
                        $q->orWhere('phone', 'like', "%{$search}%");
                    }
                });
            }

            // Role filter
            if ($role && $role !== 'all') {
                $query->whereHas('roles', fn ($q) => $q->where('name', $role));
            }

            // Status filter
            if ($status && $status !== 'all') {
                $query->where('active', $status === 'active' ? 1 : 0);
            }

            // Sort active users first
            $query->orderByDesc('active')->orderBy('name');

            // Paginate
            $users = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'users' => $users,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'An error occurred while retrieving user data.',
                'details' => $e->getMessage(),
            ], 500);
        }
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

        DB::beginTransaction();
        try {
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

            DB::commit();

            return response()->json([
                'message' => 'User created successfully.',
                'user' => $user->fresh(['roles']),
            ], 201);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            DB::rollBack();
            
            return response()->json([
                'error' => 'A user with this email already exists.',
                'message' => 'The email address is already in use.',
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            report($e);

            return response()->json([
                'error' => 'Failed to create user.',
                'message' => $e->getMessage(),
            ], 500);
        }
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
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($id)],
            'user_name' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($id)],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
            'active' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
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

            DB::commit();

            return response()->json([
                'message' => 'User updated successfully.',
                'user' => $user->fresh(['roles']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            report($e);

            return response()->json([
                'error' => 'Failed to update user.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return response()->json([
                'error' => 'You cannot delete your own account.'
            ], 403);
        }

        try {
            $user->active = false;
            $user->save();
            $user->delete(); // Soft delete

            return response()->json([
                'message' => 'User deleted successfully.'
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to delete user.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Prevent self-deactivation
        if ($user->id === auth()->id()) {
            return response()->json([
                'error' => 'You cannot deactivate your own account.'
            ], 403);
        }

        try {
            $user->active = $request->input('active', ! $user->active);
            $user->save();

            $status = $user->active ? 'activated' : 'deactivated';

            return response()->json([
                'message' => "User {$status} successfully.",
                'active' => $user->active,
                'user' => $user->fresh(['roles']),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to update user status.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    public function stats(Request $request)
    {
        try {
            // Basic user counts
            $totalUsers = User::count();
            $activeUsers = User::where('active', 1)->count();
            $inactiveUsers = User::where('active', 0)->count();

            // Role analytics - Use DB query instead of withCount
            $roleCount = Role::count();
            $roles = Role::all();
            $rolesWithUsers = $roles->map(function ($role) use ($totalUsers) {
                $userCount = \DB::table('model_has_roles')
                    ->where('role_id', $role->id)
                    ->where('model_type', User::class)
                    ->count();
                
                return [
                    'name' => $role->name,
                    'count' => $userCount,
                    'percentage' => $totalUsers > 0 ? round(($userCount / $totalUsers) * 100, 1) : 0,
                ];
            });

            // Status distribution
            $statusDistribution = [
                ['name' => 'Active', 'count' => $activeUsers, 'percentage' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0],
                ['name' => 'Inactive', 'count' => $inactiveUsers, 'percentage' => $totalUsers > 0 ? round(($inactiveUsers / $totalUsers) * 100, 1) : 0],
            ];

            // Recent activity metrics
            $recentlyActive = User::where('last_login_at', '>=', now()->subDays(7))->count();
            $newUsers30Days = User::where('created_at', '>=', now()->subDays(30))->count();
            $newUsers90Days = User::where('created_at', '>=', now()->subDays(90))->count();
            $newUsersYear = User::where('created_at', '>=', now()->subYear())->count();

            // System health calculations
            $activePercentage = $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0;
            
            // Count users with roles using direct DB query
            $usersWithRolesCount = \DB::table('model_has_roles')
                ->where('model_type', User::class)
                ->distinct('model_id')
                ->count('model_id');
            
            $roleCoverage = $totalUsers > 0
                ? round(($usersWithRolesCount / $totalUsers) * 100, 1)
                : 0;

            // Calculate system health score
            $healthScore = round(($activePercentage * 0.5) + ($roleCoverage * 0.5), 1);
            
            // Admin users count
            $adminRoleNames = ['Super Administrator', 'Admin'];
            $adminUsers = User::whereHas('roles', fn ($q) => $q->whereIn('name', $adminRoleNames))->count();
            $regularUsers = $totalUsers - $adminUsers;
            $usersWithoutRoles = $totalUsers - $usersWithRolesCount;

            return response()->json([
                'stats' => [
                    'overview' => [
                        'total_users' => $totalUsers,
                        'active_users' => $activeUsers,
                        'inactive_users' => $inactiveUsers,
                        'deleted_users' => 0,
                        'total_roles' => $roleCount,
                        'total_departments' => 0,
                    ],
                    'distribution' => [
                        'by_role' => $rolesWithUsers,
                        'by_department' => [],
                        'by_status' => $statusDistribution,
                    ],
                    'activity' => [
                        'recent_registrations' => [
                            'new_users_30_days' => $newUsers30Days,
                            'new_users_90_days' => $newUsers90Days,
                            'new_users_year' => $newUsersYear,
                            'recently_active' => $recentlyActive,
                        ],
                        'user_growth_rate' => 0,
                        'current_month_registrations' => $newUsers30Days,
                    ],
                    'security' => [
                        'access_metrics' => [
                            'users_with_roles' => $usersWithRolesCount,
                            'users_without_roles' => $usersWithoutRoles,
                            'admin_users' => $adminUsers,
                            'regular_users' => $regularUsers,
                        ],
                        'role_distribution' => $rolesWithUsers,
                    ],
                    'health' => [
                        'status_ratio' => [
                            'active_percentage' => $activePercentage,
                            'inactive_percentage' => $totalUsers > 0 ? round(($inactiveUsers / $totalUsers) * 100, 1) : 0,
                            'deleted_percentage' => 0,
                        ],
                        'system_metrics' => [
                            'user_activation_rate' => $activePercentage,
                            'role_coverage' => $roleCoverage,
                            'department_coverage' => 0,
                        ],
                    ],
                    'quick_metrics' => [
                        'total_users' => $totalUsers,
                        'active_ratio' => $activePercentage,
                        'role_diversity' => $roleCount,
                        'department_diversity' => 0,
                        'recent_activity' => $recentlyActive,
                        'system_health_score' => $healthScore,
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'An error occurred while retrieving user statistics.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user roles
     */
    public function updateUserRole(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        try {
            $user->syncRoles($request->input('roles'));

            return response()->json([
                'message' => 'User roles updated successfully',
                'user' => $user->fresh(['roles']),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to update user roles.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send user invitation
     */
    public function sendInvitation(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
        ]);

        try {
            $invitation = $this->invitationService->sendInvitation($validated);

            return response()->json([
                'message' => 'Invitation sent successfully.',
                'invitation' => $invitation,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to send invitation.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pending invitations
     */
    public function pendingInvitations()
    {
        try {
            $invitations = $this->invitationService->getPendingInvitations();

            return response()->json([
                'invitations' => $invitations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve invitations.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resend invitation
     */
    public function resendInvitation($invitationId)
    {
        try {
            $invitation = $this->invitationService->resendInvitation($invitationId);

            return response()->json([
                'message' => 'Invitation resent successfully.',
                'invitation' => $invitation,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to resend invitation.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel invitation
     */
    public function cancelInvitation($invitationId)
    {
        try {
            $this->invitationService->cancelInvitation($invitationId);

            return response()->json([
                'message' => 'Invitation cancelled successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to cancel invitation.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk toggle user status
     */
    public function bulkToggleStatus(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'active' => 'required|boolean',
        ]);

        try {
            // Prevent bulk deactivation of current user
            $userIds = array_filter($validated['user_ids'], function ($id) {
                return $id != auth()->id();
            });

            $count = User::whereIn('id', $userIds)
                ->update(['active' => $validated['active']]);

            $status = $validated['active'] ? 'activated' : 'deactivated';

            return response()->json([
                'message' => "{$count} users {$status} successfully.",
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to update users.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk assign roles to users
     */
    public function bulkAssignRoles(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        try {
            $users = User::whereIn('id', $validated['user_ids'])->get();

            foreach ($users as $user) {
                $user->syncRoles($validated['roles']);
            }

            return response()->json([
                'message' => "Roles assigned to {$users->count()} users successfully.",
                'count' => $users->count(),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to assign roles.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk delete users
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        try {
            // Prevent deletion of current user
            $userIds = array_filter($validated['user_ids'], function ($id) {
                return $id != auth()->id();
            });

            DB::beginTransaction();

            // Deactivate and soft delete
            User::whereIn('id', $userIds)->update(['active' => false]);
            $count = User::whereIn('id', $userIds)->delete();

            DB::commit();

            return response()->json([
                'message' => "{$count} users deleted successfully.",
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            report($e);

            return response()->json([
                'error' => 'Failed to delete users.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
