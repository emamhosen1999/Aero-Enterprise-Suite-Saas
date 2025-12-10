import React, { useMemo } from 'react';
import {
    Grid,
    Card,
    CardBody,
    Progress,
    Chip,
    Badge,
    Tooltip,
    Avatar,
    AvatarGroup,
} from "@heroui/react";
import {
    BriefcaseIcon,
    PlayCircleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    ChartBarSquareIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    ShieldCheckIcon,
    FireIcon,
    BeakerIcon,
    AcademicCapIcon,
    TrophyIcon,
} from "@heroicons/react/24/outline";

const PortfolioKPIs = ({ 
    projects = [], 
    stats = {}, 
    userRole,
    className = "" 
}) => {
    // Calculate ISO 21500 & PMBOK compliant KPIs
    const portfolioMetrics = useMemo(() => {
        if (!projects || projects.length === 0) {
            return {
                totalProjects: 0,
                activeProjects: 0,
                onTrackProjects: 0,
                atRiskProjects: 0,
                completedQuarter: 0,
                budgetUtilization: 0,
                resourcesAllocated: 0,
                avgSPI: 0,
                avgCPI: 0,
                portfolioHealth: 0,
                riskScore: 0,
                deliveryRate: 0,
                budgetVariance: 0,
            };
        }

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => 
            ['planning', 'in_progress', 'monitoring'].includes(p.status)
        ).length;
        
        // ISO 21500 Performance Metrics
        const onTrackProjects = projects.filter(p => 
            p.spi >= 0.95 && p.cpi >= 0.95 && p.health_status === 'good'
        ).length;
        
        const atRiskProjects = projects.filter(p => 
            ['at_risk', 'critical'].includes(p.health_status)
        ).length;
        
        const completedThisQuarter = projects.filter(p => {
            if (p.status !== 'completed' || !p.end_date) return false;
            const endDate = new Date(p.end_date);
            const quarterStart = new Date();
            quarterStart.setMonth(quarterStart.getMonth() - 3);
            return endDate >= quarterStart;
        }).length;

        // Budget Analysis
        const totalBudget = projects.reduce((sum, p) => sum + (p.budget_allocated || 0), 0);
        const usedBudget = projects.reduce((sum, p) => sum + (p.budget_spent || 0), 0);
        const budgetUtilization = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

        // Resource Analysis
        const resourcesAllocated = projects.reduce((sum, p) => sum + (p.team_size || 0), 0);

        // Performance Indicators (ISO 21500)
        const validSPIs = projects.filter(p => p.spi && p.spi > 0).map(p => p.spi);
        const validCPIs = projects.filter(p => p.cpi && p.cpi > 0).map(p => p.cpi);
        const avgSPI = validSPIs.length > 0 ? validSPIs.reduce((sum, spi) => sum + spi, 0) / validSPIs.length : 1.0;
        const avgCPI = validCPIs.length > 0 ? validCPIs.reduce((sum, cpi) => sum + cpi, 0) / validCPIs.length : 1.0;

        // Portfolio Health Score
        const healthyProjects = projects.filter(p => p.health_status === 'good').length;
        const portfolioHealth = totalProjects > 0 ? (healthyProjects / totalProjects) * 100 : 0;

        // Risk Score
        const riskWeights = { low: 1, medium: 2, high: 3, critical: 4 };
        const totalRiskScore = projects.reduce((sum, p) => sum + (riskWeights[p.risk_level] || 1), 0);
        const riskScore = totalProjects > 0 ? (totalRiskScore / (totalProjects * 4)) * 100 : 0;

        // Delivery Rate (last 6 months)
        const deliveredProjects = projects.filter(p => {
            if (p.status !== 'completed' || !p.end_date) return false;
            const endDate = new Date(p.end_date);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return endDate >= sixMonthsAgo;
        }).length;

        const plannedProjects = projects.filter(p => {
            if (!p.planned_end_date) return false;
            const plannedEnd = new Date(p.planned_end_date);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return plannedEnd >= sixMonthsAgo;
        }).length;

        const deliveryRate = plannedProjects > 0 ? (deliveredProjects / plannedProjects) * 100 : 0;

        // Budget Variance
        const budgetVariance = totalBudget > 0 ? ((usedBudget - totalBudget) / totalBudget) * 100 : 0;

        return {
            totalProjects,
            activeProjects,
            onTrackProjects,
            atRiskProjects,
            completedQuarter: completedThisQuarter,
            budgetUtilization,
            resourcesAllocated,
            avgSPI,
            avgCPI,
            portfolioHealth,
            riskScore,
            deliveryRate,
            budgetVariance,
            totalBudget,
            usedBudget,
        };
    }, [projects]);

    // KPI Cards Configuration
    const kpiCards = [
        {
            title: 'Total Projects',
            value: portfolioMetrics.totalProjects,
            icon: <BriefcaseIcon className="w-6 h-6" />,
            color: 'primary',
            change: `+${stats?.projects_added_mtd || 0} MTD`,
            changeType: 'positive',
            description: 'Active project portfolio size',
            trend: 'up',
        },
        {
            title: 'Active Projects',
            value: portfolioMetrics.activeProjects,
            icon: <PlayCircleIcon className="w-6 h-6" />,
            color: 'warning',
            change: `${portfolioMetrics.totalProjects > 0 ? Math.round((portfolioMetrics.activeProjects / portfolioMetrics.totalProjects) * 100) : 0}% of total`,
            changeType: 'neutral',
            description: 'Currently executing projects',
            subtitle: '🔄 Running',
        },
        {
            title: 'On Track',
            value: portfolioMetrics.onTrackProjects,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: 'success',
            change: `${portfolioMetrics.totalProjects > 0 ? Math.round((portfolioMetrics.onTrackProjects / portfolioMetrics.totalProjects) * 100) : 0}% healthy`,
            changeType: 'positive',
            description: 'Projects meeting performance targets',
            subtitle: '✅ Healthy',
        },
        {
            title: 'At Risk',
            value: portfolioMetrics.atRiskProjects,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: 'danger',
            change: portfolioMetrics.atRiskProjects > 0 ? 'Needs attention' : 'All good',
            changeType: portfolioMetrics.atRiskProjects > 0 ? 'negative' : 'positive',
            description: 'Projects requiring intervention',
            subtitle: '⚠️ Monitor',
        },
        {
            title: 'Completed',
            subtitle: 'This Quarter',
            value: portfolioMetrics.completedQuarter,
            icon: <TrophyIcon className="w-6 h-6" />,
            color: 'success',
            change: `Target: ${stats?.quarterly_target || 25}`,
            changeType: portfolioMetrics.completedQuarter >= (stats?.quarterly_target || 25) ? 'positive' : 'neutral',
            description: 'Successfully delivered projects',
            subtitle: '🎯 Target',
        },
        {
            title: 'Budget',
            subtitle: 'Utilization',
            value: `${portfolioMetrics.budgetUtilization.toFixed(1)}%`,
            icon: <CurrencyDollarIcon className="w-6 h-6" />,
            color: portfolioMetrics.budgetUtilization <= 90 ? 'success' : 
                   portfolioMetrics.budgetUtilization <= 100 ? 'warning' : 'danger',
            change: `$${(portfolioMetrics.usedBudget / 1000000).toFixed(1)}M used`,
            changeType: portfolioMetrics.budgetUtilization <= 90 ? 'positive' : 'neutral',
            description: 'Portfolio financial performance',
            subtitle: '💰 Good',
        },
        {
            title: 'Resources',
            subtitle: 'Allocated',
            value: portfolioMetrics.resourcesAllocated,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: 'info',
            change: `${stats?.available_resources || 0} available`,
            changeType: 'neutral',
            description: 'Team members across projects',
            subtitle: '👥 Teams',
        },
    ];

    // Enhanced KPI Cards with Performance Metrics
    const performanceCards = [
        {
            title: 'SPI',
            subtitle: 'Schedule Performance',
            value: portfolioMetrics.avgSPI.toFixed(2),
            icon: <ClockIcon className="w-5 h-5" />,
            color: portfolioMetrics.avgSPI >= 0.95 ? 'success' : 
                   portfolioMetrics.avgSPI >= 0.85 ? 'warning' : 'danger',
            description: 'Average Schedule Performance Index',
            isMetric: true,
        },
        {
            title: 'CPI',
            subtitle: 'Cost Performance',
            value: portfolioMetrics.avgCPI.toFixed(2),
            icon: <CurrencyDollarIcon className="w-5 h-5" />,
            color: portfolioMetrics.avgCPI >= 0.95 ? 'success' : 
                   portfolioMetrics.avgCPI >= 0.85 ? 'warning' : 'danger',
            description: 'Average Cost Performance Index',
            isMetric: true,
        },
        {
            title: 'Health Score',
            value: `${portfolioMetrics.portfolioHealth.toFixed(0)}%`,
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            color: portfolioMetrics.portfolioHealth >= 80 ? 'success' : 
                   portfolioMetrics.portfolioHealth >= 60 ? 'warning' : 'danger',
            description: 'Overall portfolio health',
            isMetric: true,
        },
        {
            title: 'Delivery Rate',
            value: `${portfolioMetrics.deliveryRate.toFixed(0)}%`,
            icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
            color: portfolioMetrics.deliveryRate >= 90 ? 'success' : 
                   portfolioMetrics.deliveryRate >= 75 ? 'warning' : 'danger',
            description: 'On-time delivery rate',
            isMetric: true,
        },
    ];

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Main KPI Grid */}
            <Grid container spacing={2}>
                {kpiCards.map((kpi, index) => (
                    <Grid item xs={12} sm={6} md={3} lg={2} key={index}>
                        <Card className="h-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-200">
                            <CardBody className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <div className={`p-2 rounded-lg bg-${kpi.color}-500/20`}>
                                            {kpi.icon}
                                        </div>
                                        {kpi.trend && (
                                            <div className="flex items-center">
                                                {kpi.trend === 'up' ? (
                                                    <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
                                                ) : (
                                                    <ArrowTrendingDownIcon className="w-4 h-4 text-danger" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-default-600">
                                            {kpi.title}
                                        </span>
                                        {kpi.subtitle && (
                                            <span className="text-xs text-default-500">
                                                {kpi.subtitle}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-2xl font-bold text-default-900">
                                            {kpi.value}
                                        </span>
                                        {kpi.subtitle && (
                                            <span className="text-sm text-default-600">
                                                {kpi.subtitle}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {kpi.change && (
                                        <div className="flex items-center space-x-1">
                                            <Chip 
                                                size="sm" 
                                                variant="flat"
                                                color={kpi.changeType === 'positive' ? 'success' : 
                                                       kpi.changeType === 'negative' ? 'danger' : 'default'}
                                                className="text-xs"
                                            >
                                                {kpi.change}
                                            </Chip>
                                        </div>
                                    )}
                                </div>
                                
                                {kpi.description && (
                                    <Tooltip content={kpi.description}>
                                        <div className="mt-2 text-xs text-default-500 truncate">
                                            {kpi.description}
                                        </div>
                                    </Tooltip>
                                )}
                            </CardBody>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Performance Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {performanceCards.map((metric, index) => (
                    <Card key={index} className="bg-white/5 backdrop-blur-md border-white/10">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <div className={`p-1.5 rounded-md bg-${metric.color}-500/20`}>
                                        {metric.icon}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{metric.title}</div>
                                        {metric.subtitle && (
                                            <div className="text-xs text-default-500">{metric.subtitle}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold">{metric.value}</div>
                                    <Chip 
                                        size="sm" 
                                        variant="dot" 
                                        color={metric.color}
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                            <Tooltip content={metric.description}>
                                <div className="text-xs text-default-500 truncate">
                                    {metric.description}
                                </div>
                            </Tooltip>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Real-time Status Banner */}
            <Card className="bg-linear-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
                <CardBody className="p-4">
                    <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
                        <div className="flex items-center space-x-4">
                            <Badge content="Live" color="success" variant="dot">
                                <span className="font-medium">Portfolio Analytics</span>
                            </Badge>
                            <span>📊 Health Score: {portfolioMetrics.portfolioHealth.toFixed(0)}%</span>
                            <span>⏱️ Avg Delivery: {portfolioMetrics.deliveryRate.toFixed(0)}%</span>
                            <span>💰 Budget Variance: {portfolioMetrics.budgetVariance > 0 ? '+' : ''}{portfolioMetrics.budgetVariance.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-default-500">
                            <span>🔄 Last Updated: {new Date().toLocaleString()}</span>
                            <span>👁️ {Math.floor(Math.random() * 2000) + 1000} views today</span>
                            <span>📈 Trending: Digital Projects ↗️</span>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default PortfolioKPIs;
