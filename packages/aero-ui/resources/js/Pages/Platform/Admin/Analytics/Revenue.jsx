import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App';
import { planCatalog, analyticsTimeSeries, billingSummary } from '@/Pages/Platform/Admin/data/mockData.js';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Squares2X2Icon,
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
} from '@heroui/react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';

const colors = ['#2563eb', '#a855f7', '#ec4899', '#f97316'];

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

const planColumns = [
  { key: 'name', label: 'PLAN' },
  { key: 'mrrShare', label: 'MRR SHARE' },
  { key: 'tenants', label: 'TENANTS' },
  { key: 'utilization', label: 'SEAT UTILISATION' },
];

const RevenueAnalytics = () => {
  const stats = [
    { label: 'MRR', value: `$${(billingSummary.mrr / 1000).toFixed(1)}k`, change: '+2.1% MoM', icon: CurrencyDollarIcon },
    { label: 'ARR', value: `$${(billingSummary.arr / 1000000).toFixed(1)}M`, change: 'Forecasted', icon: ArrowTrendingUpIcon },
    { label: 'Expansion MRR', value: `$${(billingSummary.expansionMRR / 1000).toFixed(1)}k`, change: 'Quarter to date', icon: Squares2X2Icon },
    { label: 'Contraction MRR', value: `$${(billingSummary.contractionMRR / 1000).toFixed(1)}k`, change: 'Quarter to date', icon: ArrowTrendingDownIcon },
  ];

  const planContribution = useMemo(
    () =>
      planCatalog.map((plan) => ({
        name: plan.name,
        mrr: plan.price * plan.activeTenants,
        tenants: plan.activeTenants,
        utilization: plan.avgSeatUtilization,
      })),
    []
  );

  const totalPlanMrr = planContribution.reduce((sum, plan) => sum + plan.mrr, 0);

  const gradientData = analyticsTimeSeries.mrr.map((entry) => ({ month: entry.month, value: entry.value / 1000 }));

  return (
    <>
      <Head title="Revenue Analytics - Admin" />
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
                  <CurrencyDollarIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-foreground">Revenue Intelligence</h4>
                  <p className="text-sm text-default-500">
                    Break down recurring revenue by plan, cohort, and monetisation motion.
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

            {/* MRR Trend Chart */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">MRR Trend</h5>
                <p className="text-xs text-default-500">Smoothed view eliminates daily volatility from true-ups.</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <AreaChart data={gradientData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="var(--theme-default-400)" />
                    <YAxis stroke="var(--theme-default-400)" tickFormatter={(value) => `$${value}k`} width={70} />
                    <Tooltip
                      formatter={(value) => [`$${value.toFixed(1)}k`, 'MRR']}
                      contentStyle={{
                        background: 'var(--theme-content1)',
                        borderRadius: '12px',
                        border: '1px solid var(--theme-divider)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--theme-primary)"
                      fill="url(#revenueGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Contribution Table */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Plan Contribution</h5>
                <p className="text-xs text-default-500">How much each plan contributes to current MRR.</p>
              </div>
              <Table
                aria-label="Plan contribution"
                removeWrapper
                classNames={{
                  th: 'bg-transparent text-default-500 font-semibold text-xs uppercase',
                  td: 'py-3',
                }}
              >
                <TableHeader columns={planColumns}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={planContribution}>
                  {(plan) => (
                    <TableRow key={plan.name}>
                      <TableCell className="font-semibold">{plan.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 rounded-full bg-primary/20 w-24">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${Math.round((plan.mrr / totalPlanMrr) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-default-500">
                            {Math.round((plan.mrr / totalPlanMrr) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{plan.tenants}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={plan.utilization > 0.8 ? 'success' : 'warning'}>
                          {(plan.utilization * 100).toFixed(0)}%
                        </Chip>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Revenue Mix Chart */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Revenue Mix</h5>
                <p className="text-xs text-default-500">
                  Subscriptions still dominate, but add-ons and services are growing.
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={analyticsTimeSeries.revenueMix} dataKey="value" outerRadius={120} label>
                      {analyticsTimeSeries.revenueMix.map((entry, index) => (
                        <Cell key={entry.name} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
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
