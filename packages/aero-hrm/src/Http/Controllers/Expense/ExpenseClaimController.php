<?php

namespace Aero\HRM\Http\Controllers\Expense;

use App\Http\Controllers\Controller;
use Aero\HRM\Models\{ExpenseClaim, ExpenseCategory, Employee};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ExpenseClaimController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('HRM/Expenses/Index', [
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
        ]);

        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();

        $claim = ExpenseClaim::create(array_merge($validated, [
            'employee_id' => $employee->id,
            'claim_number' => ExpenseClaim::generateClaimNumber(),
            'status' => 'draft',
        ]));

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
}
