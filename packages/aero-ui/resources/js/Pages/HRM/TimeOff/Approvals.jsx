import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
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
    Avatar,
    Tabs,
    Tab
} from "@heroui/react";
import { 
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UserIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const TimeOffApprovals = ({ title, pendingRequests: initialRequests, employees: initialEmployees }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canUpdate, canDelete, hasAccess } = useHRMAC();
    
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
    const [requests, setRequests] = useState(initialRequests || []);
    const [employees, setEmployees] = useState(initialEmployees || []);
    const [activeTab, setActiveTab] = useState('pending');
    const [filters, setFilters] = useState({ search: '', employee: 'all', type: 'all', priority: 'all' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0 });
    const [stats, setStats] = useState({ pending: 0, urgent: 0, overdue: 0, approved: 0 });
    const [processingActions, setProcessingActions] = useState(new Set());

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Pending Approval", 
            value: stats.pending, 
            icon: <ClockIcon className="w-5 h-5" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Urgent", 
            value: stats.urgent, 
            icon: <ClockIcon className="w-5 h-5" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Overdue", 
            value: stats.overdue, 
            icon: <XCircleIcon className="w-5 h-5" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Approved Today", 
            value: stats.approved, 
            icon: <CheckCircleIcon className="w-5 h-5" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        }
    ], [stats]);

    // Permission checks
    const canApprove = canUpdate && hasAccess('hrm.time-off.approve');
    const canReject = canDelete && hasAccess('hrm.time-off.reject');

    // Fetch approval requests
    const fetchApprovalRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.time-off.approvals'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setRequests(response.data.requests || []);
                setStats(response.data.stats || { pending: 0, urgent: 0, overdue: 0, approved: 0 });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch approval requests' });
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }, [filters, pagination]);

    useEffect(() => { fetchApprovalRequests(); }, [fetchApprovalRequests]);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Handle approval/rejection actions
    const handleApprovalAction = useCallback(async (requestId, action, reason = '') => {
        setProcessingActions(prev => new Set(prev.add(requestId)));
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route(`hrm.time-off.${action}`, requestId), {
                    reason: reason
                });
                if (response.status === 200) {
                    // Update the request in the local state
                    setRequests(prev => prev.map(req => 
                        req.id === requestId 
                            ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
                            : req
                    ));
                    resolve([response.data.message || `Request ${action}d successfully`]);
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${action} request`]);
            } finally {
                setProcessingActions(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(requestId);
                    return newSet;
                });
            }
        });

        showToast.promise(promise, {
            loading: `${action === 'approve' ? 'Approving' : 'Rejecting'} request...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
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

    // Render priority chip
    const renderPriority = useCallback((priority) => {
        const colorMap = {
            'low': 'default',
            'normal': 'primary',
            'high': 'warning',
            'urgent': 'danger'
        };
        return <Chip color={colorMap[priority] || 'default'} size="sm" variant="flat">{priority}</Chip>;
    }, []);

    // Table columns
    const columns = useMemo(() => [
        { uid: 'employee', name: 'Employee' },
        { uid: 'type', name: 'Type' },
        { uid: 'dates', name: 'Dates' },
        { uid: 'days', name: 'Days' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'submitted', name: 'Submitted' },
        { uid: 'actions', name: 'Actions' }
    ], []);

    // Render table cell
    const renderCell = useCallback((request, columnKey) => {
        const isProcessing = processingActions.has(request.id);
        
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar src={request.employee?.avatar} name={request.employee?.name} size="sm" />
                        <div>
                            <p className="font-semibold">{request.employee?.name}</p>
                            <p className="text-xs text-default-500">{request.employee?.department?.name}</p>
                        </div>
                    </div>
                );
            case 'type':
                return request.leave_type || request.type || '-';
            case 'dates':
                return (
                    <div>
                        <p className="text-sm">{new Date(request.start_date).toLocaleDateString()}</p>
                        <p className="text-xs text-default-500">to {new Date(request.end_date).toLocaleDateString()}</p>
                    </div>
                );
            case 'days':
                return <Chip variant="flat">{request.total_days || request.days || 0}</Chip>;
            case 'priority':
                return renderPriority(request.priority || 'normal');
            case 'submitted':
                return new Date(request.created_at).toLocaleDateString();
            case 'actions':
                return (
                    <div className="flex gap-2">
                        {canApprove && request.status === 'pending' && (
                            <Button 
                                size="sm" 
                                color="success" 
                                variant="flat"
                                isLoading={isProcessing}
                                onPress={() => handleApprovalAction(request.id, 'approve')}
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                Approve
                            </Button>
                        )}
                        {canReject && request.status === 'pending' && (
                            <Button 
                                size="sm" 
                                color="danger" 
                                variant="flat"
                                isLoading={isProcessing}
                                onPress={() => handleApprovalAction(request.id, 'reject')}
                            >
                                <XCircleIcon className="w-4 h-4" />
                                Reject
                            </Button>
                        )}
                    </div>
                );
            default:
                return request[columnKey] || '-';
        }
    }, [canApprove, canReject, processingActions, handleApprovalAction, renderPriority]);

    // Filter requests by tab
    const filteredRequests = useMemo(() => {
        switch (activeTab) {
            case 'pending':
                return requests.filter(r => r.status === 'pending');
            case 'urgent':
                return requests.filter(r => r.priority === 'urgent' || r.priority === 'high');
            case 'overdue':
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                return requests.filter(r => 
                    r.status === 'pending' && 
                    new Date(r.created_at) < threeDaysAgo
                );
            default:
                return requests;
        }
    }, [requests, activeTab]);

    return (
        <>
            <Head title={title} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Time Off Approvals">
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
                                                    <CheckCircleIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Time Off Approvals
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Review and approve employee time off requests
                                                    </p>
                                                </div>
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
                                            label="Priority"
                                            placeholder="All Priorities"
                                            selectedKeys={filters.priority !== 'all' ? [filters.priority] : []}
                                            onSelectionChange={(keys) => handleFilterChange('priority', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Priorities</SelectItem>
                                            <SelectItem key="urgent">Urgent</SelectItem>
                                            <SelectItem key="high">High</SelectItem>
                                            <SelectItem key="normal">Normal</SelectItem>
                                            <SelectItem key="low">Low</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Tabs for different views */}
                                    <Tabs 
                                        selectedKey={activeTab}
                                        onSelectionChange={setActiveTab}
                                        className="mb-6"
                                    >
                                        <Tab key="pending" title={`Pending (${stats.pending})`}>
                                            <Table
                                                aria-label="Pending approvals table"
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
                                                <TableBody items={filteredRequests} emptyContent="No pending requests">
                                                    {(request) => (
                                                        <TableRow key={request.id}>
                                                            {(columnKey) => <TableCell>{renderCell(request, columnKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </Tab>

                                        <Tab key="urgent" title={`Urgent (${stats.urgent})`}>
                                            <Table
                                                aria-label="Urgent approvals table"
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
                                                <TableBody items={filteredRequests} emptyContent="No urgent requests">
                                                    {(request) => (
                                                        <TableRow key={request.id}>
                                                            {(columnKey) => <TableCell>{renderCell(request, columnKey)}</TableCell>}
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </Tab>

                                        <Tab key="overdue" title={`Overdue (${stats.overdue})`}>
                                            <Table
                                                aria-label="Overdue approvals table"
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
                                                <TableBody items={filteredRequests} emptyContent="No overdue requests">
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

TimeOffApprovals.layout = (page) => <App children={page} />;
export default TimeOffApprovals;