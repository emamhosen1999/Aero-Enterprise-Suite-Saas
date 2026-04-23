import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardBody, CardHeader, Skeleton, Chip, Tabs, Tab } from '@heroui/react';
import {
    ChartBarIcon, UsersIcon, CurrencyDollarIcon, ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { hasRoute } from '@/utils/routing/routeUtils';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EMPTY_CHART = Array.from({ length: 7 }, (_, i) => ({
    name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    value: 0,
}));

/**
 * BusinessSummaryWidget — high-level stats chart + KPIs for the tenant.
 * Fetches data from the dashboard stats API endpoint.
 */
export default function BusinessSummaryWidget() {
    const themeRadius = useThemeRadius();
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(EMPTY_CHART);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('week');

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            if (hasRoute('core.dashboard.stats')) {
                const res = await axios.get(route('core.dashboard.stats'), { params: { period } });
                setStats(res.data);
                if (res.data.chart) setChartData(res.data.chart);
            }
        } catch { /* degrade gracefully */ }
        finally { setLoading(false); }
    }, [period]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const kpis = [
        { label: 'Total Users',     value: stats?.totalUsers ?? '—',     icon: UsersIcon,                   color: 'primary' },
        { label: 'Active Users',    value: stats?.activeUsers ?? '—',    icon: UsersIcon,                   color: 'success' },
        { label: 'New This Month',  value: stats?.usersThisMonth ?? '—', icon: ChartBarIcon,                color: 'warning' },
        { label: 'Total Roles',     value: stats?.totalRoles ?? '—',     icon: ClipboardDocumentCheckIcon,  color: 'secondary' },
    ];

    return (
        <Card className="aero-card" radius={themeRadius}>
            <CardHeader className="flex items-center justify-between border-b border-divider px-5 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-xl"
                        style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}
                    >
                        <ChartBarIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold">Business Summary</h3>
                        <p className="text-xs text-default-500">Overview of your workspace</p>
                    </div>
                </div>
                <Tabs
                    size="sm"
                    radius={themeRadius}
                    selectedKey={period}
                    onSelectionChange={setPeriod}
                    variant="light"
                >
                    <Tab key="week" title="Week" />
                    <Tab key="month" title="Month" />
                    <Tab key="year" title="Year" />
                </Tabs>
            </CardHeader>

            <CardBody className="px-5 py-4 space-y-5">
                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {kpis.map(kpi => {
                        const Icon = kpi.icon;
                        return (
                            <div key={kpi.label} className="flex items-center gap-3 p-3 rounded-lg bg-content2">
                                {loading ? (
                                    <>
                                        <Skeleton className="w-10 h-10 rounded-lg" />
                                        <div className="space-y-1.5 flex-1">
                                            <Skeleton className="h-3 w-16 rounded" />
                                            <Skeleton className="h-5 w-10 rounded" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className="p-2 rounded-lg shrink-0"
                                            style={{ background: `color-mix(in srgb, var(--theme-${kpi.color}, var(--theme-primary)) 15%, transparent)` }}
                                        >
                                            <Icon className="w-5 h-5" style={{ color: `var(--theme-${kpi.color}, var(--theme-primary))` }} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-default-500">{kpi.label}</p>
                                            <p className="text-lg font-bold">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Chart */}
                <div className="h-56 w-full">
                    {loading ? (
                        <Skeleton className="h-full w-full rounded-lg" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--theme-primary, #006FEE)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--theme-primary, #006FEE)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-divider, #E4E4E7)" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: 'var(--theme-foreground-400, #A1A1AA)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: 'var(--theme-foreground-400, #A1A1AA)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 'var(--borderRadius, 8px)',
                                        border: '1px solid var(--theme-divider)',
                                        background: 'var(--theme-content1)',
                                        fontSize: 12,
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="var(--theme-primary, #006FEE)"
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
