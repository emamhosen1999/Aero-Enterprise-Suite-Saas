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
    EllipsisVerticalIcon,
    PlusIcon,
    BanknotesIcon,
    BuildingLibraryIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const BankAccounts = ({ accounts = [], auth }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [bankFilter, setBankFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
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

    // Theme radius hook
    const themeRadius = useThemeRadius();

    // HRMAC permissions
    const { canCreate, canUpdate, canDelete, hasAccess, isSuperAdmin } = useHRMAC();
    
    // Finance module permissions - TODO: Update with actual HRMAC module hierarchy once defined
    const canViewBankAccounts = hasAccess('finance.bank-accounts') || isSuperAdmin();
    const canCreateBankAccount = canCreate('finance.bank-accounts') || isSuperAdmin();
    const canEditBankAccount = canUpdate('finance.bank-accounts') || isSuperAdmin();
    const canDeleteBankAccount = canDelete('finance.bank-accounts') || isSuperAdmin();

    // Mock data
    const mockAccounts = accounts.length > 0 ? accounts : [
        { id: 1, name: 'Business Checking', bank: 'Chase Bank', account_number: '****1234', type: 'checking', currency: 'USD', balance: 125000, status: 'active' },
        { id: 2, name: 'Savings Account', bank: 'Wells Fargo', account_number: '****5678', type: 'savings', currency: 'USD', balance: 50000, status: 'active' },
        { id: 3, name: 'Business Credit Card', bank: 'American Express', account_number: '****9012', type: 'credit_card', currency: 'USD', balance: -8500, status: 'active' },
        { id: 4, name: 'Payroll Account', bank: 'Bank of America', account_number: '****3456', type: 'checking', currency: 'USD', balance: 75000, status: 'active' },
    ];

    // Status color map
    const statusColorMap = {
        active: 'success',
        inactive: 'warning',
        closed: 'default',
    };

    // Type labels
    const typeLabels = {
        checking: 'Checking',
        savings: 'Savings',
        credit_card: 'Credit Card',
        loan: 'Loan',
        investment: 'Investment',
    };

    // Filter and search
    const filteredAccounts = useMemo(() => {
        return mockAccounts.filter(account => {
            const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                account.account_number.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBank = bankFilter === 'all' || account.bank === bankFilter;
            const matchesType = typeFilter === 'all' || account.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
            return matchesSearch && matchesBank && matchesType && matchesStatus;
        });
    }, [mockAccounts, searchTerm, bankFilter, typeFilter, statusFilter]);

    // Pagination
    const pages = Math.ceil(filteredAccounts.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredAccounts.slice(start, end);
    }, [page, filteredAccounts]);

    const formatCurrency = (amount, currency = 'USD') => {
        const sign = amount < 0 ? '-' : '';
        return `${sign}$${Math.abs(amount).toLocaleString()}`;
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const renderCell = (account, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{account.name}</span>
                    </div>
                );
            case 'bank':
                return <span>{account.bank}</span>;
            case 'account_number':
                return <span className="font-mono text-sm">{account.account_number}</span>;
            case 'type':
                return <span>{typeLabels[account.type]}</span>;
            case 'currency':
                return <Chip size="sm" variant="flat">{account.currency}</Chip>;
            case 'balance':
                const isNegative = account.balance < 0;
                return (
                    <span className={`font-semibold ${isNegative ? 'text-danger' : 'text-success'}`}>
                        {formatCurrency(account.balance, account.currency)}
                    </span>
                );
            case 'status':
                return (
                    <Chip color={statusColorMap[account.status]} size="sm" variant="flat">
                        {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
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
                            <DropdownItem key="view">View Details</DropdownItem>
                            <DropdownItem key="transactions">View Transactions</DropdownItem>
                            <DropdownItem key="reconcile">Reconcile</DropdownItem>
                            <DropdownItem key="edit">Edit</DropdownItem>
                            <DropdownItem key="deactivate" className="text-warning" color="warning">
                                Deactivate
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return null;
        }
    };

    const columns = [
        { uid: 'name', name: 'Account Name' },
        { uid: 'bank', name: 'Bank' },
        { uid: 'account_number', name: 'Account Number' },
        { uid: 'type', name: 'Type' },
        { uid: 'currency', name: 'Currency' },
        { uid: 'balance', name: 'Balance' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    // Calculate stats
    const stats = useMemo(() => {
        const totalBalance = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const activeAccounts = mockAccounts.filter(acc => acc.status === 'active').length;
        const banks = [...new Set(mockAccounts.map(acc => acc.bank))].length;
        
        return [
            {
                title: 'Total Balance',
                value: formatCurrency(totalBalance),
                icon: <CurrencyDollarIcon className="w-5 h-5" />,
                color: 'text-success',
                iconBg: 'bg-success/20',
                description: 'Across all accounts'
            },
            {
                title: 'Active Accounts',
                value: activeAccounts,
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: 'text-primary',
                iconBg: 'bg-primary/20',
                description: `${mockAccounts.length} total accounts`
            },
            {
                title: 'Banks',
                value: banks,
                icon: <BuildingLibraryIcon className="w-5 h-5" />,
                color: 'text-secondary',
                iconBg: 'bg-secondary/20',
                description: 'Banking institutions'
            },
            {
                title: 'Account Types',
                value: Object.keys(typeLabels).length,
                icon: <BanknotesIcon className="w-5 h-5" />,
                color: 'text-warning',
                iconBg: 'bg-warning/20',
                description: 'Different types'
            },
        ];
    }, [mockAccounts]);

    // Action buttons
    const actionButtons = useMemo(() => (
        <>
            {canCreateBankAccount && (
                <Button
                    color="primary"
                    startContent={<PlusIcon className="w-5 h-5" />}
                    radius={themeRadius}
                    size={isMobile ? "sm" : "md"}
                >
                    Add Account
                </Button>
            )}
        </>
    ), [canCreateBankAccount, themeRadius, isMobile]);

    // Filters section
    const filtersSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onValueChange={handleSearchChange}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                className="w-full sm:w-64"
                radius={themeRadius}
            />
            <Select
                placeholder="All Banks"
                className="w-full sm:w-48"
                radius={themeRadius}
                onChange={(e) => setBankFilter(e.target.value)}
                selectedKeys={bankFilter !== 'all' ? [bankFilter] : []}
            >
                <SelectItem key="all" value="all">All Banks</SelectItem>
                {[...new Set(mockAccounts.map(a => a.bank))].map(bank => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                ))}
            </Select>
            <Select
                placeholder="All Types"
                className="w-full sm:w-48"
                radius={themeRadius}
                onChange={(e) => setTypeFilter(e.target.value)}
                selectedKeys={typeFilter !== 'all' ? [typeFilter] : []}
            >
                <SelectItem key="all" value="all">All Types</SelectItem>
                {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
            </Select>
            <Select
                placeholder="All Status"
                className="w-full sm:w-48"
                radius={themeRadius}
                onChange={(e) => setStatusFilter(e.target.value)}
                selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
            >
                <SelectItem key="all" value="all">All Status</SelectItem>
                <SelectItem key="active" value="active">Active</SelectItem>
                <SelectItem key="inactive" value="inactive">Inactive</SelectItem>
                <SelectItem key="closed" value="closed">Closed</SelectItem>
            </Select>
        </div>
    ), [searchTerm, bankFilter, typeFilter, statusFilter, themeRadius, mockAccounts, handleSearchChange]);

    return (
        <>
            <Head title="Bank Accounts" />
            
            <StandardPageLayout
                title="Bank Accounts"
                subtitle="Manage your bank accounts and balances"
                icon={<BanknotesIcon />}
                actions={actionButtons}
                stats={<StatsCards stats={stats} />}
                filters={filtersSection}
                ariaLabel="Bank Accounts Management"
            >
                {/* Table */}
                <Table
                    aria-label="Bank accounts table"
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
                    <TableBody items={items} emptyContent="No bank accounts found">
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </StandardPageLayout>
        </>
    );
};

BankAccounts.layout = (page) => <App children={page} />;
export default BankAccounts;
