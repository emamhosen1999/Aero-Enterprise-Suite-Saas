import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Card, CardBody, CardHeader, 
    Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Input, Select, SelectItem, Progress, Tooltip, Pagination, Spinner
} from "@heroui/react";
import { 
    ExclamationTriangleIcon, MagnifyingGlassIcon, EyeIcon,
    ArrowTrendingDownIcon, ChartBarIcon, UserIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';

const AttritionPredictions = ({ title, predictions, filters, riskDistribution }) => {
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

    const statsData = useMemo(() => [
        { 
            title: "Critical Risk", 
            value: riskDistribution?.critical || 0, 
            icon: <ExclamationTriangleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20",
            description: "80%+ probability"
        },
        { 
            title: "High Risk", 
            value: riskDistribution?.high || 0, 
            icon: <ArrowTrendingDownIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20",
            description: "60-79% probability"
        },
        { 
            title: "Moderate Risk", 
            value: riskDistribution?.moderate || 0, 
            icon: <ChartBarIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20",
            description: "40-59% probability"
        },
        { 
            title: "Low Risk", 
            value: riskDistribution?.low || 0, 
            icon: <UserIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20",
            description: "Below 40%"
        },
    ], [riskDistribution]);

    const getRiskColor = (score) => {
        if (score >= 80) return 'danger';
        if (score >= 60) return 'warning';
        if (score >= 40) return 'secondary';
        return 'success';
    };

    const getRiskLabel = (score) => {
        if (score >= 80) return 'Critical';
        if (score >= 60) return 'High';
        if (score >= 40) return 'Moderate';
        return 'Low';
    };

    const handleFilterChange = (key, value) => {
        router.get(route('hrm.ai-analytics.attrition'), {
            ...filters,
            [key]: value,
        }, { preserveState: true });
    };

    const viewRiskProfile = (employeeId) => {
        router.visit(route('hrm.ai-analytics.employee-risk-profile', { employee: employeeId }));
    };

    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'department', name: 'Department' },
        { uid: 'risk_score', name: 'Risk Score' },
        { uid: 'risk_level', name: 'Risk Level' },
        { uid: 'top_factors', name: 'Top Risk Factors' },
        { uid: 'actions', name: 'Actions' },
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
            case 'risk_score':
                return (
                    <div className="flex items-center gap-2 w-32">
                        <Progress 
                            value={item.attrition_risk_score} 
                            color={getRiskColor(item.attrition_risk_score)}
                            size="sm"
                            className="flex-1"
                        />
                        <span className="text-sm font-medium w-10">{item.attrition_risk_score}%</span>
                    </div>
                );
            case 'risk_level':
                return (
                    <Chip 
                        color={getRiskColor(item.attrition_risk_score)} 
                        variant="flat" 
                        size="sm"
                    >
                        {getRiskLabel(item.attrition_risk_score)}
                    </Chip>
                );
            case 'top_factors':
                const factors = item.attrition_risk_factors || {};
                const sortedFactors = Object.entries(factors)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                return (
                    <div className="flex flex-wrap gap-1">
                        {sortedFactors.map(([key, value]) => (
                            <Tooltip key={key} content={`Score: ${value}`}>
                                <Chip size="sm" variant="bordered">
                                    {key.replace(/_/g, ' ')}
                                </Chip>
                            </Tooltip>
                        ))}
                    </div>
                );
            case 'actions':
                return (
                    <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        onPress={() => viewRiskProfile(item.employee_id)}
                    >
                        <EyeIcon className="w-4 h-4" />
                    </Button>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main">
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card 
                            className="transition-all duration-200"
                            style={{
                                border: `var(--borderWidth, 2px) solid transparent`,
                                borderRadius: `var(--borderRadius, 12px)`,
                                background: `linear-gradient(135deg, 
                                    var(--theme-content1, #FAFAFA) 20%, 
                                    var(--theme-content2, #F4F4F5) 10%)`,
                            }}
                        >
                            <CardHeader className="border-b p-0" style={{ borderColor: `var(--theme-divider)` }}>
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{ background: `color-mix(in srgb, var(--theme-danger) 15%, transparent)` }}
                                            >
                                                <ArrowTrendingDownIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'} text-danger`} />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Attrition Predictions
                                                </h4>
                                                <p className="text-sm text-default-500">
                                                    AI-powered employee retention risk analysis
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="flat" 
                                            onPress={() => router.visit(route('hrm.ai-analytics.dashboard'))}
                                            size={isMobile ? "sm" : "md"}
                                        >
                                            Back to Dashboard
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <StatsCards stats={statsData} className="mb-6" />

                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Select
                                        label="Risk Level"
                                        placeholder="All Risk Levels"
                                        selectedKeys={filters?.risk_level ? [filters.risk_level] : []}
                                        onSelectionChange={(keys) => handleFilterChange('risk_level', Array.from(keys)[0])}
                                        radius={getThemeRadius()}
                                        className="max-w-xs"
                                    >
                                        <SelectItem key="critical">Critical (80%+)</SelectItem>
                                        <SelectItem key="high">High (60-79%)</SelectItem>
                                        <SelectItem key="moderate">Moderate (40-59%)</SelectItem>
                                        <SelectItem key="low">Low (&lt;40%)</SelectItem>
                                    </Select>
                                </div>

                                {/* Table */}
                                <Table
                                    aria-label="Attrition predictions table"
                                    isHeaderSticky
                                    classNames={{
                                        wrapper: "shadow-none border border-divider rounded-lg",
                                        th: "bg-default-100 text-default-600 font-semibold",
                                        td: "py-3"
                                    }}
                                >
                                    <TableHeader columns={columns}>
                                        {(column) => (
                                            <TableColumn key={column.uid}>
                                                {column.name}
                                            </TableColumn>
                                        )}
                                    </TableHeader>
                                    <TableBody 
                                        items={predictions?.data || []} 
                                        emptyContent="No attrition risk data available"
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
                                {predictions?.last_page > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            total={predictions.last_page}
                                            page={predictions.current_page}
                                            onChange={(page) => router.get(route('hrm.ai-analytics.attrition'), { ...filters, page })}
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

AttritionPredictions.layout = (page) => <App children={page} />;
export default AttritionPredictions;
