import { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
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
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PlusIcon,
    ArrowUpIcon,
    ArrowDownIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const StockAdjustments = ({ adjustments = [], warehouses = [], auth }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [reasonFilter, setReasonFilter] = useState('all');
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Responsive
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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

    // Permission helper
    const hasPermission = (permission) => {
        return auth?.user?.permissions?.includes(permission) || auth?.user?.is_super_admin;
    };

    // Mock data
    const mockAdjustments = adjustments.length > 0 ? adjustments : [
        { id: 1, adjustment_number: 'ADJ-2024-001', item: 'Widget A', warehouse: 'Main Warehouse', date: '2024-01-20', type: 'increase', quantity: 50, reason: 'recount', adjusted_by: 'John Doe' },
        { id: 2, adjustment_number: 'ADJ-2024-002', item: 'Gadget B', warehouse: 'Regional DC', date: '2024-01-18', type: 'decrease', quantity: 15, reason: 'damaged', adjusted_by: 'Jane Smith' },
        { id: 3, adjustment_number: 'ADJ-2024-003', item: 'Product C', warehouse: 'Retail Store 1', date: '2024-01-19', type: 'decrease', quantity: 5, reason: 'theft', adjusted_by: 'Mike Johnson' },
    ];

    // Type color map
    const typeColorMap = {
        increase: 'success',
        decrease: 'danger',
        recount: 'warning',
        damage: 'danger',
        return: 'primary',
    };

    // Filter and search
    const filteredAdjustments = useMemo(() => {
        return mockAdjustments.filter(adj => {
            const matchesSearch = adj.adjustment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                adj.item.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesWarehouse = warehouseFilter === 'all' || adj.warehouse === warehouseFilter;
            const matchesType = typeFilter === 'all' || adj.type === typeFilter;
            const matchesReason = reasonFilter === 'all' || adj.reason === reasonFilter;
            return matchesSearch && matchesWarehouse && matchesType && matchesReason;
        });
    }, [mockAdjustments, searchTerm, warehouseFilter, typeFilter, reasonFilter]);

    // Pagination
    const pages = Math.ceil(filteredAdjustments.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredAdjustments.slice(start, end);
    }, [page, filteredAdjustments]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const renderCell = (adjustment, columnKey) => {
        switch (columnKey) {
            case 'adjustment_number':
                return <span className="font-medium">{adjustment.adjustment_number}</span>;
            case 'item':
                return <span>{adjustment.item}</span>;
            case 'warehouse':
                return <span className="text-sm">{adjustment.warehouse}</span>;
            case 'date':
                return <span>{adjustment.date}</span>;
            case 'type':
                return (
                    <div className="flex items-center gap-1">
                        {adjustment.type === 'increase' ? (
                            <ArrowUpIcon className="w-4 h-4 text-success" />
                        ) : (
                            <ArrowDownIcon className="w-4 h-4 text-danger" />
                        )}
                        <Chip color={typeColorMap[adjustment.type]} size="sm" variant="flat">
                            {adjustment.type.charAt(0).toUpperCase() + adjustment.type.slice(1)}
                        </Chip>
                    </div>
                );
            case 'quantity':
                const color = adjustment.type === 'increase' ? 'text-success' : 'text-danger';
                const sign = adjustment.type === 'increase' ? '+' : '-';
                return <span className={`font-medium ${color}`}>{sign}{adjustment.quantity}</span>;
            case 'reason':
                return (
                    <Chip size="sm" variant="dot">
                        {adjustment.reason.charAt(0).toUpperCase() + adjustment.reason.slice(1)}
                    </Chip>
                );
            case 'adjusted_by':
                return <span className="text-sm">{adjustment.adjusted_by}</span>;
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Adjustment actions">
                            <DropdownItem key="view">View Details</DropdownItem>
                            <DropdownItem key="audit">View Audit Trail</DropdownItem>
                            <DropdownItem key="reverse" className="text-warning" color="warning">
                                Reverse Adjustment
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return null;
        }
    };

    const columns = [
        { uid: 'adjustment_number', name: 'Adjustment #' },
        { uid: 'item', name: 'Item' },
        { uid: 'warehouse', name: 'Warehouse' },
        { uid: 'date', name: 'Date' },
        { uid: 'type', name: 'Type' },
        { uid: 'quantity', name: 'Quantity' },
        { uid: 'reason', name: 'Reason' },
        { uid: 'adjusted_by', name: 'Adjusted By' },
        { uid: 'actions', name: 'Actions' },
    ];

    return (
        <App>
            <Head title="Stock Adjustments" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Stock Adjustments</h1>
                        <p className="text-default-500">Track inventory corrections and adjustments</p>
                    </div>
                    {hasPermission('inventory.stock-adjustments.create') && (
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-5 h-5" />}
                            radius={getThemeRadius()}
                        >
                            New Adjustment
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Input
                        placeholder="Search adjustments..."
                        value={searchTerm}
                        onValueChange={handleSearchChange}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="w-full sm:w-64"
                        radius={getThemeRadius()}
                    />
                    <Select
                        placeholder="All Warehouses"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setWarehouseFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Warehouses</SelectItem>
                        {[...new Set(mockAdjustments.map(a => a.warehouse))].map(wh => (
                            <SelectItem key={wh} value={wh}>{wh}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Types"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Types</SelectItem>
                        <SelectItem key="increase" value="increase">Increase</SelectItem>
                        <SelectItem key="decrease" value="decrease">Decrease</SelectItem>
                        <SelectItem key="recount" value="recount">Recount</SelectItem>
                    </Select>
                    <Select
                        placeholder="All Reasons"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setReasonFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Reasons</SelectItem>
                        <SelectItem key="damaged" value="damaged">Damaged</SelectItem>
                        <SelectItem key="expired" value="expired">Expired</SelectItem>
                        <SelectItem key="theft" value="theft">Theft</SelectItem>
                        <SelectItem key="recount" value="recount">Recount</SelectItem>
                        <SelectItem key="return" value="return">Return</SelectItem>
                    </Select>
                </div>

                {/* Table */}
                <Table
                    aria-label="Stock adjustments table"
                    bottomContent={
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={pages}
                                onChange={(page) => setPage(page)}
                            />
                        </div>
                    }
                >
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={items} emptyContent="No stock adjustments found">
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </motion.div>
        </App>
    );
};

export default StockAdjustments;
