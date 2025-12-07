<?php

namespace App\Http\Controllers\FMS;

use App\Http\Controllers\Controller;
use App\Models\FinancialAccount;
use App\Models\FinancialCategory;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index()
    {
        return Inertia::render('FMS/Transactions/Index', [
            'transactions' => Transaction::with(['category', 'account', 'user'])
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('FMS/Transactions/Create', [
            'categories' => FinancialCategory::all(),
            'accounts' => FinancialAccount::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|string|in:income,expense,transfer',
            'category_id' => 'required|exists:financial_categories,id',
            'account_id' => 'required|exists:financial_accounts,id',
            'to_account_id' => 'required_if:type,transfer|exists:financial_accounts,id',
            'description' => 'nullable|string',
            'reference_number' => 'nullable|string|max:50',
            'payment_method' => 'nullable|string|max:50',
            'customer_id' => 'nullable|exists:customers,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            'project_id' => 'nullable|exists:projects,id',
            'attachments' => 'nullable|array',
        ]);

        $validated['user_id'] = auth()->id();

        Transaction::create($validated);

        return redirect()->route('fms.transactions.index')->with('status', 'Transaction created successfully');
    }

    public function edit(Transaction $transaction)
    {
        return Inertia::render('FMS/Transactions/Edit', [
            'transaction' => $transaction,
            'categories' => FinancialCategory::all(),
            'accounts' => FinancialAccount::all(),
        ]);
    }

    public function update(Request $request, Transaction $transaction)
    {
        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|string|in:income,expense,transfer',
            'category_id' => 'required|exists:financial_categories,id',
            'account_id' => 'required|exists:financial_accounts,id',
            'to_account_id' => 'required_if:type,transfer|exists:financial_accounts,id',
            'description' => 'nullable|string',
            'reference_number' => 'nullable|string|max:50',
            'payment_method' => 'nullable|string|max:50',
            'customer_id' => 'nullable|exists:customers,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            'project_id' => 'nullable|exists:projects,id',
            'attachments' => 'nullable|array',
        ]);

        $transaction->update($validated);

        return redirect()->route('fms.transactions.index')->with('status', 'Transaction updated successfully');
    }

    public function destroy(Transaction $transaction)
    {
        $transaction->delete();

        return redirect()->route('fms.transactions.index')->with('status', 'Transaction deleted successfully');
    }

    public function dashboard()
    {
        return Inertia::render('FMS/Dashboard', [
            'transactionStats' => [
                'income' => Transaction::where('type', 'income')->sum('amount'),
                'expense' => Transaction::where('type', 'expense')->sum('amount'),
                'balance' => Transaction::where('type', 'income')->sum('amount') - Transaction::where('type', 'expense')->sum('amount'),
            ],
            'recentTransactions' => Transaction::with(['category', 'account', 'user'])
                ->latest()
                ->take(5)
                ->get(),
            'accountBalances' => FinancialAccount::select('id', 'name')
                ->withSum(['incomeTransactions as income' => function ($query) {
                    $query->where('type', 'income');
                }], 'amount')
                ->withSum(['expenseTransactions as expense' => function ($query) {
                    $query->where('type', 'expense');
                }], 'amount')
                ->get()
                ->map(function ($account) {
                    $account->balance = ($account->income ?? 0) - ($account->expense ?? 0);

                    return $account;
                }),
        ]);
    }
}
