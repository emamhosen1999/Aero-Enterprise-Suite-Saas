<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\Employee;
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
}
