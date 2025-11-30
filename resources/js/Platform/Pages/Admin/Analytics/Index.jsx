import React from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import { analyticsTimeSeries, moduleCatalog, planCatalog } from '@/Platform/Pages/Admin/data/mockData.js';
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
} from '@heroui/react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, PieChart, Pie, Cell, Legend } from 'recharts';

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
  const stats = [
    { label: 'MRR growth', value: '+12.1% YoY', change: 'Last 12 months', icon: ArrowTrendingUpIcon },
    { label: 'Active tenants', value: planCatalog.reduce((sum, plan) => sum + plan.activeTenants, 0), change: 'Across all plans', icon: UserGroupIcon },
    { label: 'Module adoption', value: `${Math.round(moduleCatalog.reduce((sum, module) => sum + module.adoption, 0) / moduleCatalog.length)}%`, change: 'Weighted average', icon: ChartBarSquareIcon },
    { label: 'Churn rate', value: `${analyticsTimeSeries.churn[analyticsTimeSeries.churn.length - 1].value}%`, change: 'Rolling 30d', icon: ShieldCheckIcon },
  ];

  const growthData = analyticsTimeSeries.mrr.map((entry, index) => ({
    month: entry.month,
    mrr: entry.value / 1000,
    tenants: analyticsTimeSeries.newTenants[index]?.value ?? 0,
  }));

  return (
    <>
      <Head title="Analytics" />
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

            {/* Growth Telemetry Chart */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Growth Telemetry</h5>
                <p className="text-xs text-default-500">
                  Track how recurring revenue moves alongside net new tenants.
                </p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer>
                  <LineChart data={growthData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="var(--theme-default-400)" />
                    <YAxis
                      yAxisId="left"
                      stroke="var(--theme-default-400)"
                      tickFormatter={(value) => `$${value}k`}
                    />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--theme-default-400)" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--theme-content1)',
                        borderRadius: '12px',
                        border: '1px solid var(--theme-divider)',
                      }}
                    />
                    <Area type="monotone" dataKey="mrr" stroke="var(--theme-primary)" fill="url(#mrrGradient)" yAxisId="left" />
                    <Line type="monotone" dataKey="tenants" stroke="#a855f7" yAxisId="right" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Churn Compression Chart */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Churn Compression</h5>
                <p className="text-xs text-default-500">
                  See churn trendlines before and after lifecycle initiatives.
                </p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <LineChart data={analyticsTimeSeries.churn} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="var(--theme-default-400)" />
                    <YAxis stroke="var(--theme-default-400)" unit="%" />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Churn']}
                      contentStyle={{
                        background: 'var(--theme-content1)',
                        borderRadius: '12px',
                        border: '1px solid var(--theme-divider)',
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Regional Distribution */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Regional Distribution</h5>
                <p className="text-xs text-default-500">
                  Share of live tenants across regions. Drill in for geo expansions.
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={analyticsTimeSeries.geoSplit} outerRadius={110} dataKey="value" label>
                      {analyticsTimeSeries.geoSplit.map((entry, index) => (
                        <Cell key={entry.name} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Module Adoption Table */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Top Module Adoption</h5>
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
                <TableHeader columns={moduleColumns}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={moduleCatalog}>
                  {(module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-semibold">{module.name}</TableCell>
                      <TableCell>{module.category}</TableCell>
                      <TableCell>{module.activeTenants}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={module.adoption > 75 ? 'success' : module.adoption > 50 ? 'warning' : 'default'}
                        >
                          {module.adoption}%
                        </Chip>
                      </TableCell>
                      <TableCell className="text-default-500">{module.lastRelease}</TableCell>
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
