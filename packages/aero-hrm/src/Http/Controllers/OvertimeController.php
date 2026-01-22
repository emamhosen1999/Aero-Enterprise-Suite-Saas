<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\OvertimeRecord;
use Aero\HRM\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class OvertimeController extends Controller
{
    /**
     * Display overtime management page.
     */
    public function index(Request $request): Response
    {
        $stats = $this->getStats();

        return Inertia::render('HRM/Overtime/Index', [
            'title' => 'Overtime Management',
            'stats' => $stats,
        ]);
    }

    /**
     * Get paginated overtime records.
     */
    public function paginate(Request $request): JsonResponse
    {
        $query = OvertimeRecord::query()
            ->with(['employee.department', 'employee.designation', 'approvedBy']);

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('overtime_type')) {
            $query->where('overtime_type', $request->overtime_type);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('from_date')) {
            $query->where('date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('date', '<=', $request->to_date);
        }

        $perPage = $request->input('perPage', 15);
        $records = $query->orderByDesc('date')->paginate($perPage);

        return response()->json([
            'records' => $records->items(),
            'pagination' => [
                'currentPage' => $records->currentPage(),
                'lastPage' => $records->lastPage(),
                'perPage' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    /**
     * Get statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->getStats());
    }

    private function getStats(): array
    {
        $currentMonth = now()->startOfMonth();

        return [
            'total_this_month' => OvertimeRecord::where('date', '>=', $currentMonth)->count(),
            'pending_approval' => OvertimeRecord::where('status', 'pending')->count(),
            'approved' => OvertimeRecord::where('status', 'approved')
                ->where('date', '>=', $currentMonth)->count(),
            'total_hours_this_month' => OvertimeRecord::where('status', 'approved')
                ->where('date', '>=', $currentMonth)->sum('hours'),
            'uncompensated' => OvertimeRecord::where('status', 'approved')
                ->where('compensated', false)->count(),
        ];
    }

    /**
     * Store a new overtime request.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'hours' => 'required|numeric|min:0.5|max:24',
            'overtime_type' => 'required|in:weekday,weekend,holiday,night,emergency',
            'reason' => 'required|string',
            'task_description' => 'nullable|string',
            'project_id' => 'nullable|integer',
        ]);

        $validated['rate_multiplier'] = OvertimeRecord::getDefaultMultiplier($validated['overtime_type']);
        $validated['requested_by'] = auth()->id();
        $validated['status'] = 'pending';

        $record = OvertimeRecord::create($validated);

        return response()->json([
            'message' => 'Overtime request submitted successfully',
            'record' => $record->load(['employee.department', 'employee.designation']),
        ]);
    }

    /**
     * Update overtime record.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $record = OvertimeRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Cannot edit a processed overtime record'], 422);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'hours' => 'required|numeric|min:0.5|max:24',
            'overtime_type' => 'required|in:weekday,weekend,holiday,night,emergency',
            'reason' => 'required|string',
            'task_description' => 'nullable|string',
        ]);

        $validated['rate_multiplier'] = OvertimeRecord::getDefaultMultiplier($validated['overtime_type']);

        $record->update($validated);

        return response()->json([
            'message' => 'Overtime record updated successfully',
            'record' => $record->fresh(['employee.department', 'employee.designation']),
        ]);
    }

    /**
     * Delete overtime record.
     */
    public function destroy(int $id): JsonResponse
    {
        $record = OvertimeRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Cannot delete a processed overtime record'], 422);
        }

        $record->delete();

        return response()->json([
            'message' => 'Overtime record deleted successfully',
        ]);
    }

    /**
     * Approve overtime request.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $record = OvertimeRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is not pending approval'], 422);
        }

        $record->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Overtime approved successfully',
            'record' => $record->fresh(['employee', 'approvedBy']),
        ]);
    }

    /**
     * Reject overtime request.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $record = OvertimeRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is not pending approval'], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $record->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Overtime rejected',
            'record' => $record->fresh(['employee', 'approvedBy']),
        ]);
    }

    /**
     * Bulk approve overtime records.
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:overtime_records,id',
        ]);

        $updated = OvertimeRecord::whereIn('id', $validated['ids'])
            ->where('status', 'pending')
            ->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

        return response()->json([
            'message' => "{$updated} overtime records approved successfully",
        ]);
    }

    /**
     * Mark overtime as compensated.
     */
    public function markCompensated(Request $request, int $id): JsonResponse
    {
        $record = OvertimeRecord::findOrFail($id);

        if ($record->status !== 'approved') {
            return response()->json(['message' => 'Only approved overtime can be compensated'], 422);
        }

        $validated = $request->validate([
            'compensation_type' => 'required|in:monetary,time_off,both',
            'compensation_amount' => 'nullable|numeric|min:0',
            'payroll_id' => 'nullable|exists:payrolls,id',
        ]);

        $record->update([
            'compensated' => true,
            'compensation_type' => $validated['compensation_type'],
            'compensation_amount' => $validated['compensation_amount'] ?? null,
            'payroll_id' => $validated['payroll_id'] ?? null,
        ]);

        return response()->json([
            'message' => 'Overtime marked as compensated',
            'record' => $record->fresh(),
        ]);
    }

    /**
     * Get employee overtime summary.
     */
    public function employeeSummary(Request $request, int $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);

        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

        $summary = OvertimeRecord::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('status', 'approved')
            ->selectRaw('
                COUNT(*) as total_records,
                SUM(hours) as total_hours,
                SUM(CASE WHEN compensated = 1 THEN hours ELSE 0 END) as compensated_hours,
                SUM(CASE WHEN compensated = 0 THEN hours ELSE 0 END) as pending_compensation_hours
            ')
            ->first();

        $byType = OvertimeRecord::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('status', 'approved')
            ->selectRaw('overtime_type, SUM(hours) as hours')
            ->groupBy('overtime_type')
            ->get()
            ->pluck('hours', 'overtime_type');

        return response()->json([
            'employee' => $employee->only(['id', 'first_name', 'last_name']),
            'period' => ['start' => $startDate, 'end' => $endDate],
            'summary' => $summary,
            'by_type' => $byType,
        ]);
    }
}
