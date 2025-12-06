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
    TicketIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    UserGroupIcon,
    ChartBarIcon,
    FaceSmileIcon,
    ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const SupportDashboard = ({ stats = {}, recentTickets = [], slaMetrics = [], agentPerformance = [], auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
            setIsLargeScreen(window.innerWidth >= 1280);
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

    const themeRadius = getThemeRadius();

    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.user?.is_super_admin;
    };

    const dashboardStats = useMemo(() => [
        {
            title: "Open Tickets",
            value: stats?.openTickets || 0,
            icon: <TicketIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: `${stats?.newToday || 0} new today`
        },
        {
            title: "Avg Response Time",
            value: stats?.avgResponseTime || "0h",
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Target: 2h"
        },
        {
            title: "Resolved Today",
            value: stats?.resolvedToday || 0,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "This month: " + (stats?.resolvedMonth || 0),
            trend: 'up'
        },
        {
            title: "Customer Satisfaction",
            value: (stats?.csat || 0) + "%",
            icon: <FaceSmileIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Last 30 days"
        }
    ], [stats]);

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

    const getPriorityColor = (priority) => {
        const colors = {
            'urgent': 'danger',
            'high': 'warning',
            'medium': 'primary',
            'low': 'success'
        };
        return colors[priority] || 'default';
    };

    const getStatusColor = (status) => {
        const colors = {
            'open': 'primary',
            'in-progress': 'warning',
            'resolved': 'success',
            'closed': 'default'
        };
        return colors[status] || 'default';
    };

    return (
        <App>
            <Head title="Support Dashboard" />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Page Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            Support Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-default-500">
                            Monitor tickets, response times, and customer satisfaction
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size={isMobile ? "sm" : "md"}
                            variant={selectedPeriod === 'month' ? "solid" : "flat"}
                            color={selectedPeriod === 'month' ? "primary" : "default"}
                            onPress={() => setSelectedPeriod('month')}
                            radius={themeRadius}
                        >
                            Month
                        </Button>
                        <Button
                            size={isMobile ? "sm" : "md"}
                            variant={selectedPeriod === 'year' ? "solid" : "flat"}
                            color={selectedPeriod === 'year' ? "primary" : "default"}
                            onPress={() => setSelectedPeriod('year')}
                            radius={themeRadius}
                        >
                            Year
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-6">
                    <StatsCards stats={dashboardStats} />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Recent Tickets */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()} className="flex justify-between items-center px-6 py-4">
                            <div className="flex items-center gap-2">
                                <TicketIcon className="w-5 h-5 text-blue-500" />
                                <h3 className="text-lg font-semibold">Recent Tickets</h3>
                            </div>
                            {hasPermission('support.tickets.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => router.visit(route('support.tickets.index'))}
                                    radius={themeRadius}
                                >
                                    View All
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody className="px-6 py-4">
                            <div className="space-y-3">
                                {recentTickets.map((ticket, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100 transition-colors cursor-pointer">
                                        <div className="flex-shrink-0">
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={getPriorityColor(ticket.priority)}
                                            >
                                                {ticket.priority}
                                            </Chip>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                #{ticket.id} - {ticket.subject}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Chip size="sm" variant="dot" color={getStatusColor(ticket.status)}>
                                                    {ticket.status}
                                                </Chip>
                                                <span className="text-xs text-default-500">
                                                    {ticket.customer}
                                                </span>
                                            </div>
                                            <p className="text-xs text-default-400 mt-1">
                                                {ticket.timeAgo}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {recentTickets.length === 0 && (
                                    <p className="text-sm text-default-400 text-center py-4">
                                        No recent tickets
                                    </p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* SLA Metrics */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()} className="flex justify-between items-center px-6 py-4">
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-orange-500" />
                                <h3 className="text-lg font-semibold">SLA Performance</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-4">
                            <div className="space-y-4">
                                {slaMetrics.map((metric, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-foreground">
                                                {metric.name}
                                            </span>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={metric.compliance >= 90 ? 'success' : metric.compliance >= 75 ? 'warning' : 'danger'}
                                            >
                                                {metric.compliance}%
                                            </Chip>
                                        </div>
                                        <Progress
                                            value={metric.compliance}
                                            color={metric.compliance >= 90 ? 'success' : metric.compliance >= 75 ? 'warning' : 'danger'}
                                            size="sm"
                                        />
                                        <p className="text-xs text-default-500 mt-1">
                                            Target: {metric.target}
                                        </p>
                                    </div>
                                ))}
                                {slaMetrics.length === 0 && (
                                    <p className="text-sm text-default-400 text-center py-4">
                                        No SLA metrics available
                                    </p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Agent Performance */}
                <Card style={getCardStyle()}>
                    <CardHeader style={getCardHeaderStyle()} className="flex justify-between items-center px-6 py-4">
                        <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-semibold">Agent Performance</h3>
                        </div>
                        {hasPermission('support.agents.view') && (
                            <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                onPress={() => router.visit(route('support.agents.index'))}
                                radius={themeRadius}
                            >
                                View All Agents
                            </Button>
                        )}
                    </CardHeader>
                    <CardBody className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {agentPerformance.map((agent, index) => (
                                <div key={index} className="p-4 rounded-lg bg-default-50">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                            {agent.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {agent.name}
                                            </p>
                                            <p className="text-xs text-default-500">
                                                {agent.role}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-default-500">Tickets Resolved</span>
                                            <span className="font-medium">{agent.ticketsResolved}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-default-500">Avg Response</span>
                                            <span className="font-medium">{agent.avgResponse}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-default-500">CSAT Score</span>
                                            <Chip size="sm" variant="flat" color="success">
                                                {agent.csatScore}%
                                            </Chip>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {agentPerformance.length === 0 && (
                                <div className="col-span-full">
                                    <p className="text-sm text-default-400 text-center py-4">
                                        No agent performance data available
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* View Analytics Button */}
                {hasPermission('support.analytics.view') && (
                    <div className="mt-6 flex justify-center">
                        <Button
                            color="primary"
                            variant="shadow"
                            size="lg"
                            onPress={() => router.visit(route('support.analytics'))}
                            radius={themeRadius}
                            startContent={<ChartBarIcon className="w-5 h-5" />}
                        >
                            View Detailed Analytics
                        </Button>
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default SupportDashboard;
