import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { 
    WalletIcon, 
    PlusIcon, 
    MagnifyingGlassIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowsRightLeftIcon,
    DocumentDuplicateIcon,
    PencilIcon,
    TrashIcon,
    BanknotesIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import WalletsTable from '@/Tables/WalletsTable.jsx';
import CreateWalletModal from '@/Components/Modals/CreateWalletModal.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

const WalletsManagement = ({ title }) => {
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
    const [wallets, setWallets] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        network: 'all', 
        type: 'all',
        status: 'all'
    });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0 });
    const [stats, setStats] = useState({ 
        total: 0, 
        active: 0, 
        totalValue: 0, 
        networks: 0 
    });
    const [modalStates, setModalStates] = useState({ 
        create: false, 
        edit: false, 
        delete: false, 
        details: false 
    });
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [networks, setNetworks] = useState([]);

    // 4. Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        { 
            title: "Total Wallets", 
            value: stats.total, 
            icon: <WalletIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Wallets", 
            value: stats.active, 
            icon: <BanknotesIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Total Value", 
            value: `$${stats.totalValue.toLocaleString()}`, 
            icon: <ArrowsRightLeftIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Networks", 
            value: stats.networks, 
            icon: <DocumentDuplicateIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        }
    ], [stats]);

    // 5. Permission checks (REQUIRED)
    const canCreate = auth.permissions?.includes('blockchain.wallets.create') || false;
    const canEdit = auth.permissions?.includes('blockchain.wallets.update') || false;
    const canDelete = auth.permissions?.includes('blockchain.wallets.delete') || false;

    // 6. Data fetching with axios
    const fetchWallets = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.blockchain.wallets.index'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage, 
                    ...filters 
                }
            });
            
            if (response.status === 200) {
                setWallets(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total
                }));
                setStats(response.data.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { 
                error: 'Failed to fetch wallets' 
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

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
        fetchWallets(); 
    }, [fetchWallets]);
    
    useEffect(() => {
        fetchNetworks();
    }, [fetchNetworks]);

    // Modal handlers
    const openModal = useCallback((modal, wallet = null) => {
        setSelectedWallet(wallet);
        setModalStates(prev => ({ ...prev, [modal]: true }));
    }, []);

    const closeModal = useCallback((modal) => {
        setModalStates(prev => ({ ...prev, [modal]: false }));
        setSelectedWallet(null);
    }, []);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const handleSearchChange = useCallback((value) => {
        handleFilterChange('search', value);
    }, [handleFilterChange]);

    // Wallet actions
    const handleCreateWallet = useCallback(async (walletData) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('api.blockchain.wallets.store'), walletData);
                if (response.status === 201) {
                    await fetchWallets();
                    closeModal('create');
                    resolve([response.data.message || 'Wallet created successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to create wallet']);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating wallet...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [fetchWallets, closeModal]);

    const handleDeleteWallet = useCallback(async (wallet) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('api.blockchain.wallets.destroy', wallet.id));
                if (response.status === 200) {
                    await fetchWallets();
                    resolve([response.data.message || 'Wallet deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to delete wallet');
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting wallet...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [fetchWallets]);

    // RENDER STRUCTURE (CRITICAL - Follow exactly)
    return (
        <>
            <Head title={title || "Wallets Management"} />
            
            {/* Modals go BEFORE main content */}
            {modalStates.create && (
                <CreateWalletModal 
                    open={modalStates.create} 
                    onClose={() => closeModal('create')}
                    onSubmit={handleCreateWallet}
                    networks={networks}
                />
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Wallets Management">
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
                                                    <WalletIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Wallets Management
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage cryptocurrency wallets and digital assets
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
                                                        Create Wallet
                                                    </Button>
                                                )}
                                                <Button color="secondary" variant="flat"
                                                    startContent={<ArrowsRightLeftIcon className="w-4 h-4" />}
                                                    onPress={() => window.location.href = route('blockchain.transactions.create')}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Send Transaction
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
                                            label="Search Wallets"
                                            placeholder="Search by name, address, or label..."
                                            value={filters.search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                inputWrapper: "bg-default-100"
                                            }}
                                            radius={getThemeRadius()}
                                            variant="bordered"
                                            size="sm"
                                        />
                                        
                                        <Select
                                            label="Network"
                                            placeholder="All Networks"
                                            selectedKeys={filters.network !== 'all' ? [filters.network] : []}
                                            onSelectionChange={(keys) => handleFilterChange('network', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            radius={getThemeRadius()}
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
                                        
                                        <Select
                                            label="Type"
                                            placeholder="All Types"
                                            selectedKeys={filters.type !== 'all' ? [filters.type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            radius={getThemeRadius()}
                                            variant="bordered"
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            <SelectItem key="hot">Hot Wallet</SelectItem>
                                            <SelectItem key="cold">Cold Wallet</SelectItem>
                                            <SelectItem key="multisig">Multi-Signature</SelectItem>
                                            <SelectItem key="hardware">Hardware Wallet</SelectItem>
                                        </Select>
                                        
                                        <Select
                                            label="Status"
                                            placeholder="All Status"
                                            selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            radius={getThemeRadius()}
                                            variant="bordered"
                                            size="sm"
                                        >
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="active">Active</SelectItem>
                                            <SelectItem key="inactive">Inactive</SelectItem>
                                            <SelectItem key="locked">Locked</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {/* 3. Data Table */}
                                    <WalletsTable 
                                        wallets={wallets}
                                        loading={loading}
                                        onEdit={canEdit ? (wallet) => openModal('edit', wallet) : null}
                                        onDelete={canDelete ? handleDeleteWallet : null}
                                        onView={(wallet) => openModal('details', wallet)}
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
WalletsManagement.layout = (page) => <App children={page} />;
export default WalletsManagement;