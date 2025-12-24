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
    RocketLaunchIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UserGroupIcon,
    ChartBarIcon,
    CalendarIcon,
    FlagIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const ProjectsDashboard = ({ stats = {}, recentProjects = [], upcomingTasks = [], teamPerformance = [], auth }) => {
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
            title: "Total Projects",
            value: stats?.totalProjects || 0,
            icon: <RocketLaunchIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: `${stats?.activeProjects || 0} active`
        },
        {
            title: "Tasks Due",
            value: stats?.tasksDue || 0,
            icon: <ClockIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "This week"
        },
        {
            title: "Completed",
            value: stats?.completedTasks || 0,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "This month",
            trend: 'up'
        },
        {
            title: "Team Members",
            value: stats?.teamMembers || 0,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: `${stats?.activeMembers || 0} active`
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

    const getStatusColor = (status) => {
        const colors = {
            'on-track': 'success',
            'at-risk': 'warning',
            'delayed': 'danger',
            'completed': 'success',
            'planned': 'default'
        };
        return colors[status] || 'default';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'danger',
            'medium': 'warning',
            'low': 'success'
        };
        return colors[priority] || 'default';
    };

    return (
        <App>
            <Head title="Projects Dashboard" />
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
                            Projects Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-default-500">
                            Track your projects, tasks, and team performance
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
                    {/* Recent Projects */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()} className="flex justify-between items-center px-6 py-4">
                            <div className="flex items-center gap-2">
                                <RocketLaunchIcon className="w-5 h-5 text-blue-500" />
                                <h3 className="text-lg font-semibold">Recent Projects</h3>
                            </div>
                            {hasPermission('projects.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => safeNavigate('projects.index')}
                                    radius={themeRadius}
                                >
                                    View All
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody className="px-6 py-4">
                            <div className="space-y-4">
                                {recentProjects.map((project, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {project.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={getStatusColor(project.status)}
                                                >
                                                    {project.status}
                                                </Chip>
                                                <span className="text-xs text-default-500">
                                                    {project.completion}% complete
                                                </span>
                                            </div>
                                            <Progress
                                                value={project.completion}
                                                color={getStatusColor(project.status)}
                                                size="sm"
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {recentProjects.length === 0 && (
                                    <p className="text-sm text-default-400 text-center py-4">
                                        No recent projects
                                    </p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Upcoming Tasks */}
                    <Card style={getCardStyle()}>
                        <CardHeader style={getCardHeaderStyle()} className="flex justify-between items-center px-6 py-4">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-orange-500" />
                                <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
                            </div>
                            {hasPermission('projects.tasks.view') && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => safeNavigate('projects.tasks.index')}
                                    radius={themeRadius}
                                >
                                    View All
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody className="px-6 py-4">
                            <div className="space-y-3">
                                {upcomingTasks.map((task, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100 transition-colors">
                                        <div className="flex-shrink-0">
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={getPriorityColor(task.priority)}
                                                startContent={<FlagIcon className="w-3 h-3" />}
                                            >
                                                {task.priority}
                                            </Chip>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-default-500 mt-1">
                                                {task.project} • Due: {task.dueDate}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {upcomingTasks.length === 0 && (
                                    <p className="text-sm text-default-400 text-center py-4">
                                        No upcoming tasks
                                    </p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Team Performance */}
                <Card style={getCardStyle()}>
                    <CardHeader style={getCardHeaderStyle()} className="flex justify-between items-center px-6 py-4">
                        <div className="flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-semibold">Team Performance</h3>
                        </div>
                    </CardHeader>
                    <CardBody className="px-6 py-4">
                        <div className="space-y-4">
                            {teamPerformance.map((member, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {member.name}
                                                </p>
                                                <p className="text-xs text-default-500">
                                                    {member.tasksCompleted} tasks completed
                                                </p>
                                            </div>
                                        </div>
                                        <Chip size="sm" variant="flat" color="success">
                                            {member.completionRate}%
                                        </Chip>
                                    </div>
                                    <Progress
                                        value={member.completionRate}
                                        color="success"
                                        size="sm"
                                    />
                                </div>
                            ))}
                            {teamPerformance.length === 0 && (
                                <p className="text-sm text-default-400 text-center py-4">
                                    No team performance data available
                                </p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* View Reports Button */}
                {hasPermission('projects.reports.view') && (
                    <div className="mt-6 flex justify-center">
                        <Button
                            color="primary"
                            variant="shadow"
                            size="lg"
                            onPress={() => safeNavigate('projects.reports')}
                            radius={themeRadius}
                            startContent={<ChartBarIcon className="w-5 h-5" />}
                        >
                            View Detailed Reports
                        </Button>
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default ProjectsDashboard;
