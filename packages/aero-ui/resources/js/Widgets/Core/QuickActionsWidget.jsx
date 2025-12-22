import React from 'react';
import { Card, CardHeader, CardBody, Button, Tooltip } from '@heroui/react';
import { Link } from '@inertiajs/react';
import {
    UserCircleIcon,
    UsersIcon,
    ShieldCheckIcon,
    ClockIcon,
    CalendarIcon,
    CogIcon,
    PlusIcon,
    DocumentTextIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';

/**
 * QuickActionsWidget
 * 
 * Displays quick action buttons for frequently used features.
 * Actions are filtered based on user permissions.
 */
const QuickActionsWidget = ({ data = {} }) => {
    const { actions = [] } = data;

    // Icon mapping
    const iconMap = {
        UserCircleIcon: UserCircleIcon,
        UsersIcon: UsersIcon,
        ShieldCheckIcon: ShieldCheckIcon,
        ClockIcon: ClockIcon,
        CalendarIcon: CalendarIcon,
        CogIcon: CogIcon,
        PlusIcon: PlusIcon,
        DocumentTextIcon: DocumentTextIcon,
        ChartBarIcon: ChartBarIcon,
    };

    // Color mapping
    const colorMap = {
        default: 'default',
        primary: 'primary',
        secondary: 'secondary',
        success: 'success',
        warning: 'warning',
        danger: 'danger',
    };

    // Default actions if none provided
    const displayActions = actions.length > 0 ? actions : [
        { key: 'profile', label: 'My Profile', icon: 'UserCircleIcon', route: 'profile.index', color: 'default' },
        { key: 'users', label: 'Users', icon: 'UsersIcon', route: 'users.index', color: 'primary' },
    ];

    const getIcon = (iconName) => {
        const IconComponent = iconMap[iconName] || CogIcon;
        return <IconComponent className="w-5 h-5" />;
    };

    const getRoute = (routeName) => {
        try {
            return route(routeName);
        } catch (e) {
            return '#';
        }
    };

    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                    <PlusIcon className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Quick Actions</h2>
                </div>
            </CardHeader>
            <CardBody className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                    {displayActions.map((action) => (
                        <Tooltip key={action.key} content={action.label}>
                            <Button
                                as={Link}
                                href={getRoute(action.route)}
                                color={colorMap[action.color] || 'default'}
                                variant="flat"
                                size="sm"
                                startContent={getIcon(action.icon)}
                                className="min-w-[120px]"
                            >
                                {action.label}
                            </Button>
                        </Tooltip>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
};

QuickActionsWidget.displayName = 'QuickActionsWidget';

export default QuickActionsWidget;
