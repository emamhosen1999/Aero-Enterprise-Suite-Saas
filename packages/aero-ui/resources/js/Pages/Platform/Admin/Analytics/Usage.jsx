import React from 'react';
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App';
import { usageHeatmap, moduleCatalog } from '@/Pages/Platform/Admin/data/mockData.js';
import {
  BoltIcon,
  ClockIcon,
  UserGroupIcon,
  CpuChipIcon,
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
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';

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

const apdexColumns = [
  { key: 'module', label: 'MODULE' },
  { key: 'peakHour', label: 'PEAK HOUR (UTC)' },
  { key: 'apdex', label: 'APDEX' },
  { key: 'weeklyActive', label: 'WEEKLY ACTIVE' },
];

const UsageAnalytics = () => {
  const totalWau = usageHeatmap.reduce((sum, row) => sum + row.weeklyActive, 0);
  const peakModule = usageHeatmap.reduce(
    (prev, current) => (current.weeklyActive > prev.weeklyActive ? current : prev),
    usageHeatmap[0]
  );

  const stats = [
    { label: 'Weekly active users', value: totalWau.toLocaleString(), change: '+4.8% WoW', icon: UserGroupIcon },
    { label: 'Peak hour', value: peakModule.peakHour, change: peakModule.module, icon: ClockIcon },
    {
      label: 'Avg Apdex',
      value: `${(usageHeatmap.reduce((sum, row) => sum + row.apdex, 0) / usageHeatmap.length).toFixed(2)}`,
      change: 'Last 7 days',
      icon: BoltIcon,
    },
    { label: 'Modules monitored', value: moduleCatalog.length, change: 'With telemetry', icon: CpuChipIcon },
  ];

  const latencySeries = moduleCatalog
    .slice(0, 5)
    .map((module) => ({ name: module.name, latency: Math.round(Math.random() * 250) + 50 }));

  return (
    <>
      <Head title="Usage Analytics - Admin" />
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
                  <BoltIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-foreground">Usage Patterns</h4>
                  <p className="text-sm text-default-500">
                    Understand where tenants spend time and how the platform performs under load.
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

            {/* Weekly Active Users Bar Chart */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Weekly Active Users Per Module</h5>
                <p className="text-xs text-default-500">Spot adoption spikes without diving into each tenant.</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <BarChart data={usageHeatmap} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <XAxis dataKey="module" stroke="var(--theme-default-400)" />
                    <YAxis stroke="var(--theme-default-400)" tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`} />
                    <Tooltip
                      formatter={(value) => [`${value.toLocaleString()} WAU`, 'Users']}
                      contentStyle={{
                        background: 'var(--theme-content1)',
                        borderRadius: '12px',
                        border: '1px solid var(--theme-divider)',
                      }}
                    />
                    <Bar dataKey="weeklyActive" fill="var(--theme-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Apdex & Peak Windows Table */}
            <div>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Apdex & Peak Windows</h5>
                <p className="text-xs text-default-500">Use to align scaling windows with real usage.</p>
              </div>
              <Table
                aria-label="Apdex and peak windows"
                removeWrapper
                classNames={{
                  th: 'bg-transparent text-default-500 font-semibold text-xs uppercase',
                  td: 'py-3',
                }}
              >
                <TableHeader columns={apdexColumns}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={usageHeatmap}>
                  {(row) => (
                    <TableRow key={row.module}>
                      <TableCell className="font-semibold">{row.module}</TableCell>
                      <TableCell>{row.peakHour}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={row.apdex >= 0.95 ? 'success' : row.apdex >= 0.9 ? 'warning' : 'danger'}
                        >
                          {row.apdex}
                        </Chip>
                      </TableCell>
                      <TableCell>{row.weeklyActive.toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Latency Sample Chart */}
            <div className="p-4" style={statCardStyle}>
              <div className="mb-4">
                <h5 className="text-base font-semibold text-foreground">Latency Sample</h5>
                <p className="text-xs text-default-500">Simulated endpoint latency from observability dashboard.</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <LineChart data={latencySeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--theme-default-400)" />
                    <YAxis stroke="var(--theme-default-400)" unit="ms" />
                    <Tooltip
                      formatter={(value) => [`${value} ms`, 'Latency']}
                      contentStyle={{
                        background: 'var(--theme-content1)',
                        borderRadius: '12px',
                        border: '1px solid var(--theme-divider)',
                      }}
                    />
                    <Line type="monotone" dataKey="latency" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

UsageAnalytics.layout = (page) => <App>{page}</App>;

export default UsageAnalytics;
