<?php

namespace App\Services\Tenant\IMS;

use Illuminate\Support\Collection;

class IMSService
{
    /**
     * Get dashboard data for IMS
     */
    public function getDashboardData(): array
    {
        return [
            'totalProducts' => 1250,
            'lowStockItems' => 23,
            'outOfStockItems' => 8,
            'totalWarehouses' => 5,
            'totalSuppliers' => 45,
            'pendingOrders' => 12,
            'monthlyMovements' => 456,
            'inventoryValue' => 125000.50,
            'recentMovements' => $this->getRecentMovements(),
            'lowStockAlerts' => $this->getLowStockAlerts(),
            'topProducts' => $this->getTopProducts(),
            'warehouseStatus' => $this->getWarehouseStatus(),
        ];
    }

    /**
     * Get all products with inventory data
     */
    public function getProducts(): Collection
    {
        // Mock data - in real implementation, this would query the database
        return collect([
            [
                'id' => 1,
                'sku' => 'PRD-001',
                'name' => 'Wireless Headphones',
                'category' => 'Electronics',
                'brand' => 'TechBrand',
                'currentStock' => 150,
                'minimumStock' => 20,
                'maximumStock' => 500,
                'unitPrice' => 89.99,
                'totalValue' => 13498.50,
                'supplier' => 'Tech Suppliers Inc',
                'warehouse' => 'Main Warehouse',
                'status' => 'in_stock',
                'lastMovement' => '2024-01-15',
            ],
            [
                'id' => 2,
                'sku' => 'PRD-002',
                'name' => 'Smart Watch',
                'category' => 'Electronics',
                'brand' => 'SmartTech',
                'currentStock' => 8,
                'minimumStock' => 15,
                'maximumStock' => 200,
                'unitPrice' => 199.99,
                'totalValue' => 1599.92,
                'supplier' => 'Smart Devices Co',
                'warehouse' => 'Main Warehouse',
                'status' => 'low_stock',
                'lastMovement' => '2024-01-14',
            ],
            [
                'id' => 3,
                'sku' => 'PRD-003',
                'name' => 'Bluetooth Speaker',
                'category' => 'Electronics',
                'brand' => 'AudioMax',
                'currentStock' => 0,
                'minimumStock' => 10,
                'maximumStock' => 150,
                'unitPrice' => 59.99,
                'totalValue' => 0,
                'supplier' => 'Audio Supplies Ltd',
                'warehouse' => 'Secondary Warehouse',
                'status' => 'out_of_stock',
                'lastMovement' => '2024-01-10',
            ],
        ]);
    }

    /**
     * Get all warehouses
     */
    public function getWarehouses(): Collection
    {
        return collect([
            [
                'id' => 1,
                'name' => 'Main Warehouse',
                'code' => 'WH-001',
                'address' => '123 Industrial Ave, City',
                'manager' => 'John Smith',
                'capacity' => 10000,
                'currentUtilization' => 7500,
                'utilizationPercentage' => 75,
                'totalProducts' => 850,
                'status' => 'active',
                'type' => 'distribution',
            ],
            [
                'id' => 2,
                'name' => 'Secondary Warehouse',
                'code' => 'WH-002',
                'address' => '456 Storage Blvd, City',
                'manager' => 'Jane Doe',
                'capacity' => 5000,
                'currentUtilization' => 2300,
                'utilizationPercentage' => 46,
                'totalProducts' => 400,
                'status' => 'active',
                'type' => 'storage',
            ],
        ]);
    }

    /**
     * Get stock movements
     */
    public function getStockMovements(): Collection
    {
        return collect([
            [
                'id' => 1,
                'type' => 'inbound',
                'productSku' => 'PRD-001',
                'productName' => 'Wireless Headphones',
                'quantity' => 50,
                'warehouse' => 'Main Warehouse',
                'reference' => 'PO-2024-001',
                'reason' => 'Purchase Order',
                'date' => '2024-01-15',
                'user' => 'Admin User',
                'unitCost' => 65.00,
                'totalCost' => 3250.00,
            ],
            [
                'id' => 2,
                'type' => 'outbound',
                'productSku' => 'PRD-002',
                'productName' => 'Smart Watch',
                'quantity' => 7,
                'warehouse' => 'Main Warehouse',
                'reference' => 'SO-2024-005',
                'reason' => 'Sales Order',
                'date' => '2024-01-14',
                'user' => 'Sales Team',
                'unitCost' => 150.00,
                'totalCost' => 1050.00,
            ],
        ]);
    }

