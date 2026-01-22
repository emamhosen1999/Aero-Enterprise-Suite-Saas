<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\CompensationReview;
use Aero\HRM\Models\CompensationAdjustment;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Compensation Planning Controller
 *
 * Manages compensation reviews and salary adjustments.
 */
class CompensationPlanningController extends Controller
{
    /**
     * Display compensation planning dashboard.
     */
    public function index(): Response
    {
        return Inertia::render('HRM/Compensation/Index', [
            'title' => 'Compensation Planning',
        ]);
    }

    /**
     * Get paginated compensation reviews.
     */
    public function paginate(Request $request)
    {
        $perPage = $request->input('perPage', 15);
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $year = $request->input('year', '');

        $query = CompensationReview::query()
            ->with(['department', 'createdBy'])
            ->withCount('adjustments');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($year) {
            $query->where('cycle_year', $year);
        }

        return response()->json([
            'items' => $query->orderByDesc('created_at')->paginate($perPage),
        ]);
    }

    /**
     * Get compensation planning statistics.
     */
    public function stats()
    {
        $currentYear = now()->year;

        $totalReviews = CompensationReview::where('cycle_year', $currentYear)->count();
        $activeReviews = CompensationReview::where('status', 'active')->where('cycle_year', $currentYear)->count();

        $totalBudget = CompensationReview::where('cycle_year', $currentYear)
            ->where('status', 'active')
            ->sum('budget_amount');

        $totalProposed = CompensationAdjustment::whereHas('compensationReview', fn ($q) => $q->where('cycle_year', $currentYear))
            ->sum(\DB::raw('proposed_salary - current_salary'));

        $avgIncrease = CompensationAdjustment::whereHas('compensationReview', fn ($q) => $q->where('cycle_year', $currentYear))
            ->where('status', 'approved')
            ->avg('percentage_increase') ?? 0;

        $pendingApprovals = CompensationAdjustment::where('status', 'pending')->count();

        return response()->json([
            'total_reviews' => $totalReviews,
            'active_reviews' => $activeReviews,
            'total_budget' => $totalBudget,
            'total_proposed' => $totalProposed,
            'avg_increase' => round($avgIncrease, 2),
            'pending_approvals' => $pendingApprovals,
        ]);
    }

    /**
     * Create a new compensation review cycle.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'review_type' => 'required|in:annual,mid_year,promotion,market_adjustment,special',
            'cycle_year' => 'required|integer|min:2020|max:2050',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'budget_amount' => 'nullable|numeric|min:0',
            'budget_percentage' => 'nullable|numeric|min:0|max:100',
            'department_id' => 'nullable|exists:departments,id',
            'guidelines' => 'nullable|array',
            'approval_workflow' => 'nullable|array',
        ]);

        $validated['status'] = 'draft';
        $validated['created_by'] = auth()->id();

        $review = CompensationReview::create($validated);

        return response()->json([
            'message' => 'Compensation review created successfully',
            'data' => $review->load('department'),
        ]);
    }

    /**
     * Show a specific compensation review.
     */
    public function show(int $id)
    {
        $review = CompensationReview::with([
            'department',
            'adjustments.employee',
            'adjustments.proposedBy',
            'adjustments.approvedBy',
            'createdBy',
        ])->findOrFail($id);

        return response()->json(['data' => $review]);
    }

