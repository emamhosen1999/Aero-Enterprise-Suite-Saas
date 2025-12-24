import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Progress,
    Button,
} from "@heroui/react";
import {
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    DocumentCheckIcon,
    ClockIcon,
    ChartBarSquareIcon,
    UserGroupIcon,
    DocumentTextIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const ComplianceDashboard = ({ stats = {}, policies = [], audits = [], risks = [], auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
            setIsLargeScreen(window.innerWidth >= 1024);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.user?.is_super_admin;
    };

    const dashboardStats = useMemo(() => [
        {
            title: "Compliance Score",
            value: `${stats.compliance_score || 0}%`,
            icon: <ShieldCheckIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: `${stats.score_change || 0}% vs last ${period}`,
            trend: stats.score_change > 0 ? 'up' : 'down'
        },
        {
            title: "Active Policies",
            value: stats.active_policies || 0,
            icon: <DocumentTextIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: `${stats.pending_reviews || 0} pending review`,
        },
        {
            title: "Open Risks",
            value: stats.open_risks || 0,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: "text-yellow-400",
            iconBg: "bg-yellow-500/20",
            description: `${stats.high_risks || 0} high priority`,
        },
        {
            title: "Training Completion",
            value: `${stats.training_completion || 0}%`,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: `${stats.pending_training || 0} pending`,
        },
    ], [stats, period]);

    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        transform: `scale(var(--scale, 1))`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    const getCardHeaderStyle = () => ({
        borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
    });

    const getRiskColor = (level) => {
        const colors = {
            critical: 'danger',
            high: 'warning',
            medium: 'primary',
            low: 'success'
        };
        return colors[level] || 'default';
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'success',
            pending: 'warning',
            expired: 'danger',
            draft: 'default'
        };
        return colors[status] || 'default';
    };

    return (
        <App>
            <Head title="Compliance Dashboard" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Compliance Dashboard</h1>
                        <p className="mt-1 text-sm text-foreground/60">Monitor compliance status, policies, and risk management</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-2">
                        <Button
                            size="sm"
                            variant={period === 'month' ? 'solid' : 'flat'}
                            color="primary"
                            onPress={() => setPeriod('month')}
                            radius={getThemeRadius()}
                        >
                            Month
                        </Button>
                        <Button
                            size="sm"
                            variant={period === 'year' ? 'solid' : 'flat'}
                            color="primary"
                            onPress={() => setPeriod('year')}
                            radius={getThemeRadius()}
                        >
                            Year
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <StatsCards stats={dashboardStats} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Recent Policy Updates */}
                    <Card style={getCardStyle()} className="transition-all duration-200">
                        <CardHeader style={getCardHeaderStyle()} className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Recent Policy Updates</h3>
                            </div>
                            {hasPermission('compliance.policies.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => safeNavigate('compliance.policies')}
                                    radius={getThemeRadius()}
                                >
                                    View All
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {policies && policies.length > 0 ? (
                                    policies.slice(0, 5).map((policy, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-default-100">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{policy.title}</p>
                                                <p className="text-xs text-foreground/60 mt-1">Updated: {policy.updated_at}</p>
                                            </div>
                                            <Chip
                                                size="sm"
                                                color={getStatusColor(policy.status)}
                                                variant="flat"
                                            >
                                                {policy.status}
                                            </Chip>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-foreground/60 py-8">No recent policy updates</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* High Priority Risks */}
                    <Card style={getCardStyle()} className="transition-all duration-200">
                        <CardHeader style={getCardHeaderStyle()} className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                                <h3 className="text-lg font-semibold">High Priority Risks</h3>
                            </div>
                            {hasPermission('compliance.risks.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => safeNavigate('compliance.risks')}
                                    radius={getThemeRadius()}
                                >
                                    View All
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {risks && risks.length > 0 ? (
                                    risks.slice(0, 5).map((risk, index) => (
                                        <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-default-100">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Chip
                                                        size="sm"
                                                        color={getRiskColor(risk.level)}
                                                        variant="flat"
                                                    >
                                                        {risk.level}
                                                    </Chip>
                                                    <span className="text-xs text-foreground/60">Risk-{risk.id}</span>
                                                </div>
                                                <p className="font-medium text-sm">{risk.description}</p>
                                                <p className="text-xs text-foreground/60 mt-1">Owner: {risk.owner}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-foreground/60 py-8">No high priority risks</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Upcoming Audits */}
                <Card style={getCardStyle()} className="mt-6 transition-all duration-200">
                    <CardHeader style={getCardHeaderStyle()}>
                        <div className="flex items-center gap-2">
                            <DocumentCheckIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Upcoming Audits</h3>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {audits && audits.length > 0 ? (
                                audits.slice(0, 3).map((audit, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-default-100">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
                                                <span className="text-2xl font-bold text-primary">{audit.day}</span>
                                                <span className="text-xs text-foreground/60">{audit.month}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{audit.title}</p>
                                                <p className="text-sm text-foreground/60 mt-1">{audit.auditor}</p>
                                                <p className="text-xs text-foreground/60 mt-1">Type: {audit.type}</p>
                                            </div>
                                        </div>
                                        <Chip
                                            size="sm"
                                            color={audit.days_until <= 7 ? 'warning' : 'success'}
                                            variant="flat"
                                        >
                                            {audit.days_until} days
                                        </Chip>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-foreground/60 py-8">No upcoming audits scheduled</p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Compliance Metrics */}
                <Card style={getCardStyle()} className="mt-6 transition-all duration-200">
                    <CardHeader style={getCardHeaderStyle()}>
                        <div className="flex items-center gap-2">
                            <ChartBarSquareIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Compliance Metrics</h3>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Policy Compliance</span>
                                    <span className="text-sm font-bold text-success">{stats.policy_compliance || 0}%</span>
                                </div>
                                <Progress
                                    value={stats.policy_compliance || 0}
                                    color="success"
                                    size="sm"
                                    radius={getThemeRadius()}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Audit Pass Rate</span>
                                    <span className="text-sm font-bold text-primary">{stats.audit_pass_rate || 0}%</span>
                                </div>
                                <Progress
                                    value={stats.audit_pass_rate || 0}
                                    color="primary"
                                    size="sm"
                                    radius={getThemeRadius()}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Risk Mitigation</span>
                                    <span className="text-sm font-bold text-warning">{stats.risk_mitigation || 0}%</span>
                                </div>
                                <Progress
                                    value={stats.risk_mitigation || 0}
                                    color="warning"
                                    size="sm"
                                    radius={getThemeRadius()}
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Quick Actions */}
                {hasPermission('compliance.view') && (
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button
                            color="primary"
                            startContent={<DocumentTextIcon className="w-4 h-4" />}
                            onPress={() => safeNavigate('compliance.policies.create')}
                            radius={getThemeRadius()}
                        >
                            New Policy
                        </Button>
                        <Button
                            color="warning"
                            variant="flat"
                            startContent={<ExclamationTriangleIcon className="w-4 h-4" />}
                            onPress={() => safeNavigate('compliance.risks.create')}
                            radius={getThemeRadius()}
                        >
                            Report Risk
                        </Button>
                        <Button
                            color="default"
                            variant="flat"
                            startContent={<ChartBarSquareIcon className="w-4 h-4" />}
                            onPress={() => safeNavigate('compliance.reports')}
                            radius={getThemeRadius()}
                        >
                            View Reports
                        </Button>
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default ComplianceDashboard;
