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
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    FunnelIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

const GeneralLedger = ({ auth, entries = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 }, accounts = [], filters: initialFilters = {} }) => {
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
        account: initialFilters.account || 'all',
        type: initialFilters.type || 'all',
        date_from: initialFilters.date_from || '',
        date_to: initialFilters.date_to || '',
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
                router.get(route('finance.general-ledger.index'), newFilters, {
                    preserveState: true,
                    preserveScroll: true,
                });
            }, 300);
        } else {
            router.get(route('finance.general-ledger.index'), newFilters, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    // Handle pagination
    const handlePageChange = (page) => {
        router.get(route('finance.general-ledger.index'), { ...filters, page }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Table columns
    const columns = [
        { uid: 'date', name: 'Date', sortable: true },
        { uid: 'reference', name: 'Reference', sortable: true },
        { uid: 'account', name: 'Account', sortable: true },
        { uid: 'type', name: 'Type', sortable: true },
        { uid: 'debit', name: 'Debit', sortable: true },
        { uid: 'credit', name: 'Credit', sortable: true },
        { uid: 'balance', name: 'Balance', sortable: true },
        { uid: 'actions', name: 'Actions', sortable: false },
    ];

    // Status color map
    const typeColorMap = {
        debit: "primary",
        credit: "success",
        adjustment: "warning",
    };

    // Render cell
    const renderCell = (entry, columnKey) => {
        switch (columnKey) {
            case 'date':
                return <span className="text-sm">{entry.date}</span>;
            case 'reference':
                return <span className="text-sm font-medium">{entry.reference}</span>;
            case 'account':
                return (
                    <div>
                        <p className="text-sm font-medium">{entry.account_name}</p>
                        <p className="text-xs text-default-400">{entry.account_code}</p>
                    </div>
                );
            case 'type':
                return (
                    <Chip
                        color={typeColorMap[entry.type] || "default"}
                        variant="flat"
                        size="sm"
                        radius={themeRadius}
                    >
                        {entry.type}
                    </Chip>
                );
            case 'debit':
                return entry.debit ? (
                    <span className="text-sm font-medium">${entry.debit.toLocaleString()}</span>
                ) : (
                    <span className="text-sm text-default-400">-</span>
                );
            case 'credit':
                return entry.credit ? (
                    <span className="text-sm font-medium">${entry.credit.toLocaleString()}</span>
                ) : (
                    <span className="text-sm text-default-400">-</span>
                );
            case 'balance':
                return (
                    <span className={`text-sm font-medium ${entry.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                        ${Math.abs(entry.balance).toLocaleString()}
                    </span>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-2">
                        {hasPermission('finance.general-ledger.edit') && (
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
                                        onPress={() => safeNavigate('finance.general-ledger.edit', entry.id)}
                                    >
                                        Edit
                                    </DropdownItem>
                                    <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => handleDelete(entry.id)}
                                    >
                                        Delete
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                );
            default:
                return <span className="text-sm">{entry[columnKey]}</span>;
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            safeDelete('finance.general-ledger.destroy', { id });
        }
    };

    return (
        <App>
            <Head title="General Ledger" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                <PageHeader
                    title="General Ledger"
                    description="View and manage general ledger entries"
                    action={
                        hasPermission('finance.general-ledger.create') && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-5 h-5" />}
                                onPress={() => safeNavigate('finance.general-ledger.create')}
                                radius={themeRadius}
                            >
                                New Entry
                            </Button>
                        )
                    }
                />

                {/* Filters */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <Input
                            placeholder="Search by reference, account..."
                            value={filters.search}
                            onValueChange={(value) => handleFilterChange('search', value)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            classNames={{
                                inputWrapper: "bg-default-100"
                            }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        />

                        {/* Account Filter */}
                        <Select
                            placeholder="All Accounts"
                            selectedKeys={filters.account !== 'all' ? [filters.account] : []}
                            onSelectionChange={(keys) => handleFilterChange('account', Array.from(keys)[0] || 'all')}
                            classNames={{ trigger: "bg-default-100" }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="all">All Accounts</SelectItem>
                            {accounts?.map((account) => (
                                <SelectItem key={account.id}>{account.name}</SelectItem>
                            ))}
                        </Select>

                        {/* Type Filter */}
                        <Select
                            placeholder="All Types"
                            selectedKeys={filters.type !== 'all' ? [filters.type] : []}
                            onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || 'all')}
                            classNames={{ trigger: "bg-default-100" }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="all">All Types</SelectItem>
                            <SelectItem key="debit">Debit</SelectItem>
                            <SelectItem key="credit">Credit</SelectItem>
                            <SelectItem key="adjustment">Adjustment</SelectItem>
                        </Select>

                        {/* Export Button */}
                        {hasPermission('finance.general-ledger.export') && (
                            <Button
                                variant="flat"
                                startContent={<DocumentArrowDownIcon className="w-5 h-5" />}
                                onPress={() => safeNavigate('finance.general-ledger.export', filters)}
                                radius={themeRadius}
                            >
                                Export
                            </Button>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            type="date"
                            label="From Date"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            classNames={{ inputWrapper: "bg-default-100" }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        />
                        <Input
                            type="date"
                            label="To Date"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            classNames={{ inputWrapper: "bg-default-100" }}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        />
                    </div>
                </div>

                {/* Table */}
                <Table
                    aria-label="General Ledger Entries"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                    bottomContent={
                        entries.last_page > 1 && (
                            <div className="flex w-full justify-center">
                                <Pagination
                                    isCompact
                                    showControls
                                    showShadow
                                    color="primary"
                                    page={entries.current_page}
                                    total={entries.last_page}
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
                        items={entries.data}
                        emptyContent="No general ledger entries found"
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

                {/* Summary */}
                {entries.data.length > 0 && (
                    <div className="mt-4 p-4 bg-default-100 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-default-500">Total Entries</p>
                                <p className="text-2xl font-bold">{entries.total}</p>
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Total Debits</p>
                                <p className="text-2xl font-bold text-primary">
                                    ${entries.data.reduce((sum, e) => sum + (e.debit || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-default-500">Total Credits</p>
                                <p className="text-2xl font-bold text-success">
                                    ${entries.data.reduce((sum, e) => sum + (e.credit || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default GeneralLedger;
