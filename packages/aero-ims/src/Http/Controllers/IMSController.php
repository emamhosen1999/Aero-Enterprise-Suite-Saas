<?php

namespace Aero\Ims\Http\Controllers;

use Illuminate\Routing\Controller;
use App\Services\Tenant\IMS\IMSService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IMSController extends Controller
{
    protected $imsService;

    public function __construct(IMSService $imsService)
    {
        $this->imsService = $imsService;
    }

    /**
     * Get permissions array for IMS module
     */
    private function getPermissions()
    {
        return [
            'view_inventory' => Auth::user()->can('inventory.view'),
            'manage_inventory' => Auth::user()->can('warehousing.manage'),
            'create_inventory' => Auth::user()->can('inventory.create'),
            'update_inventory' => Auth::user()->can('inventory.update'),
            'delete_inventory' => Auth::user()->can('inventory.delete'),
            'view_suppliers' => Auth::user()->can('suppliers.view'),
            'create_suppliers' => Auth::user()->can('suppliers.create'),
            'view_purchase_orders' => Auth::user()->can('purchase-orders.view'),
            'create_purchase_orders' => Auth::user()->can('purchase-orders.create'),
        ];
    }

    /**
     * Display the main IMS dashboard
     */
    public function index()
    {
        $data = $this->imsService->getDashboardData();

        return Inertia::render('Pages/IMS/Index', [
            'data' => $data,
            'can' => $this->getPermissions(),
        ]);
    }

    /**
     * Display products management
     */
    public function products()
    {
        $products = $this->imsService->getProducts();

        return Inertia::render('Pages/IMS/Products/Index', [
            'products' => $products,
            'can' => $this->getPermissions(),
        ]);
    }

    /**
     * Display warehouse management
     */
    public function warehouse()
    {
        $warehouses = $this->imsService->getWarehouses();

        return Inertia::render('Pages/IMS/Warehouse/Index', [
            'warehouses' => $warehouses,
            'can' => $this->getPermissions(),
        ]);
    }

    /**
     * Display stock movements
     */
    public function stockMovements()
    {
        $movements = $this->imsService->getStockMovements();

        return Inertia::render('Pages/IMS/StockMovements/Index', [
            'movements' => $movements,
            'can' => $this->getPermissions(),
        ]);
    }

    /**
     * Display suppliers management
     */
    public function suppliers()
    {
        $suppliers = $this->imsService->getSuppliers();

        return Inertia::render('Pages/IMS/Suppliers/Index', [
            'suppliers' => $suppliers,
            'can' => $this->getPermissions(),
        ]);
    }

    /**
     * Display purchase orders
     */
    public function purchaseOrders()
    {
        $orders = $this->imsService->getPurchaseOrders();

        return Inertia::render('Pages/IMS/PurchaseOrders/Index', [
            'orders' => $orders,
            'can' => $this->getPermissions(),
        ]);
    }

    /**
     * Display inventory reports
     */
    public function reports()
    {
        $reports = $this->imsService->getReports();

        return Inertia::render('Pages/IMS/Reports/Index', [
            'reports' => $reports,
            'can' => $this->getPermissions(),
        ]);
    }
}
