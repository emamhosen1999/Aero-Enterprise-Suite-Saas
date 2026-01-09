import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Chip, Input } from "@heroui/react";
import { BanknotesIcon, CheckCircleIcon, ClockIcon, PlusIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const MyExpenseClaims = ({ title }) => {
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
    const [claims, setClaims] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [search, setSearch] = useState('');

    const statsData = useMemo(() => [
        { title: "Total Claims", value: stats.total, icon: <BanknotesIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending", value: stats.pending, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Approved", value: stats.approved, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Rejected", value: stats.rejected, icon: <XCircleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    const fetchMyClaims = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.expenses.my-claims'));
            if (response.status === 200) {
                setClaims(response.data.data);
                setStats(response.data.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch claims' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyClaims();
    }, [fetchMyClaims]);

    return (
        <>
            <Head title={title || "My Expense Claims"} />
            
            <div className="flex flex-col w-full h-full p-4" role="main">
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
                                                    <BanknotesIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>My Expense Claims</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Submit and track your expense reimbursements</p>
                                                </div>
                                            </div>
                                            <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                                                Submit Claim
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <div className="mb-6">
                                        <Input label="Search" placeholder="Search my claims..." value={search} onChange={(e) => setSearch(e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />} variant="bordered" size="sm" radius={themeRadius} />
                                    </div>
                                    
                                    <div className="text-center py-8 text-default-500">
                                        {loading ? "Loading your claims..." : "Your expense claims will be displayed here"}
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

MyExpenseClaims.layout = (page) => <App children={page} />;
export default MyExpenseClaims;
