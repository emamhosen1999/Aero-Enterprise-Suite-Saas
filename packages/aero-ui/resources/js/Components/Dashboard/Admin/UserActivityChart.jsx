import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Tabs, Tab, Skeleton } from '@heroui/react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import axios from 'axios';

let AreaChartLazy = null;

const UserActivityChart = () => {
    const [period, setPeriod] = useState('week');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartComponents, setChartComponents] = useState(null);

    // Lazy load recharts
    useEffect(() => {
        import('recharts').then(mod => {
            setChartComponents({
                AreaChart: mod.AreaChart,
                Area: mod.Area,
                XAxis: mod.XAxis,
                YAxis: mod.YAxis,
                Tooltip: mod.Tooltip,
                ResponsiveContainer: mod.ResponsiveContainer,
                CartesianGrid: mod.CartesianGrid,
            });
        });
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('core.dashboard.user-activity'), { params: { period } });
            setData(res.data);
        } catch {
            setData({ chartData: [], peakHours: [] });
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const chartData = data?.chartData || [];

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4 flex flex-row items-center justify-between"
                style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}
            >
                <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="font-semibold">User Activity</h3>
                </div>
                <Tabs
                    selectedKey={period}
                    onSelectionChange={setPeriod}
                    size="sm"
                    variant="light"
                    aria-label="Activity period"
                >
                    <Tab key="week" title="Week" />
                    <Tab key="month" title="Month" />
                    <Tab key="quarter" title="Quarter" />
                </Tabs>
            </CardHeader>
            <CardBody className="p-4">
                {loading || !chartComponents ? (
                    <Skeleton className="h-64 w-full rounded-lg" />
                ) : chartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-default-400 text-sm">
                        No activity data available
                    </div>
                ) : (
                    <div className="h-64">
                        <chartComponents.ResponsiveContainer width="100%" height="100%">
                            <chartComponents.AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--heroui-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--heroui-primary)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--heroui-success)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--heroui-success)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <chartComponents.CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <chartComponents.XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                />
                                <chartComponents.YAxis tick={{ fontSize: 11 }} />
                                <chartComponents.Tooltip
                                    labelFormatter={(d) => new Date(d).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                                />
                                <chartComponents.Area
                                    type="monotone"
                                    dataKey="activeUsers"
                                    name="Active Users"
                                    stroke="var(--heroui-primary)"
                                    fill="url(#activeGrad)"
                                    strokeWidth={2}
                                />
                                <chartComponents.Area
                                    type="monotone"
                                    dataKey="newUsers"
                                    name="New Users"
                                    stroke="var(--heroui-success)"
                                    fill="url(#newGrad)"
                                    strokeWidth={2}
                                />
                            </chartComponents.AreaChart>
                        </chartComponents.ResponsiveContainer>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default UserActivityChart;
