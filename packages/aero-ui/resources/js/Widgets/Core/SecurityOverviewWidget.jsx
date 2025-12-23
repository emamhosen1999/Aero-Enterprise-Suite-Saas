import React from 'react';
import { Card, CardHeader, CardBody, Chip, Divider } from '@heroui/react';
import {
    ShieldExclamationIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    ClockIcon,
    LockClosedIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

/**
 * SecurityOverviewWidget
 * 
 * Displays security-related tenant statistics:
 * - Failed login attempts
 * - Active sessions
 * - Registered devices
 * - Last login time
 */
const SecurityOverviewWidget = ({ data = {} }) => {
    const { 
        failedLoginsToday = 0,
        activeSessions = 0,
        registeredDevices = 0,
        lastLogin = null,
        alertLevel = 'success',
        items = [],
    } = data;

    // Icon mapping
    const iconMap = {
        ShieldExclamationIcon: ShieldExclamationIcon,
        ComputerDesktopIcon: ComputerDesktopIcon,
        DevicePhoneMobileIcon: DevicePhoneMobileIcon,
        ClockIcon: ClockIcon,
    };

    // Status color mapping
    const statusColorMap = {
        success: 'success',
        warning: 'warning',
        danger: 'danger',
        default: 'default',
    };

    // Alert level badge color
    const alertBadgeColor = {
        success: 'success',
        warning: 'warning',
        danger: 'danger',
    };

    return (
        <Card className="border border-divider">
            <CardHeader className="px-3 sm:px-4 py-2 sm:py-3 border-b border-divider">
                <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {alertLevel === 'success' ? (
                            <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-success shrink-0" />
                        ) : alertLevel === 'warning' ? (
                            <ShieldExclamationIcon className="w-4 h-4 sm:w-5 sm:h-5 text-warning shrink-0" />
                        ) : (
                            <ShieldExclamationIcon className="w-4 h-4 sm:w-5 sm:h-5 text-danger shrink-0" />
                        )}
                        <h2 className="text-base sm:text-lg font-semibold truncate">Security</h2>
                    </div>
                    <Chip 
                        size="sm" 
                        color={alertBadgeColor[alertLevel] || 'default'}
                        variant="flat"
                    >
                        {alertLevel === 'success' ? 'Secure' : alertLevel === 'warning' ? 'Attention' : 'Alert'}
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                    {items.map((item, index) => {
                        const IconComponent = iconMap[item.icon] || LockClosedIcon;
                        const statusColor = statusColorMap[item.status] || 'default';

                        return (
                            <div key={index}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 bg-${statusColor}-100/50 dark:bg-${statusColor}-900/20`}>
                                            <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 text-${statusColor}`} />
                                        </div>
                                        <span className="text-xs sm:text-sm text-default-600 truncate">{item.label}</span>
                                    </div>
                                    <Chip 
                                        size="sm" 
                                        color={statusColor}
                                        variant={item.status === 'danger' ? 'solid' : 'flat'}
                                    >
                                        {item.value}
                                    </Chip>
                                </div>
                                {index < items.length - 1 && <Divider className="my-2" />}
                            </div>
                        );
                    })}
                </div>

                {/* Quick Summary Footer */}
                <div className="mt-4 pt-3 border-t border-divider">
                    <div className="flex items-center justify-center gap-4 text-xs text-default-400">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-success"></span>
                            {activeSessions} sessions
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            {registeredDevices} devices
                        </span>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default SecurityOverviewWidget;
