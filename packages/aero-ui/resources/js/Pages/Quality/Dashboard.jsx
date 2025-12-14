import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
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
    BeakerIcon,
    DocumentMagnifyingGlassIcon,
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
    ChartBarSquareIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const QualityDashboard = ({ stats = {}, inspections = [], ncrs = [], auth }) => {
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
            title: "Total Inspections",
            value: stats.total_inspections || 0,
            icon: <BeakerIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: `${stats.completed_inspections || 0} completed this ${period}`,
        },
        {
            title: "Open NCRs",
            value: stats.open_ncrs || 0,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: "text-yellow-400",
            iconBg: "bg-yellow-500/20",
            description: `${stats.critical_ncrs || 0} critical issues`,
        },
        {
            title: "Pass Rate",
            value: `${stats.pass_rate || 0}%`,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: `${stats.pass_rate_change || 0}% vs last ${period}`,
            trend: stats.pass_rate_change > 0 ? 'up' : 'down'
        },
        {
            title: "Pending CAPAs",
            value: stats.pending_capas || 0,
            icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: `${stats.overdue_capas || 0} overdue`,
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

    const getSeverityColor = (severity) => {
        const colors = {
            critical: 'danger',
            major: 'warning',
            minor: 'primary',
            low: 'success'
        };
        return colors[severity] || 'default';
    };

    const getStatusColor = (status) => {
        const colors = {
            passed: 'success',
            failed: 'danger',
            pending: 'warning',
            in_progress: 'primary'
        };
        return colors[status] || 'default';
    };

    return (
        <App>
            <Head title="Quality Dashboard" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quality Dashboard</h1>
                        <p className="mt-1 text-sm text-foreground/60">Monitor inspections, NCRs, and quality metrics</p>
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
                    {/* Recent Inspections */}
                    <Card style={getCardStyle()} className="transition-all duration-200">
                        <CardHeader style={getCardHeaderStyle()} className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BeakerIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Recent Inspections</h3>
                            </div>
                            {hasPermission('quality.inspections.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => router.visit(route('quality.inspections'))}
                                    radius={getThemeRadius()}
                                >
                                    View All
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {inspections && inspections.length > 0 ? (
                                    inspections.slice(0, 5).map((inspection, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-default-100">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{inspection.item_name}</p>
                                                <p className="text-xs text-foreground/60 mt-1">{inspection.inspector}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Chip
                                                    size="sm"
                                                    color={getStatusColor(inspection.status)}
                                                    variant="flat"
                                                >
                                                    {inspection.status}
                                                </Chip>
                                                <span className="text-xs text-foreground/60">{inspection.date}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-foreground/60 py-8">No recent inspections</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Critical NCRs */}
                    <Card style={getCardStyle()} className="transition-all duration-200">
                        <CardHeader style={getCardHeaderStyle()} className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                                <h3 className="text-lg font-semibold">Critical NCRs</h3>
                            </div>
                            {hasPermission('quality.ncr.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => router.visit(route('quality.ncrs'))}
                                    radius={getThemeRadius()}
                                >
                                    View All
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {ncrs && ncrs.length > 0 ? (
                                    ncrs.slice(0, 5).map((ncr, index) => (
                                        <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-default-100">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Chip
                                                        size="sm"
                                                        color={getSeverityColor(ncr.severity)}
                                                        variant="flat"
                                                    >
                                                        {ncr.severity}
                                                    </Chip>
                                                    <span className="text-xs text-foreground/60">NCR-{ncr.id}</span>
                                                </div>
                                                <p className="font-medium text-sm">{ncr.description}</p>
                                                <p className="text-xs text-foreground/60 mt-1">Reported: {ncr.date}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-foreground/60 py-8">No critical NCRs</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Quality Performance Metrics */}
                <Card style={getCardStyle()} className="mt-6 transition-all duration-200">
                    <CardHeader style={getCardHeaderStyle()}>
                        <div className="flex items-center gap-2">
                            <ChartBarSquareIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Quality Performance Metrics</h3>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">First Pass Yield</span>
                                    <span className="text-sm font-bold text-success">{stats.first_pass_yield || 0}%</span>
                                </div>
                                <Progress
                                    value={stats.first_pass_yield || 0}
                                    color="success"
                                    size="sm"
                                    radius={getThemeRadius()}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Defect Rate</span>
                                    <span className="text-sm font-bold text-warning">{stats.defect_rate || 0}%</span>
                                </div>
                                <Progress
                                    value={stats.defect_rate || 0}
                                    color="warning"
                                    size="sm"
                                    radius={getThemeRadius()}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">CAPA Completion</span>
                                    <span className="text-sm font-bold text-primary">{stats.capa_completion || 0}%</span>
                                </div>
                                <Progress
                                    value={stats.capa_completion || 0}
                                    color="primary"
                                    size="sm"
                                    radius={getThemeRadius()}
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Quick Actions */}
                {hasPermission('quality.view') && (
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button
                            color="primary"
                            startContent={<BeakerIcon className="w-4 h-4" />}
                            onPress={() => router.visit(route('quality.inspections.create'))}
                            radius={getThemeRadius()}
                        >
                            New Inspection
                        </Button>
                        <Button
                            color="warning"
                            variant="flat"
                            startContent={<ExclamationTriangleIcon className="w-4 h-4" />}
                            onPress={() => router.visit(route('quality.ncrs.create'))}
                            radius={getThemeRadius()}
                        >
                            Report NCR
                        </Button>
                        <Button
                            color="default"
                            variant="flat"
                            startContent={<ChartBarSquareIcon className="w-4 h-4" />}
                            onPress={() => router.visit(route('quality.analytics'))}
                            radius={getThemeRadius()}
                        >
                            View Analytics
                        </Button>
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default QualityDashboard;
