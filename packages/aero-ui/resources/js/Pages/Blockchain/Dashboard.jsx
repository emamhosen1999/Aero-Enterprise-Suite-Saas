import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { 
    CubeIcon, 
    WalletIcon, 
    ArrowsRightLeftIcon, 
    DocumentTextIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    PlusIcon,
    CogIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { router } from '@inertiajs/react';

const BlockchainDashboard = ({ title }) => {
    const { auth } = usePage().props;
    const { hasAccess: hrmacHasAccess } = useHRMAC();
    
    // 1. Theme radius helper (REQUIRED)
    const themeRadius = useThemeRadius();
    
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
    const [stats, setStats] = useState({ 
        networks: 0, 
        wallets: 0, 
        transactions: 0, 
        totalValue: 0, 
        activeTokens: 0, 
        smartContracts: 0 
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [portfolioData, setPortfolioData] = useState([]);

    // 4. Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        { 
            title: "Networks", 
            value: stats.networks, 
            icon: <CubeIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Wallets", 
            value: stats.wallets, 
            icon: <WalletIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Transactions", 
            value: stats.transactions, 
            icon: <ArrowsRightLeftIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Portfolio Value", 
            value: `$${stats.totalValue.toLocaleString()}`, 
            icon: <CurrencyDollarIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
        { 
            title: "Active Tokens", 
            value: stats.activeTokens, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-info", 
            iconBg: "bg-info/20" 
        },
        { 
            title: "Smart Contracts", 
            value: stats.smartContracts, 
            icon: <ChartBarIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        }
    ], [stats]);

    // 5. Permission checks (REQUIRED)
    const canCreate = hrmacHasAccess('blockchain.create');
    const canManage = hrmacHasAccess('blockchain.manage');

    // 6. Data fetching with axios
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsResponse, activityResponse, portfolioResponse] = await Promise.all([
                axios.get(route('api.blockchain.dashboard.stats')),
                axios.get(route('api.blockchain.dashboard.activity')),
                axios.get(route('api.blockchain.dashboard.portfolio'))
            ]);
            
            if (statsResponse.status === 200) {
                setStats(statsResponse.data);
            }
            if (activityResponse.status === 200) {
                setRecentActivity(activityResponse.data);
            }
            if (portfolioResponse.status === 200) {
                setPortfolioData(portfolioResponse.data);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { 
                error: 'Failed to load dashboard data' 
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchDashboardData(); 
    }, [fetchDashboardData]);

    // Quick action handlers
    const handleQuickAction = useCallback((action) => {
        switch (action) {
            case 'create-wallet':
                router.visit(route('blockchain.wallets.create'));
                break;
            case 'send-transaction':
                router.visit(route('blockchain.transactions.create'));
                break;
            case 'deploy-contract':
                router.visit(route('blockchain.contracts.create'));
                break;
            case 'manage-tokens':
                router.visit(route('blockchain.tokens.index'));
                break;
        }
    }, []);

    // RENDER STRUCTURE (CRITICAL - Follow exactly)
    return (
        <>
            <Head title={title || "Blockchain Dashboard"} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Blockchain Dashboard">
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
                                                    <CubeIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Blockchain Dashboard
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage your blockchain networks, wallets, and transactions
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <>
                                                        <Button 
                                                            color="primary" 
                                                            variant="shadow"
                                                            startContent={<WalletIcon className="w-4 h-4" />}
                                                            onPress={() => handleQuickAction('create-wallet')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            New Wallet
                                                        </Button>
                                                        <Button 
                                                            color="secondary" 
                                                            variant="flat"
                                                            startContent={<ArrowsRightLeftIcon className="w-4 h-4" />}
                                                            onPress={() => handleQuickAction('send-transaction')}
                                                            size={isMobile ? "sm" : "md"}
                                                        >
                                                            Send
                                                        </Button>
                                                    </>
                                                )}
                                                {canManage && (
                                                    <Button 
                                                        color="default" 
                                                        variant="bordered"
                                                        isIconOnly={isMobile}
                                                        startContent={<CogIcon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route('blockchain.settings.index'))}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        {!isMobile && "Settings"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* 1. Stats Cards (REQUIRED at top) */}
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading} />
                                    
                                    {/* 2. Quick Actions Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                                        <Card isPressable onPress={() => handleQuickAction('create-wallet')} className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                            <CardBody className="p-4 text-center">
                                                <WalletIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                                <h3 className="font-semibold text-blue-900">Create Wallet</h3>
                                                <p className="text-xs text-blue-700">Generate new crypto wallet</p>
                                            </CardBody>
                                        </Card>
                                        
                                        <Card isPressable onPress={() => handleQuickAction('send-transaction')} className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                                            <CardBody className="p-4 text-center">
                                                <ArrowsRightLeftIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                                <h3 className="font-semibold text-green-900">Send Transaction</h3>
                                                <p className="text-xs text-green-700">Transfer tokens or crypto</p>
                                            </CardBody>
                                        </Card>
                                        
                                        <Card isPressable onPress={() => handleQuickAction('deploy-contract')} className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                                            <CardBody className="p-4 text-center">
                                                <DocumentTextIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                                <h3 className="font-semibold text-purple-900">Deploy Contract</h3>
                                                <p className="text-xs text-purple-700">Create smart contract</p>
                                            </CardBody>
                                        </Card>
                                        
                                        <Card isPressable onPress={() => handleQuickAction('manage-tokens')} className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                                            <CardBody className="p-4 text-center">
                                                <CurrencyDollarIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                                <h3 className="font-semibold text-orange-900">Manage Tokens</h3>
                                                <p className="text-xs text-orange-700">View token portfolio</p>
                                            </CardBody>
                                        </Card>
                                    </div>
                                    
                                    {/* 3. Dashboard Content Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Recent Activity */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <h3 className="font-semibold">Recent Activity</h3>
                                            </CardHeader>
                                            <CardBody className="pt-0">
                                                {loading ? (
                                                    <div className="space-y-3">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <div key={i} className="flex gap-3 animate-pulse">
                                                                <div className="w-10 h-10 bg-default-300 rounded-full" />
                                                                <div className="flex-1 space-y-2">
                                                                    <div className="h-3 bg-default-300 rounded w-3/4" />
                                                                    <div className="h-2 bg-default-200 rounded w-1/2" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : recentActivity.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {recentActivity.map((activity, index) => (
                                                            <div key={index} className="flex gap-3 p-2 rounded-lg hover:bg-content2">
                                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                    <ArrowsRightLeftIcon className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium">{activity.description}</p>
                                                                    <p className="text-xs text-default-500">{activity.timestamp}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-center text-default-500 py-8">No recent activity</p>
                                                )}
                                            </CardBody>
                                        </Card>
                                        
                                        {/* Portfolio Overview */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <h3 className="font-semibold">Portfolio Overview</h3>
                                            </CardHeader>
                                            <CardBody className="pt-0">
                                                {loading ? (
                                                    <div className="space-y-3">
                                                        {Array.from({ length: 4 }).map((_, i) => (
                                                            <div key={i} className="flex justify-between items-center animate-pulse">
                                                                <div className="flex gap-3">
                                                                    <div className="w-8 h-8 bg-default-300 rounded-full" />
                                                                    <div className="space-y-1">
                                                                        <div className="h-3 bg-default-300 rounded w-16" />
                                                                        <div className="h-2 bg-default-200 rounded w-12" />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="h-3 bg-default-300 rounded w-20" />
                                                                    <div className="h-2 bg-default-200 rounded w-16" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : portfolioData.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {portfolioData.map((token, index) => (
                                                            <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-content2">
                                                                <div className="flex gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                                                                        <CurrencyDollarIcon className="w-4 h-4 text-warning" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-sm">{token.symbol}</p>
                                                                        <p className="text-xs text-default-500">{token.name}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-medium text-sm">{token.balance}</p>
                                                                    <p className="text-xs text-default-500">${token.value}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-center text-default-500 py-8">No tokens in portfolio</p>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </div>
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
BlockchainDashboard.layout = (page) => <App children={page} />;
export default BlockchainDashboard;