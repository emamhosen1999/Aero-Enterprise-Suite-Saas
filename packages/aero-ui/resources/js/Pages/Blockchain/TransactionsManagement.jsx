import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Tooltip } from "@heroui/react";
import { 
    ArrowsRightLeftIcon, 
    PlusIcon, 
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    BanknotesIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import TransactionsTable from '@/Tables/TransactionsTable.jsx';
import SendTransactionModal from '@/Components/Modals/SendTransactionModal.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const TransactionsManagement = ({ title }) => {
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
    const [transactions, setTransactions] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        status: 'all', 
        type: 'all',
        network: 'all',
        dateRange: 'all'
    });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0 });
    const [stats, setStats] = useState({ 
        total: 0, 
        pending: 0, 
        confirmed: 0, 
        failed: 0,
        totalVolume: 0,
        avgFee: 0
    });
    const [modalStates, setModalStates] = useState({ send: false, details: false });
    const [networks, setNetworks] = useState([]);
    const [wallets, setWallets] = useState([]);

    // 4. Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        { 
            title: "Total Transactions", 
            value: stats.total, 
            icon: <ArrowsRightLeftIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Pending", 
            value: stats.pending, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Confirmed", 
            value: stats.confirmed, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Failed", 
            value: stats.failed, 
            icon: <XCircleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Total Volume", 
            value: `$${stats.totalVolume.toLocaleString()}`, 
            icon: <BanknotesIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
        { 
            title: "Average Fee", 
            value: `$${stats.avgFee.toFixed(2)}`, 
            icon: <ArrowUpIcon className="w-6 h-6" />, 
            color: "text-info", 
            iconBg: "bg-info/20" 
        }
    ], [stats]);

    // 5. Permission checks (REQUIRED)
    const canCreate = hrmacHasAccess('blockchain.transactions.create');
    const canView = hrmacHasAccess('blockchain.transactions.view');

    // 6. Data fetching with axios
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.blockchain.transactions.index'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage, 
                    ...filters 
                }
            });
            
            if (response.status === 200) {
                setTransactions(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total
                }));
                setStats(response.data.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { 
                error: 'Failed to fetch transactions' 
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchData = useCallback(async () => {
        try {
            const [networksResponse, walletsResponse] = await Promise.all([
                axios.get(route('api.blockchain.networks.index')),
                axios.get(route('api.blockchain.wallets.index'))
            ]);
            
            if (networksResponse.status === 200) {
                setNetworks(networksResponse.data);
            }
            if (walletsResponse.status === 200) {
                setWallets(walletsResponse.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch supporting data:', error);
        }
    }, []);

    useEffect(() => { 
        fetchTransactions(); 
    }, [fetchTransactions]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Modal handlers
    const openModal = useCallback((modal) => {
        setModalStates(prev => ({ ...prev, [modal]: true }));
    }, []);

    const closeModal = useCallback((modal) => {
        setModalStates(prev => ({ ...prev, [modal]: false }));
    }, []);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const handleSearchChange = useCallback((value) => {
        handleFilterChange('search', value);
    }, [handleFilterChange]);

    // Transaction actions
    const handleSendTransaction = useCallback(async (transactionData) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('api.blockchain.transactions.store'), transactionData);
                if (response.status === 201) {
                    await fetchTransactions();
                    closeModal('send');
                    resolve([response.data.message || 'Transaction initiated successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to send transaction']);
            }
        });

        showToast.promise(promise, {
            loading: 'Sending transaction...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [fetchTransactions, closeModal]);

    // RENDER STRUCTURE (CRITICAL - Follow exactly)
    return (
        <>
            <Head title={title || "Transactions Management"} />
            
            {/* Modals go BEFORE main content */}
            {modalStates.send && (
                <SendTransactionModal 
                    open={modalStates.send} 
                    onClose={() => closeModal('send')}
                    onSubmit={handleSendTransaction}
                    wallets={wallets}
                    networks={networks}
                />
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Transactions Management">
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
                                                    <ArrowsRightLeftIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Transactions Management
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Monitor and manage blockchain transactions
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('send')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Send Transaction
                                                    </Button>
                                                )}
                                                <Button color="secondary" variant="flat"
                                                    startContent={<ArrowDownIcon className="w-4 h-4" />}
                                                    onPress={() => fetchTransactions()}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Refresh
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* 1. Stats Cards (REQUIRED at top) */}
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading} />
                                    
                                    {/* 2. Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                        <Input
                                            label="Search Transactions"
                                            placeholder="Search by hash, address, or amount..."
                                            value={filters.search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                inputWrapper: "bg-default-100"
                                            }}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                        />
                                        
                                        <Select
                                            label="Status"
                                            placeholder="All Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="pending">Pending</SelectItem>
                                            <SelectItem key="confirmed">Confirmed</SelectItem>
                                            <SelectItem key="failed">Failed</SelectItem>
                                        </Select>
                                        
                                        <Select
                                            label="Type"
                                            placeholder="All Types"
                                            selectedKeys={filters.type !== 'all' ? [filters.type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            <SelectItem key="transfer">Transfer</SelectItem>
                                            <SelectItem key="contract">Contract Call</SelectItem>
                                            <SelectItem key="token">Token Transfer</SelectItem>
                                        </Select>
                                        
                                        <Select
                                            label="Network"
                                            placeholder="All Networks"
                                            selectedKeys={filters.network !== 'all' ? [filters.network] : []}
                                            onSelectionChange={(keys) => handleFilterChange('network', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Networks</SelectItem>
                                            {networks.map(network => (
                                                <SelectItem key={network.id} value={network.id}>
                                                    {network.name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    {/* 3. Data Table */}
                                    <TransactionsTable 
                                        transactions={transactions}
                                        loading={loading}
                                        onView={canView ? (transaction) => openModal('details', transaction) : null}
                                    />
                                    
                                    {/* 4. Pagination would go here */}
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
TransactionsManagement.layout = (page) => <App children={page} />;
export default TransactionsManagement;