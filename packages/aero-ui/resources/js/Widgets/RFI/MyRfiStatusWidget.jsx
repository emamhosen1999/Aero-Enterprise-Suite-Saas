import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton, Progress, Button } from '@heroui/react';
import { 
    DocumentTextIcon,
    PlayIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

/**
 * MyRfiStatusWidget - Shows user's today's RFI tasks
 * 
 * ACTION widget for Core Dashboard showing personal RFI status.
 */
export default function MyRfiStatusWidget({ data, meta }) {
    const [loading, setLoading] = useState(!data);
    const [widgetData, setWidgetData] = useState(data || null);

    useEffect(() => {
        if (data) {
            setWidgetData(data);
            setLoading(false);
            return;
        }
        fetchData();
    }, [data]);

    const fetchData = async () => {
        try {
            const response = await axios.get(route('core.dashboard.widget', { widgetKey: 'rfi.my_status' }));
            if (response.data) {
                setWidgetData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch RFI status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAll = () => {
        router.visit(route('rfi.my-work'));
    };

    const handleNewRfi = () => {
        router.visit(route('rfi.create'));
    };

    if (loading) {
        return (
            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                <CardHeader className="border-b border-divider p-4">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-primary" />
                        <Skeleton className="w-28 h-5 rounded" />
                    </div>
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-12 rounded" />
                        ))}
                    </div>
                    <Skeleton className="w-full h-2 rounded" />
                </CardBody>
            </Card>
        );
    }

    const { stats = {}, items = [], hasWork = false } = widgetData || {};
    const { total = 0, pending = 0, in_progress = 0, completed = 0, rejected = 0 } = stats;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const statusItems = [
        { label: 'Pending', value: pending, color: 'warning', icon: ClockIcon },
        { label: 'In Progress', value: in_progress, color: 'primary', icon: PlayIcon },
        { label: 'Completed', value: completed, color: 'success', icon: CheckCircleIcon },
        { label: 'Rejected', value: rejected, color: 'danger', icon: XCircleIcon },
    ];

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">My RFI Today</span>
                    </div>
                    <Chip size="sm" variant="flat" color="default">
                        {total} total
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {total === 0 ? (
                    <div className="text-center py-4">
                        <DocumentTextIcon className="w-10 h-10 mx-auto mb-2 text-default-300" />
                        <p className="text-sm text-default-500 mb-3">No RFIs assigned for today</p>
                        <Button 
                            size="sm" 
                            color="primary" 
                            variant="flat"
                            onPress={handleNewRfi}
                        >
                            Create New RFI
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {statusItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div 
                                        key={item.label} 
                                        className={`text-center p-2 rounded-lg bg-${item.color}/10`}
                                    >
                                        <Icon className={`w-4 h-4 mx-auto text-${item.color} mb-1`} />
                                        <div className="text-lg font-bold">{item.value}</div>
                                        <div className="text-xs text-default-500 truncate">{item.label}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Completion Progress */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-default-600">Completion</span>
                                <span className="font-medium">{completionRate}%</span>
                            </div>
                            <Progress 
                                value={completionRate} 
                                color={completionRate === 100 ? "success" : "primary"}
                                size="sm"
                            />
                        </div>

                        {/* Recent Items */}
                        {items.length > 0 && (
                            <div className="space-y-2 border-t border-divider pt-3">
                                <span className="text-xs text-default-500">Needs attention:</span>
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-default-700 truncate flex-1">
                                            {item.number}
                                        </span>
                                        <Chip size="sm" variant="flat" color={
                                            item.status === 'pending' ? 'warning' : 
                                            item.status === 'in-progress' ? 'primary' : 'default'
                                        }>
                                            {item.status}
                                        </Chip>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button 
                            onClick={handleViewAll}
                            className="flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                        >
                            View all my RFIs
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
