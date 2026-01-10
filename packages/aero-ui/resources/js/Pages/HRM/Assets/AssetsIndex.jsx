import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem } from "@heroui/react";
import { 
    CheckCircleIcon,
    ComputerDesktopIcon,
    PlusIcon,
    WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const AssetsIndex = ({ title }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [assets, setAssets] = useState([]);
    const [stats, setStats] = useState({ total: 0, available: 0, allocated: 0, maintenance: 0 });
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1 });

    const canCreate = auth.permissions?.includes('hrm.assets.create') || false;

    const statsData = useMemo(() => [
        { title: "Total Assets", value: stats.total, icon: <ComputerDesktopIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Available", value: stats.available, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Allocated", value: stats.allocated, icon: <ComputerDesktopIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Maintenance", value: stats.maintenance, icon: <WrenchScrewdriverIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.assets.paginate'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) setAssets(response.data.data);
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch assets' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.assets.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => {
        fetchAssets();
        fetchStats();
    }, [fetchAssets, fetchStats]);

    return (
        <>
            <Head title={title || "Asset Management"} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Asset Management">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                                <CardHeader className="border-b p-0" style={{
                                    borderColor: `var(--theme-divider, #E4E4E7)`,
                                    background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                }}>
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`} style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}>
                                                    <ComputerDesktopIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Asset Management</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Track and allocate company assets to employees</p>
                                                </div>
                                            </div>
                                            {canCreate && (
                                                <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                                                    Add Asset
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input label="Search" placeholder="Search assets..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />} variant="bordered" size="sm" radius={themeRadius} />
                                        <Select label="Status" placeholder="All Statuses" variant="bordered" size="sm" radius={themeRadius} selectionMode="multiple">
                                            <SelectItem key="available">Available</SelectItem>
                                            <SelectItem key="allocated">Allocated</SelectItem>
                                            <SelectItem key="maintenance">Maintenance</SelectItem>
                                            <SelectItem key="retired">Retired</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    <div className="text-center py-8 text-default-500">
                                        {loading ? "Loading assets..." : "Asset inventory table will be displayed here"}
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

AssetsIndex.layout = (page) => <App children={page} />;
export default AssetsIndex;
