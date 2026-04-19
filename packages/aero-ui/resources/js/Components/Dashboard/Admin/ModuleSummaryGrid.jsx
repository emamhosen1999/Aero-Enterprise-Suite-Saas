import React from 'react';
import { Card, CardBody, Chip, Skeleton } from '@heroui/react';
import { Squares2X2Icon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import { router } from '@inertiajs/react';

const ModuleSummaryGrid = ({ summaries = [], loading = false }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} style={getThemedCardStyle()}>
                        <CardBody className="p-4 space-y-3">
                            <Skeleton className="h-5 w-24 rounded" />
                            <div className="grid grid-cols-2 gap-2">
                                <Skeleton className="h-8 rounded" />
                                <Skeleton className="h-8 rounded" />
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        );
    }

    if (summaries.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Squares2X2Icon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                <h3 className="font-semibold">Module Insights</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaries.map((summary) => (
                    <Card
                        key={summary.key}
                        className="transition-all duration-200 hover:shadow-md cursor-pointer"
                        style={getThemedCardStyle()}
                        isPressable
                        onPress={() => summary.route && router.visit(summary.route)}
                    >
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm">{summary.label}</h4>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-default-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(summary.stats || {}).slice(0, 4).map(([key, value]) => (
                                    <div key={key} className="text-center p-2 rounded-lg bg-default-50">
                                        <p className="text-lg font-bold">{value}</p>
                                        <p className="text-xs text-default-500 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {summary.alerts?.length > 0 && (
                                <div className="mt-2">
                                    {summary.alerts.slice(0, 2).map((alert, i) => (
                                        <Chip key={i} size="sm" color="warning" variant="flat" className="mt-1">
                                            {alert}
                                        </Chip>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ModuleSummaryGrid;
