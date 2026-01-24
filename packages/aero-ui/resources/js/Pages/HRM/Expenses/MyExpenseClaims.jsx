import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Chip, Input } from "@heroui/react";
import { BanknotesIcon, CheckCircleIcon, ClockIcon, PlusIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const MyExpenseClaims = ({ title }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Manual responsive state management (HRMAC pattern)
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
        <StandardPageLayout
            title="My Expense Claims"
            subtitle="Submit and track your expense reimbursements"
            icon={<BanknotesIcon className="w-6 h-6" />}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            stats={statsData}
            actions={
                <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                    Submit Claim
                </Button>
            }
            filters={
                <Input 
                    label="Search" 
                    placeholder="Search my claims..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4" />} 
                    variant="bordered" 
                    size="sm" 
                    radius={themeRadius} 
                />
            }
            ariaLabel="My Expense Claims"
        >
            <div className="text-center py-8 text-default-500">
                {loading ? "Loading your claims..." : "Your expense claims will be displayed here"}
            </div>
        </StandardPageLayout>
    );
};

MyExpenseClaims.layout = (page) => <App children={page} />;
export default MyExpenseClaims;
