import React from 'react';
import { Card, CardHeader, CardBody, Divider } from '@heroui/react';
import {
    BuildingOfficeIcon,
    IdentificationIcon,
    SparklesIcon,
    AcademicCapIcon,
    MapPinIcon,
    GlobeAltIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * OrganizationInfoWidget
 * 
 * Displays organizational structure overview:
 * - Departments count
 * - Designations count
 * - Skills defined
 * - Competencies count
 */
const OrganizationInfoWidget = ({ data = {} }) => {
    const { items = [] } = data;

    // Icon mapping
    const iconMap = {
        BuildingOfficeIcon: BuildingOfficeIcon,
        IdentificationIcon: IdentificationIcon,
        SparklesIcon: SparklesIcon,
        AcademicCapIcon: AcademicCapIcon,
        MapPinIcon: MapPinIcon,
        GlobeAltIcon: GlobeAltIcon,
        InformationCircleIcon: InformationCircleIcon,
    };

    // Color classes mapping
    const colorClasses = {
        primary: 'text-primary',
        secondary: 'text-secondary',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
        default: 'text-default-500',
    };

    // Background color classes
    const bgColorClasses = {
        primary: 'bg-primary-100/50 dark:bg-primary-900/20',
        secondary: 'bg-secondary-100/50 dark:bg-secondary-900/20',
        success: 'bg-success-100/50 dark:bg-success-900/20',
        warning: 'bg-warning-100/50 dark:bg-warning-900/20',
        danger: 'bg-danger-100/50 dark:bg-danger-900/20',
        default: 'bg-default-100 dark:bg-default-800',
    };

    return (
        <Card className="border border-divider">
            <CardHeader className="px-4 py-3 border-b border-divider">
                <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Organization</h2>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {items.length === 0 ? (
                    <div className="text-center py-6 text-default-400">
                        <InformationCircleIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No organization data</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item, index) => {
                            const IconComponent = iconMap[item.icon] || InformationCircleIcon;
                            const colorClass = colorClasses[item.color] || colorClasses.default;
                            const bgClass = bgColorClasses[item.color] || bgColorClasses.default;

                            return (
                                <div key={item.key}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${bgClass}`}>
                                                <IconComponent className={`w-4 h-4 ${colorClass}`} />
                                            </div>
                                            <span className="text-sm text-default-600">{item.label}</span>
                                        </div>
                                        <span className="text-lg font-semibold tabular-nums">
                                            {item.value}
                                        </span>
                                    </div>
                                    {index < items.length - 1 && <Divider className="my-2" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default OrganizationInfoWidget;
