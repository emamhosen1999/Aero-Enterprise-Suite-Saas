import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import {
    Button, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
} from "@heroui/react";
import { ChartBarIcon, StarIcon, TrophyIcon, EyeIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const Performance = ({ title, reviews = [] }) => {
    useThemeRadius();
    const { canView, isSuperAdmin } = useHRMAC();
    const canViewPerformance = canView('hrm.self-service.performance') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const stats = useMemo(() => {
        const completed = reviews.filter(r => r.status === 'completed').length;
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (parseFloat(r.overall_rating) || 0), 0) / reviews.length).toFixed(1)
            : 0;
        return { total: reviews.length, completed, avgRating };
    }, [reviews]);

    const statsData = useMemo(() => [
        { title: "Total Reviews", value: stats.total, icon: <ChartBarIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Avg Rating", value: `${stats.avgRating}/5`, icon: <StarIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
        { title: "Completed", value: stats.completed, icon: <TrophyIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
    ], [stats]);

    const statusColorMap = {
        completed: 'success',
        in_progress: 'primary',
        pending: 'warning',
        overdue: 'danger',
    };

    const getRatingChip = (rating) => {
        if (rating === null || rating === undefined) {
            return <Chip color="default" size="sm" variant="flat">Not Rated</Chip>;
        }
        const r = parseFloat(rating);
        if (r >= 4) return <Chip color="success" size="sm" variant="flat">Exceeds Expectations</Chip>;
        if (r >= 3) return <Chip color="warning" size="sm" variant="flat">Meets Expectations</Chip>;
        return <Chip color="danger" size="sm" variant="flat">Needs Improvement</Chip>;
    };

    const handleViewDetails = (review) => {
        try {
            router.visit(route('hrm.performance.show', review.id));
        } catch {
            router.visit('/hrm/performance/' + review.id);
        }
    };

    const columns = [
        { uid: 'cycle', name: 'Cycle' },
        { uid: 'reviewer', name: 'Reviewer' },
        { uid: 'overall_rating', name: 'Rating' },
        { uid: 'status', name: 'Status' },
        { uid: 'review_date', name: 'Review Date' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'overall_rating':
                return getRatingChip(item.overall_rating);
            case 'status':
                return (
                    <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">
                        {item.status?.replace('_', ' ') || '-'}
                    </Chip>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Review actions">
                            <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => handleViewDetails(item)}>
                                View Details
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <>
            <Head title={title || 'My Performance'} />

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
        </>
    );
};

Performance.layout = (page) => <App children={page} />;
export default Performance;
