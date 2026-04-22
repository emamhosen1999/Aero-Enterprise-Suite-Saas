<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Http\Requests\SubmitSelfServiceBenefitEnrollmentRequest;
use Aero\HRM\Models\BenefitOpenEnrollmentPeriod;
use Aero\HRM\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BenefitsController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 30);
        $search = $request->input('search');
        $type = $request->input('type');
        $status = $request->input('status');

        $query = DB::table('benefit_plans');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($type) {
            $query->where('type', $type);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $benefits = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Check if this is an API request
        if ($request->wantsJson()) {
            return response()->json([
                'plans' => $benefits,
            ]);
        }

        return Inertia::render('HRM/Benefits/Index', [
            'title' => 'Employee Benefits',
            'benefits' => $benefits,
        ]);
    }

    /**
     * Get benefit stats.
     */
    public function stats()
    {
        $totalPlans = DB::table('benefit_plans')->count();
        $activePlans = DB::table('benefit_plans')->where('status', 'active')->count();
        $activeEnrollments = DB::table('benefit_enrollments')->where('status', 'active')->count();
        $pendingEnrollments = DB::table('benefit_enrollments')->where('status', 'pending')->count();
        $totalCost = DB::table('benefit_enrollments')
            ->where('status', 'active')
            ->sum('employer_contribution') ?? 0;

        return response()->json([
            'total_plans' => $totalPlans,
            'active_plans' => $activePlans,
            'active_enrollments' => $activeEnrollments,
            'pending_enrollments' => $pendingEnrollments,
            'total_cost' => $totalCost,
        ]);
    }

    /**
     * Get benefit enrollments.
     */
    public function enrollments(Request $request)
    {
        $perPage = $request->input('per_page', 30);
        $search = $request->input('search');
        $status = $request->input('status');

        $query = DB::table('benefit_enrollments')
            ->join('benefit_plans', 'benefit_enrollments.benefit_plan_id', '=', 'benefit_plans.id')
            ->join('employees', 'benefit_enrollments.employee_id', '=', 'employees.id')
            ->select(
                'benefit_enrollments.*',
                'benefit_plans.name as plan_name',
                'benefit_plans.type as plan_type',
                'employees.full_name as employee_name'
            );

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('employees.full_name', 'like', "%{$search}%")
                    ->orWhere('benefit_plans.name', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('benefit_enrollments.status', $status);
        }

        $enrollments = $query->orderBy('benefit_enrollments.created_at', 'desc')->paginate($perPage);

        return response()->json([
            'enrollments' => $enrollments,
        ]);
    }

    public function openEnrollmentPeriods(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 15);
        $status = $request->input('status');
        $currentOnly = $request->boolean('current_only');
        $today = now()->toDateString();

        $query = BenefitOpenEnrollmentPeriod::query()->orderByDesc('starts_at');

        if ($status) {
            $query->where('status', $status);
        }

        if ($currentOnly) {
            $query->current($today);
        }

        $periods = $query->paginate($perPage)->through(function (BenefitOpenEnrollmentPeriod $period) use ($today) {
            return $this->formatOpenEnrollmentPeriod($period, $today);
        });

        return response()->json([
            'periods' => $periods,
            'filters' => [
                'status' => $status,
                'current_only' => $currentOnly,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function selfServiceEnrollmentPayload(Request $request): JsonResponse
    {
        $employee = $this->resolveAuthenticatedEmployee($request);
        $today = now()->toDateString();
        $activePeriod = $this->getActiveOpenEnrollmentPeriod($today);
        $currentEnrollments = $this->getCurrentEmployeeEnrollments($employee);

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'full_name' => $employee->full_name,
            ],
            'active_period' => $activePeriod ? $this->formatOpenEnrollmentPeriod($activePeriod, $today) : null,
            'available_plans' => $this->getAvailableBenefitPlans($employee, $activePeriod),
            'current_enrollments' => $currentEnrollments,
            'can_submit' => $activePeriod !== null,
        ]);
    }

    public function submitSelfServiceEnrollment(SubmitSelfServiceBenefitEnrollmentRequest $request): JsonResponse
    {
        $employee = $this->resolveAuthenticatedEmployee($request);
        $today = now()->toDateString();
        $activePeriod = $this->getActiveOpenEnrollmentPeriod($today);

        if ($activePeriod === null) {
            return $this->openEnrollmentUnavailableResponse('There is no active open enrollment period right now.');
        }

        $validated = $request->validated();
        $plan = $this->findAvailableBenefitPlan((int) $validated['benefit_plan_id'], $activePeriod);

        if ($plan === null) {
            return response()->json([
                'message' => 'The selected benefit plan is not available for the active open enrollment period.',
                'errors' => [
                    'benefit_plan_id' => ['The selected benefit plan is not available for the active open enrollment period.'],
                ],
            ], 422);
        }

        $existingEnrollment = DB::table('benefit_enrollments')
            ->where('employee_id', $employee->id)
            ->where('benefit_plan_id', $plan->id)
            ->where('benefit_open_enrollment_period_id', $activePeriod->id)
            ->whereIn('status', ['pending', 'active'])
            ->whereNull('deleted_at')
            ->first();

        if ($existingEnrollment !== null) {
            return response()->json([
                'message' => 'You already have a pending or active enrollment request for this plan in the current open enrollment period.',
                'errors' => [
                    'benefit_plan_id' => ['You already have a pending or active enrollment request for this plan in the current open enrollment period.'],
                ],
            ], 422);
        }

        $effectiveDate = $validated['effective_date']
            ?? $plan->effective_date
            ?? $activePeriod->ends_at->copy()->addDay()->toDateString();

        $enrollmentId = DB::transaction(function () use ($activePeriod, $employee, $validated, $plan, $effectiveDate) {
            return DB::table('benefit_enrollments')->insertGetId([
                'employee_id' => $employee->id,
                'benefit_plan_id' => $plan->id,
                'benefit_open_enrollment_period_id' => $activePeriod->id,
                'enrollment_date' => now()->toDateString(),
                'effective_date' => $effectiveDate,
                'coverage_level' => $validated['coverage_level'],
                'employee_contribution' => $plan->employee_contribution ?? 0,
                'employer_contribution' => $plan->employer_contribution ?? 0,
                'status' => 'pending',
                'dependents' => isset($validated['dependents']) ? json_encode($validated['dependents']) : null,
                'beneficiaries' => isset($validated['beneficiaries']) ? json_encode($validated['beneficiaries']) : null,
                'notes' => $validated['notes'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $enrollment = DB::table('benefit_enrollments as enrollments')
            ->join('benefit_plans as plans', 'enrollments.benefit_plan_id', '=', 'plans.id')
            ->leftJoin('benefit_open_enrollment_periods as periods', 'enrollments.benefit_open_enrollment_period_id', '=', 'periods.id')
            ->where('enrollments.id', $enrollmentId)
            ->select(
                'enrollments.id',
                'enrollments.benefit_plan_id',
                'enrollments.benefit_open_enrollment_period_id',
                'enrollments.coverage_level',
                'enrollments.status',
                'enrollments.enrollment_date',
                'enrollments.effective_date',
                'enrollments.termination_date',
                'enrollments.employee_contribution',
                'enrollments.employer_contribution',
                'enrollments.notes',
                'plans.name as plan_name',
                'plans.type as plan_type',
                'periods.name as open_enrollment_period_name'
            )
            ->first();

        return response()->json([
            'message' => 'Benefit enrollment request submitted successfully.',
            'enrollment' => $this->formatEnrollmentRecord($enrollment),
        ], 201);
    }

    public function create()
    {
        return Inertia::render('HRM/Benefits/Create', [
            'title' => 'Create Benefit',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'provider' => 'nullable|string',
            'coverage_details' => 'nullable|string',
            'employer_contribution' => 'nullable|numeric|min:0',
            'employee_contribution' => 'nullable|numeric|min:0',
            'eligibility_criteria' => 'nullable|string',
            'status' => 'required|in:active,inactive,draft',
        ]);

        $id = DB::table('benefit_plans')->insertGetId([
            ...$validated,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Benefit plan created successfully',
                'id' => $id,
            ]);
        }

        return redirect()->route('hrm.benefits.index')->with('success', 'Benefit created successfully');
    }

    public function show($id)
    {
        $benefit = DB::table('benefit_plans')->where('id', $id)->first();

        return Inertia::render('HRM/Benefits/Show', [
            'title' => 'Benefit Details',
            'benefit' => $benefit,
        ]);
    }

    public function edit($id)
    {
        $benefit = DB::table('benefit_plans')->where('id', $id)->first();

        return Inertia::render('HRM/Benefits/Edit', [
            'title' => 'Edit Benefit',
            'benefit' => $benefit,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string',
            'description' => 'nullable|string',
            'provider' => 'nullable|string',
            'coverage_details' => 'nullable|string',
            'employer_contribution' => 'nullable|numeric|min:0',
            'employee_contribution' => 'nullable|numeric|min:0',
            'eligibility_criteria' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive,draft',
        ]);

        DB::table('benefit_plans')->where('id', $id)->update([
            ...$validated,
            'updated_at' => now(),
        ]);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Benefit plan updated successfully']);
        }

        return redirect()->route('hrm.benefits.index')->with('success', 'Benefit updated successfully');
    }

    public function destroy($id)
    {
        DB::table('benefit_plans')->where('id', $id)->delete();

        return response()->json(['message' => 'Benefit plan deleted successfully']);
    }

    /**
     * Store a new enrollment.
     */
    public function storeEnrollment(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'benefit_plan_id' => 'required|exists:benefit_plans,id',
            'coverage_level' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'status' => 'required|in:pending,active,inactive,cancelled',
        ]);

        $plan = DB::table('benefit_plans')->where('id', $validated['benefit_plan_id'])->first();

        $id = DB::table('benefit_enrollments')->insertGetId([
            ...$validated,
            'employer_contribution' => $plan->employer_contribution ?? 0,
            'employee_contribution' => $plan->employee_contribution ?? 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Employee enrolled successfully',
            'id' => $id,
        ]);
    }

    /**
     * Approve an enrollment.
     */
    public function approveEnrollment($id)
    {
        DB::table('benefit_enrollments')->where('id', $id)->update([
            'status' => 'active',
            'approved_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Enrollment approved successfully']);
    }

    public function employeeBenefits($employeeId)
    {
        $employee = Employee::findOrFail($employeeId);
        $benefits = DB::table('benefit_enrollments')
            ->join('benefit_plans', 'benefit_enrollments.benefit_plan_id', '=', 'benefit_plans.id')
            ->where('benefit_enrollments.employee_id', $employeeId)
            ->select('benefit_enrollments.*', 'benefit_plans.name as plan_name', 'benefit_plans.type as plan_type')
            ->get();

        return Inertia::render('HRM/Benefits/EmployeeBenefits', [
            'title' => 'Employee Benefits',
            'employeeId' => $employeeId,
            'employee' => $employee,
            'benefits' => $benefits,
        ]);
    }

    public function assignBenefit(Request $request, $employeeId)
    {
        $request->merge(['employee_id' => $employeeId]);

        return $this->storeEnrollment($request);
    }

    public function updateEmployeeBenefit(Request $request, $employeeId, $benefitId)
    {
        $validated = $request->validate([
            'coverage_level' => 'sometimes|string',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after:start_date',
            'status' => 'sometimes|in:pending,active,inactive,cancelled',
        ]);

        DB::table('benefit_enrollments')
            ->where('id', $benefitId)
            ->where('employee_id', $employeeId)
            ->update([
                ...$validated,
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Employee benefit updated successfully']);
    }

    public function removeEmployeeBenefit($employeeId, $benefitId)
    {
        DB::table('benefit_enrollments')
            ->where('id', $benefitId)
            ->where('employee_id', $employeeId)
            ->delete();

        return response()->json(['message' => 'Benefit removed from employee successfully']);
    }

    private function resolveAuthenticatedEmployee(Request $request): Employee
    {
        $user = $request->user();

        abort_unless($user !== null, 401, 'Unauthenticated.');

        $employee = Employee::query()->where('user_id', $user->id)->first();

        abort_unless($employee !== null, 403, 'Authenticated user is not linked to an employee record.');

        return $employee;
    }

    private function getActiveOpenEnrollmentPeriod(string $today): ?BenefitOpenEnrollmentPeriod
    {
        return BenefitOpenEnrollmentPeriod::query()
            ->active()
            ->current($today)
            ->orderByDesc('starts_at')
            ->first();
    }

    private function getAvailableBenefitPlans(Employee $employee, ?BenefitOpenEnrollmentPeriod $activePeriod): array
    {
        $referenceStart = $activePeriod?->starts_at?->toDateString() ?? now()->toDateString();
        $referenceEnd = $activePeriod?->ends_at?->toDateString() ?? now()->toDateString();
        $existingEnrollments = collect($this->getCurrentEmployeeEnrollments($employee))->keyBy('benefit_plan_id');

        return DB::table('benefit_plans')
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->where(function ($query) use ($referenceEnd) {
                $query->whereNull('effective_date')
                    ->orWhereDate('effective_date', '<=', $referenceEnd);
            })
            ->where(function ($query) use ($referenceStart) {
                $query->whereNull('expiration_date')
                    ->orWhereDate('expiration_date', '>=', $referenceStart);
            })
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(function ($plan) use ($existingEnrollments) {
                $currentEnrollment = $existingEnrollments->get($plan->id);

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'description' => $plan->description,
                    'type' => $plan->type,
                    'provider_name' => $plan->provider_name,
                    'employee_contribution' => (float) ($plan->employee_contribution ?? 0),
                    'employer_contribution' => (float) ($plan->employer_contribution ?? 0),
                    'contribution_frequency' => $plan->contribution_frequency,
                    'effective_date' => $plan->effective_date,
                    'expiration_date' => $plan->expiration_date,
                    'status' => $plan->status,
                    'coverage_details' => $this->decodeJsonField($plan->coverage_details),
                    'eligibility_criteria' => $this->decodeJsonField($plan->eligibility_criteria),
                    'current_enrollment' => $currentEnrollment,
                ];
            })
            ->values()
            ->all();
    }

    private function getCurrentEmployeeEnrollments(Employee $employee): array
    {
        return DB::table('benefit_enrollments as enrollments')
            ->join('benefit_plans as plans', 'enrollments.benefit_plan_id', '=', 'plans.id')
            ->leftJoin('benefit_open_enrollment_periods as periods', 'enrollments.benefit_open_enrollment_period_id', '=', 'periods.id')
            ->where('enrollments.employee_id', $employee->id)
            ->whereIn('enrollments.status', ['pending', 'active'])
            ->whereNull('enrollments.deleted_at')
            ->orderByDesc('enrollments.created_at')
            ->select(
                'enrollments.id',
                'enrollments.benefit_plan_id',
                'enrollments.benefit_open_enrollment_period_id',
                'enrollments.coverage_level',
                'enrollments.status',
                'enrollments.enrollment_date',
                'enrollments.effective_date',
                'enrollments.termination_date',
                'enrollments.employee_contribution',
                'enrollments.employer_contribution',
                'enrollments.notes',
                'plans.name as plan_name',
                'plans.type as plan_type',
                'periods.name as open_enrollment_period_name'
            )
            ->get()
            ->map(fn ($enrollment) => $this->formatEnrollmentRecord($enrollment))
            ->all();
    }

    private function findAvailableBenefitPlan(int $benefitPlanId, BenefitOpenEnrollmentPeriod $activePeriod): ?object
    {
        return DB::table('benefit_plans')
            ->where('id', $benefitPlanId)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->where(function ($query) use ($activePeriod) {
                $query->whereNull('effective_date')
                    ->orWhereDate('effective_date', '<=', $activePeriod->ends_at->toDateString());
            })
            ->where(function ($query) use ($activePeriod) {
                $query->whereNull('expiration_date')
                    ->orWhereDate('expiration_date', '>=', $activePeriod->starts_at->toDateString());
            })
            ->first();
    }

    private function formatOpenEnrollmentPeriod(BenefitOpenEnrollmentPeriod $period, string $today): array
    {
        return [
            'id' => $period->id,
            'name' => $period->name,
            'starts_at' => $period->starts_at?->toDateString(),
            'ends_at' => $period->ends_at?->toDateString(),
            'status' => $period->status,
            'description' => $period->description,
            'created_by' => $period->created_by,
            'is_current' => $period->isCurrent($today),
            'days_remaining' => $period->ends_at?->diffInDays(now(), false) <= 0
                ? abs($period->ends_at?->diffInDays(now(), false) ?? 0)
                : 0,
            'created_at' => $period->created_at?->toDateTimeString(),
            'updated_at' => $period->updated_at?->toDateTimeString(),
        ];
    }

    private function formatEnrollmentRecord(?object $enrollment): ?array
    {
        if ($enrollment === null) {
            return null;
        }

        return [
            'id' => $enrollment->id,
            'benefit_plan_id' => $enrollment->benefit_plan_id,
            'benefit_open_enrollment_period_id' => $enrollment->benefit_open_enrollment_period_id,
            'plan_name' => $enrollment->plan_name,
            'plan_type' => $enrollment->plan_type,
            'coverage_level' => $enrollment->coverage_level,
            'status' => $enrollment->status,
            'enrollment_date' => $enrollment->enrollment_date,
            'effective_date' => $enrollment->effective_date,
            'termination_date' => $enrollment->termination_date,
            'employee_contribution' => (float) ($enrollment->employee_contribution ?? 0),
            'employer_contribution' => (float) ($enrollment->employer_contribution ?? 0),
            'notes' => $enrollment->notes,
            'open_enrollment_period_name' => $enrollment->open_enrollment_period_name ?? null,
        ];
    }

    private function decodeJsonField(mixed $value): mixed
    {
        if (! is_string($value) || $value === '') {
            return $value;
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
    }

    private function openEnrollmentUnavailableResponse(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => [
                'period' => [$message],
            ],
        ], 422);
    }
}
