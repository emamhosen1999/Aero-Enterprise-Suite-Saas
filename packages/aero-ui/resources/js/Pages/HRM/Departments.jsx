import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import {motion} from 'framer-motion';
import {Button, ButtonGroup, Card, CardBody, Chip, Input, Pagination, Select, SelectItem, Spinner} from "@heroui/react";
import {
    AdjustmentsHorizontalIcon,
    BuildingOffice2Icon,
    BuildingOfficeIcon,
    CalendarIcon,
    CheckCircleIcon,
    DocumentArrowDownIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    PencilIcon,
    PlusIcon,
    Squares2X2Icon,
    TableCellsIcon,
    UserGroupIcon,
    UsersIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import PageHeader from '@/Components/PageHeader.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import App from '@/Layouts/App.jsx';
import DepartmentTable from '@/Tables/HRM/DepartmentTable.jsx';
import DepartmentForm from '@/Forms/HRM/DepartmentForm.jsx';
import DeleteDepartmentForm from '@/Forms/HRM/DeleteDepartmentForm.jsx';
import {useTheme} from '@/Context/ThemeContext.jsx';
import axios from 'axios';
import {showToast} from '@/utils/toastUtils.jsx';
import dayjs from 'dayjs';

const Departments = ({ title, departments: initialDepartments, managers, parentDepartments, stats: initialStats, filters: initialFilters }) => {
    const { auth } = usePage().props;
    const { theme } = useTheme();
    const [isMobile] = useState(window.innerWidth < 640);
    const [isTablet] = useState(window.innerWidth < 768);
    
    // State for departments data
    const [departmentsData, setDepartmentsData] = useState(initialDepartments || { data: [] });
    const [loading, setLoading] = useState(false);
    
    // Modal states
    const [modalState, setModalState] = useState({
        type: null,
        department: null
    });
    
    // Filters
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        parentDepartment: initialFilters?.parentDepartment || 'all'
    });
    
    // Show/Hide filters panel
    const [showFilters, setShowFilters] = useState(false);
    
    // View mode (table or grid)
    const [viewMode, setViewMode] = useState('table');
    
    // Pagination
    const [pagination, setPagination] = useState({
        currentPage: initialDepartments?.current_page || 1,
        perPage: initialDepartments?.per_page || 10
    });
    
    // Stats state
    const [stats, setStats] = useState(initialStats || {
        total: 0,
        active: 0,
        inactive: 0,
        parent_departments: 0
    });
    
    // Check permissions
    const canCreateDepartment = auth.permissions?.includes('departments.create') || false;
    const canEditDepartment = auth.permissions?.includes('departments.update') || false;
    const canDeleteDepartment = auth.permissions?.includes('departments.delete') || false;
    
    // Check permissions more directly for template use
    const hasEditPermission = canEditDepartment || auth.permissions?.includes('departments.update') || false;
    const hasDeletePermission = canDeleteDepartment || auth.permissions?.includes('departments.delete') || false;
    
    // Fetch departments data
    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        
        try {
            const response = await axios.get(route('api.departments'), {
                params: {
                    page: pagination.currentPage,
                    per_page: pagination.perPage,
                    search: filters.search,
                    status: filters.status,
                    parent_department: filters.parentDepartment
                }
            });
            
            setDepartmentsData(response.data.departments);
        } catch (error) {
            console.error('Error fetching departments:', error);
            showToast.error('Failed to load departments data');
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.perPage, filters.search, filters.status, filters.parentDepartment]);
    
    // Fetch department statistics
    const fetchDepartmentStats = useCallback(async () => {
        try {
            const response = await axios.get(route('departments.stats'));
            
            if (response.status === 200) {
                const { stats } = response.data;
                setStats(stats);
            }
        } catch (error) {
            console.error('Error fetching department stats:', error);
        }
    }, []);
    
    // Effect to fetch data when filters or pagination changes
    useEffect(() => {
        fetchDepartments();
        fetchDepartmentStats();
    }, [fetchDepartments, fetchDepartmentStats]);
    
    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
    };
    
    // Handle pagination changes
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleRowsPerPageChange = (rowsPerPage) => {
        setPagination({ currentPage: 1, perPage: rowsPerPage });
    };
    
    // Modal handlers
    const openModal = (type, department = null) => {
        setModalState({ type, department });
    };
    
    const closeModal = () => {
        setModalState({ type: null, department: null });
    };
    
    // Handle success actions
    const handleSuccess = () => {
        fetchDepartments();
        fetchDepartmentStats();
    };
    
    // Department Card component for grid view
    const DepartmentCard = ({ department, index }) => {
        const manager = department.manager;
        const parent = department.parent;

        return (
            <Card 
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer h-full"
                onPress={() => openModal('view_department', department)}
            >
                <CardBody className="p-4 flex flex-col h-full">
                    {/* Card Header with Department Info */}
                    <div className="flex items-start gap-3 mb-3 pb-3 border-b border-white/10">
                        <div className="flex justify-center items-center h-10 w-10 rounded-lg bg-primary/20 text-primary shrink-0">
                            <BuildingOfficeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-foreground text-sm line-clamp-1">{department.name}</h3>
                                    <p className="text-default-500 text-xs">{department.code || 'No Code'}</p>
                                </div>
                                
                                {hasEditPermission && (
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="text-default-400 hover:text-foreground ml-2"
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            openModal('edit_department', department);
                                        }}
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex-1 flex flex-col gap-3">
                        {/* Location */}
                        {department.location && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPinIcon className="w-4 h-4 text-default-400 shrink-0" />
                                <span className="text-default-600 text-xs line-clamp-1">{department.location}</span>
                            </div>
                        )}
                        
                        {/* Established Date */}
                        {department.established_date && (
                            <div className="flex items-center gap-2 text-sm">
                                <CalendarIcon className="w-4 h-4 text-default-400 shrink-0" />
                                <span className="text-default-600 text-xs">
                                    {dayjs(department.established_date).format('MMM D, YYYY')}
                                </span>
                            </div>
                        )}
                        
                        {/* Employees Count */}
                        <div className="flex items-center gap-2 text-sm">
                            <UsersIcon className="w-4 h-4 text-default-400 shrink-0" />
                            <span className="text-default-600 text-xs">
                                {department.employee_count || 0} {department.employee_count === 1 ? 'Employee' : 'Employees'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Card Footer with Tags */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                        {/* Status */}
                        <Chip
                            size="sm"
                            variant={department.is_active ? "solid" : "bordered"}
                            color={department.is_active ? "success" : "danger"}
                            className="text-xs"
                            startContent={department.is_active ? 
                                <CheckCircleIcon className="w-3 h-3" /> : 
                                <XCircleIcon className="w-3 h-3" />
                            }
                        >
                            {department.is_active ? 'Active' : 'Inactive'}
                        </Chip>
                        
                        {/* Parent Department */}
                        {parent && (
                            <Chip
                                size="sm"
                                variant="flat"
                                color="primary"
                                className="text-xs"
                                startContent={<BuildingOffice2Icon className="w-3 h-3" />}
                            >
                                {parent.name}
                            </Chip>
                        )}
                        
                        {/* Manager */}
                        {manager && (
                            <Chip
                                size="sm"
                                variant="flat"
                                color="secondary"
                                className="text-xs"
                                startContent={<UsersIcon className="w-3 h-3" />}
                            >
                                {manager.name}
                            </Chip>
                        )}
                    </div>
                </CardBody>
            </Card>
        );
    };
    
    // Statistics cards
    const statsCards = useMemo(() => [
        {
            title: 'Total Departments',
            value: stats?.total || 0,
            icon: <BuildingOffice2Icon className="w-5 h-5" />,
            color: 'text-blue-400',
            iconBg: 'bg-blue-500/20',
            description: 'All departments'
        },
        {
            title: 'Active',
            value: stats?.active || 0,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-green-400',
            iconBg: 'bg-green-500/20',
            description: 'Active departments'
        },
        {
            title: 'Inactive',
            value: stats?.inactive || 0,
            icon: <XCircleIcon className="w-5 h-5" />,
            color: 'text-red-400',
            iconBg: 'bg-red-500/20',
            description: 'Inactive departments'
        },
        {
            title: 'Parent Departments',
            value: stats?.parent_departments || 0,
            icon: <UserGroupIcon className="w-5 h-5" />,
            color: 'text-purple-400',
            iconBg: 'bg-purple-500/20',
            description: 'Top-level departments'
        },
    ], [stats]);
    
    // Action buttons for page header
    const actionButtons = useMemo(() => {
        const buttons = [];
        
        if (canCreateDepartment) {
            buttons.push({
                label: isMobile ? "Add" : "Add Department",
                icon: <PlusIcon className="w-4 h-4" />,
                onPress: () => openModal('add_department'),
                className: "bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) text-white font-medium hover:opacity-90"
            });
        }

        buttons.push({
            label: isMobile ? "" : "Export",
            isIconOnly: isMobile,
            icon: <DocumentArrowDownIcon className="w-4 h-4" />,
            variant: "bordered",
            className: "border-[rgba(var(--theme-primary-rgb),0.3)] bg-[rgba(var(--theme-primary-rgb),0.05)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)]"
        });
        
        return buttons;
    }, [canCreateDepartment, isMobile]);
    
    return (
        <App>
            <Head title={title} />
            
            <div className="flex justify-center p-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Card className="shadow-lg">
                        <PageHeader
                            title="Department Management"
                            subtitle="Manage company departments, hierarchies, and organizational structure"
                            icon={<BuildingOffice2Icon className="w-8 h-8" />}
                            variant="default"
                            actionButtons={actionButtons}
                        >
                            <div className="p-4 sm:p-6">
                                {/* Statistics Cards */}
                                <StatsCards stats={statsCards} className="mb-6" />
                                
                                {/* View Controls */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="flex-1">
                                        <Input
                                            label="Search Departments"
                                            placeholder="Search by name, code, or location..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                        />
                                    </div>

                                    <div className="flex gap-2 items-end">
                                        {/* View Toggle */}
                                        <ButtonGroup variant="bordered" className="bg-white/5">
                                            <Button
                                                isIconOnly={isMobile}
                                                color={viewMode === 'table' ? 'primary' : 'default'}
                                                onPress={() => setViewMode('table')}
                                                className={viewMode === 'table' ? 'bg-blue-500/20' : ''}
                                            >
                                                <TableCellsIcon className="w-4 h-4" />
                                                {!isMobile && <span className="ml-1">Table</span>}
                                            </Button>
                                            <Button
                                                isIconOnly={isMobile}
                                                color={viewMode === 'grid' ? 'primary' : 'default'}
                                                onPress={() => setViewMode('grid')}
                                                className={viewMode === 'grid' ? 'bg-blue-500/20' : ''}
                                            >
                                                <Squares2X2Icon className="w-4 h-4" />
                                                {!isMobile && <span className="ml-1">Grid</span>}
                                            </Button>
                                        </ButtonGroup>
                                        
                                        {/* Filter Toggle */}
                                        <Button
                                            isIconOnly={isMobile}
                                            variant="bordered"
                                            onPress={() => setShowFilters(!showFilters)}
                                            className={showFilters ? 'bg-purple-500/20' : 'bg-white/5'}
                                        >
                                            <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                            {!isMobile && <span className="ml-1">Filters</span>}
                                        </Button>
                                    </div>
                                </div>

                                {/* Filters Section */}
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mb-6 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10"
                                    >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <Select
                                                    label="Status"
                                                    variant="bordered"
                                                    selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                                    onSelectionChange={(keys) => {
                                                        const value = Array.from(keys)[0] || 'all';
                                                        handleFilterChange('status', value);
                                                    }}
                                                    classNames={{
                                                        trigger: "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15",
                                                    }}
                                                >
                                                    <SelectItem key="all" value="all">All Statuses</SelectItem>
                                                    <SelectItem key="active" value="active">Active Only</SelectItem>
                                                    <SelectItem key="inactive" value="inactive">Inactive Only</SelectItem>
                                                </Select>

                                                <Select
                                                    label="Parent Department"
                                                    variant="bordered"
                                                    selectedKeys={filters.parentDepartment !== 'all' ? [filters.parentDepartment] : []}
                                                    onSelectionChange={(keys) => {
                                                        const value = Array.from(keys)[0] || 'all';
                                                        handleFilterChange('parentDepartment', value);
                                                    }}
                                                    classNames={{
                                                        trigger: "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15",
                                                    }}
                                                >
                                                    <SelectItem key="all" value="all">All Parent Departments</SelectItem>
                                                    <SelectItem key="none" value="none">Top-Level Departments</SelectItem>
                                                    {parentDepartments?.map(dept => (
                                                        <SelectItem key={dept.id.toString()} value={dept.id.toString()}>
                                                            {dept.name}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            </div>

                                            {/* Active Filters */}
                                            {(filters.search || filters.status !== 'all' || filters.parentDepartment !== 'all') && (
                                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                                                    {filters.search && (
                                                        <Chip
                                                            variant="flat"
                                                            color="primary"
                                                            size="sm"
                                                            onClose={() => handleFilterChange('search', '')}
                                                        >
                                                            Search: {filters.search}
                                                        </Chip>
                                                    )}
                                                    {filters.status !== 'all' && (
                                                        <Chip
                                                            variant="flat"
                                                            color="secondary"
                                                            size="sm"
                                                            onClose={() => handleFilterChange('status', 'all')}
                                                        >
                                                            Status: {filters.status === 'active' ? 'Active' : 'Inactive'}
                                                        </Chip>
                                                    )}
                                                    {filters.parentDepartment !== 'all' && (
                                                        <Chip
                                                            variant="flat"
                                                            color="warning"
                                                            size="sm"
                                                            onClose={() => handleFilterChange('parentDepartment', 'all')}
                                                        >
                                                            Parent: {
                                                                filters.parentDepartment === 'none' 
                                                                    ? 'None (Top-Level)' 
                                                                    : parentDepartments?.find(d => d.id === parseInt(filters.parentDepartment))?.name
                                                            }
                                                        </Chip>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                )}

                                {/* Content Area */}
                                <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
                                    <div className="p-4 border-b border-white/10">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {viewMode === 'table' ? 'Department Table' : 'Department Grid'} 
                                            <span className="text-sm text-default-500 ml-2">
                                                ({departmentsData.total || 0} {departmentsData.total === 1 ? 'department' : 'departments'})
                                            </span>
                                        </h3>
                                    </div>
                                    
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <Spinner size="lg" />
                                            <p className="mt-4 text-default-500">
                                                Loading departments data...
                                            </p>
                                        </div>
                                    ) : viewMode === 'table' ? (
                                        <DepartmentTable
                                            departments={departmentsData}
                                            loading={loading}
                                            onEdit={canEditDepartment ? (department) => openModal('edit_department', department) : undefined}
                                            onDelete={canDeleteDepartment ? (department) => openModal('delete_department', department) : undefined}
                                            onView={(department) => openModal('view_department', department)}
                                            isMobile={isMobile}
                                            isTablet={isTablet}
                                            pagination={pagination}
                                            onPageChange={handlePageChange}
                                            onRowsPerPageChange={handleRowsPerPageChange}
                                            canEditDepartment={canEditDepartment}
                                            canDeleteDepartment={canDeleteDepartment}
                                        />
                                    ) : (
                                        <div className="p-4">
                                            {departmentsData.data && departmentsData.data.length > 0 ? (
                                                <div className={`grid gap-4 ${
                                                    isMobile 
                                                        ? 'grid-cols-1' 
                                                        : isTablet 
                                                            ? 'grid-cols-2' 
                                                            : 'grid-cols-3 xl:grid-cols-4'
                                                }`}>
                                                    {departmentsData.data.map((department, index) => (
                                                        <DepartmentCard key={department.id} department={department} index={index} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <BuildingOffice2Icon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                                                    <p className="text-default-500 mb-1">
                                                        No departments found
                                                    </p>
                                                    <p className="text-xs text-default-400">
                                                        Try adjusting your search or filters
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {/* Pagination for Grid View */}
                                            {departmentsData.data && departmentsData.data.length > 0 && (
                                                <div className="flex justify-center mt-6 border-t border-white/10 pt-4">
                                                    <Pagination
                                                        total={Math.ceil(departmentsData.total / pagination.perPage)}
                                                        initialPage={pagination.currentPage}
                                                        page={pagination.currentPage}
                                                        onChange={handlePageChange}
                                                        size={isMobile ? "sm" : "md"}
                                                        variant="bordered"
                                                        showControls
                                                        classNames={{
                                                            item: "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15",
                                                            cursor: "bg-white/20 backdrop-blur-md border-white/20",
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </PageHeader>
                    </Card>
                </motion.div>
            </div>
            
            {/* Department Form Modal */}
            {(modalState.type === 'add_department' || modalState.type === 'edit_department') && (
                <DepartmentForm
                    open={true}
                    onClose={closeModal}
                    onSuccess={handleSuccess}
                    department={modalState.type === 'edit_department' ? modalState.department : null}
                    managers={managers}
                    parentDepartments={parentDepartments}
                />
            )}
            
            {/* Delete Department Modal */}
            {modalState.type === 'delete_department' && (
                <DeleteDepartmentForm
                    open={true}
                    onClose={closeModal}
                    onSuccess={handleSuccess}
                    department={modalState.department}
                />
            )}
            
            {/* View Department Modal */}
            {modalState.type === 'view_department' && (
                <DepartmentForm
                    open={true}
                    onClose={closeModal}
                    onSuccess={() => {}} // View only, no success handler needed
                    department={modalState.department}
                    managers={managers}
                    parentDepartments={parentDepartments}
                    readOnly={true}
                />
            )}
        </App>
    );
};

export default Departments;
