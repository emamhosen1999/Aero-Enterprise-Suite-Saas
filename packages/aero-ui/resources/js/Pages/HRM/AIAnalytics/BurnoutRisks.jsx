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
    BoltIcon,
    ChartBarIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    FireIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const getBurnoutColor = (score) => {
    if (score >= 80) return 'danger';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'primary';
    return 'success';
};

const getBurnoutLabel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
};

const BurnoutRisks = ({ title, risks, filters, riskDistribution, departments }) => {
    const themeRadius = useThemeRadius();
    const { hasAccess, isSuperAdmin } = useHRMAC();
    const canView = hasAccess('hrm.ai-analytics.burnout') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const statsData = useMemo(() => [
        {
            title: 'Critical Risk',
            value: riskDistribution?.critical || 0,
            icon: <FireIcon className="w-6 h-6" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: '80%+ burnout score',
        },
        {
            title: 'High Risk',
            value: riskDistribution?.high || 0,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: '60-79% burnout score',
        },
        {
            title: 'Moderate Risk',
            value: riskDistribution?.moderate || 0,
            icon: <ExclamationCircleIcon className="w-6 h-6" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: '40-59% burnout score',
        },
        {
            title: 'Low Risk',
            value: riskDistribution?.low || 0,
            icon: <UserIcon className="w-6 h-6" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Below 40% burnout score',
        },
    ], [riskDistribution]);

    const handleFilterChange = (key, value) => {
        router.get(
            route('hrm.ai-analytics.burnout'),
            { ...filters, [key]: value || '' },
            { preserveState: true, replace: true }
        );
    };

    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'department', name: 'Department' },
        { uid: 'burnout_score', name: 'Burnout Score' },
        { uid: 'risk_level', name: 'Risk Level' },
        { uid: 'risk_factors', name: 'Risk Factors' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div>
                        <p className="font-medium">{item.employee?.full_name}</p>
                        <p className="text-xs text-default-500">{item.employee?.designation?.title}</p>
                    </div>
                );
            case 'department':
                return item.employee?.department?.name || '-';
            case 'burnout_score':
                return (
                    <div className="flex items-center gap-2 w-36">
                        <Progress
                            value={item.burnout_risk_score}
                            color={getBurnoutColor(item.burnout_risk_score)}
                            size="sm"
                            className="flex-1"
                        />
                        <span className="text-sm font-medium w-10">
                            {item.burnout_risk_score}%
                        </span>
                    </div>
                );
            case 'risk_level':
                return (
                    <Chip
                        color={getBurnoutColor(item.burnout_risk_score)}
                        variant="flat"
                        size="sm"
                    >
                        {getBurnoutLabel(item.burnout_risk_score)}
                    </Chip>
                );
            case 'risk_factors': {
                const factors = item.burnout_risk_factors || {};
                const top = Object.entries(factors)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                return (
                    <div className="flex flex-wrap gap-1">
                        {top.map(([key, value]) => (
                            <Tooltip key={key} content={`Score: ${value}`}>
                                <Chip size="sm" variant="bordered">
                                    {key.replace(/_/g, ' ')}
                                </Chip>
                            </Tooltip>
                        ))}
                        {top.length === 0 && <span className="text-default-400 text-xs">—</span>}
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title ?? 'Burnout Risk Analysis'} />

            <StandardPageLayout
                title="Burnout Risk Analysis"
                subtitle="AI-powered employee burnout detection and prevention insights"
                icon={<FireIcon className="w-6 h-6" />}
                iconColorClass="text-danger"
                iconBgClass="bg-danger/20"
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
                            label="Risk Level"
                            placeholder="All Risk Levels"
                            selectedKeys={filters?.risk_level ? [filters.risk_level] : []}
                            onSelectionChange={(keys) =>
                                handleFilterChange('risk_level', Array.from(keys)[0])
                            }
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="critical">Critical (80%+)</SelectItem>
                            <SelectItem key="high">High (60-79%)</SelectItem>
                            <SelectItem key="moderate">Moderate (40-59%)</SelectItem>
                            <SelectItem key="low">Low (&lt;40%)</SelectItem>
                        </Select>
                        <Select
                            label="Department"
                            placeholder="All Departments"
                            selectedKeys={filters?.department_id ? [String(filters.department_id)] : []}
                            onSelectionChange={(keys) =>
                                handleFilterChange('department_id', Array.from(keys)[0] || '')
                            }
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            {departments?.map((dept) => (
                                <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                            ))}
                        </Select>
                    </div>
                }
                ariaLabel="Burnout Risk Analysis"
            >
                <Table
                    aria-label="Burnout risks table"
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
                        items={risks?.data || []}
                        emptyContent="No burnout risk data available"
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

                {risks?.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={risks.last_page}
                            page={risks.current_page}
                            onChange={(page) =>
                                router.get(route('hrm.ai-analytics.burnout'), {
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

BurnoutRisks.layout = (page) => <App children={page} />;
export default BurnoutRisks;
