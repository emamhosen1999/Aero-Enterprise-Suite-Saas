import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import {motion} from 'framer-motion';
import {Button, ButtonGroup, Card, CardBody, CardHeader, Input, Select, SelectItem, Spinner} from "@heroui/react";
import {
    AdjustmentsHorizontalIcon,
    CalendarDaysIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    PresentationChartLineIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import {MagnifyingGlassIcon} from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import LeaveEmployeeTable from '@/Tables/HRM/LeaveEmployeeTable.jsx';
import LeaveForm from '@/Forms/HRM/LeaveForm.jsx';
import DeleteLeaveForm from '@/Forms/HRM/DeleteLeaveForm.jsx';
import BulkLeaveModal from '@/Components/HRM/BulkLeave/BulkLeaveModal.jsx';
import BulkDeleteModal from '@/Components/HRM/BulkDelete/BulkDeleteModal.jsx';
import dayjs from 'dayjs';
import axios from 'axios';


const LeavesAdmin = ({ title, allUsers }) => {
    const { auth } = usePage().props;
    
    // Custom media queries
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

    // State management - Enhanced for admin view
    const [loading, setLoading] = useState(false);
    const [leavesData, setLeavesData] = useState([]);
    const [leaves, setLeaves] = useState();
    const [totalRows, setTotalRows] = useState(0);
    const [lastPage, setLastPage] = useState(0);
    const [currentLeave, setCurrentLeave] = useState();
    const [selectedLeavesForBulkDelete, setSelectedLeavesForBulkDelete] = useState([]);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);

    // Pagination
    const [pagination, setPagination] = useState({
        perPage: 30,
        currentPage: 1
    });

    // Table-level loading spinner
    const [tableLoading, setTableLoading] = useState(false);

    // Show/Hide advanced filters panel
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        employee: '',
        selectedMonth: dayjs().format('YYYY-MM'),
        status: [],
        leaveType: [],
        department: []
    });

    const handleFilterChange = useCallback((filterKey, filterValue) => {
        if (filterKey === 'year') {
            const year = Number(filterValue);
            if (year < 1900 || year > new Date().getFullYear()) {
                console.warn('Invalid year selected. Must be between 1900 and current year.');
                return;
            }
        }

        setFilters(prev => ({
            ...prev,
            [filterKey]: filterValue
        }));

        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    }, []);

    // Quick stats state
    const [leaveStats, setLeaveStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        totalDaysUsed: 0,
        totalDaysRemaining: 0
    });

    // Prepare stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Leaves",
            value: leaveStats.total,
            icon: <DocumentTextIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All leave requests"
        },
        {
            title: "Pending",
            value: leaveStats.pending,
            icon: <ClockIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Awaiting approval"
        },
        {
            title: "Approved",
            value: leaveStats.approved,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Approved requests"
        },
        {
            title: "Rejected",
            value: leaveStats.rejected,
            icon: <XCircleIcon />,
            color: "text-danger",
            iconBg: "bg-danger/20",
            description: "Rejected requests"
        },
        {
            title: "This Month",
            value: leaveStats.thisMonth,
            icon: <CalendarDaysIcon />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Current month"
        },
        {
            title: "This Week",
            value: leaveStats.thisWeek,
            icon: <CalendarIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Current week"
        }
    ], [leaveStats]);

    // Check permissions using new system
    const canManageLeaves = auth.permissions?.includes('leaves.view') || false;
    const canApproveLeaves = auth.permissions?.includes('leaves.approve') || false;
    const canCreateLeaves = auth.permissions?.includes('leaves.create') || false;
    const canEditLeaves = auth.permissions?.includes('leaves.update') || false;
    const canDeleteLeaves = auth.permissions?.includes('leaves.delete') || false;

    // Modal states
    const [modalStates, setModalStates] = useState({
        add_leave: false,
        edit_leave: false,
        delete_leave: false,
        bulk_leave: false,
        bulk_delete: false,
    });

    const leaveTableRef = useRef(null);

    const openModalNew = useCallback((modalType) => {
        setModalStates(prev => ({ ...prev, [modalType]: true }));
    }, []);

    const closeModal = useCallback((modalType) => {
        setModalStates(prev => ({ ...prev, [modalType]: false }));
        if (modalType === 'bulk_delete') {
            setSelectedLeavesForBulkDelete([]);
        }
    }, []);

    // Handle bulk delete
    const handleBulkDelete = useCallback((selectedLeaves) => {
        setSelectedLeavesForBulkDelete(selectedLeaves);
        setModalStates(prev => ({ ...prev, bulk_delete: true }));
    }, []);

    // Fetch stats
    const fetchLeavesStats = useCallback(async () => {
        try {
            const response = await axios.get(route('leaves.stats'));
            if (response.data.success) {
                setLeaveStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch leave stats:', error);
        }
    }, []);

    // Optimized data manipulation functions
    const addLeaveOptimized = useCallback((newLeave) => {
        setLeavesData(prevData => [newLeave, ...prevData]);
        setTotalRows(prev => prev + 1);
        fetchLeavesStats();
    }, [fetchLeavesStats]);

    const updateLeaveOptimized = useCallback((updatedLeave) => {
        setLeavesData(prevData => 
            prevData.map(leave => 
                leave.id === updatedLeave.id ? updatedLeave : leave
            )
        );
        fetchLeavesStats();
    }, [fetchLeavesStats]);

    const deleteLeaveOptimized = useCallback((leaveId) => {
        setLeavesData(prevData => prevData.filter(leave => leave.id !== leaveId));
        setTotalRows(prev => prev - 1);
        fetchLeavesStats();
    }, [fetchLeavesStats]);

    // Initialize component
    useEffect(() => {
        fetchLeavesStats();
    }, [fetchLeavesStats]);

    // Early return if no permissions
    if (!canManageLeaves) {
        return (
            <>
                <Head title={title} />
                <div className="flex flex-col w-full h-full p-4">
                    <Card className="max-w-md mx-auto mt-8">
                        <CardBody className="p-8 text-center">
                            <ExclamationTriangleIcon className="w-16 h-16 text-warning mx-auto mb-4" />
                            <h6 className="text-lg font-semibold mb-2">Access Denied</h6>
                            <p className="text-sm text-default-500">
                                You don't have permission to view leave management.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {modalStates.add_leave && (
                <LeaveForm
                    open={modalStates.add_leave}
                    closeModal={() => closeModal("add_leave")}
                    leavesData={leavesData}
                    setLeavesData={setLeavesData}
                    currentLeave={null}
                    allUsers={allUsers}
                    departments={departments}
                    setTotalRows={setTotalRows}
                    setLastPage={setLastPage}
                    setLeaves={setLeaves}
                    employee={filters.employee}
                    selectedMonth={filters.selectedMonth}
                    addLeaveOptimized={addLeaveOptimized}
                    fetchLeavesStats={fetchLeavesStats}
                />
            )}
            {modalStates.edit_leave && (
                <LeaveForm
                    open={modalStates.edit_leave}
                    closeModal={() => closeModal("edit_leave")}
                    leavesData={leavesData}
                    setLeavesData={setLeavesData}
                    currentLeave={currentLeave}
                    allUsers={allUsers}
                    departments={departments}
                    setTotalRows={setTotalRows}
                    setLastPage={setLastPage}
                    setLeaves={setLeaves}
                    employee={filters.employee}
                    selectedMonth={filters.selectedMonth}
                    updateLeaveOptimized={updateLeaveOptimized}
                    fetchLeavesStats={fetchLeavesStats}
                />
            )}

            {modalStates.delete_leave && (
                <DeleteLeaveForm
                    open={modalStates.delete_leave}
                    closeModal={() => closeModal("delete_leave")}
                    leaveId={currentLeave?.id}
                    setLeaves={setLeaves}
                    setTotalRows={setTotalRows}
                    setLastPage={setLastPage}
                    deleteLeaveOptimized={deleteLeaveOptimized}
                    fetchLeavesStats={fetchLeavesStats}
                />
            )}

            {modalStates.bulk_leave && (
                <BulkLeaveModal
                    open={modalStates.bulk_leave}
                    onClose={() => closeModal("bulk_leave")}
                    onSuccess={(responseData) => {
                        // Handle bulk add success
                        fetchLeavesStats();
                    }}
                    allUsers={allUsers}
                    departments={departments}
                    leavesData={leavesData}
                    isAdmin={true}
                />
            )}

            {modalStates.bulk_delete && (
                <BulkDeleteModal
                    open={modalStates.bulk_delete}
                    onClose={() => closeModal("bulk_delete")}
                    onSuccess={(responseData) => {
                        // Handle bulk delete success
                        fetchLeavesStats();
                    }}
                    selectedLeaves={selectedLeavesForBulkDelete}
                    allUsers={allUsers}
                />
            )}
            
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Leave Management"
            >
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
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
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`
                                                            ${!isMobile ? 'p-3' : 'p-2'} 
                                                            rounded-xl flex items-center justify-center
                                                        `}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <PresentationChartLineIcon 
                                                            className={`
                                                                ${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}
                                                            `}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 
                                                            className={`
                                                                ${!isMobile ? 'text-2xl' : 'text-xl'}
                                                                font-bold text-foreground
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Leave Management
                                                        </h4>
                                                        <p 
                                                            className={`
                                                                ${!isMobile ? 'text-sm' : 'text-xs'} 
                                                                text-default-500
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Manage employee leave requests and approvals
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex gap-2 flex-wrap">
                                                    {canCreateLeaves && (
                                                        <Button
                                                            color="primary"
                                                            variant="shadow"
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={() => openModalNew('add_leave')}
                                                            size={isMobile ? "sm" : "md"}
                                                            className="font-semibold"
                                                            style={{
                                                                borderRadius: `var(--borderRadius, 8px)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Add Leave
                                                        </Button>
                                                    )}
                                                    {canCreateLeaves && (
                                                        <Button
                                                            color="secondary"
                                                            variant="flat"
                                                            startContent={<CalendarIcon className="w-4 h-4" />}
                                                            onPress={() => openModalNew('bulk_leave')}
                                                            size={isMobile ? "sm" : "md"}
                                                            className="font-semibold"
                                                            style={{
                                                                borderRadius: `var(--borderRadius, 8px)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Bulk Add
                                                        </Button>
                                                    )}
                                                    <Button
                                                        color="default"
                                                        variant="bordered"
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                        size={isMobile ? "sm" : "md"}
                                                        className="font-semibold"
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Export
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    {/* Filters Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <div className="flex-1">
                                            <Input
                                                label="Search Employee"
                                                placeholder="Search by name or ID..."
                                                value={filters.employee}
                                                onChange={(e) => handleFilterChange('employee', e.target.value)}
                                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                variant="bordered"
                                                size={isMobile ? "sm" : "md"}
                                                className="w-full"
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex gap-2 items-end">
                                            <ButtonGroup variant="bordered">
                                                <Button
                                                    isIconOnly={isMobile}
                                                    color={showFilters ? 'primary' : 'default'}
                                                    onPress={() => setShowFilters(!showFilters)}
                                                    style={{
                                                        borderRadius: `var(--borderRadius, 8px)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                                    {!isMobile && <span className="ml-1">Filters</span>}
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    </div>
                                    
                                    {showFilters && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="mb-6 p-4 rounded-lg border border-divider">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Select
                                                        label="Leave Status"
                                                        placeholder="Select status..."
                                                        selectionMode="multiple"
                                                        selectedKeys={new Set(filters.status)}
                                                        onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys))}
                                                        variant="bordered"
                                                        size={isMobile ? "sm" : "md"}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        <SelectItem key="pending" value="pending">Pending</SelectItem>
                                                        <SelectItem key="approved" value="approved">Approved</SelectItem>
                                                        <SelectItem key="rejected" value="rejected">Rejected</SelectItem>
                                                        <SelectItem key="new" value="new">New</SelectItem>
                                                    </Select>

                                                    <Select
                                                        label="Leave Type"
                                                        placeholder="Select type..."
                                                        selectionMode="multiple"
                                                        selectedKeys={new Set(filters.leaveType)}
                                                        onSelectionChange={(keys) => handleFilterChange('leaveType', Array.from(keys))}
                                                        variant="bordered"
                                                        size={isMobile ? "sm" : "md"}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        <SelectItem key="sick" value="sick">Sick Leave</SelectItem>
                                                        <SelectItem key="annual" value="annual">Annual Leave</SelectItem>
                                                        <SelectItem key="personal" value="personal">Personal Leave</SelectItem>
                                                        <SelectItem key="maternity" value="maternity">Maternity Leave</SelectItem>
                                                    </Select>

                                                    <Input
                                                        label="Month/Year"
                                                        type="month"
                                                        value={filters.selectedMonth}
                                                        onChange={(e) => handleFilterChange('selectedMonth', e.target.value)}
                                                        startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                                                        variant="bordered"
                                                        size={isMobile ? "sm" : "md"}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Table Section */}
                                    <Card 
                                        className="transition-all duration-200"
                                        style={{
                                            border: `var(--borderWidth, 2px) solid transparent`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                            background: `linear-gradient(135deg, 
                                                var(--theme-content1, #FAFAFA) 20%, 
                                                var(--theme-content2, #F4F4F5) 10%, 
                                                var(--theme-content3, #F1F3F4) 20%)`,
                                        }}
                                    >
                                        <CardHeader 
                                            className="border-b pb-2"
                                            style={{
                                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="p-2 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                    }}
                                                >
                                                    <DocumentTextIcon 
                                                        className="w-6 h-6" 
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <h1 
                                                    className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground"
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Leave Records
                                                </h1>
                                            </div>
                                        </CardHeader>
                                        <CardBody>
                                            {loading ? (
                                                <div className="flex justify-center items-center py-8">
                                                    <Spinner size="lg" />
                                                </div>
                                            ) : (
                                                <div className="max-h-[84vh] overflow-y-auto">
                                                    <LeaveEmployeeTable 
                                                        ref={leaveTableRef}
                                                        filterData={filters}
                                                        onEditLeave={(leave) => {
                                                            setCurrentLeave(leave);
                                                            openModalNew('edit_leave');
                                                        }}
                                                        onDeleteLeave={(leave) => {
                                                            setCurrentLeave(leave);
                                                            openModalNew('delete_leave');
                                                        }}
                                                        onBulkDelete={handleBulkDelete}
                                                        isAdmin={true}
                                                        canEdit={canEditLeaves}
                                                        canDelete={canDeleteLeaves}
                                                        canApprove={canApproveLeaves}
                                                    />
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

LeavesAdmin.layout = (page) => <App>{page}</App>;

export default LeavesAdmin;
