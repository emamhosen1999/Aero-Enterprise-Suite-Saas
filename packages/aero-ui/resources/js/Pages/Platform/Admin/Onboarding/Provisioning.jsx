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
    Select,
    SelectItem,
    Pagination,
    Progress,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Skeleton,
} from "@heroui/react";
import {
    ServerStackIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    CpuChipIcon,
    CircleStackIcon,
    EllipsisVerticalIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Provisioning = ({ queue: initialQueue, stats: initialStats, stepProgress: initialStepProgress, filters: initialFilters }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [queue, setQueue] = useState(initialQueue?.data || []);
    const [stats, setStats] = useState(initialStats || {});
    const [stepProgress, setStepProgress] = useState(initialStepProgress || {});
    const [pagination, setPagination] = useState({
        currentPage: initialQueue?.current_page || 1,
        lastPage: initialQueue?.last_page || 1,
        total: initialQueue?.total || 0,
    });
    const [filters, setFilters] = useState({
        status: initialFilters?.status || 'all',
    });

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const themeRadius = useThemeRadius();
    const { hasAccess } = useHRMAC();
    const canRetry = hasAccess('platform', 'onboarding_management', 'provisioning', 'retry');

    const statsData = useMemo(() => [
        {
            title: "Total in Queue",
            value: stats?.total || 0,
            icon: <ServerStackIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
        },
        {
            title: "Processing",
            value: stats?.processing || 0,
            icon: <CpuChipIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
        },
        {
            title: "Failed",
            value: stats?.failed || 0,
            icon: <XCircleIcon className="w-6 h-6" />,
            color: "text-red-400",
            iconBg: "bg-red-500/20",
        },
        {
            title: "Completed Today",
            value: stats?.completedToday || 0,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
        },
    ], [stats]);

    const fetchQueue = useCallback(async (page = 1) => {
        setLoading(true);
        router.get(route('admin.onboarding.provisioning'), {
            page,
            status: filters.status,
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['queue', 'stats', 'stepProgress'],
            onSuccess: (page) => {
                setQueue(page.props.queue?.data || []);
                setStats(page.props.stats || {});
                setStepProgress(page.props.stepProgress || {});
                setPagination({
                    currentPage: page.props.queue?.current_page || 1,
                    lastPage: page.props.queue?.last_page || 1,
                    total: page.props.queue?.total || 0,
                });
                setLoading(false);
            },
            onError: () => setLoading(false),
        });
    }, [filters]);

    useEffect(() => {
        fetchQueue(1);
    }, [filters.status]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchQueue(pagination.currentPage);
        }, 10000);
        return () => clearInterval(interval);
    }, [pagination.currentPage]);

    const handleRetry = async (tenant) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.provisioning.retry', { tenant: tenant.id }));
                if (response.data.success) {
                    resolve([response.data.message]);
                    fetchQueue(pagination.currentPage);
                } else {
                    reject([response.data.message]);
                }
            } catch (error) {
                reject([error.response?.data?.message || 'Failed to retry provisioning']);
            }
        });

        showToast.promise(promise, {
            loading: 'Initiating retry...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const getStepLabel = (step) => {
        const labels = {
            creating_db: 'Creating Database',
            migrating: 'Running Migrations',
            seeding: 'Seeding Data',
            creating_admin: 'Creating Admin User',
        };
        return labels[step] || step || 'Queued';
    };

    const getStepProgress = (step) => {
        const steps = ['creating_db', 'migrating', 'seeding', 'creating_admin'];
        const index = steps.indexOf(step);
        return index >= 0 ? ((index + 1) / steps.length) * 100 : 0;
    };

    const getStatusColor = (status, step) => {
        if (status === 'failed') return 'danger';
        if (status === 'provisioning') return 'primary';
        return 'default';
    };

    const columns = [
        { uid: 'tenant', name: 'Tenant' },
        { uid: 'step', name: 'Current Step' },
        { uid: 'progress', name: 'Progress' },
        { uid: 'status', name: 'Status' },
        { uid: 'started', name: 'Started' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'tenant':
                return (
                    <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-default-500">{item.subdomain}</p>
                    </div>
                );
            case 'step':
                return (
                    <div className="flex items-center gap-2">
                        {item.status === 'failed' ? (
                            <XCircleIcon className="w-4 h-4 text-danger" />
                        ) : (
                            <ArrowPathIcon className="w-4 h-4 text-primary animate-spin" />
                        )}
                        <span className="text-sm">{getStepLabel(item.provisioning_step)}</span>
                    </div>
                );
            case 'progress':
                return (
                    <Progress
                        size="sm"
                        value={item.status === 'failed' ? 100 : getStepProgress(item.provisioning_step)}
                        color={item.status === 'failed' ? 'danger' : 'primary'}
                        className="max-w-24"
                    />
                );
            case 'status':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(item.status, item.provisioning_step)}
                    >
                        {item.status === 'failed' ? 'Failed' : 'Processing'}
                    </Chip>
                );
            case 'started':
                return (
                    <span className="text-sm text-default-500">
                        {new Date(item.updated_at).toLocaleString()}
                    </span>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-2">
                        {item.status === 'failed' && canRetry && (
                            <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={() => handleRetry(item)}
                            >
                                Retry
                            </Button>
                        )}
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                                <DropdownItem
                                    key="logs"
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                >
                                    View Logs
                                </DropdownItem>
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
            <Head title="Provisioning Queue" />

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
                                                <ServerStackIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Provisioning Queue
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Monitor tenant provisioning status and retry failed operations
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="flat"
                                            color="primary"
                                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                                            onPress={() => fetchQueue(pagination.currentPage)}
                                            isLoading={loading}
                                        >
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                {/* Stats */}
                                <StatsCards stats={statsData} className="mb-6" />

                                {/* Step Progress Overview */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="p-4 bg-content2 dark:bg-default-100/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CircleStackIcon className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm font-medium">Creating DB</span>
                                        </div>
                                        <p className="text-2xl font-bold">{stepProgress?.creating_db || 0}</p>
                                    </div>
                                    <div className="p-4 bg-content2 dark:bg-default-100/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CpuChipIcon className="w-5 h-5 text-purple-500" />
                                            <span className="text-sm font-medium">Migrating</span>
                                        </div>
                                        <p className="text-2xl font-bold">{stepProgress?.migrating || 0}</p>
                                    </div>
                                    <div className="p-4 bg-content2 dark:bg-default-100/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ServerStackIcon className="w-5 h-5 text-orange-500" />
                                            <span className="text-sm font-medium">Seeding</span>
                                        </div>
                                        <p className="text-2xl font-bold">{stepProgress?.seeding || 0}</p>
                                    </div>
                                    <div className="p-4 bg-content2 dark:bg-default-100/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                            <span className="text-sm font-medium">Creating Admin</span>
                                        </div>
                                        <p className="text-2xl font-bold">{stepProgress?.creating_admin || 0}</p>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex gap-4 mb-6">
                                    <Select
                                        placeholder="Filter by status"
                                        selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                        onSelectionChange={(keys) => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] || 'all' }))}
                                        className="w-full sm:w-48"
                                        radius={themeRadius}
                                    >
                                        <SelectItem key="all">All Status</SelectItem>
                                        <SelectItem key="provisioning">Processing</SelectItem>
                                        <SelectItem key="failed">Failed</SelectItem>
                                    </Select>
                                </div>

                                {/* Table */}
                                <Table
                                    aria-label="Provisioning queue table"
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
                                        items={queue}
                                        emptyContent="No items in provisioning queue"
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
                                            onChange={(page) => fetchQueue(page)}
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

Provisioning.layout = (page) => <App children={page} />;

export default Provisioning;

