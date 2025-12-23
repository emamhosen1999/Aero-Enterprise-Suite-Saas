import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, usePage } from "@inertiajs/react";
import { 
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Accordion,
  AccordionItem,
  Tooltip,
  Badge,
  Button,
  Input,
  Select,
  SelectItem
} from "@heroui/react";
import { useTheme } from '@/Context/ThemeContext';
import { 
  Button as HeroButton,
  Select as HeroSelect,
  SelectItem as HeroSelectItem,
  Switch,
  Spinner,
  Progress as HeroProgress,
  Tabs,
  Tab
} from "@heroui/react";
import { getThemePrimaryColor } from '@/theme';
import { 
  ComputerDesktopIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  CircleStackIcon,
  CpuChipIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  CloudIcon,
  CogIcon,
  BellIcon,
  ChartPieIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  KeyIcon,  ViewColumnsIcon,
  TableCellsIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import { ChevronDown } from 'lucide-react';
import App from "@/Layouts/App.jsx";
import PageHeader from '@/Components/Common/PageHeader';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    BarChart, 
    Bar, 
    PieChart, 
    Pie, 
    Cell,
    RadialBarChart,
    RadialBar,
    Legend
} from 'recharts';
import { showToast } from "@/utils/toastUtils";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const SystemMonitoringEnhanced = ({ title, initialData }) => {
    const { isDark } = useTheme();
    const primaryColor = getThemePrimaryColor();
    
    // Custom media query
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    const { auth, app } = usePage().props;
    
    // State management
    const [data, setData] = useState(initialData || {});
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState('30');
    const [selectedTab, setSelectedTab] = useState('overview');
    const [timePeriod, setTimePeriod] = useState('24h');
    const [expandedPanel, setExpandedPanel] = useState('database');

    // Permission check
    const hasPermission = (permission) => {
        return auth?.permissions && auth.permissions.includes(permission);
    };

    // Auto-refresh logic
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            refreshData();
        }, parseInt(refreshInterval) * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    // Data fetching
    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/system-monitoring/metrics', {
                params: {
                    type: selectedTab,
                    period: timePeriod
                }
            });
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch monitoring data:', error);
            showToast.error('Failed to refresh system data');
        } finally {
            setLoading(false);
        }
    }, [selectedTab, timePeriod]);

    // Status color and icon mapping
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': 
            case 'compliant': 
            case 'good': return 'success';
            case 'warning': 
            case 'partial': return 'warning';
            case 'critical': 
            case 'unhealthy': 
            case 'non_compliant': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy': 
            case 'compliant': return <CheckCircleIcon className="w-5 h-5" />;
            case 'warning': 
            case 'partial': return <ExclamationTriangleIcon className="w-5 h-5" />;
            case 'critical': 
            case 'unhealthy': return <ExclamationCircleIcon className="w-5 h-5" />;
            default: return <InformationCircleIcon className="w-5 h-5" />;
        }
    };

    // Chart colors
    const chartColors = {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        success: theme.palette.success.main,
        warning: theme.palette.warning.main,
        error: theme.palette.error.main,
        info: theme.palette.info.main,
    };

    // Export system report
    const handleExportReport = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/system-report', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `system-report-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showToast.success('System report exported successfully');
        } catch (error) {
            console.error('Failed to export report:', error);
            showToast.error('Failed to export system report');
        } finally {
            setLoading(false);
        }
    }, []);

    // Overview Dashboard Component
    const OverviewDashboard = () => {
        const overviewStats = [
            {
                title: 'System Health',
                value: data.system_health?.overall_status || 'Unknown',
                icon: <ServerIcon />,
                color: data.system_health?.overall_status === 'healthy' ? 'success' : 'error',
                description: 'Overall system status'
            },
            {
                title: 'Response Time',
                value: `${Math.round(data.performance_summary?.avg_response_time || 0)}ms`,
                icon: <ClockIcon />,
                color: (data.performance_summary?.avg_response_time || 0) < 500 ? 'success' : 'warning',
                description: 'Average response time'
            },
            {
                title: 'Active Users',
                value: data.user_activity?.active_users || 0,
                icon: <ComputerDesktopIcon />,
                color: 'info',
                description: 'Currently online'
            },
            {
                title: 'Error Rate',
                value: `${((data.error_summary?.total_errors || 0) / Math.max(data.performance_summary?.total_requests || 1, 1) * 100).toFixed(2)}%`,
                icon: <ExclamationTriangleIcon />,
                color: (data.error_summary?.total_errors || 0) < 10 ? 'success' : 'error',
                description: 'System error rate'
            }
        ];

        return (
            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid item xs={12}>
                    <Grid container spacing={3}>
                        {overviewStats.map((stat, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card
                                        elevation={0}
                                        sx={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '16px',
                                            p: 2
                                        }}
                                    >
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Typography variant="h4" className="font-bold">
                                                        {stat.value}
                                                    </Typography>
                                                    <Typography variant="subtitle2" color="text.secondary">
                                                        {stat.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {stat.description}
                                                    </Typography>
                                                </div>
                                                <div className={`p-3 rounded-full bg-${stat.color}-500/20`}>
                                                    {React.cloneElement(stat.icon, { 
                                                        className: `w-6 h-6 text-${stat.color}-500` 
                                                    })}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* System Health Overview */}
                <Grid item xs={12} lg={8}>
                    <Card
                        elevation={0}
                        sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px'
                        }}
                    >
                        <CardHeader
                            title="System Health Checks"
                            avatar={<CheckCircleIcon className="w-6 h-6" />}
                        />
                        <CardContent>
                            <div className="space-y-3">
                                {data.system_health?.checks && Object.entries(data.system_health.checks).map(([key, check]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(check.status)}
                                            <div>
                                                <Typography variant="subtitle2" className="capitalize font-medium">
                                                    {key.replace(/_/g, ' ')}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {check.message}
                                                </Typography>
                                            </div>
                                        </div>
                                        <Chip
                                            label={check.status}
                                            color={getStatusColor(check.status)}
                                            size="small"
                                            variant="outlined"
                                            className="capitalize"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} lg={4}>
                    <Card
                        elevation={0}
                        sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px'
                        }}
                    >
                        <CardHeader
                            title="Quick Actions"
                            avatar={<CogIcon className="w-6 h-6" />}
                        />
                        <CardContent>
                            <div className="space-y-3">
                                <Button
                                    startIcon={<ArrowPathIcon className="w-4 h-4" />}
                                    onClick={refreshData}
                                    className="w-full"
                                    variant="bordered"
                                >
                                    Refresh Data
                                </Button>
                                <Button
                                    startIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
                                    onClick={handleExportReport}
                                    className="w-full"
                                    variant="bordered"
                                >
                                    Export Report
                                </Button>
                                <Button
                                    startIcon={<BellIcon className="w-4 h-4" />}
                                    className="w-full"
                                    variant="bordered"
                                >
                                    Configure Alerts
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    // Database Analysis Component
    const DatabaseAnalysis = () => {
        const [page, setPage] = useState(0);
        const [rowsPerPage, setRowsPerPage] = useState(10);

        const tables = data.database_stats?.table_analysis?.tables || [];
        const summary = data.database_stats?.table_analysis?.summary || {};

        return (
            <div className="space-y-6">
                {/* Database Summary */}
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardContent className="text-center">
                                <Typography variant="h4" className="font-bold text-blue-500">
                                    {summary.total_tables || 0}
                                </Typography>
                                <Typography variant="subtitle2">Total Tables</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardContent className="text-center">
                                <Typography variant="h4" className="font-bold text-green-500">
                                    {summary.total_size_mb?.toFixed(2) || 0} MB
                                </Typography>
                                <Typography variant="subtitle2">Total Size</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardContent className="text-center">
                                <Typography variant="h4" className="font-bold text-purple-500">
                                    {summary.total_rows?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="subtitle2">Total Rows</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardContent className="text-center">
                                <Typography variant="h4" className="font-bold text-orange-500">
                                    {summary.engines_used?.length || 0}
                                </Typography>
                                <Typography variant="subtitle2">Storage Engines</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Detailed Table Analysis */}
                <Card
                    elevation={0}
                    sx={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px'
                    }}
                >
                    <CardHeader
                        title="Table Analysis"
                        avatar={<TableCellsIcon className="w-6 h-6" />}
                        action={
                            <Chip 
                                label={`${tables.length} Tables`} 
                                color="primary" 
                                variant="outlined" 
                            />
                        }
                    />
                    <CardContent>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Table Name</TableCell>
                                        <TableCell align="right">Rows</TableCell>
                                        <TableCell align="right">Size (MB)</TableCell>
                                        <TableCell align="right">Data (MB)</TableCell>
                                        <TableCell align="right">Index (MB)</TableCell>
                                        <TableCell>Engine</TableCell>
                                        <TableCell>Created</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tables
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((table, index) => (
                                        <TableRow key={table.TABLE_NAME} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" className="font-medium">
                                                    {table.TABLE_NAME}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                {table.TABLE_ROWS?.toLocaleString() || 0}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip 
                                                    label={`${table.size_mb || 0} MB`}
                                                    size="small"
                                                    color={table.size_mb > 10 ? 'warning' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">{table.data_mb || 0}</TableCell>
                                            <TableCell align="right">{table.index_mb || 0}</TableCell>
                                            <TableCell>
                                                <Chip label={table.ENGINE} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                {table.CREATE_TIME ? new Date(table.CREATE_TIME).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={tables.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(event, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(event) => {
                                setRowsPerPage(parseInt(event.target.value, 10));
                                setPage(0);
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Storage Analysis */}
                {data.database_stats?.storage_analysis && (
                    <Card
                        elevation={0}
                        sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px'
                        }}
                    >
                        <CardHeader
                            title="Storage Analysis"
                            avatar={<CircleStackIcon className="w-6 h-6" />}
                        />
                        <CardContent>
                            <div className="space-y-4">
                                {/* Storage by Engine */}
                                {data.database_stats.storage_analysis.by_engine?.map((engine, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-white/5">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Typography variant="subtitle2" className="font-medium">
                                                    {engine.ENGINE} Engine
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {engine.table_count} tables
                                                </Typography>
                                            </div>
                                            <div className="text-right">
                                                <Typography variant="subtitle2" className="font-bold">
                                                    {engine.total_size_mb} MB
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Avg: {engine.avg_size_mb} MB
                                                </Typography>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Fragmentation Issues */}
                                {data.database_stats.storage_analysis.fragmentation?.length > 0 && (
                                    <div>
                                        <Typography variant="h6" className="mb-3">Fragmentation Issues</Typography>
                                        {data.database_stats.storage_analysis.fragmentation.map((frag, index) => (
                                            <Alert 
                                                key={index} 
                                                severity={frag.fragmentation_percent > 50 ? 'error' : 'warning'}
                                                className="mb-2"
                                            >
                                                Table <strong>{frag.TABLE_NAME}</strong> has {frag.fragmentation_percent}% fragmentation ({frag.fragmentation_mb} MB)
                                            </Alert>
                                        ))}
                                    </div>
                                )}

                                {/* Recommendations */}
                                {data.database_stats.storage_analysis.recommendations?.length > 0 && (
                                    <div>
                                        <Typography variant="h6" className="mb-3">Recommendations</Typography>
                                        {data.database_stats.storage_analysis.recommendations.map((rec, index) => (
                                            <Alert key={index} severity={rec.priority === 'high' ? 'error' : 'info'} className="mb-2">
                                                {rec.message}
                                            </Alert>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    // Performance Monitoring Component
    const PerformanceMonitoring = () => {
        const performanceData = data.performance_summary?.metrics || [];
        const queryPerformance = data.database_stats?.query_performance || {};

        const chartData = performanceData.length > 0 ? 
            performanceData.map((metric, index) => ({
                name: metric.metric_type ? metric.metric_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : `Metric ${index + 1}`,
                avgTime: Math.round(metric.avg_time || metric.average_time || 0),
                requests: metric.total_requests || metric.count || 0,
                maxTime: Math.round(metric.max_time || 0)
            })) : 
            // Fallback sample data
            [
                { name: 'API Requests', avgTime: 120, requests: 150, maxTime: 500 },
                { name: 'Database Queries', avgTime: 80, requests: 200, maxTime: 300 },
                { name: 'Cache Operations', avgTime: 15, requests: 80, maxTime: 45 },
                { name: 'File Operations', avgTime: 250, requests: 30, maxTime: 800 }
            ];

        return (
            <div className="space-y-6">
                {/* Performance Summary */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardHeader
                                title="Performance Metrics"
                                avatar={<PresentationChartLineIcon className="w-6 h-6" />}
                                action={performanceData.length === 0 && <Chip label="Sample Data" size="small" color="warning" />}
                            />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.3} />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke={theme.palette.text.secondary}
                                            fontSize={12}
                                        />
                                        <YAxis 
                                            stroke={theme.palette.text.secondary}
                                            fontSize={12}
                                            label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                                        />                                        <RechartsTooltip 
                                            contentStyle={{
                                                backgroundColor: theme.palette.background.paper,
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="avgTime"
                                            stroke={chartColors.primary}
                                            fill={`${chartColors.primary}30`}
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardHeader
                                title="Performance Summary"
                                avatar={<ChartPieIcon className="w-6 h-6" />}
                            />
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <Typography variant="h4" className="font-bold text-blue-500">
                                            {queryPerformance.performance_summary?.total_queries_24h || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Queries (24h)
                                        </Typography>
                                    </div>
                                    <div className="text-center">
                                        <Typography variant="h4" className="font-bold text-green-500">
                                            {Math.round(queryPerformance.performance_summary?.avg_execution_time || 0)}ms
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Avg Execution Time
                                        </Typography>
                                    </div>
                                    <div className="text-center">
                                        <Typography variant="h4" className="font-bold text-red-500">
                                            {Math.round(queryPerformance.performance_summary?.slowest_query_time || 0)}ms
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Slowest Query
                                        </Typography>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Slow Queries */}
                {queryPerformance.slow_queries?.length > 0 && (
                    <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                        <CardHeader
                            title="Slow Queries"
                            avatar={<ExclamationTriangleIcon className="w-6 h-6" />}
                        />
                        <CardContent>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Query Type</TableCell>
                                            <TableCell align="right">Execution Time (ms)</TableCell>
                                            <TableCell align="right">Memory Usage</TableCell>
                                            <TableCell>Timestamp</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {queryPerformance.slow_queries.slice(0, 10).map((query, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>{query.metric_type}</TableCell>
                                                <TableCell align="right">
                                                    <Chip 
                                                        label={`${query.execution_time_ms}ms`}
                                                        color={query.execution_time_ms > 2000 ? 'error' : 'warning'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">{query.memory_usage || 'N/A'}</TableCell>
                                                <TableCell>{new Date(query.created_at).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    // Security Monitoring Component
    const SecurityMonitoring = () => {
        const securityMetrics = data.security_metrics || {};
        const authStats = securityMetrics.authentication || {};
        const suspiciousActivities = securityMetrics.suspicious_activities || {};

        return (
            <div className="space-y-6">
                {/* Security Overview */}
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardContent className="text-center">
                                <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                <Typography variant="h4" className="font-bold text-green-500">
                                    {authStats.successful_logins_24h || 0}
                                </Typography>
                                <Typography variant="subtitle2">Successful Logins (24h)</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardContent className="text-center">
                                <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-500" />
                                <Typography variant="h4" className="font-bold text-red-500">
                                    {securityMetrics.failed_attempts?.length || 0}
                                </Typography>
                                <Typography variant="subtitle2">Failed Login Attempts</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardContent className="text-center">
                                <LockClosedIcon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                                <Typography variant="h4" className="font-bold text-blue-500">
                                    {authStats.unique_users_24h || 0}
                                </Typography>
                                <Typography variant="subtitle2">Unique Users (24h)</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardContent className="text-center">
                                <BellIcon className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                                <Typography variant="h4" className="font-bold text-orange-500">
                                    {suspiciousActivities.high_frequency_ips?.length || 0}
                                </Typography>
                                <Typography variant="subtitle2">Suspicious IPs</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Security Events */}
                {securityMetrics.security_events?.length > 0 && (
                    <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                        <CardHeader
                            title="Recent Security Events"
                            avatar={<KeyIcon className="w-6 h-6" />}
                        />
                        <CardContent>
                            <div className="space-y-3">
                                {securityMetrics.security_events.slice(0, 10).map((event, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Typography variant="subtitle2" className="font-medium">
                                                    {event.description}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    User: {event.causer_id} | {new Date(event.created_at).toLocaleString()}
                                                </Typography>
                                            </div>
                                            <Chip 
                                                label="Security Event" 
                                                size="small" 
                                                color="warning" 
                                                variant="outlined" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Failed Login Attempts */}
                {securityMetrics.failed_attempts?.length > 0 && (
                    <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                        <CardHeader
                            title="Failed Login Attempts"
                            avatar={<ExclamationTriangleIcon className="w-6 h-6" />}
                        />
                        <CardContent>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Error Type</TableCell>
                                            <TableCell>Message</TableCell>
                                            <TableCell>IP Address</TableCell>
                                            <TableCell>Timestamp</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {securityMetrics.failed_attempts.slice(0, 10).map((attempt, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>
                                                    <Chip label={attempt.error_type} size="small" color="error" />
                                                </TableCell>
                                                <TableCell>{attempt.message}</TableCell>
                                                <TableCell>{attempt.ip_address || 'Unknown'}</TableCell>
                                                <TableCell>{new Date(attempt.created_at).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    // Compliance Monitoring Component
    const ComplianceMonitoring = () => {
        const compliance = data.compliance_metrics || {};
        const iso27001 = compliance.iso_27001 || {};
        const dataProtection = compliance.data_protection || {};

        return (
            <div className="space-y-6">
                {/* Compliance Overview */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardHeader
                                title="ISO 27001 Compliance"
                                avatar={<ShieldCheckIcon className="w-6 h-6" />}
                            />
                            <CardContent>
                                <div className="text-center mb-4">
                                    <Typography variant="h3" className="font-bold text-blue-500">
                                        {iso27001.compliance_score || 0}%
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Compliance Score
                                    </Typography>
                                </div>
                                
                                {iso27001.checks && Object.entries(iso27001.checks).map(([key, check]) => (
                                    <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-white/5 mb-2">
                                        <div>
                                            <Typography variant="subtitle2" className="capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Score: {check.score}%
                                            </Typography>
                                        </div>
                                        <Chip
                                            label={check.compliant ? 'Compliant' : 'Non-Compliant'}
                                            color={check.compliant ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                            <CardHeader
                                title="Data Protection Compliance"
                                avatar={<LockClosedIcon className="w-6 h-6" />}
                            />
                            <CardContent>
                                <div className="text-center mb-4">
                                    <Typography variant="h3" className="font-bold text-green-500">
                                        {dataProtection.gdpr_compliance_score || 0}%
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        GDPR Compliance Score
                                    </Typography>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                        <Typography variant="subtitle2">Data Retention</Typography>
                                        <Chip label={`${dataProtection.data_retention?.score || 0}%`} size="small" color="info" />
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                        <Typography variant="subtitle2">Data Anonymization</Typography>
                                        <Chip label={`${dataProtection.data_anonymization?.score || 0}%`} size="small" color="warning" />
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                        <Typography variant="subtitle2">Consent Management</Typography>
                                        <Chip label={`${dataProtection.consent_management?.score || 0}%`} size="small" color="success" />
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                        <Typography variant="subtitle2">Breach Procedures</Typography>
                                        <Chip label={`${dataProtection.data_breach_procedures?.score || 0}%`} size="small" color="info" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Recommendations */}
                <Card elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px' }}>
                    <CardHeader
                        title="Compliance Recommendations"
                        avatar={<DocumentTextIcon className="w-6 h-6" />}
                    />
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Typography variant="h6" className="mb-3">ISO 27001 Recommendations</Typography>
                                {iso27001.recommendations?.map((rec, index) => (
                                    <Alert key={index} severity="info" className="mb-2">
                                        {rec}
                                    </Alert>
                                ))}
                            </div>
                            <div>
                                <Typography variant="h6" className="mb-3">Data Protection Recommendations</Typography>
                                {dataProtection.recommendations?.map((rec, index) => (
                                    <Alert key={index} severity="warning" className="mb-2">
                                        {rec}
                                    </Alert>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // Tab content renderer
    const renderTabContent = () => {
        switch (selectedTab) {
            case 'overview':
                return <OverviewDashboard />;
            case 'database':
                return <DatabaseAnalysis />;
            case 'performance':
                return <PerformanceMonitoring />;
            case 'security':
                return <SecurityMonitoring />;
            case 'compliance':
                return <ComplianceMonitoring />;
            default:
                return <OverviewDashboard />;
        }
    };

    return (
        <>
            <Head title={title} />
            
            <Box 
                className="min-h-screen p-2 sm:p-4 md:p-6"
                sx={{ 
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                }}
            >
                <Grow in timeout={800}>
                    <div className="max-w-7xl mx-auto">
                        <Card className="shadow-lg">
                            <PageHeader
                                title="Enterprise System Monitoring"
                                subtitle="ISO-compliant comprehensive system monitoring and analysis dashboard"
                                icon={<ComputerDesktopIcon className="w-8 h-8" />}
                                variant="default"
                                actionButtons={[
                                    {
                                        label: "Export Report",
                                        icon: <DocumentArrowDownIcon className="w-4 h-4" />,
                                        onPress: handleExportReport,
                                        className: "bg-linear-to-r from-[rgba(var(--theme-primary-rgb),0.2)] to-[rgba(var(--theme-secondary-rgb),0.2)] hover:from-[rgba(var(--theme-primary-rgb),0.3)] hover:to-[rgba(var(--theme-secondary-rgb),0.3)] border border-[rgba(var(--theme-primary-rgb),0.3)]"
                                    },
                                    {
                                        label: "Refresh Data",
                                        icon: <ArrowPathIcon className="w-4 h-4" />,
                                        onPress: refreshData,
                                        loading: loading
                                    }
                                ]}
                            >
                                <div className="p-6">
                                    {/* Controls Section */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '16px',
                                            p: 3,
                                            mb: 4
                                        }}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={autoRefresh}
                                                        onChange={(e) => setAutoRefresh(e.target.checked)}
                                                        size="sm"
                                                    />
                                                    <Typography variant="body2">Auto Refresh</Typography>
                                                </div>

                                                <Select
                                                    size="sm"
                                                    selectedKeys={[refreshInterval]}
                                                    onSelectionChange={(keys) => setRefreshInterval(Array.from(keys)[0])}
                                                    className="w-24"
                                                    isDisabled={!autoRefresh}
                                                    aria-label="Refresh interval"
                                                >
                                                    <SelectItem key="30" value="30">30s</SelectItem>
                                                    <SelectItem key="60" value="60">1m</SelectItem>
                                                    <SelectItem key="300" value="300">5m</SelectItem>
                                                </Select>
                                            </div>

                                            <Select
                                                size="sm"
                                                selectedKeys={[timePeriod]}
                                                onSelectionChange={(keys) => setTimePeriod(Array.from(keys)[0])}
                                                className="w-32"
                                                aria-label="Time period"
                                            >
                                                <SelectItem key="1h" value="1h">Last Hour</SelectItem>
                                                <SelectItem key="24h" value="24h">Last 24h</SelectItem>
                                                <SelectItem key="7d" value="7d">Last 7 days</SelectItem>
                                            </Select>
                                        </div>
                                    </Paper>

                                    {/* Navigation Tabs */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '16px',
                                            mb: 4
                                        }}
                                    >
                                        <Tabs
                                            selectedKey={selectedTab}
                                            onSelectionChange={setSelectedTab}
                                            aria-label="System monitoring sections"
                                            className="p-4"
                                        >
                                            <Tab key="overview" title={
                                                <div className="flex items-center gap-2">
                                                    <ComputerDesktopIcon className="w-4 h-4" />
                                                    Overview
                                                </div>
                                            } />
                                            <Tab key="database" title={
                                                <div className="flex items-center gap-2">
                                                    <CircleStackIcon className="w-4 h-4" />
                                                    Database
                                                </div>
                                            } />
                                            <Tab key="performance" title={
                                                <div className="flex items-center gap-2">
                                                    <ChartBarIcon className="w-4 h-4" />
                                                    Performance
                                                </div>
                                            } />
                                            <Tab key="security" title={
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheckIcon className="w-4 h-4" />
                                                    Security
                                                </div>
                                            } />
                                            <Tab key="compliance" title={
                                                <div className="flex items-center gap-2">
                                                    <DocumentTextIcon className="w-4 h-4" />
                                                    Compliance
                                                </div>
                                            } />
                                        </Tabs>
                                    </Paper>

                                    {/* Tab Content */}
                                    <div className="min-h-[600px]">
                                        {renderTabContent()}
                                    </div>

                                    {/* System Information Footer */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '16px',
                                            p: 3,
                                            mt: 4
                                        }}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                                            <div>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Last Updated
                                                </Typography>
                                                <Typography variant="body2" className="font-medium">
                                                    {data.system_health?.last_check ? 
                                                        new Date(data.system_health.last_check).toLocaleString() : 
                                                        new Date().toLocaleString()
                                                    }
                                                </Typography>
                                            </div>
                                            <div>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Monitoring Since
                                                </Typography>
                                                <Typography variant="body2" className="font-medium">
                                                    {new Date().toLocaleDateString()}
                                                </Typography>
                                            </div>
                                            <div>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    System Version
                                                </Typography>
                                                <Typography variant="body2" className="font-medium">
                                                    {app?.name || 'ERP System'} v{app?.version || '2.0'}
                                                </Typography>
                                            </div>
                                            <div>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Compliance Status
                                                </Typography>
                                                <Chip 
                                                    label="ISO Compliant" 
                                                    color="success" 
                                                    size="small" 
                                                    variant="outlined" 
                                                />
                                            </div>
                                        </div>
                                    </Paper>
                                </div>
                            </PageHeader>
                        </Card>
                    </div>
                </Grow>
            </Box>
        </>
    );
};

SystemMonitoringEnhanced.layout = (page) => <App>{page}</App>;

export default SystemMonitoringEnhanced;
