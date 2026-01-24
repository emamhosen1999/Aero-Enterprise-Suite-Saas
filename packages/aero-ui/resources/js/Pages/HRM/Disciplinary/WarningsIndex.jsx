import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem } from "@heroui/react";
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const WarningsIndex = ({ title }) => {
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
    const [warnings, setWarnings] = useState([]);
    const [stats, setStats] = useState({ total: 0, verbal: 0, written: 0, final: 0 });
    const [filters, setFilters] = useState({ search: '', type: [] });

    // Use HRMAC hook for permissions (canCreate is already available from useHRMAC)

    const statsData = useMemo(() => [
        { title: "Total Warnings", value: stats.total, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Verbal", value: stats.verbal, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Written", value: stats.written, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
        { title: "Final", value: stats.final, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    const fetchWarnings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.disciplinary.warnings.data'));
            if (response.status === 200) {
                setWarnings(response.data.data);
                setStats(response.data.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch warnings' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWarnings();
    }, [fetchWarnings]);

    return (
        <StandardPageLayout
            title="Warnings"
            subtitle="Manage employee warnings and disciplinary actions"
            icon={<ExclamationTriangleIcon className="w-6 h-6" />}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            stats={statsData}
            actions={
                canCreate && (
                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                        Issue Warning
                    </Button>
                )
            }
            filters={
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input 
                        label="Search" 
                        placeholder="Search warnings..." 
                        value={filters.search} 
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4" />} 
                        variant="bordered" 
                        size="sm" 
                        radius={themeRadius} 
                    />
                    <Select label="Type" placeholder="All Types" variant="bordered" size="sm" radius={themeRadius} selectionMode="multiple">
                        <SelectItem key="verbal">Verbal</SelectItem>
                        <SelectItem key="written">Written</SelectItem>
                        <SelectItem key="final">Final</SelectItem>
                    </Select>
                </div>
            }
            ariaLabel="Warnings"
        >
            <div className="text-center py-8 text-default-500">
                {loading ? "Loading warnings..." : "Employee warnings will be displayed here"}
            </div>
        </StandardPageLayout>
    );
};

WarningsIndex.layout = (page) => <App children={page} />;
export default WarningsIndex;
