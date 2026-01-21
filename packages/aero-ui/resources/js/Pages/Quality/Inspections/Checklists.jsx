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
    Progress,
} from "@heroui/react";
import {
    ClipboardDocumentListIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    ClockIcon,
    ChartBarIcon,
    DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import dayjs from 'dayjs';

const ChecklistsIndex = ({ title, checklists: initialChecklists = [], stats: initialStats = {} }) => {
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
    const canCreateChecklist = canCreate('quality.inspections') || isSuperAdmin();
    const canEditChecklist = canUpdate('quality.inspections') || isSuperAdmin();
    const canDeleteChecklist = canDelete('quality.inspections') || isSuperAdmin();
    
    // State
    const [checklistsData, setChecklistsData] = useState(initialChecklists);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        category: 'all',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: initialChecklists?.length || 0
    });

    // Stats computed from data
    const computedStats = useMemo(() => {
        const data = Array.isArray(checklistsData) ? checklistsData : [];
        return {
            total: initialStats?.total || data.length,
            active: initialStats?.active || data.filter(c => c.status === 'active').length,
            completed: initialStats?.completed || data.filter(c => c.status === 'completed').length,
            templates: initialStats?.templates || data.filter(c => c.is_template).length,
        };
    }, [checklistsData, initialStats]);

    // Stats cards configuration
    const statsCards = useMemo(() => [
        {
            title: 'Total Checklists',
            value: computedStats.total,
            icon: <ChartBarIcon className="w-5 h-5" />,
            color: 'text-blue-600',
            iconBg: 'bg-blue-500/20',
            description: 'All checklists'
        },
        {
            title: 'Active',
            value: computedStats.active,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'In progress'
        },
        {
            title: 'Completed',
            value: computedStats.completed,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Finished checklists'
        },
        {
            title: 'Templates',
            value: computedStats.templates,
            icon: <DocumentCheckIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'Reusable templates'
        },
    ], [computedStats]);

    // Status color map
    const statusColorMap = {
        active: 'warning',
        completed: 'success',
        draft: 'default',
        archived: 'secondary',
    };

    // Table columns
    const columns = [
        { name: 'ID', uid: 'id', sortable: true },
        { name: 'Title', uid: 'title', sortable: true },
        { name: 'Category', uid: 'category', sortable: true },
        { name: 'Items', uid: 'items_count' },
        { name: 'Progress', uid: 'progress' },
        { name: 'Status', uid: 'status', sortable: true },
        { name: 'Last Updated', uid: 'updated_at', sortable: true },
        { name: 'Actions', uid: 'actions' },
    ];

    // Filter handler
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Filtered data
    const filteredData = useMemo(() => {
        let data = Array.isArray(checklistsData) ? [...checklistsData] : [];
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            data = data.filter(item => 
                item.title?.toLowerCase().includes(searchLower) ||
                item.category?.toLowerCase().includes(searchLower) ||
                item.id?.toString().includes(searchLower)
            );
        }
        
        if (filters.status !== 'all') {
            data = data.filter(item => item.status === filters.status);
        }
        
        if (filters.category !== 'all') {
            data = data.filter(item => item.category === filters.category);
        }
        
        return data;
    }, [checklistsData, filters]);

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
                return <span className="font-mono text-sm">CL-{String(value).padStart(4, '0')}</span>;
            case 'title':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{value}</span>
                        {item.is_template && (
                            <Chip size="sm" variant="flat" color="secondary" className="mt-1 w-fit">
                                Template
                            </Chip>
                        )}
                    </div>
                );
            case 'category':
                return <span className="capitalize">{value || 'Uncategorized'}</span>;
            case 'items_count':
                return (
                    <span className="text-sm">
                        {item.completed_items || 0} / {item.total_items || 0}
                    </span>
                );
            case 'progress':
                const progress = item.total_items > 0 
                    ? Math.round((item.completed_items / item.total_items) * 100)
                    : 0;
                return (
                    <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress
                            size="sm"
                            value={progress}
                            color={progress === 100 ? 'success' : 'primary'}
                            className="flex-1"
                        />
                        <span className="text-xs text-default-500">{progress}%</span>
                    </div>
                );
            case 'status':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color={statusColorMap[value] || 'default'}
                    >
                        {value?.toUpperCase() || 'N/A'}
                    </Chip>
                );
            case 'updated_at':
                return value ? dayjs(value).format('DD MMM YYYY') : '-';
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
                            {canEditChecklist && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDeleteChecklist && (
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
    }, [canEditChecklist, canDeleteChecklist]);

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
            {canCreateChecklist && (
                <Button
                    color="primary"
                    variant="shadow"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    size={isMobile ? "sm" : "md"}
                >
                    Add Checklist
                </Button>
            )}
        </div>
    );

    // Filters section
    const filtersSection = (
        <div className="flex flex-col sm:flex-row gap-4">
            <Input
                placeholder="Search by ID, title, or category..."
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
                <SelectItem key="draft">Draft</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="completed">Completed</SelectItem>
                <SelectItem key="archived">Archived</SelectItem>
            </Select>
            <Select
                placeholder="Category"
                selectedKeys={filters.category !== 'all' ? [filters.category] : []}
                onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || 'all')}
                className="w-full sm:w-40"
                radius={themeRadius}
            >
                <SelectItem key="all">All Categories</SelectItem>
                <SelectItem key="structural">Structural</SelectItem>
                <SelectItem key="electrical">Electrical</SelectItem>
                <SelectItem key="mechanical">Mechanical</SelectItem>
                <SelectItem key="safety">Safety</SelectItem>
                <SelectItem key="finishing">Finishing</SelectItem>
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
                        <ClipboardDocumentListIcon className="w-16 h-16 text-default-300 mb-4" />
                        <p className="text-lg font-semibold text-default-600 mb-2">No Checklists Found</p>
                        <p className="text-sm text-default-500 mb-4">
                            Create your first smart checklist to get started
                        </p>
                        {canCreateChecklist && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                            >
                                Create Checklist
                            </Button>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <Table
                    aria-label="Checklists table"
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
                    <TableBody items={paginatedData} emptyContent="No checklists found">
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
            <Head title={title || 'Smart Checklists'} />
            <StandardPageLayout
                title="Smart Checklists"
                subtitle="Create and manage inspection checklists with progress tracking"
                icon={<ClipboardDocumentListIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
                iconColor="success"
                ariaLabel="Smart Checklists Management"
                actions={actionButtons}
                stats={<StatsCards stats={statsCards} />}
                filters={filtersSection}
                content={tableContent}
                pagination={paginationSection}
            />
        </>
    );
};

ChecklistsIndex.layout = (page) => <App children={page} />;

export default ChecklistsIndex;
