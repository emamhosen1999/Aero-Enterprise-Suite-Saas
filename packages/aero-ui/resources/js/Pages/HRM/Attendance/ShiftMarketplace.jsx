import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableBody,
    TableRow, TableCell, TableColumn, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Textarea, Radio, RadioGroup,
    Checkbox, Spinner, Tooltip, Badge
} from "@heroui/react";
import {
    PlusIcon, MagnifyingGlassIcon, CheckCircleIcon, ClockIcon, ListBulletIcon, CheckIcon,
    EllipsisVerticalIcon, TrashIcon, XMarkIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ShiftMarketplace = ({ title, listings, userSwaps, departments, filters: initialFilters }) => {
    const themeRadius = useThemeRadius();
    const { canPerformAction, isSuperAdmin } = useHRMAC();

    // Check specific HRMAC permissions
    const canView = canPerformAction('hrm', 'attendance', 'shift-marketplace', 'view') || isSuperAdmin();
    const canCreate = canPerformAction('hrm', 'attendance', 'shift-marketplace', 'create') || isSuperAdmin();
    const canApprove = canPerformAction('hrm', 'attendance', 'shift-marketplace', 'approve') || isSuperAdmin();
    const canReject = canPerformAction('hrm', 'attendance', 'shift-marketplace', 'reject') || isSuperAdmin();

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

    // Pagination & Filtering
    const [pagination, setPagination] = useState({
        currentPage: initialFilters?.page || listings?.current_page || 1,
        perPage: initialFilters?.per_page || listings?.per_page || 25,
        total: listings?.total || 0,
        lastPage: listings?.last_page || 1
    });

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        department: initialFilters?.department || 'all'
    });

    const [tableLoading, setTableLoading] = useState(false);
    const [currentListings, setCurrentListings] = useState(listings?.data || []);

    // Modal states
    const [modalStates, setModalStates] = useState({
        create: false,
        accept: false,
        reject: false,
        details: false
    });

    // Modal data
    const [selectedSwap, setSelectedSwap] = useState(null);
    const [userShifts, setUserShifts] = useState([]);

    // Form states
    const [createForm, setCreateForm] = useState({
        shift_schedule_id: '',
        request_type: 'open_pickup',
        acceptor_id: '',
        replacement_shift_id: '',
        reason: '',
        manager_approval_required: false
    });

    const [rejectForm, setRejectForm] = useState({
        rejection_reason: ''
    });

    const [acceptCheckbox, setAcceptCheckbox] = useState(false);

    // Calculate stats
    const statsData = useMemo(() => {
        const openCount = currentListings.filter(s => s.request_type === 'open_pickup' && s.status === 'open').length;
        const pendingCount = currentListings.filter(s => s.status === 'pending').length;
        const activeSwaps = userSwaps.filter(s => ['approved', 'completed'].includes(s.status)).length;

        return [
            {
                title: "Total Listings",
                value: pagination.total,
                icon: <ListBulletIcon />,
                color: "text-primary",
                iconBg: "bg-primary/20"
            },
            {
                title: "Open Pickups",
                value: openCount,
                icon: <CheckCircleIcon />,
                color: "text-success",
                iconBg: "bg-success/20"
            },
            {
                title: "Pending Approvals",
                value: pendingCount,
                icon: <ClockIcon />,
                color: "text-warning",
                iconBg: "bg-warning/20"
            },
            {
                title: "My Active Swaps",
                value: activeSwaps,
                icon: <CheckIcon />,
                color: "text-secondary",
                iconBg: "bg-secondary/20"
            }
        ];
    }, [currentListings, pagination.total, userSwaps]);

    // Modal handlers
    const openModal = useCallback((modalType, data = null) => {
        if (data) setSelectedSwap(data);
        setModalStates(prev => ({ ...prev, [modalType]: true }));
    }, []);

    const closeModal = useCallback((modalType) => {
        setModalStates(prev => ({ ...prev, [modalType]: false }));
        if (modalType === 'create') {
            setCreateForm({
                shift_schedule_id: '',
                request_type: 'open_pickup',
                acceptor_id: '',
                replacement_shift_id: '',
                reason: '',
                manager_approval_required: false
            });
        }
        if (modalType === 'accept') {
            setAcceptCheckbox(false);
        }
        if (modalType === 'reject') {
            setRejectForm({ rejection_reason: '' });
        }
        setSelectedSwap(null);
    }, []);

    // Fetch listings with filters
    const fetchListings = useCallback(async (page = 1, perPage = pagination.perPage) => {
        setTableLoading(true);
        try {
            const response = await axios.get(route('hrm.attendance.shift-marketplace.index'), {
                params: {
                    page,
                    per_page: perPage,
                    search: filters.search,
                    status: filters.status !== 'all' ? filters.status : undefined,
                    department: filters.department !== 'all' ? filters.department : undefined
                }
            });
            if (response.status === 200) {
                setCurrentListings(response.data.listings.data || []);
                setPagination({
                    currentPage: response.data.listings.current_page,
                    perPage: response.data.listings.per_page,
                    total: response.data.listings.total,
                    lastPage: response.data.listings.last_page
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: error.response?.data?.message || 'Failed to fetch listings'
            });
        } finally {
            setTableLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchListings(1);
    }, [filters]);

    // Handle filter changes
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Create shift swap request
    const handleCreateSwap = useCallback(async () => {
        if (!createForm.shift_schedule_id || !createForm.reason.trim()) {
            showToast.promise(Promise.reject({ error: 'Please fill in all required fields' }), {
                error: 'Validation error'
            });
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.attendance.shift-marketplace.store'), {
                    shift_schedule_id: createForm.shift_schedule_id,
                    request_type: createForm.request_type,
                    acceptor_id: createForm.acceptor_id || null,
                    replacement_shift_id: createForm.replacement_shift_id || null,
                    reason: createForm.reason,
                    manager_approval_required: createForm.manager_approval_required
                });
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Shift swap request created successfully']);
                    closeModal('create');
                    await fetchListings(1);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to create shift swap');
            }
        });

        showToast.promise(promise, {
            loading: 'Creating shift swap request...',
            success: (data) => data.join(', '),
            error: (err) => err
        });
    }, [createForm]);

    // Accept swap request
    const handleAcceptSwap = useCallback(async () => {
        if (!selectedSwap) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.attendance.shift-marketplace.accept'), {
                    shift_swap_request_id: selectedSwap.id
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Shift swap accepted successfully']);
                    closeModal('accept');
                    await fetchListings(pagination.currentPage);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to accept shift swap');
            }
        });

        showToast.promise(promise, {
            loading: 'Accepting shift swap...',
            success: (data) => data.join(', '),
            error: (err) => err
        });
    }, [selectedSwap, pagination.currentPage]);

    // Reject swap request
    const handleRejectSwap = useCallback(async () => {
        if (!selectedSwap || !rejectForm.rejection_reason.trim()) {
            showToast.promise(Promise.reject({ error: 'Please provide a rejection reason' }), {
                error: 'Validation error'
            });
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.attendance.shift-marketplace.reject'), {
                    shift_swap_request_id: selectedSwap.id,
                    rejection_reason: rejectForm.rejection_reason
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Shift swap rejected successfully']);
                    closeModal('reject');
                    await fetchListings(pagination.currentPage);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to reject shift swap');
            }
        });

        showToast.promise(promise, {
            loading: 'Rejecting shift swap...',
            success: (data) => data.join(', '),
            error: (err) => err
        });
    }, [selectedSwap, rejectForm, pagination.currentPage]);

    // Status color mapping
    const statusColorMap = {
        open: 'success',
        pending: 'warning',
        approved: 'primary',
        completed: 'default',
        rejected: 'danger',
        cancelled: 'default'
    };

    // Status badge
    const StatusBadge = ({ status }) => (
        <Chip
            variant="flat"
            size="sm"
            color={statusColorMap[status] || 'default'}
            className="capitalize"
        >
            {status}
        </Chip>
    );

    // Format time
    const formatTime = (time) => {
        if (!time) return 'N/A';
        return dayjs(time, 'HH:mm:ss').format('h:mm A');
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return dayjs(date).format('MMM DD, YYYY');
    };

    // Render table cell
    const renderCell = useCallback((swap, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        {swap.requester?.avatar_url ? (
                            <img
                                src={swap.requester.avatar_url}
                                alt={swap.requester.name}
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-content2 flex items-center justify-center text-xs font-semibold">
                                {swap.requester?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <span className="text-sm font-medium">{swap.requester?.name || 'Unknown'}</span>
                    </div>
                );
            case 'shift_details':
                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">
                            {formatDate(swap.shift_schedule?.shift_date)}
                        </span>
                        <span className="text-xs text-default-500">
                            {formatTime(swap.shift_schedule?.start_time)} - {formatTime(swap.shift_schedule?.end_time)}
                        </span>
                        <span className="text-xs text-default-500">
                            {swap.shift_schedule?.department?.name || 'N/A'}
                        </span>
                    </div>
                );
            case 'type':
                return (
                    <Badge
                        content={swap.request_type === 'open_pickup' ? 'Open' : 'Swap'}
                        color={swap.request_type === 'open_pickup' ? 'success' : 'secondary'}
                    />
                );
            case 'reason':
                return (
                    <Tooltip content={swap.reason} color="default" size="sm">
                        <span className="text-sm truncate max-w-xs">
                            {swap.reason || 'N/A'}
                        </span>
                    </Tooltip>
                );
            case 'posted':
                return (
                    <span className="text-sm text-default-500">
                        {dayjs(swap.created_at).fromNow()}
                    </span>
                );
            case 'status':
                return <StatusBadge status={swap.status} />;
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            {swap.request_type === 'open_pickup' && swap.status === 'open' && (
                                <DropdownItem
                                    key="accept"
                                    color="success"
                                    onPress={() => openModal('accept', swap)}
                                >
                                    Accept Shift
                                </DropdownItem>
                            )}
                            {canApprove && swap.status === 'pending' && (
                                <>
                                    <DropdownItem
                                        key="approve"
                                        color="primary"
                                        onPress={() => {
                                            setSelectedSwap(swap);
                                            // Handle approve directly
                                            const promise = new Promise(async (resolve, reject) => {
                                                try {
                                                    const response = await axios.post(
                                                        route('hrm.attendance.shift-marketplace.approve'),
                                                        { shift_swap_request_id: swap.id }
                                                    );
                                                    resolve([response.data.message || 'Approved']);
                                                    await fetchListings(pagination.currentPage);
                                                } catch (error) {
                                                    reject(error.response?.data?.message || 'Failed to approve');
                                                }
                                            });
                                            showToast.promise(promise, {
                                                loading: 'Approving...',
                                                success: (data) => data.join(', '),
                                                error: (err) => err
                                            });
                                        }}
                                    >
                                        Approve
                                    </DropdownItem>
                                    <DropdownItem
                                        key="reject"
                                        color="danger"
                                        onPress={() => openModal('reject', swap)}
                                    >
                                        Reject
                                    </DropdownItem>
                                </>
                            )}
                            <DropdownItem
                                key="details"
                                onPress={() => openModal('details', swap)}
                            >
                                View Details
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return 'N/A';
        }
    }, [openModal, canApprove, pagination.currentPage]);

    const tableColumns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'shift_details', name: 'Shift Details' },
        { uid: 'type', name: 'Type' },
        { uid: 'reason', name: 'Reason' },
        { uid: 'posted', name: 'Posted' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' }
    ];

    return (
        <>
            <Head title={title} />

            {/* Create Swap Modal */}
            {modalStates.create && (
                <Modal
                    isOpen={modalStates.create}
                    onOpenChange={() => closeModal('create')}
                    size="2xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Create Shift Swap Request</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                {/* Shift Schedule */}
                                <Select
                                    label="My Shift"
                                    placeholder="Select a shift to swap"
                                    selectedKeys={createForm.shift_schedule_id ? [String(createForm.shift_schedule_id)] : []}
                                    onSelectionChange={(keys) => setCreateForm(prev => ({
                                        ...prev,
                                        shift_schedule_id: Array.from(keys)[0]
                                    }))}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-content2" }}
                                >
                                    {/* Would be populated from backend */}
                                    <SelectItem key={1}>Mon, Apr 21 · 9:00 AM - 5:00 PM · Sales</SelectItem>
                                </Select>

                                {/* Request Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Request Type</label>
                                    <RadioGroup
                                        value={createForm.request_type}
                                        onValueChange={(value) => setCreateForm(prev => ({
                                            ...prev,
                                            request_type: value
                                        }))}
                                    >
                                        <Radio value="open_pickup">Open Pickup - Anyone can accept</Radio>
                                        <Radio value="specific_swap">Specific Swap - I'm offering a shift</Radio>
                                    </RadioGroup>
                                </div>

                                {/* Conditional: Acceptor for specific swap */}
                                {createForm.request_type === 'specific_swap' && (
                                    <Select
                                        label="Swap With (Employee)"
                                        placeholder="Select colleague"
                                        selectedKeys={createForm.acceptor_id ? [String(createForm.acceptor_id)] : []}
                                        onSelectionChange={(keys) => setCreateForm(prev => ({
                                            ...prev,
                                            acceptor_id: Array.from(keys)[0]
                                        }))}
                                        radius={themeRadius}
                                        classNames={{ trigger: "bg-content2" }}
                                    >
                                        {/* Would be populated from colleagues */}
                                        <SelectItem key={1}>John Doe</SelectItem>
                                    </Select>
                                )}

                                {/* Reason */}
                                <Textarea
                                    label="Reason"
                                    placeholder="Why do you need to swap this shift?"
                                    value={createForm.reason}
                                    onValueChange={(value) => setCreateForm(prev => ({
                                        ...prev,
                                        reason: value
                                    }))}
                                    isRequired
                                    maxLength={1000}
                                    classNames={{ input: "resize-none" }}
                                    description={`${createForm.reason.length}/1000 characters`}
                                    radius={themeRadius}
                                />

                                {/* Manager Approval */}
                                <Checkbox
                                    isSelected={createForm.manager_approval_required}
                                    onValueChange={(value) => setCreateForm(prev => ({
                                        ...prev,
                                        manager_approval_required: value
                                    }))}
                                >
                                    Requires manager approval
                                </Checkbox>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('create')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleCreateSwap}>
                                Create Request
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Accept Swap Modal */}
            {modalStates.accept && selectedSwap && (
                <Modal
                    isOpen={modalStates.accept}
                    onOpenChange={() => closeModal('accept')}
                    size="md"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Accept Shift Swap</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Card className="bg-content2">
                                    <CardBody className="space-y-2">
                                        <p className="text-sm font-semibold">
                                            {selectedSwap.requester?.name} is offering:
                                        </p>
                                        <p className="text-sm font-bold">
                                            {formatDate(selectedSwap.shift_schedule?.shift_date)}
                                        </p>
                                        <p className="text-sm">
                                            {formatTime(selectedSwap.shift_schedule?.start_time)} - {formatTime(selectedSwap.shift_schedule?.end_time)}
                                        </p>
                                        <p className="text-sm text-default-500">
                                            {selectedSwap.shift_schedule?.department?.name}
                                        </p>
                                    </CardBody>
                                </Card>

                                <p className="text-sm text-foreground">
                                    Once approved by management, the shifts will be exchanged. Your current shift will be assigned to {selectedSwap.requester?.name}.
                                </p>

                                <Checkbox
                                    isSelected={acceptCheckbox}
                                    onValueChange={setAcceptCheckbox}
                                >
                                    I understand my current shift will be replaced
                                </Checkbox>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('accept')}>
                                Cancel
                            </Button>
                            <Button
                                color="success"
                                onPress={handleAcceptSwap}
                                isDisabled={!acceptCheckbox}
                            >
                                Accept Shift
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Reject Swap Modal */}
            {modalStates.reject && selectedSwap && (
                <Modal
                    isOpen={modalStates.reject}
                    onOpenChange={() => closeModal('reject')}
                    size="md"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Reject Shift Swap</h2>
                        </ModalHeader>
                        <ModalBody>
                            <Textarea
                                label="Rejection Reason"
                                placeholder="Please provide a reason for rejecting this request..."
                                value={rejectForm.rejection_reason}
                                onValueChange={(value) => setRejectForm(prev => ({
                                    ...prev,
                                    rejection_reason: value
                                }))}
                                isRequired
                                maxLength={500}
                                classNames={{ input: "resize-none" }}
                                description={`${rejectForm.rejection_reason.length}/500 characters`}
                                radius={themeRadius}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('reject')}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleRejectSwap}
                            >
                                Reject Request
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Details Modal */}
            {modalStates.details && selectedSwap && (
                <Modal
                    isOpen={modalStates.details}
                    onOpenChange={() => closeModal('details')}
                    size="2xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider"
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold">Shift Swap Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-default-500 uppercase font-semibold">Requested By</p>
                                        <p className="text-sm font-semibold">{selectedSwap.requester?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-default-500 uppercase font-semibold">Status</p>
                                        <StatusBadge status={selectedSwap.status} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-default-500 uppercase font-semibold">Request Type</p>
                                        <p className="text-sm">{selectedSwap.request_type === 'open_pickup' ? 'Open Pickup' : 'Specific Swap'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-default-500 uppercase font-semibold">Created</p>
                                        <p className="text-sm">{formatDate(selectedSwap.created_at)}</p>
                                    </div>
                                </div>

                                <Card className="bg-content2">
                                    <CardBody className="space-y-2">
                                        <p className="text-xs text-default-500 uppercase font-semibold">Shift Details</p>
                                        <p className="text-sm font-semibold">{formatDate(selectedSwap.shift_schedule?.shift_date)}</p>
                                        <p className="text-sm">
                                            {formatTime(selectedSwap.shift_schedule?.start_time)} - {formatTime(selectedSwap.shift_schedule?.end_time)}
                                        </p>
                                        <p className="text-sm text-default-500">{selectedSwap.shift_schedule?.department?.name}</p>
                                    </CardBody>
                                </Card>

                                <div>
                                    <p className="text-xs text-default-500 uppercase font-semibold mb-2">Reason</p>
                                    <p className="text-sm">{selectedSwap.reason}</p>
                                </div>

                                {selectedSwap.manager_notes && (
                                    <div>
                                        <p className="text-xs text-default-500 uppercase font-semibold mb-2">Manager Notes</p>
                                        <p className="text-sm">{selectedSwap.manager_notes}</p>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('details')}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Main Content */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Shift Marketplace">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card
                                className="transition-all duration-200 aero-card"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`
                                }}
                            >
                                {/* Card Header */}
                                <CardHeader
                                    className="border-b border-divider p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`
                                                    }}
                                                >
                                                    <ListBulletIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        {title}
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Browse and manage shift swap requests
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('create')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Create Request
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Card Body */}
                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                        <Input
                                            placeholder="Search employee name or shift..."
                                            value={filters.search}
                                            onValueChange={(value) => handleFilterChange('search', value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            radius={themeRadius}
                                            className="flex-1"
                                            classNames={{ inputWrapper: "bg-content2" }}
                                        />
                                        <Select
                                            placeholder="All Statuses"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-content2" }}
                                        >
                                            <SelectItem key="all">All Statuses</SelectItem>
                                            <SelectItem key="open">Open</SelectItem>
                                            <SelectItem key="pending">Pending</SelectItem>
                                            <SelectItem key="approved">Approved</SelectItem>
                                        </Select>
                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department !== 'all' ? [filters.department] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0] || 'all')}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-content2" }}
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            placeholder="Per Page"
                                            selectedKeys={[String(pagination.perPage)]}
                                            onSelectionChange={(keys) => {
                                                setPagination(prev => ({
                                                    ...prev,
                                                    perPage: parseInt(Array.from(keys)[0])
                                                }));
                                                fetchListings(1, parseInt(Array.from(keys)[0]));
                                            }}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-content2" }}
                                        >
                                            <SelectItem key="10">10 per page</SelectItem>
                                            <SelectItem key="25">25 per page</SelectItem>
                                            <SelectItem key="50">50 per page</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Data Table */}
                                    {tableLoading ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="flex gap-4 h-16 bg-content2 rounded-lg animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="Shift Marketplace"
                                            isHeaderSticky
                                            classNames={{
                                                wrapper: "shadow-none border border-divider rounded-lg",
                                                th: "bg-content2 text-default-600 font-semibold",
                                                td: "py-3"
                                            }}
                                        >
                                            <TableHeader columns={tableColumns}>
                                                {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                            </TableHeader>
                                            <TableBody
                                                items={currentListings}
                                                emptyContent="No shift swap requests found"
                                            >
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => (
                                                            <TableCell>
                                                                {renderCell(item, columnKey)}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}

                                    {/* Pagination */}
                                    {pagination.lastPage > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                isCompact
                                                showControls
                                                showShadow
                                                color="primary"
                                                page={pagination.currentPage}
                                                total={pagination.lastPage}
                                                onChange={(page) => fetchListings(page)}
                                            />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

ShiftMarketplace.layout = (page) => <App children={page} />;
export default ShiftMarketplace;
