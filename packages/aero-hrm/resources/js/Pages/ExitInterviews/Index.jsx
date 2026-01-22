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
    Progress,
} from "@heroui/react";
import {
    ChatBubbleLeftRightIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    UserIcon,
    StarIcon,
    CheckCircleIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

const ExitInterviewsIndex = ({ title, stats: initialStats }) => {
    const { auth } = usePage().props;

    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [interviews, setInterviews] = useState([]);
    const [stats, setStats] = useState(initialStats || {});
    const [filters, setFilters] = useState({ search: '', status: '', departure_reason: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });

    const statsData = useMemo(() => [
        { title: "Total Interviews", value: stats.total || 0, icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Scheduled", value: stats.scheduled || 0, icon: <CalendarIcon className="w-5 h-5" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Completed", value: stats.completed || 0, icon: <CheckCircleIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Avg Satisfaction", value: stats.avg_satisfaction || 0, icon: <StarIcon className="w-5 h-5" />, color: "text-secondary", iconBg: "bg-secondary/20", suffix: "/5" },
        { title: "Would Recommend", value: `${stats.would_recommend_pct || 0}%`, icon: <StarIcon className="w-5 h-5" />, color: "text-success", iconBg: "bg-success/20" },
    ], [stats]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.exit-interviews.paginate'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setInterviews(response.data.interviews || []);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (error) {
            showToast.error('Failed to fetch exit interviews');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.exit-interviews.stats'));
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

    const statusColorMap = { scheduled: 'warning', completed: 'success', declined: 'danger', cancelled: 'default' };
    const reasonLabels = {
        better_opportunity: 'Better Opportunity',
        compensation: 'Compensation',
        career_growth: 'Career Growth',
        management: 'Management',
        work_life_balance: 'Work-Life Balance',
        relocation: 'Relocation',
        personal: 'Personal',
        retirement: 'Retirement',
        health: 'Health',
        layoff: 'Layoff',
        termination: 'Termination',
        other: 'Other',
    };

    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'interview_date', name: 'Interview Date' },
        { uid: 'departure_reason', name: 'Reason' },
        { uid: 'satisfaction', name: 'Satisfaction' },
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
                            <p className="text-xs text-default-500">{item.employee?.designation?.title}</p>
                        </div>
                    </div>
                );
            case 'interview_date':
                return <span>{item.interview_date ? new Date(item.interview_date).toLocaleDateString() : '-'}</span>;
            case 'departure_reason':
                return item.departure_reason ? (
                    <Chip size="sm" variant="flat">{reasonLabels[item.departure_reason] || item.departure_reason}</Chip>
                ) : '-';
            case 'satisfaction':
                if (!item.overall_satisfaction) return '-';
                return (
                    <div className="flex items-center gap-2">
                        <Progress value={item.overall_satisfaction * 20} size="sm" color={item.overall_satisfaction >= 4 ? 'success' : item.overall_satisfaction >= 3 ? 'warning' : 'danger'} className="max-w-[80px]" />
                        <span className="text-sm font-medium">{item.overall_satisfaction}/5</span>
                    </div>
                );
            case 'status':
                return <Chip size="sm" color={statusColorMap[item.status]} variant="flat">{item.status}</Chip>;
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light"><EllipsisVerticalIcon className="w-5 h-5" /></Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => window.location.href = route('hrm.exit-interviews.show', item.id)}>
                                View Details
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                    <Card className="transition-all duration-200" style={{
                        border: `var(--borderWidth, 2px) solid transparent`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                    }}>
                        <CardHeader className="border-b p-0" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                            <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl" style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)` }}>
                                            <ChatBubbleLeftRightIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold">Exit Interviews</h4>
                                            <p className="text-sm text-default-500">Capture feedback from departing employees</p>
                                        </div>
                                    </div>
                                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />}>
                                        Schedule Interview
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <StatsCards stats={statsData} className="mb-6" />

                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <Input placeholder="Search employees..." value={filters.search} onValueChange={(v) => handleFilterChange('search', v)}
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} className="sm:max-w-xs" />
                                <Select placeholder="All Statuses" selectedKeys={filters.status ? [filters.status] : []}
                                    onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')} className="sm:max-w-xs">
                                    <SelectItem key="scheduled">Scheduled</SelectItem>
                                    <SelectItem key="completed">Completed</SelectItem>
                                    <SelectItem key="declined">Declined</SelectItem>
                                    <SelectItem key="cancelled">Cancelled</SelectItem>
                                </Select>
                                <Select placeholder="All Reasons" selectedKeys={filters.departure_reason ? [filters.departure_reason] : []}
                                    onSelectionChange={(keys) => handleFilterChange('departure_reason', Array.from(keys)[0] || '')} className="sm:max-w-xs">
                                    {Object.entries(reasonLabels).map(([key, label]) => (
                                        <SelectItem key={key}>{label}</SelectItem>
                                    ))}
                                </Select>
                            </div>

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
                                <Table aria-label="Exit Interviews" classNames={{ wrapper: "shadow-none border border-divider rounded-lg", th: "bg-default-100", td: "py-3" }}>
                                    <TableHeader columns={columns}>
                                        {(column) => <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>{column.name}</TableColumn>}
                                    </TableHeader>
                                    <TableBody items={interviews} emptyContent="No exit interviews found">
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
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

ExitInterviewsIndex.layout = (page) => <App children={page} />;
export default ExitInterviewsIndex;
