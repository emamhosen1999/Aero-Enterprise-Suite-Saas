import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button,
    Chip,
    Pagination,
    Progress,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
} from '@heroui/react';
import {
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    CheckBadgeIcon,
    ClockIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const getMatchColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
};

const getStatusColor = (status) => {
    switch (status) {
        case 'approved': return 'success';
        case 'in_progress': return 'primary';
        case 'pending': return 'warning';
        case 'rejected': return 'danger';
        default: return 'default';
    }
};

const TalentMobility = ({ title, recommendations, filters, promotionPipeline }) => {
    const themeRadius = useThemeRadius();
    const { hasAccess, isSuperAdmin } = useHRMAC();
    const canView = hasAccess('hrm.ai-analytics.talent-mobility') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const readyNowCount = useMemo(
        () =>
            (recommendations?.data || []).filter(
                (r) => r.estimated_readiness_months === 0 || r.estimated_readiness_months === null
            ).length,
        [recommendations]
    );

    const inDevelopmentCount = useMemo(
        () =>
            (recommendations?.data || []).filter(
                (r) => r.estimated_readiness_months > 0
            ).length,
        [recommendations]
    );

    const statsData = useMemo(() => [
        {
            title: 'Total Recommendations',
            value: recommendations?.total || 0,
            icon: <RocketLaunchIcon className="w-6 h-6" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'Mobility opportunities identified',
        },
        {
            title: 'Ready Now',
            value: readyNowCount,
            icon: <CheckBadgeIcon className="w-6 h-6" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Immediately eligible',
        },
        {
            title: 'In Development',
            value: inDevelopmentCount,
            icon: <ArrowPathIcon className="w-6 h-6" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Requires development time',
        },
        {
            title: 'Pipeline',
            value: promotionPipeline?.length || 0,
            icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
            description: 'In promotion pipeline',
        },
    ], [recommendations, readyNowCount, inDevelopmentCount, promotionPipeline]);

    const handleFilterChange = (key, value) => {
        router.get(
            route('hrm.ai-analytics.talent-mobility'),
            { ...filters, [key]: value || '' },
            { preserveState: true, replace: true }
        );
    };

    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'recommendation_type', name: 'Type' },
        { uid: 'target_role', name: 'Target Role' },
        { uid: 'match_score', name: 'Match Score' },
        { uid: 'readiness', name: 'Est. Readiness' },
        { uid: 'status', name: 'Status' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div>
                        <p className="font-medium">{item.employee?.full_name}</p>
                        <p className="text-xs text-default-500">
                            {item.employee?.department?.name}
                        </p>
                    </div>
                );
            case 'recommendation_type':
                return (
                    <Chip size="sm" variant="flat" color="secondary">
                        {item.recommendation_type?.replace(/_/g, ' ')}
                    </Chip>
                );
            case 'target_role':
                return (
                    <div>
                        <p className="font-medium text-sm">
                            {item.target_role_name || item.employee?.designation?.title || '—'}
                        </p>
                        {item.employee?.designation?.department?.name && (
                            <p className="text-xs text-default-500">
                                {item.employee.designation.department.name}
                            </p>
                        )}
                    </div>
                );
            case 'match_score':
                return (
                    <Tooltip content={`${item.match_score}% match`}>
                        <div className="flex items-center gap-2 w-32">
                            <Progress
                                value={item.match_score}
                                color={getMatchColor(item.match_score)}
                                size="sm"
                                className="flex-1"
                            />
                            <span className="text-sm font-medium w-10">
                                {item.match_score}%
                            </span>
                        </div>
                    </Tooltip>
                );
            case 'readiness':
                return item.estimated_readiness_months === 0 ||
                    item.estimated_readiness_months === null ? (
                    <Chip size="sm" variant="flat" color="success">
                        Ready Now
                    </Chip>
                ) : (
                    <div className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-default-400" />
                        <span className="text-sm">
                            {item.estimated_readiness_months} mo.
                        </span>
                    </div>
                );
            case 'status':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(item.status)}
                    >
                        {item.status?.replace(/_/g, ' ')}
                    </Chip>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title ?? 'Talent Mobility'} />

            <StandardPageLayout
                title="Talent Mobility"
                subtitle="AI-powered internal mobility and career progression recommendations"
                icon={<RocketLaunchIcon className="w-6 h-6" />}
                iconColorClass="text-secondary"
                iconBgClass="bg-secondary/20"
                stats={<StatsCards stats={statsData} />}
                actions={
                    <Button
                        variant="flat"
                        size={isMobile ? 'sm' : 'md'}
                        onPress={() => router.visit(route('hrm.ai-analytics.dashboard'))}
                    >
                        Back to Dashboard
                    </Button>
                }
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select
                            label="Recommendation Type"
                            placeholder="All Types"
                            selectedKeys={
                                filters?.recommendation_type
                                    ? [filters.recommendation_type]
                                    : []
                            }
                            onSelectionChange={(keys) =>
                                handleFilterChange(
                                    'recommendation_type',
                                    Array.from(keys)[0] || ''
                                )
                            }
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="promotion">Promotion</SelectItem>
                            <SelectItem key="lateral_move">Lateral Move</SelectItem>
                            <SelectItem key="cross_department">Cross Department</SelectItem>
                            <SelectItem key="role_expansion">Role Expansion</SelectItem>
                        </Select>
                    </div>
                }
                ariaLabel="Talent Mobility"
            >
                <Table
                    aria-label="Talent mobility recommendations table"
                    isHeaderSticky
                    classNames={{
                        wrapper: 'shadow-none border border-divider rounded-lg',
                        th: 'bg-default-100 text-default-600 font-semibold',
                        td: 'py-3',
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid}>{column.name}</TableColumn>
                        )}
                    </TableHeader>
                    <TableBody
                        items={recommendations?.data || []}
                        emptyContent="No talent mobility recommendations available"
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

                {recommendations?.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={recommendations.last_page}
                            page={recommendations.current_page}
                            onChange={(page) =>
                                router.get(route('hrm.ai-analytics.talent-mobility'), {
                                    ...filters,
                                    page,
                                })
                            }
                        />
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

TalentMobility.layout = (page) => <App children={page} />;
export default TalentMobility;
