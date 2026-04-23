import React, { useState, useEffect, useMemo } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
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
    DocumentTextIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';


const JournalEntries = () => {
    const { auth, journalEntries: initialData } = usePage().props;
    
    // HRMAC permissions - Finance module
    const { canCreate, canUpdate, canDelete, hasAccess, isSuperAdmin } = useHRMAC();
    const canViewEntries = hasAccess('finance.journal-entries') || isSuperAdmin();
    const canCreateEntry = canCreate('finance.journal-entries') || isSuperAdmin();
    const canEditEntry = canUpdate('finance.journal-entries') || isSuperAdmin();
    const canDeleteEntry = canDelete('finance.journal-entries') || isSuperAdmin();
    const canExportEntries = hasAccess('finance.journal-entries') || isSuperAdmin();
    
    const themeRadius = useThemeRadius();
    
    // Responsive state management
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
    
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        status: 'all',
        date_from: '',
        date_to: '',
    });

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

    // Stats data
    const statsData = useMemo(() => [
        {
            title: 'Total Entries',
            value: summary.total,
            icon: <DocumentTextIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'All journal entries'
        },
        {
            title: 'Posted',
            value: summary.posted,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Posted to ledger'
        },
        {
            title: 'Draft',
            value: summary.draft,
            icon: <DocumentTextIcon className="w-5 h-5" />,
            color: 'text-default-600',
            iconBg: 'bg-default-100',
            description: 'Unposted entries'
        },
        {
            title: 'Pending',
            value: summary.pending,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting approval'
        },
    ], [summary]);

    // Action buttons
    const actionButtons = useMemo(() => (
        <>
            {canExportEntries && (
                <Button
                    color="default"
                    variant="flat"
                    startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                    radius={themeRadius}
                    size={isMobile ? "sm" : "md"}
                >
                    Export
                </Button>
            )}
            {canCreateEntry && (
                <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    radius={themeRadius}
                    size={isMobile ? "sm" : "md"}
                >
                    New Entry
                </Button>
            )}
        </>
    ), [canCreateEntry, canExportEntries, themeRadius, isMobile]);

    // Filters section
    const filtersSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-3">
            <Input
                placeholder="Search entries..."
                value={filters.search}
                onValueChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                className="w-full sm:flex-1"
                radius={themeRadius}
            />
            <Select
                placeholder="All Types"
                selectedKeys={filters.type !== 'all' ? [filters.type] : []}
                onSelectionChange={(keys) => setFilters(prev => ({ ...prev, type: Array.from(keys)[0] || 'all' }))}
                className="w-full sm:w-48"
                radius={themeRadius}
            >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="general">General</SelectItem>
                <SelectItem key="adjusting">Adjusting</SelectItem>
                <SelectItem key="closing">Closing</SelectItem>
            </Select>
            <Select
                placeholder="All Status"
                selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                onSelectionChange={(keys) => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] || 'all' }))}
                className="w-full sm:w-48"
                radius={themeRadius}
            >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="draft">Draft</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="posted">Posted</SelectItem>
                <SelectItem key="reversed">Reversed</SelectItem>
            </Select>
        </div>
    ), [filters, themeRadius]);

    return (
        <>
            <Head title="Journal Entries" />
            
            <StandardPageLayout
                title="Journal Entries"
                subtitle="Manual accounting entries and adjustments"
                icon={<DocumentTextIcon />}
                actions={actionButtons}
                stats={<StatsCards stats={statsData} />}
                filters={filtersSection}
                ariaLabel="Journal Entries Management"
            >
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
                <div className="flex justify-center mt-4">
                    <Pagination total={10} initialPage={1} radius={themeRadius} />
                </div>
            </StandardPageLayout>
        </>
    );
};

JournalEntries.layout = (page) => <App children={page} />;
export default JournalEntries;
