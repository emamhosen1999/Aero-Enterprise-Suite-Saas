import React from 'react';
import { 
    UserGroupIcon, 
    KeyIcon, 
    CogIcon, 
    ChartBarIcon 
} from '@heroicons/react/24/outline';

import StatsCards from '@/Components/UI/StatsCards';

const RolePermissionStatsCards = ({ stats = {} }) => {
    const items = [
        {
            title: 'Total Roles',
            value: stats.totalRoles || 0,
            icon: <UserGroupIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'Defined roles'
        },
        {
            title: 'Total Permissions',
            value: stats.totalPermissions || 0,
            icon: <KeyIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Permission entries'
        },
        {
            title: 'Modules',
            value: stats.totalModules || 0,
            icon: <CogIcon className="w-5 h-5" />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
            description: 'Active modules'
        },
        {
            title: 'Avg Permissions/Role',
            value: stats.averagePermissionsPerRole || 0,
            icon: <ChartBarIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Average'
        }
    ];

    return <StatsCards stats={items} />;
};

export default RolePermissionStatsCards;
