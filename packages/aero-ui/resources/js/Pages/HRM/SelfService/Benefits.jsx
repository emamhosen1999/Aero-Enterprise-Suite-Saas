import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { GiftIcon, HeartIcon, ShieldCheckIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const Benefits = ({ title, benefits = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { hasAccess, isSuperAdmin } = useHRMAC();
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const stats = useMemo(() => {
        const health = benefits.filter(b => b.category === 'health').length;
        const insurance = benefits.filter(b => b.category === 'insurance').length;
        const financial = benefits.filter(b => b.category === 'financial').length;
        return { total: benefits.length, health, insurance, financial };
    }, [benefits]);

    const statsData = useMemo(() => [
        { title: "Total Benefits", value: stats.total, icon: <GiftIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Health", value: stats.health, icon: <HeartIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
        { title: "Insurance", value: stats.insurance, icon: <ShieldCheckIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Financial", value: stats.financial, icon: <CurrencyDollarIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
    ], [stats]);

    const categoryColorMap = {
        health: 'danger',
        insurance: 'success',
        financial: 'warning',
        other: 'default',
    };

    const statusColorMap = {
        active: 'success',
        pending: 'warning',
        expired: 'danger',
    };

    const columns = [
        { uid: 'name', name: 'Benefit Name' },
        { uid: 'category', name: 'Category' },
        { uid: 'coverage', name: 'Coverage' },
        { uid: 'start_date', name: 'Start Date' },
        { uid: 'status', name: 'Status' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'category':
                return <Chip color={categoryColorMap[item.category] || 'default'} size="sm" variant="flat">{item.category}</Chip>;
            case 'status':
                return <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">{item.status}</Chip>;
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <StandardPageLayout
            title="My Benefits"
            subtitle="View your enrolled benefits and coverage"
            icon={<GiftIcon className="w-6 h-6" />}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            stats={<StatsCards stats={statsData} />}
            ariaLabel="My Benefits"
        >
            {benefits.length > 0 ? (
                <Table aria-label="Benefits" classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}>
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={benefits}>
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-default-500">
                    <GiftIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Benefits Enrolled</p>
                    <p className="text-sm">Contact HR to learn about available benefits.</p>
                </div>
            )}
        </StandardPageLayout>
    );
};

Benefits.layout = (page) => <App children={page} />;
export default Benefits;
