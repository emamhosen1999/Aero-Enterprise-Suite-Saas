import React, { useMemo } from 'react';
import {
    UserGroupIcon, UserIcon, UserPlusIcon,
    ShieldCheckIcon, ArrowTrendingUpIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import StatsCards from '@/Components/StatsCards';

const AdminStatsCards = ({ stats = {}, loading = false }) => {
    const statsData = useMemo(() => [
        {
            title: 'Total Users',
            value: stats.totalUsers ?? 0,
            icon: <UserGroupIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            trend: stats.userGrowthRate ? `${stats.userGrowthRate > 0 ? '+' : ''}${stats.userGrowthRate}%` : null,
        },
        {
            title: 'Active Users',
            value: stats.activeUsers ?? 0,
            icon: <UserIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            badge: stats.onlineUsers > 0 ? `${stats.onlineUsers} online` : null,
        },
        {
            title: 'New This Month',
            value: stats.newUsersThisMonth ?? 0,
            icon: <UserPlusIcon className="w-5 h-5" />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
        },
        {
            title: 'Inactive Users',
            value: stats.inactiveUsers ?? 0,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
        },
        {
            title: 'Roles',
            value: stats.totalRoles ?? 0,
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Growth Rate',
            value: stats.userGrowthRate ? `${stats.userGrowthRate}%` : '0%',
            icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
            color: (stats.userGrowthRate ?? 0) >= 0 ? 'text-success' : 'text-danger',
            iconBg: (stats.userGrowthRate ?? 0) >= 0 ? 'bg-success/20' : 'bg-danger/20',
        },
    ], [stats]);

    return <StatsCards stats={statsData} isLoading={loading} />;
};

export default AdminStatsCards;
