import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Progress, Tabs, Tab, Textarea, Divider } from "@heroui/react";
import { 
    ChartBarIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    ArrowPathIcon,
    BanknotesIcon,
    DocumentTextIcon,
    UserIcon,
    BuildingOfficeIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CursorArrowRaysIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    Squares2X2Icon,
    PresentationChartBarIcon,
    AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const WorkforceAnalytics = ({ title, departments = [], designations = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canView, canExport } = useHRMAC();
    
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
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPeriod, setSelectedPeriod] = useState('current_month');
    const [chartData, setChartData] = useState({});
    const [kpiMetrics, setKpiMetrics] = useState({});
    const [filters, setFilters] = useState({ 
        department_id: 'all', 
        designation_id: 'all',
        employee_status: 'active',
        period: 'current_month',
        date_from: '',
        date_to: '',
        comparison: 'previous_period'
    });
    const [stats, setStats] = useState({ 
        total_employees: 0,
        active_employees: 0,
        new_hires: 0,
        resignations: 0,
        attendance_rate: 0,
        productivity_score: 0,
        satisfaction_score: 0,
        turnover_rate: 0
    });
    const [analyticsData, setAnalyticsData] = useState({
        headcount: [],
        attendance: [],
        performance: [],
        diversity: [],
        compensation: [],
        turnover: [],
        leave: [],
        training: []
    });
    const [modalStates, setModalStates] = useState({ 
        export: false,
        filters: false,
        chart_settings: false,
        detailed_report: false
    });

    // Permission checks
    const canViewAnalytics = canView('hrm.analytics');
    const canExportReports = canExport('hrm.reports');

    // Configuration
    const timePeriods = [
        { key: 'current_week', label: 'Current Week' },
        { key: 'current_month', label: 'Current Month' },
        { key: 'current_quarter', label: 'Current Quarter' },
        { key: 'current_year', label: 'Current Year' },
        { key: 'last_week', label: 'Last Week' },
        { key: 'last_month', label: 'Last Month' },
        { key: 'last_quarter', label: 'Last Quarter' },
        { key: 'last_year', label: 'Last Year' },
        { key: 'custom', label: 'Custom Range' },
    ];

    const analyticsCategories = [
        { key: 'overview', label: 'Overview', icon: <PresentationChartBarIcon className="w-4 h-4" /> },
        { key: 'headcount', label: 'Headcount Analysis', icon: <UserIcon className="w-4 h-4" /> },
        { key: 'attendance', label: 'Attendance Trends', icon: <CalendarDaysIcon className="w-4 h-4" /> },
        { key: 'performance', label: 'Performance Metrics', icon: <TrendingUpIcon className="w-4 h-4" /> },
        { key: 'diversity', label: 'Diversity & Inclusion', icon: <Squares2X2Icon className="w-4 h-4" /> },
        { key: 'compensation', label: 'Compensation Analysis', icon: <BanknotesIcon className="w-4 h-4" /> },
        { key: 'turnover', label: 'Turnover Analytics', icon: <TrendingDownIcon className="w-4 h-4" /> },
        { key: 'leave', label: 'Leave Analytics', icon: <ClockIcon className="w-4 h-4" /> },
        { key: 'training', label: 'Training Effectiveness', icon: <DocumentTextIcon className="w-4 h-4" /> },
    ];

    const exportFormats = [
        { key: 'pdf', label: 'PDF Report', description: 'Formatted report with charts' },
        { key: 'excel', label: 'Excel Workbook', description: 'Data tables and pivot tables' },
        { key: 'powerpoint', label: 'PowerPoint', description: 'Executive presentation' },
        { key: 'csv', label: 'CSV Data', description: 'Raw data for analysis' },
    ];

    const chartTypes = [
        { key: 'bar', label: 'Bar Chart', icon: '📊' },
        { key: 'line', label: 'Line Chart', icon: '📈' },
        { key: 'pie', label: 'Pie Chart', icon: '🥧' },
        { key: 'area', label: 'Area Chart', icon: '📊' },
        { key: 'scatter', label: 'Scatter Plot', icon: '•' },
        { key: 'heatmap', label: 'Heat Map', icon: '🟩' },
    ];

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Employees", 
            value: stats.total_employees, 
            icon: <UserIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20",
            trend: { value: 12, isPositive: true, period: 'vs last month' }
        },
        { 
            title: "Attendance Rate", 
            value: `${stats.attendance_rate}%`, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20",
            trend: { value: 3.2, isPositive: true, period: 'vs last month' }
        },
        { 
            title: "Productivity Score", 
            value: `${stats.productivity_score}%`, 
            icon: <TrendingUpIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20",
            trend: { value: 1.8, isPositive: false, period: 'vs last quarter' }
        },
        { 
            title: "Turnover Rate", 
            value: `${stats.turnover_rate}%`, 
            icon: <TrendingDownIcon className="w-6 h-6" />, 
            color: stats.turnover_rate > 10 ? "text-danger" : "text-success", 
            iconBg: stats.turnover_rate > 10 ? "bg-danger/20" : "bg-success/20",
            trend: { value: 0.5, isPositive: false, period: 'vs last quarter' }
        },
    ], [stats]);

    // Mock KPI data - in real app this would come from API
    const kpiData = {
        overview: {
            employee_growth: { current: 247, previous: 230, change: 7.4 },
            average_tenure: { current: 3.2, previous: 3.0, change: 6.7 },
            cost_per_employee: { current: 4250, previous: 4180, change: 1.7 },
            satisfaction_index: { current: 8.2, previous: 7.9, change: 3.8 }
        },
        headcount: {
            total_active: 247,
            new_hires_ytd: 32,
            departures_ytd: 15,
            departments: [
                { name: 'Engineering', count: 78, percentage: 31.6 },
                { name: 'Sales', count: 45, percentage: 18.2 },
                { name: 'Marketing', count: 32, percentage: 13.0 },
                { name: 'Operations', count: 28, percentage: 11.3 },
                { name: 'HR', count: 18, percentage: 7.3 },
                { name: 'Finance', count: 15, percentage: 6.1 },
                { name: 'Others', count: 31, percentage: 12.6 }
            ]
        },
        attendance: {
            average_rate: 94.2,
            on_time_rate: 89.7,
            late_arrivals: 156,
            early_departures: 89,
            top_departments: [
                { name: 'Finance', rate: 97.8 },
                { name: 'HR', rate: 96.5 },
                { name: 'Engineering', rate: 93.2 }
            ]
        }
    };

    // Mock chart data generators
    const generateChartData = (type) => {
        switch (type) {
            case 'headcount':
                return {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Total Employees',
                        data: [198, 210, 225, 235, 241, 247],
                        borderColor: '#006FEE',
                        backgroundColor: 'rgba(0, 111, 238, 0.1)'
                    }]
                };
            case 'attendance':
                return {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Attendance Rate (%)',
                        data: [93.5, 94.8, 92.1, 95.2],
                        borderColor: '#17C964',
                        backgroundColor: 'rgba(23, 201, 100, 0.1)'
                    }]
                };
            case 'performance':
                return {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: [{
                        label: 'Avg Performance Score',
                        data: [7.8, 8.1, 8.3, 8.2],
                        borderColor: '#F5A524',
                        backgroundColor: 'rgba(245, 165, 36, 0.1)'
                    }]
                };
            default:
                return {};
        }
    };

    // Calculate trend indicator
    const calculateTrend = (current, previous) => {
        if (!previous || previous === 0) return { change: 0, isPositive: true };
        const change = ((current - previous) / previous * 100).toFixed(1);
        return { change: Math.abs(change), isPositive: change >= 0 };
    };

    const formatNumber = (num, type = 'number') => {
        if (type === 'currency') {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
        }
        if (type === 'percentage') {
            return `${num}%`;
        }
        return new Intl.NumberFormat('en-US').format(num);
    };

    // Data fetching
    const fetchAnalyticsData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.analytics.data'), {
                params: { 
                    period: selectedPeriod,
                    category: activeTab,
                    ...filters
                }
            });
            if (response.status === 200) {
                setAnalyticsData(response.data.analytics || {});
                setChartData(generateChartData(activeTab));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch analytics data'
            });
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedPeriod, filters]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.analytics.kpi'), {
                params: { period: selectedPeriod }
            });
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        fetchAnalyticsData();
        fetchStats();
    }, [fetchAnalyticsData, fetchStats]);

    // Export functionality
    const handleExport = async (format) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.analytics.export'), {
                    format,
                    category: activeTab,
                    period: selectedPeriod,
                    filters
                });
                if (response.status === 200) {
                    // Trigger file download
                    const blob = new Blob([response.data], { type: response.headers['content-type'] });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = response.headers['content-disposition']?.split('filename=')[1] || `analytics-${format}.file`;
                    link.click();
                    window.URL.revokeObjectURL(url);
                    
                    resolve(['Report exported successfully']);
                    closeModal('export');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to export report']);
            }
        });

        showToast.promise(promise, {
            loading: 'Exporting report...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Modal handlers
    const openModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setFilters(prev => ({ ...prev, period }));
    };

    // Render overview dashboard
    const renderOverviewDashboard = () => (
        <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(kpiData.overview).map(([key, data]) => {
                    const trend = calculateTrend(data.current, data.previous);
                    return (
                        <Card key={key}>
                            <CardBody className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-default-500 mb-1">
                                            {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {key.includes('cost') ? formatNumber(data.current, 'currency') : data.current}
                                        </p>
                                    </div>
                                    <Chip 
                                        color={trend.isPositive ? 'success' : 'danger'} 
                                        size="sm" 
                                        variant="flat"
                                        startContent={trend.isPositive ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                                    >
                                        {trend.change}%
                                    </Chip>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Insights */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Key Insights</h3>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-primary">Department Distribution</h4>
                            {kpiData.headcount.departments.slice(0, 5).map(dept => (
                                <div key={dept.name} className="flex justify-between items-center">
                                    <span className="text-sm">{dept.name}</span>
                                    <div className="flex items-center gap-2">
                                        <Progress value={dept.percentage} className="w-20" size="sm" />
                                        <span className="text-sm font-medium">{dept.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="font-medium text-primary">Top Performing Departments (Attendance)</h4>
                            {kpiData.attendance.top_departments.map((dept, index) => (
                                <div key={dept.name} className="flex justify-between items-center">
                                    <span className="text-sm">#{index + 1} {dept.name}</span>
                                    <Chip color="success" size="sm" variant="flat">
                                        {dept.rate}%
                                    </Chip>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Headcount Trend</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 flex items-center justify-center bg-content2 rounded-lg">
                            <div className="text-center text-default-500">
                                <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>Headcount chart would be rendered here</p>
                                <p className="text-sm">Integration with Chart.js/Recharts required</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Attendance Trends</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 flex items-center justify-center bg-content2 rounded-lg">
                            <div className="text-center text-default-500">
                                <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>Attendance trends chart would be rendered here</p>
                                <p className="text-sm">Integration with Chart.js/Recharts required</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );

    // Render category-specific analytics
    const renderCategoryAnalytics = (category) => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold capitalize">{category} Analytics</h3>
                </CardHeader>
                <CardBody>
                    <div className="h-96 flex items-center justify-center bg-content2 rounded-lg">
                        <div className="text-center text-default-500">
                            <ChartBarIcon className="w-16 h-16 mx-auto mb-4" />
                            <h4 className="text-lg font-medium mb-2">Advanced {category} Analytics</h4>
                            <p>Detailed charts and metrics for {category} would be displayed here</p>
                            <p className="text-sm mt-2">
                                Features: Interactive charts, drill-down capabilities, comparative analysis
                            </p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Mock data table for category */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">{category} Data Summary</h3>
                </CardHeader>
                <CardBody>
                    <Table>
                        <TableHeader>
                            <TableColumn>Metric</TableColumn>
                            <TableColumn>Current</TableColumn>
                            <TableColumn>Previous</TableColumn>
                            <TableColumn>Change</TableColumn>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Primary KPI</TableCell>
                                <TableCell>85.2%</TableCell>
                                <TableCell>82.7%</TableCell>
                                <TableCell>
                                    <Chip color="success" size="sm" variant="flat" startContent={<TrendingUpIcon className="w-3 h-3" />}>
                                        +3.0%
                                    </Chip>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Secondary KPI</TableCell>
                                <TableCell>342</TableCell>
                                <TableCell>328</TableCell>
                                <TableCell>
                                    <Chip color="success" size="sm" variant="flat" startContent={<TrendingUpIcon className="w-3 h-3" />}>
                                        +4.3%
                                    </Chip>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Efficiency Score</TableCell>
                                <TableCell>92.8</TableCell>
                                <TableCell>94.1</TableCell>
                                <TableCell>
                                    <Chip color="danger" size="sm" variant="flat" startContent={<TrendingDownIcon className="w-3 h-3" />}>
                                        -1.4%
                                    </Chip>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );

    return (
        <>
            <Head title={title} />
            
            {/* Export Modal */}
            {modalStates.export && (
                <Modal 
                    isOpen={modalStates.export} 
                    onOpenChange={() => closeModal('export')}
                    size="lg"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Export Analytics Report</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <p className="text-sm text-default-600">
                                    Export {activeTab} analytics for {selectedPeriod.replace('_', ' ')}
                                </p>
                                
                                <div className="grid grid-cols-1 gap-3">
                                    {exportFormats.map(format => (
                                        <Card key={format.key} isPressable onPress={() => handleExport(format.key)}>
                                            <CardBody className="py-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">{format.label}</p>
                                                        <p className="text-sm text-default-500">{format.description}</p>
                                                    </div>
                                                    <Button size="sm" variant="flat" color="primary">
                                                        Export
                                                    </Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('export')}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Advanced Filters Modal */}
            {modalStates.filters && (
                <Modal 
                    isOpen={modalStates.filters} 
                    onOpenChange={() => closeModal('filters')}
                    size="xl"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Advanced Filters</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Department"
                                    selectedKeys={filters.department_id !== 'all' ? [filters.department_id] : []}
                                    onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || 'all')}
                                >
                                    <SelectItem key="all">All Departments</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Designation"
                                    selectedKeys={filters.designation_id !== 'all' ? [filters.designation_id] : []}
                                    onSelectionChange={(keys) => handleFilterChange('designation_id', Array.from(keys)[0] || 'all')}
                                >
                                    <SelectItem key="all">All Designations</SelectItem>
                                    {designations.map(des => (
                                        <SelectItem key={des.id}>{des.title}</SelectItem>
                                    ))}
                                </Select>

                                <Input
                                    label="Date From"
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                />

                                <Input
                                    label="Date To"
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                />

                                <Select
                                    label="Employee Status"
                                    selectedKeys={[filters.employee_status]}
                                    onSelectionChange={(keys) => handleFilterChange('employee_status', Array.from(keys)[0])}
                                >
                                    <SelectItem key="active">Active Only</SelectItem>
                                    <SelectItem key="inactive">Inactive Only</SelectItem>
                                    <SelectItem key="all">All Employees</SelectItem>
                                </Select>

                                <Select
                                    label="Comparison"
                                    selectedKeys={[filters.comparison]}
                                    onSelectionChange={(keys) => handleFilterChange('comparison', Array.from(keys)[0])}
                                >
                                    <SelectItem key="previous_period">Previous Period</SelectItem>
                                    <SelectItem key="previous_year">Previous Year</SelectItem>
                                    <SelectItem key="industry_benchmark">Industry Benchmark</SelectItem>
                                </Select>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('filters')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={() => closeModal('filters')}>
                                Apply Filters
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Workforce Analytics">
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
                                                    <ChartBarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Workforce Analytics
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Advanced HR analytics and business intelligence
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                <Select
                                                    size="sm"
                                                    selectedKeys={[selectedPeriod]}
                                                    onSelectionChange={(keys) => handlePeriodChange(Array.from(keys)[0])}
                                                    className="min-w-[150px]"
                                                >
                                                    {timePeriods.map(period => (
                                                        <SelectItem key={period.key}>{period.label}</SelectItem>
                                                    ))}
                                                </Select>

                                                <Button 
                                                    color="secondary" 
                                                    variant="flat"
                                                    startContent={<FunnelIcon className="w-4 h-4" />}
                                                    onPress={() => openModal('filters')}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Filters
                                                </Button>

                                                {canExportReports && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('export')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Export
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    <Tabs
                                        selectedKey={activeTab}
                                        onSelectionChange={setActiveTab}
                                        variant="underlined"
                                        classNames={{
                                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                            cursor: "w-full bg-primary",
                                            tab: "max-w-fit px-0 h-12",
                                            tabContent: "group-data-[selected=true]:text-primary"
                                        }}
                                    >
                                        {analyticsCategories.map((category) => (
                                            <Tab 
                                                key={category.key}
                                                title={
                                                    <div className="flex items-center space-x-2">
                                                        {category.icon}
                                                        <span>{category.label}</span>
                                                    </div>
                                                }
                                            >
                                                <div className="py-6">
                                                    {activeTab === 'overview' ? renderOverviewDashboard() : renderCategoryAnalytics(activeTab)}
                                                </div>
                                            </Tab>
                                        ))}
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

WorkforceAnalytics.layout = (page) => <App children={page} />;
export default WorkforceAnalytics;