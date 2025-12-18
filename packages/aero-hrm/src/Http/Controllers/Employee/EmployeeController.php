<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\AttendanceType;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Services\EmployeeOnboardingService;
use Aero\HRM\Notifications\WelcomeEmployeeNotification;
use Aero\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

/**
 * EmployeeController - Manages HRM Employee operations
 *
 * Architecture:
 * - User model: Authentication, basic profile (name, email, phone)
 * - Employee model: Employment data (department, designation, salary, dates)
 *
 * A User can exist without an Employee record (e.g., system users).
 * An Employee always has a User record (user_id foreign key).
 */
class EmployeeController extends Controller
{
    /**
     * Display a listing of employees (primary page)
     */
    public function index()
    {
        return Inertia::render('Pages/HRM/Employees/Index', [
            'title' => 'Employee Management',
            'departments' => Department::where('is_active', true)->get(),
            'designations' => Designation::where('is_active', true)->get(),
            'attendanceTypes' => AttendanceType::where('is_active', true)->get(),
        ]);
    }

    /**
     * Alias for index - legacy route support
     */
    public function index2()
    {
        return $this->index();
    }

    /**
     * Update employee's manager (report_to)
     */
    public function updateReportTo(Request $request, $id): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'report_to' => 'nullable|exists:users,id',
        ]);

        try {
            $user = User::findOrFail($id);

            // Get or create employee record
            $employee = Employee::where('user_id', $user->id)->first();
            if (! $employee) {
                return response()->json(['error' => 'User has no employee record'], 404);
            }

            // Don't allow self-reporting
            if ($request->report_to && $request->report_to == $user->id) {
                return response()->json(['error' => 'Employee cannot report to themselves'], 422);
            }

            // Update manager_id on employee
            $employee->update(['manager_id' => $request->report_to]);

            // Load the manager relationship
            $employee->load(['manager.employee.designation']);

            Log::info('Employee manager updated', [
                'employee_id' => $employee->id,
                'user_id' => $user->id,
                'old_manager_id' => $employee->getOriginal('manager_id'),
                'new_manager_id' => $request->report_to,
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Manager assignment updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'report_to' => $employee->manager_id,
                    'reports_to' => $employee->manager ? [
                        'id' => $employee->manager->id,
                        'name' => $employee->manager->name,
                        'profile_image_url' => $employee->manager->profile_image_url,
                        'designation_name' => $employee->manager->employee?->designation?->title,
                    ] : null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update manager assignment', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Failed to update manager assignment'], 500);
        }
    }

    /**
     * Update employee's attendance type
     */
    public function updateAttendanceType(Request $request, $id): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'attendance_type_id' => 'nullable|exists:attendance_types,id',
        ]);

        try {
            $user = User::findOrFail($id);
            $user->update(['attendance_type_id' => $request->attendance_type_id]);
            $user->load('attendanceType');

            Log::info('Employee attendance type updated', [
                'user_id' => $user->id,
                'old_type' => $user->getOriginal('attendance_type_id'),
                'new_type' => $request->attendance_type_id,
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Attendance type updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'attendance_type_id' => $user->attendance_type_id,
                    'attendance_type_name' => $user->attendanceType?->name,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update attendance type', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Failed to update attendance type'], 500);
        }
    }

    /**
     * Onboard a user as an employee.
     *
     * Converts an existing User to an Employee with automatic onboarding initialization.
     * This is the recommended way to create employees from existing users.
     *
     * @param  Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function onboard(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'employee_code' => 'nullable|string|unique:employees,employee_code',
            'department_id' => 'required|exists:departments,id',
            'designation_id' => 'required|exists:designations,id',
            'manager_id' => 'nullable|exists:users,id',
            'date_of_joining' => 'nullable|date',
            'probation_end_date' => 'nullable|date|after:date_of_joining',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern',
            'basic_salary' => 'nullable|numeric|min:0',
            'work_location' => 'nullable|string|max:255',
            'shift' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // 1. Validate user exists and doesn't already have employee record
            $user = User::findOrFail($request->user_id);

            $existingEmployee = Employee::where('user_id', $user->id)->first();
            if ($existingEmployee) {
                return response()->json([
                    'error' => 'User is already onboarded as an employee',
                    'employee_id' => $existingEmployee->id,
                ], 422);
            }

            // 2. Create Employee record with employment data
            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => $request->employee_code ?? $this->generateEmployeeCode(),
                'department_id' => $request->department_id,
                'designation_id' => $request->designation_id,
                'manager_id' => $request->manager_id,
                'date_of_joining' => $request->date_of_joining ?? now(),
                'probation_end_date' => $request->probation_end_date,
                'employment_type' => $request->employment_type ?? 'full_time',
                'basic_salary' => $request->basic_salary ?? 0,
                'work_location' => $request->work_location,
                'shift' => $request->shift,
                'status' => 'active',
            ]);

            // 3. Initialize Onboarding workflow with default tasks
            $onboardingService = app(EmployeeOnboardingService::class);
            $onboarding = $onboardingService->initializeOnboarding($employee);

            // 4. Assign default employee role if not already assigned
            if (! $user->hasRole('Employee')) {
                $user->assignRole('Employee');
            }

            // 5. Send WelcomeEmployeeNotification (queued)
            $user->notify(new WelcomeEmployeeNotification($employee, $onboarding));

            // 6. Log activity
            Log::info('User onboarded as employee', [
                'user_id' => $user->id,
                'employee_id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'onboarding_id' => $onboarding->id,
                'onboarded_by' => Auth::id(),
            ]);

            DB::commit();

            // Load relationships for response
            $employee->load(['user', 'department', 'designation', 'manager']);

            return response()->json([
                'message' => 'Employee onboarded successfully',
                'employee' => $this->transformEmployee($employee),
                'onboarding' => [
                    'id' => $onboarding->id,
                    'status' => $onboarding->status,
                    'tasks_count' => $onboarding->tasks->count(),
                    'expected_completion_date' => $onboarding->expected_completion_date->format('Y-m-d'),
                ],
                'redirect' => route('hrm.employees.show', $employee->id),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error onboarding user as employee', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user_id,
            ]);

            return response()->json([
                'error' => 'Failed to onboard employee: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk onboard multiple users as employees
     *
     * Processes multiple users with same employment details.
     * Each user is processed in its own transaction for isolation.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkOnboard(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|exists:users,id',
            'employee_code' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'designation_id' => 'required|exists:designations,id',
            'manager_id' => 'nullable|exists:users,id',
            'date_of_joining' => 'nullable|date',
            'probation_end_date' => 'nullable|date|after:date_of_joining',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern',
            'basic_salary' => 'nullable|numeric|min:0',
            'work_location' => 'nullable|string|max:255',
            'shift' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userIds = $request->user_ids;
        $successResults = [];
        $failedResults = [];

        foreach ($userIds as $userId) {
            DB::beginTransaction();
            try {
                // 1. Validate user exists and doesn't already have employee record
                $user = User::findOrFail($userId);

                $existingEmployee = Employee::where('user_id', $user->id)->first();
                if ($existingEmployee) {
                    $failedResults[] = [
                        'user_id' => $userId,
                        'message' => 'User already has an employee record',
                    ];
                    DB::rollBack();
                    continue;
                }

                // 2. Create Employee record
                $employee = Employee::create([
                    'user_id' => $user->id,
                    'employee_code' => $this->generateEmployeeCode(),
                    'department_id' => $request->department_id,
                    'designation_id' => $request->designation_id,
                    'manager_id' => $request->manager_id,
                    'date_of_joining' => $request->date_of_joining ?? now(),
                    'probation_end_date' => $request->probation_end_date,
                    'employment_type' => $request->employment_type ?? 'full_time',
                    'basic_salary' => $request->basic_salary ?? 0,
                    'work_location' => $request->work_location,
                    'shift' => $request->shift,
                    'status' => 'active',
                ]);

                // 3. Initialize Onboarding workflow
                $onboardingService = app(EmployeeOnboardingService::class);
                $onboarding = $onboardingService->initializeOnboarding($employee);

                // 4. Assign Employee role
                if (! $user->hasRole('Employee')) {
                    $user->assignRole('Employee');
                }

                // 5. Send notification
                $user->notify(new WelcomeEmployeeNotification($employee, $onboarding));

                // 6. Log activity
                Log::info('User bulk onboarded as employee', [
                    'user_id' => $user->id,
                    'employee_id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'onboarding_id' => $onboarding->id,
                    'onboarded_by' => Auth::id(),
                ]);

                DB::commit();

                $successResults[] = [
                    'user_id' => $userId,
                    'employee_id' => $employee->id,
                    'message' => 'Successfully onboarded',
                ];
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error in bulk onboarding user', [
                    'error' => $e->getMessage(),
                    'user_id' => $userId,
                ]);

                $failedResults[] = [
                    'user_id' => $userId,
                    'message' => 'Failed: ' . $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => $successResults,
            'failed' => $failedResults,
            'summary' => [
                'total' => count($userIds),
                'succeeded' => count($successResults),
                'failed' => count($failedResults),
            ],
        ], 200);
    }

    /**
     * Store a newly created employee
     *
     * Creates both User and Employee records in a transaction.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|unique:users,phone',
            'employee_code' => 'nullable|string|unique:employees,employee_code',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'attendance_type_id' => 'nullable|exists:attendance_types,id',
            'date_of_joining' => 'nullable|date',
            'birthday' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'address' => 'nullable|string',
            'password' => 'required|string|min:8|confirmed',
            'basic_salary' => 'nullable|numeric|min:0',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern',
            'active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Create User record (authentication & basic profile)
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'birthday' => $request->birthday,
                'gender' => $request->gender,
                'password' => Hash::make($request->password),
                'active' => $request->active ?? true,
                'user_name' => $request->email,
            ]);

            // Create Employee record (employment data)
            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => $request->employee_code ?? $this->generateEmployeeCode(),
                'department_id' => $request->department_id,
                'designation_id' => $request->designation_id,
                'date_of_joining' => $request->date_of_joining ?? now(),
                'basic_salary' => $request->basic_salary ?? 0,
                'employment_type' => $request->employment_type ?? 'full_time',
                'status' => 'active',
            ]);

            // Set attendance type on user if provided
            if ($request->attendance_type_id) {
                $user->update(['attendance_type_id' => $request->attendance_type_id]);
            }

            // Assign default employee role
            $user->assignRole('Employee');

            // Initialize onboarding workflow
            $onboardingService = app(EmployeeOnboardingService::class);
            $onboarding = $onboardingService->initializeOnboarding($employee);

            // Send welcome notification
            $user->notify(new WelcomeEmployeeNotification($employee, $onboarding));

            DB::commit();

            // Load relationships for response
            $employee->load(['user', 'department', 'designation']);

            return response()->json([
                'message' => 'Employee created successfully',
                'employee' => $this->transformEmployee($employee),
                'onboarding_id' => $onboarding->id,
                'redirect' => route('hrm.onboarding.wizard', $employee->id),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating employee', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->except(['password', 'password_confirmation']),
            ]);

            return response()->json(['error' => 'Failed to create employee: '.$e->getMessage()], 500);
        }
    }

    /**
     * Display the specified employee
     */
    public function show($id)
    {
        // Try to find by employee ID first, then by user ID
        $employee = Employee::with(['user', 'department', 'designation', 'manager'])
            ->where('id', $id)
            ->orWhere('user_id', $id)
            ->first();

        if (! $employee) {
            // Fallback: Check if user exists but has no employee record
            $user = User::find($id);
            if ($user) {
                return response()->json([
                    'employee' => [
                        'id' => null,
                        'user_id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'is_employee' => false,
                        'message' => 'User exists but has no employee record',
                    ],
                ]);
            }

            return response()->json(['error' => 'Employee not found'], 404);
        }

        return response()->json(['employee' => $this->transformEmployee($employee)]);
    }

    /**
     * Update the specified employee
     */
    public function update(Request $request, $id)
    {
        try {
            // Find employee by ID or user_id
            $employee = Employee::with('user')
                ->where('id', $id)
                ->orWhere('user_id', $id)
                ->first();

            if (! $employee) {
                return response()->json(['error' => 'Employee not found'], 404);
            }

            $user = $employee->user;
            $currentUser = Auth::user();

            if (! $this->canModifyEmployee($currentUser, $employee)) {
                return response()->json(['error' => 'Unauthorized to modify this employee'], 403);
            }

            $validated = $request->validate([
                // User fields
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,'.$user->id,
                'phone' => 'sometimes|nullable|string|max:20',
                'active' => 'sometimes|boolean',
                // Employee fields
                'department_id' => 'sometimes|nullable|exists:departments,id',
                'designation_id' => 'sometimes|nullable|exists:designations,id',
                'manager_id' => 'sometimes|nullable|exists:users,id',
                'basic_salary' => 'sometimes|nullable|numeric|min:0',
                'employment_type' => 'sometimes|nullable|in:full_time,part_time,contract,intern',
                'date_of_joining' => 'sometimes|nullable|date',
                'attendance_type_id' => 'sometimes|nullable|exists:attendance_types,id',
            ]);

            DB::beginTransaction();

            // Update User fields
            $userFields = array_intersect_key($validated, array_flip(['name', 'email', 'phone', 'active', 'attendance_type_id']));
            if (! empty($userFields)) {
                $user->update($userFields);
            }

            // Update Employee fields
            $employeeFields = array_intersect_key($validated, array_flip([
                'department_id', 'designation_id', 'manager_id', 'basic_salary',
                'employment_type', 'date_of_joining',
            ]));
            if (! empty($employeeFields)) {
                $employee->update($employeeFields);
            }

            DB::commit();

            Log::info('Employee updated', [
                'employee_id' => $employee->id,
                'user_id' => $user->id,
                'updated_by' => Auth::id(),
            ]);

            $employee->load(['user', 'department', 'designation', 'manager']);

            return response()->json([
                'message' => 'Employee updated successfully',
                'employee' => $this->transformEmployee($employee),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating employee', [
                'error' => $e->getMessage(),
                'employee_id' => $id,
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
            $employee = Employee::with('user')
                ->where('id', $id)
                ->orWhere('user_id', $id)
                ->first();

            if (! $employee) {
                return response()->json(['error' => 'Employee not found'], 404);
            }

            $currentUser = Auth::user();
            if (! $this->canDeleteEmployee($currentUser, $employee)) {
                return response()->json(['error' => 'Unauthorized to delete this employee'], 403);
            }

            $dependencies = $this->checkEmployeeDependencies($employee);
            if (! empty($dependencies)) {
                return response()->json([
                    'error' => 'Cannot delete employee with active dependencies',
                    'dependencies' => $dependencies,
                ], 422);
            }

            DB::beginTransaction();

            // Update employee status
            $employee->status = 'terminated';
            $employee->date_of_leaving = now();
            $employee->save();
            $employee->delete(); // Soft delete

            // Deactivate user
            $employee->user->update(['active' => false]);

            DB::commit();

            Log::info('Employee deleted', [
                'employee_id' => $employee->id,
                'user_id' => $employee->user_id,
                'deleted_by' => Auth::id(),
            ]);

            return response()->json(['message' => 'Employee deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting employee', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Failed to delete employee'], 500);
        }
    }

    /**
     * Restore a soft-deleted employee
     */
    public function restore($id)
    {
        try {
            $employee = Employee::withTrashed()
                ->where('id', $id)
                ->orWhere('user_id', $id)
                ->first();

            if (! $employee) {
                return response()->json(['error' => 'Employee not found'], 404);
            }

            $employee->restore();
            $employee->status = 'active';
            $employee->date_of_leaving = null;
            $employee->save();

            $employee->user->update(['active' => true]);

            return response()->json(['message' => 'Employee restored successfully']);
        } catch (\Exception $e) {
            Log::error('Error restoring employee', ['error' => $e->getMessage()]);

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

            // Query employees with relationships
            $query = Employee::with(['user', 'department', 'designation', 'manager.employee.designation']);

            // Include soft deleted if status filter includes inactive
            if ($status === 'all' || $status === 'inactive') {
                $query->withTrashed();
            }

            // Apply search filter (searches in user table)
            if (! empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('employee_code', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
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
                $query->whereHas('user', function ($q) use ($attendanceType) {
                    $q->where('attendance_type_id', $attendanceType);
                });
            }

            if (! empty($status) && $status !== 'all') {
                switch ($status) {
                    case 'active':
                        $query->where('status', 'active');
                        break;
                    case 'inactive':
                        $query->whereIn('status', ['resigned', 'terminated', 'retired']);
                        break;
                }
            }

            // Execute query with pagination
            $employees = $query->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Transform data for frontend
            $employees->getCollection()->transform(fn ($employee) => $this->transformEmployee($employee));

            // Get all potential managers
            $allManagers = Employee::with(['user', 'department', 'designation'])
                ->whereHas('user', fn ($q) => $q->where('active', true))
                ->get()
                ->map(fn ($emp) => [
                    'id' => $emp->user_id,
                    'name' => $emp->user->name,
                    'profile_image_url' => $emp->user->profile_image_url,
                    'department_id' => $emp->department_id,
                    'department_name' => $emp->department?->name,
                    'designation_id' => $emp->designation_id,
                    'designation_name' => $emp->designation?->title,
                    'designation_hierarchy_level' => $emp->designation?->hierarchy_level ?? 999,
                ]);

            return response()->json([
                'employees' => $employees,
                'allManagers' => $allManagers,
                'stats' => $this->getEmployeeStats(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error paginating employees', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Failed to retrieve employees: '.$e->getMessage()], 500);
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
     * Transform Employee model to API response format
     */
    private function transformEmployee(Employee $employee): array
    {
        $user = $employee->user;
        $manager = $employee->manager;
        $managerEmployee = $manager?->employee;

        return [
            'id' => $user->id, // Use user_id as primary ID for frontend compatibility
            'employee_id' => $employee->id, // Actual employee record ID
            'user_id' => $employee->user_id,
            'employee_code' => $employee->employee_code,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'profile_image_url' => $user->profile_image_url,
            'active' => $user->active,
            'department_id' => $employee->department_id,
            'department_name' => $employee->department?->name,
            'designation_id' => $employee->designation_id,
            'designation_name' => $employee->designation?->title,
            'designation_hierarchy_level' => $employee->designation?->hierarchy_level ?? 999,
            'attendance_type_id' => $user->attendance_type_id,
            'attendance_type_name' => $user->attendanceType?->name,
            'manager_id' => $employee->manager_id,
            'report_to' => $employee->manager_id, // Alias for frontend compatibility
            'reports_to' => $manager ? [
                'id' => $manager->id,
                'name' => $manager->name,
                'profile_image_url' => $manager->profile_image_url,
                'designation_name' => $managerEmployee?->designation?->title,
            ] : null,
            'date_of_joining' => $employee->date_of_joining,
            'date_of_leaving' => $employee->date_of_leaving,
            'employment_type' => $employee->employment_type,
            'status' => $employee->status,
            'basic_salary' => $employee->basic_salary,
            'created_at' => $employee->created_at,
            'updated_at' => $employee->updated_at,
            'deleted_at' => $employee->deleted_at,
        ];
    }

    /**
     * Generate a unique employee code
     */
    private function generateEmployeeCode(): string
    {
        $prefix = 'EMP';
        $year = date('Y');
        $lastEmployee = Employee::where('employee_code', 'like', "{$prefix}{$year}%")
            ->orderByDesc('employee_code')
            ->first();

        if ($lastEmployee) {
            $lastNumber = (int) substr($lastEmployee->employee_code, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return $prefix.$year.$newNumber;
    }

    /**
     * Check if current user can modify the employee
     */
    private function canModifyEmployee($currentUser, Employee $employee): bool
    {
        if ($currentUser->hasAnyRole(['Super Administrator', 'Administrator', 'HR Manager'])) {
            return true;
        }

        // Department managers can modify employees in their department
        if ($currentUser->hasRole('Department Manager')) {
            $currentUserEmployee = Employee::where('user_id', $currentUser->id)->first();
            if ($currentUserEmployee && $currentUserEmployee->department_id === $employee->department_id) {
                return true;
            }
        }

        if ($currentUser->can('users.update')) {
            return true;
        }

        // Users can modify their own profile
        if ($currentUser->id === $employee->user_id) {
            return true;
        }

        return false;
    }

    /**
     * Check if current user can delete the employee
     */
    private function canDeleteEmployee($currentUser, Employee $employee): bool
    {
        // Cannot delete yourself
        if ($currentUser->id === $employee->user_id) {
            return false;
        }

        if ($currentUser->hasAnyRole(['Super Administrator', 'Administrator', 'HR Manager'])) {
            return true;
        }

        if ($currentUser->can('users.delete')) {
            return true;
        }

        return false;
    }

    /**
     * Check for employee dependencies before deletion
     */
    private function checkEmployeeDependencies(Employee $employee): array
    {
        $dependencies = [];
        $userId = $employee->user_id;

        try {
            if (Schema::hasTable('project_members')) {
                $activeProjects = DB::table('project_members')
                    ->join('projects', 'project_members.project_id', '=', 'projects.id')
                    ->where('project_members.user_id', $userId)
                    ->where('projects.status', 'active')
                    ->count();

                if ($activeProjects > 0) {
                    $dependencies['active_projects'] = $activeProjects;
                }
            }
        } catch (\Exception $e) {
            // Skip if table doesn't exist
        }

        try {
            if (Schema::hasTable('leaves')) {
                $pendingLeaves = DB::table('leaves')
                    ->where('user_id', $userId)
                    ->where('status', 'pending')
                    ->count();

                if ($pendingLeaves > 0) {
                    $dependencies['pending_leaves'] = $pendingLeaves;
                }
            }
        } catch (\Exception $e) {
            // Skip if table doesn't exist
        }

        // Check if employee is a manager for others
        $subordinates = Employee::where('manager_id', $userId)->count();
        if ($subordinates > 0) {
            $dependencies['subordinates'] = $subordinates;
        }

        return $dependencies;
    }

    /**
     * Get comprehensive employee statistics
     */
    private function getEmployeeStats(): array
    {
        $totalEmployees = Employee::withTrashed()->count();
        $activeEmployees = Employee::where('status', 'active')->count();
        $inactiveEmployees = Employee::whereIn('status', ['resigned', 'terminated', 'retired'])->count();

        $departmentStats = Department::withCount(['employees' => fn ($q) => $q->where('status', 'active')])
            ->get()
            ->map(fn ($dept) => [
                'name' => $dept->name,
                'count' => $dept->employees_count,
                'percentage' => $totalEmployees > 0 ? round(($dept->employees_count / $totalEmployees) * 100, 1) : 0,
            ]);

        $designationStats = Designation::withCount(['employees' => fn ($q) => $q->where('status', 'active')])
            ->get()
            ->map(fn ($desig) => [
                'name' => $desig->title,
                'count' => $desig->employees_count,
                'percentage' => $totalEmployees > 0 ? round(($desig->employees_count / $totalEmployees) * 100, 1) : 0,
            ]);

        $now = now();
        $recentHires = [
            'last_30_days' => Employee::where('date_of_joining', '>=', $now->copy()->subDays(30))->count(),
            'last_90_days' => Employee::where('date_of_joining', '>=', $now->copy()->subDays(90))->count(),
            'last_year' => Employee::where('date_of_joining', '>=', $now->copy()->subYear())->count(),
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
                'monthly_growth_rate' => 0,
                'current_month_hires' => Employee::whereMonth('date_of_joining', now()->month)
                    ->whereYear('date_of_joining', now()->year)
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

    /**
     * Get users who haven't been onboarded as employees yet (pending onboarding).
     *
     * Used by UI to display users that can be converted to employees.
     *
     * @param  Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPendingOnboarding(Request $request)
    {
        try {
            $query = User::whereDoesntHave('employee')
                ->when($request->search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                    });
                })
                ->with('roles')
                ->orderBy('created_at', 'desc');

            $users = $query->paginate($request->per_page ?? 20);

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Failed to fetch pending onboarding users', [
                'error' => $e->getMessage(),
                'user' => Auth::id(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch pending onboarding users',
            ], 500);
        }
    }

    /**
     * Get onboarding analytics data
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOnboardingAnalytics(Request $request)
    {
        try {
            $days = $request->get('days', 30);
            
            // Validate days parameter
            if (!is_numeric($days) || $days < 1 || $days > 365) {
                return response()->json([
                    'error' => 'Days parameter must be between 1 and 365',
                ], 400);
            }
            
            // Get analytics data with caching (5 minutes)
            $cacheKey = "onboarding_analytics_{$days}_days";
            $analytics = cache()->remember($cacheKey, 300, function () use ($days) {
                return \Aero\HRM\Models\Onboarding::getAnalytics((int) $days);
            });
            
            return response()->json($analytics);
        } catch (\Exception $e) {
            Log::error('Failed to fetch onboarding analytics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user' => Auth::id(),
            ]);
            
            return response()->json([
                'error' => 'Failed to fetch onboarding analytics',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
