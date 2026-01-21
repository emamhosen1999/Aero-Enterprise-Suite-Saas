<?php

namespace Aero\HRM\Http\Controllers\Expense;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
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
}
