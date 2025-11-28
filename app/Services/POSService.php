<?php

namespace App\Services;

use App\Models\POS\Category;
use App\Models\POS\Customer;
use App\Models\POS\PaymentMethod;
use App\Models\POS\Product;
use App\Models\POS\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class POSService
{
    /**
     * Get dashboard summary data
     */
    public function getDashboardSummary()
    {
        return [
            'todaySales' => $this->getTodaySales(),
            'totalProducts' => Product::count(),
            'totalCustomers' => Customer::count(),
            'recentTransactions' => $this->getRecentTransactions(5),
            'topProducts' => $this->getTopSellingProducts(5),
            'salesChart' => $this->getSalesChartData(),
        ];
    }

    /**
     * Get today's sales total
     */
    public function getTodaySales()
    {
        return Transaction::whereDate('created_at', Carbon::today())
            ->sum('total_amount');
    }

    /**
     * Get recent transactions
     */
    public function getRecentTransactions($limit = 10)
    {
        return Transaction::with(['customer', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'transaction_number' => $transaction->transaction_number,
                    'customer' => $transaction->customer ? [
                        'name' => $transaction->customer->name,
                        'email' => $transaction->customer->email,
                    ] : null,
                    'total_amount' => $transaction->total_amount,
                    'payment_method' => $transaction->payment_method,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'items_count' => $transaction->items->count(),
                ];
            });
    }

    /**
     * Get all active products
     */
    public function getActiveProducts()
    {
        return Product::where('is_active', true)
            ->with('category')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'cost_price' => $product->cost_price,
                    'barcode' => $product->barcode,
                    'sku' => $product->sku,
                    'stock_quantity' => $product->stock_quantity,
                    'min_stock_level' => $product->min_stock_level,
                    'category' => $product->category ? [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                    ] : null,
                    'image_url' => $product->image_url,
                    'is_active' => $product->is_active,
                ];
            });
    }

    /**
     * Get all products (including inactive)
     */
    public function getAllProducts()
    {
        return Product::with('category')
            ->orderBy('name')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'cost_price' => $product->cost_price,
                    'barcode' => $product->barcode,
                    'sku' => $product->sku,
                    'stock_quantity' => $product->stock_quantity,
                    'min_stock_level' => $product->min_stock_level,
                    'category' => $product->category ? [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                    ] : null,
                    'image_url' => $product->image_url,
                    'is_active' => $product->is_active,
                    'created_at' => $product->created_at->format('Y-m-d H:i:s'),
                ];
            });
    }

    /**
     * Get product categories
     */
    public function getProductCategories()
    {
        return Category::orderBy('name')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'is_active' => $category->is_active,
                    'products_count' => $category->products()->count(),
                ];
            });
    }

    /**
     * Get all customers
     */
    public function getAllCustomers()
    {
        return Customer::orderBy('name')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'address' => $customer->address,
                    'loyalty_points' => $customer->loyalty_points,
                    'total_purchases' => $customer->transactions()->sum('total_amount'),
                    'total_orders' => $customer->transactions()->count(),
                    'last_purchase' => $customer->transactions()->latest()->value('created_at'),
                    'created_at' => $customer->created_at->format('Y-m-d H:i:s'),
                ];
            });
    }

    /**
     * Get payment methods
     */
    public function getPaymentMethods()
    {
        return PaymentMethod::where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get payment transactions
     */
    public function getPaymentTransactions($limit = 20)
    {
        return Transaction::with('customer')
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'transaction_number' => $transaction->transaction_number,
                    'customer_name' => $transaction->customer ? $transaction->customer->name : 'Walk-in Customer',
                    'payment_method' => $transaction->payment_method,
                    'total_amount' => $transaction->total_amount,
                    'tax_amount' => $transaction->tax_amount,
                    'discount_amount' => $transaction->discount_amount,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                ];
            });
    }

    /**
     * Get top selling products
     */
    public function getTopSellingProducts($limit = 10)
    {
        return DB::table('pos_transaction_items')
            ->join('pos_products', 'pos_transaction_items.product_id', '=', 'pos_products.id')
            ->select(
                'pos_products.id',
                'pos_products.name',
                'pos_products.price',
                DB::raw('SUM(pos_transaction_items.quantity) as total_sold'),
                DB::raw('SUM(pos_transaction_items.quantity * pos_transaction_items.price) as total_revenue')
            )
            ->groupBy('pos_products.id', 'pos_products.name', 'pos_products.price')
            ->orderBy('total_sold', 'desc')
            ->take($limit)
            ->get();
    }

    /**
     * Get sales chart data for dashboard
     */
    public function getSalesChartData($days = 7)
    {
        $endDate = Carbon::now();
        $startDate = $endDate->copy()->subDays($days - 1);

        $salesData = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $chartData = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i)->format('Y-m-d');
            $sale = $salesData->firstWhere('date', $date);
            $chartData[] = [
                'date' => $date,
                'total' => $sale ? $sale->total : 0,
            ];
        }

        return $chartData;
    }

    /**
     * Get sales report data
     */
    public function getSalesReport($startDate = null, $endDate = null)
    {
        if (! $startDate) {
            $startDate = Carbon::now()->startOfMonth();
        }
        if (! $endDate) {
            $endDate = Carbon::now()->endOfMonth();
        }

        return [
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'summary' => [
                'total_sales' => Transaction::whereBetween('created_at', [$startDate, $endDate])->sum('total_amount'),
                'total_transactions' => Transaction::whereBetween('created_at', [$startDate, $endDate])->count(),
                'average_transaction' => Transaction::whereBetween('created_at', [$startDate, $endDate])->avg('total_amount'),
                'total_items_sold' => DB::table('pos_transaction_items')
                    ->join('pos_transactions', 'pos_transaction_items.transaction_id', '=', 'pos_transactions.id')
                    ->whereBetween('pos_transactions.created_at', [$startDate, $endDate])
                    ->sum('pos_transaction_items.quantity'),
            ],
            'daily_sales' => $this->getDailySalesData($startDate, $endDate),
            'top_products' => $this->getTopSellingProductsInPeriod($startDate, $endDate),
            'payment_methods' => $this->getPaymentMethodBreakdown($startDate, $endDate),
        ];
    }

    /**
     * Get performance metrics
     */
    public function getPerformanceMetrics()
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        return [
            'today_vs_yesterday' => [
                'today' => Transaction::whereDate('created_at', $today)->sum('total_amount'),
                'yesterday' => Transaction::whereDate('created_at', $yesterday)->sum('total_amount'),
            ],
            'this_month_vs_last_month' => [
                'this_month' => Transaction::where('created_at', '>=', $thisMonth)->sum('total_amount'),
                'last_month' => Transaction::whereBetween('created_at', [$lastMonth, $thisMonth])->sum('total_amount'),
            ],
            'inventory_alerts' => Product::where('stock_quantity', '<=', DB::raw('min_stock_level'))->count(),
            'active_customers' => Customer::whereHas('transactions', function ($query) {
                $query->where('created_at', '>=', Carbon::now()->subDays(30));
            })->count(),
        ];
    }

    /**
     * Process a sale transaction
     */
    public function processSale($data)
    {
        return DB::transaction(function () use ($data) {
            // Create transaction
            $transaction = Transaction::create([
                'transaction_number' => $this->generateTransactionNumber(),
                'customer_id' => $data['customer_id'] ?? null,
                'subtotal' => collect($data['items'])->sum(fn ($item) => $item['quantity'] * $item['price']),
                'tax_amount' => $data['tax_amount'] ?? 0,
                'discount_amount' => $data['discount'] ?? 0,
                'total_amount' => collect($data['items'])->sum(fn ($item) => $item['quantity'] * $item['price']) + ($data['tax_amount'] ?? 0) - ($data['discount'] ?? 0),
                'payment_method' => $data['payment_method'],
                'status' => 'completed',
                'processed_by' => auth()->id(),
            ]);

            // Create transaction items
            foreach ($data['items'] as $item) {
                $transaction->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'total' => $item['quantity'] * $item['price'],
                ]);

                // Update product stock
                Product::where('id', $item['product_id'])
                    ->decrement('stock_quantity', $item['quantity']);
            }

            return $transaction->load('items.product', 'customer');
        });
    }

    /**
     * Get product by barcode
     */
    public function getProductByBarcode($barcode)
    {
        return Product::where('barcode', $barcode)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Generate unique transaction number
     */
    private function generateTransactionNumber()
    {
        $prefix = 'POS';
        $date = Carbon::now()->format('Ymd');
        $sequence = Transaction::whereDate('created_at', Carbon::today())->count() + 1;

        return $prefix.'-'.$date.'-'.str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get daily sales data for a period
     */
    private function getDailySalesData($startDate, $endDate)
    {
        return Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as transactions')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    /**
     * Get top selling products in a period
     */
    private function getTopSellingProductsInPeriod($startDate, $endDate, $limit = 10)
    {
        return DB::table('pos_transaction_items')
            ->join('pos_transactions', 'pos_transaction_items.transaction_id', '=', 'pos_transactions.id')
            ->join('pos_products', 'pos_transaction_items.product_id', '=', 'pos_products.id')
            ->whereBetween('pos_transactions.created_at', [$startDate, $endDate])
            ->select(
                'pos_products.name',
                DB::raw('SUM(pos_transaction_items.quantity) as total_sold'),
                DB::raw('SUM(pos_transaction_items.total) as total_revenue')
            )
            ->groupBy('pos_products.id', 'pos_products.name')
            ->orderBy('total_sold', 'desc')
            ->take($limit)
            ->get();
    }

    /**
     * Get payment method breakdown for a period
     */
    private function getPaymentMethodBreakdown($startDate, $endDate)
    {
        return Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('payment_method, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('payment_method')
            ->orderBy('total', 'desc')
            ->get();
    }
}
