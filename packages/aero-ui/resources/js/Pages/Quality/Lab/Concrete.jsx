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
    CubeIcon,
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

const ConcreteCubeRegister = ({ title, cubes: initialCubes = [], stats: initialStats = {} }) => {
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
    const canCreateCube = canCreate('quality.lab') || isSuperAdmin();
    const canEditCube = canUpdate('quality.lab') || isSuperAdmin();
    const canDeleteCube = canDelete('quality.lab') || isSuperAdmin();
    const canViewCube = hasAccess('quality.lab') || isSuperAdmin();
    
    // State
    const [cubesData, setCubesData] = useState(initialCubes);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        grade: 'all',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: initialCubes?.length || 0
    });

    // Stats computed from data
    const computedStats = useMemo(() => {
        const data = Array.isArray(cubesData) ? cubesData : [];
        return {
            total: initialStats?.total || data.length,
            pending: initialStats?.pending || data.filter(c => c.status === 'pending').length,
            tested: initialStats?.tested || data.filter(c => c.status === 'tested').length,
            passed: initialStats?.passed || data.filter(c => c.status === 'passed').length,
            failed: initialStats?.failed || data.filter(c => c.status === 'failed').length,
        };
    }, [cubesData, initialStats]);

    // Stats cards configuration
    const statsCards = useMemo(() => [
        {
            title: 'Total Samples',
            value: computedStats.total,
            icon: <CubeIcon className="w-5 h-5" />,
            color: 'text-blue-600',
            iconBg: 'bg-blue-500/20',
            description: 'All cube samples'
        },
        {
            title: 'Pending Test',
            value: computedStats.pending,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting testing'
        },
        {
            title: 'Passed',
            value: computedStats.passed,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Passed strength test'
        },
        {
            title: 'Failed',
            value: computedStats.failed,
            icon: <XCircleIcon className="w-5 h-5" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Failed strength test'
        },
    ], [computedStats]);

    // Status color map
    const statusColorMap = {
        pending: 'warning',
        tested: 'primary',
        passed: 'success',
        failed: 'danger',
    };

    // Grade color map
    const gradeColorMap = {
        C20: 'default',
        C25: 'primary',
        C30: 'secondary',
        C35: 'success',
        C40: 'warning',
        C45: 'danger',
    };

    // Table columns
    const columns = [
        { name: 'Sample ID', uid: 'id', sortable: true },
        { name: 'Pour Date', uid: 'pour_date', sortable: true },
        { name: 'Grade', uid: 'grade', sortable: true },
        { name: 'Location', uid: 'location' },
        { name: 'Test Date', uid: 'test_date', sortable: true },
        { name: 'Strength (MPa)', uid: 'strength' },
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
        let data = Array.isArray(cubesData) ? [...cubesData] : [];
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            data = data.filter(cube => 
                cube.id?.toString().toLowerCase().includes(searchLower) ||
                cube.location?.toLowerCase().includes(searchLower)
            );
        }
        
        if (filters.status !== 'all') {
            data = data.filter(cube => cube.status === filters.status);
        }
        
        if (filters.grade !== 'all') {
            data = data.filter(cube => cube.grade === filters.grade);
        }
        
        return data;
    }, [cubesData, filters]);

    // Render cell content
    const renderCell = useCallback((cube, columnKey) => {
        switch (columnKey) {
            case 'id':
                return <span className="font-mono text-sm">{cube.id || '-'}</span>;
            case 'pour_date':
                return cube.pour_date ? dayjs(cube.pour_date).format('DD/MM/YYYY') : '-';
            case 'grade':
                return (
                    <Chip 
                        size="sm" 
                        color={gradeColorMap[cube.grade] || 'default'}
                        variant="flat"
                    >
                        {cube.grade || '-'}
                    </Chip>
                );
            case 'location':
                return <span className="text-sm">{cube.location || '-'}</span>;
            case 'test_date':
                return cube.test_date ? dayjs(cube.test_date).format('DD/MM/YYYY') : 'Pending';
            case 'strength':
                return cube.strength ? `${cube.strength} MPa` : '-';
            case 'status':
                return (
                    <Chip 
                        size="sm" 
                        color={statusColorMap[cube.status] || 'default'}
                        variant="flat"
                    >
                        {cube.status?.charAt(0).toUpperCase() + cube.status?.slice(1) || '-'}
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
                            {canViewCube && (
                                <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}>
                                    View Details
                                </DropdownItem>
                            )}
                            {canEditCube && (
                                <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}>
                                    Edit Sample
                                </DropdownItem>
                            )}
                            {canDeleteCube && (
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />}>
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return cube[columnKey] || '-';
        }
    }, [canViewCube, canEditCube, canDeleteCube]);

    // Empty state
    const emptyState = (
        <div className="flex flex-col items-center justify-center py-12">
            <CubeIcon className="w-16 h-16 text-default-300 mb-4" />
            <h3 className="text-lg font-medium text-default-600 mb-2">No Concrete Samples</h3>
            <p className="text-sm text-default-400 mb-4">Get started by registering your first concrete cube sample.</p>
            {canCreateCube && (
                <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                >
                    Add Sample
                </Button>
            )}
        </div>
    );

    return (
        <StandardPageLayout
            title={title || 'Concrete Cube Register'}
            subtitle="Track and manage concrete cube samples and test results"
            icon={<CubeIcon className="w-8 h-8" />}
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
                    {canCreateCube && (
                        <Button
                            color="primary"
                            variant="shadow"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            size={isMobile ? "sm" : "md"}
                        >
                            Add Sample
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
                        <SelectItem key="tested">Tested</SelectItem>
                        <SelectItem key="passed">Passed</SelectItem>
                        <SelectItem key="failed">Failed</SelectItem>
                    </Select>
                    <Select
                        placeholder="Grade"
                        selectedKeys={filters.grade !== 'all' ? [filters.grade] : []}
                        onSelectionChange={(keys) => handleFilterChange('grade', Array.from(keys)[0] || 'all')}
                        classNames={{ trigger: "bg-default-100" }}
                        radius={themeRadius}
                        className="w-full sm:w-40"
                    >
                        <SelectItem key="all">All Grades</SelectItem>
                        <SelectItem key="C20">C20</SelectItem>
                        <SelectItem key="C25">C25</SelectItem>
                        <SelectItem key="C30">C30</SelectItem>
                        <SelectItem key="C35">C35</SelectItem>
                        <SelectItem key="C40">C40</SelectItem>
                        <SelectItem key="C45">C45</SelectItem>
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
                        aria-label="Concrete cube samples table"
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
                        <TableBody items={filteredData} emptyContent="No samples found">
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
                            Showing {Math.min((pagination.currentPage - 1) * pagination.perPage + 1, filteredData.length)} to {Math.min(pagination.currentPage * pagination.perPage, filteredData.length)} of {filteredData.length} samples
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

ConcreteCubeRegister.layout = (page) => <App children={page} />;
export default ConcreteCubeRegister;
