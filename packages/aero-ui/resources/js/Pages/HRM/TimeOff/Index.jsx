import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Button, 
    Card, 
    CardBody, 
    CardHeader, 
    Input, 
    Select, 
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tabs,
    Tab
} from "@heroui/react";
import { 
    CalendarDaysIcon,
    ClockIcon,
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const TimeOffIndex = ({ title, timeOffRequests: initialRequests, employees: initialEmployees }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, hasAccess } = useHRMAC();
    
    // Responsive breakpoints
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

    // State management
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [timeOffRequests, setTimeOffRequests] = useState(initialRequests || []);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [activeTab, setActiveTab] = useState('pending');
    const [filters, setFilters] = useState({ search: '', employee: 'all', type: 'all', status: 'all' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0 });
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalDays: 0 });

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Pending Requests", 
            value: stats.pending, 
            icon: <ClockIcon className="w-5 h-5" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Approved", 
            value: stats.approved, 
            icon: <CalendarDaysIcon className="w-5 h-5" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Rejected", 
            value: stats.rejected, 
            icon: <CalendarDaysIcon className="w-5 h-5" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Total Days", 
            value: stats.totalDays, 
            icon: <UserGroupIcon className="w-5 h-5" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        }
    ], [stats]);

    // Permission checks
    const canCreateRequest = canCreate && hasAccess('hrm.time-off.create');
    const canApproveRequests = canUpdate && hasAccess('hrm.time-off.approve');

    // Fetch time off requests
    const fetchTimeOffRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.time-off.index'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setTimeOffRequests(response.data.requests || []);
                setStats(response.data.stats || { pending: 0, approved: 0, rejected: 0, totalDays: 0 });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch time off requests' });
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }, [filters, pagination]);

    useEffect(() => { fetchTimeOffRequests(); }, [fetchTimeOffRequests]);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Render status chip
    const renderStatus = useCallback((status) => {
        const colorMap = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'cancelled': 'default'
        };
        return <Chip color={colorMap[status] || 'default'} size="sm">{status}</Chip>;
    }, []);

    // Table columns
    const columns = useMemo(() => [
        { uid: 'employee', name: 'Employee' },
        { uid: 'type', name: 'Type' },
        { uid: 'start_date', name: 'Start Date' },
        { uid: 'end_date', name: 'End Date' },
        { uid: 'days', name: 'Days' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' }
    ], []);

    // Render table cell
    const renderCell = useCallback((request, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return request.employee?.name || '-';
            case 'type':
                return request.leave_type || request.type || '-';
            case 'start_date':
                return new Date(request.start_date).toLocaleDateString();
            case 'end_date':
                return new Date(request.end_date).toLocaleDateString();
            case 'days':
                return <Chip variant="flat">{request.total_days || request.days || 0}</Chip>;
            case 'status':
                return renderStatus(request.status);
            case 'actions':
                return (
                    <div className="flex gap-2">
                        {canApproveRequests && request.status === 'pending' && (
                            <>
                                <Button size="sm" color="success" variant="flat">
                                    Approve
                                </Button>
                                <Button size="sm" color="danger" variant="flat">
                                    Reject
                                </Button>
                            </>
                        )}
                    </div>
                );
            default:
                return request[columnKey] || '-';
        }
    }, [canApproveRequests, renderStatus]);

    return (
        <>
            <Head title={title} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Time Off Management">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                {/* Card Header */}
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CalendarDaysIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Time Off Management
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage employee time off requests and approvals
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateRequest && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        New Request
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search requests..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            label="Employee"
                                            placeholder="All Employees"
                                            selectedKeys={filters.employee !== 'all' ? [filters.employee] : []}
                                            onSelectionChange={(keys) => handleFilterChange('employee', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Employees</SelectItem>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Status"
                                            placeholder="All Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="pending">Pending</SelectItem>
                                            <SelectItem key="approved">Approved</SelectItem>
                                            <SelectItem key="rejected">Rejected</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Tabs for different views */}
                                    <Tabs 
                                        selectedKey={activeTab}
                                        onSelectionChange={setActiveTab}
                                        className="mb-6"
                                    >
                                        <Tab key="pending" title="Pending">
                                            <Table
                                                aria-label="Pending requests table"
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
                                                <TableBody items={timeOffRequests.filter(r => r.status === 'pending')} emptyContent="No pending requests">
                                                    {(request) => (
                                                        <TableRow key={request.id}>
                                                            {(columnKey) => <TableCell>{renderCell(request, columnKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </Tab>

                                        <Tab key="all" title="All Requests">
                                            <Table
                                                aria-label="All requests table"
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
                                                <TableBody items={timeOffRequests} emptyContent="No requests found">
                                                    {(request) => (
                                                        <TableRow key={request.id}>
                                                            {(columnKey) => <TableCell>{renderCell(request, columnKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </Tab>
                                    </Tabs>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

TimeOffIndex.layout = (page) => <App children={page} />;
export default TimeOffIndex;