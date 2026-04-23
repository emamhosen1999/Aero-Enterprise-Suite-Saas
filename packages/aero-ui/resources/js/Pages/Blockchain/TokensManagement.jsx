import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Tooltip, Avatar } from "@heroui/react";
import { 
    CurrencyDollarIcon, 
    PlusIcon, 
    MagnifyingGlassIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowsRightLeftIcon,
    ChartBarIcon,
    EyeIcon,
    PencilIcon,
    DocumentArrowUpIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import TokensTable from '@/Tables/Blockchain/TokensTable.jsx';
import CreateTokenModal from '@/Components/Modals/CreateTokenModal.jsx';
import TokenTransferModal from '@/Components/Modals/TokenTransferModal.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { router } from '@inertiajs/react';

const TokensManagement = ({ title }) => {
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
    const [tokens, setTokens] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        type: 'all', 
        network: 'all',
        category: 'all',
        status: 'all'
    });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0 });
    const [stats, setStats] = useState({ 
        total: 0, 
        erc20: 0, 
        nft: 0, 
        defi: 0,
        totalValue: 0,
        totalHolders: 0
    });
    const [modalStates, setModalStates] = useState({ 
        create: false, 
        transfer: false, 
        details: false 
    });
    const [selectedToken, setSelectedToken] = useState(null);
    const [networks, setNetworks] = useState([]);
    const [portfolioData, setPortfolioData] = useState([]);

    // 4. Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        { 
            title: "Total Tokens", 
            value: stats.total, 
            icon: <CurrencyDollarIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "ERC-20 Tokens", 
            value: stats.erc20, 
            icon: <CurrencyDollarIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "NFTs (ERC-721/1155)", 
            value: stats.nft, 
            icon: <DocumentArrowUpIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "DeFi Tokens", 
            value: stats.defi, 
            icon: <ChartBarIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
        { 
            title: "Portfolio Value", 
            value: `$${stats.totalValue.toLocaleString()}`, 
            icon: <ArrowUpIcon className="w-6 h-6" />, 
            color: "text-info", 
            iconBg: "bg-info/20" 
        },
        { 
            title: "Total Holders", 
            value: stats.totalHolders, 
            icon: <ArrowsRightLeftIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        }
    ], [stats]);

    // 5. Permission checks (REQUIRED)
    const canCreate = hrmacHasAccess('blockchain.tokens.create');
    const canTransfer = hrmacHasAccess('blockchain.tokens.transfer');
    const canManage = hrmacHasAccess('blockchain.tokens.manage');

    // 6. Data fetching with axios
    const fetchTokens = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.blockchain.tokens.index'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage, 
                    ...filters 
                }
            });
            
            if (response.status === 200) {
                setTokens(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total
                }));
                setStats(response.data.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { 
                error: 'Failed to fetch tokens' 
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchSupportingData = useCallback(async () => {
        try {
            const [networksResponse, portfolioResponse] = await Promise.all([
                axios.get(route('api.blockchain.networks.index')),
                axios.get(route('api.blockchain.portfolio.summary'))
            ]);
            
            if (networksResponse.status === 200) {
                setNetworks(networksResponse.data);
            }
            if (portfolioResponse.status === 200) {
                setPortfolioData(portfolioResponse.data);
            }
        } catch (error) {
            console.error('Failed to fetch supporting data:', error);
        }
    }, []);

    useEffect(() => { 
        fetchTokens(); 
    }, [fetchTokens]);
    
    useEffect(() => {
        fetchSupportingData();
    }, [fetchSupportingData]);

    // Modal handlers
    const openModal = useCallback((modal, token = null) => {
        setSelectedToken(token);
        setModalStates(prev => ({ ...prev, [modal]: true }));
    }, []);

    const closeModal = useCallback((modal) => {
        setModalStates(prev => ({ ...prev, [modal]: false }));
        setSelectedToken(null);
    }, []);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const handleSearchChange = useCallback((value) => {
        handleFilterChange('search', value);
    }, [handleFilterChange]);

    // Token actions
    const handleCreateToken = useCallback(async (tokenData) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('api.blockchain.tokens.store'), tokenData);
                if (response.status === 201) {
                    await fetchTokens();
                    closeModal('create');
                    resolve([response.data.message || 'Token created successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to create token']);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating token...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [fetchTokens, closeModal]);

    const handleTransferToken = useCallback(async (transferData) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('api.blockchain.tokens.transfer', selectedToken.id), 
                    transferData
                );
                if (response.status === 200) {
                    await fetchTokens();
                    closeModal('transfer');
                    resolve([response.data.message || 'Token transfer initiated']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to transfer token']);
            }
        });

        showToast.promise(promise, {
            loading: 'Transferring tokens...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [selectedToken, fetchTokens, closeModal]);

    // RENDER STRUCTURE (CRITICAL - Follow exactly)
    return (
        <>
            <Head title={title || "Tokens Management"} />
            
            {/* Modals go BEFORE main content */}
            {modalStates.create && (
                <CreateTokenModal 
                    open={modalStates.create} 
                    onClose={() => closeModal('create')}
                    onSubmit={handleCreateToken}
                    networks={networks}
                />
            )}
            {modalStates.transfer && selectedToken && (
                <TokenTransferModal 
                    open={modalStates.transfer} 
                    onClose={() => closeModal('transfer')}
                    onSubmit={handleTransferToken}
                    token={selectedToken}
                />
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Tokens Management">
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
                                                    <CurrencyDollarIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Tokens Management
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage cryptocurrency tokens, NFTs, and DeFi assets
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('create')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Create Token
                                                    </Button>
                                                )}
                                                {canTransfer && (
                                                    <Button color="secondary" variant="flat"
                                                        startContent={<ArrowsRightLeftIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('transfer')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Transfer
                                                    </Button>
                                                )}
                                                <Button color="default" variant="bordered"
                                                    startContent={<ChartBarIcon className="w-4 h-4" />}
                                                    onPress={() => router.visit(route('blockchain.analytics.tokens'))}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Analytics
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* 1. Stats Cards (REQUIRED at top) */}
                                    <StatsCards stats={statsData} className="mb-6" isLoading={loading} />
                                    
                                    {/* 2. Top Tokens Portfolio Cards */}
                                    {portfolioData.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold mb-3">Top Portfolio Holdings</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {portfolioData.slice(0, 4).map((token, index) => (
                                                    <Card key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                                                        <CardBody className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar 
                                                                    src={token.logo} 
                                                                    name={token.symbol}
                                                                    size="sm"
                                                                    className="bg-primary/10"
                                                                />
                                                                <div className="flex-1">
                                                                    <h4 className="font-semibold text-sm">{token.symbol}</h4>
                                                                    <p className="text-xs text-default-600">{token.name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <p className="font-bold text-sm">{token.balance}</p>
                                                                <p className="text-xs text-default-500">${token.value}</p>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* 3. Filter Section */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                        <Input
                                            label="Search Tokens"
                                            placeholder="Search by symbol, name, or address..."
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
                                            <SelectItem key="erc20">ERC-20</SelectItem>
                                            <SelectItem key="erc721">ERC-721 (NFT)</SelectItem>
                                            <SelectItem key="erc1155">ERC-1155</SelectItem>
                                        </Select>
                                        
                                        <Select
                                            label="Category"
                                            placeholder="All Categories"
                                            selectedKeys={filters.category !== 'all' ? [filters.category] : []}
                                            onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Categories</SelectItem>
                                            <SelectItem key="utility">Utility</SelectItem>
                                            <SelectItem key="governance">Governance</SelectItem>
                                            <SelectItem key="defi">DeFi</SelectItem>
                                            <SelectItem key="gaming">Gaming</SelectItem>
                                            <SelectItem key="stablecoin">Stablecoin</SelectItem>
                                            <SelectItem key="nft">NFT</SelectItem>
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
                                    
                                    {/* 4. Data Table */}
                                    <TokensTable 
                                        tokens={tokens}
                                        loading={loading}
                                        onView={(token) => openModal('details', token)}
                                        onTransfer={canTransfer ? (token) => openModal('transfer', token) : null}
                                        onManage={canManage ? (token) => router.visit(route('blockchain.tokens.show', token.id)) : null}
                                    />
                                    
                                    {/* 5. Pagination would go here */}
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
TokensManagement.layout = (page) => <App children={page} />;
export default TokensManagement;