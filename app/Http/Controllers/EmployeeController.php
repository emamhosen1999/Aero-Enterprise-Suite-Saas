<?php

namespace App\Http\Controllers;

use App\Models\HRM\AttendanceType;
use App\Models\HRM\Department;
use App\Models\HRM\Designation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees
     */
    public function index()
    {
        return Inertia::render('Employees/EmployeeList', [
            'title' => 'Employee Management',
            'departments' => Department::where('is_active', true)->get(),
            'designations' => Designation::where('is_active', true)->get(),
            'attendanceTypes' => AttendanceType::where('is_active', true)->get(),
        ]);
    }

    /**
     * Store a newly created employee
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|unique:users,phone',
            'employee_id' => 'nullable|string|unique:users,employee_id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'attendance_type_id' => 'nullable|exists:attendance_types,id',
            'date_of_joining' => 'nullable|date',
            'birthday' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'address' => 'nullable|string',
            'password' => 'required|string|min:8|confirmed',
            'salary_amount' => 'nullable|numeric|min:0',
            'active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'employee_id' => $request->employee_id ?? $this->generateEmployeeId(),
                'department_id' => $request->department_id,
                'designation_id' => $request->designation_id,
                'attendance_type_id' => $request->attendance_type_id,
                'date_of_joining' => $request->date_of_joining ?? now(),
                'birthday' => $request->birthday,
                'gender' => $request->gender,
                'address' => $request->address,
                'password' => Hash::make($request->password),
                'salary_amount' => $request->salary_amount,
                'active' => $request->active ?? true,
                'user_name' => $request->email, // Default username to email
            ]);

            // Assign default employee role
            $user->assignRole('Employee');

            DB::commit();

            return response()->json([
                'message' => 'Employee created successfully',
                'employee' => $user->load(['department', 'designation', 'attendanceType']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating employee', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return response()->json(['error' => 'Failed to create employee'], 500);
        }
    }

    /**
     * Display the specified employee
     */
    public function show($id)
    {
        $employee = User::with(['department', 'designation', 'attendanceType', 'roles'])
            ->findOrFail($id);

        return response()->json(['employee' => $employee]);
    }

    /**
     * Update the specified employee
     */
    public function update(Request $request, $id)
    {
        try {
            $employee = User::findOrFail($id);

            // Enhanced authorization check
            $currentUser = Auth::user();
            if (! $this->canModifyEmployee($currentUser, $employee)) {
                return response()->json(['error' => 'Unauthorized to modify this employee'], 403);
            }

            // Enhanced validation
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,'.$id,
                'department_id' => 'sometimes|nullable|exists:departments,id',
                'designation_id' => 'sometimes|nullable|exists:designations,id',
                'attendance_type_id' => 'sometimes|nullable|exists:attendance_types,id',
                'active' => 'sometimes|boolean',
                'phone' => 'sometimes|nullable|string|max:20',
                'hire_date' => 'sometimes|nullable|date',
                'salary' => 'sometimes|nullable|numeric|min:0',
            ]);

            // Track what was changed for audit
            $changes = [];
            foreach ($validated as $key => $value) {
                if ($value != $employee->$key) {
                    $changes[$key] = [
                        'old' => $employee->$key,
                        'new' => $value,
                    ];
                }
            }

            $employee->update($validated);

            // Log the update for audit trail
            Log::info('Employee updated', [
                'employee_id' => $id,
                'employee_name' => $employee->name,
                'changes' => $changes,
                'updated_by' => Auth::id(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Employee updated successfully',
                'employee' => $employee->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating employee', [
                'error' => $e->getMessage(),
                'employee_id' => $id,
                'updated_by' => Auth::id(),
            ]);

            return response()->json(['error' => 'Failed to update employee'], 500);
        }
    }

    /**
     * Remove the specified employee (soft delete)
     */
    public function destroy($id)
    {
        try {
            $employee = User::findOrFail($id);

            // Enhanced authorization check
            $currentUser = Auth::user();
            if (! $this->canDeleteEmployee($currentUser, $employee)) {
                return response()->json(['error' => 'Unauthorized to delete this employee'], 403);
            }

            // Check for dependencies before deletion
            $dependencies = $this->checkEmployeeDependencies($employee);
            if (! empty($dependencies)) {
                return response()->json([
                    'error' => 'Cannot delete employee with active dependencies',
                    'dependencies' => $dependencies,
                ], 422);
            }

            // Perform soft delete
            $employee->active = false;
            $employee->save();
            $employee->delete();

            // Log the deletion for audit trail
            Log::info('Employee deleted', [
                'employee_id' => $id,
                'employee_name' => $employee->name,
                'deleted_by' => Auth::id(),
                'timestamp' => now(),
            ]);

            return response()->json(['message' => 'Employee deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting employee', [
                'error' => $e->getMessage(),
                'employee_id' => $id,
                'deleted_by' => Auth::id(),
            ]);

            return response()->json(['error' => 'Failed to delete employee'], 500);
        }
    }

    /**
     * Check if current user can modify the employee
     */
    private function canModifyEmployee($currentUser, $employee)
    {
        // Super admins can modify anyone
        if ($currentUser->hasRole('Super Administrator')) {
            return true;
        }

        // Administrators can modify employees
        if ($currentUser->hasRole('Administrator')) {
            return true;
        }

        // HR managers can modify employees in their organization
        if ($currentUser->hasRole('HR Manager')) {
            return true;
        }

        // Department managers can modify employees in their department
        if ($currentUser->hasRole('Department Manager') &&
            $currentUser->department_id === $employee->department_id) {
            return true;
        }

        // Check if user has the specific permission (fallback)
        if ($currentUser->can('users.update')) {
            return true;
        }

        // Users can only modify their own profile (limited fields)
        if ($currentUser->id === $employee->id) {
            return true;
        }

        return false;
    }

    /**
     * Check if current user can delete the employee
     */
    private function canDeleteEmployee($currentUser, $employee)
    {
        // Super admins can delete anyone (except themselves)
        if ($currentUser->hasRole('Super Administrator') && $currentUser->id !== $employee->id) {
            return true;
        }

        // HR managers can delete employees (except themselves)
        if ($currentUser->hasRole('HR Manager') && $currentUser->id !== $employee->id) {
            return true;
        }

        // Administrators can delete employees (except themselves)
        if ($currentUser->hasRole('Administrator') && $currentUser->id !== $employee->id) {
            return true;
        }

        // Check if user has the specific permission (fallback)
        if ($currentUser->can('users.delete') && $currentUser->id !== $employee->id) {
            return true;
        }

        // Users cannot delete themselves or others
        return false;
    }

    /**
     * Check for employee dependencies before deletion
     */
    private function checkEmployeeDependencies($employee)
    {
        $dependencies = [];

        // Check for active projects (if the table exists)
        try {
            if (Schema::hasTable('project_members')) {
                $activeProjects = DB::table('project_members')
                    ->join('projects', 'project_members.project_id', '=', 'projects.id')
                    ->where('project_members.user_id', $employee->id)
                    ->where('projects.status', 'active')
                    ->count();

                if ($activeProjects > 0) {
                    $dependencies['active_projects'] = $activeProjects;
                }
            }
        } catch (\Exception $e) {
            // Table doesn't exist, skip this check
        }

        // Check for pending leaves
        try {
            if (Schema::hasTable('leaves')) {
                $pendingLeaves = DB::table('leaves')
                    ->where('user_id', $employee->id)
                    ->where('status', 'pending')
                    ->count();

                if ($pendingLeaves > 0) {
                    $dependencies['pending_leaves'] = $pendingLeaves;
                }
            }
        } catch (\Exception $e) {
            // Table doesn't exist, skip this check
        }

        // Check for active trainings
        try {
            if (Schema::hasTable('training_enrollments')) {
                $activeTrainings = DB::table('training_enrollments')
                    ->join('trainings', 'training_enrollments.training_id', '=', 'trainings.id')
                    ->where('training_enrollments.user_id', $employee->id)
                    ->where('trainings.status', 'active')
                    ->count();

                if ($activeTrainings > 0) {
                    $dependencies['active_trainings'] = $activeTrainings;
                }
            }
        } catch (\Exception $e) {
            // Table doesn't exist, skip this check
        }

        return $dependencies;
    }

    /**
     * Restore a soft-deleted employee
     */
    public function restore($id)
    {
        try {
            $employee = User::withTrashed()->findOrFail($id);
            $employee->restore();
            $employee->active = true;
            $employee->save();

            return response()->json(['message' => 'Employee restored successfully']);
        } catch (\Exception $e) {
            Log::error('Error restoring employee', [
                'error' => $e->getMessage(),
                'employee_id' => $id,
            ]);

            return response()->json(['error' => 'Failed to restore employee'], 500);
        }
    }

    /**
     * Get paginated employees with filters
     */
    public function paginate(Request $request)
    {
        try {
            $perPage = $request->input('perPage', 10);
            $page = $request->input('page', 1);
            $search = $request->input('search', '');
            $department = $request->input('department');
            $designation = $request->input('designation');
            $attendanceType = $request->input('attendanceType');
            $status = $request->input('status');

            // Build query - no eager loading due to attribute/relationship name conflicts
            $query = User::query();

            // Include soft deleted if status filter includes inactive
            if ($status === 'all' || $status === 'inactive') {
                $query->withTrashed();
            }

            // Apply search filter
            if (! empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            }

            // Apply filters
            if (! empty($department) && $department !== 'all') {
                $query->where('department_id', $department);
            }

            if (! empty($designation) && $designation !== 'all') {
                $query->where('designation_id', $designation);
            }

            if (! empty($attendanceType) && $attendanceType !== 'all') {
                $query->where('attendance_type_id', $attendanceType);
            }

            if (! empty($status) && $status !== 'all') {
                switch ($status) {
                    case 'active':
                        $query->where('active', true);
                        break;
                    case 'inactive':
                        $query->where('active', false);
                        break;
                }
            }

            // Execute query with pagination
            $employees = $query->paginate($perPage, ['*'], 'page', $page);

            // Transform data for frontend
            $employees->getCollection()->transform(function ($employee) {
                // Get department name safely
                $departmentName = null;
                if ($employee->department_id) {
                    $dept = \App\Models\HRM\Department::find($employee->department_id);
                    $departmentName = $dept ? $dept->name : null;
                }

                // Get designation name safely
                $designationName = null;
                if ($employee->designation_id) {
                    $desig = \App\Models\HRM\Designation::find($employee->designation_id);
                    $designationName = $desig ? $desig->title : null;
                }

                // Get attendance type name safely
                $attendanceTypeName = null;
                if ($employee->attendance_type_id) {
                    $attType = \App\Models\HRM\AttendanceType::find($employee->attendance_type_id);
                    $attendanceTypeName = $attType ? $attType->name : null;
                }

                // Get designation hierarchy level
                $hierarchyLevel = 999;
                if ($employee->designation_id) {
                    $desig = \App\Models\HRM\Designation::find($employee->designation_id);
                    $hierarchyLevel = $desig ? ($desig->hierarchy_level ?? 999) : 999;
                }

                // Get reports_to info (current manager)
                $reportsTo = null;
                if ($employee->report_to) {
                    $manager = User::find($employee->report_to);
                    if ($manager) {
                        $managerDesigName = null;
                        if ($manager->designation_id) {
                            $managerDesig = \App\Models\HRM\Designation::find($manager->designation_id);
                            $managerDesigName = $managerDesig ? $managerDesig->title : null;
                        }
                        $reportsTo = [
                            'id' => $manager->id,
                            'name' => $manager->name,
                            'profile_image_url' => $manager->profile_image_url,
                            'designation_name' => $managerDesigName,
                        ];
                    }
                }

                return [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'employee_id' => $employee->employee_id,
                    'profile_image_url' => $employee->profile_image_url, // Use MediaLibrary-only approach
                    'active' => $employee->active,
                    'department_id' => $employee->department_id,
                    'department_name' => $departmentName,
                    'designation_id' => $employee->designation_id,
                    'designation_name' => $designationName,
                    'designation_hierarchy_level' => $hierarchyLevel,
                    'attendance_type_id' => $employee->attendance_type_id,
                    'attendance_type_name' => $attendanceTypeName,
                    'report_to' => $employee->report_to,
                    'reports_to' => $reportsTo,
                    'date_of_joining' => $employee->date_of_joining,
                    'created_at' => $employee->created_at,
                    'updated_at' => $employee->updated_at,
                    'deleted_at' => $employee->deleted_at,
                ];
            });

            // Get all potential managers (all users with their designation hierarchy)
            // This is needed for the Report To dropdown since current page may not include all managers
            $allManagers = User::with(['designation', 'department'])
                ->get()
                ->map(function ($user) {
                    // Get designation hierarchy level
                    $hierarchyLevel = 999;
                    if ($user->designation_id) {
                        $desig = \App\Models\HRM\Designation::find($user->designation_id);
                        $hierarchyLevel = $desig ? ($desig->hierarchy_level ?? 999) : 999;
                    }

                    // Get department name
                    $deptName = null;
                    if ($user->department_id) {
                        $dept = \App\Models\HRM\Department::find($user->department_id);
                        $deptName = $dept ? $dept->name : null;
                    }

                    // Get designation name
                    $desigName = null;
                    if ($user->designation_id) {
                        $desig = \App\Models\HRM\Designation::find($user->designation_id);
                        $desigName = $desig ? $desig->title : null;
                    }

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'profile_image_url' => $user->profile_image_url,
                        'department_id' => $user->department_id,
                        'department_name' => $deptName,
                        'designation_id' => $user->designation_id,
                        'designation_name' => $desigName,
                        'designation_hierarchy_level' => $hierarchyLevel,
                    ];
                });

            return response()->json([
                'employees' => $employees,
                'allManagers' => $allManagers,
                'stats' => $this->getEmployeeStats(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error paginating employees', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return response()->json(['error' => 'Failed to retrieve employees'], 500);
        }
    }

    /**
     * Get employee statistics
     */
    public function stats()
    {
        return response()->json(['stats' => $this->getEmployeeStats()]);
    }

    /**
     * Generate a unique employee ID
     */
    private function generateEmployeeId()
    {
        $prefix = 'EMP';
        $year = date('Y');
        $lastEmployee = User::where('employee_id', 'like', "{$prefix}{$year}%")
            ->orderByDesc('employee_id')
            ->first();

        if ($lastEmployee) {
            $lastNumber = (int) substr($lastEmployee->employee_id, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return $prefix.$year.$newNumber;
    }

    /**
     * Get comprehensive employee statistics
     */
    private function getEmployeeStats()
    {
        $totalEmployees = User::withTrashed()->count();
        $activeEmployees = User::where('active', true)->count();
        $inactiveEmployees = User::where('active', false)->count();

        // Department distribution
        $departmentStats = Department::withCount('users')
            ->get()
            ->map(function ($dept) use ($totalEmployees) {
                return [
                    'name' => $dept->name,
                    'count' => $dept->users_count,
                    'percentage' => $totalEmployees > 0 ? round(($dept->users_count / $totalEmployees) * 100, 1) : 0,
                ];
            });

        // Designation distribution
        $designationStats = Designation::withCount('users')
            ->get()
            ->map(function ($desig) use ($totalEmployees) {
                return [
                    'name' => $desig->title,
                    'count' => $desig->users_count,
                    'percentage' => $totalEmployees > 0 ? round(($desig->users_count / $totalEmployees) * 100, 1) : 0,
                ];
            });

        // Recent hires
        $now = now();
        $recentHires = [
            'last_30_days' => User::where('created_at', '>=', $now->copy()->subDays(30))->count(),
            'last_90_days' => User::where('created_at', '>=', $now->copy()->subDays(90))->count(),
            'last_year' => User::where('created_at', '>=', $now->copy()->subYear())->count(),
        ];

        return [
            'overview' => [
                'total_employees' => $totalEmployees,
                'active_employees' => $activeEmployees,
                'inactive_employees' => $inactiveEmployees,
                'total_departments' => Department::count(),
                'total_designations' => Designation::count(),
                'total_attendance_types' => AttendanceType::where('is_active', true)->count(),
            ],
            'distribution' => [
                'by_department' => $departmentStats,
                'by_designation' => $designationStats,
            ],
            'hiring_trends' => [
                'recent_hires' => $recentHires,
                'monthly_growth_rate' => 0, // Calculate based on your business logic
                'current_month_hires' => User::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
            ],
            'workforce_health' => [
                'status_ratio' => [
                    'active_percentage' => $totalEmployees > 0 ? round(($activeEmployees / $totalEmployees) * 100, 1) : 0,
                    'inactive_percentage' => $totalEmployees > 0 ? round(($inactiveEmployees / $totalEmployees) * 100, 1) : 0,
                ],
                'retention_rate' => $totalEmployees > 0 ? round(($activeEmployees / $totalEmployees) * 100, 1) : 0,
                'turnover_rate' => $totalEmployees > 0 ? round(($inactiveEmployees / $totalEmployees) * 100, 1) : 0,
            ],
        ];
    }
}
