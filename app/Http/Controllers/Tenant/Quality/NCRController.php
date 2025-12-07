<?php

namespace App\Http\Controllers\Quality;

use App\Http\Controllers\Controller;
use App\Models\HRM\Department;
use App\Models\QualityNCR;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NCRController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', QualityNCR::class);

        $query = QualityNCR::query()
            ->with(['reporter', 'assignee', 'department']);

        // Filter by search term
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('ncr_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by severity
        if ($request->filled('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        // Filter by department
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->input('department_id'));
        }

        // Filter by assignee
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->input('assigned_to'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('detected_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('detected_date', '<=', $request->input('date_to'));
        }

        $ncrs = $query->orderBy('detected_date', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Quality/NCRs/Index', [
            'ncrs' => $ncrs,
            'filters' => $request->only(['search', 'status', 'severity', 'department_id', 'assigned_to', 'date_from', 'date_to']),
            'statuses' => [
                ['id' => 'open', 'name' => 'Open'],
                ['id' => 'under_review', 'name' => 'Under Review'],
                ['id' => 'action_assigned', 'name' => 'Action Assigned'],
                ['id' => 'action_in_progress', 'name' => 'Action In Progress'],
                ['id' => 'closed', 'name' => 'Closed'],
                ['id' => 'verified', 'name' => 'Verified'],
            ],
            'severities' => [
                ['id' => 'minor', 'name' => 'Minor'],
                ['id' => 'major', 'name' => 'Major'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
            'departments' => Department::select('id', 'name')->get(),
            'assignees' => User::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', QualityNCR::class);

        return Inertia::render('Quality/NCRs/Create', [
            'severities' => [
                ['id' => 'minor', 'name' => 'Minor'],
                ['id' => 'major', 'name' => 'Major'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
            'departments' => Department::select('id', 'name')->get(),
            'assignees' => User::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', QualityNCR::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'severity' => 'required|in:minor,major,critical',
            'department_id' => 'nullable|exists:departments,id',
            'assigned_to' => 'nullable|exists:users,id',
            'detected_date' => 'required|date',
            'root_cause_analysis' => 'nullable|string',
            'immediate_action' => 'nullable|string',
            'corrective_action' => 'nullable|string',
            'preventive_action' => 'nullable|string',
            'requires_verification' => 'boolean',
        ]);

        // Create NCR number
        $ncrNumber = 'NCR-'.date('Ymd').'-'.sprintf('%04d', QualityNCR::count() + 1);

        $ncr = QualityNCR::create([
            'ncr_number' => $ncrNumber,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'severity' => $validated['severity'],
            'status' => $validated['assigned_to'] ? 'action_assigned' : 'open',
            'reported_by' => Auth::id(),
            'department_id' => $validated['department_id'],
            'assigned_to' => $validated['assigned_to'],
            'detected_date' => $validated['detected_date'],
            'root_cause_analysis' => $validated['root_cause_analysis'],
            'immediate_action' => $validated['immediate_action'],
            'corrective_action' => $validated['corrective_action'],
            'preventive_action' => $validated['preventive_action'],
            'requires_verification' => $validated['requires_verification'] ?? false,
        ]);

        return redirect()->route('quality.ncrs.index')
            ->with('success', 'Non-Conformance Report created successfully.');
    }

    public function show(QualityNCR $ncr)
    {
        $this->authorize('view', $ncr);

        $ncr->load(['reporter', 'assignee', 'department', 'closedBy', 'verifiedBy', 'inspection']);

        return Inertia::render('Quality/NCRs/Show', [
            'ncr' => $ncr,
            'statuses' => [
                ['id' => 'open', 'name' => 'Open'],
                ['id' => 'under_review', 'name' => 'Under Review'],
                ['id' => 'action_assigned', 'name' => 'Action Assigned'],
                ['id' => 'action_in_progress', 'name' => 'Action In Progress'],
                ['id' => 'closed', 'name' => 'Closed'],
                ['id' => 'verified', 'name' => 'Verified'],
            ],
        ]);
    }

    public function edit(QualityNCR $ncr)
    {
        $this->authorize('update', $ncr);

        return Inertia::render('Quality/NCRs/Edit', [
            'ncr' => $ncr,
            'severities' => [
                ['id' => 'minor', 'name' => 'Minor'],
                ['id' => 'major', 'name' => 'Major'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
            'statuses' => [
                ['id' => 'open', 'name' => 'Open'],
                ['id' => 'under_review', 'name' => 'Under Review'],
                ['id' => 'action_assigned', 'name' => 'Action Assigned'],
                ['id' => 'action_in_progress', 'name' => 'Action In Progress'],
                ['id' => 'closed', 'name' => 'Closed'],
                ['id' => 'verified', 'name' => 'Verified'],
            ],
            'departments' => Department::select('id', 'name')->get(),
            'assignees' => User::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, QualityNCR $ncr)
    {
        $this->authorize('update', $ncr);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'severity' => 'required|in:minor,major,critical',
            'status' => 'required|in:open,under_review,action_assigned,action_in_progress,closed,verified',
            'department_id' => 'nullable|exists:departments,id',
            'assigned_to' => 'nullable|exists:users,id',
            'detected_date' => 'required|date',
            'root_cause_analysis' => 'nullable|string',
            'immediate_action' => 'nullable|string',
            'corrective_action' => 'nullable|string',
            'preventive_action' => 'nullable|string',
            'lessons_learned' => 'nullable|string',
            'requires_verification' => 'boolean',
        ]);

        // Handle status changes
        $updateData = $validated;

        // If status changing to closed
        if ($validated['status'] === 'closed' && $ncr->status !== 'closed') {
            $updateData['closed_by'] = Auth::id();
            $updateData['closure_date'] = now();
        }

        // If status changing to verified
        if ($validated['status'] === 'verified' && $ncr->status !== 'verified') {
            $updateData['verified_by'] = Auth::id();
            $updateData['verification_date'] = now();
        }

        $ncr->update($updateData);

        return redirect()->route('quality.ncrs.show', $ncr)
            ->with('success', 'Non-Conformance Report updated successfully.');
    }

    public function destroy(QualityNCR $ncr)
    {
        $this->authorize('delete', $ncr);

        $ncr->delete();

        return redirect()->route('quality.ncrs.index')
            ->with('success', 'Non-Conformance Report deleted successfully.');
    }
}
