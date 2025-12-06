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
    Progress,
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
    PlusIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    BellIcon,
    CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const AccountsReceivable = ({ invoices = [], customers = [], auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('all');
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
    const sampleInvoices = [
        { id: 1, invoice_number: 'INV-2024-001', customer: 'Acme Corp', invoice_date: '2024-01-15', due_date: '2024-02-14', amount: 15000, paid: 10000, status: 'partial' },
        { id: 2, invoice_number: 'INV-2024-002', customer: 'Tech Solutions Inc', invoice_date: '2024-01-20', due_date: '2024-01-20', amount: 8500, paid: 0, status: 'overdue' },
        { id: 3, invoice_number: 'INV-2024-003', customer: 'Global Traders', invoice_date: '2024-02-01', due_date: '2024-03-01', amount: 12000, paid: 12000, status: 'paid' },
        { id: 4, invoice_number: 'INV-2024-004', customer: 'Metro Services', invoice_date: '2024-02-10', due_date: '2024-03-10', amount: 6500, paid: 0, status: 'sent' },
        { id: 5, invoice_number: 'INV-2024-005', customer: 'Acme Corp', invoice_date: '2024-02-15', due_date: '2024-03-15', amount: 9800, paid: 0, status: 'sent' },
    ];

    const invoiceData = invoices.length > 0 ? invoices : sampleInvoices;

    const calculateDaysOverdue = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today - due;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const enrichedInvoices = invoiceData.map(inv => ({
        ...inv,
        balance: inv.amount - inv.paid,
        daysOverdue: calculateDaysOverdue(inv.due_date),
        paymentProgress: (inv.paid / inv.amount) * 100
    }));

    const filteredInvoices = enrichedInvoices.filter(invoice => {
        const matchesSearch = searchQuery === '' || 
            invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.customer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCustomer = selectedCustomer === 'all' || invoice.customer === selectedCustomer;
        const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
        return matchesSearch && matchesCustomer && matchesStatus;
    });

    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const totalPages = Math.ceil(filteredInvoices.length / perPage);

    const summaryStats = useMemo(() => {
        const total = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);
        const overdue = filteredInvoices
            .filter(inv => inv.daysOverdue > 0 && inv.balance > 0)
            .reduce((sum, inv) => sum + inv.balance, 0);
        const current = total - overdue;
        
        return { total, overdue, current };
    }, [filteredInvoices]);

    const statusColorMap = {
        'draft': 'default',
        'sent': 'primary',
        'partial': 'warning',
        'paid': 'success',
        'overdue': 'danger',
        'cancelled': 'default',
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const renderCell = (invoice, columnKey) => {
        switch (columnKey) {
            case 'invoice_number':
                return <span className="font-mono text-sm font-semibold">{invoice.invoice_number}</span>;
            
            case 'customer':
                return <span className="text-sm">{invoice.customer}</span>;
            
            case 'invoice_date':
                return <span className="text-sm text-default-600">{invoice.invoice_date}</span>;
            
            case 'due_date':
                return <span className="text-sm text-default-600">{invoice.due_date}</span>;
            
            case 'amount':
                return (
                    <span className="font-mono text-sm">
                        ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                );
            
            case 'paid':
                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-mono text-sm">
                            ${invoice.paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        {invoice.status === 'partial' && (
                            <Progress 
                                size="sm" 
                                value={invoice.paymentProgress}
                                color="warning"
                                className="max-w-md"
                            />
                        )}
                    </div>
                );
            
            case 'balance':
                return (
                    <span className="font-mono text-sm font-semibold text-warning">
                        ${invoice.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                );
            
            case 'days_overdue':
                if (invoice.daysOverdue > 0 && invoice.balance > 0) {
                    return (
                        <Chip
                            color={invoice.daysOverdue > 30 ? 'danger' : 'warning'}
                            size="sm"
                            variant="flat"
                        >
                            {invoice.daysOverdue} days
                        </Chip>
                    );
                }
                return <span className="text-xs text-default-400">-</span>;
            
            case 'status':
                return (
                    <Chip
                        color={statusColorMap[invoice.status]}
                        size="sm"
                        variant="flat"
                    >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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
                        <DropdownMenu aria-label="Invoice actions">
                            <DropdownItem
                                key="edit"
                                startContent={<PencilIcon className="w-4 h-4" />}
                            >
                                Edit
                            </DropdownItem>
                            <DropdownItem
                                key="remind"
                                startContent={<BellIcon className="w-4 h-4" />}
                            >
                                Send Reminder
                            </DropdownItem>
                            <DropdownItem
                                key="payment"
                                startContent={<CurrencyDollarIcon className="w-4 h-4" />}
                            >
                                Record Payment
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            
            default:
                return null;
        }
    };

    const columns = [
        { key: 'invoice_number', label: 'Invoice #' },
        { key: 'customer', label: 'Customer' },
        { key: 'invoice_date', label: 'Invoice Date' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'paid', label: 'Paid' },
        { key: 'balance', label: 'Balance' },
        { key: 'days_overdue', label: 'Days Overdue' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ];

    return (
        <App>
            <Head title="Accounts Receivable" />
            
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Accounts Receivable</h1>
                        <p className="text-sm text-default-600 mt-1">
                            Track customer invoices and payments
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            variant="flat"
                        >
                            Export
                        </Button>
                        {hasPermission('finance.invoices.create') && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                            >
                                New Invoice
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-600">Total Receivable</p>
                            <p className="text-2xl font-bold text-foreground mt-1">
                                ${summaryStats.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-600">Overdue Amount</p>
                            <p className="text-2xl font-bold text-danger mt-1">
                                ${summaryStats.overdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-600">Current Amount</p>
                            <p className="text-2xl font-bold text-success mt-1">
                                ${summaryStats.current.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Input
                        placeholder="Search invoices or customers..."
                        value={searchQuery}
                        onValueChange={handleSearch}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        classNames={{
                            inputWrapper: "bg-default-100"
                        }}
                        className="sm:max-w-xs"
                    />
                    
                    <Select
                        placeholder="Status"
                        selectedKeys={selectedStatus !== 'all' ? [selectedStatus] : []}
                        onSelectionChange={(keys) => {
                            setSelectedStatus(Array.from(keys)[0] || 'all');
                            setCurrentPage(1);
                        }}
                        classNames={{ trigger: "bg-default-100" }}
                        className="sm:max-w-xs"
                        startContent={<FunnelIcon className="w-4 h-4" />}
                    >
                        <SelectItem key="all">All Status</SelectItem>
                        <SelectItem key="draft">Draft</SelectItem>
                        <SelectItem key="sent">Sent</SelectItem>
                        <SelectItem key="partial">Partial</SelectItem>
                        <SelectItem key="paid">Paid</SelectItem>
                        <SelectItem key="overdue">Overdue</SelectItem>
                    </Select>
                </div>

                {/* Table */}
                <Table
                    aria-label="Accounts receivable table"
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
                        items={paginatedInvoices}
                        emptyContent="No invoices found"
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

export default AccountsReceivable;
