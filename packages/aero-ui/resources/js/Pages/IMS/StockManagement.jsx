import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion } from 'framer-motion';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Input,
    Select,
    SelectItem,
    Chip,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Progress,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

const StockManagement = ({ auth, items = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 }, warehouses = [], categories = [], filters: initialFilters = {} }) => {
    // Responsive state
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Filter state
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        warehouse: initialFilters.warehouse || 'all',
        category: initialFilters.category || 'all',
        status: initialFilters.status || 'all',
    });

    // Theme helper
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const themeRadius = getThemeRadius();

    // Permission helper
    const hasPermission = (permission) => {
        return auth.user?.permissions?.includes(permission) || auth.user?.is_super_admin;
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        
        // Debounced search
        if (key === 'search') {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                router.get(route('inventory.stock.index'), newFilters, {
                    preserveState: true,
                    preserveScroll: true,
                });
            }, 300);
        } else {
            router.get(route('inventory.stock.index'), newFilters, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    // Handle pagination
    const handlePageChange = (page) => {
        router.get(route('inventory.stock.index'), { ...filters, page }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Table columns
    const columns = [
        { uid: 'item', name: 'Item', sortable: true },
        { uid: 'sku', name: 'SKU', sortable: true },
        { uid: 'category', name: 'Category', sortable: true },
        { uid: 'warehouse', name: 'Warehouse', sortable: true },
        { uid: 'quantity', name: 'Quantity', sortable: true },
        { uid: 'reorder_level', name: 'Reorder Level', sortable: true },
        { uid: 'status', name: 'Status', sortable: true },
        { uid: 'value', name: 'Value', sortable: true },
        { uid: 'actions', name: 'Actions', sortable: false },
    ];

    // Status color map
    const statusColorMap = {
        in_stock: "success",
        low_stock: "warning",
        out_of_stock: "danger",
        reorder: "primary",
    };

    // Get stock status
    const getStockStatus = (item) => {
        if (item.quantity === 0) return 'out_of_stock';
        if (item.quantity <= item.reorder_level) return 'low_stock';
        if (item.quantity <= item.reorder_level * 1.5) return 'reorder';
        return 'in_stock';
    };

    // Render cell
    const renderCell = (item, columnKey) => {
        const status = getStockStatus(item);
        
        switch (columnKey) {
            case 'item':
                return (
                    <div className="flex items-center gap-3">
                        {item.image && (
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                            />
                        )}
                        <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-default-400">{item.description}</p>
                        </div>
                    </div>
                );
            case 'sku':
                return <span className="text-sm font-mono">{item.sku}</span>;
            case 'category':
                return <span className="text-sm">{item.category_name}</span>;
            case 'warehouse':
                return <span className="text-sm">{item.warehouse_name}</span>;
            case 'quantity':
                return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.quantity}</span>
                            {status === 'low_stock' || status === 'out_of_stock' ? (
                                <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
                            ) : null}
                        </div>
                        <Progress
                            value={(item.quantity / (item.reorder_level * 2)) * 100}
                            color={statusColorMap[status]}
                            size="sm"
                            className="max-w-md"
                            radius={themeRadius}
                        />
                    </div>
                );
            case 'reorder_level':
                return <span className="text-sm">{item.reorder_level}</span>;
            case 'status':
                return (
                    <Chip
                        color={statusColorMap[status]}
                        variant="flat"
                        size="sm"
                        radius={themeRadius}
                    >
                        {status.replace('_', ' ')}
                    </Chip>
                );
            case 'value':
                return (
                    <span className="text-sm font-medium">
                        ${(item.quantity * item.unit_price).toLocaleString()}
                    </span>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-2">
                        {hasPermission('inventory.stock.edit') && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light" radius={themeRadius}>
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Actions">
                                    <DropdownItem
                                        key="edit"
                                        startContent={<PencilIcon className="w-4 h-4" />}
                                        onPress={() => safeNavigate('inventory.stock.edit', item.id)}
                                    >
                                        Edit
                                    </DropdownItem>
                                    <DropdownItem
                                        key="adjust"
                                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                                        onPress={() => safeNavigate('inventory.stock.adjust', item.id)}
                                    >
                                        Adjust Stock
                                    </DropdownItem>
                                    <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => handleDelete(item.id)}
                                    >
                                        Delete
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                );
            default:
                return <span className="text-sm">{item[columnKey]}</span>;
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            safeDelete('inventory.stock.destroy', { id });
        }
    };

    // Calculate summary
    const summary = useMemo(() => {
        const data = items.data || [];
        return {
            totalItems: data.length,
            totalValue: data.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
            lowStock: data.filter(item => getStockStatus(item) === 'low_stock').length,
            outOfStock: data.filter(item => getStockStatus(item) === 'out_of_stock').length,
        };
    }, [items.data]);

    return (
        <App>
            <Head title="Stock Management" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                <PageHeader
                    title="Stock Management"
                    description="Monitor and manage inventory stock levels"
                    action={
                        hasPermission('inventory.stock.create') && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-5 h-5" />}
                                onPress={() => safeNavigate('inventory.stock.create')}
                                radius={themeRadius}
                            >
                                Add Item
                            </Button>
                        )
                    }
                />

                {/* Summary Cards */}
                {items.data.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-default-100 rounded-lg">
                            <p className="text-sm text-default-500">Total Items</p>
                            <p className="text-2xl font-bold">{summary.totalItems}</p>
                        </div>
                        <div className="p-4 bg-default-100 rounded-lg">
                            <p className="text-sm text-default-500">Total Value</p>
                            <p className="text-2xl font-bold">${summary.totalValue.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                            <p className="text-sm text-warning-600 dark:text-warning-400">Low Stock</p>
                            <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                                {summary.lowStock}
                            </p>
                        </div>
                        <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                            <p className="text-sm text-danger-600 dark:text-danger-400">Out of Stock</p>
                            <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                                {summary.outOfStock}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <Input
                            placeholder="Search by name, SKU..."
                            value={filters.search}
                            onValueChange={(value) => handleFilterChange('search', value)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            classNames={{
                                inputWrapper: "bg-default-100"
                            }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        />

                        {/* Warehouse Filter */}
                        <Select
                            placeholder="All Warehouses"
                            selectedKeys={filters.warehouse !== 'all' ? [filters.warehouse] : []}
                            onSelectionChange={(keys) => handleFilterChange('warehouse', Array.from(keys)[0] || 'all')}
                            classNames={{ trigger: "bg-default-100" }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="all">All Warehouses</SelectItem>
                            {warehouses?.map((warehouse) => (
                                <SelectItem key={warehouse.id}>{warehouse.name}</SelectItem>
                            ))}
                        </Select>

                        {/* Category Filter */}
                        <Select
                            placeholder="All Categories"
                            selectedKeys={filters.category !== 'all' ? [filters.category] : []}
                            onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || 'all')}
                            classNames={{ trigger: "bg-default-100" }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="all">All Categories</SelectItem>
                            {categories?.map((category) => (
                                <SelectItem key={category.id}>{category.name}</SelectItem>
                            ))}
                        </Select>

                        {/* Status Filter */}
                        <Select
                            placeholder="All Status"
                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                            classNames={{ trigger: "bg-default-100" }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="all">All Status</SelectItem>
                            <SelectItem key="in_stock">In Stock</SelectItem>
                            <SelectItem key="low_stock">Low Stock</SelectItem>
                            <SelectItem key="out_of_stock">Out of Stock</SelectItem>
                            <SelectItem key="reorder">Reorder</SelectItem>
                        </Select>

                        {/* Export Button */}
                        {hasPermission('inventory.stock.export') && (
                            <Button
                                variant="flat"
                                startContent={<DocumentArrowDownIcon className="w-5 h-5" />}
                                onPress={() => safeNavigate('inventory.stock.export', filters)}
                                radius={themeRadius}
                            >
                                Export
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <Table
                    aria-label="Stock Items"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                    bottomContent={
                        items.last_page > 1 && (
                            <div className="flex w-full justify-center">
                                <Pagination
                                    isCompact
                                    showControls
                                    showShadow
                                    color="primary"
                                    page={items.current_page}
                                    total={items.last_page}
                                    onChange={handlePageChange}
                                    radius={themeRadius}
                                />
                            </div>
                        )
                    }
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid}>
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody
                        items={items.data}
                        emptyContent="No stock items found"
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => (
                                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </motion.div>
        </App>
    );
};

export default StockManagement;
