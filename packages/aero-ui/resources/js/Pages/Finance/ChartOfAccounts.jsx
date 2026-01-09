import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
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
    PlusIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    RectangleStackIcon,
    CheckCircleIcon,
    XCircleIcon,
    CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const ChartOfAccounts = ({ accounts = [], accountTypes = [], auth }) => {
    // HRMAC permissions - TODO: Update with actual module hierarchy paths once defined
    const { canCreate, canUpdate, canDelete, hasAccess, isSuperAdmin } = useHRMAC();
    const canViewAccounts = hasAccess('finance.chart-of-accounts') || isSuperAdmin();
    const canCreateAccount = canCreate('finance.chart-of-accounts') || isSuperAdmin();
    const canEditAccount = canUpdate('finance.chart-of-accounts') || isSuperAdmin();
    const canDeleteAccount = canDelete('finance.chart-of-accounts') || isSuperAdmin();
    const canExportAccounts = canUpdate('finance.chart-of-accounts') || isSuperAdmin();
    
    const themeRadius = useThemeRadius();
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(20);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.user?.isPlatformSuperAdmin;
    };

    // Sample data
    const sampleAccounts = [
        { id: 1, code: '1000', name: 'Assets', type: 'Asset', parent: null, balance: 150000, status: 'active', level: 0 },
        { id: 2, code: '1100', name: 'Current Assets', type: 'Asset', parent: 'Assets', balance: 80000, status: 'active', level: 1 },
        { id: 3, code: '1110', name: 'Cash and Bank', type: 'Asset', parent: 'Current Assets', balance: 45000, status: 'active', level: 2 },
        { id: 4, code: '1120', name: 'Accounts Receivable', type: 'Asset', parent: 'Current Assets', balance: 35000, status: 'active', level: 2 },
        { id: 5, code: '2000', name: 'Liabilities', type: 'Liability', parent: null, balance: 50000, status: 'active', level: 0 },
        { id: 6, code: '2100', name: 'Current Liabilities', type: 'Liability', parent: 'Liabilities', balance: 30000, status: 'active', level: 1 },
        { id: 7, code: '3000', name: 'Equity', type: 'Equity', parent: null, balance: 100000, status: 'active', level: 0 },
        { id: 8, code: '4000', name: 'Revenue', type: 'Revenue', parent: null, balance: 200000, status: 'active', level: 0 },
        { id: 9, code: '5000', name: 'Expenses', type: 'Expense', parent: null, balance: 50000, status: 'active', level: 0 },
    ];

    const accountData = accounts.length > 0 ? accounts : sampleAccounts;

    const filteredAccounts = accountData.filter(account => {
        const matchesSearch = searchQuery === '' || 
            account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.code.includes(searchQuery);
        const matchesType = selectedType === 'all' || account.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || account.status === selectedStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const paginatedAccounts = filteredAccounts.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const totalPages = Math.ceil(filteredAccounts.length / perPage);

    const accountTypeColors = {
        'Asset': 'success',
        'Liability': 'danger',
        'Equity': 'primary',
        'Revenue': 'success',
        'Expense': 'warning',
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleExport = () => {
        console.log('Exporting chart of accounts...');
    };

    const renderCell = (account, columnKey) => {
        switch (columnKey) {
            case 'code':
                return <span className="font-mono text-sm">{account.code}</span>;
            
            case 'name':
                const indent = account.level * 24;
                return (
                    <div style={{ paddingLeft: `${indent}px` }} className="flex items-center">
                        <span className={account.level > 0 ? 'text-sm' : 'font-semibold'}>
                            {account.name}
                        </span>
                    </div>
                );
            
            case 'type':
                return (
                    <Chip
                        color={accountTypeColors[account.type] || 'default'}
                        size="sm"
                        variant="flat"
                    >
                        {account.type}
                    </Chip>
                );
            
            case 'parent':
                return account.parent ? (
                    <span className="text-sm text-default-600">{account.parent}</span>
                ) : (
                    <span className="text-xs text-default-400">Root Account</span>
                );
            
            case 'balance':
                return (
                    <span className="font-mono text-sm">
                        ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                );
            
            case 'status':
                return (
                    <Chip
                        color={account.status === 'active' ? 'success' : 'default'}
                        size="sm"
                        variant="dot"
                    >
                        {account.status === 'active' ? 'Active' : 'Inactive'}
                    </Chip>
                );
            
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Account actions">
                            <DropdownItem
                                key="edit"
                                startContent={<PencilIcon className="w-4 h-4" />}
                            >
                                Edit
                            </DropdownItem>
                            <DropdownItem
                                key="add-sub"
                                startContent={<PlusIcon className="w-4 h-4" />}
                            >
                                Add Sub-Account
                            </DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            
            default:
                return null;
        }
    };

    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Account Name' },
        { key: 'type', label: 'Type' },
        { key: 'parent', label: 'Parent Account' },
        { key: 'balance', label: 'Balance' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ];

    // Calculate stats
    const stats = useMemo(() => {
        const active = filteredAccounts.filter(a => a.status === 'active').length;
        const totalBalance = filteredAccounts.reduce((sum, a) => sum + a.balance, 0);
        const accountsByType = filteredAccounts.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {});
        
        return {
            total: filteredAccounts.length,
            active,
            totalBalance,
            types: Object.keys(accountsByType).length
        };
    }, [filteredAccounts]);

    // Stats data
    const statsData = useMemo(() => [
        {
            title: 'Total Accounts',
            value: stats.total,
            icon: <RectangleStackIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'All accounts'
        },
        {
            title: 'Active',
            value: stats.active,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Active accounts'
        },
        {
            title: 'Total Balance',
            value: `$${stats.totalBalance.toLocaleString()}`,
            icon: <CurrencyDollarIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Combined balance'
        },
        {
            title: 'Account Types',
            value: stats.types,
            icon: <RectangleStackIcon className="w-5 h-5" />,
            color: 'text-default-600',
            iconBg: 'bg-default-100',
            description: 'Categories'
        },
    ], [stats]);

    // Action buttons
    const actionButtons = useMemo(() => (
        <>
            {canExportAccounts && (
                <Button
                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                    variant="flat"
                    onPress={handleExport}
                    radius={themeRadius}
                    size={isMobile ? "sm" : "md"}
                >
                    Export
                </Button>
            )}
            {canCreateAccount && (
                <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    radius={themeRadius}
                    size={isMobile ? "sm" : "md"}
                >
                    New Account
                </Button>
            )}
        </>
    ), [canExportAccounts, canCreateAccount, themeRadius, isMobile]);

    // Filters section
    const filtersSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-3">
            <Input
                placeholder="Search by code or name..."
                value={searchQuery}
                onValueChange={handleSearch}
                startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                className="w-full sm:flex-1"
                radius={themeRadius}
            />
            <Select
                placeholder="Account Type"
                selectedKeys={selectedType !== 'all' ? [selectedType] : []}
                onSelectionChange={(keys) => {
                    setSelectedType(Array.from(keys)[0] || 'all');
                    setCurrentPage(1);
                }}
                className="w-full sm:w-48"
                radius={themeRadius}
                startContent={<FunnelIcon className="w-4 h-4" />}
            >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="Asset">Asset</SelectItem>
                <SelectItem key="Liability">Liability</SelectItem>
                <SelectItem key="Equity">Equity</SelectItem>
                <SelectItem key="Revenue">Revenue</SelectItem>
                <SelectItem key="Expense">Expense</SelectItem>
            </Select>
            <Select
                placeholder="Status"
                selectedKeys={selectedStatus !== 'all' ? [selectedStatus] : []}
                onSelectionChange={(keys) => {
                    setSelectedStatus(Array.from(keys)[0] || 'all');
                    setCurrentPage(1);
                }}
                className="w-full sm:w-48"
                radius={themeRadius}
            >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="inactive">Inactive</SelectItem>
            </Select>
        </div>
    ), [searchQuery, selectedType, selectedStatus, themeRadius]);

    return (
        <>
            <Head title="Chart of Accounts" />
            
            <StandardPageLayout
                title="Chart of Accounts"
                subtitle="Manage your accounting structure"
                icon={<RectangleStackIcon />}
                actions={actionButtons}
                stats={<StatsCards stats={statsData} />}
                filters={filtersSection}
                ariaLabel="Chart of Accounts Management"
            >
                {/* Table */}
                <Table
                    aria-label="Chart of accounts table"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.key}>
                                {column.label}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        items={paginatedAccounts}
                        emptyContent="No accounts found"
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
                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={totalPages}
                            page={currentPage}
                            onChange={setCurrentPage}
                            showControls
                            radius={themeRadius}
                        />
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

ChartOfAccounts.layout = (page) => <App children={page} />;
export default ChartOfAccounts;
