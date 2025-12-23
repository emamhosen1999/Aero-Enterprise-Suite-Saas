import React from 'react';
import { Card, CardHeader, CardBody, Chip } from '@heroui/react';
import {
    UsersIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    BuildingOfficeIcon,
    SignalIcon,
} from '@heroicons/react/24/outline';

/**
 * SystemStatsWidget
 * 
 * Displays comprehensive tenant statistics in a grid layout.
 * Shows users, roles, departments, and other key metrics.
 */
const SystemStatsWidget = ({ data = {} }) => {
    const { stats = [], newUsersThisMonth = 0, totalDesignations = 0 } = data;

    // Icon mapping
    const iconMap = {
        UsersIcon: UsersIcon,
        CheckCircleIcon: CheckCircleIcon,
        XCircleIcon: XCircleIcon,
        ShieldCheckIcon: ShieldCheckIcon,
        BuildingOfficeIcon: BuildingOfficeIcon,
        SignalIcon: SignalIcon,
    };

    // Color classes mapping
    const colorClasses = {
        primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
        success: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
        danger: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
        warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
        secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400',
        default: 'bg-default-100 text-default-600 dark:bg-default-800 dark:text-default-400',
    };

    return (
        <Card className="border border-divider">
            <CardHeader className="px-4 py-3 border-b border-divider">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">System Overview</h2>
                    </div>
                    {newUsersThisMonth > 0 && (
                        <Chip size="sm" color="success" variant="flat">
                            +{newUsersThisMonth} this month
                        </Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="p-3 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4">
                    {stats.map((stat) => {
                        const IconComponent = iconMap[stat.icon] || UsersIcon;
                        const colorClass = colorClasses[stat.color] || colorClasses.default;

                        return (
                            <div
                                key={stat.key}
                                className="flex flex-col items-center p-2 sm:p-3 rounded-lg border border-default-200 
                                    hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <div className={`p-1.5 sm:p-2 rounded-lg mb-1 sm:mb-2 ${colorClass}`}>
                                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <span className="text-lg sm:text-2xl font-bold tabular-nums">{stat.value}</span>
                                <span className="text-[10px] sm:text-xs text-default-500 text-center mt-0.5 sm:mt-1 line-clamp-2">
                                    {stat.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
};

export default SystemStatsWidget;
