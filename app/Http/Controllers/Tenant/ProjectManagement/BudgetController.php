<?php

namespace App\Http\Controllers\ProjectManagement;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectBudget;
use App\Models\ProjectBudgetExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $query = ProjectBudget::with(['project'])
            ->orderBy('created_at', 'desc');

        // Filter by project if specified
        if ($request->has('project_id') && $request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by status if specified
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by budget type if specified
        if ($request->has('budget_type') && $request->budget_type) {
            $query->where('budget_type', $request->budget_type);
        }

        $budgets = $query->paginate(15);

        return Inertia::render('ProjectManagement/Budget/Index', [
            'budgets' => $budgets,
            'projects' => Project::select('id', 'project_name')->get(),
            'filters' => $request->only(['project_id', 'status', 'budget_type']),
            'statusOptions' => [
                'draft' => 'Draft',
                'active' => 'Active',
                'completed' => 'Completed',
                'cancelled' => 'Cancelled',
            ],
            'budgetTypeOptions' => [
                'fixed' => 'Fixed Budget',
                'time_material' => 'Time & Material',
                'cost_plus' => 'Cost Plus',
                'milestone' => 'Milestone Based',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('ProjectManagement/Budget/Create', [
            'projects' => Project::select('id', 'project_name')->get(),
            'categoryOptions' => [
                'labor' => 'Labor',
                'materials' => 'Materials',
                'equipment' => 'Equipment',
                'travel' => 'Travel',
                'software' => 'Software',
                'consulting' => 'Consulting',
                'overhead' => 'Overhead',
                'contingency' => 'Contingency',
            ],
            'budgetTypeOptions' => [
                'fixed' => 'Fixed Budget',
                'time_material' => 'Time & Material',
                'cost_plus' => 'Cost Plus',
                'milestone' => 'Milestone Based',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'category' => 'required|string|max:100',
            'budget_type' => 'required|string|max:50',
            'initial_budget' => 'required|numeric|min:0',
            'allocated_budget' => 'required|numeric|min:0',
            'currency' => 'required|string|max:3',
            'description' => 'nullable|string|max:1000',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validated['remaining_budget'] = $validated['allocated_budget'];
        $validated['spent_amount'] = 0;
        $validated['status'] = 'draft';

        ProjectBudget::create($validated);

        return redirect()->route('project-budgets.index')
            ->with('success', 'Project budget created successfully.');
    }

    public function show(ProjectBudget $projectBudget)
    {
        $projectBudget->load(['project', 'expenses']);

        return Inertia::render('ProjectManagement/Budget/Show', [
            'budget' => $projectBudget,
            'expenses' => $projectBudget->expenses()
                ->orderBy('expense_date', 'desc')
                ->paginate(10),
        ]);
    }

    public function edit(ProjectBudget $projectBudget)
    {
        return Inertia::render('ProjectManagement/Budget/Edit', [
            'budget' => $projectBudget,
            'projects' => Project::select('id', 'project_name')->get(),
            'categoryOptions' => [
                'labor' => 'Labor',
                'materials' => 'Materials',
                'equipment' => 'Equipment',
                'travel' => 'Travel',
                'software' => 'Software',
                'consulting' => 'Consulting',
                'overhead' => 'Overhead',
                'contingency' => 'Contingency',
            ],
            'budgetTypeOptions' => [
                'fixed' => 'Fixed Budget',
                'time_material' => 'Time & Material',
                'cost_plus' => 'Cost Plus',
                'milestone' => 'Milestone Based',
            ],
        ]);
    }

    public function update(Request $request, ProjectBudget $projectBudget)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'category' => 'required|string|max:100',
            'budget_type' => 'required|string|max:50',
            'initial_budget' => 'required|numeric|min:0',
            'allocated_budget' => 'required|numeric|min:0',
            'currency' => 'required|string|max:3',
            'description' => 'nullable|string|max:1000',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'required|string|max:50',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Recalculate remaining budget
        $validated['remaining_budget'] = $validated['allocated_budget'] - $projectBudget->spent_amount;

        $projectBudget->update($validated);

        return redirect()->route('project-budgets.index')
            ->with('success', 'Project budget updated successfully.');
    }

    public function destroy(ProjectBudget $projectBudget)
    {
        $projectBudget->delete();

        return redirect()->route('project-budgets.index')
            ->with('success', 'Project budget deleted successfully.');
    }

    public function expenses(ProjectBudget $projectBudget)
    {
        $expenses = $projectBudget->expenses()
            ->orderBy('expense_date', 'desc')
            ->paginate(15);

        return Inertia::render('ProjectManagement/Budget/Expenses', [
            'budget' => $projectBudget,
            'expenses' => $expenses,
        ]);
    }

    public function addExpense(Request $request, ProjectBudget $projectBudget)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'description' => 'required|string|max:1000',
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|max:3',
            'expense_date' => 'required|date',
            'receipt_number' => 'nullable|string|max:100',
            'vendor' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validated['budget_id'] = $projectBudget->id;
        $validated['project_id'] = $projectBudget->project_id;
        $validated['approved'] = false;

        ProjectBudgetExpense::create($validated);

        // Update budget spent amount
        $projectBudget->updateSpentAmount();

        return redirect()->back()
            ->with('success', 'Expense added successfully.');
    }

    public function approveExpense(ProjectBudgetExpense $expense)
    {
        $expense->update([
            'approved' => true,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'Expense approved successfully.');
    }

    public function reports(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));

        // Budget overview
        $budgetOverview = ProjectBudget::selectRaw('
            COUNT(*) as total_budgets,
            SUM(allocated_budget) as total_allocated,
            SUM(spent_amount) as total_spent,
            SUM(remaining_budget) as total_remaining,
            COUNT(CASE WHEN spent_amount > allocated_budget THEN 1 END) as over_budget_count
        ')
            ->whereBetween('start_date', [$startDate, $endDate])
            ->first();

        // Project budget breakdown
        $projectBudgets = ProjectBudget::with('project')
            ->selectRaw('
                project_budgets.*,
                (spent_amount / allocated_budget * 100) as utilization_percentage
            ')
            ->whereBetween('start_date', [$startDate, $endDate])
            ->orderBy('utilization_percentage', 'desc')
            ->get();

        // Category breakdown
        $categoryBreakdown = ProjectBudget::selectRaw('
            category,
            COUNT(*) as budget_count,
            SUM(allocated_budget) as total_allocated,
            SUM(spent_amount) as total_spent,
            AVG(spent_amount / allocated_budget * 100) as avg_utilization
        ')
            ->whereBetween('start_date', [$startDate, $endDate])
            ->groupBy('category')
            ->get();

        // Expense breakdown
        $expenseBreakdown = ProjectBudgetExpense::selectRaw('
            category,
            COUNT(*) as expense_count,
            SUM(amount) as total_amount,
            COUNT(CASE WHEN approved = 1 THEN 1 END) as approved_count
        ')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('category')
            ->get();

        return Inertia::render('ProjectManagement/Budget/Reports', [
            'budgetOverview' => $budgetOverview,
            'projectBudgets' => $projectBudgets,
            'categoryBreakdown' => $categoryBreakdown,
            'expenseBreakdown' => $expenseBreakdown,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }
}
