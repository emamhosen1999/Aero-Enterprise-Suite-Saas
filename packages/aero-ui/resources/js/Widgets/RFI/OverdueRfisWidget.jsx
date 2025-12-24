import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton, Badge } from '@heroui/react';
import { 
    ExclamationTriangleIcon,
    ClockIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { route } from 'ziggy-js';
import axios from 'axios';

/**
 * OverdueRfisWidget - Shows overdue RFI tasks
 * 
 * ALERT widget for Core Dashboard showing critical overdue items.
 */
export default function OverdueRfisWidget({ data, meta }) {
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
            const response = await axios.get(route('core.dashboard.widget', { widgetKey: 'rfi.overdue' }));
            if (response.data) {
                setWidgetData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch overdue RFIs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAll = () => {
        safeNavigate('rfi.index', { filter: 'overdue' });
    };

    if (loading) {
        return (
            <Card>
                <CardHeader className="p-4">
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                        <Skeleton className="w-28 h-5 rounded" />
                    </div>
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="w-16 h-8 rounded" />
                    <Skeleton className="w-full h-4 rounded" />
                </CardBody>
            </Card>
        );
    }

    const { count = 0, critical = 0, items = [] } = widgetData || {};
    const hasCritical = critical > 0;

    // Don't show if no overdue items
    if (count === 0) {
        return null;
    }

    return (
        <Card 
            className="cursor-pointer hover:shadow-md border-danger/30" 
            style={{
                borderColor: 'rgb(var(--heroui-danger) / 0.3)',
            }}
            isPressable
            onPress={handleViewAll}
        >
            <CardHeader className="p-4 bg-danger/5">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                        <span className="font-semibold text-danger">Overdue RFIs</span>
                    </div>
                    <Badge 
                        content={count} 
                        color="danger"
                        size="sm"
                    >
                        <div className="w-2 h-2" />
                    </Badge>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-danger">{count}</span>
                    {hasCritical && (
                        <Chip size="sm" color="danger" variant="solid">
                            {critical} critical (&gt;3 days)
                        </Chip>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="space-y-2 border-t border-divider pt-3">
                        {items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-default-600 truncate flex-1">
                                    {item.number} - {item.type}
                                </span>
                                <Chip 
                                    size="sm" 
                                    variant="flat" 
                                    color={item.daysOverdue > 3 ? "danger" : "warning"}
                                    startContent={<ClockIcon className="w-3 h-3" />}
                                >
                                    {item.daysOverdue}d
                                </Chip>
                            </div>
                        ))}
                    </div>
                )}

                <button 
                    onClick={handleViewAll}
                    className="flex items-center gap-1 text-sm text-danger hover:underline mt-3"
                >
                    View all overdue
                    <ArrowRightIcon className="w-4 h-4" />
                </button>
            </CardBody>
        </Card>
    );
}
