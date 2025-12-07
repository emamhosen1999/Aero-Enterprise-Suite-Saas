<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\ComplianceAudit;
use App\Models\ComplianceAuditFinding;
use App\Models\HRM\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ComplianceAudit::class);

        $query = ComplianceAudit::query()
            ->with(['leadAuditor', 'department']);

        // Filter by search term
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%");
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

        // Filter by department
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->input('department_id'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('planned_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('planned_date', '<=', $request->input('date_to'));
        }

        $audits = $query->orderBy('planned_date', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Compliance/Audits/Index', [
            'audits' => $audits,
            'filters' => $request->only(['search', 'status', 'type', 'department_id', 'date_from', 'date_to']),
            'auditTypes' => [
                ['id' => 'internal', 'name' => 'Internal'],
                ['id' => 'external', 'name' => 'External'],
                ['id' => 'supplier', 'name' => 'Supplier'],
                ['id' => 'surveillance', 'name' => 'Surveillance'],
                ['id' => 'certification', 'name' => 'Certification'],
            ],
            'auditStatuses' => [
                ['id' => 'planned', 'name' => 'Planned'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', ComplianceAudit::class);

        return Inertia::render('Compliance/Audits/Create', [
            'auditTypes' => [
                ['id' => 'internal', 'name' => 'Internal'],
                ['id' => 'external', 'name' => 'External'],
                ['id' => 'supplier', 'name' => 'Supplier'],
                ['id' => 'surveillance', 'name' => 'Surveillance'],
                ['id' => 'certification', 'name' => 'Certification'],
            ],
            'departments' => Department::select('id', 'name')->get(),
            'auditors' => User::whereHas('roles', function ($query) {
                $query->where('name', 'Auditor');
            })->select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', ComplianceAudit::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:internal,external,supplier,surveillance,certification',
            'status' => 'required|in:planned,in_progress,completed,cancelled',
            'planned_date' => 'required|date',
            'actual_date' => 'nullable|date',
            'lead_auditor_id' => 'required|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'scope' => 'required|string',
            'findings' => 'nullable|string',
            'reference_number' => 'required|string|max:100|unique:compliance_audits',
        ]);

        $audit = ComplianceAudit::create($validated);

        return redirect()->route('compliance.audits.index')
            ->with('success', 'Audit created successfully.');
    }

    public function show(ComplianceAudit $audit)
    {
        $this->authorize('view', $audit);

        $audit->load(['leadAuditor', 'department', 'auditFindings.assignee']);

        return Inertia::render('Compliance/Audits/Show', [
            'audit' => $audit,
            'findingTypes' => [
                ['id' => 'non_conformance', 'name' => 'Non-Conformance'],
                ['id' => 'observation', 'name' => 'Observation'],
                ['id' => 'opportunity_for_improvement', 'name' => 'Opportunity for Improvement'],
            ],
            'findingStatuses' => [
                ['id' => 'open', 'name' => 'Open'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'closed', 'name' => 'Closed'],
                ['id' => 'verified', 'name' => 'Verified'],
            ],
        ]);
    }

    public function edit(ComplianceAudit $audit)
    {
        $this->authorize('update', $audit);

        return Inertia::render('Compliance/Audits/Edit', [
            'audit' => $audit,
            'auditTypes' => [
                ['id' => 'internal', 'name' => 'Internal'],
                ['id' => 'external', 'name' => 'External'],
                ['id' => 'supplier', 'name' => 'Supplier'],
                ['id' => 'surveillance', 'name' => 'Surveillance'],
                ['id' => 'certification', 'name' => 'Certification'],
            ],
            'auditStatuses' => [
                ['id' => 'planned', 'name' => 'Planned'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'departments' => Department::select('id', 'name')->get(),
            'auditors' => User::whereHas('roles', function ($query) {
                $query->where('name', 'Auditor');
            })->select('id', 'name')->get(),
        ]);
    }

    public function update(Request $request, ComplianceAudit $audit)
    {
        $this->authorize('update', $audit);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:internal,external,supplier,surveillance,certification',
            'status' => 'required|in:planned,in_progress,completed,cancelled',
            'planned_date' => 'required|date',
            'actual_date' => 'nullable|date',
            'lead_auditor_id' => 'required|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'scope' => 'required|string',
            'findings' => 'nullable|string',
            'reference_number' => 'required|string|max:100|unique:compliance_audits,reference_number,'.$audit->id,
        ]);

        $audit->update($validated);

        return redirect()->route('compliance.audits.show', $audit)
            ->with('success', 'Audit updated successfully.');
    }

    public function destroy(ComplianceAudit $audit)
    {
        $this->authorize('delete', $audit);

        $audit->delete();

        return redirect()->route('compliance.audits.index')
            ->with('success', 'Audit deleted successfully.');
    }

    public function storeFinding(Request $request, ComplianceAudit $audit)
    {
        $this->authorize('update', $audit);

        $validated = $request->validate([
            'type' => 'required|in:non_conformance,observation,opportunity_for_improvement',
            'description' => 'required|string',
            'root_cause' => 'nullable|string',
            'corrective_action' => 'nullable|string',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'required|in:open,in_progress,closed,verified',
        ]);

        $finding = new ComplianceAuditFinding($validated);
        $finding->audit_id = $audit->id;
        $finding->save();

        return redirect()->route('compliance.audits.show', $audit)
            ->with('success', 'Finding added successfully.');
    }

    public function updateFinding(Request $request, ComplianceAuditFinding $finding)
    {
        $this->authorize('update', $finding->audit);

        $validated = $request->validate([
            'type' => 'required|in:non_conformance,observation,opportunity_for_improvement',
            'description' => 'required|string',
            'root_cause' => 'nullable|string',
            'corrective_action' => 'nullable|string',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'required|in:open,in_progress,closed,verified',
        ]);

        $finding->update($validated);

        return redirect()->route('compliance.audits.show', $finding->audit)
            ->with('success', 'Finding updated successfully.');
    }

    public function destroyFinding(ComplianceAuditFinding $finding)
    {
        $this->authorize('update', $finding->audit);

        $auditId = $finding->audit_id;
        $finding->delete();

        return redirect()->route('compliance.audits.show', $auditId)
            ->with('success', 'Finding deleted successfully.');
    }
}
