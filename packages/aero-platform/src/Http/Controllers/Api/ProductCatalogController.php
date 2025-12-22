<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Api;

use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Product Catalog API Controller
 *
 * Public API for exposing available products (modules) to tenant applications.
 * This replaces technical "module" terminology with user-friendly "product" terms.
 *
 * Endpoint: /api/products (on platform domain e.g., aeos365.com/api/products)
 */
class ProductCatalogController extends Controller
{
    /**
     * All available products with their features.
     * Core is excluded as it's a foundation product bundled with all subscriptions.
     */
    protected array $productCatalog = [
        'hrm' => [
            'code' => 'hrm',
            'name' => 'Human Resources',
            'description' => 'Complete HR management including employee records, attendance, leave, and payroll.',
            'icon' => 'UserGroupIcon',
            'features' => [
                'Employee Management',
                'Attendance Tracking',
                'Leave Management',
                'Payroll Processing',
                'Performance Reviews',
                'Document Management',
            ],
            'category' => 'operations',
            'popular' => true,
        ],
        'finance' => [
            'code' => 'finance',
            'name' => 'Finance & Accounting',
            'description' => 'Full accounting suite with invoicing, expenses, and financial reporting.',
            'icon' => 'CurrencyDollarIcon',
            'features' => [
                'General Ledger',
                'Accounts Payable/Receivable',
                'Invoicing',
                'Expense Management',
                'Financial Reports',
                'Budget Planning',
            ],
            'category' => 'finance',
            'popular' => true,
        ],
        'crm' => [
            'code' => 'crm',
            'name' => 'Customer Relationship Management',
            'description' => 'Manage customer interactions, sales pipeline, and business relationships.',
            'icon' => 'UserCircleIcon',
            'features' => [
                'Contact Management',
                'Lead Tracking',
                'Sales Pipeline',
                'Customer Support',
                'Email Integration',
                'Analytics & Reports',
            ],
            'category' => 'sales',
            'popular' => true,
        ],
        'project' => [
            'code' => 'project',
            'name' => 'Project Management',
            'description' => 'Plan, execute, and track projects with team collaboration tools.',
            'icon' => 'FolderIcon',
            'features' => [
                'Task Management',
                'Gantt Charts',
                'Time Tracking',
                'Resource Allocation',
                'Milestone Tracking',
                'Team Collaboration',
            ],
            'category' => 'operations',
            'popular' => false,
        ],
        'inventory' => [
            'code' => 'inventory',
            'name' => 'Inventory Management',
            'description' => 'Track stock levels, manage warehouses, and optimize inventory.',
            'icon' => 'CubeIcon',
            'features' => [
                'Stock Tracking',
                'Warehouse Management',
                'Purchase Orders',
                'Stock Alerts',
                'Barcode Scanning',
                'Inventory Reports',
            ],
            'category' => 'operations',
            'popular' => false,
        ],
        'pos' => [
            'code' => 'pos',
            'name' => 'Point of Sale',
            'description' => 'Complete POS system for retail and service businesses.',
            'icon' => 'ShoppingCartIcon',
            'features' => [
                'Sales Terminal',
                'Payment Processing',
                'Receipt Printing',
                'Cash Management',
                'Customer Display',
                'Sales Reports',
            ],
            'category' => 'sales',
            'popular' => false,
        ],
        'scm' => [
            'code' => 'scm',
            'name' => 'Supply Chain Management',
            'description' => 'Manage suppliers, procurement, and logistics operations.',
            'icon' => 'TruckIcon',
            'features' => [
                'Supplier Management',
                'Purchase Orders',
                'Logistics Tracking',
                'Procurement Workflow',
                'Vendor Performance',
                'Supply Analytics',
            ],
            'category' => 'operations',
            'popular' => false,
        ],
        'rfi' => [
            'code' => 'rfi',
            'name' => 'RFI Management',
            'description' => 'Request for Information management for construction and engineering projects.',
            'icon' => 'ClipboardDocumentCheckIcon',
            'features' => [
                'Daily Work Reports',
                'Inspection Records',
                'Work Location Tracking',
                'Photo Documentation',
                'Status Workflow',
                'Report Generation',
            ],
            'category' => 'specialized',
            'popular' => false,
        ],
        'dms' => [
            'code' => 'dms',
            'name' => 'Document Management',
            'description' => 'Centralized document storage, versioning, and collaboration.',
            'icon' => 'DocumentTextIcon',
            'features' => [
                'File Storage',
                'Version Control',
                'Access Permissions',
                'Document Sharing',
                'Search & Indexing',
                'Audit Trail',
            ],
            'category' => 'operations',
            'popular' => false,
        ],
    ];

    /**
     * Get all available products.
     *
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $popular = $request->query('popular');

        $products = collect($this->productCatalog);

        // Filter by category if specified
        if ($category) {
            $products = $products->filter(fn ($p) => $p['category'] === $category);
        }

        // Filter by popularity if specified
        if ($popular !== null) {
            $isPopular = filter_var($popular, FILTER_VALIDATE_BOOLEAN);
            $products = $products->filter(fn ($p) => $p['popular'] === $isPopular);
        }

        return response()->json([
            'success' => true,
            'products' => $products->values()->all(),
            'categories' => $this->getCategories(),
        ]);
    }

    /**
     * Get a specific product by code.
     *
     * @return JsonResponse
     */
    public function show(string $code): JsonResponse
    {
        if (!isset($this->productCatalog[$code])) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'product' => $this->productCatalog[$code],
        ]);
    }

    /**
     * Get product categories.
     *
     * @return array
     */
    protected function getCategories(): array
    {
        return [
            ['code' => 'operations', 'name' => 'Operations', 'description' => 'Streamline your business operations'],
            ['code' => 'finance', 'name' => 'Finance', 'description' => 'Manage finances and accounting'],
            ['code' => 'sales', 'name' => 'Sales & CRM', 'description' => 'Boost sales and customer relationships'],
            ['code' => 'specialized', 'name' => 'Specialized', 'description' => 'Industry-specific solutions'],
        ];
    }

    /**
     * Get featured/popular products.
     *
     * @return JsonResponse
     */
    public function featured(): JsonResponse
    {
        $featured = collect($this->productCatalog)
            ->filter(fn ($p) => $p['popular'] === true)
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'products' => $featured,
        ]);
    }
}
