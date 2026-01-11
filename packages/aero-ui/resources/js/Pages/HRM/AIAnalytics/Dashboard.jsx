import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Card, CardBody, CardHeader, 
    Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Tooltip, Progress, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import { 
    ChartBarIcon, ExclamationTriangleIcon, UserGroupIcon, 
    LightBulbIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
    SparklesIcon, EyeIcon, CheckCircleIcon, ClockIcon,
    BoltIcon, HeartIcon, ArrowsRightLeftIcon, FaceSmileIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';

const AIAnalyticsDashboard = ({ title, stats, recentInsights, highRiskEmployees }) => {
    const { auth } = usePage().props;

    // Theme radius helper
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

    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Stats data for StatsCards
    const statsData = useMemo(() => [
        { 
            title: "Total Employees", 
            value: stats?.total_employees || 0, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "High Attrition Risk", 
            value: stats?.high_attrition_risk || 0, 
            icon: <ExclamationTriangleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "High Burnout Risk", 
            value: stats?.high_burnout_risk || 0, 
            icon: <HeartIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Avg Engagement", 
            value: `${stats?.average_engagement || 0}%`, 
            icon: <FaceSmileIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Pending Insights", 
            value: stats?.unresolved_insights || 0, 
            icon: <LightBulbIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
        { 
            title: "Mobility Recommendations", 
            value: stats?.pending_recommendations || 0, 
            icon: <ArrowsRightLeftIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
    ], [stats]);

    // Quick action cards
    const quickActions = [
        { 
            title: 'Attrition Predictions', 
            description: 'AI-powered employee retention risk analysis',
            icon: <ArrowTrendingDownIcon className="w-8 h-8" />,
            color: 'danger',
            href: route('hrm.ai-analytics.attrition')
        },
        { 
            title: 'Burnout Risk', 
            description: 'Workload and wellness monitoring',
            icon: <BoltIcon className="w-8 h-8" />,
            color: 'warning',
            href: route('hrm.ai-analytics.burnout')
        },
        { 
            title: 'Talent Mobility', 
            description: 'Smart internal opportunity matching',
            icon: <ArrowsRightLeftIcon className="w-8 h-8" />,
            color: 'primary',
            href: route('hrm.ai-analytics.talent-mobility')
        },
        { 
            title: 'Engagement Sentiment', 
            description: 'Continuous feedback analytics',
            icon: <FaceSmileIcon className="w-8 h-8" />,
            color: 'success',
            href: route('hrm.ai-analytics.engagement')
        },
    ];

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'secondary';
            default: return 'default';
        }
    };

    const getRiskColor = (score) => {
        if (score >= 80) return 'danger';
        if (score >= 60) return 'warning';
        if (score >= 40) return 'secondary';
        return 'success';
    };

    const navigateTo = (href) => {
        router.visit(href);
    };

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="AI Analytics Dashboard">
                <div className="space-y-6">
                    {/* Header */}
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
                                fontFamily: `var(--fontFamily, "Inter")`,
                                background: `linear-gradient(135deg, 
                                    var(--theme-content1, #FAFAFA) 20%, 
                                    var(--theme-content2, #F4F4F5) 10%, 
                                    var(--theme-content3, #F1F3F4) 20%)`,
                            }}
                        >
                            <CardHeader 
                                className="border-b p-0"
                                style={{
                                    borderColor: `var(--theme-divider, #E4E4E7)`,
                                    background: `linear-gradient(135deg, 
                                        color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                        color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                }}
                            >
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div 
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <SparklesIcon 
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                    style={{ color: 'var(--theme-primary)' }} 
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    AI Analytics Dashboard
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Next-generation predictive HR intelligence
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 flex-wrap">
                                            <Button 
                                                color="primary" 
                                                variant="shadow"
                                                startContent={<LightBulbIcon className="w-4 h-4" />}
                                                onPress={() => navigateTo(route('hrm.ai-analytics.insights'))}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                View All Insights
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                {/* Stats Cards */}
                                <StatsCards stats={statsData} className="mb-6" />

                                {/* Quick Action Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    {quickActions.map((action, index) => (
                                        <motion.div
                                            key={action.title}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card 
                                                isPressable
                                                onPress={() => navigateTo(action.href)}
                                                className="h-full hover:scale-105 transition-transform"
                                            >
                                                <CardBody className="p-4">
                                                    <div className={`p-3 rounded-xl bg-${action.color}/20 w-fit mb-3`}>
                                                        <div className={`text-${action.color}`}>
                                                            {action.icon}
                                                        </div>
                                                    </div>
                                                    <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                                                    <p className="text-sm text-default-500">{action.description}</p>
                                                </CardBody>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent AI Insights */}
                        <Card className="aero-card">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center gap-2">
                                    <LightBulbIcon className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold">Recent AI Insights</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                {recentInsights?.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentInsights.map((insight) => (
                                            <div 
                                                key={insight.id} 
                                                className="p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors cursor-pointer"
                                                onClick={() => navigateTo(route('hrm.ai-analytics.insights'))}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Chip 
                                                                size="sm" 
                                                                color={getSeverityColor(insight.severity)}
                                                                variant="flat"
                                                            >
                                                                {insight.severity}
                                                            </Chip>
                                                            <span className="text-xs text-default-400">
                                                                {insight.insight_type?.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <p className="font-medium text-sm">{insight.title}</p>
                                                        {insight.employee && (
                                                            <p className="text-xs text-default-500 mt-1">
                                                                {insight.employee.full_name} • {insight.department?.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ClockIcon className="w-4 h-4 text-default-400 shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-default-400">
                                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No pending insights</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* High Risk Employees */}
                        <Card className="aero-card">
                            <CardHeader className="border-b border-divider p-4">
                                <div className="flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                                    <h3 className="font-semibold">High Risk Employees</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                {highRiskEmployees?.length > 0 ? (
                                    <div className="space-y-3">
                                        {highRiskEmployees.map((riskScore) => (
                                            <div 
                                                key={riskScore.id} 
                                                className="p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors cursor-pointer"
                                                onClick={() => navigateTo(route('hrm.ai-analytics.employee-risk-profile', { employee: riskScore.employee_id }))}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{riskScore.employee?.full_name}</p>
                                                        <p className="text-xs text-default-500">
                                                            {riskScore.employee?.department?.name} • {riskScore.employee?.designation?.title}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {riskScore.attrition_risk_score >= 60 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-default-500">Attrition</span>
                                                                <Chip 
                                                                    size="sm" 
                                                                    color={getRiskColor(riskScore.attrition_risk_score)}
                                                                    variant="flat"
                                                                >
                                                                    {riskScore.attrition_risk_score}%
                                                                </Chip>
                                                            </div>
                                                        )}
                                                        {riskScore.burnout_risk_score >= 60 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-default-500">Burnout</span>
                                                                <Chip 
                                                                    size="sm" 
                                                                    color={getRiskColor(riskScore.burnout_risk_score)}
                                                                    variant="flat"
                                                                >
                                                                    {riskScore.burnout_risk_score}%
                                                                </Chip>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-default-400">
                                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No high-risk employees detected</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

AIAnalyticsDashboard.layout = (page) => <App children={page} />;
export default AIAnalyticsDashboard;
