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
    Card,
    CardBody,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PlusIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const AccountsPayable = ({ bills = [], vendors = [], auth }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Responsive breakpoints
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

    // Mock data if empty
    const mockBills = bills.length > 0 ? bills : [
        { id: 1, bill_number: 'BILL-2024-001', vendor: 'Acme Supplies', bill_date: '2024-01-15', due_date: '2024-02-14', amount: 5000, paid: 0, balance: 5000, status: 'pending' },
        { id: 2, bill_number: 'BILL-2024-002', vendor: 'Tech Solutions Inc', bill_date: '2024-01-20', due_date: '2024-02-19', amount: 8500, paid: 8500, balance: 0, status: 'paid' },
        { id: 3, bill_number: 'BILL-2024-003', vendor: 'Office Depot', bill_date: '2024-01-10', due_date: '2024-01-25', amount: 1200, paid: 0, balance: 1200, status: 'overdue' },
    ];

    // Calculations
    const calculateDaysUntilDue = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Status color map
    const statusColorMap = {
        draft: 'default',
        pending: 'warning',
        approved: 'primary',
        paid: 'success',
        overdue: 'danger',
        cancelled: 'default',
    };

    // Filter and search
    const filteredBills = useMemo(() => {
        return mockBills.filter(bill => {
            const matchesSearch = bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                bill.vendor.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesVendor = vendorFilter === 'all' || bill.vendor === vendorFilter;
            const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
            return matchesSearch && matchesVendor && matchesStatus;
        });
    }, [mockBills, searchTerm, vendorFilter, statusFilter]);

    // Pagination
    const pages = Math.ceil(filteredBills.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredBills.slice(start, end);
    }, [page, filteredBills]);

    // Summary calculations
    const totalAP = mockBills.reduce((sum, bill) => sum + bill.balance, 0);
    const dueThisWeek = mockBills.filter(bill => {
        const days = calculateDaysUntilDue(bill.due_date);
        return days <= 7 && days >= 0 && bill.status !== 'paid';
    }).reduce((sum, bill) => sum + bill.balance, 0);
    const dueThisMonth = mockBills.filter(bill => {
        const days = calculateDaysUntilDue(bill.due_date);
        return days <= 30 && days >= 0 && bill.status !== 'paid';
    }).reduce((sum, bill) => sum + bill.balance, 0);
    const overdue = mockBills.filter(bill => bill.status === 'overdue').reduce((sum, bill) => sum + bill.balance, 0);

    const formatCurrency = (amount) => `$${amount.toLocaleString()}`;

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const renderCell = (bill, columnKey) => {
        switch (columnKey) {
            case 'bill_number':
                return <span className="font-medium">{bill.bill_number}</span>;
            case 'vendor':
                return <span>{bill.vendor}</span>;
            case 'dates':
                return (
                    <div className="flex flex-col">
                        <span className="text-sm">Bill: {bill.bill_date}</span>
                        <span className="text-sm">Due: {bill.due_date}</span>
                    </div>
                );
            case 'amount':
                return <span className="font-medium">{formatCurrency(bill.amount)}</span>;
            case 'paid':
                return <span>{formatCurrency(bill.paid)}</span>;
            case 'balance':
                return <span className="font-semibold text-danger">{formatCurrency(bill.balance)}</span>;
            case 'days_until_due':
                const days = calculateDaysUntilDue(bill.due_date);
                const color = days < 0 ? 'text-danger' : days <= 7 ? 'text-warning' : 'text-default-500';
                return <span className={color}>{days < 0 ? `${Math.abs(days)} days overdue` : `${days} days`}</span>;
            case 'status':
                return (
                    <Chip color={statusColorMap[bill.status]} size="sm" variant="flat">
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
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
                        <DropdownMenu aria-label="Bill actions">
                            <DropdownItem key="view">View Details</DropdownItem>
                            <DropdownItem key="pay" startContent={<CheckCircleIcon className="w-4 h-4" />}>
                                Record Payment
                            </DropdownItem>
                            <DropdownItem key="edit">Edit</DropdownItem>
                            <DropdownItem key="delete" className="text-danger" color="danger">
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
        { uid: 'bill_number', name: 'Bill #' },
        { uid: 'vendor', name: 'Vendor' },
        { uid: 'dates', name: 'Bill / Due Date' },
        { uid: 'amount', name: 'Amount' },
        { uid: 'paid', name: 'Paid' },
        { uid: 'balance', name: 'Balance' },
        { uid: 'days_until_due', name: 'Days Until Due' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    return (
        <App>
            <Head title="Accounts Payable" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Accounts Payable</h1>
                        <p className="text-default-500">Manage vendor bills and payments</p>
                    </div>
                    {hasPermission('finance.accounts-payable.create') && (
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-5 h-5" />}
                            radius={getThemeRadius()}
                        >
                            New Bill
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardBody className="flex flex-row items-center justify-between">
                            <div>
                                <p className="text-sm text-default-500">Total AP</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalAP)}</p>
                            </div>
                            <ClockIcon className="w-8 h-8 text-primary" />
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center justify-between">
                            <div>
                                <p className="text-sm text-default-500">Due This Week</p>
                                <p className="text-2xl font-bold text-warning">{formatCurrency(dueThisWeek)}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center justify-between">
                            <div>
                                <p className="text-sm text-default-500">Due This Month</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(dueThisMonth)}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center justify-between">
                            <div>
                                <p className="text-sm text-default-500">Overdue</p>
                                <p className="text-2xl font-bold text-danger">{formatCurrency(overdue)}</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Input
                        placeholder="Search bills or vendors..."
                        value={searchTerm}
                        onValueChange={handleSearchChange}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="w-full sm:w-64"
                        radius={getThemeRadius()}
                    />
                    <Select
                        placeholder="All Vendors"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setVendorFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Vendors</SelectItem>
                        {[...new Set(mockBills.map(b => b.vendor))].map(vendor => (
                            <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
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
                        <SelectItem key="approved" value="approved">Approved</SelectItem>
                        <SelectItem key="paid" value="paid">Paid</SelectItem>
                        <SelectItem key="overdue" value="overdue">Overdue</SelectItem>
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
                    aria-label="Accounts payable table"
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
                    <TableBody items={items} emptyContent="No bills found">
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

export default AccountsPayable;
