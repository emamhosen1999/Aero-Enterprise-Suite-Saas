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
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

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

    return (
        <App>
            <Head title="Bank Accounts" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Bank Accounts</h1>
                        <p className="text-default-500">Manage your bank accounts and balances</p>
                    </div>
                    {hasPermission('finance.bank-accounts.create') && (
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-5 h-5" />}
                            radius={getThemeRadius()}
                        >
                            Add Account
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Input
                        placeholder="Search accounts..."
                        value={searchTerm}
                        onValueChange={handleSearchChange}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="w-full sm:w-64"
                        radius={getThemeRadius()}
                    />
                    <Select
                        placeholder="All Banks"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setBankFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Banks</SelectItem>
                        {[...new Set(mockAccounts.map(a => a.bank))].map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Types"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Types</SelectItem>
                        {Object.entries(typeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Status"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Status</SelectItem>
                        <SelectItem key="active" value="active">Active</SelectItem>
                        <SelectItem key="inactive" value="inactive">Inactive</SelectItem>
                        <SelectItem key="closed" value="closed">Closed</SelectItem>
                    </Select>
                </div>

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
            </motion.div>
        </App>
    );
};

export default BankAccounts;
