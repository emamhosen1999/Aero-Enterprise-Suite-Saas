<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\CompensationHistory;
use Aero\HRM\Models\PromotionHistory;
use Aero\HRM\Models\TransferHistory;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeHistoryController extends Controller
{
    /**
     * Display employee history management page.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('HRM/EmployeeHistory/Index', [
            'title' => 'Employee History',
            'stats' => $this->getStats(),
            'departments' => Department::select('id', 'name')->get(),
            'designations' => Designation::select('id', 'title as name')->get(),
        ]);
    }

    /**
     * Get combined statistics.
     */
    private function getStats(): array
    {
        $currentYear = now()->year;

        return [
            'promotions_this_year' => PromotionHistory::whereYear('effective_date', $currentYear)->count(),
            'transfers_this_year' => TransferHistory::whereYear('effective_date', $currentYear)->count(),
            'compensation_changes' => CompensationHistory::whereYear('effective_date', $currentYear)->count(),
            'avg_salary_increase' => round(CompensationHistory::whereYear('effective_date', $currentYear)
                ->where('change_type', 'annual_increase')
                ->avg('change_percentage') ?? 0, 1),
        ];
    }

    // ==================== COMPENSATION HISTORY ====================

    /**
     * Get compensation history.
     */
    public function compensationHistory(Request $request): JsonResponse
    {
        $query = CompensationHistory::query()
            ->with(['employee.department', 'employee.designation', 'approvedBy']);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('change_type')) {
            $query->where('change_type', $request->change_type);
        }

        if ($request->filled('from_date')) {
            $query->where('effective_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('effective_date', '<=', $request->to_date);
        }

        $perPage = $request->input('perPage', 15);
        $history = $query->orderByDesc('effective_date')->paginate($perPage);

        return response()->json([
            'records' => $history->items(),
            'pagination' => [
                'currentPage' => $history->currentPage(),
                'lastPage' => $history->lastPage(),
                'perPage' => $history->perPage(),
                'total' => $history->total(),
            ],
        ]);
    }

    /**
     * Store compensation change.
     */
    public function storeCompensation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'change_type' => 'required|in:annual_increase,promotion,market_adjustment,merit_increase,cost_of_living,demotion,correction,bonus',
            'previous_salary' => 'required|numeric|min:0',
            'new_salary' => 'required|numeric|min:0',
            'reason' => 'nullable|string',
            'effective_date' => 'required|date',
            'performance_rating' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['change_amount'] = $validated['new_salary'] - $validated['previous_salary'];
        $validated['change_percentage'] = CompensationHistory::calculateChangePercentage(
            $validated['previous_salary'],
            $validated['new_salary']
        );
        $validated['approved_by'] = auth()->id();
        $validated['approval_date'] = now();

        $record = CompensationHistory::create($validated);

        return response()->json([
            'message' => 'Compensation record created successfully',
            'record' => $record->load(['employee', 'approvedBy']),
        ]);
    }

    // ==================== PROMOTION HISTORY ====================

    /**
     * Get promotion history.
     */
    public function promotionHistory(Request $request): JsonResponse
    {
        $query = PromotionHistory::query()
            ->with([
                'employee.department',
                'previousDesignation',
                'newDesignation',
                'previousDepartment',
                'newDepartment',
                'approvedBy',
            ]);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('promotion_type')) {
            $query->where('promotion_type', $request->promotion_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('perPage', 15);
        $history = $query->orderByDesc('effective_date')->paginate($perPage);

        return response()->json([
            'records' => $history->items(),
            'pagination' => [
                'currentPage' => $history->currentPage(),
                'lastPage' => $history->lastPage(),
                'perPage' => $history->perPage(),
                'total' => $history->total(),
            ],
        ]);
    }

    /**
     * Store promotion.
     */
    public function storePromotion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'promotion_type' => 'required|in:vertical,lateral,dry,grade',
            'previous_designation_id' => 'nullable|exists:designations,id',
            'new_designation_id' => 'required|exists:designations,id',
            'previous_department_id' => 'nullable|exists:departments,id',
            'new_department_id' => 'nullable|exists:departments,id',
            'previous_salary' => 'nullable|numeric|min:0',
            'new_salary' => 'nullable|numeric|min:0',
            'effective_date' => 'required|date',
            'reason' => 'nullable|string',
            'performance_rating' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['approved_by'] = auth()->id();
        $validated['approval_date'] = now();
        $validated['status'] = 'completed';

        $record = PromotionHistory::create($validated);

        // Also create compensation record if salary changed
        if ($validated['previous_salary'] && $validated['new_salary'] && $validated['previous_salary'] != $validated['new_salary']) {
            CompensationHistory::create([
                'employee_id' => $validated['employee_id'],
                'change_type' => 'promotion',
                'previous_salary' => $validated['previous_salary'],
                'new_salary' => $validated['new_salary'],
                'change_amount' => $validated['new_salary'] - $validated['previous_salary'],
                'change_percentage' => CompensationHistory::calculateChangePercentage(
                    $validated['previous_salary'],
                    $validated['new_salary']
                ),
                'effective_date' => $validated['effective_date'],
                'promotion_id' => $record->id,
                'approved_by' => auth()->id(),
                'approval_date' => now(),
            ]);
        }

        // Update employee record
        $employee = Employee::find($validated['employee_id']);
        if ($employee) {
            $employee->update([
                'designation_id' => $validated['new_designation_id'],
                'department_id' => $validated['new_department_id'] ?? $employee->department_id,
            ]);
        }

        return response()->json([
            'message' => 'Promotion recorded successfully',
            'record' => $record->load(['employee', 'previousDesignation', 'newDesignation']),
        ]);
    }

    // ==================== TRANSFER HISTORY ====================

    /**
     * Get transfer history.
     */
    public function transferHistory(Request $request): JsonResponse
    {
        $query = TransferHistory::query()
            ->with([
                'employee.designation',
                'fromDepartment',
                'toDepartment',
                'fromManager',
                'toManager',
                'approvedBy',
            ]);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('transfer_type')) {
            $query->where('transfer_type', $request->transfer_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('perPage', 15);
        $history = $query->orderByDesc('effective_date')->paginate($perPage);

        return response()->json([
            'records' => $history->items(),
            'pagination' => [
                'currentPage' => $history->currentPage(),
                'lastPage' => $history->lastPage(),
                'perPage' => $history->perPage(),
                'total' => $history->total(),
            ],
        ]);
    }

    /**
     * Store transfer.
     */
    public function storeTransfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'transfer_type' => 'required|in:department,location,branch,international,project',
            'from_department_id' => 'nullable|exists:departments,id',
            'to_department_id' => 'nullable|exists:departments,id',
            'from_location' => 'nullable|string|max:255',
            'to_location' => 'nullable|string|max:255',
            'from_branch' => 'nullable|string|max:255',
            'to_branch' => 'nullable|string|max:255',
            'from_manager_id' => 'nullable|exists:employees,id',
            'to_manager_id' => 'nullable|exists:employees,id',
            'reason' => 'nullable|string',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after:effective_date',
            'is_temporary' => 'boolean',
            'relocation_support' => 'boolean',
            'relocation_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['requested_by'] = auth()->id();
        $validated['approved_by'] = auth()->id();
        $validated['approval_date'] = now();
        $validated['status'] = 'completed';

        $record = TransferHistory::create($validated);

        // Update employee department if department transfer
        if ($validated['transfer_type'] === 'department' && $validated['to_department_id']) {
            $employee = Employee::find($validated['employee_id']);
            if ($employee) {
                $employee->update([
                    'department_id' => $validated['to_department_id'],
                    'manager_id' => $validated['to_manager_id'] ?? $employee->manager_id,
                ]);
            }
        }

        return response()->json([
            'message' => 'Transfer recorded successfully',
            'record' => $record->load(['employee', 'fromDepartment', 'toDepartment']),
        ]);
    }

    // ==================== EMPLOYEE HISTORY VIEW ====================

    /**
     * Get complete history for an employee.
     */
    public function employeeHistory(int $employeeId): JsonResponse
    {
        $employee = Employee::with(['department', 'designation'])->findOrFail($employeeId);

        $compensations = CompensationHistory::where('employee_id', $employeeId)
            ->orderByDesc('effective_date')
            ->limit(20)
            ->get();

        $promotions = PromotionHistory::where('employee_id', $employeeId)
            ->with(['previousDesignation', 'newDesignation'])
            ->orderByDesc('effective_date')
            ->limit(20)
            ->get();

        $transfers = TransferHistory::where('employee_id', $employeeId)
            ->with(['fromDepartment', 'toDepartment'])
            ->orderByDesc('effective_date')
            ->limit(20)
            ->get();

        return response()->json([
            'employee' => $employee,
            'compensations' => $compensations,
            'promotions' => $promotions,
            'transfers' => $transfers,
            'summary' => [
                'total_promotions' => $promotions->count(),
                'total_transfers' => $transfers->count(),
                'total_salary_changes' => $compensations->count(),
                'current_salary' => $compensations->first()?->new_salary,
                'tenure_years' => $employee->created_at?->diffInYears(now()),
            ],
        ]);
    }
}
