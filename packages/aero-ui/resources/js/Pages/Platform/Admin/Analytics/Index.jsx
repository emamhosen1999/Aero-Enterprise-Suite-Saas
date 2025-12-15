import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import {
  ChartBarSquareIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from '@heroui/react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts';

const colors = ['#3b82f6', '#a855f7', '#f97316', '#10b981', '#6366f1'];

const mainCardStyle = {
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
};

const headerStyle = {
  borderColor: `var(--theme-divider, #E4E4E7)`,
  background: `linear-gradient(135deg, 
    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
};

const statCardStyle = {
  background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
  border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
  borderRadius: `var(--borderRadius, 12px)`,
};

const moduleColumns = [
  { key: 'name', label: 'MODULE' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'activeTenants', label: 'ACTIVE TENANTS' },
  { key: 'adoption', label: 'ADOPTION' },
  { key: 'lastRelease', label: 'LAST RELEASE' },
];

const AnalyticsIndex = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/analytics/modules')
      .then(response => {
        if (response.data.success) {
          setAnalytics(response.data.analytics);
        }
      })
      .catch(error => {
        console.error('Failed to load analytics:', error);
        showToast.error('Failed to load analytics data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <>
        <Head title="Analytics - Admin" />
        <div className="flex h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (!analytics) {
    return (
      <>
        <Head title="Analytics - Admin" />
        <div className="flex h-screen items-center justify-center">
          <p className="text-default-500">No analytics data available</p>
        </div>
      </>
    );
  }

  const stats = [
    { 
      label: 'Total Modules', 
      value: analytics.overview.total_modules, 
      change: 'Active modules', 
      icon: ChartBarSquareIcon 
    },
    { 
      label: 'Active Tenants', 
      value: analytics.overview.total_tenants, 
      change: 'Across all plans', 
      icon: UserGroupIcon 
    },
    { 
      label: 'Avg Modules/Tenant', 
      value: analytics.overview.avg_modules_per_tenant, 
      change: 'Per subscription', 
      icon: ArrowTrendingUpIcon 
    },
    { 
      label: 'Active Subscriptions', 
      value: analytics.overview.active_subscriptions, 
      change: 'Current status', 
      icon: ShieldCheckIcon 
    },
  ];

  return (
    <>
      <Head title="Analytics - Admin" />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <Card className="transition-all duration-200" style={mainCardStyle}>
          <CardHeader className="border-b p-0" style={headerStyle}>
            <div className="p-6 w-full">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-xl flex items-center justify-center"
                  style={{
                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                    borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                    borderWidth: `var(--borderWidth, 2px)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                  }}
                >
                  <ChartBarSquareIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-foreground">Platform Intelligence</h4>
                  <p className="text-sm text-default-500">
                    Unify revenue, adoption, and retention signals for every tenant.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="p-4" style={statCardStyle}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-default-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-default-400">{stat.change}</p>
                    </div>
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)` }}
                    >
                      <stat.icon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Growth Telemetry Chart - Placeholder for future trends data */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Trending Modules</h5>
                <p className="text-xs text-default-500">
                  Modules with the most new adoptions in the last 30 days.
                </p>
              </div>
              <div className="space-y-3">
                {analytics.trending_modules.length > 0 ? (
                  analytics.trending_modules.map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-3 rounded-lg bg-content2/50">
                      <div>
                        <p className="font-medium text-foreground">{module.name}</p>
                        <p className="text-xs text-default-500">{module.code}</p>
                      </div>
                      <Chip size="sm" color="primary" variant="flat">
                        +{module.new_adoptions} tenants
                      </Chip>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-default-500 py-4">No trending modules in the last 30 days</p>
                )}
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Plan Distribution</h5>
                <p className="text-xs text-default-500">
                  Module counts and subscription stats per plan.
                </p>
              </div>
              <div className="space-y-3">
                {analytics.plan_distribution.map((plan) => (
                  <div key={plan.id} className="p-3 rounded-lg bg-content2/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{plan.name}</p>
                        <p className="text-xs text-default-500">
                          {plan.billing_cycle} · ${plan.price ?? 0}
                        </p>
                      </div>
                      <Chip size="sm" color="success" variant="flat">
                        {plan.active_subscriptions} subscriptions
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-default-500">
                      <span>{plan.module_count} modules</span>
                      {plan.modules.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{plan.modules.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Module Adoption Table */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Module Adoption</h5>
                <p className="text-xs text-default-500">
                  Identify where tenants spend time to prioritise investments.
                </p>
              </div>
              <Table
                aria-label="Module adoption"
                removeWrapper
                classNames={{
                  th: 'bg-transparent text-default-500 font-semibold text-xs uppercase',
                  td: 'py-3',
                }}
              >
                <TableHeader>
                  <TableColumn>MODULE</TableColumn>
                  <TableColumn>CODE</TableColumn>
                  <TableColumn>ACTIVE TENANTS</TableColumn>
                  <TableColumn>ADOPTION RATE</TableColumn>
                  <TableColumn>PLANS</TableColumn>
                </TableHeader>
                <TableBody items={analytics.module_adoption}>
                  {(module) => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{module.name}</span>
                          {module.is_core && (
                            <Chip size="sm" color="success" variant="flat">
                              Core
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-default-500">{module.code}</TableCell>
                      <TableCell>{module.active_tenants}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            module.adoption_rate > 75 
                              ? 'success' 
                              : module.adoption_rate > 50 
                                ? 'warning' 
                                : 'default'
                          }
                        >
                          {module.adoption_rate}%
                        </Chip>
                      </TableCell>
                      <TableCell>{module.total_plans}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

AnalyticsIndex.layout = (page) => <App>{page}</App>;

export default AnalyticsIndex;
