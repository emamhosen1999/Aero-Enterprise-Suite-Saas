import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem } from "@heroui/react";
import { 
    CheckCircleIcon,
    ClockIcon,
    DocumentMagnifyingGlassIcon,
    ExclamationTriangleIcon,
    PlusIcon
} from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const DisciplinaryCasesIndex = ({ title }) => {
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
    const [cases, setCases] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, investigating: 0, closed: 0 });
    const [filters, setFilters] = useState({ search: '', status: [] });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1 });

    const canCreate = auth.permissions?.includes('hrm.disciplinary.create') || false;

    const statsData = useMemo(() => [
        { title: "Total Cases", value: stats.total, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending", value: stats.pending, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Investigating", value: stats.investigating, icon: <DocumentMagnifyingGlassIcon className="w-6 h-6" />, color: "text-info", iconBg: "bg-info/20" },
        { title: "Closed", value: stats.closed, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
    ], [stats]);

    const fetchCases = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.disciplinary.cases.paginate'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) setCases(response.data.data);
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch cases' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(route('hrm.disciplinary.cases.stats'));
            if (response.status === 200) setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => {
        fetchCases();
        fetchStats();
    }, [fetchCases, fetchStats]);

    return (
        <>
            <Head title={title || "Disciplinary Cases"} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Disciplinary Cases Management">
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
                                                    <ExclamationTriangleIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Disciplinary Cases</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Manage disciplinary cases, investigations, and warnings</p>
                                                </div>
                                            </div>
                                            {canCreate && (
                                                <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                                                    New Case
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input label="Search" placeholder="Search cases..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />} variant="bordered" size="sm" radius={themeRadius} />
                                        <Select label="Status" placeholder="All Statuses" variant="bordered" size="sm" radius={themeRadius} selectionMode="multiple">
                                            <SelectItem key="pending">Pending</SelectItem>
                                            <SelectItem key="investigating">Investigating</SelectItem>
                                            <SelectItem key="action_taken">Action Taken</SelectItem>
                                            <SelectItem key="closed">Closed</SelectItem>
                                            <SelectItem key="dismissed">Dismissed</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    <div className="text-center py-8 text-default-500">
                                        {loading ? "Loading cases..." : "Disciplinary cases table will be displayed here"}
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

DisciplinaryCasesIndex.layout = (page) => <App children={page} />;
export default DisciplinaryCasesIndex;