    /**
     * Update a compensation review.
     */
    public function update(Request $request, int $id)
    {
        $review = CompensationReview::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'review_type' => 'required|in:annual,mid_year,promotion,market_adjustment,special',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'budget_amount' => 'nullable|numeric|min:0',
            'budget_percentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:draft,active,completed,cancelled',
            'guidelines' => 'nullable|array',
        ]);

        $review->update($validated);

        return response()->json([
            'message' => 'Compensation review updated successfully',
            'data' => $review->fresh('department'),
        ]);
    }

    /**
     * Delete a compensation review.
     */
    public function destroy(int $id)
    {
        $review = CompensationReview::findOrFail($id);
        $review->delete();

        return response()->json(['message' => 'Compensation review deleted successfully']);
    }

    /**
     * Get adjustments for a compensation review.
     */
    public function adjustments(Request $request, int $id)
    {
        $perPage = $request->input('perPage', 15);
        $status = $request->input('status', '');

        $query = CompensationAdjustment::where('compensation_review_id', $id)
            ->with(['employee.department', 'employee.designation', 'proposedBy', 'approvedBy']);

        if ($status) {
            $query->where('status', $status);
        }

        return response()->json([
            'items' => $query->orderByDesc('created_at')->paginate($perPage),
        ]);
    }

    /**
     * Add an adjustment to a compensation review.
     */
    public function addAdjustment(Request $request, int $id)
    {
        $review = CompensationReview::findOrFail($id);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'current_salary' => 'required|numeric|min:0',
            'proposed_salary' => 'required|numeric|min:0',
            'adjustment_type' => 'required|in:merit,promotion,market,equity,other',
            'adjustment_reason' => 'required|string',
            'effective_date' => 'required|date',
            'manager_recommendation' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['compensation_review_id'] = $review->id;
        $validated['percentage_increase'] = $validated['current_salary'] > 0
            ? (($validated['proposed_salary'] - $validated['current_salary']) / $validated['current_salary']) * 100
            : 0;
        $validated['status'] = 'pending';
        $validated['proposed_by'] = auth()->id();

        $adjustment = CompensationAdjustment::create($validated);

        return response()->json([
            'message' => 'Adjustment added successfully',
            'data' => $adjustment->load('employee'),
        ]);
    }

    /**
     * Update an adjustment.
     */
    public function updateAdjustment(Request $request, int $id, int $adjustmentId)
    {
        $adjustment = CompensationAdjustment::where('compensation_review_id', $id)
            ->findOrFail($adjustmentId);

        $validated = $request->validate([
            'proposed_salary' => 'required|numeric|min:0',
            'adjustment_type' => 'required|in:merit,promotion,market,equity,other',
            'adjustment_reason' => 'required|string',
            'effective_date' => 'required|date',
            'manager_recommendation' => 'nullable|string',
            'hr_recommendation' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['percentage_increase'] = $adjustment->current_salary > 0
            ? (($validated['proposed_salary'] - $adjustment->current_salary) / $adjustment->current_salary) * 100
            : 0;

        $adjustment->update($validated);

        return response()->json([
            'message' => 'Adjustment updated successfully',
            'data' => $adjustment->fresh('employee'),
        ]);
    }

    /**
     * Approve an adjustment.
     */
    public function approveAdjustment(Request $request, int $id, int $adjustmentId)
    {
        $adjustment = CompensationAdjustment::where('compensation_review_id', $id)
            ->findOrFail($adjustmentId);

        $validated = $request->validate([
            'approved_salary' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $adjustment->update([
            'status' => 'approved',
            'approved_salary' => $validated['approved_salary'] ?? $adjustment->proposed_salary,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'notes' => $validated['notes'] ?? $adjustment->notes,
        ]);

        return response()->json([
            'message' => 'Adjustment approved successfully',
            'data' => $adjustment->fresh(['employee', 'approvedBy']),
        ]);
    }

    /**
     * Reject an adjustment.
     */
    public function rejectAdjustment(Request $request, int $id, int $adjustmentId)
    {
        $adjustment = CompensationAdjustment::where('compensation_review_id', $id)
            ->findOrFail($adjustmentId);

        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        $adjustment->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'message' => 'Adjustment rejected',
            'data' => $adjustment->fresh(['employee', 'approvedBy']),
        ]);
    }

    /**
     * Delete an adjustment.
     */
    public function deleteAdjustment(int $id, int $adjustmentId)
    {
        $adjustment = CompensationAdjustment::where('compensation_review_id', $id)
            ->findOrFail($adjustmentId);

        $adjustment->delete();

        return response()->json(['message' => 'Adjustment deleted successfully']);
    }

    /**
     * Get compensation analytics.
     */
    public function analytics(Request $request)
    {
        $year = $request->input('year', now()->year);

        // By department
        $byDepartment = CompensationAdjustment::whereHas('compensationReview', fn ($q) => $q->where('cycle_year', $year))
            ->where('status', 'approved')
            ->join('employees', 'compensation_adjustments.employee_id', '=', 'employees.id')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->selectRaw('departments.name as department, AVG(percentage_increase) as avg_increase, SUM(approved_salary - current_salary) as total_increase, COUNT(*) as count')
            ->groupBy('departments.name')
            ->get();

        // By adjustment type
        $byType = CompensationAdjustment::whereHas('compensationReview', fn ($q) => $q->where('cycle_year', $year))
            ->where('status', 'approved')
            ->selectRaw('adjustment_type, AVG(percentage_increase) as avg_increase, COUNT(*) as count')
            ->groupBy('adjustment_type')
            ->get();

        // Distribution of increases
        $distribution = CompensationAdjustment::whereHas('compensationReview', fn ($q) => $q->where('cycle_year', $year))
            ->where('status', 'approved')
            ->selectRaw('
                CASE 
                    WHEN percentage_increase < 3 THEN "0-3%"
                    WHEN percentage_increase < 5 THEN "3-5%"
                    WHEN percentage_increase < 8 THEN "5-8%"
                    WHEN percentage_increase < 10 THEN "8-10%"
                    ELSE "10%+"
                END as range,
                COUNT(*) as count
            ')
            ->groupBy('range')
            ->get();

        return response()->json([
            'by_department' => $byDepartment,
            'by_type' => $byType,
            'distribution' => $distribution,
        ]);
    }
}
