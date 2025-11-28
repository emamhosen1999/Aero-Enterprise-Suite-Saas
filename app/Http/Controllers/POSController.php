<?php

namespace App\Http\Controllers;

use App\Services\POSService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class POSController extends Controller
{
    protected $posService;

    public function __construct(POSService $posService)
    {
        $this->posService = $posService;
    }

    /**
     * Display the main POS terminal interface
     */
    public function index()
    {
        $products = $this->posService->getProducts();
        $categories = $this->posService->getCategories();
        $customers = $this->posService->getCustomers();
        $recentSales = $this->posService->getRecentSales();

        return Inertia::render('POS/Index', [
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'recentSales' => $recentSales,
        ]);
    }

    /**
     * Display sales dashboard
     */
    public function dashboard()
    {
        $stats = $this->posService->getSalesStats();
        $recentTransactions = $this->posService->getRecentTransactions();
        $topProducts = $this->posService->getTopSellingProducts();
        $chartData = $this->posService->getChartData();

        return Inertia::render('POS/Dashboard', [
            'stats' => $stats,
            'recentTransactions' => $recentTransactions,
            'topProducts' => $topProducts,
            'chartData' => $chartData,
        ]);
    }

    /**
     * Process a new sale transaction
     */
    public function processTransaction(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'required|in:cash,card,check,digital',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'amount_received' => 'required|numeric|min:0',
        ]);

        $transaction = $this->posService->processTransaction($request->all());

        return response()->json([
            'success' => true,
            'transaction' => $transaction,
            'receipt_data' => $this->posService->generateReceipt($transaction),
        ]);
    }

    /**
     * Display sales reports
     */
    public function reports()
    {
        $reportData = $this->posService->getSalesReports();

        return Inertia::render('POS/Reports/Index', [
            'reportData' => $reportData,
        ]);
    }

    /**
     * Generate sales report for specific period
     */
    public function generateReport(Request $request)
    {
        $request->validate([
            'report_type' => 'required|in:daily,weekly,monthly,custom',
            'start_date' => 'required_if:report_type,custom|date',
            'end_date' => 'required_if:report_type,custom|date|after_or_equal:start_date',
        ]);

        $reportData = $this->posService->generateReport(
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
     * Display sales transactions history
     */
    public function transactions()
    {
        $transactions = $this->posService->getTransactions();
        $paymentMethods = $this->posService->getPaymentMethods();

        return Inertia::render('POS/Transactions/Index', [
            'transactions' => $transactions,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Get transaction details
     */
    public function getTransaction($id)
    {
        $transaction = $this->posService->getTransactionDetails($id);

        return response()->json([
            'success' => true,
            'transaction' => $transaction,
        ]);
    }

    /**
     * Void/cancel a transaction
     */
    public function voidTransaction(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $result = $this->posService->voidTransaction($id, $request->reason);

        if ($result) {
            return response()->json([
                'success' => true,
                'message' => 'Transaction voided successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to void transaction',
        ], 400);
    }

    /**
     * Display products management
     */
    public function products()
    {
        $products = $this->posService->getAllProducts();
        $categories = $this->posService->getCategories();

        return Inertia::render('POS/Products/Index', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    /**
     * Store new product
     */
    public function storeProduct(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku|max:100',
            'barcode' => 'nullable|string|unique:products,barcode|max:100',
            'category_id' => 'required|exists:product_categories,id',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_level' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $product = $this->posService->createProduct($request->all());

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    /**
     * Update product
     */
    public function updateProduct(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku,'.$id,
            'barcode' => 'nullable|string|max:100|unique:products,barcode,'.$id,
            'category_id' => 'required|exists:product_categories,id',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_level' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $product = $this->posService->updateProduct($id, $request->all());

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    /**
     * Display customers management
     */
    public function customers()
    {
        $customers = $this->posService->getAllCustomers();

        return Inertia::render('POS/Customers/Index', [
            'customers' => $customers,
        ]);
    }

    /**
     * Store new customer
     */
    public function storeCustomer(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'loyalty_points' => 'nullable|integer|min:0',
        ]);

        $customer = $this->posService->createCustomer($request->all());

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    /**
     * POS Settings
     */
    public function settings()
    {
        $settings = $this->posService->getSettings();
        $taxRates = $this->posService->getTaxRates();

        return Inertia::render('POS/Settings/Index', [
            'settings' => $settings,
            'taxRates' => $taxRates,
        ]);
    }

    /**
     * Update POS Settings
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'store_name' => 'required|string|max:255',
            'currency' => 'required|string|max:3',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'receipt_footer' => 'nullable|string',
            'auto_print_receipt' => 'boolean',
            'loyalty_program_enabled' => 'boolean',
            'points_per_dollar' => 'nullable|numeric|min:0',
        ]);

        $this->posService->updateSettings($request->all());

        return redirect()->back()->with('success', 'POS settings updated successfully.');
    }

    /**
     * Search products by barcode or name
     */
    public function searchProducts(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1',
        ]);

        $products = $this->posService->searchProducts($request->query);

        return response()->json([
            'success' => true,
            'products' => $products,
        ]);
    }

    /**
     * Print receipt
     */
    public function printReceipt($transactionId)
    {
        $receiptData = $this->posService->getReceiptData($transactionId);

        return response()->json([
            'success' => true,
            'receipt_data' => $receiptData,
        ]);
    }
}
