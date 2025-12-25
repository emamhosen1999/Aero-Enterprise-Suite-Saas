import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App';
import axios from 'axios';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Select,
  SelectItem,
  Skeleton,
  Switch,
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils';

// Theme-aware card styling
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

const RevenueAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [themeRadius, setThemeRadius] = useState('lg');

  // Analytics data state
  const [metrics, setMetrics] = useState({
    mrr: 0,
    mrrChange: 0,
    arr: 0,
    churnRate: 0,
    churnChange: 0,
    activeSubscriptions: 0,
    subscriptionsChange: 0,
    arpu: 0,
    ltv: 0,
  });

  const [currencyBreakdown, setCurrencyBreakdown] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [cohortData, setCohortData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);

  // Initialize theme radius
  useEffect(() => {
    setThemeRadius(getThemeRadius());
    const handleResize = () => setThemeRadius(getThemeRadius());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(route('admin.analytics.revenue'), {
        params: { days: dateRange },
      });

      const data = response.data;

      setMetrics({
        mrr: data.mrr || 0,
        mrrChange: data.mrr_change || 0,
        arr: (data.mrr || 0) * 12,
        churnRate: data.churn_rate || 0,
        churnChange: data.churn_change || 0,
        activeSubscriptions: data.active_subscriptions || 0,
        subscriptionsChange: data.subscriptions_change || 0,
        arpu: data.arpu || 0,
        ltv: data.ltv || 0,
      });

      setCurrencyBreakdown(data.currency_breakdown || []);
      setRevenueTrend(data.revenue_trend || []);
      setCohortData(data.cohort_data || []);
      setPlanDistribution(data.plan_distribution || []);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
      showToast.error('Failed to load revenue analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Export to CSV
  const handleExportCSV = async () => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(route('admin.analytics.revenue.export'), {
          params: { format: 'csv', days: dateRange },
          responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `revenue-analytics-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        resolve(['Export completed successfully']);
      } catch (error) {
        reject(['Export failed']);
      }
    });

    showToast.promise(promise, {
      loading: 'Exporting to CSV...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Export to PDF
  const handleExportPDF = async () => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(route('admin.analytics.revenue.export'), {
          params: { format: 'pdf', days: dateRange },
          responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `revenue-analytics-${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        resolve(['Export completed successfully']);
      } catch (error) {
        reject(['Export failed']);
      }
    });

    showToast.promise(promise, {
      loading: 'Exporting to PDF...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'CA$',
      AUD: 'A$',
      JPY: '¥',
    };
    return `${symbols[currency] || '$'}${(amount / 1000).toFixed(1)}k`;
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get status color
  const getStatusColor = (value) => {
    if (value >= 90) return 'success';
    if (value >= 70) return 'warning';
    return 'danger';
  };

  return (
    <>
      <Head title="Revenue Analytics - Admin" />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        {/* Header Card */}
        <Card className="transition-all duration-200" style={getCardStyle()}>
          <CardHeader className="border-b border-divider p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-xl flex items-center justify-center"
                  style={{
                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                  }}
                >
                  <ChartBarIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Revenue Analytics</h1>
                  <p className="text-sm text-default-500">
                    Track MRR, ARR, churn, and revenue metrics across all tenants
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Select
                  label="Date Range"
                  selectedKeys={[dateRange]}
                  onSelectionChange={(keys) => setDateRange(Array.from(keys)[0])}
                  className="w-full sm:w-48"
                  size="sm"
                  radius={themeRadius}
                >
                  <SelectItem key="7">Last 7 days</SelectItem>
                  <SelectItem key="30">Last 30 days</SelectItem>
                  <SelectItem key="90">Last 90 days</SelectItem>
                  <SelectItem key="365">Last 12 months</SelectItem>
                  <SelectItem key="all">All time</SelectItem>
                </Select>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-500">Auto-refresh</span>
                  <Switch
                    size="sm"
                    isSelected={autoRefresh}
                    onValueChange={setAutoRefresh}
                  />
                </div>

                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={fetchAnalytics}
                  radius={themeRadius}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Core Metrics */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {loading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-6 w-20 rounded mb-2" />
                      <Skeleton className="h-8 w-24 rounded mb-1" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-default-500 mb-1">MRR</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.mrr)}</p>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={metrics.mrrChange >= 0 ? 'success' : 'danger'}
                          startContent={
                            metrics.mrrChange >= 0 ? (
                              <ArrowTrendingUpIcon className="w-3 h-3" />
                            ) : (
                              <ArrowTrendingDownIcon className="w-3 h-3" />
                            )
                          }
                        >
                          {formatPercentage(metrics.mrrChange)}
                        </Chip>
                      </div>
                      <CurrencyDollarIcon className="w-5 h-5 text-primary" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-default-500 mb-1">ARR</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.arr)}</p>
                        <p className="text-xs text-default-400">MRR × 12</p>
                      </div>
                      <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-default-500 mb-1">Churn Rate</p>
                        <p className="text-2xl font-bold text-foreground">{metrics.churnRate.toFixed(1)}%</p>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={metrics.churnChange <= 0 ? 'success' : 'danger'}
                        >
                          {formatPercentage(metrics.churnChange)}
                        </Chip>
                      </div>
                      <ArrowTrendingDownIcon className="w-5 h-5 text-danger" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-default-500 mb-1">Active Subscriptions</p>
                        <p className="text-2xl font-bold text-foreground">{metrics.activeSubscriptions}</p>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={metrics.subscriptionsChange >= 0 ? 'success' : 'danger'}
                        >
                          {formatPercentage(metrics.subscriptionsChange)}
                        </Chip>
                      </div>
                      <UsersIcon className="w-5 h-5 text-primary" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-default-500 mb-1">ARPU</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.arpu)}</p>
                        <p className="text-xs text-default-400">Per user/month</p>
                      </div>
                      <CurrencyDollarIcon className="w-5 h-5 text-warning" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-default-500 mb-1">LTV</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.ltv)}</p>
                        <p className="text-xs text-default-400">Lifetime value</p>
                      </div>
                      <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
                    </div>
                  </Card>
                </>
              )}
            </div>

            {/* Multi-Currency Revenue Breakdown */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">Multi-Currency Revenue</h3>
                <p className="text-sm text-default-500">Revenue distribution across currencies</p>
              </div>

              {loading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {currencyBreakdown.map((item) => (
                    <div key={item.currency} className="p-4 border border-divider rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Chip size="sm" variant="flat" color="primary">
                          {item.currency}
                        </Chip>
                        <span className="text-xs text-default-500">{item.percentage}%</span>
                      </div>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(item.mrr, item.currency)}</p>
                      <Progress
                        value={item.percentage}
                        size="sm"
                        color="primary"
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Revenue Trend Chart */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">Revenue Trend</h3>
                <p className="text-sm text-default-500">12-month historical MRR</p>
              </div>

              {loading ? (
                <Skeleton className="h-64 rounded" />
              ) : (
                <div className="space-y-2">
                  {revenueTrend.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm text-default-500 w-24">{item.month}</span>
                      <Progress
                        value={(item.mrr / Math.max(...revenueTrend.map(r => r.mrr))) * 100}
                        size="md"
                        color="primary"
                        className="flex-1"
                        showValueLabel
                        formatOptions={{ style: 'currency', currency: 'USD' }}
                      />
                      <span className="text-sm font-semibold text-foreground w-20 text-right">
                        {formatCurrency(item.mrr)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Cohort Analysis */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">Cohort Analysis</h3>
                <p className="text-sm text-default-500">Monthly cohort retention and MRR</p>
              </div>

              {loading ? (
                <Skeleton className="h-64 rounded" />
              ) : (
                <div className="overflow-x-auto">
                  <Table
                    aria-label="Cohort analysis"
                    classNames={{
                      wrapper: "shadow-none border border-divider rounded-lg",
                      th: "bg-default-100 text-default-600 font-semibold",
                      td: "py-3",
                    }}
                  >
                    <TableHeader>
                      <TableColumn>Cohort</TableColumn>
                      <TableColumn>New Subs</TableColumn>
                      <TableColumn>Starting MRR</TableColumn>
                      <TableColumn>Current MRR</TableColumn>
                      <TableColumn>Retention</TableColumn>
                      <TableColumn>Churn</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {cohortData.map((cohort) => (
                        <TableRow key={cohort.month}>
                          <TableCell className="font-semibold">{cohort.month}</TableCell>
                          <TableCell>{cohort.new_subscriptions}</TableCell>
                          <TableCell>{formatCurrency(cohort.starting_mrr)}</TableCell>
                          <TableCell>{formatCurrency(cohort.current_mrr)}</TableCell>
                          <TableCell>
                            <Chip size="sm" variant="flat" color={getStatusColor(cohort.retention_rate)}>
                              {cohort.retention_rate.toFixed(0)}%
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span className="text-danger">{cohort.churn_percentage.toFixed(1)}%</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            {/* Plan Distribution */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">Plan Distribution</h3>
                <p className="text-sm text-default-500">Subscription breakdown by plan tier</p>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {planDistribution.map((plan) => (
                    <div key={plan.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Chip size="sm" variant="flat" color={plan.color || 'default'}>
                            {plan.name}
                          </Chip>
                          <span className="text-sm text-default-500">
                            {plan.count} subscriptions ({plan.percentage}%)
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(plan.mrr)}
                        </span>
                      </div>
                      <Progress
                        value={plan.percentage}
                        size="md"
                        color={plan.color || 'primary'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Export Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-divider rounded-lg">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Export Reports</p>
                <p className="text-xs text-default-500">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                  onPress={handleExportCSV}
                  radius={themeRadius}
                >
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<DocumentIcon className="w-4 h-4" />}
                  onPress={handleExportPDF}
                  radius={themeRadius}
                >
                  Export PDF
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

RevenueAnalytics.layout = (page) => <App>{page}</App>;

export default RevenueAnalytics;
