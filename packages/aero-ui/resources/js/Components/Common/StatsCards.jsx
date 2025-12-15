import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { 
    UserGroupIcon, 
    KeyIcon, 
    CogIcon, 
    ChartBarIcon 
} from '@heroicons/react/24/outline';

const StatsCards = ({ stats }) => {
    const statItems = [
        {
            title: 'Total Roles',
            value: stats.totalRoles || 0,
            icon: UserGroupIcon,
            color: 'blue',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-600'
        },
        {
            title: 'Total Permissions',
            value: stats.totalPermissions || 0,
            icon: KeyIcon,
            color: 'green',
            bgColor: 'bg-green-500/10',
            textColor: 'text-green-600'
        },
        {
            title: 'Modules',
            value: stats.totalModules || 0,
            icon: CogIcon,
            color: 'purple',
            bgColor: 'bg-purple-500/10',
            textColor: 'text-purple-600'
        },
        {
            title: 'Avg Permissions/Role',
            value: stats.averagePermissionsPerRole || 0,
            icon: ChartBarIcon,
            color: 'orange',
            bgColor: 'bg-orange-500/10',
            textColor: 'text-orange-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {statItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                    <Card 
                        key={index}
                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/20"
                    >
                        <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                                    <IconComponent className={`w-6 h-6 ${item.textColor}`} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        {item.title}
                                    </p>
                                    <h3 className="text-2xl text-gray-800 dark:text-white font-bold">
                                        {item.value}
                                    </h3>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                );
            })}
        </div>
    );
};

export default StatsCards;
