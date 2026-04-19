import React from 'react';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import { BoltIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import { router } from '@inertiajs/react';

const QuickActionsPanel = ({ actions = [], can }) => {
    if (actions.length === 0) return null;

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center gap-2">
                    <BoltIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="font-semibold">Quick Actions</h3>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="space-y-3">
                    {actions.map((group) => (
                        <div key={group.group}>
                            <p className="text-xs font-semibold text-default-400 uppercase mb-2">{group.group}</p>
                            <div className="grid grid-cols-1 gap-1.5">
                                {group.items.map((item) => (
                                    <Button
                                        key={item.label}
                                        size="sm"
                                        variant="flat"
                                        className="justify-start w-full"
                                        onPress={() => item.route && router.visit(route(item.route))}
                                    >
                                        {item.label}
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
