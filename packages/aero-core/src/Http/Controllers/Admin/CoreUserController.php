<?php

namespace Aero\Core\Http\Controllers\Admin;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Aero\Core\Services\AuditService;
use Aero\Core\Services\Auth\SessionManagementService;
use Aero\Core\Services\UserInvitationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Aero\HRMAC\Models\Role;

/**
 * Core User Controller
 *
 * Handles user management for core functionality.
 * This controller is independent of HRM or other modules.
 */
class CoreUserController extends Controller
{
    protected UserInvitationService $invitationService;
    protected AuditService $auditService;
    protected SessionManagementService $sessionManagementService;

    public function __construct(
        UserInvitationService $invitationService,
        AuditService $auditService,
        SessionManagementService $sessionManagementService
    ) {
        $this->invitationService = $invitationService;
        $this->auditService = $auditService;
        $this->sessionManagementService = $sessionManagementService;
    }

    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

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

        return Inertia::render('Shared/UsersList', [
            'title' => 'Users',
            'users' => $users,
            'roles' => Role::all(['id', 'name']),
            'context' => 'core',
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
        $this->authorize('viewAny', User::class);

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
     * Get user statistics
     * 
     * Optimized to use a single query with conditional aggregation
     * to reduce database round trips from 10+ queries to 2.
     */
    public function stats(Request $request)
    {
        try {
            // Single query with conditional aggregation for all user stats
            $userStats = User::query()
                ->selectRaw('COUNT(*) as total_users')
                ->selectRaw('SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_users')
                ->selectRaw('SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive_users')
                ->selectRaw('SUM(CASE WHEN email_verified_at IS NOT NULL THEN 1 ELSE 0 END) as verified_users')
                ->selectRaw('SUM(CASE WHEN email_verified_at IS NULL THEN 1 ELSE 0 END) as unverified_users')
                ->selectRaw('SUM(CASE WHEN account_locked_at IS NOT NULL THEN 1 ELSE 0 END) as locked_accounts')
                ->selectRaw('SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as recent_users', [now()->subDays(30)])
                ->first();

            // Separate queries for role-related stats (requires join)
            $usersWithRoles = User::has('roles')->count();
            $usersWithoutRoles = User::doesntHave('roles')->count();

            // Soft deleted users count
            $deletedUsers = User::onlyTrashed()->count();
            
            // Total roles count
            $totalRoles = Role::count();

            $totalUsers = (int) $userStats->total_users;
            $activeUsers = (int) $userStats->active_users;
            $verifiedUsers = (int) $userStats->verified_users;

            // Calculate percentages
            $activePercentage = $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0;
            $verifiedPercentage = $totalUsers > 0 ? round(($verifiedUsers / $totalUsers) * 100, 1) : 0;
            $rolesCoverage = $totalUsers > 0 ? round(($usersWithRoles / $totalUsers) * 100, 1) : 0;

            return response()->json([
                'stats' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'inactive_users' => (int) $userStats->inactive_users,
                    'deleted_users' => $deletedUsers,
                    'verified_users' => $verifiedUsers,
                    'unverified_users' => (int) $userStats->unverified_users,
                    'locked_accounts' => (int) $userStats->locked_accounts,
                    'users_with_roles' => $usersWithRoles,
                    'users_without_roles' => $usersWithoutRoles,
                    'recent_users_30_days' => (int) $userStats->recent_users,
                    'active_percentage' => $activePercentage,
                    'verified_percentage' => $verifiedPercentage,
                    'roles_coverage' => $rolesCoverage,
                    'total_roles' => $totalRoles,
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to fetch user statistics.',
                'stats' => [
                    'total_users' => 0,
                    'active_users' => 0,
                    'inactive_users' => 0,
                    'deleted_users' => 0,
                    'verified_users' => 0,
                    'unverified_users' => 0,
                    'locked_accounts' => 0,
                    'users_with_roles' => 0,
                    'users_without_roles' => 0,
                    'recent_users_30_days' => 0,
                    'active_percentage' => 0,
                    'verified_percentage' => 0,
                    'roles_coverage' => 0,
                    'total_roles' => 0,
                ],
            ], 500);
        }
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Core/Users/Create', [
            'title' => 'Create User',
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'user_name' => 'nullable|string|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => ['required', 'confirmed', Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()],
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

            // Log the action
            $this->auditService->logUserCreated($user, $validated);

            DB::commit();

            return response()->json([
                'message' => 'User created successfully.',
                'user' => $user->fresh(['roles']),
            ], 201);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            DB::rollBack();
            
            // Determine which field caused the constraint violation
            // Check constraint name first (more reliable), then fall back to field name in "Duplicate entry" message
            $errorMessage = $e->getMessage();
            $errors = [];
            
            // Check for specific constraint names first (most reliable)
            if (stripos($errorMessage, 'users_phone_unique') !== false || stripos($errorMessage, "'phone'") !== false) {
                $errors['phone'] = ['This phone number is already in use.'];
            } elseif (stripos($errorMessage, 'users_email_unique') !== false || stripos($errorMessage, "'email'") !== false) {
                $errors['email'] = ['This email address is already registered.'];
            } elseif (stripos($errorMessage, 'users_employee_id_unique') !== false || stripos($errorMessage, "'employee_id'") !== false) {
                $errors['employee_id'] = ['This employee ID already exists.'];
            } elseif (stripos($errorMessage, 'users_user_name_unique') !== false || stripos($errorMessage, "'user_name'") !== false) {
                $errors['user_name'] = ['This username is already taken.'];
            } else {
                // Generic fallback - extract field from "for key 'users.FIELD'" pattern
                if (preg_match("/for key ['\"]?users\.users_(\w+)_unique['\"]?/i", $errorMessage, $matches)) {
                    $field = $matches[1];
                    $errors[$field] = ["This {$field} is already in use."];
                } else {
                    $errors['email'] = ['A user with this information already exists.'];
                }
            }
            
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $errors,
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
        $this->authorize('view', $user);

        $user->load(['roles', 'permissions']);

        return Inertia::render('Core/Users/Show', [
            'title' => $user->name,
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        $user->load(['roles']);

        return Inertia::render('Core/Users/Edit', [
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
        
        $this->authorize('update', $user);
        
        // Store old values for audit
        $oldValues = $user->only(['name', 'email', 'user_name', 'phone', 'active']);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($id)],
            'user_name' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($id)],
            'phone' => 'nullable|string|max:20',
            'password' => ['nullable', 'confirmed', Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()],
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

            // Log the action
            $this->auditService->logUserUpdated($user, $oldValues, $user->only(['name', 'email', 'user_name', 'phone', 'active']));

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
        
        $this->authorize('delete', $user);
        
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

            // Log the action
            $this->auditService->logUserDeleted($user);

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
        
        $this->authorize('toggleStatus', $user);
        
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

            // Terminate all sessions when deactivating user
            if (!$user->active) {
                $this->sessionManagementService->terminateAllSessions($user);
            }

            // Log the action
            $this->auditService->logUserStatusChanged($user, $user->active);

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
     * Update user roles
     */
    public function updateUserRole(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $this->authorize('updateRoles', $user);

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
        $this->authorize('invite', User::class);

        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
        ]);

        try {
            $invitation = $this->invitationService->sendInvitation($validated);

            // Log the action
            $this->auditService->logUserInvited($invitation);

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

            // Log the action
            $this->auditService->logInvitationResent($invitation);

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
            $invitation = \Aero\Core\Models\UserInvitation::findOrFail($invitationId);
            $this->invitationService->cancelInvitation($invitationId);

            // Log the action
            $this->auditService->logInvitationCancelled($invitation);

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
        $this->authorize('bulkToggleStatus', User::class);

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'active' => 'required|boolean',
        ]);

        try {
            // Prevent bulk deactivation of current user
            $userIds = $validated['user_ids'];
            if ($validated['active'] === false && in_array(auth()->id(), $userIds)) {
                $userIds = array_diff($userIds, [auth()->id()]);
            }

            // If deactivating, terminate all sessions for affected users first
            if ($validated['active'] === false) {
                $usersToDeactivate = User::whereIn('id', $userIds)->get();
                foreach ($usersToDeactivate as $user) {
                    $this->sessionManagementService->terminateAllSessions($user);
                }
            }

            $count = User::whereIn('id', $userIds)
                ->update(['active' => $validated['active']]);

            $status = $validated['active'] ? 'activated' : 'deactivated';

            // Log bulk action
            $this->auditService->logBulkStatusChange($count, $validated['active']);

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
        $this->authorize('bulkAssignRoles', User::class);

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        try {
            $totalCount = 0;
            
            // Use chunking to prevent memory issues with large user sets
            User::whereIn('id', $validated['user_ids'])
                ->chunk(100, function ($users) use ($validated, &$totalCount) {
                    foreach ($users as $user) {
                        $user->syncRoles($validated['roles']);
                        $totalCount++;
                    }
                });

            // Log bulk action
            $this->auditService->logBulkRoleAssignment($totalCount, $validated['roles']);

            return response()->json([
                'message' => "Roles assigned to {$totalCount} users successfully.",
                'count' => $totalCount,
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
        $this->authorize('bulkDelete', User::class);

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        try {
            DB::beginTransaction();

            // Prevent deletion of current user
            $userIds = array_diff($validated['user_ids'], [auth()->id()]);

            // Deactivate and soft delete
            User::whereIn('id', $userIds)->update(['active' => false]);
            $count = User::whereIn('id', $userIds)->delete();

            // Log bulk action
            $this->auditService->logBulkDeletion($count);

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

    /**
     * Export users to CSV
     */
    public function exportUsers(Request $request)
    {
        $validated = $request->validate([
            'role_id' => 'nullable|exists:roles,id',
            'active' => 'nullable|boolean',
            'department_id' => 'nullable|integer',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        try {
            $query = User::query()->with('roles');

            // Apply filters
            if (isset($validated['role_id'])) {
                $query->role($validated['role_id']);
            }

            if (isset($validated['active'])) {
                $query->where('active', $validated['active']);
            }

            if (isset($validated['department_id'])) {
                // Check if department relationship exists dynamically
                $registry = app(\Aero\Core\Services\UserRelationshipRegistry::class);
                if ($registry->hasRelationship('employee')) {
                    $query->whereHas('employee', function ($q) use ($validated) {
                        $q->where('department_id', $validated['department_id']);
                    });
                }
            }

            if (isset($validated['from_date'])) {
                $query->where('created_at', '>=', $validated['from_date']);
            }

            if (isset($validated['to_date'])) {
                $query->where('created_at', '<=', $validated['to_date']);
            }

            $users = $query->get();

            // Generate CSV
            $filename = 'users_export_' . now()->format('Y-m-d_His') . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function () use ($users) {
                $file = fopen('php://output', 'w');
                
                // CSV Headers
                fputcsv($file, [
                    'ID', 'Name', 'Username', 'Email', 'Phone', 
                    'Active', 'Roles', 'Email Verified', 'Created At'
                ]);

                // CSV Data
                foreach ($users as $user) {
                    fputcsv($file, [
                        $user->id,
                        $user->name,
                        $user->user_name,
                        $user->email,
                        $user->phone,
                        $user->active ? 'Yes' : 'No',
                        $user->roles->pluck('name')->join(', '),
                        $user->email_verified_at ? 'Yes' : 'No',
                        $user->created_at->format('Y-m-d H:i:s'),
                    ]);
                }

                fclose($file);
            };

            // Log the export
            $this->auditService->logUserExport($users->count(), $validated);

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to export users.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restore soft-deleted user
     */
    public function restoreUser($id)
    {
        try {
            $user = User::withTrashed()->findOrFail($id);

            if (! $user->trashed()) {
                return response()->json([
                    'error' => 'User is not deleted.',
                ], 400);
            }

            $user->restore();
            $user->active = true;
            $user->save();

            // Log the action
            $this->auditService->logUserRestored($user);

            return response()->json([
                'message' => 'User restored successfully.',
                'user' => $user->fresh(['roles']),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to restore user.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lock user account
     */
    public function lockAccount(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $user = User::findOrFail($id);

            // Prevent locking current user
            if ($user->id === auth()->id()) {
                return response()->json([
                    'error' => 'You cannot lock your own account.',
                ], 400);
            }

            if ($user->account_locked_at) {
                return response()->json([
                    'error' => 'Account is already locked.',
                ], 400);
            }

            $user->account_locked_at = now();
            $user->locked_reason = $validated['reason'] ?? 'Account locked by administrator';
            $user->active = false;
            $user->save();

            // Log the action
            $this->auditService->logAccountLocked($user, $validated['reason'] ?? null);

            return response()->json([
                'message' => 'Account locked successfully.',
                'user' => $user->fresh(['roles']),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to lock account.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Unlock user account
     */
    public function unlockAccount($id)
    {
        try {
            $user = User::findOrFail($id);

            if (! $user->account_locked_at) {
                return response()->json([
                    'error' => 'Account is not locked.',
                ], 400);
            }

            $user->account_locked_at = null;
            $user->locked_reason = null;
            $user->active = true;
            $user->save();

            // Log the action
            $this->auditService->logAccountUnlocked($user);

            return response()->json([
                'message' => 'Account unlocked successfully.',
                'user' => $user->fresh(['roles']),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to unlock account.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Force password reset on next login
     */
    public function forcePasswordReset($id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent forcing password reset for current user
            if ($user->id === auth()->id()) {
                return response()->json([
                    'error' => 'You cannot force password reset for your own account.',
                ], 400);
            }

            // Set a flag that will be checked on login
            $user->force_password_reset = true;
            $user->save();

            // Log the action
            $this->auditService->logPasswordResetForced($user);

            return response()->json([
                'message' => 'User will be required to reset password on next login.',
                'user' => $user->fresh(['roles']),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to force password reset.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resend email verification
     */
    public function resendEmailVerification($id)
    {
        try {
            $user = User::findOrFail($id);

            if ($user->hasVerifiedEmail()) {
                return response()->json([
                    'error' => 'Email is already verified.',
                ], 400);
            }

            $user->sendEmailVerificationNotification();

            // Log the action
            $this->auditService->logVerificationResent($user);

            return response()->json([
                'message' => 'Verification email sent successfully.',
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to resend verification email.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Start impersonating a user.
     */
    public function startImpersonation(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $this->authorize('impersonate', $user);

        try {
            $impersonationService = app(\Aero\Core\Services\Auth\UserImpersonationService::class);
            
            $reason = $request->input('reason', 'Administrative support');
            $duration = $request->input('duration', 60);
            
            $impersonationService->impersonate($user, $reason, $duration);

            // Log the action
            $this->auditService->log('user.impersonation.started', [
                'target_user_id' => $user->id,
                'target_user_email' => $user->email,
                'reason' => $reason,
                'duration_minutes' => $duration,
            ]);

            return response()->json([
                'message' => "Now impersonating {$user->name}.",
                'redirect' => route('core.dashboard'),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to start impersonation.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stop impersonating and return to original user.
     */
    public function stopImpersonation(Request $request)
    {
        try {
            $impersonationService = app(\Aero\Core\Services\Auth\UserImpersonationService::class);
            
            if (!$impersonationService->isImpersonating()) {
                return response()->json([
                    'error' => 'Not currently impersonating any user.',
                ], 400);
            }

            $targetUser = auth()->user();
            $impersonationService->stopImpersonating();

            // Log the action
            $this->auditService->log('user.impersonation.stopped', [
                'target_user_id' => $targetUser->id,
                'target_user_email' => $targetUser->email,
            ]);

            return response()->json([
                'message' => 'Returned to your original account.',
                'redirect' => route('core.users.index'),
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to stop impersonation.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}

