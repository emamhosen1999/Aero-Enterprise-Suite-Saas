import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    ExclamationTriangleIcon,
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
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import dayjs from 'dayjs';

const NCRIndex = ({ title, ncrs: initialNCRs = [], stats: initialStats = {} }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    
    // Manual responsive state management (HRMAC pattern)
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
    
    // HRMAC permissions with Super Administrator bypass
    const { canCreate, canUpdate, canDelete, hasAccess, isSuperAdmin } = useHRMAC();
    
    // Permission checks using HRMAC pattern
    const canCreateNCR = canCreate('quality.ncr') || isSuperAdmin();
    const canEditNCR = canUpdate('quality.ncr') || isSuperAdmin();
    const canDeleteNCR = canDelete('quality.ncr') || isSuperAdmin();
    const canViewNCR = hasAccess('quality.ncr') || isSuperAdmin();
    
    // State
    const [ncrsData, setNCRsData] = useState(initialNCRs);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        severity: 'all',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: initialNCRs?.length || 0
    });

    // Stats computed from data
    const computedStats = useMemo(() => {
        const data = Array.isArray(ncrsData) ? ncrsData : [];
        return {
            total: initialStats?.total || data.length,
            open: initialStats?.open || data.filter(n => n.status === 'open').length,
            closed: initialStats?.closed || data.filter(n => n.status === 'closed').length,
            critical: initialStats?.critical || data.filter(n => n.severity === 'critical').length,
        };
    }, [ncrsData, initialStats]);

    // Stats cards configuration
    const statsCards = useMemo(() => [
        {
            title: 'Total NCRs',
            value: computedStats.total,
            icon: <ChartBarIcon className="w-5 h-5" />,
            color: 'text-blue-600',
            iconBg: 'bg-blue-500/20',
            description: 'All non-conformance reports'
        },
        {
            title: 'Open',
            value: computedStats.open,
            icon: <ExclamationTriangleIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Pending resolution'
        },
        {
            title: 'Closed',
            value: computedStats.closed,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Resolved NCRs'
        },
        {
            title: 'Critical',
            value: computedStats.critical,
            icon: <XCircleIcon className="w-5 h-5" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Requires immediate action'
        },
    ], [computedStats]);

    // Table columns
    const columns = [
        { uid: 'ncr_number', name: 'NCR #' },
        { uid: 'title', name: 'Title' },
        { uid: 'severity', name: 'Severity' },
        { uid: 'status', name: 'Status' },
        { uid: 'reported_date', name: 'Reported Date' },
        { uid: 'assigned_to', name: 'Assigned To' },
        { uid: 'actions', name: 'Actions' },
    ];

    // Filter change handler
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Get severity color
    const getSeverityColor = (severity) => {
        const colors = {
            critical: 'danger',
            major: 'warning',
            minor: 'primary',
            low: 'success',
        };
        return colors[severity?.toLowerCase()] || 'default';
    };

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            open: 'warning',
            'in-progress': 'primary',
            closed: 'success',
            rejected: 'danger',
        };
        return colors[status?.toLowerCase()] || 'default';
    };

    // Render cell content
    const renderCell = useCallback((ncr, columnKey) => {
        switch (columnKey) {
            case 'ncr_number':
                return (
                    <span className="font-semibold text-primary">
                        {ncr.ncr_number || `NCR-${ncr.id?.toString().padStart(4, '0')}`}
                    </span>
                );
            case 'title':
                return (
                    <div className="max-w-xs">
                        <p className="font-medium truncate">{ncr.title || 'Untitled NCR'}</p>
                        {ncr.description && (
                            <p className="text-xs text-default-400 truncate">{ncr.description}</p>
                        )}
                    </div>
                );
            case 'severity':
                return (
                    <Chip
                        color={getSeverityColor(ncr.severity)}
                        size="sm"
                        variant="flat"
                    >
                        {ncr.severity || 'N/A'}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip
                        color={getStatusColor(ncr.status)}
                        size="sm"
                        variant="flat"
                    >
                        {ncr.status || 'Open'}
                    </Chip>
                );
            case 'reported_date':
                return ncr.reported_date 
                    ? dayjs(ncr.reported_date).format('DD MMM YYYY')
                    : '-';
            case 'assigned_to':
                return ncr.assigned_to?.name || ncr.assigned_to || '-';
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="NCR Actions">
                            {canViewNCR && (
                                <DropdownItem 
                                    key="view" 
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                >
                                    View Details
                                </DropdownItem>
                            )}
                            {canEditNCR && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDeleteNCR && (
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
                return ncr[columnKey] || '-';
        }
    }, [canViewNCR, canEditNCR, canDeleteNCR]);

    // Filter data
    const filteredData = useMemo(() => {
        let data = Array.isArray(ncrsData) ? ncrsData : [];
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            data = data.filter(ncr => 
                ncr.title?.toLowerCase().includes(searchLower) ||
                ncr.ncr_number?.toLowerCase().includes(searchLower) ||
                ncr.description?.toLowerCase().includes(searchLower)
            );
        }
        
        if (filters.status !== 'all') {
            data = data.filter(ncr => ncr.status === filters.status);
        }
        
        if (filters.severity !== 'all') {
            data = data.filter(ncr => ncr.severity === filters.severity);
        }
        
        return data;
    }, [ncrsData, filters]);

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.perPage;
        return filteredData.slice(start, start + pagination.perPage);
    }, [filteredData, pagination.currentPage, pagination.perPage]);

    // Action buttons
    const actionButtons = useMemo(() => {
        const buttons = [];
        
        if (canCreateNCR) {
            buttons.push(
                <Button
                    key="add"
                    color="primary"
                    variant="shadow"
                    size={isMobile ? 'sm' : 'md'}
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={() => {
                        // TODO: Open create NCR modal
                        showToast.info('Create NCR modal coming soon');
                    }}
                >
                    {isMobile ? '' : 'Add NCR'}
                </Button>
            );
        }
        
        buttons.push(
            <Button
                key="export"
                variant="bordered"
                size={isMobile ? 'sm' : 'md'}
                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                className="border-primary/30 bg-primary/5 hover:bg-primary/10"
            >
                {isMobile ? '' : 'Export'}
            </Button>
        );
        
        return buttons;
    }, [canCreateNCR, isMobile]);

    return (
        <>
            <Head title={title} />
            
            <StandardPageLayout
                ariaLabel="Non-Conformance Reports Management"
                title="Non-Conformance Reports (NCR)"
                subtitle="Track and manage quality non-conformances, corrective actions, and resolutions"
                icon={ExclamationTriangleIcon}
                actions={<div className="flex items-center gap-2">{actionButtons}</div>}
                stats={<StatsCards stats={statsCards} isLoading={loading} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by NCR number, title, or description..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                variant="bordered"
                                size={isMobile ? 'sm' : 'md'}
                                radius={themeRadius}
                                classNames={{
                                    inputWrapper: "bg-default-100"
                                }}
                            />
                        </div>
                        
                        <Select
                            placeholder="Status"
                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                            variant="bordered"
                            size={isMobile ? 'sm' : 'md'}
                            radius={themeRadius}
                            className="w-full sm:w-40"
                            classNames={{ trigger: "bg-default-100" }}
                        >
                            <SelectItem key="all">All Status</SelectItem>
                            <SelectItem key="open">Open</SelectItem>
                            <SelectItem key="in-progress">In Progress</SelectItem>
                            <SelectItem key="closed">Closed</SelectItem>
                            <SelectItem key="rejected">Rejected</SelectItem>
                        </Select>
                        
                        <Select
                            placeholder="Severity"
                            selectedKeys={filters.severity !== 'all' ? [filters.severity] : []}
                            onSelectionChange={(keys) => handleFilterChange('severity', Array.from(keys)[0] || 'all')}
                            variant="bordered"
                            size={isMobile ? 'sm' : 'md'}
                            radius={themeRadius}
                            className="w-full sm:w-40"
                            classNames={{ trigger: "bg-default-100" }}
                        >
                            <SelectItem key="all">All Severity</SelectItem>
                            <SelectItem key="critical">Critical</SelectItem>
                            <SelectItem key="major">Major</SelectItem>
                            <SelectItem key="minor">Minor</SelectItem>
                            <SelectItem key="low">Low</SelectItem>
                        </Select>
                    </div>
                }
                pagination={
                    filteredData.length > pagination.perPage && (
                        <div className="flex justify-center">
                            <Pagination
                                total={Math.ceil(filteredData.length / pagination.perPage)}
                                page={pagination.currentPage}
                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                showControls
                                size={isMobile ? 'sm' : 'md'}
                                radius={themeRadius}
                            />
                        </div>
                    )
                }
            >
                <Card
                    radius={themeRadius}
                    className="bg-content2/50 backdrop-blur-md border border-divider/30"
                    style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                        backgroundColor: 'var(--theme-content2)',
                        borderColor: 'var(--theme-divider)',
                    }}
                >
                    <CardBody className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Spinner size="lg" />
                            </div>
                        ) : paginatedData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ExclamationTriangleIcon className="w-12 h-12 text-default-300 mb-4" />
                                <p className="text-lg font-medium text-default-500">No NCRs Found</p>
                                <p className="text-sm text-default-400 mt-1">
                                    {filters.search || filters.status !== 'all' || filters.severity !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Create your first Non-Conformance Report to get started'}
                                </p>
                                {canCreateNCR && !filters.search && filters.status === 'all' && filters.severity === 'all' && (
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        size="sm"
                                        className="mt-4"
                                        startContent={<PlusIcon className="w-4 h-4" />}
                                        onPress={() => showToast.info('Create NCR modal coming soon')}
                                    >
                                        Create NCR
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table
                                aria-label="NCR Table"
                                isHeaderSticky
                                classNames={{
                                    wrapper: "shadow-none",
                                    th: "bg-default-100 text-default-600 font-semibold",
                                    td: "py-3"
                                }}
                            >
                                <TableHeader columns={columns}>
                                    {(column) => (
                                        <TableColumn 
                                            key={column.uid}
                                            align={column.uid === 'actions' ? 'center' : 'start'}
                                        >
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody items={paginatedData} emptyContent="No NCRs found">
                                    {(item) => (
                                        <TableRow key={item.id}>
                                            {(columnKey) => (
                                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                                            )}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </StandardPageLayout>
        </>
    );
};

NCRIndex.layout = (page) => <App>{page}</App>;

export default NCRIndex;
