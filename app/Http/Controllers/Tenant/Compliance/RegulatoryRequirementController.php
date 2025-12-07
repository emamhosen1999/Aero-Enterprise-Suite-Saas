<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Compliance\RegulatoryRequirement;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegulatoryRequirementController extends Controller
{
    /**
     * Display a listing of regulatory requirements
     */
    public function index(Request $request)
    {
        $query = RegulatoryRequirement::with(['assignedUser']);

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%')
                    ->orWhere('requirement_number', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('regulatory_body')) {
            $query->where('regulatory_body', $request->regulatory_body);
        }

        if ($request->filled('requirement_type')) {
            $query->where('requirement_type', $request->requirement_type);
        }

        if ($request->filled('overdue')) {
            $query->overdue();
        }

        if ($request->filled('due_soon')) {
            $query->dueSoon($request->get('due_soon_days', 30));
        }

        $requirements = $query->orderBy('compliance_deadline', 'asc')->paginate(15);

        return Inertia::render('Compliance/RegulatoryRequirements/Index', [
            'requirements' => $requirements,
            'filters' => $request->only(['search', 'status', 'priority', 'regulatory_body', 'requirement_type', 'overdue', 'due_soon']),
            'statuses' => $this->getStatuses(),
            'priorities' => $this->getPriorities(),
            'types' => $this->getTypes(),
            'regulatoryBodies' => $this->getRegulatoryBodies(),
        ]);
    }

    /**
     * Show the form for creating a new requirement
     */
    public function create()
    {
        return Inertia::render('Compliance/RegulatoryRequirements/Create', [
            'statuses' => $this->getStatuses(),
            'priorities' => $this->getPriorities(),
            'types' => $this->getTypes(),
            'users' => User::select('id', 'name', 'email')->get(),
        ]);
    }

    /**
     * Store a newly created requirement
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'regulatory_body' => 'required|string|max:255',
            'regulation_reference' => 'nullable|string|max:255',
            'requirement_type' => 'required|string|in:'.implode(',', array_keys($this->getTypes())),
            'industry' => 'nullable|string|max:255',
            'applicable_locations' => 'nullable|array',
            'effective_date' => 'required|date',
            'compliance_deadline' => 'required|date|after:effective_date',
            'status' => 'required|string|in:'.implode(',', array_keys($this->getStatuses())),
            'priority' => 'required|string|in:'.implode(',', array_keys($this->getPriorities())),
            'assigned_to' => 'nullable|exists:users,id',
            'compliance_percentage' => 'nullable|numeric|min:0|max:100',
            'implementation_notes' => 'nullable|string',
            'evidence_documents' => 'nullable|array',
        ]);

        $requirement = RegulatoryRequirement::create([
            'requirement_number' => $this->generateRequirementNumber(),
            'title' => $request->title,
            'description' => $request->description,
            'regulatory_body' => $request->regulatory_body,
            'regulation_reference' => $request->regulation_reference,
            'requirement_type' => $request->requirement_type,
            'industry' => $request->industry,
            'applicable_locations' => $request->applicable_locations,
            'effective_date' => $request->effective_date,
            'compliance_deadline' => $request->compliance_deadline,
            'status' => $request->status,
            'priority' => $request->priority,
            'assigned_to' => $request->assigned_to,
            'compliance_percentage' => $request->compliance_percentage ?? 0,
            'implementation_notes' => $request->implementation_notes,
            'evidence_documents' => $request->evidence_documents,
        ]);

        return redirect()->route('compliance.regulatory.show', $requirement)
            ->with('success', 'Regulatory requirement created successfully.');
    }

    /**
     * Display the specified requirement
     */
    public function show(RegulatoryRequirement $requirement)
    {
        $requirement->load(['assignedUser']);

        return Inertia::render('Compliance/RegulatoryRequirements/Show', [
            'requirement' => $requirement,
            'complianceHistory' => $this->getComplianceHistory($requirement),
            'relatedRequirements' => $this->getRelatedRequirements($requirement),
        ]);
    }

    /**
     * Show the form for editing the requirement
     */
    public function edit(RegulatoryRequirement $requirement)
    {
        return Inertia::render('Compliance/RegulatoryRequirements/Edit', [
            'requirement' => $requirement,
            'statuses' => $this->getStatuses(),
            'priorities' => $this->getPriorities(),
            'types' => $this->getTypes(),
            'users' => User::select('id', 'name', 'email')->get(),
        ]);
    }

    /**
     * Update the specified requirement
     */
    public function update(Request $request, RegulatoryRequirement $requirement)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'regulatory_body' => 'required|string|max:255',
            'regulation_reference' => 'nullable|string|max:255',
            'requirement_type' => 'required|string|in:'.implode(',', array_keys($this->getTypes())),
            'industry' => 'nullable|string|max:255',
            'applicable_locations' => 'nullable|array',
            'effective_date' => 'required|date',
            'compliance_deadline' => 'required|date|after:effective_date',
            'status' => 'required|string|in:'.implode(',', array_keys($this->getStatuses())),
            'priority' => 'required|string|in:'.implode(',', array_keys($this->getPriorities())),
            'assigned_to' => 'nullable|exists:users,id',
            'compliance_percentage' => 'nullable|numeric|min:0|max:100',
            'implementation_notes' => 'nullable|string',
            'evidence_documents' => 'nullable|array',
        ]);

        $requirement->update([
            'title' => $request->title,
            'description' => $request->description,
            'regulatory_body' => $request->regulatory_body,
            'regulation_reference' => $request->regulation_reference,
            'requirement_type' => $request->requirement_type,
            'industry' => $request->industry,
            'applicable_locations' => $request->applicable_locations,
            'effective_date' => $request->effective_date,
            'compliance_deadline' => $request->compliance_deadline,
            'status' => $request->status,
            'priority' => $request->priority,
            'assigned_to' => $request->assigned_to,
            'compliance_percentage' => $request->compliance_percentage ?? 0,
            'implementation_notes' => $request->implementation_notes,
            'evidence_documents' => $request->evidence_documents,
        ]);

        return redirect()->route('compliance.regulatory.show', $requirement)
            ->with('success', 'Regulatory requirement updated successfully.');
    }

    /**
     * Remove the specified requirement
     */
    public function destroy(RegulatoryRequirement $requirement)
    {
        $requirement->delete();

        return redirect()->route('compliance.regulatory.index')
            ->with('success', 'Regulatory requirement deleted successfully.');
    }

    /**
     * Get available statuses
     */
    private function getStatuses(): array
    {
        return [
            RegulatoryRequirement::STATUS_PENDING => 'Pending',
            RegulatoryRequirement::STATUS_IN_PROGRESS => 'In Progress',
            RegulatoryRequirement::STATUS_COMPLIANT => 'Compliant',
            RegulatoryRequirement::STATUS_NON_COMPLIANT => 'Non-Compliant',
            RegulatoryRequirement::STATUS_NOT_APPLICABLE => 'Not Applicable',
        ];
    }

    /**
     * Get available priorities
     */
    private function getPriorities(): array
    {
        return [
            RegulatoryRequirement::PRIORITY_LOW => 'Low',
            RegulatoryRequirement::PRIORITY_MEDIUM => 'Medium',
            RegulatoryRequirement::PRIORITY_HIGH => 'High',
            RegulatoryRequirement::PRIORITY_CRITICAL => 'Critical',
        ];
    }

    /**
     * Get available types
     */
    private function getTypes(): array
    {
        return [
            RegulatoryRequirement::TYPE_SAFETY => 'Safety',
            RegulatoryRequirement::TYPE_ENVIRONMENTAL => 'Environmental',
            RegulatoryRequirement::TYPE_FINANCIAL => 'Financial',
            RegulatoryRequirement::TYPE_DATA_PROTECTION => 'Data Protection',
            RegulatoryRequirement::TYPE_EMPLOYMENT => 'Employment',
            RegulatoryRequirement::TYPE_QUALITY => 'Quality',
        ];
    }

    /**
     * Get regulatory bodies from existing requirements
     */
    private function getRegulatoryBodies(): array
    {
        return RegulatoryRequirement::distinct()
            ->pluck('regulatory_body')
            ->filter()
            ->sort()
            ->values()
            ->toArray();
    }

    /**
     * Generate a unique requirement number
     */
    private function generateRequirementNumber(): string
    {
        $prefix = 'REQ-';
        $year = now()->year;

        // Get the last requirement number for this year
        $lastRequirement = RegulatoryRequirement::where('requirement_number', 'like', $prefix.$year.'-%')
            ->orderBy('requirement_number', 'desc')
            ->first();

        $nextNumber = 1;
        if ($lastRequirement) {
            $lastNumber = intval(substr($lastRequirement->requirement_number, -3));
            $nextNumber = $lastNumber + 1;
        }

        return $prefix.$year.'-'.str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get compliance history for a requirement
     */
    private function getComplianceHistory(RegulatoryRequirement $requirement): array
    {
        // This would typically come from an audit log or history table
        // For now, return a simple structure
        return [
            [
                'date' => $requirement->created_at,
                'action' => 'Created',
                'status' => $requirement->status,
                'compliance_percentage' => 0,
                'notes' => 'Requirement created',
                'user' => 'System',
            ],
            [
                'date' => $requirement->updated_at,
                'action' => 'Updated',
                'status' => $requirement->status,
                'compliance_percentage' => $requirement->compliance_percentage,
                'notes' => $requirement->implementation_notes ?? 'Status updated',
                'user' => $requirement->assignedUser->name ?? 'Unknown',
            ],
        ];
    }

    /**
     * Get requirements related to this one
     */
    private function getRelatedRequirements(RegulatoryRequirement $requirement): array
    {
        return RegulatoryRequirement::where('id', '!=', $requirement->id)
            ->where(function ($query) use ($requirement) {
                $query->where('regulatory_body', $requirement->regulatory_body)
                    ->orWhere('requirement_type', $requirement->requirement_type)
                    ->orWhere('industry', $requirement->industry);
            })
            ->limit(5)
            ->get(['id', 'requirement_number', 'title', 'status', 'priority'])
            ->toArray();
    }

    /**
     * Export requirements report
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'required|in:pdf,excel,csv',
            'filters' => 'nullable|array',
        ]);

        // Implementation for exporting requirements
        // This would typically use a service class or queue job

        return response()->json([
            'message' => 'Export started',
            'status' => 'processing',
        ]);
    }

    /**
     * Get compliance dashboard data
     */
    public function getDashboardData()
    {
        $stats = [
            'total' => RegulatoryRequirement::count(),
            'compliant' => RegulatoryRequirement::where('status', RegulatoryRequirement::STATUS_COMPLIANT)->count(),
            'in_progress' => RegulatoryRequirement::where('status', RegulatoryRequirement::STATUS_IN_PROGRESS)->count(),
            'non_compliant' => RegulatoryRequirement::where('status', RegulatoryRequirement::STATUS_NON_COMPLIANT)->count(),
            'overdue' => RegulatoryRequirement::overdue()->count(),
            'due_soon' => RegulatoryRequirement::dueSoon(30)->count(),
        ];

        $upcomingDeadlines = RegulatoryRequirement::with('assignedUser')
            ->where('compliance_deadline', '>', now())
            ->where('compliance_deadline', '<=', now()->addDays(90))
            ->orderBy('compliance_deadline')
            ->limit(10)
            ->get();

        $overdueRequirements = RegulatoryRequirement::with('assignedUser')
            ->overdue()
            ->orderBy('compliance_deadline')
            ->limit(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'upcoming_deadlines' => $upcomingDeadlines,
            'overdue_requirements' => $overdueRequirements,
            'compliance_rate' => $stats['total'] > 0 ? round(($stats['compliant'] / $stats['total']) * 100, 2) : 0,
        ]);
    }
}
