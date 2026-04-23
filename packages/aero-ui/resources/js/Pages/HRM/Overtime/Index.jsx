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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Skeleton,
    Textarea,
} from "@heroui/react";
import {
    ClockIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    CheckIcon,
    XMarkIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const OvertimeIndex = ({ title, stats: initialStats }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();

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

    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(initialStats || {});
    const [filters, setFilters] = useState({ search: '', status: '', overtime_type: '', from_date: '', to_date: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [modalOpen, setModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const [formData, setFormData] = useState({
        employee_id: '',
        date: '',
        start_time: '',
        end_time: '',
        hours: '',
        overtime_type: 'weekday',
        reason: '',
        task_description: '',
    });
    const [formLoading, setFormLoading] = useState(false);

    const statsData = useMemo(() => [
        { title: "This Month", value: stats.total_this_month || 0, icon: <CalendarIcon className="w-5 h-5" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending Approval", value: stats.pending_approval || 0, icon: <ClockIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Approved", value: stats.approved || 0, icon: <CheckIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Total Hours", value: stats.total_hours_this_month || 0, icon: <ClockIcon className="w-5 h-5" />, color: "text-secondary", iconBg: "bg-secondary/20", suffix: "hrs" },
        { title: "Uncompensated", value: stats.uncompensated || 0, icon: <CurrencyDollarIcon className="w-5 h-5" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    // Permissions using HRMAC
    const canApproveOvertime = canUpdate('hrm.overtime') || isSuperAdmin();
    const canCreateOvertime = canCreate('hrm.overtime') || isSuperAdmin();

    // Handle Request Overtime form submission
    const handleOvertimeSubmit = async () => {
        if (!formData.date || !formData.hours || !formData.overtime_type || !formData.reason) {
            showToast.promise(
                Promise.reject(['Please fill in all required fields']),
                {
                    loading: 'Validating form...',
                    success: () => 'Form validated',
                    error: (data) => Array.isArray(data) ? data.join(', ') : data,
                }
            );
            return;
        }

        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.overtime.store'), formData);
                if (response.status === 200) {
                    setModalOpen(false);
                    setFormData({
                        employee_id: '',
                        date: '',
                        start_time: '',
                        end_time: '',
                        hours: '',
                        overtime_type: 'weekday',
                        reason: '',
                        task_description: '',
                    });
                    fetchRecords();
                    fetchStats();
                    resolve([response.data.message || 'Overtime request submitted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to submit overtime request']);
            } finally {
                setFormLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Submitting overtime request...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };
    const canDeleteOvertime = canDelete('hrm.overtime') || isSuperAdmin();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.overtime.paginate'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setRecords(response.data.records || []);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (error) {
            showToast.error('Failed to fetch overtime records');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.overtime.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchStats(); }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleApprove = async (id) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.overtime.approve', id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Approved']);
                    fetchData();
                    fetchStats();
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to approve');
            }
        });
        showToast.promise(promise, { loading: 'Approving...', success: (d) => d.join(', '), error: (d) => d });
    };

    const handleReject = async () => {
        if (!selectedRecord || !rejectionReason) return;
        setFormLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.overtime.reject', selectedRecord.id), { rejection_reason: rejectionReason });
                if (response.status === 200) {
                    resolve([response.data.message || 'Rejected']);
                    setRejectModalOpen(false);
                    setRejectionReason('');
                    fetchData();
                    fetchStats();
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to reject');
            } finally {
                setFormLoading(false);
            }
        });
        showToast.promise(promise, { loading: 'Rejecting...', success: (d) => d.join(', '), error: (d) => d });
    };

    const openRejectModal = (record) => {
        setSelectedRecord(record);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const statusColorMap = { pending: 'warning', approved: 'success', rejected: 'danger' };
    const typeColorMap = { weekday: 'primary', weekend: 'secondary', holiday: 'success', night: 'warning', emergency: 'danger' };

    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'date', name: 'Date' },
        { uid: 'type', name: 'Type' },
        { uid: 'hours', name: 'Hours' },
        { uid: 'reason', name: 'Reason' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{item.employee?.first_name} {item.employee?.last_name}</p>
                            <p className="text-xs text-default-500">{item.employee?.department?.name}</p>
                        </div>
                    </div>
                );
            case 'date':
                return <span>{new Date(item.date).toLocaleDateString()}</span>;
            case 'type':
                return <Chip size="sm" color={typeColorMap[item.overtime_type]} variant="flat">{item.overtime_type}</Chip>;
            case 'hours':
                return <span className="font-semibold">{item.hours} hrs</span>;
            case 'reason':
                return <span className="text-default-600 text-sm truncate max-w-[200px]">{item.reason}</span>;
            case 'status':
                return <Chip size="sm" color={statusColorMap[item.status]} variant="flat">{item.status}</Chip>;
            case 'actions':
                if (item.status !== 'pending' || !canApproveOvertime) return null;
                return (
                    <div className="flex gap-1">
                        <Button size="sm" color="success" variant="flat" isIconOnly onPress={() => handleApprove(item.id)}>
                            <CheckIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" color="danger" variant="flat" isIconOnly onPress={() => openRejectModal(item)}>
                            <XMarkIcon className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return item[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            {/* Reject Modal */}
            <Modal isOpen={rejectModalOpen} onOpenChange={setRejectModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>Reject Overtime Request</ModalHeader>
                    <ModalBody>
                        <Textarea
                            label="Rejection Reason"
                            placeholder="Enter reason for rejection"
                            value={rejectionReason}
                            onValueChange={setRejectionReason}
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button color="danger" onPress={handleReject} isLoading={formLoading}>Reject</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Request Overtime Modal */}
            <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">Request Overtime</h2>
                        <p className="text-sm text-default-500">Submit a new overtime request for approval</p>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                type="date"
                                label="Date"
                                placeholder="Select date"
                                value={formData.date}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Select
                                label="Overtime Type"
                                placeholder="Select overtime type"
                                selectedKeys={formData.overtime_type ? [formData.overtime_type] : []}
                                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, overtime_type: Array.from(keys)[0] }))}
                                isRequired
                                radius={themeRadius}
                            >
                                <SelectItem key="weekday">Weekday</SelectItem>
                                <SelectItem key="weekend">Weekend</SelectItem>
                                <SelectItem key="holiday">Holiday</SelectItem>
                                <SelectItem key="night">Night</SelectItem>
                                <SelectItem key="emergency">Emergency</SelectItem>
                            </Select>
                            
                            <Input
                                type="time"
                                label="Start Time"
                                placeholder="Select start time"
                                value={formData.start_time}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Input
                                type="time"
                                label="End Time"
                                placeholder="Select end time"
                                value={formData.end_time}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, end_time: value }))}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Input
                                type="number"
                                label="Hours"
                                placeholder="Enter hours worked"
                                value={formData.hours}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, hours: value }))}
                                isRequired
                                min="0"
                                step="0.5"
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </div>
                        
                        <div className="mt-4 space-y-4">
                            <Textarea
                                label="Reason"
                                placeholder="Please provide a reason for this overtime request"
                                value={formData.reason}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                                isRequired
                                rows={3}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            
                            <Textarea
                                label="Task Description"
                                placeholder="Describe the tasks to be performed during overtime (optional)"
                                value={formData.task_description}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, task_description: value }))}
                                rows={2}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={handleOvertimeSubmit}
                            isLoading={formLoading}
                            startContent={!formLoading && <PlusIcon className="w-4 h-4" />}
                        >
                            {formLoading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title="Overtime Management"
                subtitle="Track and approve overtime requests"
                icon={<ClockIcon />}
                actions={
                    canCreateOvertime && (
                        <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} onPress={() => setModalOpen(true)} size={isMobile ? "sm" : "md"}>
                            Request Overtime
                        </Button>
                    )
                }
                stats={<StatsCards stats={statsData} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                            <Input placeholder="Search employees..." value={filters.search} onValueChange={(v) => handleFilterChange('search', v)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} className="sm:max-w-xs" radius={themeRadius} />
                        <Select placeholder="All Statuses" selectedKeys={filters.status ? [filters.status] : []}
                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')} className="sm:max-w-xs" radius={themeRadius}>
                                        <SelectItem key="pending">Pending</SelectItem>
                                        <SelectItem key="approved">Approved</SelectItem>
                                        <SelectItem key="rejected">Rejected</SelectItem>
                                    </Select>
                        <Select placeholder="All Types" selectedKeys={filters.overtime_type ? [filters.overtime_type] : []}
                            onSelectionChange={(keys) => handleFilterChange('overtime_type', Array.from(keys)[0] || '')} className="sm:max-w-xs" radius={themeRadius}>
                            <SelectItem key="weekday">Weekday</SelectItem>
                            <SelectItem key="weekend">Weekend</SelectItem>
                            <SelectItem key="holiday">Holiday</SelectItem>
                            <SelectItem key="night">Night</SelectItem>
                            <SelectItem key="emergency">Emergency</SelectItem>
                        </Select>
                    </div>
                }
                ariaLabel="Overtime Management"
            >
                {loading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="flex gap-4">
                                                <Skeleton className="h-12 w-12 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-3/4 rounded" />
                                                    <Skeleton className="h-3 w-1/2 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Table aria-label="Overtime Records" classNames={{ wrapper: "shadow-none border border-divider rounded-lg", th: "bg-default-100", td: "py-3" }}>
                                        <TableHeader columns={columns}>
                                            {(column) => <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>{column.name}</TableColumn>}
                                        </TableHeader>
                                        <TableBody items={records} emptyContent="No overtime records found">
                                            {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
                                        </TableBody>
                                    </Table>
                                )}

                {pagination.lastPage > 1 && (
                    <div className="flex justify-center mt-6">
                        <Pagination total={pagination.lastPage} page={pagination.currentPage}
                            onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))} showControls />
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

OvertimeIndex.layout = (page) => <App children={page} />;
export default OvertimeIndex;
