<?php

namespace App\Http\Controllers\Quality;

use App\Http\Controllers\Controller;
use App\Models\HRM\Department;
use App\Models\QualityCheckpoint;
use App\Models\QualityInspection;
use App\Models\QualityNCR;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InspectionController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', QualityInspection::class);

        $query = QualityInspection::query()
            ->with(['inspector', 'department']);

        // Filter by search term
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('inspection_number', 'like', "%{$search}%")
                    ->orWhere('product_batch', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter by result
        if ($request->filled('result_status')) {
            $query->where('result_status', $request->input('result_status'));
        }

        // Filter by department
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->input('department_id'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('scheduled_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('scheduled_date', '<=', $request->input('date_to'));
        }

        $inspections = $query->orderBy('scheduled_date', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Quality/Inspections/Index', [
            'inspections' => $inspections,
            'filters' => $request->only(['search', 'status', 'type', 'result_status', 'department_id', 'date_from', 'date_to']),
            'inspectionTypes' => [
                ['id' => 'incoming', 'name' => 'Incoming'],
                ['id' => 'in_process', 'name' => 'In-Process'],
                ['id' => 'final', 'name' => 'Final'],
                ['id' => 'customer_return', 'name' => 'Customer Return'],
                ['id' => 'supplier_evaluation', 'name' => 'Supplier Evaluation'],
            ],
            'statuses' => [
                ['id' => 'scheduled', 'name' => 'Scheduled'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'resultStatuses' => [
                ['id' => 'passed', 'name' => 'Passed'],
                ['id' => 'failed', 'name' => 'Failed'],
                ['id' => 'conditionally_passed', 'name' => 'Conditionally Passed'],
            ],
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', QualityInspection::class);

        return Inertia::render('Quality/Inspections/Create', [
            'inspectionTypes' => [
                ['id' => 'incoming', 'name' => 'Incoming'],
                ['id' => 'in_process', 'name' => 'In-Process'],
                ['id' => 'final', 'name' => 'Final'],
                ['id' => 'customer_return', 'name' => 'Customer Return'],
                ['id' => 'supplier_evaluation', 'name' => 'Supplier Evaluation'],
            ],
            'departments' => Department::select('id', 'name')->get(),
            'inspectors' => User::whereHas('roles', function ($query) {
                $query->where('name', 'Quality Inspector');
            })->orWhereHas('permissions', function ($query) {
                $query->where('name', 'quality.inspect');
            })->select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', QualityInspection::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:incoming,in_process,final,customer_return,supplier_evaluation',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'scheduled_date' => 'required|date',
            'actual_date' => 'nullable|date',
            'inspector_id' => 'required|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'product_batch' => 'nullable|string|max:100',
            'sample_size' => 'nullable|integer|min:1',
            'inspection_criteria' => 'nullable|string',
            'inspection_number' => 'required|string|max:100|unique:quality_inspections',
        ]);

        $inspection = QualityInspection::create($validated);

        // Create checkpoints if provided
        if ($request->has('checkpoints')) {
            foreach ($request->input('checkpoints') as $checkpoint) {
                $inspection->checkpoints()->create([
                    'name' => $checkpoint['name'],
                    'description' => $checkpoint['description'] ?? null,
                    'specification' => $checkpoint['specification'] ?? null,
                    'unit_of_measure' => $checkpoint['unit_of_measure'] ?? null,
                    'min_value' => $checkpoint['min_value'] ?? null,
                    'max_value' => $checkpoint['max_value'] ?? null,
                    'target_value' => $checkpoint['target_value'] ?? null,
                ]);
            }
        }

        return redirect()->route('quality.inspections.index')
            ->with('success', 'Inspection created successfully.');
    }

    public function show(QualityInspection $inspection)
    {
        $this->authorize('view', $inspection);

        $inspection->load(['inspector', 'department', 'checkpoints', 'ncrs']);

        return Inertia::render('Quality/Inspections/Show', [
            'inspection' => $inspection,
            'checkpointResults' => [
                ['id' => 'pass', 'name' => 'Pass'],
                ['id' => 'fail', 'name' => 'Fail'],
                ['id' => 'not_applicable', 'name' => 'Not Applicable'],
                ['id' => 'conditionally_passed', 'name' => 'Conditionally Passed'],
            ],
        ]);
    }

    public function edit(QualityInspection $inspection)
    {
        $this->authorize('update', $inspection);

        $inspection->load('checkpoints');

        return Inertia::render('Quality/Inspections/Edit', [
            'inspection' => $inspection,
            'inspectionTypes' => [
                ['id' => 'incoming', 'name' => 'Incoming'],
                ['id' => 'in_process', 'name' => 'In-Process'],
                ['id' => 'final', 'name' => 'Final'],
                ['id' => 'customer_return', 'name' => 'Customer Return'],
                ['id' => 'supplier_evaluation', 'name' => 'Supplier Evaluation'],
            ],
            'statuses' => [
                ['id' => 'scheduled', 'name' => 'Scheduled'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'resultStatuses' => [
                ['id' => 'passed', 'name' => 'Passed'],
                ['id' => 'failed', 'name' => 'Failed'],
                ['id' => 'conditionally_passed', 'name' => 'Conditionally Passed'],
            ],
            'departments' => Department::select('id', 'name')->get(),
            'inspectors' => User::whereHas('roles', function ($query) {
                $query->where('name', 'Quality Inspector');
            })->orWhereHas('permissions', function ($query) {
                $query->where('name', 'quality.inspect');
            })->select('id', 'name')->get(),
        ]);
    }

    public function update(Request $request, QualityInspection $inspection)
    {
        $this->authorize('update', $inspection);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:incoming,in_process,final,customer_return,supplier_evaluation',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'scheduled_date' => 'required|date',
            'actual_date' => 'nullable|date',
            'inspector_id' => 'required|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'product_batch' => 'nullable|string|max:100',
            'sample_size' => 'nullable|integer|min:1',
            'inspection_criteria' => 'nullable|string',
            'results' => 'nullable|string',
            'result_status' => 'nullable|in:passed,failed,conditionally_passed',
            'inspection_number' => 'required|string|max:100|unique:quality_inspections,inspection_number,'.$inspection->id,
        ]);

        $inspection->update($validated);

        // Update existing checkpoints and add new ones
        if ($request->has('checkpoints')) {
            $existingIds = [];

            foreach ($request->input('checkpoints') as $checkpointData) {
                if (! empty($checkpointData['id'])) {
                    // Update existing checkpoint
                    $checkpoint = QualityCheckpoint::find($checkpointData['id']);
                    if ($checkpoint && $checkpoint->inspection_id == $inspection->id) {
                        $checkpoint->update([
                            'name' => $checkpointData['name'],
                            'description' => $checkpointData['description'] ?? null,
                            'specification' => $checkpointData['specification'] ?? null,
                            'unit_of_measure' => $checkpointData['unit_of_measure'] ?? null,
                            'min_value' => $checkpointData['min_value'] ?? null,
                            'max_value' => $checkpointData['max_value'] ?? null,
                            'target_value' => $checkpointData['target_value'] ?? null,
                            'result' => $checkpointData['result'] ?? null,
                            'comments' => $checkpointData['comments'] ?? null,
                        ]);
                        $existingIds[] = $checkpoint->id;
                    }
                } else {
                    // Create new checkpoint
                    $checkpoint = $inspection->checkpoints()->create([
                        'name' => $checkpointData['name'],
                        'description' => $checkpointData['description'] ?? null,
                        'specification' => $checkpointData['specification'] ?? null,
                        'unit_of_measure' => $checkpointData['unit_of_measure'] ?? null,
                        'min_value' => $checkpointData['min_value'] ?? null,
                        'max_value' => $checkpointData['max_value'] ?? null,
                        'target_value' => $checkpointData['target_value'] ?? null,
                        'result' => $checkpointData['result'] ?? null,
                        'comments' => $checkpointData['comments'] ?? null,
                    ]);
                    $existingIds[] = $checkpoint->id;
                }
            }

            // Delete checkpoints that are not in the request
            if (! empty($existingIds)) {
                $inspection->checkpoints()
                    ->whereNotIn('id', $existingIds)
                    ->delete();
            }
        }

        // If inspection is completed and has failed result status, create NCR if requested
        if (
            $request->input('create_ncr') &&
            $validated['status'] === 'completed' &&
            $validated['result_status'] === 'failed'
        ) {

            QualityNCR::create([
                'ncr_number' => 'NCR-'.date('Ymd').'-'.$inspection->id,
                'title' => 'NCR for '.$inspection->inspection_number,
                'description' => $request->input('ncr_description') ?? 'Failed inspection: '.$inspection->title,
                'severity' => $request->input('ncr_severity') ?? 'minor',
                'status' => 'open',
                'reported_by' => Auth::id(),
                'department_id' => $inspection->department_id,
                'detected_date' => now(),
                'inspection_id' => $inspection->id,
            ]);
        }

        return redirect()->route('quality.inspections.show', $inspection)
            ->with('success', 'Inspection updated successfully.');
    }

    public function destroy(QualityInspection $inspection)
    {
        $this->authorize('delete', $inspection);

        // Delete related checkpoints
        $inspection->checkpoints()->delete();

        $inspection->delete();

        return redirect()->route('quality.inspections.index')
            ->with('success', 'Inspection deleted successfully.');
    }

    public function dashboard()
    {
        $this->authorize('viewAny', QualityInspection::class);

        // Get dashboard statistics
        $totalInspections = QualityInspection::count();
        $pendingInspections = QualityInspection::where('status', 'scheduled')->count();
        $passedInspections = QualityInspection::where('result_status', 'passed')->count();
        $failedInspections = QualityInspection::where('result_status', 'failed')->count();

        $totalNCRs = QualityNCR::count();
        $openNCRs = QualityNCR::where('status', 'open')->count();
        $closedNCRs = QualityNCR::where('status', 'closed')->count();

        // Get recent inspections
        $recentInspections = QualityInspection::with(['inspector', 'department'])
            ->latest()
            ->take(5)
            ->get();

        // Get overdue NCRs
        $overdueNCRs = QualityNCR::where('target_completion_date', '<', now())
            ->where('status', '!=', 'closed')
            ->with(['inspector', 'department'])
            ->take(5)
            ->get();

        // Get inspection trends (last 12 months)
        $inspectionTrends = collect();
        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthData = [
                'month' => $month->format('M Y'),
                'total' => QualityInspection::whereYear('inspection_date', $month->year)
                    ->whereMonth('inspection_date', $month->month)
                    ->count(),
                'passed' => QualityInspection::whereYear('inspection_date', $month->year)
                    ->whereMonth('inspection_date', $month->month)
                    ->where('result_status', 'passed')
                    ->count(),
                'failed' => QualityInspection::whereYear('inspection_date', $month->year)
                    ->whereMonth('inspection_date', $month->month)
                    ->where('result_status', 'failed')
                    ->count(),
            ];
            $inspectionTrends->push($monthData);
        }

        return Inertia::render('Quality/Dashboard', [
            'statistics' => [
                'totalInspections' => $totalInspections,
                'pendingInspections' => $pendingInspections,
                'passedInspections' => $passedInspections,
                'failedInspections' => $failedInspections,
                'totalNCRs' => $totalNCRs,
                'openNCRs' => $openNCRs,
                'closedNCRs' => $closedNCRs,
                'passRate' => $totalInspections > 0 ? round(($passedInspections / $totalInspections) * 100, 1) : 0,
            ],
            'recentInspections' => $recentInspections,
            'overdueNCRs' => $overdueNCRs,
            'inspectionTrends' => $inspectionTrends,
        ]);
    }
}
