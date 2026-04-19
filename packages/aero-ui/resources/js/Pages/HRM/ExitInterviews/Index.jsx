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
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { router } from '@inertiajs/react';

const ExitInterviewsIndex = ({ title, stats: initialStats }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin, hasAccess } = useHRMAC();

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

    // Permission checks using HRMAC
    const canCreateInterview = canCreate('hrm.exit-interviews') || isSuperAdmin();
    const canManageInterview = canUpdate('hrm.exit-interviews') || isSuperAdmin();

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
                                onPress={() => router.visit(route('hrm.exit-interviews.show', item.id))}>
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
        <StandardPageLayout
            title="Exit Interviews"
            subtitle="Capture feedback from departing employees"
            icon={<ChatBubbleLeftRightIcon className="w-8 h-8" />}
            actions={
                canCreateInterview && (
                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />}>
                        Schedule Interview
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
                        <SelectItem key="scheduled">Scheduled</SelectItem>
                        <SelectItem key="completed">Completed</SelectItem>
                        <SelectItem key="declined">Declined</SelectItem>
                        <SelectItem key="cancelled">Cancelled</SelectItem>
                    </Select>
                    <Select placeholder="All Reasons" selectedKeys={filters.departure_reason ? [filters.departure_reason] : []}
                        onSelectionChange={(keys) => handleFilterChange('departure_reason', Array.from(keys)[0] || '')} className="sm:max-w-xs" radius={themeRadius}>
                        {Object.entries(reasonLabels).map(([key, label]) => (
                            <SelectItem key={key}>{label}</SelectItem>
                        ))}
                    </Select>
                </div>
            }
            ariaLabel="Exit Interviews Management"
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
        </StandardPageLayout>
    );
};

ExitInterviewsIndex.layout = (page) => <App children={page} />;
export default ExitInterviewsIndex;
