import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from '@heroui/react';
import {
    ArrowTrendingUpIcon,
    BuildingOfficeIcon,
    ChatBubbleLeftEllipsisIcon,
    ExclamationCircleIcon,
    FaceSmileIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const getSentimentColor = (score) => {
    if (score >= 7) return 'success';
    if (score >= 5) return 'primary';
    if (score >= 3) return 'warning';
    return 'danger';
};

const getSeverityColor = (severity) => {
    switch (severity) {
        case 'critical': return 'danger';
        case 'high': return 'warning';
        case 'moderate': return 'primary';
        default: return 'success';
    }
};

const EngagementSentiment = ({ title, organizationTrends, departmentSentiments, engagementIssues }) => {
    const themeRadius = useThemeRadius();
    const { hasAccess, isSuperAdmin } = useHRMAC();
    const canView = hasAccess('hrm.ai-analytics.engagement') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const hasData = organizationTrends?.has_data ?? false;
    const avgScore = organizationTrends?.avg_score ?? 0;
    const sentimentDist = organizationTrends?.sentiment_distribution || {};

    const statsData = useMemo(() => [
        {
            title: 'Avg Sentiment',
            value: hasData ? avgScore.toFixed(1) : '—',
            icon: <FaceSmileIcon className="w-6 h-6" />,
            color: hasData ? `text-${getSentimentColor(avgScore)}` : 'text-default-400',
            iconBg: hasData ? `bg-${getSentimentColor(avgScore)}/20` : 'bg-default-100',
            description: 'Organisation-wide average',
        },
        {
            title: 'Positive',
            value: sentimentDist.positive ?? 0,
            icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Score ≥ 7',
        },
        {
            title: 'Neutral',
            value: sentimentDist.neutral ?? 0,
            icon: <ChatBubbleLeftEllipsisIcon className="w-6 h-6" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'Score 5–6',
        },
        {
            title: 'Negative',
            value: sentimentDist.negative ?? 0,
            icon: <ExclamationCircleIcon className="w-6 h-6" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Score < 5',
        },
        {
            title: 'Issues Found',
            value: engagementIssues?.length ?? 0,
            icon: <ExclamationCircleIcon className="w-6 h-6" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Requires attention',
        },
    ], [hasData, avgScore, sentimentDist, engagementIssues]);

    const departmentColumns = [
        { uid: 'department', name: 'Department' },
        { uid: 'avg_score', name: 'Avg Score' },
        { uid: 'sentiment', name: 'Sentiment' },
        { uid: 'responses', name: 'Responses' },
    ];

    const renderDepartmentCell = (item, columnKey) => {
        switch (columnKey) {
            case 'department':
                return (
                    <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-4 h-4 text-default-400 shrink-0" />
                        <span className="font-medium">{item.department?.name || item.department_name || '—'}</span>
                    </div>
                );
            case 'avg_score':
                return item.has_data ? (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={getSentimentColor(item.average_score)}
                    >
                        {Number(item.average_score).toFixed(1)}
                    </Chip>
                ) : (
                    <span className="text-default-400 text-sm">No data</span>
                );
            case 'sentiment':
                return item.has_data ? (
                    <Chip
                        size="sm"
                        variant="dot"
                        color={getSentimentColor(item.average_score)}
                    >
                        {item.average_score >= 7
                            ? 'Positive'
                            : item.average_score >= 5
                            ? 'Neutral'
                            : 'Negative'}
                    </Chip>
                ) : null;
            case 'responses':
                return item.response_count ?? '—';
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title ?? 'Engagement & Sentiment'} />

            <StandardPageLayout
                title="Engagement & Sentiment"
                subtitle="Organisation-wide employee engagement and sentiment analysis"
                icon={<ChatBubbleLeftEllipsisIcon className="w-6 h-6" />}
                iconColorClass="text-primary"
                iconBgClass="bg-primary/20"
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
                ariaLabel="Engagement & Sentiment"
            >
                {!hasData ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <ChatBubbleLeftEllipsisIcon className="w-12 h-12 text-default-300" />
                        <p className="text-default-500 text-sm">
                            No sentiment data available yet. Data will appear once engagement surveys are completed.
                        </p>
                        <Button
                            variant="flat"
                            color="primary"
                            onPress={() => router.visit(route('hrm.ai-analytics.dashboard'))}
                        >
                            Back to AI Dashboard
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Department Breakdown */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3">Department Sentiment Breakdown</h3>
                            <Table
                                aria-label="Department sentiment breakdown"
                                isHeaderSticky
                                classNames={{
                                    wrapper: 'shadow-none border border-divider rounded-lg',
                                    th: 'bg-default-100 text-default-600 font-semibold',
                                    td: 'py-3',
                                }}
                            >
                                <TableHeader columns={departmentColumns}>
                                    {(column) => (
                                        <TableColumn key={column.uid}>{column.name}</TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody
                                    items={departmentSentiments || []}
                                    emptyContent="No department sentiment data available"
                                >
                                    {(item, index) => (
                                        <TableRow key={item.department?.id ?? index}>
                                            {(columnKey) => (
                                                <TableCell>
                                                    {renderDepartmentCell(item, columnKey)}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Engagement Issues */}
                        {engagementIssues && engagementIssues.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3">
                                    Identified Engagement Issues
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {engagementIssues.map((issue, index) => (
                                        <Card
                                            key={index}
                                            className="aero-card"
                                            shadow="none"
                                        >
                                            <CardBody className="p-4 gap-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-semibold text-sm">
                                                        {issue.title || issue.type?.replace(/_/g, ' ')}
                                                    </p>
                                                    {issue.severity && (
                                                        <Chip
                                                            size="sm"
                                                            variant="flat"
                                                            color={getSeverityColor(issue.severity)}
                                                        >
                                                            {issue.severity}
                                                        </Chip>
                                                    )}
                                                </div>
                                                {issue.description && (
                                                    <p className="text-xs text-default-500">
                                                        {issue.description}
                                                    </p>
                                                )}
                                                {issue.affected_count != null && (
                                                    <p className="text-xs text-default-400">
                                                        Affects {issue.affected_count} employee
                                                        {issue.affected_count !== 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

EngagementSentiment.layout = (page) => <App children={page} />;
export default EngagementSentiment;
