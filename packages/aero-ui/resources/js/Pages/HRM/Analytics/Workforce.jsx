import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Progress, Tabs, Tab } from "@heroui/react";
import { 
    ChartPieIcon,
    MagnifyingGlassIcon,
    UserIcon,
    BuildingOfficeIcon,
    CalendarDaysIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ArrowPathIcon,
    DocumentChartBarIcon,
    UsersIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    CurrencyDollarIcon,
    ClockIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const WorkforceOverview = ({ title, departments = [], designations = [], workforceData = {} }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canView } = useHRMAC();
    
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

    // State management
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [filters, setFilters] = useState({ 
        department_id: 'all', 
        date_range: '30',
        employee_type: 'all',
        status: 'all'
    });
    const [stats, setStats] = useState({ 
        total_employees: 0, 
        active_employees: 0, 
        new_hires: 0, 
        terminations: 0,
        avg_tenure: 0,
        turnover_rate: 0,
        headcount_trend: 0,
        diversity_score: 0
    });
    const [analytics, setAnalytics] = useState({
        departmentBreakdown: [],
        designationBreakdown: [],
        ageGroups: [],
        tenureGroups: [],
        performanceDistribution: [],
        salaryRanges: [],
        skillsGaps: [],
        attendanceMetrics: []
    });

    // Permission checks
    const canViewAnalytics = canView('hrm.analytics.workforce');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Employees", 
            value: stats.total_employees, 
            icon: <UsersIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Staff", 
            value: stats.active_employees, 
            icon: <UserIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "New Hires", 
            value: stats.new_hires, 
            icon: <TrendingUpIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Turnover Rate", 
            value: `${stats.turnover_rate}%`, 
            icon: <ArrowPathIcon className="w-6 h-6" />, 
            color: stats.turnover_rate > 15 ? "text-danger" : "text-secondary", 
            iconBg: stats.turnover_rate > 15 ? "bg-danger/20" : "bg-secondary/20" 
        },
    ], [stats]);

    // Chart color schemes
    const colorScheme = ['#006FEE', '#17C964', '#F5A524', '#F31260', '#9353D3', '#45D483'];

    // Data fetching
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.analytics.workforce.data'), {
                params: filters
            });
            if (response.status === 200) {
                setStats(response.data.stats || {});
                setAnalytics(response.data.analytics || {});
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch workforce analytics'
            });
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (canViewAnalytics) {
            fetchAnalytics();
        }
    }, [fetchAnalytics, canViewAnalytics]);

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Chart components
    const DepartmentChart = ({ data }) => (
        <div className="space-y-3">
            {data.map((dept, index) => (
                <div key={dept.department_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: colorScheme[index % colorScheme.length] }}
                        />
                        <span className="text-sm font-medium">{dept.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Progress 
                            value={dept.percentage} 
                            className="w-24"
                            color={index % 2 === 0 ? "primary" : "secondary"}
                            size="sm"
                        />
                        <span className="text-sm text-default-600 min-w-12">{dept.count}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const MetricsGrid = ({ metrics }) => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
                <Card key={index} className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">
                            {metric.value}
                        </div>
                        <div className="text-sm text-default-600">
                            {metric.label}
                        </div>
                        {metric.trend && (
                            <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                                metric.trend > 0 ? 'text-success' : 'text-danger'
                            }`}>
                                {metric.trend > 0 ? (
                                    <TrendingUpIcon className="w-3 h-3" />
                                ) : (
                                    <TrendingDownIcon className="w-3 h-3" />
                                )}
                                {Math.abs(metric.trend)}%
                            </div>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );

    const BreakdownTable = ({ data, title }) => {
        const columns = [
            { uid: 'category', name: 'Category' },
            { uid: 'count', name: 'Count' },
            { uid: 'percentage', name: 'Percentage' },
            { uid: 'trend', name: 'Trend' }
        ];

        const renderCell = (item, columnKey) => {
            switch (columnKey) {
                case 'category':
                    return <span className="font-medium">{item.name}</span>;
                case 'count':
                    return <span className="text-primary font-semibold">{item.count}</span>;
                case 'percentage':
                    return (
                        <div className="flex items-center gap-2">
                            <Progress value={item.percentage} className="w-16" size="sm" />
                            <span className="text-sm">{item.percentage}%</span>
                        </div>
                    );
                case 'trend':
                    return item.trend ? (
                        <Chip 
                            color={item.trend > 0 ? 'success' : 'danger'} 
                            size="sm" 
                            variant="flat"
                            startContent={
                                item.trend > 0 ? 
                                <TrendingUpIcon className="w-3 h-3" /> : 
                                <TrendingDownIcon className="w-3 h-3" />
                            }
                        >
                            {Math.abs(item.trend)}%
                        </Chip>
                    ) : (
                        <span className="text-default-400">-</span>
                    );
                default:
                    return item[columnKey] || '-';
            }
        };

        return (
            <Table aria-label={title}>
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                </TableHeader>
                <TableBody items={data} emptyContent="No data available">
                    {(item) => (
                        <TableRow key={item.id || item.name}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        );
    };

    return (
        <>
            <Head title={title} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Workforce Analytics Overview">
                <div className="space-y-4">
                    <div className="w-full">
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
                                    transform: `scale(var(--scale, 1))`,
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
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ChartPieIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Workforce Overview
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Comprehensive workforce analytics and insights dashboard
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                <Select
                                                    placeholder="Date Range"
                                                    selectedKeys={[filters.date_range]}
                                                    onSelectionChange={(keys) => handleFilterChange('date_range', Array.from(keys)[0])}
                                                    size="sm"
                                                    className="min-w-32"
                                                >
                                                    <SelectItem key="7">Last 7 days</SelectItem>
                                                    <SelectItem key="30">Last 30 days</SelectItem>
                                                    <SelectItem key="90">Last 3 months</SelectItem>
                                                    <SelectItem key="365">Last year</SelectItem>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department_id !== 'all' ? [filters.department_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || 'all')}
                                            className="min-w-48"
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="Employee Type"
                                            selectedKeys={filters.employee_type !== 'all' ? [filters.employee_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('employee_type', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            <SelectItem key="full_time">Full Time</SelectItem>
                                            <SelectItem key="part_time">Part Time</SelectItem>
                                            <SelectItem key="contract">Contract</SelectItem>
                                            <SelectItem key="intern">Intern</SelectItem>
                                        </Select>

                                        <Select
                                            placeholder="Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="inactive">Inactive</SelectItem>
                                            <SelectItem key="terminated">Terminated</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Analytics Tabs */}
                                    <Tabs 
                                        selectedKey={selectedTab} 
                                        onSelectionChange={setSelectedTab}
                                        aria-label="Workforce Analytics"
                                        className="w-full"
                                    >
                                        <Tab key="overview" title="Overview">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="text-lg font-semibold flex items-center gap-2">
                                                            <BuildingOfficeIcon className="w-5 h-5" />
                                                            Department Breakdown
                                                        </h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <DepartmentChart data={analytics.departmentBreakdown || []} />
                                                    </CardBody>
                                                </Card>

                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="text-lg font-semibold flex items-center gap-2">
                                                            <BriefcaseIcon className="w-5 h-5" />
                                                            Role Distribution
                                                        </h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <DepartmentChart data={analytics.designationBreakdown || []} />
                                                    </CardBody>
                                                </Card>

                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="text-lg font-semibold flex items-center gap-2">
                                                            <CalendarDaysIcon className="w-5 h-5" />
                                                            Age Demographics
                                                        </h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <BreakdownTable data={analytics.ageGroups || []} title="Age Groups" />
                                                    </CardBody>
                                                </Card>

                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="text-lg font-semibold flex items-center gap-2">
                                                            <ClockIcon className="w-5 h-5" />
                                                            Tenure Analysis
                                                        </h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <BreakdownTable data={analytics.tenureGroups || []} title="Tenure Groups" />
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>

                                        <Tab key="performance" title="Performance">
                                            <div className="mt-4 space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="text-lg font-semibold">Performance Distribution</h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <BreakdownTable data={analytics.performanceDistribution || []} title="Performance Ratings" />
                                                    </CardBody>
                                                </Card>

                                                <MetricsGrid metrics={[
                                                    { label: 'Avg Performance Score', value: '4.2/5', trend: 5 },
                                                    { label: 'Top Performers', value: '15%', trend: 2 },
                                                    { label: 'Needs Improvement', value: '8%', trend: -3 },
                                                    { label: 'Goal Achievement', value: '87%', trend: 8 }
                                                ]} />
                                            </div>
                                        </Tab>

                                        <Tab key="compensation" title="Compensation">
                                            <div className="mt-4 space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="text-lg font-semibold flex items-center gap-2">
                                                            <CurrencyDollarIcon className="w-5 h-5" />
                                                            Salary Ranges
                                                        </h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <BreakdownTable data={analytics.salaryRanges || []} title="Salary Distribution" />
                                                    </CardBody>
                                                </Card>

                                                <MetricsGrid metrics={[
                                                    { label: 'Avg Salary', value: '$75,500', trend: 3 },
                                                    { label: 'Pay Equity Score', value: '92%', trend: 1 },
                                                    { label: 'Salary Range', value: '$45K-$180K', trend: 0 },
                                                    { label: 'Merit Increases', value: '78%', trend: 12 }
                                                ]} />
                                            </div>
                                        </Tab>

                                        <Tab key="skills" title="Skills & Development">
                                            <div className="mt-4 space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="text-lg font-semibold flex items-center gap-2">
                                                            <AcademicCapIcon className="w-5 h-5" />
                                                            Skills Gap Analysis
                                                        </h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <BreakdownTable data={analytics.skillsGaps || []} title="Critical Skills Gaps" />
                                                    </CardBody>
                                                </Card>

                                                <MetricsGrid metrics={[
                                                    { label: 'Training Hours', value: '24hrs/month', trend: 15 },
                                                    { label: 'Certification Rate', value: '65%', trend: 8 },
                                                    { label: 'Skill Coverage', value: '78%', trend: -2 },
                                                    { label: 'Learning Budget Used', value: '82%', trend: 5 }
                                                ]} />
                                            </div>
                                        </Tab>

                                        <Tab key="attendance" title="Attendance">
                                            <div className="mt-4 space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h5 className="text-lg font-semibold">Attendance Metrics</h5>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <BreakdownTable data={analytics.attendanceMetrics || []} title="Attendance Breakdown" />
                                                    </CardBody>
                                                </Card>

                                                <MetricsGrid metrics={[
                                                    { label: 'Attendance Rate', value: '94.5%', trend: 2 },
                                                    { label: 'Punctuality Rate', value: '87%', trend: -1 },
                                                    { label: 'Avg Work Hours', value: '42.3hrs/week', trend: 1 },
                                                    { label: 'Remote Work %', value: '35%', trend: 20 }
                                                ]} />
                                            </div>
                                        </Tab>
                                    </Tabs>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

WorkforceOverview.layout = (page) => <App children={page} />;
export default WorkforceOverview;