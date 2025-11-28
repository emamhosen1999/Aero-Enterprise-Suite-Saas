<?php

namespace App\Http\Controllers;

use App\Services\FMSService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FMSController extends Controller
{
    protected $fmsService;

    public function __construct(FMSService $fmsService)
    {
        $this->fmsService = $fmsService;
    }

    /**
     * Display the main FMS dashboard
     */
    public function index()
    {
        $stats = $this->fmsService->getDashboardStats();
        $recentTransactions = $this->fmsService->getRecentTransactions();
        $chartData = $this->fmsService->getChartData();

        return Inertia::render('FMS/Index', [
            'stats' => $stats,
            'recentTransactions' => $recentTransactions,
            'chartData' => $chartData,
        ]);
    }

    /**
     * Display accounts payable management
     */
    public function accountsPayable()
    {
        $payables = $this->fmsService->getAccountsPayable();
        $vendors = $this->fmsService->getVendors();

        return Inertia::render('FMS/AccountsPayable/Index', [
            'payables' => $payables,
            'vendors' => $vendors,
        ]);
    }

    /**
     * Store new accounts payable entry
     */
    public function storeAccountsPayable(Request $request)
    {
        $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'invoice_number' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $payable = $this->fmsService->createAccountsPayable($request->all());

        return redirect()->back()->with('success', 'Accounts payable entry created successfully.');
    }

    /**
     * Display accounts receivable management
     */
    public function accountsReceivable()
    {
        $receivables = $this->fmsService->getAccountsReceivable();
        $customers = $this->fmsService->getCustomers();

        return Inertia::render('FMS/AccountsReceivable/Index', [
            'receivables' => $receivables,
            'customers' => $customers,
        ]);
    }

    /**
     * Store new accounts receivable entry
     */
    public function storeAccountsReceivable(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'invoice_number' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $receivable = $this->fmsService->createAccountsReceivable($request->all());

        return redirect()->back()->with('success', 'Accounts receivable entry created successfully.');
    }

    /**
     * Display general ledger
     */
    public function generalLedger()
    {
        $ledgerEntries = $this->fmsService->getLedgerEntries();
        $accounts = $this->fmsService->getChartOfAccounts();

        return Inertia::render('FMS/GeneralLedger/Index', [
            'ledgerEntries' => $ledgerEntries,
            'accounts' => $accounts,
        ]);
    }

    /**
     * Store new ledger entry
     */
    public function storeLedgerEntry(Request $request)
    {
        $request->validate([
            'account_id' => 'required|exists:chart_of_accounts,id',
            'transaction_date' => 'required|date',
            'description' => 'required|string',
            'debit_amount' => 'nullable|numeric|min:0',
            'credit_amount' => 'nullable|numeric|min:0',
            'reference_number' => 'nullable|string|max:255',
        ]);

        // Ensure either debit or credit is provided, not both
        if (($request->debit_amount && $request->credit_amount) ||
            (! $request->debit_amount && ! $request->credit_amount)
        ) {
            return redirect()->back()->withErrors(['amount' => 'Please provide either debit or credit amount, not both.']);
        }

        $entry = $this->fmsService->createLedgerEntry($request->all());

        return redirect()->back()->with('success', 'Ledger entry created successfully.');
    }

    /**
     * Display financial reports
     */
    public function reports()
    {
        $reportData = $this->fmsService->getFinancialReports();

        return Inertia::render('FMS/Reports/Index', [
            'reportData' => $reportData,
        ]);
    }

    /**
     * Generate specific financial report
     */
    public function generateReport(Request $request)
    {
        $request->validate([
            'report_type' => 'required|in:income_statement,balance_sheet,cash_flow,trial_balance',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $reportData = $this->fmsService->generateReport(
            $request->report_type,
            $request->start_date,
            $request->end_date
        );

        return response()->json([
            'success' => true,
            'data' => $reportData,
        ]);
    }

    /**
     * Display budgets and forecasting
     */
    public function budgets()
    {
        $budgets = $this->fmsService->getBudgets();
        $departments = $this->fmsService->getDepartments();

        return Inertia::render('FMS/Budgets/Index', [
            'budgets' => $budgets,
            'departments' => $departments,
        ]);
    }

    /**
     * Store new budget
     */
    public function storeBudget(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'fiscal_year' => 'required|integer|min:2020|max:2030',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'required|in:draft,approved,active,closed',
        ]);

        $budget = $this->fmsService->createBudget($request->all());

        return redirect()->back()->with('success', 'Budget created successfully.');
    }

    /**
     * Display expenses management
     */
    public function expenses()
    {
        $expenses = $this->fmsService->getExpenses();
        $categories = $this->fmsService->getExpenseCategories();
        $users = $this->fmsService->getUsers();

        return Inertia::render('FMS/Expenses/Index', [
            'expenses' => $expenses,
            'categories' => $categories,
            'users' => $users,
        ]);
    }

    /**
     * Store new expense
     */
    public function storeExpense(Request $request)
    {
        $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category_id' => 'required|exists:expense_categories,id',
            'expense_date' => 'required|date',
            'submitted_by' => 'required|exists:users,id',
            'receipt_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $expense = $this->fmsService->createExpense($request->all());

        return redirect()->back()->with('success', 'Expense created successfully.');
    }

    /**
     * Display invoicing system
     */
    public function invoices()
    {
        $invoices = $this->fmsService->getInvoices();
        $customers = $this->fmsService->getCustomers();

        return Inertia::render('FMS/Invoices/Index', [
            'invoices' => $invoices,
            'customers' => $customers,
        ]);
    }

    /**
     * Store new invoice
     */
    public function storeInvoice(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'invoice_number' => 'required|string|max:255',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $invoice = $this->fmsService->createInvoice($request->all());

        return redirect()->back()->with('success', 'Invoice created successfully.');
    }

    /**
     * FMS Settings
     */
    public function settings()
    {
        $settings = $this->fmsService->getSettings();

        return Inertia::render('FMS/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update FMS Settings
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'default_currency' => 'required|string|max:3',
            'fiscal_year_start' => 'required|date_format:m-d',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'auto_invoice_numbering' => 'boolean',
            'invoice_prefix' => 'nullable|string|max:10',
        ]);

        $this->fmsService->updateSettings($request->all());

        return redirect()->back()->with('success', 'FMS settings updated successfully.');
    }
}
