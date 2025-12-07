<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\ComplianceDocument;
use App\Models\ComplianceDocumentRevision;
use App\Models\HRM\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ComplianceDocument::class);

        $query = ComplianceDocument::query()
            ->with(['owner', 'approver', 'department']);

        // Filter by search term
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%")
                    ->orWhere('keywords', 'like', "%{$search}%")
                    ->orWhere('document_type', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by document type
        if ($request->filled('document_type')) {
            $query->where('document_type', $request->input('document_type'));
        }

        // Filter by department
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->input('department_id'));
        }

        $documents = $query->orderBy('updated_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Compliance/Documents/Index', [
            'documents' => $documents,
            'filters' => $request->only(['search', 'status', 'document_type', 'department_id']),
            'documentTypes' => [
                ['id' => 'policy', 'name' => 'Policy'],
                ['id' => 'procedure', 'name' => 'Procedure'],
                ['id' => 'work_instruction', 'name' => 'Work Instruction'],
                ['id' => 'form', 'name' => 'Form'],
                ['id' => 'manual', 'name' => 'Manual'],
                ['id' => 'regulation', 'name' => 'Regulation'],
                ['id' => 'standard', 'name' => 'Standard'],
                ['id' => 'guideline', 'name' => 'Guideline'],
                ['id' => 'template', 'name' => 'Template'],
                ['id' => 'record', 'name' => 'Record'],
            ],
            'statuses' => [
                ['id' => 'draft', 'name' => 'Draft'],
                ['id' => 'review', 'name' => 'In Review'],
                ['id' => 'approved', 'name' => 'Approved'],
                ['id' => 'published', 'name' => 'Published'],
                ['id' => 'archived', 'name' => 'Archived'],
                ['id' => 'superseded', 'name' => 'Superseded'],
            ],
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', ComplianceDocument::class);

        return Inertia::render('Compliance/Documents/Create', [
            'documentTypes' => [
                ['id' => 'policy', 'name' => 'Policy'],
                ['id' => 'procedure', 'name' => 'Procedure'],
                ['id' => 'work_instruction', 'name' => 'Work Instruction'],
                ['id' => 'form', 'name' => 'Form'],
                ['id' => 'manual', 'name' => 'Manual'],
                ['id' => 'regulation', 'name' => 'Regulation'],
                ['id' => 'standard', 'name' => 'Standard'],
                ['id' => 'guideline', 'name' => 'Guideline'],
                ['id' => 'template', 'name' => 'Template'],
                ['id' => 'record', 'name' => 'Record'],
            ],
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', ComplianceDocument::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document_number' => 'required|string|max:100|unique:compliance_documents',
            'version' => 'required|string|max:20',
            'document_type' => 'required|string|max:50',
            'effective_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:effective_date',
            'keywords' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'document' => 'nullable|file|max:10240', // 10MB max
        ]);

        $filePath = null;
        if ($request->hasFile('document')) {
            $filePath = $request->file('document')->store('compliance_documents');
        }

        $document = ComplianceDocument::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'document_number' => $validated['document_number'],
            'version' => $validated['version'],
            'status' => 'draft',
            'document_type' => $validated['document_type'],
            'effective_date' => $validated['effective_date'],
            'expiry_date' => $validated['expiry_date'],
            'file_path' => $filePath,
            'owner_id' => Auth::id(),
            'department_id' => $validated['department_id'],
            'keywords' => $validated['keywords'],
            'notes' => $validated['notes'],
        ]);

        if ($document && $filePath) {
            // Create initial revision
            ComplianceDocumentRevision::create([
                'document_id' => $document->id,
                'version' => $validated['version'],
                'change_summary' => 'Initial version',
                'file_path' => $filePath,
                'created_by' => Auth::id(),
            ]);
        }

        return redirect()->route('compliance.documents.index')
            ->with('success', 'Document created successfully.');
    }

    public function show(ComplianceDocument $document)
    {
        $this->authorize('view', $document);

        $document->load(['owner', 'approver', 'department', 'revisions.creator']);

        return Inertia::render('Compliance/Documents/Show', [
            'document' => $document,
        ]);
    }

    public function edit(ComplianceDocument $document)
    {
        $this->authorize('update', $document);

        return Inertia::render('Compliance/Documents/Edit', [
            'document' => $document,
            'documentTypes' => [
                ['id' => 'policy', 'name' => 'Policy'],
                ['id' => 'procedure', 'name' => 'Procedure'],
                ['id' => 'work_instruction', 'name' => 'Work Instruction'],
                ['id' => 'form', 'name' => 'Form'],
                ['id' => 'manual', 'name' => 'Manual'],
                ['id' => 'regulation', 'name' => 'Regulation'],
                ['id' => 'standard', 'name' => 'Standard'],
                ['id' => 'guideline', 'name' => 'Guideline'],
                ['id' => 'template', 'name' => 'Template'],
                ['id' => 'record', 'name' => 'Record'],
            ],
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    public function update(Request $request, ComplianceDocument $document)
    {
        $this->authorize('update', $document);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document_number' => 'required|string|max:100|unique:compliance_documents,document_number,'.$document->id,
            'version' => 'required|string|max:20',
            'status' => 'required|in:draft,review,approved,published,archived,superseded',
            'document_type' => 'required|string|max:50',
            'effective_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:effective_date',
            'keywords' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'document' => 'nullable|file|max:10240', // 10MB max
            'change_summary' => 'required_with:document|string|max:500',
        ]);

        $filePath = $document->file_path;
        if ($request->hasFile('document')) {
            // Store new file
            $filePath = $request->file('document')->store('compliance_documents');

            // Create new revision
            ComplianceDocumentRevision::create([
                'document_id' => $document->id,
                'version' => $validated['version'],
                'change_summary' => $validated['change_summary'] ?? 'Document updated',
                'file_path' => $filePath,
                'created_by' => Auth::id(),
            ]);
        }

        // Update approval info if status is changing to approved
        $approvalData = [];
        if ($validated['status'] === 'approved' && $document->status !== 'approved') {
            $approvalData = [
                'approved_at' => now(),
                'approved_by' => Auth::id(),
            ];
        }

        $document->update(array_merge([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'document_number' => $validated['document_number'],
            'version' => $validated['version'],
            'status' => $validated['status'],
            'document_type' => $validated['document_type'],
            'effective_date' => $validated['effective_date'],
            'expiry_date' => $validated['expiry_date'],
            'file_path' => $filePath,
            'department_id' => $validated['department_id'],
            'keywords' => $validated['keywords'],
            'notes' => $validated['notes'],
        ], $approvalData));

        return redirect()->route('compliance.documents.show', $document)
            ->with('success', 'Document updated successfully.');
    }

    public function destroy(ComplianceDocument $document)
    {
        $this->authorize('delete', $document);

        // Delete file if exists
        if ($document->file_path && Storage::exists($document->file_path)) {
            Storage::delete($document->file_path);
        }

        // Delete revision files
        foreach ($document->revisions as $revision) {
            if ($revision->file_path && Storage::exists($revision->file_path)) {
                Storage::delete($revision->file_path);
            }
        }

        $document->delete();

        return redirect()->route('compliance.documents.index')
            ->with('success', 'Document deleted successfully.');
    }

    public function download(ComplianceDocument $document)
    {
        $this->authorize('view', $document);

        if (! $document->file_path || ! Storage::exists($document->file_path)) {
            return redirect()->back()->with('error', 'File not found.');
        }

        return Storage::download(
            $document->file_path,
            $document->document_number.'-'.$document->version.'.'.pathinfo($document->file_path, PATHINFO_EXTENSION)
        );
    }
}
