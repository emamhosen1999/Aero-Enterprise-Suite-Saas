<?php

namespace Aero\HRM\Http\Controllers\Expense;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\{ExpenseClaim, ExpenseCategory, Employee};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ExpenseClaimController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('HRM/Expenses/ExpenseClaimsIndex', [
            'title' => 'Expense Claims',
            'categories' => ExpenseCategory::active()->get(),
        ]);
    }

    public function paginate(Request $request)
    {
        $perPage = $request->get('perPage', 30);
        $query = ExpenseClaim::with(['employee', 'category'])->orderBy('created_at', 'desc');
        
        if ($search = $request->get('search')) {
            $query->where('claim_number', 'like', "%{$search}%");
        }

        return response()->json($query->paginate($perPage));
    }

    public function stats()
    {
        return response()->json([
            'total' => ExpenseClaim::count(),
            'pending' => ExpenseClaim::whereIn('status', ['submitted', 'pending'])->count(),
            'approved' => ExpenseClaim::where('status', 'approved')->count(),
            'paid' => ExpenseClaim::where('status', 'paid')->count(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'description' => 'required|string',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        // Try to get employee from form data first, then from user association
        $employeeId = $validated['employee_id'] ?? null;
        if (! $employeeId) {
            $employee = Employee::where('user_id', $request->user()->id)->first();
            if (! $employee) {
                return response()->json([
                    'message' => 'No employee record associated with your account. Please contact HR.',
                    'errors' => ['employee_id' => ['No employee record found for current user.']],
                ], 422);
            }
            $employeeId = $employee->id;
        }

        $claim = ExpenseClaim::create([
            'category_id' => $validated['category_id'],
            'amount' => $validated['amount'],
            'expense_date' => $validated['expense_date'],
            'description' => $validated['description'],
            'employee_id' => $employeeId,
            'claim_number' => ExpenseClaim::generateClaimNumber(),
            'status' => 'draft',
        ]);

        return response()->json(['message' => 'Expense claim created', 'claim' => $claim], 201);
    }

    public function approve(int $id)
    {
        $claim = ExpenseClaim::findOrFail($id);
        $claim->update(['status' => 'approved', 'approved_at' => now()]);
        return response()->json(['message' => 'Claim approved']);
    }

    public function reject(Request $request, int $id)
    {
        $claim = ExpenseClaim::findOrFail($id);
        $claim->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);
        return response()->json(['message' => 'Claim rejected']);
    }

    /**
     * Show my (current user's) expense claims - self-service page.
     */
    public function myExpenses(Request $request)
    {
        return Inertia::render('HRM/Expenses/MyExpenseClaims', [
            'title' => 'My Expense Claims',
            'categories' => ExpenseCategory::active()->get(),
        ]);
    }

    /**
     * Get current user's expense claims for API endpoint.
     */
    public function myExpensesPaginate(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();
        
        if (!$employee) {
            return response()->json([
                'data' => [],
                'stats' => ['total' => 0, 'pending' => 0, 'approved' => 0, 'rejected' => 0],
            ]);
        }

        $claims = ExpenseClaim::with(['category'])
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total' => $claims->count(),
            'pending' => $claims->whereIn('status', ['draft', 'submitted', 'pending'])->count(),
            'approved' => $claims->whereIn('status', ['approved', 'paid'])->count(),
            'rejected' => $claims->where('status', 'rejected')->count(),
        ];

        return response()->json([
            'data' => $claims,
            'stats' => $stats,
        ]);
    }

    public function update(Request $request, int $id)
    {
        $claim = ExpenseClaim::findOrFail($id);
        
        $validated = $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'description' => 'required|string',
        ]);

        // Only allow updates if claim is in draft or submitted status
        if (!in_array($claim->status, ['draft', 'submitted'])) {
            return response()->json(['message' => 'Cannot update approved or paid claims'], 422);
        }

        $claim->update($validated);

        return response()->json(['message' => 'Expense claim updated', 'claim' => $claim]);
    }

    public function destroy(int $id)
    {
        $claim = ExpenseClaim::findOrFail($id);
        
        // Only allow deletion if claim is in draft status
        if ($claim->status !== 'draft') {
            return response()->json(['message' => 'Can only delete draft claims'], 422);
        }

        $claim->delete();

        return response()->json(['message' => 'Expense claim deleted']);
    }
}
