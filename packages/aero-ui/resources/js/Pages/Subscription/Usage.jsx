import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Card, 
    CardBody, 
    CardHeader,
    Progress,
    Chip,
    Select,
    SelectItem,
    Button
} from '@heroui/react';
import {
    UserGroupIcon,
    CircleStackIcon,
    CloudArrowUpIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import App from '@/Layouts/App';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * Usage Meter Component
 */
const UsageMeter = ({ label, current, limit, unit, icon: Icon, color = 'primary' }) => {
    const percentage = limit === -1 ? 0 : (current / limit) * 100;
    const isNearLimit = percentage > 80;
    const isOverLimit = percentage > 100;

    const getColor = () => {
        if (isOverLimit) return 'danger';
        if (isNearLimit) return 'warning';
        return color;
    };

    return (
        <Card className={isNearLimit ? 'border-2 border-warning' : ''}>
            <CardBody className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-${getColor()}/10`}>
                            <Icon className={`w-6 h-6 text-${getColor()}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{label}</h3>
                            <p className="text-sm text-default-500">
                                {limit === -1 ? 'Unlimited' : `Limit: ${limit.toLocaleString()} ${unit}`}
                            </p>
                        </div>
                    </div>
                    <Chip 
                        color={getColor()} 
                        variant="flat"
                        size="lg"
                    >
                        {percentage.toFixed(1)}%
                    </Chip>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Current Usage</span>
                        <span className="text-default-500">
                            {current.toLocaleString()} {unit}
                        </span>
                    </div>
                    <Progress 
                        value={percentage}
                        color={getColor()}
                        className="max-w-full"
                        size="lg"
                    />
                </div>

                {isNearLimit && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20"
                    >
                        <ExclamationTriangleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-warning-800 dark:text-warning-400">
                                Approaching Limit
                            </p>
                            <p className="text-warning-700 dark:text-warning-500">
                                {isOverLimit 
                                    ? `You've exceeded your ${label.toLowerCase()} limit. Please upgrade your plan.`
                                    : `You're using ${percentage.toFixed(1)}% of your ${label.toLowerCase()}. Consider upgrading soon.`
                                }
                            </p>
                        </div>
                    </motion.div>
                )}
            </CardBody>
        </Card>
    );
};

/**
 * Usage Details Dashboard
 * 
 * Shows detailed usage metrics with historical data and trends.
 */
