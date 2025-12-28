import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Select,
    SelectItem,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    Skeleton,
} from "@heroui/react";
import {
    UserGroupIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    CheckIcon,
    XMarkIcon,
    EnvelopeIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const Pending = ({ registrations: initialRegistrations, stats: initialStats, filters: initialFilters, auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [loading, setLoading] = useState(false);
    const [registrations, setRegistrations] = useState(initialRegistrations?.data || []);
    const [stats, setStats] = useState(initialStats || {});
    const [pagination, setPagination] = useState({
        currentPage: initialRegistrations?.current_page || 1,
        lastPage: initialRegistrations?.last_page || 1,
        total: initialRegistrations?.total || 0,
        perPage: initialRegistrations?.per_page || 15,
    });
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
    });
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'xl';
    };

    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.permissions?.includes('*');
    };

    const statsData = useMemo(() => [
        {
            title: "Total Pending",
            value: stats?.total || 0,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
        },
        {
            title: "Awaiting Verification",
            value: stats?.awaitingVerification || 0,
            icon: <EnvelopeIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
        },
        {
            title: "Verified",
            value: stats?.verified || 0,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
        },
        {
            title: "Incomplete",
            value: stats?.incomplete || 0,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: "text-yellow-400",
            iconBg: "bg-yellow-500/20",
        },
    ], [stats]);

    const fetchRegistrations = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            router.get(route('admin.onboarding.pending'), {
                page,
                search: filters.search,
                status: filters.status,
            }, {
                preserveState: true,
                preserveScroll: true,
                only: ['registrations', 'stats'],
                onSuccess: (page) => {
                    setRegistrations(page.props.registrations?.data || []);
                    setStats(page.props.stats || {});
                    setPagination({
                        currentPage: page.props.registrations?.current_page || 1,
                        lastPage: page.props.registrations?.last_page || 1,
                        total: page.props.registrations?.total || 0,
                        perPage: page.props.registrations?.per_page || 15,
                    });
                },
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchRegistrations(1);
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [filters.search, filters.status]);

    const handleApprove = async (registration) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.approve', { tenant: registration.id }));
                if (response.data.success) {
                    resolve([response.data.message]);
                    fetchRegistrations(pagination.currentPage);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to approve registration']);
            }
        });

        showToast.promise(promise, {
            loading: 'Approving registration...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleReject = async () => {
        if (!selectedRegistration || !rejectReason.trim()) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.reject', { tenant: selectedRegistration.id }), {
                    reason: rejectReason,
                });
                if (response.data.success) {
                    resolve([response.data.message]);
                    setRejectModalOpen(false);
                    setRejectReason('');
                    setSelectedRegistration(null);
                    fetchRegistrations(pagination.currentPage);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to reject registration']);
            }
        });

        showToast.promise(promise, {
            loading: 'Rejecting registration...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const openRejectModal = (registration) => {
        setSelectedRegistration(registration);
        setRejectModalOpen(true);
    };

    const openDetailModal = (registration) => {
        setSelectedRegistration(registration);
        setDetailModalOpen(true);
    };

    const getStatusColor = (registration) => {
        if (!registration.company_email_verified_at) return 'warning';
        if (registration.registration_step !== 'payment') return 'primary';
        return 'success';
    };

    const getStatusLabel = (registration) => {
        if (!registration.company_email_verified_at) return 'Awaiting Verification';
        if (registration.registration_step !== 'payment') return 'Incomplete';
        return 'Ready for Approval';
    };

    const columns = [
        { uid: 'company', name: 'Company' },
        { uid: 'email', name: 'Email' },
        { uid: 'plan', name: 'Plan' },
        { uid: 'status', name: 'Status' },
        { uid: 'registered', name: 'Registered' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (registration, columnKey) => {
        switch (columnKey) {
            case 'company':
                return (
                    <div>
                        <p className="font-medium">{registration.name}</p>
                        <p className="text-xs text-default-500">{registration.subdomain}.domain.com</p>
                    </div>
                );
            case 'email':
                return <span className="text-sm">{registration.email}</span>;
            case 'plan':
                return (
                    <Chip size="sm" variant="flat" color="primary">
                        {registration.plan?.name || 'No Plan'}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip size="sm" variant="flat" color={getStatusColor(registration)}>
                        {getStatusLabel(registration)}
                    </Chip>
                );
            case 'registered':
                return (
                    <span className="text-sm text-default-500">
                        {new Date(registration.created_at).toLocaleDateString()}
                    </span>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                                <DropdownItem
                                    key="view"
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                    onPress={() => openDetailModal(registration)}
                                >
                                    View Details
                                </DropdownItem>
                                {hasPermission('platform-onboarding.pending_approvals.approve') && (
                                    <DropdownItem
                                        key="approve"
                                        startContent={<CheckIcon className="w-4 h-4" />}
                                        className="text-success"
                                        color="success"
                                        onPress={() => handleApprove(registration)}
                                    >
                                        Approve
                                    </DropdownItem>
                                )}
                                {hasPermission('platform-onboarding.pending_approvals.reject') && (
                                    <DropdownItem
                                        key="reject"
                                        startContent={<XMarkIcon className="w-4 h-4" />}
                                        className="text-danger"
                                        color="danger"
                                        onPress={() => openRejectModal(registration)}
                                    >
                                        Reject
                                    </DropdownItem>
                                )}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title="Pending Registrations" />

            {/* Reject Modal */}
            <Modal isOpen={rejectModalOpen} onOpenChange={setRejectModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>Reject Registration</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-600 mb-4">
                            Please provide a reason for rejecting the registration for <strong>{selectedRegistration?.name}</strong>.
                        </p>
                        <Textarea
                            label="Rejection Reason"
                            placeholder="Enter the reason for rejection..."
                            value={rejectReason}
                            onValueChange={setRejectReason}
                            minRows={3}
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setRejectModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleReject} isDisabled={!rejectReason.trim()}>
                            Reject Registration
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={detailModalOpen} onOpenChange={setDetailModalOpen} size="2xl">
                <ModalContent>
                    <ModalHeader>Registration Details</ModalHeader>
                    <ModalBody>
                        {selectedRegistration && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-default-500">Company Name</p>
                                        <p className="font-medium">{selectedRegistration.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">Subdomain</p>
                                        <p className="font-medium">{selectedRegistration.subdomain}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">Email</p>
                                        <p className="font-medium">{selectedRegistration.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">Phone</p>
                                        <p className="font-medium">{selectedRegistration.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">Plan</p>
                                        <p className="font-medium">{selectedRegistration.plan?.name || 'No Plan Selected'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">Registration Step</p>
                                        <p className="font-medium capitalize">{selectedRegistration.registration_step || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">Email Verified</p>
                                        <Chip size="sm" color={selectedRegistration.company_email_verified_at ? 'success' : 'warning'}>
                                            {selectedRegistration.company_email_verified_at ? 'Yes' : 'No'}
                                        </Chip>
                                    </div>
                                    <div>
                                        <p className="text-sm text-default-500">Registered At</p>
                                        <p className="font-medium">{new Date(selectedRegistration.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setDetailModalOpen(false)}>
                            Close
                        </Button>
                        {hasPermission('platform-onboarding.pending_approvals.approve') && (
                            <Button color="success" onPress={() => {
                                handleApprove(selectedRegistration);
                                setDetailModalOpen(false);
                            }}>
                                Approve
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="flex flex-col w-full h-full p-4">
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                            <CardHeader
                                className="border-b p-0"
                                style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}
                            >
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                                                    borderRadius: 'var(--borderRadius, 12px)',
                                                }}
                                            >
                                                <ClockIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Pending Registrations
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Review and manage tenant registration requests
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                {/* Stats */}
                                <StatsCards stats={statsData} className="mb-6" />

                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Input
                                        placeholder="Search by company or email..."
                                        value={filters.search}
                                        onValueChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                        className="w-full sm:w-80"
                                        radius={getThemeRadius()}
                                    />
                                    <Select
                                        placeholder="Filter by status"
                                        selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                        onSelectionChange={(keys) => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] || 'all' }))}
                                        className="w-full sm:w-48"
                                        radius={getThemeRadius()}
                                    >
                                        <SelectItem key="all">All Status</SelectItem>
                                        <SelectItem key="verify_email">Awaiting Verification</SelectItem>
                                        <SelectItem key="details">Incomplete - Details</SelectItem>
                                        <SelectItem key="plan">Incomplete - Plan</SelectItem>
                                        <SelectItem key="payment">Ready for Approval</SelectItem>
                                    </Select>
                                </div>

                                {/* Table */}
                                <Table
                                    aria-label="Pending registrations table"
                                    isHeaderSticky
                                    classNames={{
                                        wrapper: "shadow-none border border-divider rounded-lg",
                                        th: "bg-default-100 text-default-600 font-semibold",
                                        td: "py-3",
                                    }}
                                >
                                    <TableHeader columns={columns}>
                                        {(column) => (
                                            <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                                                {column.name}
                                            </TableColumn>
                                        )}
                                    </TableHeader>
                                    <TableBody
                                        items={registrations}
                                        emptyContent="No pending registrations found"
                                        isLoading={loading}
                                        loadingContent={<Skeleton className="w-full h-40 rounded-lg" />}
                                    >
                                        {(item) => (
                                            <TableRow key={item.id}>
                                                {(columnKey) => (
                                                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                                                )}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {pagination.lastPage > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            total={pagination.lastPage}
                                            page={pagination.currentPage}
                                            onChange={(page) => fetchRegistrations(page)}
                                            showControls
                                            radius={getThemeRadius()}
                                        />
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

Pending.layout = (page) => <App children={page} />;

export default Pending;
