import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
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
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    DocumentArrowDownIcon,
    CalculatorIcon,
} from "@heroicons/react/24/outline";
import {useHRMAC} from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import App from "@/Layouts/App.jsx";
import StandardPageLayout from '@/Layouts/StandardPageLayout';
import StatsCards from '@/Components/StatsCards';

const GeneralLedger = ({ auth, entries = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 }, accounts = [], filters: initialFilters = {} }) => {
    // HRMAC permissions
    const { canCreate, canUpdate, canDelete, hasAccess, isSuperAdmin } = useHRMAC();
    
    const canViewLedger = hasAccess('finance.ledger') || isSuperAdmin();
    const canCreateEntry = canCreate('finance.ledger.entries') || isSuperAdmin();
    const canEditEntry = canUpdate('finance.ledger.entries') || isSuperAdmin();
    const canDeleteEntry = canDelete('finance.ledger.entries') || isSuperAdmin();
    const canExportLedger = hasAccess('finance.ledger.export') || isSuperAdmin();
    
    const themeRadius = useThemeRadius();
    
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

    // Calculate stats
    const totalDebits = entries.data.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredits = entries.data.reduce((sum, e) => sum + (e.credit || 0), 0);

    // Stats data for StatsCards
    const statsData = useMemo(() => [
        {
            title: "Total Entries",
            value: entries.total,
            icon: <CalculatorIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20"
        },
        {
            title: "Total Debits",
            value: `$${totalDebits.toLocaleString()}`,
            icon: <CalculatorIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20"
        },
        {
            title: "Total Credits",
            value: `$${totalCredits.toLocaleString()}`,
            icon: <CalculatorIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20"
        },
        {
            title: "Net Balance",
            value: `$${Math.abs(totalDebits - totalCredits).toLocaleString()}`,
            icon: <CalculatorIcon className="w-6 h-6" />,
            color: totalDebits >= totalCredits ? "text-success" : "text-danger",
            iconBg: totalDebits >= totalCredits ? "bg-success/20" : "bg-danger/20"
        },
    ], [entries.total, totalDebits, totalCredits]);

    // Action buttons
    const actionButtons = useMemo(() => (
        <>
            {canExportLedger && (
                <Button
                    variant="flat"
                    startContent={<DocumentArrowDownIcon className="w-5 h-5" />}
                    onPress={() => safeNavigate('finance.general-ledger.export', filters)}
                    radius={themeRadius}
                    size={isMobile ? "sm" : "md"}
                >
                    Export
                </Button>
            )}
            {canCreateEntry && (
                <Button
                    color="primary"
                    startContent={<PlusIcon className="w-5 h-5" />}
                    onPress={() => safeNavigate('finance.general-ledger.create')}
                    radius={themeRadius}
                    size={isMobile ? "sm" : "md"}
                >
                    New Entry
                </Button>
            )}
        </>
    ), [canExportLedger, canCreateEntry, filters, themeRadius, isMobile]);

    // Filters section
    const filtersSection = useMemo(() => (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    placeholder="Search by reference, account..."
                    value={filters.search}
                    onValueChange={(value) => handleFilterChange('search', value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    classNames={{ inputWrapper: "bg-default-100" }}
                    radius={themeRadius}
                    className="sm:max-w-xs"
                />

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
            </div>

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
    ), [filters, accounts, themeRadius]);

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
                        {canEditEntry && (
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
        <>
            <Head title="General Ledger" />
            
            <StandardPageLayout
                title="General Ledger"
                subtitle="View and manage general ledger entries"
                icon={<CalculatorIcon className="w-8 h-8" />}
                actions={actionButtons}
                stats={<StatsCards stats={statsData} />}
                filters={filtersSection}
            >
                {/* Table */}
                <Table
                    aria-label="General Ledger Entries"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
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

                {/* Pagination */}
                {entries.last_page > 1 && (
                    <div className="flex w-full justify-center mt-4">
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
                )}
            </StandardPageLayout>
        </>
    );
};

GeneralLedger.layout = (page) => <App children={page} />;
export default GeneralLedger;
