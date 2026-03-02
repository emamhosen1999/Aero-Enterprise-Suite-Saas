import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Select, SelectItem, Tabs, Tab } from "@heroui/react";
import { 
    ChartBarIcon, 
    ArrowTrendingUpIcon,
    DocumentChartBarIcon,
    CubeIcon,
    ArrowsRightLeftIcon,
    CurrencyDollarIcon,
    ClockIcon,
    DocumentArrowDownIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import NetworkAnalyticsChart from '@/Components/Charts/NetworkAnalyticsChart.jsx';
import TransactionVolumeChart from '@/Components/Charts/TransactionVolumeChart.jsx';
import TokenAnalyticsChart from '@/Components/Charts/TokenAnalyticsChart.jsx';
import BlockchainMetricsTable from '@/Tables/BlockchainMetricsTable.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

const BlockchainAnalytics = ({ title }) => {
    const { auth } = usePage().props;
    
    // 1. Theme radius helper (REQUIRED)
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
    // 2. Responsive breakpoints (REQUIRED)
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // 3. State management
    const [loading, setLoading] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState('all');
    const [timeRange, setTimeRange] = useState('24h');
    const [stats, setStats] = useState({ 
        totalTransactions: 0,
        totalVolume: 0,
        averageBlockTime: 0,
        networkHashRate: 0,
        activeAddresses: 0,
        gasUtilization: 0
    });
    const [chartData, setChartData] = useState({
        network: [],
        volume: [],
        tokens: []
    });
    const [networks, setNetworks] = useState([]);
    const [metricsData, setMetricsData] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    // 4. Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        { 
            title: "Total Transactions", 
            value: stats.totalTransactions.toLocaleString(), 
            icon: <ArrowsRightLeftIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20",
            change: "+12.5%",
            trend: "up"
        },
        { 
            title: "Total Volume", 
            value: `$${stats.totalVolume.toLocaleString()}`, 
            icon: <CurrencyDollarIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20",
            change: "+8.3%",
            trend: "up"
        },
        { 
            title: "Avg Block Time", 
            value: `${stats.averageBlockTime}s`, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20",
            change: "-2.1%",
            trend: "down"
        },
        { 
            title: "Network Hash Rate", 
            value: `${stats.networkHashRate} TH/s`, 
            icon: <CubeIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20",
            change: "+5.7%",
            trend: "up"
        },
        { 
            title: "Active Addresses", 
            value: stats.activeAddresses.toLocaleString(), 
            icon: <DocumentChartBarIcon className="w-6 h-6" />, 
            color: "text-info", 
            iconBg: "bg-info/20",
            change: "+18.9%",
            trend: "up"
        },
        { 
            title: "Gas Utilization", 
            value: `${stats.gasUtilization}%`, 
            icon: <ArrowTrendingUpIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20",
            change: "+3.2%",
            trend: "up"
        }
    ], [stats]);

    // 5. Permission checks (REQUIRED)
    const canViewAnalytics = auth.permissions?.includes('blockchain.analytics.view') || false;
    const canExport = auth.permissions?.includes('blockchain.analytics.export') || false;

    // 6. Data fetching with axios
    const fetchAnalyticsData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                network: selectedNetwork,
                timeRange: timeRange
            };
            
            const [statsResponse, chartsResponse, metricsResponse] = await Promise.all([
                axios.get(route('api.blockchain.analytics.stats'), { params }),
                axios.get(route('api.blockchain.analytics.charts'), { params }),
                axios.get(route('api.blockchain.analytics.metrics'), { params })
            ]);
            
            if (statsResponse.status === 200) {
                setStats(statsResponse.data);
            }
            if (chartsResponse.status === 200) {
                setChartData(chartsResponse.data);
            }
            if (metricsResponse.status === 200) {
                setMetricsData(metricsResponse.data);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { 
                error: 'Failed to fetch analytics data' 
            });
        } finally {
            setLoading(false);
        }
    }, [selectedNetwork, timeRange]);

    const fetchNetworks = useCallback(async () => {
        try {
            const response = await axios.get(route('api.blockchain.networks.index'));
            if (response.status === 200) {
                setNetworks(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch networks:', error);
        }
    }, []);

    useEffect(() => { 
        if (canViewAnalytics) {
            fetchAnalyticsData(); 
        }
    }, [fetchAnalyticsData, canViewAnalytics]);
    
    useEffect(() => {
        fetchNetworks();
    }, [fetchNetworks]);

    // Export handler
    const handleExport = useCallback(async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.get(route('api.blockchain.analytics.export'), {
                    params: {
                        network: selectedNetwork,
                        timeRange: timeRange,
                        format: 'csv'
                    },
                    responseType: 'blob'
                });
                
                if (response.status === 200) {
                    // Create download link
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `blockchain-analytics-${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    
                    resolve(['Analytics data exported successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to export analytics data');
            }
        });

        showToast.promise(promise, {
            loading: 'Exporting analytics data...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [selectedNetwork, timeRange]);

    if (!canViewAnalytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-default-500">Access to blockchain analytics is not permitted for your account.</p>
            </div>
        );
    }

    // RENDER STRUCTURE (CRITICAL - Follow exactly)
    return (
        <>
            <Head title={title || "Blockchain Analytics"} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Blockchain Analytics">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                {/* Card Header with title + action buttons */}
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section with icon */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ChartBarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Blockchain Analytics
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Real-time blockchain metrics and performance insights
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons and Filters */}
                                            <div className="flex gap-2 flex-wrap items-center">
                                                <Select
                                                    label="Network"
                                                    selectedKeys={selectedNetwork !== 'all' ? [selectedNetwork] : []}
                                                    onSelectionChange={(keys) => setSelectedNetwork(Array.from(keys)[0] || 'all')}
                                                    classNames={{ trigger: "bg-default-100" }}
                                                    radius={getThemeRadius()}
                                                    variant="bordered"
                                                    size="sm"
                                                    className="w-32"
                                                >
                                                    <SelectItem key="all">All Networks</SelectItem>
                                                    {networks.map(network => (
                                                        <SelectItem key={network.id} value={network.id}>
                                                            {network.name}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                                
                                                <Select
                                                    label="Time Range"
                                                    selectedKeys={[timeRange]}
                                                    onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0])}
                                                    classNames={{ trigger: "bg-default-100" }}
                                                    radius={getThemeRadius()}
                                                    variant="bordered"
                                                    size="sm"
                                                    className="w-28"
                                                >
                                                    <SelectItem key="1h">1 Hour</SelectItem>
                                                    <SelectItem key="24h">24 Hours</SelectItem>
                                                    <SelectItem key="7d">7 Days</SelectItem>
                                                    <SelectItem key="30d">30 Days</SelectItem>
                                                    <SelectItem key="90d">90 Days</SelectItem>
                                                </Select>
                                                
                                                {canExport && (
                                                    <Button color="secondary" variant="flat"
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                        onPress={handleExport}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Export
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* 1. Stats Cards (REQUIRED at top) */}
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading} showTrend={true} />
                                    
                                    {/* 2. Analytics Tabs */}
                                    <Tabs 
                                        selectedKey={activeTab} 
                                        onSelectionChange={setActiveTab}
                                        variant="underlined"
                                        classNames={{
                                            tabList: "gap-6",
                                            cursor: "w-full bg-primary",
                                            tab: "max-w-fit px-0 h-12",
                                            tabContent: "group-data-[selected=true]:text-primary"
                                        }}
                                    >
                                        <Tab key="overview" title="Network Overview">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="font-semibold">Network Performance</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <NetworkAnalyticsChart 
                                                            data={chartData.network} 
                                                            loading={loading}
                                                            timeRange={timeRange}
                                                        />
                                                    </CardBody>
                                                </Card>
                                                
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="font-semibold">Transaction Volume</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <TransactionVolumeChart 
                                                            data={chartData.volume} 
                                                            loading={loading}
                                                            timeRange={timeRange}
                                                        />
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>
                                        
                                        <Tab key="tokens" title="Token Analytics">
                                            <div className="mt-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="font-semibold">Token Performance</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <TokenAnalyticsChart 
                                                            data={chartData.tokens} 
                                                            loading={loading}
                                                            timeRange={timeRange}
                                                        />
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>
                                        
                                        <Tab key="metrics" title="Detailed Metrics">
                                            <div className="mt-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="font-semibold">Blockchain Metrics</h3>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <BlockchainMetricsTable 
                                                            metrics={metricsData}
                                                            loading={loading}
                                                        />
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>
                                    </Tabs>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

// REQUIRED: Use App layout wrapper
BlockchainAnalytics.layout = (page) => <App children={page} />;
export default BlockchainAnalytics;