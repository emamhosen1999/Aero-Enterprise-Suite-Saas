import React, { useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    CalendarDaysIcon,
    ClockIcon,
    CurrencyDollarIcon,
    UserIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ArrowRightIcon,
    BriefcaseIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Progress,
    Avatar,
    Divider,
} from "@heroui/react";
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import StatsCards from "@/Components/StatsCards.jsx";
import App from "@/Layouts/App.jsx";

/**
 * Employee Dashboard
 * 
 * A personalized dashboard for regular employees showing their:
 * - Leave balances and pending requests
 * - Attendance summary
 * - Quick actions (apply leave, view payslip, etc.)
 */
const EmployeeDashboard = ({ 
    title,
    employee,
    leaveBalances = [],
    pendingLeaves = [],
    recentLeaves = [],
    todayAttendance,
    attendanceStats = {},
    quickActions = []
}) => {
    const { theme } = useTheme();
    const themeRadius = useThemeRadius();
    const isMobile = useMediaQuery('(max-width: 640px)');
    
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

    // Stats data for the top stats cards
    const statsData = useMemo(() => [
        {
            title: "Present Days",
            value: attendanceStats.present_days || 0,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "This month"
        },
        {
            title: "Total Hours",
            value: Math.round(attendanceStats.total_hours || 0),
            icon: <ClockIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Hours worked this month"
        },
        {
            title: "Late Days",
            value: attendanceStats.late_days || 0,
            icon: <ExclamationCircleIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "This month"
        },
        {
            title: "Pending Leaves",
            value: pendingLeaves.length,
            icon: <CalendarDaysIcon />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Awaiting approval"
        }
    ], [attendanceStats, pendingLeaves]);

    // Status color mapping
    const getStatusColor = (status) => {
        const colorMap = {
            'pending': 'warning',
            'submitted': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'cancelled': 'default',
        };
        return colorMap[status] || 'default';
    };

    // Quick action icon mapping
    const getActionIcon = (iconName) => {
        const iconMap = {
            'CalendarIcon': <CalendarDaysIcon className="w-5 h-5" />,
            'CurrencyDollarIcon': <CurrencyDollarIcon className="w-5 h-5" />,
            'UserIcon': <UserIcon className="w-5 h-5" />,
            'ClockIcon': <ClockIcon className="w-5 h-5" />,
        };
        return iconMap[iconName] || <BriefcaseIcon className="w-5 h-5" />;
    };

    return (
        <>
            <Head title={title || 'My Dashboard'} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Employee Dashboard">
                <div className="space-y-6">
                    {/* Welcome Card with Employee Info */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card className="transition-all duration-200" style={getCardStyle()}>
                            <CardBody className="p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <Avatar
                                        src={employee?.avatar}
                                        name={employee?.name || 'User'}
                                        size="lg"
                                        classNames={{
                                            base: "w-16 h-16 text-large",
                                        }}
                                    />
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-foreground">
                                            Welcome, {employee?.name || 'Employee'}!
                                        </h1>
                                        <div className="flex flex-wrap gap-2 mt-1 text-default-500">
                                            {employee?.department && (
                                                <span className="flex items-center gap-1">
                                                    <BriefcaseIcon className="w-4 h-4" />
                                                    {employee.department}
                                                </span>
                                            )}
                                            {employee?.designation && (
                                                <span className="flex items-center gap-1">
                                                    • {employee.designation}
                                                </span>
                                            )}
                                            {employee?.employee_id && (
                                                <span className="flex items-center gap-1">
                                                    • ID: {employee.employee_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Today's Attendance Status */}
                                    <div className="flex flex-col items-end gap-2">
                                        {todayAttendance ? (
                                            <Chip color="success" variant="flat" size="lg">
                                                <ClockIcon className="w-4 h-4 mr-1" />
                                                Clocked in: {todayAttendance.clock_in}
                                            </Chip>
                                        ) : (
                                            <Chip color="warning" variant="flat" size="lg">
                                                Not clocked in today
                                            </Chip>
                                        )}
                                        {todayAttendance?.clock_out && (
                                            <span className="text-sm text-default-500">
                                                Out: {todayAttendance.clock_out}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <StatsCards stats={statsData} />
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Leave Balances */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="lg:col-span-2"
                        >
                            <Card className="h-full transition-all duration-200" style={getCardStyle()}>
                                <CardHeader className="flex justify-between items-center border-b border-divider p-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarDaysIcon className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Leave Balances</h3>
                                    </div>
                                    <Link href={route('hrm.leave.create')}>
                                        <Button color="primary" size="sm" variant="flat">
                                            Apply Leave
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardBody className="p-4">
                                    {leaveBalances.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {leaveBalances.map((balance, index) => (
                                                <div 
                                                    key={index}
                                                    className="p-4 rounded-lg bg-default-50 dark:bg-default-100/10 border border-default-200"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-medium text-foreground">
                                                            {balance.leave_type || balance.type}
                                                        </span>
                                                        <Chip size="sm" variant="flat" color="primary">
                                                            {balance.remaining || balance.balance || 0} days
                                                        </Chip>
                                                    </div>
                                                    <Progress 
                                                        value={((balance.used || 0) / (balance.total || 1)) * 100}
                                                        color="primary"
                                                        size="sm"
                                                        radius={themeRadius}
                                                        className="mt-2"
                                                    />
                                                    <div className="flex justify-between mt-1 text-xs text-default-500">
                                                        <span>Used: {balance.used || 0}</span>
                                                        <span>Total: {balance.total || 0}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-default-400">
                                            <CalendarDaysIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>No leave balances available</p>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <Card className="h-full transition-all duration-200" style={getCardStyle()}>
                                <CardHeader className="border-b border-divider p-4">
                                    <div className="flex items-center gap-2">
                                        <ChartBarIcon className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                                    </div>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <div className="space-y-3">
                                        {quickActions.map((action) => (
                                            <Link 
                                                key={action.id} 
                                                href={route(action.route)}
                                                className="block"
                                            >
                                                <Button
                                                    fullWidth
                                                    color={action.color || 'primary'}
                                                    variant="flat"
                                                    startContent={getActionIcon(action.icon)}
                                                    endContent={<ArrowRightIcon className="w-4 h-4" />}
                                                    className="justify-between"
                                                >
                                                    {action.label}
                                                </Button>
                                            </Link>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Pending Leave Requests */}
                    {pendingLeaves.length > 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                        >
                            <Card className="transition-all duration-200" style={getCardStyle()}>
                                <CardHeader className="flex justify-between items-center border-b border-divider p-4">
                                    <div className="flex items-center gap-2">
                                        <ExclamationCircleIcon className="w-5 h-5 text-warning" />
                                        <h3 className="text-lg font-semibold">Pending Leave Requests</h3>
                                    </div>
                                    <Chip color="warning" variant="flat" size="sm">
                                        {pendingLeaves.length} pending
                                    </Chip>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <div className="space-y-3">
                                        {pendingLeaves.map((leave) => (
                                            <div 
                                                key={leave.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-default-50 dark:bg-default-100/10 border border-default-200"
                                            >
                                                <div>
                                                    <span className="font-medium">{leave.type}</span>
                                                    <p className="text-sm text-default-500">
                                                        {leave.start_date} - {leave.end_date} ({leave.days} day{leave.days > 1 ? 's' : ''})
                                                    </p>
                                                </div>
                                                <Chip color={getStatusColor(leave.status)} size="sm" variant="flat">
                                                    {leave.status}
                                                </Chip>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}

                    {/* Recent Leave History */}
                    {recentLeaves.length > 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                        >
                            <Card className="transition-all duration-200" style={getCardStyle()}>
                                <CardHeader className="border-b border-divider p-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarDaysIcon className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Recent Leave History</h3>
                                    </div>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="text-left text-xs text-default-500 border-b border-divider">
                                                    <th className="pb-2">Type</th>
                                                    <th className="pb-2">From</th>
                                                    <th className="pb-2">To</th>
                                                    <th className="pb-2">Days</th>
                                                    <th className="pb-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentLeaves.map((leave) => (
                                                    <tr key={leave.id} className="border-b border-default-100 last:border-0">
                                                        <td className="py-3">{leave.type}</td>
                                                        <td className="py-3 text-sm">{leave.start_date}</td>
                                                        <td className="py-3 text-sm">{leave.end_date}</td>
                                                        <td className="py-3 text-sm">{leave.days}</td>
                                                        <td className="py-3">
                                                            <Chip 
                                                                color={getStatusColor(leave.status)} 
                                                                size="sm" 
                                                                variant="flat"
                                                            >
                                                                {leave.status}
                                                            </Chip>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
};

// Use App layout wrapper
EmployeeDashboard.layout = (page) => <App children={page} />;

export default EmployeeDashboard;
