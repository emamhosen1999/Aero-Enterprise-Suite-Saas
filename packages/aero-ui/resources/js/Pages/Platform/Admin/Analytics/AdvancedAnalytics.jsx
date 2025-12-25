import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Select,
    SelectItem,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Switch,
    Progress,
    Skeleton,
} from '@heroui/react';
import {
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

// Theme utilities
const getThemeRadius = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
};

const getCardStyle = () => ({
    background: `linear-gradient(135deg, 
        var(--theme-content1, #FAFAFA) 20%, 
        var(--theme-content2, #F4F4F5) 10%, 
        var(--theme-content3, #F1F3F4) 20%)`,
    borderColor: `var(--theme-divider, #E4E4E7)`,
    borderWidth: `var(--borderWidth, 2px)`,
    borderRadius: `var(--borderRadius, 12px)`,
    fontFamily: `var(--fontFamily, "Inter")`,
});

const AdvancedAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [themeRadius, setThemeRadius] = useState('lg');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Filters
    const [dateRange, setDateRange] = useState('30');
    const [selectedPlan, setSelectedPlan] = useState('all');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');

    // Revenue metrics
    const [revenueMetrics, setRevenueMetrics] = useState({
        totalRevenue: 0,
        totalRevenueChange: 0,
        mrr: 0,
        mrrChange: 0,
        arr: 0,
        arrChange: 0,
        arpu: 0,
        arpuChange: 0,
        ltv: 0,
        ltvChange: 0,
        churnRate: 0,
        churnRateChange: 0,
    });

    // Growth metrics
    const [growthMetrics, setGrowthMetrics] = useState({
        newSubscriptions: 0,
        newSubscriptionsChange: 0,
        cancelledSubscriptions: 0,
        cancelledSubscriptionsChange: 0,
        netGrowth: 0,
        netGrowthChange: 0,
        trialConversion: 0,
        trialConversionChange: 0,
        upgradeRate: 0,
        upgradeRateChange: 0,
        downgradeRate: 0,
        downgradeRateChange: 0,
    });

    // Cohort data
    const [cohorts, setCohorts] = useState([]);

    // Revenue trend (12 months)
    const [revenueTrend, setRevenueTrend] = useState([]);

    // Plan performance
    const [planPerformance, setPlanPerformance] = useState([]);

    // Modal states
    const [drillDownModal, setDrillDownModal] = useState(false);
    const [drillDownData, setDrillDownData] = useState(null);
    const [drillDownMetric, setDrillDownMetric] = useState('');

    // Initialize theme
    useEffect(() => {
        setThemeRadius(getThemeRadius());
        const handleResize = () => setThemeRadius(getThemeRadius());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch analytics data
    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.analytics.advanced'), {
                params: {
                    days: dateRange,
                    plan: selectedPlan,
                    currency: selectedCurrency,
                },
            });

            const data = response.data;
            setRevenueMetrics(data.revenueMetrics || revenueMetrics);
            setGrowthMetrics(data.growthMetrics || growthMetrics);
            setCohorts(data.cohorts || []);
            setRevenueTrend(data.revenueTrend || []);
            setPlanPerformance(data.planPerformance || []);
            setLastUpdated(new Date());
        } catch (error) {
            showToast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange, selectedPlan, selectedCurrency]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [autoRefresh, dateRange, selectedPlan, selectedCurrency]);

    // Handle metric drill-down
    const handleDrillDown = async (metric) => {
        try {
            const response = await axios.get(route('admin.analytics.drill-down', metric), {
                params: {
                    days: dateRange,
                    plan: selectedPlan,
                    currency: selectedCurrency,
                },
            });
            setDrillDownMetric(metric);
            setDrillDownData(response.data);
            setDrillDownModal(true);
        } catch (error) {
            showToast.error('Failed to load detailed breakdown');
        }
    };

    // Export data
    const handleExport = async (format) => {
        const promise = axios.post(route('admin.reports.generate'), {
            type: 'advanced_analytics',
            format: format,
            filters: {
                days: dateRange,
                plan: selectedPlan,
                currency: selectedCurrency,
            },
        }, {
            responseType: 'blob',
        });

        showToast.promise(promise, {
            loading: `Generating ${format.toUpperCase()} export...`,
            success: (response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.${format}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                return 'Export downloaded successfully';
            },
            error: 'Failed to generate export',
        });
    };

    // Format utilities
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency,
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatPercent = (value) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    // Metric card component
    const MetricCard = ({ title, value, change, icon: Icon, onClick, isLoading }) => (
        <Card 
            isPressable={!!onClick}
            onPress={onClick}
            className="transition-all duration-200 hover:scale-105"
            style={getCardStyle()}
        >
            <CardBody className="p-4">
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-3/4 rounded" />
                        <Skeleton className="h-8 w-1/2 rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-default-500">{title}</span>
                            <Icon className="w-5 h-5 text-default-400" />
                        </div>
                        <div className="text-2xl font-bold">{value}</div>
                        <div className="flex items-center gap-1 mt-1">
                            {change >= 0 ? (
                                <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
                            ) : (
                                <ArrowTrendingDownIcon className="w-4 h-4 text-danger" />
                            )}
                            <span className={`text-sm ${change >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatPercent(change)}
                            </span>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );

    // Cohort row color based on retention
    const getCohortColor = (retention) => {
        if (retention >= 80) return 'success';
        if (retention >= 60) return 'warning';
        return 'danger';
    };

    return (
        <>
            <Head title="Advanced Analytics" />

            <div className="space-y-6">
                {/* Header with filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Advanced Analytics</h1>
                        <p className="text-sm text-default-500 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Select
                            label="Date Range"
                            selectedKeys={[dateRange]}
                            onSelectionChange={(keys) => setDateRange(Array.from(keys)[0])}
                            className="w-40"
                            radius={themeRadius}
                        >
                            <SelectItem key="7">Last 7 days</SelectItem>
                            <SelectItem key="30">Last 30 days</SelectItem>
                            <SelectItem key="90">Last 90 days</SelectItem>
                            <SelectItem key="180">Last 6 months</SelectItem>
                            <SelectItem key="365">Last 12 months</SelectItem>
                            <SelectItem key="all">All time</SelectItem>
                        </Select>

                        <Select
                            label="Plan"
                            selectedKeys={[selectedPlan]}
                            onSelectionChange={(keys) => setSelectedPlan(Array.from(keys)[0])}
                            className="w-40"
                            radius={themeRadius}
                        >
                            <SelectItem key="all">All Plans</SelectItem>
                            <SelectItem key="free">Free</SelectItem>
                            <SelectItem key="starter">Starter</SelectItem>
                            <SelectItem key="professional">Professional</SelectItem>
                            <SelectItem key="enterprise">Enterprise</SelectItem>
                        </Select>

                        <Select
                            label="Currency"
                            selectedKeys={[selectedCurrency]}
                            onSelectionChange={(keys) => setSelectedCurrency(Array.from(keys)[0])}
                            className="w-32"
                            radius={themeRadius}
                        >
                            <SelectItem key="USD">USD</SelectItem>
                            <SelectItem key="EUR">EUR</SelectItem>
                            <SelectItem key="GBP">GBP</SelectItem>
                        </Select>

                        <Switch
                            isSelected={autoRefresh}
                            onValueChange={setAutoRefresh}
                            size="sm"
                        >
                            Auto-refresh
                        </Switch>

                        <Button
                            isIconOnly
                            variant="flat"
                            onPress={fetchAnalytics}
                            isLoading={loading}
                            radius={themeRadius}
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Revenue Metrics */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Revenue Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <MetricCard
                            title="Total Revenue"
                            value={formatCurrency(revenueMetrics.totalRevenue)}
                            change={revenueMetrics.totalRevenueChange}
                            icon={CurrencyDollarIcon}
                            onClick={() => handleDrillDown('total_revenue')}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="MRR"
                            value={formatCurrency(revenueMetrics.mrr)}
                            change={revenueMetrics.mrrChange}
                            icon={ChartBarIcon}
                            onClick={() => handleDrillDown('mrr')}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="ARR"
                            value={formatCurrency(revenueMetrics.arr)}
                            change={revenueMetrics.arrChange}
                            icon={ChartBarIcon}
                            onClick={() => handleDrillDown('arr')}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="ARPU"
                            value={formatCurrency(revenueMetrics.arpu)}
                            change={revenueMetrics.arpuChange}
                            icon={UsersIcon}
                            onClick={() => handleDrillDown('arpu')}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="LTV"
                            value={formatCurrency(revenueMetrics.ltv)}
                            change={revenueMetrics.ltvChange}
                            icon={CurrencyDollarIcon}
                            onClick={() => handleDrillDown('ltv')}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="Churn Rate"
                            value={`${revenueMetrics.churnRate.toFixed(1)}%`}
                            change={revenueMetrics.churnRateChange}
                            icon={ArrowTrendingDownIcon}
                            onClick={() => handleDrillDown('churn')}
                            isLoading={loading}
                        />
                    </div>
                </div>

                {/* Growth Metrics */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Growth Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <MetricCard
                            title="New Subscriptions"
                            value={formatNumber(growthMetrics.newSubscriptions)}
                            change={growthMetrics.newSubscriptionsChange}
                            icon={ArrowTrendingUpIcon}
                            onClick={() => handleDrillDown('new_subs')}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="Cancelled"
                            value={formatNumber(growthMetrics.cancelledSubscriptions)}
                            change={growthMetrics.cancelledSubscriptionsChange}
                            icon={ArrowTrendingDownIcon}
                            onClick={() => handleDrillDown('cancelled')}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="Net Growth"
                            value={`${growthMetrics.netGrowth >= 0 ? '+' : ''}${growthMetrics.netGrowth}`}
                            change={growthMetrics.netGrowthChange}
                            icon={ChartBarIcon}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="Trial Conversion"
                            value={`${growthMetrics.trialConversion.toFixed(1)}%`}
                            change={growthMetrics.trialConversionChange}
                            icon={UsersIcon}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="Upgrade Rate"
                            value={`${growthMetrics.upgradeRate.toFixed(1)}%`}
                            change={growthMetrics.upgradeRateChange}
                            icon={ArrowTrendingUpIcon}
                            isLoading={loading}
                        />
                        <MetricCard
                            title="Downgrade Rate"
                            value={`${growthMetrics.downgradeRate.toFixed(1)}%`}
                            change={growthMetrics.downgradeRateChange}
                            icon={ArrowTrendingDownIcon}
                            isLoading={loading}
                        />
                    </div>
                </div>

                {/* Cohort Analysis */}
                <Card style={getCardStyle()}>
                    <CardHeader className="border-b border-divider p-4">
                        <h2 className="text-lg font-semibold">Cohort Analysis</h2>
                    </CardHeader>
                    <CardBody className="p-4">
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full rounded" />
                                ))}
                            </div>
                        ) : (
                            <Table
                                aria-label="Cohort analysis table"
                                className="min-w-full"
                                radius={themeRadius}
                            >
                                <TableHeader>
                                    <TableColumn>COHORT MONTH</TableColumn>
                                    <TableColumn>STARTING SUBS</TableColumn>
                                    <TableColumn>CURRENT ACTIVE</TableColumn>
                                    <TableColumn>RETENTION</TableColumn>
                                    <TableColumn>MRR RETENTION</TableColumn>
                                    <TableColumn>CHURN RATE</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No cohort data available">
                                    {cohorts.map((cohort, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{cohort.month}</TableCell>
                                            <TableCell>{formatNumber(cohort.starting)}</TableCell>
                                            <TableCell>{formatNumber(cohort.current)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getCohortColor(cohort.retention)}
                                                    size="sm"
                                                    variant="flat"
                                                >
                                                    {cohort.retention.toFixed(1)}%
                                                </Chip>
                                            </TableCell>
                                            <TableCell>{cohort.mrrRetention.toFixed(1)}%</TableCell>
                                            <TableCell>{cohort.churn.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* Revenue Trend Chart */}
                <Card style={getCardStyle()}>
                    <CardHeader className="border-b border-divider p-4">
                        <h2 className="text-lg font-semibold">12-Month Revenue Trend</h2>
                    </CardHeader>
                    <CardBody className="p-4">
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(12)].map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {revenueTrend.map((month, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{month.month}</span>
                                            <span>{formatCurrency(month.revenue)}</span>
                                        </div>
                                        <Progress
                                            value={(month.revenue / Math.max(...revenueTrend.map(m => m.revenue))) * 100}
                                            color="primary"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        {month.change !== undefined && (
                                            <div className="text-xs text-default-500">
                                                {month.change >= 0 ? '+' : ''}{month.change.toFixed(1)}% MoM
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Plan Performance */}
                <Card style={getCardStyle()}>
                    <CardHeader className="border-b border-divider p-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Plan Performance</h2>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="flat"
                                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                onPress={() => handleExport('csv')}
                                radius={themeRadius}
                            >
                                CSV
                            </Button>
                            <Button
                                size="sm"
                                variant="flat"
                                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                onPress={() => handleExport('pdf')}
                                radius={themeRadius}
                            >
                                PDF
                            </Button>
                            <Button
                                size="sm"
                                variant="flat"
                                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                onPress={() => handleExport('excel')}
                                radius={themeRadius}
                            >
                                Excel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="p-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {planPerformance.map((plan, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Chip
                                                    color={plan.tier === 'enterprise' ? 'warning' : plan.tier === 'professional' ? 'success' : 'primary'}
                                                    size="sm"
                                                    variant="flat"
                                                >
                                                    {plan.name}
                                                </Chip>
                                                <span className="text-sm text-default-500">
                                                    {formatNumber(plan.subscribers)} subscribers
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{formatCurrency(plan.revenue)}</div>
                                                <div className="text-xs text-default-500">{plan.percentage}% of total</div>
                                            </div>
                                        </div>
                                        <Progress
                                            value={plan.percentage}
                                            color={plan.tier === 'enterprise' ? 'warning' : plan.tier === 'professional' ? 'success' : 'primary'}
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Drill-down Modal */}
            <Modal
                isOpen={drillDownModal}
                onOpenChange={setDrillDownModal}
                size="2xl"
                scrollBehavior="inside"
                radius={themeRadius}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">
                            {drillDownMetric.replace('_', ' ').toUpperCase()} - Detailed Breakdown
                        </h2>
                    </ModalHeader>
                    <ModalBody>
                        {drillDownData && (
                            <div className="space-y-4">
                                <Table aria-label="Drill-down data" radius={themeRadius}>
                                    <TableHeader>
                                        <TableColumn>DATE</TableColumn>
                                        <TableColumn>VALUE</TableColumn>
                                        <TableColumn>CHANGE</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {drillDownData.details?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.date}</TableCell>
                                                <TableCell>{item.value}</TableCell>
                                                <TableCell>
                                                    <span className={item.change >= 0 ? 'text-success' : 'text-danger'}>
                                                        {formatPercent(item.change)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        )) || []}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setDrillDownModal(false)} radius={themeRadius}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default AdvancedAnalytics;
