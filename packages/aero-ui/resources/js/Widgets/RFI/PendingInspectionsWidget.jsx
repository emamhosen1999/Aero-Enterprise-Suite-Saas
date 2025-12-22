import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Chip, Skeleton, Badge } from '@heroui/react';
import { 
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';

/**
 * PendingInspectionsWidget - Shows pending RFIs for inspectors
 * 
 * ALERT widget for Core Dashboard showing inspection queue.
 */
export default function PendingInspectionsWidget({ data, meta }) {
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
            const response = await axios.get(route('core.dashboard.widget', { widgetKey: 'rfi.pending_inspections' }));
            if (response.data) {
                setWidgetData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch pending inspections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAll = () => {
        router.visit(route('rfi.index', { status: 'pending' }));
    };

    if (loading) {
        return (
            <Card>
                <CardHeader className="p-4">
                    <div className="flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-warning" />
                        <Skeleton className="w-32 h-5 rounded" />
                    </div>
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    <Skeleton className="w-16 h-8 rounded" />
                    <Skeleton className="w-full h-4 rounded" />
                    <Skeleton className="w-3/4 h-4 rounded" />
                </CardBody>
            </Card>
        );
    }

    const { count = 0, urgent = 0, today = 0, items = [] } = widgetData || {};
    const hasUrgent = urgent > 0;

    return (
        <Card 
            className="cursor-pointer hover:shadow-md" 
            isPressable
            onPress={handleViewAll}
        >
            <CardHeader className="p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-warning" />
                        <span className="font-semibold">Pending Inspections</span>
                    </div>
                    <Badge 
                        content={count} 
                        color={hasUrgent ? "danger" : "warning"}
                        size="sm"
                    >
                        <div className="w-2 h-2" />
                    </Badge>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {count === 0 ? (
                    <div className="text-center text-default-500 py-4">
                        <ClipboardDocumentCheckIcon className="w-8 h-8 mx-auto mb-2 text-success" />
                        <p className="text-sm">All caught up!</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl font-bold">{count}</span>
                            <div className="flex flex-col items-end gap-1">
                                {hasUrgent && (
                                    <Chip size="sm" color="danger" variant="flat" startContent={<ExclamationTriangleIcon className="w-3 h-3" />}>
                                        {urgent} urgent
                                    </Chip>
                                )}
                                {today > 0 && (
                                    <Chip size="sm" color="primary" variant="flat" startContent={<ClockIcon className="w-3 h-3" />}>
                                        {today} today
                                    </Chip>
                                )}
                            </div>
                        </div>

                        {items.length > 0 && (
                            <div className="space-y-2 border-t border-divider pt-3">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-default-600 truncate">
                                            {item.number} - {item.type}
                                        </span>
                                        <span className="text-default-400 text-xs">{item.age}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button 
                            onClick={handleViewAll}
                            className="flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                        >
                            View all
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
