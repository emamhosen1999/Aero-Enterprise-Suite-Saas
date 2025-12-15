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


const JournalEntries = () => {
    const { auth, journalEntries: initialData } = usePage().props;
    const [isMobile, setIsMobile] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        status: 'all',
        date_from: '',
        date_to: '',
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
    const journalEntries = [
        { id: 1, entry_number: 'JE-2024-0125', date: '2024-01-15', type: 'Adjustment', reference: 'Depreciation Jan 2024', debit: 5000, credit: 5000, status: 'Posted', created_by: 'John Doe', reversed: false },
        { id: 2, entry_number: 'JE-2024-0126', date: '2024-01-20', type: 'Accrual', reference: 'Accrued Expenses', debit: 12000, credit: 12000, status: 'Posted', created_by: 'Jane Smith', reversed: false },
        { id: 3, entry_number: 'JE-2024-0127', date: '2024-01-25', type: 'Reversal', reference: 'Reverse JE-2024-0100', debit: 3000, credit: 3000, status: 'Posted', created_by: 'John Doe', reversed: true },
        { id: 4, entry_number: 'JE-2024-0128', date: '2024-02-01', type: 'Reclassification', reference: 'Reclassify expenses', debit: 8500, credit: 8500, status: 'Draft', created_by: 'Jane Smith', reversed: false },
        { id: 5, entry_number: 'JE-2024-0129', date: '2024-02-05', type: 'Adjustment', reference: 'Bad debt provision', debit: 15000, credit: 15000, status: 'Pending Approval', created_by: 'Mike Johnson', reversed: false },
    ];

    const summary = {
        total: 5,
        posted: 3,
        draft: 1,
        pending: 1,
    };

    const statusColorMap = {
        'Draft': 'default',
        'Pending Approval': 'warning',
        'Posted': 'success',
        'Reversed': 'danger',
    };

    const typeColorMap = {
        'Adjustment': 'primary',
        'Accrual': 'secondary',
        'Reversal': 'warning',
        'Reclassification': 'default',
    };

    const handleSearchChange = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = () => {
        console.log('Exporting journal entries...');
    };

    const columns = [
        { uid: 'entry_number', name: 'Entry #' },
        { uid: 'date', name: 'Date' },
        { uid: 'type', name: 'Type' },
        { uid: 'reference', name: 'Reference' },
        { uid: 'debit', name: 'Debit' },
        { uid: 'credit', name: 'Credit' },
        { uid: 'status', name: 'Status' },
        { uid: 'created_by', name: 'Created By' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'entry_number':
                return (
                    <div>
                        <span className="font-medium">{item.entry_number}</span>
                        {item.reversed && <Chip size="sm" color="danger" className="ml-2">Reversed</Chip>}
                    </div>
                );
            case 'date':
                return new Date(item.date).toLocaleDateString();
            case 'type':
                return (
                    <Chip size="sm" color={typeColorMap[item.type]}>
                        {item.type}
                    </Chip>
                );
            case 'reference':
                return <span className="text-sm">{item.reference}</span>;
            case 'debit':
                return <span className="font-medium">${item.debit.toLocaleString()}</span>;
            case 'credit':
                return <span className="font-medium">${item.credit.toLocaleString()}</span>;
            case 'status':
                return (
                    <Chip size="sm" color={statusColorMap[item.status]}>
                        {item.status}
                    </Chip>
                );
            case 'created_by':
                return item.created_by;
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
                            {item.status === 'Draft' && <DropdownItem key="edit">Edit</DropdownItem>}
                            {item.status === 'Posted' && !item.reversed && <DropdownItem key="reverse">Reverse Entry</DropdownItem>}
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
        <App title="Journal Entries" auth={auth}>
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Entries', value: summary.total, color: 'text-primary' },
                        { label: 'Posted', value: summary.posted, color: 'text-success' },
                        { label: 'Draft', value: summary.draft, color: 'text-default-600' },
                        { label: 'Pending', value: summary.pending, color: 'text-warning' },
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
                            <h2 className="text-xl font-semibold">Journal Entries</h2>
                            <p className="text-sm text-default-600">Manual accounting entries and adjustments</p>
                        </div>
                        
                        <Button color="primary" radius={themeRadius} startContent={<PlusIcon className="w-4 h-4" />}>
                            New Entry
                        </Button>
                       
                    </CardHeader>

                    <CardBody className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                placeholder="Search entries..."
                                value={filters.search}
                                onValueChange={handleSearchChange}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                radius={themeRadius}
                                classNames={{ inputWrapper: 'bg-default-100' }}
                            />

                            <Select
                                placeholder="Type"
                                selectedKeys={filters.type !== 'all' ? [filters.type] : []}
                                onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || 'all')}
                                radius={themeRadius}
                                classNames={{ trigger: 'bg-default-100' }}
                                className="sm:w-48"
                            >
                                <SelectItem key="all">All Types</SelectItem>
                                <SelectItem key="adjustment">Adjustment</SelectItem>
                                <SelectItem key="accrual">Accrual</SelectItem>
                                <SelectItem key="reversal">Reversal</SelectItem>
                                <SelectItem key="reclassification">Reclassification</SelectItem>
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
                                <SelectItem key="pending">Pending Approval</SelectItem>
                                <SelectItem key="posted">Posted</SelectItem>
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
                            aria-label="Journal entries table"
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
                            <TableBody items={journalEntries} emptyContent="No journal entries found">
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

export default JournalEntries;
