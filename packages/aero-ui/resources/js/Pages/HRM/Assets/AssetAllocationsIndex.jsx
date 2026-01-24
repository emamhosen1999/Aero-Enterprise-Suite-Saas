import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { CheckCircleIcon, ClockIcon, ComputerDesktopIcon, UserIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const AssetAllocationsIndex = ({ title }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
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

    const [loading, setLoading] = useState(false);
    const [allocations, setAllocations] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, returned: 0, overdue: 0 });
    const [search, setSearch] = useState('');

    const statsData = useMemo(() => [
        { title: "Total Allocations", value: stats.total, icon: <ComputerDesktopIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Active", value: stats.active, icon: <UserIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Returned", value: stats.returned, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Overdue", value: stats.overdue, icon: <ClockIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    const fetchAllocations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.assets.allocations.index'));
            if (response.status === 200) {
                setAllocations(response.data.data);
                setStats(response.data.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch allocations' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllocations();
    }, [fetchAllocations]);

    return (
        <StandardPageLayout
            title="Asset Allocations"
            subtitle="Track asset assignments to employees"
            icon={<UserIcon className="w-6 h-6" />}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            stats={statsData}
            filters={
                <Input 
                    label="Search" 
                    placeholder="Search by employee or asset..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4" />} 
                    variant="bordered" 
                    size="sm" 
                    radius={themeRadius} 
                />
            }
            ariaLabel="Asset Allocations"
        >
            <div className="text-center py-8 text-default-500">
                {loading ? "Loading allocations..." : "Asset allocations will be displayed here"}
            </div>
        </StandardPageLayout>
    );
};

AssetAllocationsIndex.layout = (page) => <App children={page} />;
export default AssetAllocationsIndex;
