import React, { useCallback, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Input,
    Pagination,
    Select,
    SelectItem,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/react";
import {
    ClipboardDocumentCheckIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ChartBarIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import dayjs from 'dayjs';

const InspectionsIndex = ({ title, inspections: initialInspections = [], stats: initialStats = {} }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isTablet = useMediaQuery('(max-width: 768px)');
    
    // HRMAC permissions with Super Administrator bypass
    const { canCreate, canUpdate, canDelete, hasAccess, isSuperAdmin } = useHRMAC();
    
    // Permission checks using HRMAC pattern
    const canCreateInspection = canCreate('quality.inspections') || isSuperAdmin();
    const canEditInspection = canUpdate('quality.inspections') || isSuperAdmin();
    const canDeleteInspection = canDelete('quality.inspections') || isSuperAdmin();
    const canViewInspection = hasAccess('quality.inspections') || isSuperAdmin();
    
    // State
    const [inspectionsData, setInspectionsData] = useState(initialInspections);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        type: 'all',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: initialInspections?.length || 0
    });

    // Stats computed from data
    const computedStats = useMemo(() => {
        const data = Array.isArray(inspectionsData) ? inspectionsData : [];
        return {
            total: initialStats?.total || data.length,
            pending: initialStats?.pending || data.filter(i => i.status === 'pending').length,
            approved: initialStats?.approved || data.filter(i => i.status === 'approved').length,
            rejected: initialStats?.rejected || data.filter(i => i.status === 'rejected').length,
        };
    }, [inspectionsData, initialStats]);

    // Stats cards configuration
    const statsCards = useMemo(() => [
        {
            title: 'Total Inspections',
            value: computedStats.total,
            icon: <ChartBarIcon className="w-5 h-5" />,
            color: 'text-blue-600',
            iconBg: 'bg-blue-500/20',
            description: 'All inspection requests'
        },
        {
            title: 'Pending',
            value: computedStats.pending,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting inspection'
        },
        {
            title: 'Approved',
            value: computedStats.approved,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Passed inspections'
        },
        {
            title: 'Rejected',
            value: computedStats.rejected,
            icon: <XCircleIcon className="w-5 h-5" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Failed inspections'
        },
    ], [computedStats]);

    // Status color map
    const statusColorMap = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        in_progress: 'primary',
        scheduled: 'secondary',
    };

    // Type color map
    const typeColorMap = {
        wir: 'primary',
        itp: 'secondary',
        checklist: 'success',
    };

    // Table columns
    const columns = [
        { name: 'ID', uid: 'id', sortable: true },
        { name: 'Title', uid: 'title', sortable: true },
        { name: 'Type', uid: 'type', sortable: true },
        { name: 'Location', uid: 'location' },
        { name: 'Scheduled Date', uid: 'scheduled_date', sortable: true },
        { name: 'Status', uid: 'status', sortable: true },
        { name: 'Inspector', uid: 'inspector' },
        { name: 'Actions', uid: 'actions' },
    ];

    // Filter handler
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Filtered data
    const filteredData = useMemo(() => {
        let data = Array.isArray(inspectionsData) ? [...inspectionsData] : [];
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            data = data.filter(item => 
                item.title?.toLowerCase().includes(searchLower) ||
                item.location?.toLowerCase().includes(searchLower) ||
                item.id?.toString().includes(searchLower)
            );
        }
        
        if (filters.status !== 'all') {
            data = data.filter(item => item.status === filters.status);
        }
        
        if (filters.type !== 'all') {
            data = data.filter(item => item.type === filters.type);
        }
        
        return data;
    }, [inspectionsData, filters]);

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.perPage;
        const end = start + pagination.perPage;
        return filteredData.slice(start, end);
    }, [filteredData, pagination]);

    // Render cell
    const renderCell = useCallback((item, columnKey) => {
        const value = item[columnKey];
        
        switch (columnKey) {
            case 'id':
                return <span className="font-mono text-sm">INS-{String(value).padStart(4, '0')}</span>;
            case 'title':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{value}</span>
                        <span className="text-xs text-default-500">{item.description?.substring(0, 50)}...</span>
                    </div>
                );
            case 'type':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color={typeColorMap[value] || 'default'}
                    >
                        {value?.toUpperCase() || 'N/A'}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color={statusColorMap[value] || 'default'}
                    >
                        {value?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </Chip>
                );
            case 'scheduled_date':
                return value ? dayjs(value).format('DD MMM YYYY') : '-';
            case 'inspector':
                return item.inspector?.name || '-';
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                            >
                                View Details
                            </DropdownItem>
                            {canEditInspection && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDeleteInspection && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger" 
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return value || '-';
        }
    }, [canEditInspection, canDeleteInspection]);

    // Action buttons for header
    const actionButtons = (
        <div className="flex gap-2 flex-wrap">
            <Button
                variant="flat"
                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                size={isMobile ? "sm" : "md"}
            >
                Export
            </Button>
            {canCreateInspection && (
                <Button
                    color="primary"
                    variant="shadow"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    size={isMobile ? "sm" : "md"}
                >
                    Add Inspection
                </Button>
            )}
        </div>
    );

    // Filters section
    const filtersSection = (
        <div className="flex flex-col sm:flex-row gap-4">
            <Input
                placeholder="Search by ID, title, or location..."
                value={filters.search}
                onValueChange={(value) => handleFilterChange('search', value)}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                className="w-full sm:max-w-xs"
                radius={themeRadius}
            />
            <Select
                placeholder="Status"
                selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                className="w-full sm:w-40"
                radius={themeRadius}
            >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="scheduled">Scheduled</SelectItem>
                <SelectItem key="in_progress">In Progress</SelectItem>
                <SelectItem key="approved">Approved</SelectItem>
                <SelectItem key="rejected">Rejected</SelectItem>
            </Select>
            <Select
                placeholder="Type"
                selectedKeys={filters.type !== 'all' ? [filters.type] : []}
                onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || 'all')}
                className="w-full sm:w-40"
                radius={themeRadius}
            >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="wir">WIR</SelectItem>
                <SelectItem key="itp">ITP</SelectItem>
                <SelectItem key="checklist">Checklist</SelectItem>
            </Select>
        </div>
    );

    // Table content
    const tableContent = (
        <>
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : paginatedData.length === 0 ? (
                <Card className="border border-divider">
                    <CardBody className="flex flex-col items-center justify-center py-12">
                        <ClipboardDocumentCheckIcon className="w-16 h-16 text-default-300 mb-4" />
                        <p className="text-lg font-semibold text-default-600 mb-2">No Inspections Found</p>
                        <p className="text-sm text-default-500 mb-4">
                            Create your first inspection request to get started
                        </p>
                        {canCreateInspection && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                            >
                                Create Inspection
                            </Button>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <Table
                    aria-label="Inspections table"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={paginatedData} emptyContent="No inspections found">
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </>
    );

    // Pagination section
    const paginationSection = filteredData.length > 0 ? (
        <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-default-500">
                Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.perPage, filteredData.length)} of{' '}
                {filteredData.length} entries
            </span>
            <Pagination
                total={Math.ceil(filteredData.length / pagination.perPage)}
                page={pagination.currentPage}
                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                showControls
                size={isMobile ? "sm" : "md"}
                radius={themeRadius}
            />
        </div>
    ) : null;

    return (
        <>
            <Head title={title || 'Quality Inspections'} />
            <StandardPageLayout
                title="Quality Inspections (WIR)"
                subtitle="Track and manage work inspection requests, ITP checklists, and quality inspections"
                icon={<ClipboardDocumentCheckIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
                iconColor="primary"
                ariaLabel="Quality Inspections Management"
                actions={actionButtons}
                stats={<StatsCards stats={statsCards} />}
                filters={filtersSection}
                content={tableContent}
                pagination={paginationSection}
            />
        </>
    );
};

InspectionsIndex.layout = (page) => <App children={page} />;

export default InspectionsIndex;
