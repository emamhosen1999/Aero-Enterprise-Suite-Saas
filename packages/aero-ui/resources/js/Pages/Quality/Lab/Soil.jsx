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
    MapIcon,
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
    BeakerIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import dayjs from 'dayjs';

const SoilDensityTests = ({ title, tests: initialTests = [], stats: initialStats = {} }) => {
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
    const canCreateTest = canCreate('quality.lab') || isSuperAdmin();
    const canEditTest = canUpdate('quality.lab') || isSuperAdmin();
    const canDeleteTest = canDelete('quality.lab') || isSuperAdmin();
    const canViewTest = hasAccess('quality.lab') || isSuperAdmin();
    
    // State
    const [testsData, setTestsData] = useState(initialTests);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        testType: 'all',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: initialTests?.length || 0
    });

    // Stats computed from data
    const computedStats = useMemo(() => {
        const data = Array.isArray(testsData) ? testsData : [];
        return {
            total: initialStats?.total || data.length,
            pending: initialStats?.pending || data.filter(t => t.status === 'pending').length,
            passed: initialStats?.passed || data.filter(t => t.status === 'passed').length,
            failed: initialStats?.failed || data.filter(t => t.status === 'failed').length,
        };
    }, [testsData, initialStats]);

    // Stats cards configuration
    const statsCards = useMemo(() => [
        {
            title: 'Total Tests',
            value: computedStats.total,
            icon: <BeakerIcon className="w-5 h-5" />,
            color: 'text-blue-600',
            iconBg: 'bg-blue-500/20',
            description: 'All soil density tests'
        },
        {
            title: 'Pending',
            value: computedStats.pending,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting results'
        },
        {
            title: 'Passed',
            value: computedStats.passed,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Met requirements'
        },
        {
            title: 'Failed',
            value: computedStats.failed,
            icon: <XCircleIcon className="w-5 h-5" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Did not meet requirements'
        },
    ], [computedStats]);

    // Status color map
    const statusColorMap = {
        pending: 'warning',
        in_progress: 'primary',
        passed: 'success',
        failed: 'danger',
    };

    // Test type color map
    const testTypeColorMap = {
        sand_replacement: 'primary',
        nuclear_gauge: 'secondary',
        core_cutter: 'success',
        water_displacement: 'warning',
    };

    // Table columns
    const columns = [
        { name: 'Test ID', uid: 'id', sortable: true },
        { name: 'Test Date', uid: 'test_date', sortable: true },
        { name: 'Test Type', uid: 'test_type', sortable: true },
        { name: 'Location', uid: 'location' },
        { name: 'Layer', uid: 'layer' },
        { name: 'Density (%)', uid: 'density' },
        { name: 'Status', uid: 'status', sortable: true },
        { name: 'Actions', uid: 'actions' },
    ];

    // Filter change handler
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Filtered data
    const filteredData = useMemo(() => {
        let data = Array.isArray(testsData) ? [...testsData] : [];
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            data = data.filter(test => 
                test.id?.toString().toLowerCase().includes(searchLower) ||
                test.location?.toLowerCase().includes(searchLower)
            );
        }
        
        if (filters.status !== 'all') {
            data = data.filter(test => test.status === filters.status);
        }
        
        if (filters.testType !== 'all') {
            data = data.filter(test => test.test_type === filters.testType);
        }
        
        return data;
    }, [testsData, filters]);

    // Format test type for display
    const formatTestType = (type) => {
        if (!type) return '-';
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Render cell content
    const renderCell = useCallback((test, columnKey) => {
        switch (columnKey) {
            case 'id':
                return <span className="font-mono text-sm">{test.id || '-'}</span>;
            case 'test_date':
                return test.test_date ? dayjs(test.test_date).format('DD/MM/YYYY') : '-';
            case 'test_type':
                return (
                    <Chip 
                        size="sm" 
                        color={testTypeColorMap[test.test_type] || 'default'}
                        variant="flat"
                    >
                        {formatTestType(test.test_type)}
                    </Chip>
                );
            case 'location':
                return <span className="text-sm">{test.location || '-'}</span>;
            case 'layer':
                return <span className="text-sm">{test.layer || '-'}</span>;
            case 'density':
                return test.density ? `${test.density}%` : '-';
            case 'status':
                return (
                    <Chip 
                        size="sm" 
                        color={statusColorMap[test.status] || 'default'}
                        variant="flat"
                    >
                        {test.status?.charAt(0).toUpperCase() + test.status?.slice(1) || '-'}
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
                            {canViewTest && (
                                <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}>
                                    View Details
                                </DropdownItem>
                            )}
                            {canEditTest && (
                                <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}>
                                    Edit Test
                                </DropdownItem>
                            )}
                            {canDeleteTest && (
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />}>
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return test[columnKey] || '-';
        }
    }, [canViewTest, canEditTest, canDeleteTest]);

    // Empty state
    const emptyState = (
        <div className="flex flex-col items-center justify-center py-12">
            <MapIcon className="w-16 h-16 text-default-300 mb-4" />
            <h3 className="text-lg font-medium text-default-600 mb-2">No Soil Density Tests</h3>
            <p className="text-sm text-default-400 mb-4">Get started by recording your first soil density test.</p>
            {canCreateTest && (
                <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                >
                    Add Test
                </Button>
            )}
        </div>
    );

    return (
        <StandardPageLayout
            title={title || 'Soil Density Tests'}
            subtitle="Track and manage soil compaction test results"
            icon={<MapIcon className="w-8 h-8" />}
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
                    {canCreateTest && (
                        <Button
                            color="primary"
                            variant="shadow"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            size={isMobile ? "sm" : "md"}
                        >
                            Add Test
                        </Button>
                    )}
                </div>
            }
            stats={<StatsCards stats={statsCards} className="mb-6" />}
            filters={
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Input
                        placeholder="Search by ID or location..."
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
                        className="w-full sm:w-40"
                    >
                        <SelectItem key="all">All Status</SelectItem>
                        <SelectItem key="pending">Pending</SelectItem>
                        <SelectItem key="in_progress">In Progress</SelectItem>
                        <SelectItem key="passed">Passed</SelectItem>
                        <SelectItem key="failed">Failed</SelectItem>
                    </Select>
                    <Select
                        placeholder="Test Type"
                        selectedKeys={filters.testType !== 'all' ? [filters.testType] : []}
                        onSelectionChange={(keys) => handleFilterChange('testType', Array.from(keys)[0] || 'all')}
                        classNames={{ trigger: "bg-default-100" }}
                        radius={themeRadius}
                        className="w-full sm:w-48"
                    >
                        <SelectItem key="all">All Types</SelectItem>
                        <SelectItem key="sand_replacement">Sand Replacement</SelectItem>
                        <SelectItem key="nuclear_gauge">Nuclear Gauge</SelectItem>
                        <SelectItem key="core_cutter">Core Cutter</SelectItem>
                        <SelectItem key="water_displacement">Water Displacement</SelectItem>
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
                        aria-label="Soil density tests table"
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
                        <TableBody items={filteredData} emptyContent="No tests found">
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
                            Showing {Math.min((pagination.currentPage - 1) * pagination.perPage + 1, filteredData.length)} to {Math.min(pagination.currentPage * pagination.perPage, filteredData.length)} of {filteredData.length} tests
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

SoilDensityTests.layout = (page) => <App children={page} />;
export default SoilDensityTests;