export default function SubscriptionUsage({ 
    usage, 
    planLimits, 
    historicalData = [],
    period = '30d'
}) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [chartData, setChartData] = useState(null);

    // Prepare chart data
    useEffect(() => {
        if (!historicalData.length) return;

        const labels = historicalData.map(d => 
            new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Active Users',
                    data: historicalData.map(d => d.users),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Storage (GB)',
                    data: historicalData.map(d => (d.storage_bytes / (1024 * 1024 * 1024)).toFixed(2)),
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    fill: true,
                    tension: 0.4,
                }
            ]
        });
    }, [historicalData]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    // Calculate storage in GB
    const storageGB = (usage?.storage_bytes || 0) / (1024 * 1024 * 1024);

    return (
        <App>
            <Head title="Usage Details" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Usage Details
                    </h1>
                    <p className="text-default-500">
                        Monitor your resource consumption and plan limits
                    </p>
                </div>

                {/* Usage Meters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <UsageMeter
                        label="Active Users"
                        current={usage?.users || 0}
                        limit={planLimits?.max_users || 0}
                        unit="users"
                        icon={UserGroupIcon}
                        color="primary"
                    />

                    <UsageMeter
                        label="Storage"
                        current={parseFloat(storageGB.toFixed(2))}
                        limit={planLimits?.max_storage_gb || 0}
                        unit="GB"
                        icon={CircleStackIcon}
                        color="secondary"
                    />

                    <UsageMeter
                        label="API Calls"
                        current={usage?.api_calls || 0}
                        limit={planLimits?.max_api_calls || -1}
                        unit="calls"
                        icon={CloudArrowUpIcon}
                        color="success"
                    />
                </div>

                {/* Historical Trends */}
                <Card className="mb-8">
                    <CardHeader className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Usage Trends</h2>
                            <p className="text-sm text-default-500 mt-1">
                                Historical usage over time
                            </p>
                        </div>
                        <Select
                            size="sm"
                            selectedKeys={[selectedPeriod]}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="w-40"
                            startContent={<CalendarIcon className="w-4 h-4" />}
                        >
                            <SelectItem key="7d" value="7d">Last 7 Days</SelectItem>
                            <SelectItem key="30d" value="30d">Last 30 Days</SelectItem>
                            <SelectItem key="90d" value="90d">Last 90 Days</SelectItem>
                        </Select>
                    </CardHeader>
                    <CardBody>
                        {chartData ? (
                            <div className="h-80">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-default-500">
                                No historical data available
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Storage Breakdown */}
                    <Card>
                        <CardHeader>
                            <div>
                                <h3 className="text-lg font-semibold">Storage Breakdown</h3>
                                <p className="text-sm text-default-500 mt-1">
                                    Usage by category
                                </p>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {usage?.storage_breakdown ? (
                                Object.entries(usage.storage_breakdown).map(([category, bytes]) => {
                                    const gb = (bytes / (1024 * 1024 * 1024)).toFixed(2);
                                    const percentage = ((bytes / usage.storage_bytes) * 100).toFixed(1);
                                    
                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-medium capitalize">{category}</span>
                                                <span className="text-sm text-default-500">
                                                    {gb} GB ({percentage}%)
                                                </span>
                                            </div>
                                            <Progress 
                                                value={parseFloat(percentage)}
                                                color="secondary"
                                                className="max-w-full"
                                            />
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-default-500 py-8">
                                    No storage breakdown available
                                </p>
                            )}
                        </CardBody>
                    </Card>

                    {/* User Activity */}
                    <Card>
                        <CardHeader>
                            <div>
                                <h3 className="text-lg font-semibold">User Activity</h3>
                                <p className="text-sm text-default-500 mt-1">
                                    Active vs. inactive users
                                </p>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Active Users (Last 30 Days)</span>
                                    <span className="text-sm text-default-500">
                                        {usage?.active_users || 0} / {usage?.users || 0}
                                    </span>
                                </div>
                                <Progress 
                                    value={usage?.users ? ((usage.active_users || 0) / usage.users) * 100 : 0}
                                    color="success"
                                    className="max-w-full"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Inactive Users</span>
                                    <span className="text-sm text-default-500">
                                        {(usage?.users || 0) - (usage?.active_users || 0)} / {usage?.users || 0}
                                    </span>
                                </div>
                                <Progress 
                                    value={usage?.users ? (((usage.users - usage.active_users) || 0) / usage.users) * 100 : 0}
                                    color="default"
                                    className="max-w-full"
                                />
                            </div>

                            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowTrendingUpIcon className="w-5 h-5 text-primary" />
                                    <span className="font-semibold text-primary-800 dark:text-primary-400">
                                        Activity Insight
                                    </span>
                                </div>
                                <p className="text-sm text-primary-700 dark:text-primary-500">
                                    {usage?.active_users && usage?.users 
                                        ? `${((usage.active_users / usage.users) * 100).toFixed(1)}% of your users are active. Great engagement!`
                                        : 'Add more users to see activity insights.'
                                    }
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Usage Summary */}
                <Card className="mt-6">
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Monthly Usage Summary</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-sm text-default-500 mb-1">Total Users</p>
                                <p className="text-3xl font-bold text-primary">{usage?.users || 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-default-500 mb-1">Storage Used</p>
                                <p className="text-3xl font-bold text-secondary">{storageGB.toFixed(2)} GB</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-default-500 mb-1">API Calls</p>
                                <p className="text-3xl font-bold text-success">
                                    {(usage?.api_calls || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-default-500 mb-1">Active Modules</p>
                                <p className="text-3xl font-bold text-warning">{usage?.active_modules || 0}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </App>
    );
}
