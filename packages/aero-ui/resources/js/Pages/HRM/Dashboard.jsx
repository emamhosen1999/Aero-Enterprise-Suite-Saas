import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    UserGroupIcon,
    CalendarDaysIcon,
    ClockIcon,
    ChartBarIcon,
    BriefcaseIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    DocumentTextIcon,
    BanknotesIcon,
    PlusIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Progress,
    Chip,
    Avatar,
    Divider,
    Skeleton,
} from "@heroui/react";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import axios from 'axios';

/**
 * HRM Dashboard - For HR Managers and Staff
 * 
 * Shows comprehensive HR analytics:
 * - Employee statistics
 * - Leave management overview
 * - Attendance trends
 * - Department breakdown
 * - Recent HR activities
 * 
 * FOLLOWS LEAVESADMIN.JSX REFERENCE PATTERN
 */
const HRMDashboard = ({ 
    title,
    stats: initialStats = {},
    recentReviews = [],
    upcomingReviews = [],
    pendingLeaves = [],
    departmentStats = [],
}) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isTablet = useMediaQuery('(max-width: 768px)');

    // State for async loaded data
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        onLeaveToday: 0,
        pendingLeaves: 0,
        approvedLeaves: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        averageAttendance: 0,
        openPositions: 0,
        pendingExpenses: 0,
        ...initialStats,
    });
    const [departments, setDepartments] = useState(departmentStats);
    const [recentActivities, setRecentActivities] = useState([]);

    // Get theme-aware card styling
    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    const getCardHeaderStyle = () => ({
        borderColor: `var(--theme-divider, #E4E4E7)`,
        background: `linear-gradient(135deg, 
            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
    });

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.dashboard.stats'));
            if (response.status === 200) {
                setStats(prev => ({ ...prev, ...response.data.stats }));
                setDepartments(response.data.departments || []);
                setRecentActivities(response.data.recentActivities || []);
            }
        } catch (error) {
            console.error('Failed to fetch HRM dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Employees",
            value: stats.totalEmployees || 0,
            icon: <UserGroupIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: `${stats.activeEmployees || 0} active`
        },
        {
            title: "Present Today",
            value: stats.presentToday || 0,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: `${stats.averageAttendance || 0}% avg attendance`
        },
        {
            title: "Pending Leaves",
            value: stats.pendingLeaves || 0,
            icon: <CalendarDaysIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Awaiting approval"
        },
        {
            title: "On Leave Today",
            value: stats.onLeaveToday || 0,
            icon: <ClockIcon />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Employees on leave"
        },
    ], [stats]);

    // Quick actions for HR managers
    const quickActions = [
        { key: 'employees', label: 'View Employees', icon: UserGroupIcon, route: 'hrm.employees.index', color: 'primary' },
        { key: 'leaves', label: 'Manage Leaves', icon: CalendarDaysIcon, route: 'hrm.leaves.admin', color: 'warning' },
        { key: 'attendance', label: 'Attendance', icon: ClockIcon, route: 'hrm.attendance.index', color: 'success' },
        { key: 'payroll', label: 'Payroll', icon: BanknotesIcon, route: 'hrm.payroll.index', color: 'secondary' },
    ];

    // Get leave status color
    const getStatusColor = (status) => {
        const colorMap = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'cancelled': 'default',
        };
        return colorMap[status] || 'default';
    };

    return (
        <>
            <Head title={title || 'HRM Dashboard'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="HRM Dashboard">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="transition-all duration-200" style={getCardStyle()}>
                                {/* Header */}
                                <CardHeader className="border-b p-0" style={getCardHeaderStyle()}>
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div 
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ChartBarIcon 
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        HR Dashboard
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Human Resources Overview & Analytics
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex gap-2 flex-wrap">
                                                {quickActions.slice(0, isMobile ? 2 : 4).map((action) => (
                                                    <Button
                                                        key={action.key}
                                                        color={action.color}
                                                        variant="flat"
                                                        size={isMobile ? "sm" : "md"}
                                                        startContent={<action.icon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route(action.route))}
                                                    >
                                                        {action.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} isLoading={loading} className="mb-6" />

                                    {/* Main Content Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left Column - 2/3 width */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Pending Leave Requests */}
                                            <Card className="border border-divider">
                                                <CardHeader className="flex justify-between items-center px-4 py-3 bg-default-50">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDaysIcon className="w-5 h-5 text-warning" />
                                                        <h3 className="text-md font-semibold">Pending Leave Requests</h3>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="light"
                                                        color="primary"
                                                        endContent={<ArrowRightIcon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route('hrm.leaves.admin'))}
                                                    >
                                                        View All
                                                    </Button>
                                                </CardHeader>
                                                <CardBody className="p-4">
                                                    {loading ? (
                                                        <div className="space-y-3">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="flex items-center gap-3">
                                                                    <Skeleton className="w-10 h-10 rounded-full" />
                                                                    <div className="flex-1 space-y-2">
                                                                        <Skeleton className="h-4 w-3/4 rounded" />
                                                                        <Skeleton className="h-3 w-1/2 rounded" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : pendingLeaves.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {pendingLeaves.slice(0, 5).map((leave, index) => (
                                                                <div key={leave.id || index} className="flex items-center justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar
                                                                            name={leave.employee_name || 'Employee'}
                                                                            size="sm"
                                                                            src={leave.employee_avatar}
                                                                        />
                                                                        <div>
                                                                            <p className="text-sm font-medium">{leave.employee_name}</p>
                                                                            <p className="text-xs text-default-500">
                                                                                {leave.leave_type} • {leave.days} day(s)
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Chip size="sm" color={getStatusColor(leave.status)} variant="flat">
                                                                            {leave.status}
                                                                        </Chip>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-6 text-default-400">
                                                            <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-success" />
                                                            <p>No pending leave requests</p>
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>

                                            {/* Department Overview */}
                                            <Card className="border border-divider">
                                                <CardHeader className="flex justify-between items-center px-4 py-3 bg-default-50">
                                                    <div className="flex items-center gap-2">
                                                        <BriefcaseIcon className="w-5 h-5 text-primary" />
                                                        <h3 className="text-md font-semibold">Department Overview</h3>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="light"
                                                        color="primary"
                                                        endContent={<ArrowRightIcon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route('hrm.departments.index'))}
                                                    >
                                                        Manage
                                                    </Button>
                                                </CardHeader>
                                                <CardBody className="p-4">
                                                    {loading ? (
                                                        <div className="space-y-4">
                                                            {[1, 2, 3, 4].map((i) => (
                                                                <div key={i} className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <Skeleton className="h-4 w-32 rounded" />
                                                                        <Skeleton className="h-4 w-16 rounded" />
                                                                    </div>
                                                                    <Skeleton className="h-2 w-full rounded" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : departments.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {departments.slice(0, 6).map((dept, index) => (
                                                                <div key={dept.id || index}>
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="text-sm font-medium">{dept.name}</span>
                                                                        <span className="text-sm text-default-500">
                                                                            {dept.employee_count || 0} employees
                                                                        </span>
                                                                    </div>
                                                                    <Progress
                                                                        size="sm"
                                                                        value={dept.attendance_rate || 0}
                                                                        color={dept.attendance_rate >= 80 ? 'success' : dept.attendance_rate >= 60 ? 'warning' : 'danger'}
                                                                        className="h-2"
                                                                        aria-label={`${dept.name} attendance rate`}
                                                                    />
                                                                    <p className="text-xs text-default-400 mt-1">
                                                                        {dept.attendance_rate || 0}% attendance rate
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-6 text-default-400">
                                                            <BriefcaseIcon className="w-12 h-12 mx-auto mb-2" />
                                                            <p>No departments configured</p>
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        </div>

                                        {/* Right Column - 1/3 width (Sidebar) */}
                                        <div className="space-y-6">
                                            {/* Attendance Summary */}
                                            <Card className="border border-divider">
                                                <CardHeader className="px-4 py-3 bg-default-50">
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-5 h-5 text-success" />
                                                        <h3 className="text-md font-semibold">Today's Attendance</h3>
                                                    </div>
                                                </CardHeader>
                                                <CardBody className="p-4">
                                                    {loading ? (
                                                        <div className="space-y-4">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="flex justify-between">
                                                                    <Skeleton className="h-4 w-20 rounded" />
                                                                    <Skeleton className="h-6 w-12 rounded" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-default-600">Present</span>
                                                                <Chip color="success" variant="flat" size="sm">
                                                                    {stats.presentToday || 0}
                                                                </Chip>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-default-600">Absent</span>
                                                                <Chip color="danger" variant="flat" size="sm">
                                                                    {stats.absentToday || 0}
                                                                </Chip>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-default-600">Late</span>
                                                                <Chip color="warning" variant="flat" size="sm">
                                                                    {stats.lateToday || 0}
                                                                </Chip>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-default-600">On Leave</span>
                                                                <Chip color="secondary" variant="flat" size="sm">
                                                                    {stats.onLeaveToday || 0}
                                                                </Chip>
                                                            </div>
                                                            <Divider />
                                                            <div className="pt-2">
                                                                <p className="text-xs text-default-500 mb-2">Overall Attendance Rate</p>
                                                                <Progress
                                                                    size="md"
                                                                    value={stats.averageAttendance || 0}
                                                                    color="primary"
                                                                    showValueLabel
                                                                    className="max-w-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>

                                            {/* HR Quick Stats */}
                                            <Card className="border border-divider">
                                                <CardHeader className="px-4 py-3 bg-default-50">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowTrendingUpIcon className="w-5 h-5 text-info" />
                                                        <h3 className="text-md font-semibold">HR Metrics</h3>
                                                    </div>
                                                </CardHeader>
                                                <CardBody className="p-4">
                                                    {loading ? (
                                                        <div className="space-y-3">
                                                            {[1, 2, 3, 4].map((i) => (
                                                                <div key={i} className="flex justify-between">
                                                                    <Skeleton className="h-4 w-28 rounded" />
                                                                    <Skeleton className="h-4 w-8 rounded" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-default-600">Open Positions</span>
                                                                <span className="text-sm font-semibold">{stats.openPositions || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-default-600">Pending Expenses</span>
                                                                <span className="text-sm font-semibold">{stats.pendingExpenses || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-default-600">New Hires (MTD)</span>
                                                                <span className="text-sm font-semibold">{stats.newHiresThisMonth || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-default-600">Upcoming Reviews</span>
                                                                <span className="text-sm font-semibold">{upcomingReviews?.length || 0}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>

                                            {/* Recent Activity */}
                                            <Card className="border border-divider">
                                                <CardHeader className="px-4 py-3 bg-default-50">
                                                    <div className="flex items-center gap-2">
                                                        <DocumentTextIcon className="w-5 h-5 text-default-500" />
                                                        <h3 className="text-md font-semibold">Recent Activity</h3>
                                                    </div>
                                                </CardHeader>
                                                <CardBody className="p-4">
                                                    {loading ? (
                                                        <div className="space-y-3">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="flex gap-3">
                                                                    <Skeleton className="w-8 h-8 rounded-full" />
                                                                    <div className="flex-1 space-y-1">
                                                                        <Skeleton className="h-3 w-full rounded" />
                                                                        <Skeleton className="h-2 w-16 rounded" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : recentActivities.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {recentActivities.slice(0, 5).map((activity, index) => (
                                                                <div key={activity.id || index} className="flex gap-3">
                                                                    <Avatar
                                                                        name={activity.user_name || 'User'}
                                                                        size="sm"
                                                                        src={activity.user_avatar}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm truncate">{activity.description}</p>
                                                                        <p className="text-xs text-default-400">{activity.time_ago}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-sm text-default-400 py-4">
                                                            No recent activity
                                                        </p>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Use App layout wrapper
HRMDashboard.layout = (page) => <App>{page}</App>;

export default HRMDashboard;
