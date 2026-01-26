<?php

namespace Aero\HRM\Http\Controllers\Expense;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('HRM/Expenses/ExpenseCategoriesIndex', [
            'title' => 'Expense Categories',
        ]);
    }

    public function list(): JsonResponse
    {
        return response()->json(ExpenseCategory::orderBy('name')->get());
    }

    public function paginate(Request $request): JsonResponse
    {
        $perPage = $request->get('perPage', 30);
        $query = ExpenseCategory::orderBy('name');
        
        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        return response()->json($query->paginate($perPage));
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'total' => ExpenseCategory::count(),
            'active' => ExpenseCategory::where('is_active', true)->count(),
            'inactive' => ExpenseCategory::where('is_active', false)->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:expense_categories',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = ExpenseCategory::create($validated);

        return response()->json([
            'message' => 'Expense category created successfully',
            'category' => $category
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:expense_categories,name,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Expense category updated successfully',
            'category' => $category
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);
        
        // Check if category is being used by any expense claims
        if ($category->expenseClaims()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category that is being used by expense claims'
            ], 422);
        }
        
        $category->delete();

        return response()->json([
            'message' => 'Expense category deleted successfully'
        ]);
    }
}
