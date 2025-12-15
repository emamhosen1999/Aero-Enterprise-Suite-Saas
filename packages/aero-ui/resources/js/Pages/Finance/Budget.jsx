import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import App from '@/Layouts/App';
import { 
    Table, 
    TableHeader, 
    TableColumn, 
    TableBody, 
    TableRow, 
    TableCell,
    Button,
    Input,
    Select,
    SelectItem,
    Chip,
    Progress,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Card,
    CardBody
} from "@heroui/react";
import { 
    MagnifyingGlassIcon, 
    PlusIcon,
    EllipsisVerticalIcon,
    ArrowDownTrayIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Budget = ({ auth, budgets = [], departments = [] }) => {
    // Similar responsive and theme setup as FixedAssets
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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

    const themeRadius = useMemo(() => getThemeRadius(), []);

    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.user?.is_super_admin;
    };

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        department: 'all',
        period: 'all',
        status: 'all'
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0
    });

    // Mock data
    const mockBudgets = budgets.length > 0 ? budgets : [
        { id: 1, name: 'Q1 2024 Marketing Budget', department: 'Marketing', period: 'Q1 2024', amount: 50000, spent: 32500, status: 'active', variance: -17500, variance_percent: -35 },
        { id: 2, name: 'Annual IT Infrastructure', department: 'IT', period: 'FY 2024', amount: 150000, spent: 145000, status: 'active', variance: -5000, variance_percent: -3.33 },
        { id: 3, name: 'HR Training & Development', department: 'HR', period: 'FY 2024', amount: 30000, spent: 28500, status: 'active', variance: -1500, variance_percent: -5 },
        { id: 4, name: 'Operations Equipment', department: 'Operations', period: 'Q2 2024', amount: 80000, spent: 62000, status: 'active', variance: -18000, variance_percent: -22.5 },
        { id: 5, name: 'Sales Commission Pool', department: 'Sales', period: 'Q1 2024', amount: 100000, spent: 105000, status: 'active', variance: 5000, variance_percent: 5 },
        { id: 6, name: 'Facilities Maintenance', department: 'Facilities', period: 'Q1 2024', amount: 25000, spent: 25000, status: 'closed', variance: 0, variance_percent: 0 }
    ];

    const mockDepartments = departments.length > 0 ? departments : [
        { id: 1, name: 'Marketing' },
        { id: 2, name: 'IT' },
        { id: 3, name: 'HR' },
        { id: 4, name: 'Operations' },
        { id: 5, name: 'Sales' },
        { id: 6, name: 'Facilities' }
    ];

    // Filtered data
    const filteredBudgets = useMemo(() => {
        return mockBudgets.filter(budget => {
            const matchesSearch = !filters.search || 
                budget.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                budget.department.toLowerCase().includes(filters.search.toLowerCase());
            const matchesDepartment = filters.department === 'all' || budget.department === filters.department;
            const matchesPeriod = filters.period === 'all' || budget.period === filters.period;
            const matchesStatus = filters.status === 'all' || budget.status === filters.status;
            return matchesSearch && matchesDepartment && matchesPeriod && matchesStatus;
        });
    }, [mockBudgets, filters]);

    const paginatedBudgets = useMemo(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.perPage;
        return filteredBudgets.slice(startIndex, startIndex + pagination.perPage);
    }, [filteredBudgets, pagination]);

    const totalPages = Math.ceil(filteredBudgets.length / pagination.perPage);

    // Status color map
    const statusColorMap = {
        draft: 'default',
        active: 'success',
        closed: 'default',
        exceeded: 'danger'
    };

    // Summary stats
    const summaryStats = useMemo(() => {
        const totalBudget = mockBudgets.reduce((sum, b) => sum + b.amount, 0);
        const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent, 0);
        const activeCount = mockBudgets.filter(b => b.status === 'active').length;
        
        return {
            totalBudget,
            totalSpent,
            activeCount,
            utilization: (totalSpent / totalBudget) * 100
        };
    }, [mockBudgets]);

    // Handlers
    const handleSearchChange = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Columns
    const columns = [
        { uid: 'name', name: 'Budget Name' },
        { uid: 'department', name: 'Department' },
        { uid: 'period', name: 'Period' },
        { uid: 'amount', name: 'Budgeted' },
        { uid: 'spent', name: 'Spent' },
        { uid: 'variance', name: 'Variance' },
        { uid: 'progress', name: 'Utilization' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' }
    ];

    const renderCell = (budget, columnKey) => {
        switch (columnKey) {
            case 'name':
                return <span className="font-semibold">{budget.name}</span>;
            case 'department':
                return <span>{budget.department}</span>;
            case 'period':
                return <span>{budget.period}</span>;
            case 'amount':
                return <span className="font-semibold">${budget.amount.toLocaleString()}</span>;
            case 'spent':
                return <span>${budget.spent.toLocaleString()}</span>;
            case 'variance':
                const isOverBudget = budget.variance > 0;
                return (
                    <div className="flex items-center gap-1">
                        {isOverBudget ? (
                            <XCircleIcon className="w-4 h-4 text-danger" />
                        ) : (
                            <CheckCircleIcon className="w-4 h-4 text-success" />
                        )}
                        <span className={isOverBudget ? 'text-danger' : 'text-success'}>
                            {isOverBudget ? '+' : ''}{budget.variance_percent.toFixed(1)}%
                        </span>
                    </div>
                );
            case 'progress':
                const utilizationPercent = (budget.spent / budget.amount) * 100;
                return (
                    <Progress
                        value={utilizationPercent}
                        color={utilizationPercent > 100 ? 'danger' : utilizationPercent > 90 ? 'warning' : 'success'}
                        size="sm"
                        className="max-w-md"
                        showValueLabel
                    />
                );
            case 'status':
                return (
                    <Chip color={statusColorMap[budget.status]} size="sm" variant="flat">
                        {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
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
                        <DropdownMenu aria-label="Budget actions">
                            {hasPermission('finance.budget.edit') && (
                                <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}>
                                    Edit
                                </DropdownItem>
                            )}
                            <DropdownItem key="view">View Details</DropdownItem>
                            <DropdownItem key="report">Generate Report</DropdownItem>
                            {hasPermission('finance.budget.delete') && (
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />}>
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return budget[columnKey];
        }
    };

    return (
        <App user={auth.user}>
            <Head title="Budget Management" />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6"
            >
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Budget Management</h1>
                        <p className="text-sm text-default-500 mt-1">Track budgets and analyze variances</p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('finance.budget.export') && (
                            <Button
                                color="default"
                                variant="flat"
                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                radius={themeRadius}
                            >
                                Export
                            </Button>
                        )}
                        {hasPermission('finance.budget.create') && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                                radius={themeRadius}
                            >
                                Create Budget
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-500">Total Budgeted</p>
                            <p className="text-2xl font-bold">${summaryStats.totalBudget.toLocaleString()}</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-500">Total Spent</p>
                            <p className="text-2xl font-bold">${summaryStats.totalSpent.toLocaleString()}</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-500">Utilization</p>
                            <p className="text-2xl font-bold">{summaryStats.utilization.toFixed(1)}%</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-500">Active Budgets</p>
                            <p className="text-2xl font-bold">{summaryStats.activeCount}</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="Search budgets..."
                        value={filters.search}
                        onValueChange={handleSearchChange}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="sm:w-64"
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />
                    <Select
                        placeholder="All Departments"
                        selectedKeys={filters.department !== 'all' ? [filters.department] : []}
                        onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0] || 'all')}
                        className="sm:w-48"
                        radius={themeRadius}
                        classNames={{ trigger: "bg-default-100" }}
                    >
                        <SelectItem key="all">All Departments</SelectItem>
                        {mockDepartments.map(dept => (
                            <SelectItem key={dept.name}>{dept.name}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Status"
                        selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                        onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                        className="sm:w-40"
                        radius={themeRadius}
                        classNames={{ trigger: "bg-default-100" }}
                    >
                        <SelectItem key="all">All Status</SelectItem>
                        <SelectItem key="draft">Draft</SelectItem>
                        <SelectItem key="active">Active</SelectItem>
                        <SelectItem key="closed">Closed</SelectItem>
                    </Select>
                </div>

                {/* Table */}
                <Table
                    aria-label="Budgets table"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={paginatedBudgets} emptyContent="No budgets found">
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={totalPages}
                            page={pagination.currentPage}
                            onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                            showControls
                            radius={themeRadius}
                        />
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default Budget;
