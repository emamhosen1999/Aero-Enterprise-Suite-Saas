<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UpdateUserRoleRequest;
use App\Http\Requests\UpdateUserStatusRequest;
use App\Http\Resources\UserCollection;
use App\Http\Resources\UserResource;
use App\Models\HRM\AttendanceType;
use App\Models\HRM\Department;
use App\Models\HRM\Designation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index1(): \Inertia\Response
    {

        return Inertia::render('Employees/EmployeeList', [
            'title' => 'Employee Management',
            'departments' => Department::all(),
            'designations' => Designation::all(),
            'attendanceTypes' => AttendanceType::where('is_active', true)->get(),
        ]);
    }

    public function index2(): \Inertia\Response
    {
        $this->authorize('viewAny', User::class);

        return Inertia::render('UsersList', [
            'title' => 'User Management',
            'roles' => Role::all(),
            'departments' => Department::all(),
            'designations' => Designation::with('department')->orderBy('hierarchy_level', 'asc')->get(),
        ]);
    }

    /**
     * Store a new user.
     */
    public function store(StoreUserRequest $request)
    {
        DB::beginTransaction();
        try {
            $validated = $request->validated();

            // Remove profile_image from validated data as it's handled by Media Library
            unset($validated['profile_image']);

            // Hash password if provided
            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            // Convert single_device_login_enabled to boolean
            if (isset($validated['single_device_login_enabled'])) {
                $validated['single_device_login_enabled'] = filter_var($validated['single_device_login_enabled'], FILTER_VALIDATE_BOOLEAN);
            }

            // Create user
            $user = User::create($validated);

            // Assign roles if provided
            if ($roles = $request->input('roles')) {
                $user->syncRoles($roles);
            } else {
                // Assign default Employee role if no roles specified
                $user->assignRole('Employee');
            }

            // Handle profile image
            if ($request->hasFile('profile_image')) {
                $user->addMediaFromRequest('profile_image')
                    ->toMediaCollection('profile_images');
            }

            DB::commit();

            return response()->json([
                'message' => 'User created successfully.',
                'user' => new UserResource($user->fresh(['department', 'designation', 'roles', 'currentDevice'])),
            ], 201);
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
     * Update a user.
     */
    public function update(UpdateUserRequest $request, $id)
    {
        DB::beginTransaction();
        try {
            $user = User::findOrFail($id);
            $validated = $request->validated();

            // Remove profile_image from validated data as it's handled by Media Library
            unset($validated['profile_image']);

            // Hash password if provided
            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            // Convert single_device_login_enabled to boolean
            if (isset($validated['single_device_login_enabled'])) {
                $validated['single_device_login_enabled'] = filter_var($validated['single_device_login_enabled'], FILTER_VALIDATE_BOOLEAN);
            }

            $user->update($validated);

            // Update roles if provided
            if ($request->has('roles')) {
                $user->syncRoles($request->input('roles'));
            }

            // Handle profile image
            if ($request->hasFile('profile_image')) {
                $user->clearMediaCollection('profile_images');
                $user->addMediaFromRequest('profile_image')
                    ->toMediaCollection('profile_images');
            }

            DB::commit();

            return response()->json([
                'message' => 'User updated successfully.',
                'user' => new UserResource($user->fresh(['department', 'designation', 'roles', 'currentDevice'])),
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

    public function updateUserRole(UpdateUserRoleRequest $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $user->syncRoles($request->input('roles'));

            return response()->json([
                'message' => 'Role updated successfully',
                'user' => new UserResource($user->fresh(['department', 'designation', 'roles', 'currentDevice'])),
            ], 200);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to update user role.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateReportTo(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $this->authorize('update', $user);

            $request->validate([
                'report_to' => ['nullable', 'exists:users,id'],
            ]);

            $user->report_to = $request->input('report_to');
            $user->save();

            return response()->json([
                'message' => 'Report to updated successfully',
                'user' => new UserResource($user->fresh(['department', 'designation', 'roles', 'currentDevice', 'reportsTo'])),
            ], 200);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to update report to.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleStatus($id, UpdateUserStatusRequest $request)
    {
        $user = User::withTrashed()->findOrFail($id);

        // Toggle the active status based on the request
        $user->active = $request->input('active');

        // Handle soft delete or restore based on the new status
        if ($user->active) {
            $user->restore(); // Restore the user if they were soft deleted
        } else {
            $user->delete();  // Soft delete the user if marking inactive
        }

        $user->save();

        return response()->json([
            'message' => 'User status updated successfully',
            'active' => $user->active,
            'user' => new UserResource($user->fresh(['department', 'designation', 'roles', 'currentDevice'])),
        ]);
    }

    /**
     * Delete a user (soft delete).
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        $this->authorize('delete', $user);

        try {
            $user->active = false;
            $user->save();
            $user->delete();

            return response()->json(['message' => 'User deleted successfully.']);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to delete user.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateFcmToken(Request $request)
    {
        // Validate that the request contains an FCM token
        $request->validate([
            'fcm_token' => 'required|string',
        ]);

        // Get the authenticated user
        $user = $request->user();

        // Update the user's FCM token
        $user->fcm_token = $request->input('fcm_token');
        $user->save();

        return response()->json([
            'message' => 'FCM token updated successfully',
            'fcm_token' => $user->fcm_token,
        ]);
    }

    public function updateUserAttendanceType(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $this->authorize('updateAttendanceType', $user);

        try {
            $request->validate([
                'attendance_type_id' => 'required|exists:attendance_types,id',
                'attendance_config' => 'nullable|array',
            ]);

            // Use Eloquent relationship to associate attendance type
            $attendanceType = AttendanceType::findOrFail($request->attendance_type_id);

            // If you have a belongsTo relationship: $user->attendanceType()
            $user->attendanceType()->associate($attendanceType);

            // Optionally update config if you have a JSON column for user-specific config
            if ($request->has('attendance_config')) {
                $user->attendance_config = $request->attendance_config;
            }

            $user->save();

            return response()->json([
                'success' => true,
                'messages' => ["User attendance type updated to {$attendanceType->name} successfully."],
                'user' => new UserResource($user->fresh(['department', 'designation', 'roles', 'currentDevice', 'attendanceType'])),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'messages' => ['Failed to update attendance type.'],
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    public function paginate(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', User::class);

        try {
            $perPage = $request->input('perPage', 10);
            $page = $request->input('page', 1);
            $search = $request->input('search');
            $role = $request->input('role');
            $status = $request->input('status');
            $department = $request->input('department');

            // Base query
            $query = User::withTrashed()
                ->with(['department', 'designation', 'roles', 'currentDevice', 'reportsTo']);

            // Filters
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($role && $role !== 'all') {
                $query->whereHas('roles', fn ($q) => $q->where('name', $role));
            }

            if ($status && $status !== 'all') {
                $query->where('active', $status === 'active' ? 1 : 0);
            }

            if ($department && $department !== 'all') {
                $query->where('department_id', $department);
            }

            // Sort active users first
            $query->orderByDesc('active')->orderBy('name');

            // Paginate
            $users = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'users' => new UserCollection($users),
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
     * Get user statistics - Industry standard user management metrics
     */
    public function stats(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Basic user counts
            $totalUsers = User::withTrashed()->count();
            $activeUsers = User::withTrashed()->where('active', 1)->count();
            $inactiveUsers = User::withTrashed()->where('active', 0)->count();
            $deletedUsers = User::onlyTrashed()->count();

            // Role and permission analytics
            $roleCount = Role::count();
            $rolesWithUsers = Role::withCount('users')->get()->map(function ($role) use ($totalUsers) {
                return [
                    'name' => $role->name,
                    'count' => $role->users_count,
                    'percentage' => $totalUsers > 0 ? round(($role->users_count / $totalUsers) * 100, 1) : 0,
                ];
            });

            // Department-wise user distribution
            $departmentStats = Department::withCount('users')
                ->get()
                ->map(function ($dept) use ($totalUsers) {
                    return [
                        'name' => $dept->name,
                        'count' => $dept->users_count,
                        'percentage' => $totalUsers > 0 ? round(($dept->users_count / $totalUsers) * 100, 1) : 0,
                    ];
                });

            // User activity and engagement metrics
            $now = now();
            $recentActivity = [
                'new_users_30_days' => User::where('created_at', '>=', $now->copy()->subDays(30))->count(),
                'new_users_90_days' => User::where('created_at', '>=', $now->copy()->subDays(90))->count(),
                'new_users_year' => User::where('created_at', '>=', $now->copy()->subYear())->count(),
                'recently_active' => User::where('updated_at', '>=', $now->copy()->subDays(7))->count(),
            ];

            // User status ratios and health metrics
            $statusRatio = [
                'active_percentage' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0,
                'inactive_percentage' => $totalUsers > 0 ? round(($inactiveUsers / $totalUsers) * 100, 1) : 0,
                'deleted_percentage' => $totalUsers > 0 ? round(($deletedUsers / $totalUsers) * 100, 1) : 0,
            ];

            // User growth analytics
            $previousMonthUsers = User::withTrashed()->where('created_at', '<', $now->copy()->startOfMonth())->count();
            $currentMonthUsers = User::withTrashed()->where('created_at', '>=', $now->copy()->startOfMonth())->count();
            $userGrowthRate = $previousMonthUsers > 0 ? round((($currentMonthUsers / $previousMonthUsers) * 100), 1) : 0;

            // Security and compliance metrics
            $securityMetrics = [
                'users_with_roles' => User::whereHas('roles')->count(),
                'users_without_roles' => User::whereDoesntHave('roles')->count(),
                'admin_users' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'like', '%admin%');
                })->count(),
                'regular_users' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'not like', '%admin%');
                })->count(),
            ];

            // System health indicators
            $systemHealth = [
                'user_activation_rate' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0,
                'role_coverage' => $totalUsers > 0 ? round(($securityMetrics['users_with_roles'] / $totalUsers) * 100, 1) : 0,
                'department_coverage' => $totalUsers > 0 ? round((User::whereNotNull('department_id')->count() / $totalUsers) * 100, 1) : 0,
            ];

            // Compile comprehensive user management stats
            $stats = [
                // Basic overview
                'overview' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'inactive_users' => $inactiveUsers,
                    'deleted_users' => $deletedUsers,
                    'total_roles' => $roleCount,
                    'total_departments' => Department::count(),
                ],

                // Distribution analytics
                'distribution' => [
                    'by_role' => $rolesWithUsers,
                    'by_department' => $departmentStats,
                    'by_status' => [
                        ['name' => 'Active', 'count' => $activeUsers, 'percentage' => $statusRatio['active_percentage']],
                        ['name' => 'Inactive', 'count' => $inactiveUsers, 'percentage' => $statusRatio['inactive_percentage']],
                        ['name' => 'Deleted', 'count' => $deletedUsers, 'percentage' => $statusRatio['deleted_percentage']],
                    ],
                ],

                // Activity and engagement
                'activity' => [
                    'recent_registrations' => $recentActivity,
                    'user_growth_rate' => $userGrowthRate,
                    'current_month_registrations' => $currentMonthUsers,
                ],

                // Security and access control
                'security' => [
                    'access_metrics' => $securityMetrics,
                    'role_distribution' => $rolesWithUsers,
                ],

                // System health
                'health' => [
                    'status_ratio' => $statusRatio,
                    'system_metrics' => $systemHealth,
                ],

                // Quick dashboard metrics
                'quick_metrics' => [
                    'total_users' => $totalUsers,
                    'active_ratio' => $statusRatio['active_percentage'],
                    'role_diversity' => $roleCount,
                    'department_diversity' => Department::count(),
                    'recent_activity' => $recentActivity['new_users_30_days'],
                    'system_health_score' => round(($systemHealth['user_activation_rate'] + $systemHealth['role_coverage'] + $systemHealth['department_coverage']) / 3, 1),
                ],
            ];

            return response()->json([
                'stats' => $stats,
                'meta' => [
                    'generated_at' => now()->toISOString(),
                    'currency' => 'users',
                    'period' => 'current',
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
     * Paginate employees for the employee list page
     */
    public function paginateEmployees(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Extract filter parameters
            $perPage = $request->input('perPage', 10);
            $page = $request->input('page', 1);
            $search = $request->input('search', '');
            $department = $request->input('department');
            $designation = $request->input('designation');
            $attendanceType = $request->input('attendanceType');

            // Start building the query - use withTrashed to include inactive employees
            $query = User::with(['department', 'designation', 'attendanceType']);

            // Apply filters
            if (! empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            }

            if (! empty($department) && $department !== 'all') {
                $query->where('department_id', $department);
            }

            if (! empty($designation) && $designation !== 'all') {
                $query->where('designation_id', $designation);
            }

            if (! empty($attendanceType) && $attendanceType !== 'all') {
                $query->where('attendance_type_id', $attendanceType);
            }

            // Execute query with pagination
            $employees = $query->with('reportsTo')->paginate($perPage, ['*'], 'page', $page);

            // Transform employee data to include department and designation names
            $transformedEmployees = $employees->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'employee_id' => $employee->employee_id,
                    'profile_image_url' => $employee->profile_image_url,
                    'active' => $employee->active,
                    // Include department ID and name
                    'department_id' => $employee->department_id,
                    'department_name' => $employee->department?->name,
                    // Include designation ID and name
                    'designation_id' => $employee->designation_id,
                    'designation_name' => $employee->designation?->title,
                    'designation_hierarchy_level' => $employee->designation?->hierarchy_level,
                    // Include attendance type
                    'attendance_type_id' => $employee->attendance_type_id,
                    'attendance_type_name' => $employee->attendanceType?->name,
                    // Include report_to for manager assignment
                    'report_to' => $employee->report_to,
                    'reports_to' => $employee->reportsTo ? [
                        'id' => $employee->reportsTo->id,
                        'name' => $employee->reportsTo->name,
                        'profile_image_url' => $employee->reportsTo->profile_image_url,
                        'designation_name' => $employee->reportsTo->designation?->title,
                    ] : null,
                    'created_at' => $employee->created_at,
                    'updated_at' => $employee->updated_at,
                ];
            });

            // Replace the items in the paginator with the transformed items
            $employees->setCollection($transformedEmployees);

            // Get stats
            $stats = [
                'total' => User::count(),
                'active' => User::where('active', 1)->count(),
                'inactive' => User::where('active', 0)->count(),
                'departments' => Department::count(),
                'designations' => Designation::count(),
            ];

            // Get all potential managers (all users with their designation hierarchy)
            // This is needed for the Report To dropdown since current page may not include all managers
            $allManagers = User::with(['designation', 'department'])
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'profile_image_url' => $user->profile_image_url,
                        'department_id' => $user->department_id,
                        'department_name' => $user->department?->name,
                        'designation_id' => $user->designation_id,
                        'designation_name' => $user->designation?->title,
                        'designation_hierarchy_level' => $user->designation?->hierarchy_level ?? 999,
                    ];
                });

            return response()->json([
                'employees' => $employees, // This includes pagination metadata
                'stats' => $stats,
                'allManagers' => $allManagers, // All users for Report To dropdown
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'An error occurred while retrieving employee data.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get employee statistics - Industry standard HR metrics
     */
    public function employeeStats(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Basic employee counts
            $totalEmployees = User::count();
            $activeEmployees = User::where('active', 1)->count();
            $inactiveEmployees = User::where('active', 0)->count();

            // Department and designation counts
            $departmentCount = Department::count();
            $designationCount = Designation::count();

            // Attendance type distribution
            $attendanceTypeStats = AttendanceType::withCount('users')
                ->where('is_active', true)
                ->get()
                ->map(function ($type) {
                    return [
                        'name' => $type->name,
                        'count' => $type->users_count,
                        'percentage' => $type->users_count > 0 ? round(($type->users_count / User::count()) * 100, 1) : 0,
                    ];
                });

            // Department-wise employee distribution
            $departmentStats = Department::withCount('users')
                ->get()
                ->map(function ($dept) {
                    return [
                        'name' => $dept->name,
                        'count' => $dept->users_count,
                        'percentage' => $dept->users_count > 0 ? round(($dept->users_count / User::count()) * 100, 1) : 0,
                    ];
                });

            // Designation-wise employee distribution
            $designationStats = Designation::withCount('users')
                ->get()
                ->map(function ($desig) {
                    return [
                        'name' => $desig->title,
                        'count' => $desig->users_count,
                        'percentage' => $desig->users_count > 0 ? round(($desig->users_count / User::count()) * 100, 1) : 0,
                    ];
                });

            // Recent hiring trends (last 30, 90, 365 days)
            $now = now();
            $recentHires = [
                'last_30_days' => User::where('created_at', '>=', $now->copy()->subDays(30))->count(),
                'last_90_days' => User::where('created_at', '>=', $now->copy()->subDays(90))->count(),
                'last_year' => User::where('created_at', '>=', $now->copy()->subYear())->count(),
            ];

            // Employee status ratios
            $statusRatio = [
                'active_percentage' => $totalEmployees > 0 ? round(($activeEmployees / $totalEmployees) * 100, 1) : 0,
                'inactive_percentage' => $totalEmployees > 0 ? round(($inactiveEmployees / $totalEmployees) * 100, 1) : 0,
                'retention_rate' => $totalEmployees > 0 ? round(($activeEmployees / $totalEmployees) * 100, 1) : 0,
            ];

            // Growth metrics
            $previousMonthCount = User::where('created_at', '<', $now->copy()->startOfMonth())->count();
            $currentMonthHires = User::where('created_at', '>=', $now->copy()->startOfMonth())->count();
            $growthRate = $previousMonthCount > 0 ? round((($currentMonthHires / $previousMonthCount) * 100), 1) : 0;

            // Compile comprehensive stats
            $stats = [
                // Basic counts
                'overview' => [
                    'total_employees' => $totalEmployees,
                    'active_employees' => $activeEmployees,
                    'inactive_employees' => $inactiveEmployees,
                    'total_departments' => $departmentCount,
                    'total_designations' => $designationCount,
                    'total_attendance_types' => AttendanceType::where('is_active', true)->count(),
                ],

                // Distribution analytics
                'distribution' => [
                    'by_department' => $departmentStats,
                    'by_designation' => $designationStats,
                    'by_attendance_type' => $attendanceTypeStats,
                ],

                // Hiring trends
                'hiring_trends' => [
                    'recent_hires' => $recentHires,
                    'monthly_growth_rate' => $growthRate,
                    'current_month_hires' => $currentMonthHires,
                ],

                // Status and retention metrics
                'workforce_health' => [
                    'status_ratio' => $statusRatio,
                    'retention_rate' => $statusRatio['retention_rate'],
                    'turnover_rate' => 100 - $statusRatio['retention_rate'],
                ],

                // Quick metrics for dashboard
                'quick_metrics' => [
                    'headcount' => $totalEmployees,
                    'active_ratio' => $statusRatio['active_percentage'],
                    'department_diversity' => $departmentCount,
                    'role_diversity' => $designationCount,
                    'recent_activity' => $recentHires['last_30_days'],
                ],
            ];

            return response()->json([
                'stats' => $stats,
                'meta' => [
                    'generated_at' => now()->toISOString(),
                    'currency' => 'employees',
                    'period' => 'current',
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'An error occurred while retrieving employee statistics.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all roles assigned to a user
     */
    public function getUserRoles($id)
    {
        try {
            $user = User::findOrFail($id);

            return response()->json([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'guard_name' => $role->guard_name,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get user roles: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to retrieve user roles',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all permissions for a user (both direct and via roles)
     */
    public function getUserPermissions($id)
    {
        try {
            $user = User::findOrFail($id);

            // Get direct permissions
            $directPermissions = $user->getDirectPermissions()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'source' => 'direct',
                ];
            });

            // Get permissions via roles
            $rolePermissions = $user->getPermissionsViaRoles()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'source' => 'role',
                ];
            });

            // Get all permissions (merged)
            $allPermissions = $user->getAllPermissions()->pluck('name');

            return response()->json([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'direct_permissions' => $directPermissions,
                'role_permissions' => $rolePermissions,
                'all_permissions' => $allPermissions,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get user permissions: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to retrieve user permissions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync roles for a user (replaces existing roles)
     */
    public function syncUserRoles(Request $request, $id)
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        try {
            $user = User::findOrFail($id);

            // Store original roles for audit
            $originalRoles = $user->roles->pluck('name')->toArray();

            // Sync roles
            $user->syncRoles($request->input('roles'));

            Log::info('User roles synced', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'original_roles' => $originalRoles,
                'new_roles' => $request->input('roles'),
                'synced_by' => auth()->id(),
            ]);

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'User roles synced successfully',
                'user' => new UserResource($user->fresh(['department', 'designation', 'roles', 'currentDevice'])),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync user roles: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to sync user roles',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync direct permissions for a user (replaces existing direct permissions)
     */
    public function syncUserPermissions(Request $request, $id)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        try {
            $user = User::findOrFail($id);

            // Store original permissions for audit
            $originalPermissions = $user->getDirectPermissions()->pluck('name')->toArray();

            // Sync direct permissions
            $user->syncPermissions($request->input('permissions'));

            Log::info('User permissions synced', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'original_permissions' => $originalPermissions,
                'new_permissions' => $request->input('permissions'),
                'synced_by' => auth()->id(),
            ]);

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'User permissions synced successfully',
                'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
                'all_permissions' => $user->getAllPermissions()->pluck('name'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync user permissions: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to sync user permissions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Give a specific permission directly to a user
     */
    public function giveUserPermission(Request $request, $id)
    {
        $request->validate([
            'permission' => 'required|string|exists:permissions,name',
        ]);

        try {
            $user = User::findOrFail($id);
            $permissionName = $request->input('permission');

            // Check if user already has this permission directly
            if ($user->hasDirectPermission($permissionName)) {
                return response()->json([
                    'message' => 'User already has this permission directly',
                ], 200);
            }

            $user->givePermissionTo($permissionName);

            Log::info('Permission granted to user', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'permission' => $permissionName,
                'granted_by' => auth()->id(),
            ]);

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Permission granted successfully',
                'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to grant user permission: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to grant permission',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revoke a specific permission from a user
     */
    public function revokeUserPermission(Request $request, $id)
    {
        $request->validate([
            'permission' => 'required|string|exists:permissions,name',
        ]);

        try {
            $user = User::findOrFail($id);
            $permissionName = $request->input('permission');

            // Check if user has this permission directly
            if (! $user->hasDirectPermission($permissionName)) {
                return response()->json([
                    'message' => 'User does not have this permission directly',
                ], 200);
            }

            $user->revokePermissionTo($permissionName);

            Log::info('Permission revoked from user', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'permission' => $permissionName,
                'revoked_by' => auth()->id(),
            ]);

            // Clear Spatie Permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'message' => 'Permission revoked successfully',
                'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to revoke user permission: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to revoke permission',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
