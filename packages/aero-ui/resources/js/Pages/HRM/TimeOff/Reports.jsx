import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { 
    Button, 
    Card, 
    CardBody, 
    CardHeader, 
    Input, 
    Select, 
    SelectItem,
    Tabs,
    Tab,
    Progress,
    Chip
} from "@heroui/react";
import { 
    DocumentChartBarIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ArrowDownTrayIcon,
    FunnelIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const TimeOffReports = ({ title, reportData: initialData }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { hasAccess } = useHRMAC();
    
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
    const [reportData, setReportData] = useState(initialData || {});
    const [activeTab, setActiveTab] = useState('overview');
    const [filters, setFilters] = useState({ 
        dateRange: 'this-year', 
        department: 'all', 
        employee: 'all', 
        leaveType: 'all' 
    });
    const [stats, setStats] = useState({ 
        totalDays: 0, 
        avgPerEmployee: 0, 
        mostUsedType: '', 
        utilizationRate: 0 
    });
    const [exporting, setExporting] = useState(false);

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Days Taken", 
            value: stats.totalDays, 
            icon: <CalendarDaysIcon className="w-5 h-5" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Avg per Employee", 
            value: Math.round(stats.avgPerEmployee * 10) / 10, 
            icon: <UserGroupIcon className="w-5 h-5" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Utilization Rate", 
            value: `${stats.utilizationRate}%`, 
            icon: <DocumentChartBarIcon className="w-5 h-5" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Most Used Type", 
            value: stats.mostUsedType || 'N/A', 
            icon: <CalendarDaysIcon className="w-5 h-5" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        }
    ], [stats]);

    // Permission checks
    const canViewReports = hasAccess('hrm.time-off.reports');
    const canExportReports = hasAccess('hrm.time-off.export');

    // Fetch report data
    const fetchReportData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.time-off.reports'), {
                params: filters
            });
            if (response.status === 200) {
                setReportData(response.data.reportData || {});
                setStats(response.data.stats || { 
                    totalDays: 0, 
                    avgPerEmployee: 0, 
                    mostUsedType: '', 
                    utilizationRate: 0 
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch report data' });
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchReportData(); }, [fetchReportData]);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Export functionality
    const handleExport = useCallback(async (format = 'excel') => {
        if (!canExportReports) return;
        
        setExporting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.time-off.export'), {
                    format,
                    filters,
                    tab: activeTab
                }, {
                    responseType: 'blob'
                });
                
                if (response.status === 200) {
                    // Create download link
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `time-off-report-${activeTab}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    
                    resolve(['Report exported successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to export report']);
            } finally {
                setExporting(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Exporting report...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [canExportReports, filters, activeTab]);

    // Chart data processing
    const processChartData = useCallback((data, type) => {
        if (!data || !Array.isArray(data)) return [];
        
        return data.map(item => ({
            name: item.label || item.name,
            value: item.value || item.count,
            percentage: item.percentage || 0
        }));
    }, []);

    return (
        <>
            <Head title={title} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Time Off Reports">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
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
                                {/* Card Header */}
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
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <DocumentChartBarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Time Off Reports
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Comprehensive time off analytics and insights
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Export Actions */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canExportReports && (
                                                    <>
                                                        <Button 
                                                            variant="flat"
                                                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                            isLoading={exporting}
                                                            onPress={() => handleExport('excel')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Export Excel
                                                        </Button>
                                                        <Button 
                                                            variant="flat"
                                                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                            isLoading={exporting}
                                                            onPress={() => handleExport('pdf')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Export PDF
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    {/* Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Select
                                            label="Date Range"
                                            placeholder="Select range"
                                            selectedKeys={[filters.dateRange]}
                                            onSelectionChange={(keys) => handleFilterChange('dateRange', Array.from(keys)[0])}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="this-month">This Month</SelectItem>
                                            <SelectItem key="last-month">Last Month</SelectItem>
                                            <SelectItem key="this-quarter">This Quarter</SelectItem>
                                            <SelectItem key="this-year">This Year</SelectItem>
                                            <SelectItem key="last-year">Last Year</SelectItem>
                                            <SelectItem key="custom">Custom Range</SelectItem>
                                        </Select>
                                        
                                        <Select
                                            label="Department"
                                            placeholder="All Departments"
                                            selectedKeys={filters.department !== 'all' ? [filters.department] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {/* Dynamic department options would go here */}
                                        </Select>

                                        <Select
                                            label="Leave Type"
                                            placeholder="All Types"
                                            selectedKeys={filters.leaveType !== 'all' ? [filters.leaveType] : []}
                                            onSelectionChange={(keys) => handleFilterChange('leaveType', Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            <SelectItem key="annual">Annual Leave</SelectItem>
                                            <SelectItem key="sick">Sick Leave</SelectItem>
                                            <SelectItem key="personal">Personal Leave</SelectItem>
                                            <SelectItem key="maternity">Maternity Leave</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Tabs for different report views */}
                                    <Tabs 
                                        selectedKey={activeTab}
                                        onSelectionChange={setActiveTab}
                                        className="mb-6"
                                    >
                                        <Tab key="overview" title="Overview">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Leave Type Distribution */}
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="text-lg font-semibold">Leave Type Distribution</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <div className="space-y-4">
                                                            {processChartData(reportData.leaveTypes).map((item, index) => (
                                                                <div key={index} className="flex items-center justify-between">
                                                                    <span className="text-sm">{item.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <Progress 
                                                                            value={item.percentage} 
                                                                            className="w-20" 
                                                                            size="sm" 
                                                                            color="primary"
                                                                        />
                                                                        <span className="text-xs text-default-500 min-w-[40px]">
                                                                            {item.value}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                                {/* Department Usage */}
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="text-lg font-semibold">Department Usage</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <div className="space-y-4">
                                                            {processChartData(reportData.departments).map((item, index) => (
                                                                <div key={index} className="flex items-center justify-between">
                                                                    <span className="text-sm">{item.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <Progress 
                                                                            value={item.percentage} 
                                                                            className="w-20" 
                                                                            size="sm" 
                                                                            color="success"
                                                                        />
                                                                        <Chip size="sm" variant="flat">{item.value}</Chip>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                                {/* Monthly Trends */}
                                                <Card className="md:col-span-2">
                                                    <CardHeader>
                                                        <h3 className="text-lg font-semibold">Monthly Trends</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <div className="text-center text-default-500 py-8">
                                                            Monthly trend chart implementation would go here
                                                            <br />
                                                            (Chart.js or similar charting library)
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>

                                        <Tab key="detailed" title="Detailed Analysis">
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="text-lg font-semibold">Detailed Analytics</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <div className="text-center text-default-500 py-8">
                                                            Detailed analysis charts and tables would be implemented here.
                                                            This could include:
                                                            <ul className="mt-4 text-left list-disc list-inside space-y-1">
                                                                <li>Employee-wise breakdown</li>
                                                                <li>Seasonal patterns</li>
                                                                <li>Approval vs rejection rates</li>
                                                                <li>Average processing times</li>
                                                                <li>Peak usage periods</li>
                                                            </ul>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>

                                        <Tab key="trends" title="Trends & Insights">
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="text-lg font-semibold">Trends & Predictive Insights</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <div className="text-center text-default-500 py-8">
                                                            AI-powered insights and trend analysis would be displayed here.
                                                            This could include:
                                                            <ul className="mt-4 text-left list-disc list-inside space-y-1">
                                                                <li>Predictive leave patterns</li>
                                                                <li>Staffing impact analysis</li>
                                                                <li>Seasonal trend predictions</li>
                                                                <li>Department comparison insights</li>
                                                                <li>Recommendations for policy adjustments</li>
                                                            </ul>
                                                        </div>
                                                    </CardBody>
                                                </Card>
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

TimeOffReports.layout = (page) => <App children={page} />;
export default TimeOffReports;