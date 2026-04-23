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
    Skeleton,
} from "@heroui/react";
import {
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    ArrowPathIcon,
    CreditCardIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/UI/StatsCards";
import { showToast } from '@/utils/ui/toastUtils';
import axios from 'axios';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const Trials = ({ trials: initialTrials, stats: initialStats, plans, filters: initialFilters, auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [trials, setTrials] = useState(initialTrials?.data || []);
    const [stats, setStats] = useState(initialStats || {});
    const [pagination, setPagination] = useState({
        currentPage: initialTrials?.current_page || 1,
        lastPage: initialTrials?.last_page || 1,
        total: initialTrials?.total || 0,
    });
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        filter: initialFilters?.filter || 'all',
    });
    const [selectedTrial, setSelectedTrial] = useState(null);
    const [extendModalOpen, setExtendModalOpen] = useState(false);
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [extendDays, setExtendDays] = useState(7);
    const [extendReason, setExtendReason] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [billingCycle, setBillingCycle] = useState('monthly');

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const themeRadius = useThemeRadius();

    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.permissions?.includes('*');
    };

    const statsData = useMemo(() => [
        {
            title: "Total Trials",
            value: stats?.total || 0,
            icon: <CalendarIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
        },
        {
            title: "Active",
            value: stats?.active || 0,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
        },
        {
            title: "Expiring Soon",
            value: stats?.expiringSoon || 0,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
        },
        {
            title: "Conversion Rate",
            value: `${stats?.conversionRate || 0}%`,
            icon: <CreditCardIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
        },
    ], [stats]);

    const fetchTrials = useCallback(async (page = 1) => {
        setLoading(true);
        router.get(route('admin.onboarding.trials'), {
            page,
            search: filters.search,
            filter: filters.filter,
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['trials', 'stats'],
            onSuccess: (page) => {
                setTrials(page.props.trials?.data || []);
                setStats(page.props.stats || {});
                setPagination({
                    currentPage: page.props.trials?.current_page || 1,
                    lastPage: page.props.trials?.last_page || 1,
                    total: page.props.trials?.total || 0,
                });
                setLoading(false);
            },
            onError: () => setLoading(false),
        });
    }, [filters]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchTrials(1);
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [filters.search, filters.filter]);

    // Add real-time auto-refresh every 60 seconds for trial expiration monitoring
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['trials', 'stats'], preserveScroll: true });
        }, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const handleExtend = async () => {
        if (!selectedTrial) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.trials.extend', { tenant: selectedTrial.id }), {
                    days: extendDays,
                    reason: extendReason,
                });
                if (response.data.success) {
                    resolve([response.data.message]);
                    setExtendModalOpen(false);
                    setSelectedTrial(null);
                    setExtendDays(7);
                    setExtendReason('');
                    fetchTrials(pagination.currentPage);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to extend trial']);
            }
        });

        showToast.promise(promise, {
            loading: 'Extending trial...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleConvert = async () => {
        if (!selectedTrial || !selectedPlan) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.trials.convert', { tenant: selectedTrial.id }), {
                    plan_id: selectedPlan,
                    billing_cycle: billingCycle,
                });
                if (response.data.success) {
                    resolve([response.data.message]);
                    setConvertModalOpen(false);
                    setSelectedTrial(null);
                    setSelectedPlan('');
                    setBillingCycle('monthly');
                    fetchTrials(pagination.currentPage);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to convert trial']);
            }
        });

        showToast.promise(promise, {
            loading: 'Converting to paid subscription...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleCancelTrial = async (trial) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.trials.cancel', { tenant: trial.id }), {
                    reason: 'Cancelled from onboarding trial management',
                });
                if (response.data.success) {
                    resolve([response.data.message]);
                    fetchTrials(pagination.currentPage);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to cancel trial']);
            }
        });

        showToast.promise(promise, {
            loading: 'Cancelling trial...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const getDaysRemaining = (trialEndsAt) => {
        const now = new Date();
        const end = new Date(trialEndsAt);
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getDaysColor = (days) => {
        if (days <= 0) return 'danger';
        if (days <= 3) return 'danger';
        if (days <= 7) return 'warning';
        return 'success';
    };

    const columns = [
        { uid: 'company', name: 'Company' },
        { uid: 'plan', name: 'Plan' },
        { uid: 'daysRemaining', name: 'Days Left' },
        { uid: 'expiresAt', name: 'Expires' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (trial, columnKey) => {
        const daysRemaining = getDaysRemaining(trial.trial_ends_at);

        switch (columnKey) {
            case 'company':
                return (
                    <div>
                        <p className="font-medium">{trial.name}</p>
                        <p className="text-xs text-default-500">{trial.email}</p>
                    </div>
                );
            case 'plan':
                return (
                    <Chip size="sm" variant="flat" color="primary">
                        {trial.plan?.name || 'No Plan'}
                    </Chip>
                );
            case 'daysRemaining':
                return (
                    <Chip size="sm" variant="flat" color={getDaysColor(daysRemaining)}>
                        {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days`}
                    </Chip>
                );
            case 'expiresAt':
                return (
                    <span className="text-sm text-default-500">
                        {new Date(trial.trial_ends_at).toLocaleDateString()}
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
                                {hasPermission('platform-onboarding.trials.extend') && (
                                    <DropdownItem
                                        key="extend"
                                        startContent={<CalendarDaysIcon className="w-4 h-4" />}
                                        onPress={() => {
                                            setSelectedTrial(trial);
                                            setExtendModalOpen(true);
                                        }}
                                    >
                                        Extend Trial
                                    </DropdownItem>
                                )}
                                {hasPermission('platform-onboarding.trials.convert') && (
                                    <DropdownItem
                                        key="convert"
                                        startContent={<CreditCardIcon className="w-4 h-4" />}
                                        className="text-success"
                                        color="success"
                                        onPress={() => {
                                            setSelectedTrial(trial);
                                            setSelectedPlan(trial.plan?.id || '');
                                            setConvertModalOpen(true);
                                        }}
                                    >
                                        Convert to Paid
                                    </DropdownItem>
                                )}
                                {hasPermission('platform-onboarding.trials.cancel') && (
                                    <DropdownItem
                                        key="cancel"
                                        startContent={<XCircleIcon className="w-4 h-4" />}
                                        className="text-danger"
                                        color="danger"
                                        onPress={() => handleCancelTrial(trial)}
                                    >
                                        Cancel Trial
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
            <Head title="Trial Management" />

            {/* Extend Modal */}
            <Modal isOpen={extendModalOpen} onOpenChange={setExtendModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>Extend Trial Period</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-600 mb-4">
                            Extend trial for <strong>{selectedTrial?.name}</strong>
                        </p>
                        <div className="space-y-4">
                            <Select
                                label="Extension Period"
                                selectedKeys={[String(extendDays)]}
                                onSelectionChange={(keys) => setExtendDays(Number(Array.from(keys)[0]))}
                            >
                                <SelectItem key="3">3 days</SelectItem>
                                <SelectItem key="7">7 days</SelectItem>
                                <SelectItem key="14">14 days</SelectItem>
                                <SelectItem key="30">30 days</SelectItem>
                            </Select>
                            <Input
                                label="Reason (optional)"
                                placeholder="Why are you extending this trial?"
                                value={extendReason}
                                onValueChange={setExtendReason}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setExtendModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleExtend}>
                            Extend Trial
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Convert Modal */}
            <Modal isOpen={convertModalOpen} onOpenChange={setConvertModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>Convert to Paid Subscription</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-600 mb-4">
                            Convert <strong>{selectedTrial?.name}</strong> to a paid subscription
                        </p>
                        <div className="space-y-4">
                            <Select
                                label="Plan"
                                selectedKeys={selectedPlan ? [selectedPlan] : []}
                                onSelectionChange={(keys) => setSelectedPlan(Array.from(keys)[0])}
                                isRequired
                            >
                                {plans?.map((plan) => (
                                    <SelectItem key={plan.id}>{plan.name}</SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Billing Cycle"
                                selectedKeys={[billingCycle]}
                                onSelectionChange={(keys) => setBillingCycle(Array.from(keys)[0])}
                            >
                                <SelectItem key="monthly">Monthly</SelectItem>
                                <SelectItem key="yearly">Yearly (Save 20%)</SelectItem>
                            </Select>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setConvertModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="success" onPress={handleConvert} isDisabled={!selectedPlan}>
                            Convert to Paid
                        </Button>
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
                        <Card className="transition-all duration-200">
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
                                                <CalendarIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Trial Management
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Monitor trials, extend periods, and convert to paid subscriptions
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
                                        radius={themeRadius}
                                    />
                                    <Select
                                        placeholder="Filter by status"
                                        selectedKeys={filters.filter !== 'all' ? [filters.filter] : []}
                                        onSelectionChange={(keys) => setFilters(prev => ({ ...prev, filter: Array.from(keys)[0] || 'all' }))}
                                        className="w-full sm:w-48"
                                        radius={themeRadius}
                                    >
                                        <SelectItem key="all">All Trials</SelectItem>
                                        <SelectItem key="active">Active</SelectItem>
                                        <SelectItem key="expiring_soon">Expiring Soon</SelectItem>
                                        <SelectItem key="expired">Expired</SelectItem>
                                    </Select>
                                </div>

                                {/* Table */}
                                <Table
                                    aria-label="Trials table"
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
                                        items={trials}
                                        emptyContent="No trials found"
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
                                            onChange={(page) => fetchTrials(page)}
                                            showControls
                                            radius={themeRadius}
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

Trials.layout = (page) => <App children={page} />;

export default Trials;

