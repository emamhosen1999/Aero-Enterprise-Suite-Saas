import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Select, SelectItem, Skeleton, Progress, Chip } from "@heroui/react";
import { 
    ArrowPathIcon,
    ChartBarIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    ClockIcon,
    BanknotesIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    UserPlusIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const AnalyticsIndex = ({ title }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { isSuperAdmin } = useHRMAC();
    
    // Manual responsive state management (HRMAC pattern)
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

    // Data state
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [analytics, setAnalytics] = useState({
        employees: { total: 0, active: 0, onLeave: 0, newHires: 0 },
        attendance: { presentToday: 0, absentToday: 0, lateToday: 0, averageAttendance: 0 },
        leaves: { pending: 0, approved: 0, rejected: 0, utilizationRate: 0 },
        payroll: { totalSalary: 0, totalDeductions: 0, netPayroll: 0, avgSalary: 0 },
        training: { scheduled: 0, completed: 0, inProgress: 0, completionRate: 0 },
        recruitment: { openPositions: 0, applications: 0, interviews: 0, hired: 0 },
        performance: { reviews: 0, avgRating: 0, topPerformers: 0, needsImprovement: 0 },
        expenses: { pending: 0, approved: 0, totalAmount: 0, avgClaimAmount: 0 }
    });

    // Department breakdown
    const [departmentStats, setDepartmentStats] = useState([]);

    // Main stats
    const statsData = useMemo(() => [
        { 
            title: "Total Employees", 
            value: analytics.employees.total, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20",
            subtitle: `${analytics.employees.active} active`
        },
        { 
            title: "Present Today", 
            value: analytics.attendance.presentToday, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20",
            subtitle: `${analytics.attendance.averageAttendance}% avg attendance`
        },
        { 
            title: "Pending Leaves", 
            value: analytics.leaves.pending, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20",
            subtitle: `${analytics.leaves.approved} approved`
        },
        { 
            title: "Open Positions", 
            value: analytics.recruitment.openPositions, 
            icon: <BriefcaseIcon className="w-6 h-6" />, 
            color: "text-info", 
            iconBg: "bg-info/20",
            subtitle: `${analytics.recruitment.applications} applications`
        },
    ], [analytics]);

    // Fetch analytics data
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.analytics.dashboard'), {
                params: { period }
            });
            if (response.status === 200) {
                setAnalytics(response.data.analytics || analytics);
                setDepartmentStats(response.data.departments || []);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            // Keep default values on error
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Action buttons
    const actionButtons = useMemo(() => (
        <>
            <Button 
                isIconOnly 
                variant="flat" 
                onPress={fetchAnalytics}
                isLoading={loading}
            >
                <ArrowPathIcon className="w-4 h-4" />
            </Button>
        </>
    ), [fetchAnalytics, loading]);

    // Filter section
    const filterSection = useMemo(() => (
        <div className="flex flex-col sm:flex-row gap-4">
            <Select 
                label="Time Period" 
                placeholder="Select period" 
                variant="bordered" 
                size="sm" 
                radius={themeRadius}
                selectedKeys={[period]}
                onSelectionChange={(keys) => setPeriod(Array.from(keys)[0] || 'month')}
                className="w-full sm:w-48"
            >
                <SelectItem key="week">This Week</SelectItem>
                <SelectItem key="month">This Month</SelectItem>
                <SelectItem key="quarter">This Quarter</SelectItem>
                <SelectItem key="year">This Year</SelectItem>
            </Select>
        </div>
    ), [period, themeRadius]);

    // Analytics Card Component
    const AnalyticsCard = ({ title, icon, children, className = "" }) => (
        <Card className={`transition-all duration-200 ${className}`} radius={themeRadius}>
            <CardHeader className="flex gap-3 pb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
            </CardHeader>
            <CardBody className="pt-0">
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-4 w-1/2 rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                    </div>
                ) : children}
            </CardBody>
        </Card>
    );

    // Metric Row Component
    const MetricRow = ({ label, value, subValue, progress, color = "primary" }) => (
        <div className="flex items-center justify-between py-2 border-b border-divider last:border-0">
            <span className="text-sm text-default-600">{label}</span>
            <div className="flex items-center gap-2">
                {progress !== undefined && (
                    <Progress 
                        value={progress} 
                        color={color}
                        className="w-20"
                        size="sm"
                    />
                )}
                <span className="font-semibold">{value}</span>
                {subValue && <span className="text-xs text-default-400">{subValue}</span>}
            </div>
        </div>
    );

    return (
        <>
            <Head title={title || "HRM Analytics"} />
            
            <StandardPageLayout
                title="HRM Analytics"
                subtitle="Comprehensive overview of human resource metrics and trends"
                icon={<ChartBarIcon className="w-6 h-6" />}
                isLoading={false}
                ariaLabel="HRM Analytics Dashboard"
                actions={actionButtons}
                stats={<StatsCards stats={statsData} isLoading={loading} />}
                filters={filterSection}
            >
                {/* Analytics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Attendance Analytics */}
                    <AnalyticsCard 
                        title="Attendance Overview" 
                        icon={<ClockIcon className="w-5 h-5 text-primary" />}
                    >
                        <MetricRow 
                            label="Present Today" 
                            value={analytics.attendance.presentToday}
                            progress={analytics.employees.total > 0 ? (analytics.attendance.presentToday / analytics.employees.total) * 100 : 0}
                            color="success"
                        />
                        <MetricRow 
                            label="Absent Today" 
                            value={analytics.attendance.absentToday}
                            color="danger"
                        />
                        <MetricRow 
                            label="Late Arrivals" 
                            value={analytics.attendance.lateToday}
                            color="warning"
                        />
                        <MetricRow 
                            label="Avg Attendance Rate" 
                            value={`${analytics.attendance.averageAttendance}%`}
                            progress={analytics.attendance.averageAttendance}
                            color="primary"
                        />
                    </AnalyticsCard>

                    {/* Leave Analytics */}
                    <AnalyticsCard 
                        title="Leave Management" 
                        icon={<CalendarDaysIcon className="w-5 h-5 text-primary" />}
                    >
                        <MetricRow 
                            label="Pending Requests" 
                            value={analytics.leaves.pending}
                            color="warning"
                        />
                        <MetricRow 
                            label="Approved This Period" 
                            value={analytics.leaves.approved}
                            color="success"
                        />
                        <MetricRow 
                            label="Rejected" 
                            value={analytics.leaves.rejected}
                            color="danger"
                        />
                        <MetricRow 
                            label="Leave Utilization" 
                            value={`${analytics.leaves.utilizationRate}%`}
                            progress={analytics.leaves.utilizationRate}
                            color="primary"
                        />
                    </AnalyticsCard>

                    {/* Payroll Analytics */}
                    <AnalyticsCard 
                        title="Payroll Summary" 
                        icon={<BanknotesIcon className="w-5 h-5 text-primary" />}
                    >
                        <MetricRow 
                            label="Total Salary" 
                            value={`$${analytics.payroll.totalSalary.toLocaleString()}`}
                        />
                        <MetricRow 
                            label="Total Deductions" 
                            value={`$${analytics.payroll.totalDeductions.toLocaleString()}`}
                            color="danger"
                        />
                        <MetricRow 
                            label="Net Payroll" 
                            value={`$${analytics.payroll.netPayroll.toLocaleString()}`}
                            color="success"
                        />
                        <MetricRow 
                            label="Avg Salary" 
                            value={`$${analytics.payroll.avgSalary.toLocaleString()}`}
                        />
                    </AnalyticsCard>

                    {/* Training Analytics */}
                    <AnalyticsCard 
                        title="Training & Development" 
                        icon={<AcademicCapIcon className="w-5 h-5 text-primary" />}
                    >
                        <MetricRow 
                            label="Scheduled" 
                            value={analytics.training.scheduled}
                        />
                        <MetricRow 
                            label="In Progress" 
                            value={analytics.training.inProgress}
                            color="warning"
                        />
                        <MetricRow 
                            label="Completed" 
                            value={analytics.training.completed}
                            color="success"
                        />
                        <MetricRow 
                            label="Completion Rate" 
                            value={`${analytics.training.completionRate}%`}
                            progress={analytics.training.completionRate}
                            color="success"
                        />
                    </AnalyticsCard>

                    {/* Recruitment Analytics */}
                    <AnalyticsCard 
                        title="Recruitment Pipeline" 
                        icon={<UserPlusIcon className="w-5 h-5 text-primary" />}
                    >
                        <MetricRow 
                            label="Open Positions" 
                            value={analytics.recruitment.openPositions}
                        />
                        <MetricRow 
                            label="Total Applications" 
                            value={analytics.recruitment.applications}
                            color="primary"
                        />
                        <MetricRow 
                            label="Interviews Scheduled" 
                            value={analytics.recruitment.interviews}
                            color="warning"
                        />
                        <MetricRow 
                            label="Hired This Period" 
                            value={analytics.recruitment.hired}
                            color="success"
                        />
                    </AnalyticsCard>

                    {/* Performance Analytics */}
                    <AnalyticsCard 
                        title="Performance Reviews" 
                        icon={<DocumentTextIcon className="w-5 h-5 text-primary" />}
                    >
                        <MetricRow 
                            label="Reviews Conducted" 
                            value={analytics.performance.reviews}
                        />
                        <MetricRow 
                            label="Average Rating" 
                            value={`${analytics.performance.avgRating}/5`}
                            progress={(analytics.performance.avgRating / 5) * 100}
                            color="primary"
                        />
                        <MetricRow 
                            label="Top Performers" 
                            value={analytics.performance.topPerformers}
                            color="success"
                        />
                        <MetricRow 
                            label="Needs Improvement" 
                            value={analytics.performance.needsImprovement}
                            color="warning"
                        />
                    </AnalyticsCard>

                    {/* Expense Claims */}
                    <AnalyticsCard 
                        title="Expense Claims" 
                        icon={<BanknotesIcon className="w-5 h-5 text-primary" />}
                    >
                        <MetricRow 
                            label="Pending Claims" 
                            value={analytics.expenses.pending}
                            color="warning"
                        />
                        <MetricRow 
                            label="Approved Claims" 
                            value={analytics.expenses.approved}
                            color="success"
                        />
                        <MetricRow 
                            label="Total Amount" 
                            value={`$${analytics.expenses.totalAmount.toLocaleString()}`}
                        />
                        <MetricRow 
                            label="Avg Claim Amount" 
                            value={`$${analytics.expenses.avgClaimAmount.toLocaleString()}`}
                        />
                    </AnalyticsCard>

                    {/* Employee Distribution */}
                    <AnalyticsCard 
                        title="Employee Status" 
                        icon={<UserGroupIcon className="w-5 h-5 text-primary" />}
                    >
                        <MetricRow 
                            label="Active Employees" 
                            value={analytics.employees.active}
                            progress={analytics.employees.total > 0 ? (analytics.employees.active / analytics.employees.total) * 100 : 0}
                            color="success"
                        />
                        <MetricRow 
                            label="On Leave" 
                            value={analytics.employees.onLeave}
                            color="warning"
                        />
                        <MetricRow 
                            label="New Hires (Period)" 
                            value={analytics.employees.newHires}
                            color="primary"
                        />
                        <MetricRow 
                            label="Total Headcount" 
                            value={analytics.employees.total}
                        />
                    </AnalyticsCard>

                    {/* Disciplinary Cases */}
                    <AnalyticsCard 
                        title="Disciplinary Cases" 
                        icon={<ExclamationTriangleIcon className="w-5 h-5 text-primary" />}
                    >
                        <div className="flex items-center justify-center py-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-default-700">0</p>
                                <p className="text-sm text-default-500">Active Cases</p>
                                <Chip color="success" variant="flat" size="sm" className="mt-2">
                                    All Clear
                                </Chip>
                            </div>
                        </div>
                    </AnalyticsCard>
                </div>

                {/* Department Breakdown */}
                {departmentStats.length > 0 && (
                    <div className="mt-6">
                        <Card radius={themeRadius}>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Department Breakdown</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {departmentStats.map((dept, index) => (
                                        <div key={index} className="p-4 rounded-lg bg-default-50 border border-divider">
                                            <h4 className="font-medium text-default-700">{dept.name}</h4>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-default-500">Employees</span>
                                                    <span className="font-medium">{dept.employees || 0}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-default-500">Attendance</span>
                                                    <span className="font-medium">{dept.attendance || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

AnalyticsIndex.layout = (page) => <App children={page} />;
export default AnalyticsIndex;
