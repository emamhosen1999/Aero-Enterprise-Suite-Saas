import React from 'react';
import { Card, CardBody, CardHeader, Button, Divider } from '@heroui/react';
import {
    BoltIcon, UserPlusIcon, EnvelopeIcon, ShieldCheckIcon,
    BuildingOfficeIcon, ShieldExclamationIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import { router } from '@inertiajs/react';
import { hasRoute } from '@/utils/routeUtils';

const iconMap = {
    UserPlusIcon: <UserPlusIcon className="w-4 h-4" />,
    EnvelopeIcon: <EnvelopeIcon className="w-4 h-4" />,
    ShieldCheckIcon: <ShieldCheckIcon className="w-4 h-4" />,
    BuildingOfficeIcon: <BuildingOfficeIcon className="w-4 h-4" />,
    ShieldExclamationIcon: <ShieldExclamationIcon className="w-4 h-4" />,
};

const QuickActionsPanel = ({ actions = [] }) => {
    if (actions.length === 0) return null;

    const handleAction = (item) => {
        if (!item.route) return;
        if (hasRoute(item.route)) {
            router.visit(route(item.route));
        }
    };

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
                        <BoltIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <h3 className="font-semibold">Quick Actions</h3>
                </div>
            </CardHeader>
            <CardBody className="p-3">
                <div className="space-y-4">
                    {actions.map((group, gIdx) => (
                        <div key={group.group}>
                            {gIdx > 0 && <Divider className="mb-4" />}
                            <p className="text-[11px] font-bold text-default-400 uppercase tracking-wider mb-2 px-1">
                                {group.group}
                            </p>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <Button
                                        key={item.label}
                                        size="sm"
                                        variant="ghost"
                                        className="justify-start w-full text-left h-9 px-3 hover:bg-default-100 group"
                                        startContent={
                                            <span className="text-primary group-hover:scale-110 transition-transform">
                                                {iconMap[item.icon] || <BoltIcon className="w-4 h-4" />}
                                            </span>
                                        }
                                        endContent={<ArrowRightIcon className="w-3.5 h-3.5 text-default-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />}
                                        onPress={() => handleAction(item)}
                                    >
                                        <span className="flex-1 text-left text-sm">{item.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
};

export default QuickActionsPanel;
