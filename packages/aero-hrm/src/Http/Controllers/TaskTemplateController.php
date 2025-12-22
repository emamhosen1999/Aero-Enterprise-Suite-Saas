<?php

namespace AeroHRM\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use AeroHRM\Models\TaskTemplate;
use AeroHRM\Models\Department;
use AeroHRM\Http\Requests\TaskTemplateFormRequest;
use Illuminate\Support\Facades\Auth;

class TaskTemplateController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', TaskTemplate::class);

        $query = TaskTemplate::with(['department', 'creator'])
            ->orderBy('created_at', 'desc');

        // Search
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by department
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filter by status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $templates = $query->paginate(20);

        return Inertia::render('HRM/TaskTemplates/Index', [
            'templates' => $templates,
            'departments' => Department::all(),
            'filters' => $request->only(['search', 'department_id', 'role', 'is_active']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $this->authorize('create', TaskTemplate::class);

        return Inertia::render('HRM/TaskTemplates/Create', [
            'departments' => Department::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TaskTemplateFormRequest $request)
    {
        $this->authorize('create', TaskTemplate::class);

        $template = TaskTemplate::create([
            ...$request->validated(),
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('hrm.task-templates.index')
            ->with('success', 'Task template created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(TaskTemplate $taskTemplate)
    {
        $this->authorize('view', $taskTemplate);

        $taskTemplate->load(['department', 'creator']);

        return Inertia::render('HRM/TaskTemplates/Show', [
            'template' => $taskTemplate,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TaskTemplate $taskTemplate)
    {
        $this->authorize('update', $taskTemplate);

        $taskTemplate->load('department');

        return Inertia::render('HRM/TaskTemplates/Edit', [
            'template' => $taskTemplate,
            'departments' => Department::all(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TaskTemplateFormRequest $request, TaskTemplate $taskTemplate)
    {
        $this->authorize('update', $taskTemplate);

        $taskTemplate->update($request->validated());

        return redirect()->route('hrm.task-templates.index')
            ->with('success', 'Task template updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TaskTemplate $taskTemplate)
    {
        $this->authorize('delete', $taskTemplate);

        $taskTemplate->delete();

        return redirect()->route('hrm.task-templates.index')
            ->with('success', 'Task template deleted successfully.');
    }

    /**
     * Duplicate an existing template.
     */
    public function duplicate(TaskTemplate $taskTemplate)
    {
        $this->authorize('create', TaskTemplate::class);

        $newTemplate = $taskTemplate->replicate();
        $newTemplate->name = $taskTemplate->name . ' (Copy)';
        $newTemplate->is_default = false;
        $newTemplate->created_by = Auth::id();
        $newTemplate->save();

        return redirect()->route('hrm.task-templates.edit', $newTemplate)
            ->with('success', 'Task template duplicated successfully.');
    }
}
