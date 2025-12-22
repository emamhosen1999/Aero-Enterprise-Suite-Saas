import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Button,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
} from '@heroui/react';
import {
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    DocumentArrowDownIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
// Permission checks removed - using role-based access via middleware

const TaxReturns = () => {
    const { auth, taxReturns: initialData } = usePage().props;
    const [isMobile, setIsMobile] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        tax_year: 'all',
        status: 'all',
        authority: 'all',
    });

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

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Mock data
    const taxReturns = [
        { id: 1, return_number: 'TR-2024-001', tax_year: '2024', period: 'Q1', authority: 'Federal - IRS', type: 'Income Tax', due_date: '2024-04-15', filing_date: '2024-04-10', amount: 45000, payment_status: 'Paid', status: 'Filed' },
        { id: 2, return_number: 'TR-2024-002', tax_year: '2024', period: 'Q1', authority: 'State - CA', type: 'Sales Tax', due_date: '2024-04-30', filing_date: null, amount: 12500, payment_status: 'Pending', status: 'Draft' },
        { id: 3, return_number: 'TR-2023-012', tax_year: '2023', period: 'Annual', authority: 'Federal - IRS', type: 'Corporate Tax', due_date: '2024-03-15', filing_date: '2024-03-12', amount: 125000, payment_status: 'Paid', status: 'Filed' },
        { id: 4, return_number: 'TR-2024-003', tax_year: '2024', period: 'Q2', authority: 'State - NY', type: 'Withholding Tax', due_date: '2024-07-31', filing_date: null, amount: 8500, payment_status: 'Not Due', status: 'In Progress' },
        { id: 5, return_number: 'TR-2024-004', tax_year: '2024', period: 'Q1', authority: 'Local - NYC', type: 'Property Tax', due_date: '2024-05-15', filing_date: null, amount: 22000, payment_status: 'Overdue', status: 'Draft' },
    ];

    const summary = {
        total: 5,
        draft: 2,
        filed: 2,
        total_amount: 213000,
    };

    const statusColorMap = {
        'Draft': 'default',
        'In Progress': 'primary',
        'Filed': 'success',
        'Amended': 'warning',
        'Rejected': 'danger',
    };

    const paymentStatusColorMap = {
        'Not Due': 'default',
        'Pending': 'warning',
        'Paid': 'success',
        'Overdue': 'danger',
    };

    const handleSearchChange = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = () => {
        console.log('Exporting tax returns...');
    };

    const columns = [
        { uid: 'return_number', name: 'Return #' },
        { uid: 'tax_year', name: 'Tax Year' },
        { uid: 'period', name: 'Period' },
        { uid: 'authority', name: 'Tax Authority' },
        { uid: 'type', name: 'Type' },
        { uid: 'due_date', name: 'Due Date' },
        { uid: 'amount', name: 'Amount' },
        { uid: 'payment_status', name: 'Payment Status' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'return_number':
                return <span className="font-medium">{item.return_number}</span>;
            case 'tax_year':
                return item.tax_year;
            case 'period':
                return item.period;
            case 'authority':
                return <span className="text-sm">{item.authority}</span>;
            case 'type':
                return item.type;
            case 'due_date':
                return new Date(item.due_date).toLocaleDateString();
            case 'amount':
                return `$${item.amount.toLocaleString()}`;
            case 'payment_status':
                return (
                    <Chip size="sm" color={paymentStatusColorMap[item.payment_status]}>
                        {item.payment_status}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip size="sm" color={statusColorMap[item.status]}>
                        {item.status}
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
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem key="view">View</DropdownItem>
                            <DropdownItem key="edit">Edit</DropdownItem>
                            <DropdownItem key="file">File Return</DropdownItem>
                            <DropdownItem key="payment">Record Payment</DropdownItem>
                            <DropdownItem key="delete" className="text-danger" color="danger">
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    return (
        <App title="Tax Returns" auth={auth}>
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Returns', value: summary.total, color: 'text-primary' },
                        { label: 'Draft', value: summary.draft, color: 'text-default-600' },
                        { label: 'Filed', value: summary.filed, color: 'text-success' },
                        { label: 'Total Amount', value: `$${summary.total_amount.toLocaleString()}`, color: 'text-primary' },
                    ].map((stat, index) => (
                        <Card key={index}>
                            <CardBody>
                                <p className="text-sm text-default-600">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Main Card */}
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold">Tax Returns</h2>
                            <p className="text-sm text-default-600">Manage tax filings and payments</p>
                        </div>
                        <Button color="primary" radius={themeRadius} startContent={<PlusIcon className="w-4 h-4" />}>
                            New Return
                        </Button>
                    </CardHeader>

                    <CardBody className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                placeholder="Search returns..."
                                value={filters.search}
                                onValueChange={handleSearchChange}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                radius={themeRadius}
                                classNames={{ inputWrapper: 'bg-default-100' }}
                            />

                            <Select
                                placeholder="Tax Year"
                                selectedKeys={filters.tax_year !== 'all' ? [filters.tax_year] : []}
                                onSelectionChange={(keys) => handleFilterChange('tax_year', Array.from(keys)[0] || 'all')}
                                radius={themeRadius}
                                classNames={{ trigger: 'bg-default-100' }}
                                className="sm:w-48"
                            >
                                <SelectItem key="all">All Years</SelectItem>
                                <SelectItem key="2024">2024</SelectItem>
                                <SelectItem key="2023">2023</SelectItem>
                            </Select>

                            <Select
                                placeholder="Status"
                                selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                radius={themeRadius}
                                classNames={{ trigger: 'bg-default-100' }}
                                className="sm:w-48"
                            >
                                <SelectItem key="all">All Status</SelectItem>
                                <SelectItem key="draft">Draft</SelectItem>
                                <SelectItem key="in_progress">In Progress</SelectItem>
                                <SelectItem key="filed">Filed</SelectItem>
                            </Select>

                            <Button
                                variant="flat"
                                radius={themeRadius}
                                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                onPress={handleExport}
                            >
                                Export
                            </Button>
                        </div>

                        {/* Table */}
                        <Table
                            aria-label="Tax returns table"
                            isHeaderSticky
                            classNames={{
                                wrapper: 'shadow-none border border-divider rounded-lg',
                                th: 'bg-default-100 text-default-600 font-semibold',
                                td: 'py-3',
                            }}
                        >
                            <TableHeader columns={columns}>
                                {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                            </TableHeader>
                            <TableBody items={taxReturns} emptyContent="No tax returns found">
                                {(item) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="flex justify-center">
                            <Pagination total={10} initialPage={1} radius={themeRadius} />
                        </div>
                    </CardBody>
                </Card>
            </div>
        </App>
    );
};

export default TaxReturns;
