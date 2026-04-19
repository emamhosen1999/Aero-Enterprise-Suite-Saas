import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Tooltip } from "@heroui/react";
import { 
    DocumentTextIcon, 
    PlusIcon, 
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CodeBracketIcon,
    PlayIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import SmartContractsTable from '@/Tables/SmartContractsTable.jsx';
import DeployContractModal from '@/Components/Modals/DeployContractModal.jsx';
import ContractInteractionModal from '@/Components/Modals/ContractInteractionModal.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { router } from '@inertiajs/react';

const SmartContractsManagement = ({ title }) => {
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
    const [contracts, setContracts] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        status: 'all', 
        type: 'all',
        network: 'all',
        verified: 'all'
    });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0 });
    const [stats, setStats] = useState({ 
        total: 0, 
        deployed: 0, 
        verified: 0, 
        active: 0,
        failed: 0,
        totalTransactions: 0
    });
    const [modalStates, setModalStates] = useState({ 
        deploy: false, 
        interact: false, 
        details: false 
    });
    const [selectedContract, setSelectedContract] = useState(null);
    const [networks, setNetworks] = useState([]);

    // 4. Stats data for StatsCards component (REQUIRED)
    const statsData = useMemo(() => [
        { 
            title: "Total Contracts", 
            value: stats.total, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Deployed", 
            value: stats.deployed, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Verified", 
            value: stats.verified, 
            icon: <CodeBracketIcon className="w-6 h-6" />, 
            color: "text-info", 
            iconBg: "bg-info/20" 
        },
        { 
            title: "Active", 
            value: stats.active, 
            icon: <PlayIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Failed", 
            value: stats.failed, 
            icon: <ExclamationTriangleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "Total Transactions", 
            value: stats.totalTransactions, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        }
    ], [stats]);

    // 5. Permission checks (REQUIRED)
    const canCreate = hrmacHasAccess('blockchain.contracts.create');
    const canEdit = hrmacHasAccess('blockchain.contracts.update');
    const canDelete = hrmacHasAccess('blockchain.contracts.delete');
    const canInteract = hrmacHasAccess('blockchain.contracts.interact');

    // 6. Data fetching with axios
    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.blockchain.contracts.index'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage, 
                    ...filters 
                }
            });
            
            if (response.status === 200) {
                setContracts(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total
                }));
                setStats(response.data.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { 
                error: 'Failed to fetch smart contracts' 
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
        fetchContracts(); 
    }, [fetchContracts]);
    
    useEffect(() => {
        fetchNetworks();
    }, [fetchNetworks]);

    // Modal handlers
    const openModal = useCallback((modal, contract = null) => {
        setSelectedContract(contract);
        setModalStates(prev => ({ ...prev, [modal]: true }));
    }, []);

    const closeModal = useCallback((modal) => {
        setModalStates(prev => ({ ...prev, [modal]: false }));
        setSelectedContract(null);
    }, []);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const handleSearchChange = useCallback((value) => {
        handleFilterChange('search', value);
    }, [handleFilterChange]);

    // Contract actions
    const handleDeployContract = useCallback(async (contractData) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('api.blockchain.contracts.store'), contractData);
                if (response.status === 201) {
                    await fetchContracts();
                    closeModal('deploy');
                    resolve([response.data.message || 'Contract deployed successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to deploy contract']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deploying contract...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [fetchContracts, closeModal]);

    const handleInteractWithContract = useCallback(async (interactionData) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('api.blockchain.contracts.call', selectedContract.id), 
                    interactionData
                );
                if (response.status === 200) {
                    closeModal('interact');
                    resolve([response.data.message || 'Contract interaction completed']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to interact with contract']);
            }
        });

        showToast.promise(promise, {
            loading: 'Interacting with contract...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [selectedContract, closeModal]);

    const handleDeleteContract = useCallback(async (contract) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('api.blockchain.contracts.destroy', contract.id));
                if (response.status === 200) {
                    await fetchContracts();
                    resolve([response.data.message || 'Contract deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Failed to delete contract');
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting contract...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [fetchContracts]);

    // RENDER STRUCTURE (CRITICAL - Follow exactly)
    return (
        <>
            <Head title={title || "Smart Contracts Management"} />
            
            {/* Modals go BEFORE main content */}
            {modalStates.deploy && (
                <DeployContractModal 
                    open={modalStates.deploy} 
                    onClose={() => closeModal('deploy')}
                    onSubmit={handleDeployContract}
                    networks={networks}
                />
            )}
            {modalStates.interact && selectedContract && (
                <ContractInteractionModal 
                    open={modalStates.interact} 
                    onClose={() => closeModal('interact')}
                    onSubmit={handleInteractWithContract}
                    contract={selectedContract}
                />
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Smart Contracts Management">
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
                                                    <DocumentTextIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Smart Contracts
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Deploy and manage blockchain smart contracts
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('deploy')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Deploy Contract
                                                    </Button>
                                                )}
                                                <Button color="secondary" variant="flat"
                                                    startContent={<CodeBracketIcon className="w-4 h-4" />}
                                                    onPress={() => router.visit(route('blockchain.explorer.index'))}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Explorer
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
                                            label="Search Contracts"
                                            placeholder="Search by name, address, or description..."
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
                                            <SelectItem key="deployed">Deployed</SelectItem>
                                            <SelectItem key="pending">Pending</SelectItem>
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
                                            <SelectItem key="erc20">ERC-20 Token</SelectItem>
                                            <SelectItem key="erc721">ERC-721 NFT</SelectItem>
                                            <SelectItem key="erc1155">ERC-1155</SelectItem>
                                            <SelectItem key="defi">DeFi Protocol</SelectItem>
                                            <SelectItem key="dao">DAO Governance</SelectItem>
                                            <SelectItem key="custom">Custom Contract</SelectItem>
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
                                        
                                        <Select
                                            label="Verification"
                                            placeholder="All"
                                            selectedKeys={filters.verified !== 'all' ? [filters.verified] : []}
                                            onSelectionChange={(keys) => handleFilterChange('verified', Array.from(keys)[0] || 'all')}
                                            classNames={{ trigger: "bg-default-100" }}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                        >
                                            <SelectItem key="all">All</SelectItem>
                                            <SelectItem key="verified">Verified</SelectItem>
                                            <SelectItem key="unverified">Unverified</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {/* 3. Data Table */}
                                    <SmartContractsTable 
                                        contracts={contracts}
                                        loading={loading}
                                        onView={(contract) => openModal('details', contract)}
                                        onEdit={canEdit ? (contract) => openModal('edit', contract) : null}
                                        onDelete={canDelete ? handleDeleteContract : null}
                                        onInteract={canInteract ? (contract) => openModal('interact', contract) : null}
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
SmartContractsManagement.layout = (page) => <App children={page} />;
export default SmartContractsManagement;