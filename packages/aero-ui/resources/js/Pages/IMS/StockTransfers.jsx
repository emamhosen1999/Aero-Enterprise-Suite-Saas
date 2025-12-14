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
    ArrowDownTrayIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const StockTransfers = ({ transfers = [], warehouses = [], auth }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [fromWarehouseFilter, setFromWarehouseFilter] = useState('all');
    const [toWarehouseFilter, setToWarehouseFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
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
    const mockTransfers = transfers.length > 0 ? transfers : [
        { id: 1, transfer_number: 'TRF-2024-001', from_warehouse: 'Main Warehouse', to_warehouse: 'Regional DC', date: '2024-01-20', items: 25, status: 'in_transit', initiated_by: 'John Doe' },
        { id: 2, transfer_number: 'TRF-2024-002', from_warehouse: 'Regional DC', to_warehouse: 'Retail Store 1', date: '2024-01-18', items: 10, status: 'received', initiated_by: 'Jane Smith' },
        { id: 3, transfer_number: 'TRF-2024-003', from_warehouse: 'Main Warehouse', to_warehouse: 'Transit Hub', date: '2024-01-22', items: 50, status: 'pending', initiated_by: 'Mike Johnson' },
    ];

    const mockWarehouses = warehouses.length > 0 ? warehouses : [
        { id: 1, name: 'Main Warehouse' },
        { id: 2, name: 'Regional DC' },
        { id: 3, name: 'Retail Store 1' },
        { id: 4, name: 'Transit Hub' },
    ];

    // Status color map
    const statusColorMap = {
        pending: 'warning',
        in_transit: 'primary',
        received: 'success',
        cancelled: 'default',
    };

    // Filter and search
    const filteredTransfers = useMemo(() => {
        return mockTransfers.filter(transfer => {
            const matchesSearch = transfer.transfer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                transfer.from_warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                transfer.to_warehouse.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFrom = fromWarehouseFilter === 'all' || transfer.from_warehouse === fromWarehouseFilter;
            const matchesTo = toWarehouseFilter === 'all' || transfer.to_warehouse === toWarehouseFilter;
            const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
            return matchesSearch && matchesFrom && matchesTo && matchesStatus;
        });
    }, [mockTransfers, searchTerm, fromWarehouseFilter, toWarehouseFilter, statusFilter]);

    // Pagination
    const pages = Math.ceil(filteredTransfers.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredTransfers.slice(start, end);
    }, [page, filteredTransfers]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const renderCell = (transfer, columnKey) => {
        switch (columnKey) {
            case 'transfer_number':
                return <span className="font-medium">{transfer.transfer_number}</span>;
            case 'from_warehouse':
                return <span>{transfer.from_warehouse}</span>;
            case 'to_warehouse':
                return <span>{transfer.to_warehouse}</span>;
            case 'date':
                return <span>{transfer.date}</span>;
            case 'items':
                return <Chip size="sm" variant="flat">{transfer.items} items</Chip>;
            case 'status':
                return (
                    <Chip color={statusColorMap[transfer.status]} size="sm" variant="flat">
                        {transfer.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Chip>
                );
            case 'initiated_by':
                return <span className="text-sm">{transfer.initiated_by}</span>;
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Transfer actions">
                            <DropdownItem key="view">View Details</DropdownItem>
                            {transfer.status === 'in_transit' && (
                                <DropdownItem key="receive" startContent={<CheckCircleIcon className="w-4 h-4" />}>
                                    Mark as Received
                                </DropdownItem>
                            )}
                            {transfer.status === 'pending' && (
                                <DropdownItem key="ship">Ship Transfer</DropdownItem>
                            )}
                            <DropdownItem key="edit">Edit</DropdownItem>
                            <DropdownItem key="cancel" className="text-danger" color="danger">
                                Cancel Transfer
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return null;
        }
    };

    const columns = [
        { uid: 'transfer_number', name: 'Transfer #' },
        { uid: 'from_warehouse', name: 'From Warehouse' },
        { uid: 'to_warehouse', name: 'To Warehouse' },
        { uid: 'date', name: 'Date' },
        { uid: 'items', name: 'Items' },
        { uid: 'status', name: 'Status' },
        { uid: 'initiated_by', name: 'Initiated By' },
        { uid: 'actions', name: 'Actions' },
    ];

    return (
        <App>
            <Head title="Stock Transfers" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Stock Transfers</h1>
                        <p className="text-default-500">Manage inter-warehouse stock movements</p>
                    </div>
                    {hasPermission('inventory.stock-transfers.create') && (
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-5 h-5" />}
                            radius={getThemeRadius()}
                        >
                            New Transfer
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Input
                        placeholder="Search transfers..."
                        value={searchTerm}
                        onValueChange={handleSearchChange}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="w-full sm:w-64"
                        radius={getThemeRadius()}
                    />
                    <Select
                        placeholder="From Warehouse"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setFromWarehouseFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Warehouses</SelectItem>
                        {mockWarehouses.map(wh => (
                            <SelectItem key={wh.name} value={wh.name}>{wh.name}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="To Warehouse"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setToWarehouseFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Warehouses</SelectItem>
                        {mockWarehouses.map(wh => (
                            <SelectItem key={wh.name} value={wh.name}>{wh.name}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Status"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Status</SelectItem>
                        <SelectItem key="pending" value="pending">Pending</SelectItem>
                        <SelectItem key="in_transit" value="in_transit">In Transit</SelectItem>
                        <SelectItem key="received" value="received">Received</SelectItem>
                        <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                    </Select>
                    <Button
                        variant="flat"
                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                        radius={getThemeRadius()}
                    >
                        Export
                    </Button>
                </div>

                {/* Table */}
                <Table
                    aria-label="Stock transfers table"
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
                    <TableBody items={items} emptyContent="No stock transfers found">
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

export default StockTransfers;
