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
    DocumentTextIcon,
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
    ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import dayjs from 'dayjs';

const MaterialSubmittals = ({ title, submittals: initialSubmittals = [], stats: initialStats = {} }) => {
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
    const canCreateSubmittal = canCreate('quality.lab') || isSuperAdmin();
    const canEditSubmittal = canUpdate('quality.lab') || isSuperAdmin();
    const canDeleteSubmittal = canDelete('quality.lab') || isSuperAdmin();
    const canViewSubmittal = hasAccess('quality.lab') || isSuperAdmin();
    
    // State
    const [submittalsData, setSubmittalsData] = useState(initialSubmittals);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        category: 'all',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: initialSubmittals?.length || 0
    });

    // Stats computed from data
    const computedStats = useMemo(() => {
        const data = Array.isArray(submittalsData) ? submittalsData : [];
        return {
            total: initialStats?.total || data.length,
            pending: initialStats?.pending || data.filter(s => s.status === 'pending').length,
            approved: initialStats?.approved || data.filter(s => s.status === 'approved').length,
            rejected: initialStats?.rejected || data.filter(s => s.status === 'rejected').length,
        };
    }, [submittalsData, initialStats]);

    // Stats cards configuration
    const statsCards = useMemo(() => [
        {
            title: 'Total Submittals',
            value: computedStats.total,
            icon: <ArchiveBoxIcon className="w-5 h-5" />,
            color: 'text-blue-600',
            iconBg: 'bg-blue-500/20',
            description: 'All material submittals'
        },
        {
            title: 'Pending Review',
            value: computedStats.pending,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting approval'
        },
        {
            title: 'Approved',
            value: computedStats.approved,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Materials approved'
        },
        {
            title: 'Rejected',
            value: computedStats.rejected,
            icon: <XCircleIcon className="w-5 h-5" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Materials rejected'
        },
    ], [computedStats]);

    // Status color map
    const statusColorMap = {
        draft: 'default',
        pending: 'warning',
        under_review: 'primary',
        approved: 'success',
        approved_with_comments: 'secondary',
        rejected: 'danger',
        resubmit: 'warning',
    };

    // Category color map
    const categoryColorMap = {
        concrete: 'primary',
        steel: 'secondary',
        electrical: 'warning',
        mechanical: 'success',
        finishing: 'default',
        plumbing: 'primary',
    };

    // Table columns
    const columns = [
        { name: 'Submittal No.', uid: 'id', sortable: true },
        { name: 'Title', uid: 'title', sortable: true },
        { name: 'Category', uid: 'category', sortable: true },
        { name: 'Supplier', uid: 'supplier' },
        { name: 'Submitted Date', uid: 'submitted_date', sortable: true },
        { name: 'Status', uid: 'status', sortable: true },
        { name: 'Reviewer', uid: 'reviewer' },
        { name: 'Actions', uid: 'actions' },
    ];

    // Filter change handler
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Filtered data
    const filteredData = useMemo(() => {
        let data = Array.isArray(submittalsData) ? [...submittalsData] : [];
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            data = data.filter(submittal => 
                submittal.id?.toString().toLowerCase().includes(searchLower) ||
                submittal.title?.toLowerCase().includes(searchLower) ||
                submittal.supplier?.toLowerCase().includes(searchLower)
            );
        }
        
        if (filters.status !== 'all') {
            data = data.filter(submittal => submittal.status === filters.status);
        }
        
        if (filters.category !== 'all') {
            data = data.filter(submittal => submittal.category === filters.category);
        }
        
        return data;
    }, [submittalsData, filters]);

    // Format status for display
    const formatStatus = (status) => {
        if (!status) return '-';
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Render cell content
    const renderCell = useCallback((submittal, columnKey) => {
        switch (columnKey) {
            case 'id':
                return <span className="font-mono text-sm">{submittal.id || '-'}</span>;
            case 'title':
                return <span className="text-sm font-medium">{submittal.title || '-'}</span>;
            case 'submitted_date':
                return submittal.submitted_date ? dayjs(submittal.submitted_date).format('DD/MM/YYYY') : '-';
            case 'category':
                return (
                    <Chip 
                        size="sm" 
                        color={categoryColorMap[submittal.category] || 'default'}
                        variant="flat"
                    >
                        {submittal.category?.charAt(0).toUpperCase() + submittal.category?.slice(1) || '-'}
                    </Chip>
                );
            case 'supplier':
                return <span className="text-sm">{submittal.supplier || '-'}</span>;
            case 'reviewer':
                return <span className="text-sm">{submittal.reviewer || '-'}</span>;
            case 'status':
                return (
                    <Chip 
                        size="sm" 
                        color={statusColorMap[submittal.status] || 'default'}
                        variant="flat"
                    >
                        {formatStatus(submittal.status)}
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
                            {canViewSubmittal && (
                                <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}>
                                    View Details
                                </DropdownItem>
                            )}
                            {canEditSubmittal && (
                                <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}>
                                    Edit Submittal
                                </DropdownItem>
                            )}
                            {canDeleteSubmittal && (
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />}>
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return submittal[columnKey] || '-';
        }
    }, [canViewSubmittal, canEditSubmittal, canDeleteSubmittal]);

    // Empty state
    const emptyState = (
        <div className="flex flex-col items-center justify-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-default-300 mb-4" />
            <h3 className="text-lg font-medium text-default-600 mb-2">No Material Submittals</h3>
            <p className="text-sm text-default-400 mb-4">Get started by creating your first material submittal.</p>
            {canCreateSubmittal && (
                <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                >
                    Add Submittal
                </Button>
            )}
        </div>
    );

    return (
        <StandardPageLayout
            title={title || 'Material Submittals'}
            subtitle="Track and manage material submittal approvals"
            icon={<DocumentTextIcon className="w-8 h-8" />}
            iconColor="primary"
            actions={
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="flat"
                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                        size={isMobile ? "sm" : "md"}
                    >
                        Export
                    </Button>
                    {canCreateSubmittal && (
                        <Button
                            color="primary"
                            variant="shadow"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            size={isMobile ? "sm" : "md"}
                        >
                            Add Submittal
                        </Button>
                    )}
                </div>
            }
            stats={<StatsCards stats={statsCards} className="mb-6" />}
            filters={
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Input
                        placeholder="Search by ID, title, or supplier..."
                        value={filters.search}
                        onValueChange={(value) => handleFilterChange('search', value)}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        classNames={{ inputWrapper: "bg-default-100" }}
                        radius={themeRadius}
                        className="w-full sm:w-64"
                    />
                    <Select
                        placeholder="Status"
                        selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                        onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                        classNames={{ trigger: "bg-default-100" }}
                        radius={themeRadius}
                        className="w-full sm:w-48"
                    >
                        <SelectItem key="all">All Status</SelectItem>
                        <SelectItem key="draft">Draft</SelectItem>
                        <SelectItem key="pending">Pending</SelectItem>
                        <SelectItem key="under_review">Under Review</SelectItem>
                        <SelectItem key="approved">Approved</SelectItem>
                        <SelectItem key="approved_with_comments">Approved with Comments</SelectItem>
                        <SelectItem key="rejected">Rejected</SelectItem>
                        <SelectItem key="resubmit">Resubmit Required</SelectItem>
                    </Select>
                    <Select
                        placeholder="Category"
                        selectedKeys={filters.category !== 'all' ? [filters.category] : []}
                        onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || 'all')}
                        classNames={{ trigger: "bg-default-100" }}
                        radius={themeRadius}
                        className="w-full sm:w-40"
                    >
                        <SelectItem key="all">All Categories</SelectItem>
                        <SelectItem key="concrete">Concrete</SelectItem>
                        <SelectItem key="steel">Steel</SelectItem>
                        <SelectItem key="electrical">Electrical</SelectItem>
                        <SelectItem key="mechanical">Mechanical</SelectItem>
                        <SelectItem key="finishing">Finishing</SelectItem>
                        <SelectItem key="plumbing">Plumbing</SelectItem>
                    </Select>
                </div>
            }
            content={
                loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : filteredData.length === 0 ? (
                    emptyState
                ) : (
                    <Table
                        aria-label="Material submittals table"
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
                        <TableBody items={filteredData} emptyContent="No submittals found">
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )
            }
            pagination={
                filteredData.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-default-500">
                            Showing {Math.min((pagination.currentPage - 1) * pagination.perPage + 1, filteredData.length)} to {Math.min(pagination.currentPage * pagination.perPage, filteredData.length)} of {filteredData.length} submittals
                        </span>
                        <Pagination
                            total={Math.ceil(filteredData.length / pagination.perPage)}
                            page={pagination.currentPage}
                            onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                            showControls
                            radius={themeRadius}
                        />
                    </div>
                )
            }
        />
    );
};

MaterialSubmittals.layout = (page) => <App children={page} />;
export default MaterialSubmittals;
