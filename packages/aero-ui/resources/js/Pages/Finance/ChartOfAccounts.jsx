import { useState, useEffect } from 'react';
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
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const ChartOfAccounts = ({ accounts = [], accountTypes = [], auth }) => {
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

    return (
        <App>
            <Head title="Chart of Accounts" />
            
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Chart of Accounts</h1>
                        <p className="text-sm text-default-600 mt-1">
                            Manage your accounting structure
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            variant="flat"
                            onPress={handleExport}
                        >
                            Export
                        </Button>
                        {hasPermission('finance.accounts.create') && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                            >
                                New Account
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Input
                        placeholder="Search by code or name..."
                        value={searchQuery}
                        onValueChange={handleSearch}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        classNames={{
                            inputWrapper: "bg-default-100"
                        }}
                        className="sm:max-w-xs"
                    />
                    
                    <Select
                        placeholder="Account Type"
                        selectedKeys={selectedType !== 'all' ? [selectedType] : []}
                        onSelectionChange={(keys) => {
                            setSelectedType(Array.from(keys)[0] || 'all');
                            setCurrentPage(1);
                        }}
                        classNames={{ trigger: "bg-default-100" }}
                        className="sm:max-w-xs"
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
                        classNames={{ trigger: "bg-default-100" }}
                        className="sm:max-w-xs"
                    >
                        <SelectItem key="all">All Status</SelectItem>
                        <SelectItem key="active">Active</SelectItem>
                        <SelectItem key="inactive">Inactive</SelectItem>
                    </Select>
                </div>

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
                        />
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default ChartOfAccounts;