    /**
     * Get suppliers
     */
    public function getSuppliers(): Collection
    {
        return collect([
            [
                'id' => 1,
                'name' => 'Tech Suppliers Inc',
                'code' => 'SUP-001',
                'contactPerson' => 'Mike Johnson',
                'email' => 'mike@techsuppliers.com',
                'phone' => '+1-555-0123',
                'address' => '789 Supplier St, Business District',
                'productsSupplied' => 45,
                'totalOrders' => 23,
                'totalValue' => 45000.00,
                'status' => 'active',
                'rating' => 4.5,
                'paymentTerms' => 'Net 30',
            ],
            [
                'id' => 2,
                'name' => 'Smart Devices Co',
                'code' => 'SUP-002',
                'contactPerson' => 'Sarah Wilson',
                'email' => 'sarah@smartdevices.com',
                'phone' => '+1-555-0456',
                'address' => '321 Tech Park, Innovation Center',
                'productsSupplied' => 12,
                'totalOrders' => 8,
                'totalValue' => 18500.00,
                'status' => 'active',
                'rating' => 4.8,
                'paymentTerms' => 'Net 15',
            ],
        ]);
    }

    /**
     * Get purchase orders
     */
    public function getPurchaseOrders(): Collection
    {
        return collect([
            [
                'id' => 1,
                'orderNumber' => 'PO-2024-001',
                'supplier' => 'Tech Suppliers Inc',
                'orderDate' => '2024-01-10',
                'expectedDate' => '2024-01-20',
                'status' => 'pending',
                'totalAmount' => 5500.00,
                'itemsCount' => 3,
                'warehouse' => 'Main Warehouse',
                'requestedBy' => 'Inventory Manager',
                'approvedBy' => 'Operations Director',
            ],
            [
                'id' => 2,
                'orderNumber' => 'PO-2024-002',
                'supplier' => 'Smart Devices Co',
                'orderDate' => '2024-01-12',
                'expectedDate' => '2024-01-18',
                'status' => 'approved',
                'totalAmount' => 3200.00,
                'itemsCount' => 2,
                'warehouse' => 'Secondary Warehouse',
                'requestedBy' => 'Store Manager',
                'approvedBy' => 'Finance Manager',
            ],
        ]);
    }

    /**
     * Get inventory reports data
     */
    public function getReports(): array
    {
        return [
            'stockLevels' => $this->getStockLevelsReport(),
            'movementAnalysis' => $this->getMovementAnalysisReport(),
            'supplierPerformance' => $this->getSupplierPerformanceReport(),
            'warehouseUtilization' => $this->getWarehouseUtilizationReport(),
            'inventoryTurnover' => $this->getInventoryTurnoverReport(),
            'abcAnalysis' => $this->getABCAnalysisReport(),
        ];
    }

    /**
     * Get recent movements for dashboard
     */
    private function getRecentMovements(): Collection
    {
        return collect([
            [
                'type' => 'inbound',
                'product' => 'Wireless Headphones',
                'quantity' => 50,
                'date' => '2024-01-15',
            ],
            [
                'type' => 'outbound',
                'product' => 'Smart Watch',
                'quantity' => 7,
                'date' => '2024-01-14',
            ],
        ]);
    }

    /**
     * Get low stock alerts
     */
    private function getLowStockAlerts(): Collection
    {
        return collect([
            [
                'product' => 'Smart Watch',
                'currentStock' => 8,
                'minimumStock' => 15,
                'urgency' => 'high',
            ],
            [
                'product' => 'Bluetooth Speaker',
                'currentStock' => 0,
                'minimumStock' => 10,
                'urgency' => 'critical',
            ],
        ]);
    }

    /**
     * Get top products by movement
     */
    private function getTopProducts(): Collection
    {
        return collect([
            ['name' => 'Wireless Headphones', 'movements' => 245],
            ['name' => 'Smart Watch', 'movements' => 189],
            ['name' => 'Bluetooth Speaker', 'movements' => 156],
        ]);
    }

    /**
     * Get warehouse status overview
     */
    private function getWarehouseStatus(): Collection
    {
        return collect([
            ['name' => 'Main Warehouse', 'utilization' => 75, 'status' => 'good'],
            ['name' => 'Secondary Warehouse', 'utilization' => 46, 'status' => 'good'],
        ]);
    }

    /**
     * Additional report methods
     */
    private function getStockLevelsReport(): array
    {
        return [
            'totalItems' => 1250,
            'lowStock' => 23,
            'outOfStock' => 8,
            'overStock' => 15,
        ];
    }

    private function getMovementAnalysisReport(): array
    {
        return [
            'inbound' => 1234,
            'outbound' => 1189,
            'adjustments' => 45,
            'transfers' => 67,
        ];
    }

    private function getSupplierPerformanceReport(): array
    {
        return [
            'onTime' => 87,
            'delayed' => 13,
            'averageLeadTime' => 8.5,
        ];
    }

    private function getWarehouseUtilizationReport(): array
    {
        return [
            'average' => 62,
            'highest' => 75,
            'lowest' => 46,
        ];
    }

    private function getInventoryTurnoverReport(): array
    {
        return [
            'averageTurnover' => 6.2,
            'fastMoving' => 125,
            'slowMoving' => 45,
        ];
    }

    private function getABCAnalysisReport(): array
    {
        return [
            'classA' => 20,
            'classB' => 30,
            'classC' => 50,
        ];
    }
}
