import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Chip, Progress, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { ChartBarIcon, StarIcon, TrophyIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const Performance = ({ title, reviews = [] }) => {
    const { auth } = usePage().props;
    const { hasAccess } = useHRMAC();
    const themeRadius = useThemeRadius();
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const stats = useMemo(() => {
        const completed = reviews.filter(r => r.status === 'completed').length;
        const pending = reviews.filter(r => r.status === 'pending').length;
        const avgRating = reviews.length > 0 
            ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
            : 0;
        return { total: reviews.length, completed, pending, avgRating };
    }, [reviews]);

    const statsData = useMemo(() => [
        { title: "Total Reviews", value: stats.total, icon: <ChartBarIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Completed", value: stats.completed, icon: <TrophyIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Pending", value: stats.pending, icon: <ArrowTrendingUpIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Avg Rating", value: `${stats.avgRating}/5`, icon: <StarIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    const statusColorMap = {
        completed: 'success',
        pending: 'warning',
        in_progress: 'primary',
        overdue: 'danger',
    };

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'success';
        if (rating >= 3) return 'primary';
        if (rating >= 2) return 'warning';
        return 'danger';
    };

    const columns = [
        { uid: 'review_period', name: 'Review Period' },
        { uid: 'reviewer', name: 'Reviewer' },
        { uid: 'rating', name: 'Rating' },
        { uid: 'status', name: 'Status' },
        { uid: 'completed_at', name: 'Completed Date' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'rating':
                if (!item.rating) return '-';
                return (
                    <div className="flex items-center gap-2">
                        <Progress value={(item.rating / 5) * 100} size="sm" color={getRatingColor(item.rating)} className="w-16" />
                        <span className="text-sm font-medium">{item.rating}/5</span>
                    </div>
                );
            case 'status':
                return <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">{item.status}</Chip>;
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <StandardPageLayout
            title="My Performance"
            subtitle="View your performance reviews and ratings"
            icon={ChartBarIcon}
            iconColorClass="text-warning"
            iconBgClass="bg-warning/20"
            stats={<StatsCards stats={statsData} />}
            ariaLabel="My Performance Reviews"
        >
            {reviews.length > 0 ? (
                <Table aria-label="Performance Reviews" classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}>
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={reviews}>
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-default-500">
                    <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Performance Reviews</p>
                    <p className="text-sm">Your performance reviews will appear here once completed.</p>
                </div>
            )}
        </StandardPageLayout>
    );
};

Performance.layout = (page) => <App children={page} />;
export default Performance;
