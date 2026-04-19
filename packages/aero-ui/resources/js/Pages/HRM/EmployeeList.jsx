import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Avatar, Tabs, Tab, Switch, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge, Accordion, AccordionItem } from "@heroui/react";
import { 
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    BuildingOfficeIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarDaysIcon,
    BriefcaseIcon,
    ChartBarIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    UserPlusIcon,
    ArrowDownTrayIcon,
    FunnelIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { ThemedCard } from '@/Components/UI/ThemedCard';
import { getStatusColor, useResponsiveBreakpoints } from '@/utils/themeUtils';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { useTheme } from '@/Context/ThemeContext';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { router } from '@inertiajs/react';

const EmployeeList = ({ title, departments = [], designations = [], roles = [] }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, canView } = useHRMAC();
    const themeRadius = useThemeRadius();
    
    // Use centralized responsive breakpoints
    const { isMobile, isTablet } = useResponsiveBreakpoints();

    // State management
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState(new Set());
    const [viewMode, setViewMode] = useState('table'); // table, grid, org_chart
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: 'all', 
        designation_id: 'all',
        employment_status: 'all',
        location: 'all',
        hire_date_from: '',
        hire_date_to: '',
        salary_range: 'all',
        manager_id: 'all',
        skills: [],
        performance_rating: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_employees: 0, 
        active_employees: 0, 
        on_leave: 0, 
        new_hires_month: 0,
        pending_reviews: 0,
        upcoming_birthdays: 0,
        contract_expiring: 0,
        departments_count: 0
    });
    const [modalStates, setModalStates] = useState({ 
        add: false, 
        edit: false, 
        delete: false, 
        view: false, 
        bulk_action: false,
        org_chart: false,
        export: false,
        import: false
    });
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [bulkAction, setBulkAction] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });

    // Permission checks
    const canCreateEmployees = canCreate('hrm.employees');
    const canEditEmployees = canUpdate('hrm.employees');
    const canDeleteEmployees = canDelete('hrm.employees');
    const canViewEmployees = canView('hrm.employees');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Employees", 
            value: stats.total_employees, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active", 
            value: stats.active_employees, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "On Leave", 
            value: stats.on_leave, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "New Hires", 
            value: stats.new_hires_month, 
            icon: <UserPlusIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Configuration options
    const employmentStatuses = [
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'inactive', label: 'Inactive', color: 'default' },
        { key: 'on_leave', label: 'On Leave', color: 'warning' },
        { key: 'terminated', label: 'Terminated', color: 'danger' },
        { key: 'retired', label: 'Retired', color: 'secondary' },
        { key: 'probation', label: 'Probation', color: 'primary' },
    ];

    const salaryRanges = [
        { key: '0-30000', label: '$0 - $30,000' },
        { key: '30000-50000', label: '$30,000 - $50,000' },
        { key: '50000-75000', label: '$50,000 - $75,000' },
        { key: '75000-100000', label: '$75,000 - $100,000' },
        { key: '100000-150000', label: '$100,000 - $150,000' },
        { key: '150000+', label: '$150,000+' },
    ];

    const performanceRatings = [
        { key: 'excellent', label: 'Excellent (4.5-5.0)', color: 'success' },
        { key: 'good', label: 'Good (3.5-4.4)', color: 'primary' },
        { key: 'satisfactory', label: 'Satisfactory (2.5-3.4)', color: 'warning' },
        { key: 'needs_improvement', label: 'Needs Improvement (1.5-2.4)', color: 'danger' },
        { key: 'unsatisfactory', label: 'Unsatisfactory (1.0-1.4)', color: 'danger' },
    ];

    const bulkActions = [
        { key: 'export_selected', label: 'Export Selected' },
        { key: 'send_message', label: 'Send Message' },
        { key: 'assign_training', label: 'Assign Training' },
        { key: 'update_department', label: 'Update Department' },
        { key: 'update_status', label: 'Update Status' },
        { key: 'generate_reports', label: 'Generate Reports' },
    ];

    const getEmployeeStatusColor = (status) => {
        return getStatusColor(status);
    };

    const getPerformanceColor = (rating) => {
        if (rating >= 4.5) return 'success';
        if (rating >= 3.5) return 'primary';
        if (rating >= 2.5) return 'warning';
        return 'danger';
    };

    const formatSalary = (salary) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(salary);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateTenure = (hireDate) => {
        if (!hireDate) return 'N/A';
        const hire = new Date(hireDate);
        const now = new Date();
        const diffTime = Math.abs(now - hire);
        const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
        const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
        
        if (diffYears > 0) {
            return `${diffYears}y ${diffMonths}m`;
        } else {
            return `${diffMonths}m`;
        }
    };

    // Data fetching
    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.employees.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    sort_by: sortConfig.key,
                    sort_direction: sortConfig.direction,
                    ...filters
                }
            });
            if (response.status === 200) {
                setEmployees(response.data.employees || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch employees'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage, sortConfig]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.employees.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch employee stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchStats();
    }, [fetchEmployees, fetchStats]);

    // CRUD operations
    const handleDelete = async () => {
        if (!selectedEmployee) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.employees.destroy', selectedEmployee.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Employee deleted successfully']);
                    fetchEmployees();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete employee']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting employee...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Bulk operations
    const handleBulkAction = async () => {
        if (!bulkAction || selectedEmployees.size === 0) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.employees.bulk_action'), {
                    action: bulkAction,
                    employee_ids: Array.from(selectedEmployees)
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Bulk action completed successfully']);
                    fetchEmployees();
                    fetchStats();
                    setSelectedEmployees(new Set());
                    closeModal('bulk_action');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to perform bulk action']);
            }
        });

        showToast.promise(promise, {
            loading: 'Processing bulk action...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Export functionality
    const handleExport = async (format = 'excel') => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.employees.export'), {
                    format,
                    filters,
                    selected_ids: selectedEmployees.size > 0 ? Array.from(selectedEmployees) : null
                });
                if (response.status === 200) {
                    // Handle file download
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.${format}`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    
                    resolve(['Export completed successfully']);
                    closeModal('export');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to export data']);
            }
        });

        showToast.promise(promise, {
            loading: 'Generating export...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type, employee = null) => {
        setSelectedEmployee(employee);
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedEmployee(null);
        if (type === 'bulk_action') {
            setBulkAction('');
        }
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            search: '', 
            department_id: 'all', 
            designation_id: 'all',
            employment_status: 'all',
            location: 'all',
            hire_date_from: '',
            hire_date_to: '',
            salary_range: 'all',
            manager_id: 'all',
            skills: [],
            performance_rating: 'all'
        });
    };

    // Selection handlers
    const handleSelectAll = (isSelected) => {
        if (isSelected) {
            setSelectedEmployees(new Set(employees.map(emp => emp.id)));
        } else {
            setSelectedEmployees(new Set());
        }
    };

    const handleSelectEmployee = (employeeId, isSelected) => {
        const newSelected = new Set(selectedEmployees);
        if (isSelected) {
            newSelected.add(employeeId);
        } else {
            newSelected.delete(employeeId);
        }
        setSelectedEmployees(newSelected);
    };

    // Sorting
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Table columns
    const columns = [
        { uid: 'select', name: '#' },
        { uid: 'employee', name: 'Employee' },
        { uid: 'department', name: 'Department' },
        { uid: 'designation', name: 'Position' },
        { uid: 'contact', name: 'Contact' },
        { uid: 'employment', name: 'Employment' },
        { uid: 'performance', name: 'Performance' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((employee, columnKey) => {
        switch (columnKey) {
            case 'select':
                return (
                    <input
                        type="checkbox"
                        checked={selectedEmployees.has(employee.id)}
                        onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
                        className="w-4 h-4 rounded"
                    />
                );
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={employee.avatar}
                            name={employee.full_name}
                            size="sm"
                            className="shrink-0"
                        />
                        <div>
                            <p className="font-medium">{employee.full_name}</p>
                            <p className="text-xs text-default-500">#{employee.employee_id}</p>
                            <p className="text-xs text-default-500">Hired: {formatDate(employee.hire_date)}</p>
                        </div>
                    </div>
                );
            case 'department':
                return (
                    <div className="text-sm">
                        <div className="flex items-center gap-1">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            <span className="font-medium">{employee.department?.name || 'N/A'}</span>
                        </div>
                        {employee.manager && (
                            <p className="text-xs text-default-500 mt-1">Manager: {employee.manager.full_name}</p>
                        )}
                    </div>
                );
            case 'designation':
                return (
                    <div className="text-sm">
                        <div className="flex items-center gap-1">
                            <BriefcaseIcon className="w-4 h-4" />
                            <span className="font-medium">{employee.designation?.title || 'N/A'}</span>
                        </div>
                        <p className="text-xs text-default-500">Level: {employee.level || 'N/A'}</p>
                        <p className="text-xs text-default-500">Tenure: {calculateTenure(employee.hire_date)}</p>
                    </div>
                );
            case 'contact':
                return (
                    <div className="text-sm">
                        <div className="flex items-center gap-1 mb-1">
                            <EnvelopeIcon className="w-4 h-4" />
                            <span>{employee.email}</span>
                        </div>
                        {employee.phone && (
                            <div className="flex items-center gap-1">
                                <PhoneIcon className="w-4 h-4" />
                                <span>{employee.phone}</span>
                            </div>
                        )}
                    </div>
                );
            case 'employment':
                return (
                    <div className="text-sm">
                        <p className="font-medium">{employee.employment_type || 'Full-time'}</p>
                        {employee.salary && (
                            <p className="text-xs text-success">{formatSalary(employee.salary)}</p>
                        )}
                        <p className="text-xs text-default-500">Location: {employee.location || 'Office'}</p>
                    </div>
                );
            case 'performance':
                return (
                    <div className="text-sm">
                        {employee.performance_rating && (
                            <div className="flex items-center gap-1">
                                <Chip
                                    size="sm"
                                    color={getPerformanceColor(employee.performance_rating)}
                                    variant="flat"
                                >
                                    {employee.performance_rating}/5.0
                                </Chip>
                            </div>
                        )}
                        <p className="text-xs text-default-500 mt-1">
                            Last Review: {formatDate(employee.last_review_date)}
                        </p>
                    </div>
                );
            case 'status':
                return (
                    <div className="flex flex-col gap-1">
                        <Chip 
                            color={getStatusColor(employee.employment_status)} 
                            size="sm" 
                            variant="flat"
                        >
                            {employee.employment_status?.replace('_', ' ').toUpperCase()}
                        </Chip>
                        {employee.is_on_leave && (
                            <Chip size="sm" color="warning" variant="flat">
                                On Leave
                            </Chip>
                        )}
                    </div>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', employee)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canEditEmployees && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => router.visit(route('hrm.employees.edit', employee.id))}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                >
                                    <EllipsisVerticalIcon className="w-4 h-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Employee Actions">
                                <DropdownItem key="profile" startContent={<UserIcon className="w-4 h-4" />}>
                                    View Profile
                                </DropdownItem>
                                <DropdownItem key="performance" startContent={<ChartBarIcon className="w-4 h-4" />}>
                                    Performance Review
                                </DropdownItem>
                                <DropdownItem key="documents" startContent={<DocumentTextIcon className="w-4 h-4" />}>
                                    Documents
                                </DropdownItem>
                                {canDeleteEmployees && (
                                    <DropdownItem 
                                        key="delete" 
                                        className="text-danger" 
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => openModal('delete', employee)}
                                    >
                                        Delete
                                    </DropdownItem>
                                )}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return employee[columnKey] || '-';
        }
    }, [selectedEmployees, canEditEmployees, canDeleteEmployees]);

    return (
        <>
            <Head title={title} />
            
            {/* Delete Confirmation Modal */}
            {modalStates.delete && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Employee</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete <strong>"{selectedEmployee?.full_name}"</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will remove all associated data.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Employee</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Bulk Action Modal */}
            {modalStates.bulk_action && (
                <Modal isOpen={modalStates.bulk_action} onOpenChange={() => closeModal('bulk_action')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Bulk Action</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p className="mb-4">{selectedEmployees.size} employees selected</p>
                            <Select
                                label="Select Action"
                                placeholder="Choose an action"
                                selectedKeys={bulkAction ? [bulkAction] : []}
                                onSelectionChange={(keys) => setBulkAction(Array.from(keys)[0] || '')}
                                radius={themeRadius}
                            >
                                {bulkActions.map(action => (
                                    <SelectItem key={action.key}>
                                        {action.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('bulk_action')}>Cancel</Button>
                            <Button color="primary" onPress={handleBulkAction} isDisabled={!bulkAction}>
                                Execute Action
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Export Modal */}
            {modalStates.export && (
                <Modal isOpen={modalStates.export} onOpenChange={() => closeModal('export')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Export Employees</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <p>Export {selectedEmployees.size > 0 ? `${selectedEmployees.size} selected` : 'all'} employees</p>
                                <div className="flex gap-2">
                                    <Button color="primary" onPress={() => handleExport('excel')}>
                                        Export to Excel
                                    </Button>
                                    <Button color="secondary" onPress={() => handleExport('csv')}>
                                        Export to CSV
                                    </Button>
                                    <Button color="success" onPress={() => handleExport('pdf')}>
                                        Export to PDF
                                    </Button>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('export')}>Cancel</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content using StandardPageLayout */}
            <StandardPageLayout
                title="Employee Directory"
                subtitle="Comprehensive employee management and directory"
                icon={<UserGroupIcon />}
                actions={
                    <div className="flex gap-2 flex-wrap">
                        <Button 
                            color="secondary" 
                            variant="flat"
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            onPress={() => openModal('export')}
                            size={isMobile ? "sm" : "md"}
                        >
                            Export
                        </Button>
                        {selectedEmployees.size > 0 && (
                            <Button 
                                color="warning" 
                                variant="flat"
                                startContent={<Badge content={selectedEmployees.size} size="sm"><UserGroupIcon className="w-4 h-4" /></Badge>}
                                onPress={() => openModal('bulk_action')}
                                size={isMobile ? "sm" : "md"}
                            >
                                Bulk Actions
                            </Button>
                        )}
                        {canCreateEmployees && (
                            <Button 
                                color="primary" 
                                variant="shadow"
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('hrm.employees.create'))}
                                size={isMobile ? "sm" : "md"}
                            >
                                Add Employee
                            </Button>
                        )}
                    </div>
                }
                stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
                filters={
                    <ThemedCard>
                        <div className="p-4">
                            <div className="flex items-center justify-between w-full mb-4">
                                <h5 className="text-lg font-semibold">Filters & Search</h5>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={clearFilters}
                                    startContent={<XMarkIcon className="w-4 h-4" />}
                                >
                                    Clear
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {/* Primary Filters */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Input
                                        label="Search"
                                        placeholder="Name, email, ID..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                    />
                                    
                                    <Select
                                        placeholder="All Departments"
                                        selectedKeys={filters.department_id !== 'all' ? [filters.department_id] : []}
                                        onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || 'all')}
                                        size="sm"
                                    >
                                        <SelectItem key="all">All Departments</SelectItem>
                                        {departments.map(department => (
                                            <SelectItem key={department.id}>{department.name}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        placeholder="All Positions"
                                        selectedKeys={filters.designation_id !== 'all' ? [filters.designation_id] : []}
                                        onSelectionChange={(keys) => handleFilterChange('designation_id', Array.from(keys)[0] || 'all')}
                                        size="sm"
                                    >
                                        <SelectItem key="all">All Positions</SelectItem>
                                        {designations.map(designation => (
                                            <SelectItem key={designation.id}>{designation.title}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        placeholder="All Status"
                                        selectedKeys={filters.employment_status !== 'all' ? [filters.employment_status] : []}
                                        onSelectionChange={(keys) => handleFilterChange('employment_status', Array.from(keys)[0] || 'all')}
                                        size="sm"
                                    >
                                        <SelectItem key="all">All Status</SelectItem>
                                        {employmentStatuses.map(status => (
                                            <SelectItem key={status.key}>{status.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* Secondary Filters */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Select
                                        placeholder="All Salary Ranges"
                                        selectedKeys={filters.salary_range !== 'all' ? [filters.salary_range] : []}
                                        onSelectionChange={(keys) => handleFilterChange('salary_range', Array.from(keys)[0] || 'all')}
                                        size="sm"
                                    >
                                        <SelectItem key="all">All Salary Ranges</SelectItem>
                                        {salaryRanges.map(range => (
                                            <SelectItem key={range.key}>{range.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        placeholder="All Performance"
                                        selectedKeys={filters.performance_rating !== 'all' ? [filters.performance_rating] : []}
                                        onSelectionChange={(keys) => handleFilterChange('performance_rating', Array.from(keys)[0] || 'all')}
                                        size="sm"
                                    >
                                        <SelectItem key="all">All Performance</SelectItem>
                                        {performanceRatings.map(rating => (
                                            <SelectItem key={rating.key}>{rating.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <div className="flex gap-2">
                                        <Input
                                            label="Hired After"
                                            type="date"
                                            value={filters.hire_date_from}
                                            onChange={(e) => handleFilterChange('hire_date_from', e.target.value)}
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        <Input
                                            label="Hired Before"
                                            type="date"
                                            value={filters.hire_date_to}
                                            onChange={(e) => handleFilterChange('hire_date_to', e.target.value)}
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ThemedCard>
                }
                pagination={
                    pagination.total > pagination.perPage ? (
                        <div className="flex justify-center">
                            <Pagination
                                total={pagination.lastPage}
                                page={pagination.currentPage}
                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                showControls
                                showShadow
                                color="primary"
                                size={isMobile ? "sm" : "md"}
                            />
                        </div>
                    ) : null
                }
                ariaLabel="Employee Management"
            >
                {/* Selection Summary */}
                {selectedEmployees.size > 0 && (
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {selectedEmployees.size} employee{selectedEmployees.size !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setSelectedEmployees(new Set())}
                        >
                            Clear Selection
                        </Button>
                    </div>
                )}
                
                <Table 
                    aria-label="Employee Directory" 
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                    sortDescriptor={{
                        column: sortConfig.key,
                        direction: sortConfig.direction
                    }}
                    onSortChange={(sort) => {
                        handleSort(sort.column);
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn 
                                key={column.uid} 
                                allowsSorting={column.uid !== 'select' && column.uid !== 'actions'}
                            >
                                {column.uid === 'select' ? (
                                    <input
                                        type="checkbox"
                                        checked={employees.length > 0 && selectedEmployees.size === employees.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                ) : column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        items={employees} 
                        emptyContent={loading ? "Loading..." : "No employees found"}
                        isLoading={loading}
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </StandardPageLayout>
        </>
    );
};

EmployeeList.layout = (page) => <App children={page} />;
export default EmployeeList;