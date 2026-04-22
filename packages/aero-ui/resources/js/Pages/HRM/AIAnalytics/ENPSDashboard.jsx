import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button,
    Chip,
    Pagination,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from '@heroui/react';
import {
    ArrowTrendingUpIcon,
    ChartBarIcon,
    FaceSmileIcon,
    FaceFrownIcon,
    HandThumbUpIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const getEnpsColor = (score) => {
    if (score >= 50) return 'success';
    if (score >= 20) return 'primary';
    if (score >= 0) return 'warning';
    return 'danger';
};

const ENPSDashboard = ({ title, enps, trend, departmentBreakdown, surveys, departments, filters }) => {
    const themeRadius = useThemeRadius();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 640);
        checkScreen();
        window.addEventListener('resize', checkScreen);

        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    const statsData = useMemo(
        () => [
            {
                title: 'eNPS Score',
                value: enps?.score ?? 0,
                icon: <ChartBarIcon className="w-6 h-6" />,
                color: enps?.score >= 0 ? 'text-primary' : 'text-danger',
                iconBg: enps?.score >= 0 ? 'bg-primary/20' : 'bg-danger/20',
                description: 'Promoters % - Detractors %',
            },
            {
                title: 'Promoters',
                value: `${enps?.promoters ?? 0} (${enps?.promoters_pct ?? 0}%)`,
                icon: <HandThumbUpIcon className="w-6 h-6" />,
                color: 'text-success',
                iconBg: 'bg-success/20',
                description: 'Scores 9-10',
            },
            {
                title: 'Passives',
                value: `${enps?.passives ?? 0} (${enps?.passives_pct ?? 0}%)`,
                icon: <FaceSmileIcon className="w-6 h-6" />,
                color: 'text-warning',
                iconBg: 'bg-warning/20',
                description: 'Scores 7-8',
            },
            {
                title: 'Detractors',
                value: `${enps?.detractors ?? 0} (${enps?.detractors_pct ?? 0}%)`,
                icon: <FaceFrownIcon className="w-6 h-6" />,
                color: 'text-danger',
                iconBg: 'bg-danger/20',
                description: 'Scores 0-6',
            },
            {
                title: 'Responses',
                value: enps?.total_responses ?? 0,
                icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
                color: 'text-secondary',
                iconBg: 'bg-secondary/20',
                description: 'Total valid responses',
            },
        ],
        [enps]
    );

    const handleFilterChange = (field, value) => {
        router.get(
            route('hrm.ai-analytics.enps'),
            {
                ...filters,
                [field]: value || '',
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    return (
        <>
            <Head title={title ?? 'eNPS Dashboard'} />

            <StandardPageLayout
                title="eNPS Dashboard"
                subtitle="Employee Net Promoter Score overview and trend"
                icon={<ChartBarIcon className="w-6 h-6" />}
                iconColorClass="text-primary"
                iconBgClass="bg-primary/20"
                actions={
                    <Button
                        variant="flat"
                        size={isMobile ? 'sm' : 'md'}
                        onPress={() => router.visit(route('hrm.ai-analytics.dashboard'))}
                    >
                        Back to AI Dashboard
                    </Button>
                }
                stats={<StatsCards stats={statsData} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select
                            label="Survey"
                            placeholder="All Surveys"
                            selectedKeys={filters?.survey_id ? [String(filters.survey_id)] : []}
                            onSelectionChange={(keys) => handleFilterChange('survey_id', Array.from(keys)[0] || '')}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            {surveys?.map((survey) => (
                                <SelectItem key={String(survey.id)}>{survey.title}</SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="Department"
                            placeholder="All Departments"
                            selectedKeys={filters?.department_id ? [String(filters.department_id)] : []}
                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || '')}
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            {departments?.map((department) => (
                                <SelectItem key={String(department.id)}>{department.name}</SelectItem>
                            ))}
                        </Select>
                    </div>
                }
                ariaLabel="eNPS Dashboard"
            >
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Monthly eNPS Trend</h3>
                        <Table
                            aria-label="Monthly eNPS trend table"
                            classNames={{
                                wrapper: 'shadow-none border border-divider rounded-lg',
                                th: 'bg-default-100 text-default-600 font-semibold',
                                td: 'py-3',
                            }}
                        >
                            <TableHeader>
                                <TableColumn>Month</TableColumn>
                                <TableColumn>Avg Score</TableColumn>
                                <TableColumn>Responses</TableColumn>
                                <TableColumn>eNPS</TableColumn>
                            </TableHeader>
                            <TableBody items={trend || []} emptyContent="No trend data available">
                                {(row) => (
                                    <TableRow key={row.month}>
                                        <TableCell>{row.month}</TableCell>
                                        <TableCell>{row.avg_score}</TableCell>
                                        <TableCell>{row.responses}</TableCell>
                                        <TableCell>
                                            <Chip size="sm" color={getEnpsColor(row.enps)} variant="flat">
                                                {row.enps}
                                            </Chip>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-3">Department Breakdown</h3>
                        <Table
                            aria-label="Department eNPS breakdown table"
                            classNames={{
                                wrapper: 'shadow-none border border-divider rounded-lg',
                                th: 'bg-default-100 text-default-600 font-semibold',
                                td: 'py-3',
                            }}
                        >
                            <TableHeader>
                                <TableColumn>Department</TableColumn>
                                <TableColumn>Avg Score</TableColumn>
                                <TableColumn>Responses</TableColumn>
                                <TableColumn>eNPS</TableColumn>
                            </TableHeader>
                            <TableBody
                                items={departmentBreakdown || []}
                                emptyContent="No department data available"
                            >
                                {(row) => (
                                    <TableRow key={row.department_id}>
                                        <TableCell>{row.department_name}</TableCell>
                                        <TableCell>{row.avg_score}</TableCell>
                                        <TableCell>{row.responses}</TableCell>
                                        <TableCell>
                                            <Chip size="sm" color={getEnpsColor(row.enps)} variant="flat">
                                                {row.enps}
                                            </Chip>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </StandardPageLayout>
        </>
    );
};

ENPSDashboard.layout = (page) => <App children={page} />;

export default ENPSDashboard;
