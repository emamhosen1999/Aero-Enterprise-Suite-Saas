import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardHeader, CardBody, Chip, Skeleton, Progress } from '@heroui/react';
import { CurrencyDollarIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import DealCard from './DealCard';

const KanbanColumn = memo(function KanbanColumn({
    stage,
    deals = [],
    isLoading = false,
    formatCurrency,
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `stage-${stage.id}`,
        data: {
            type: 'stage',
            stage,
        },
    });

    const dealIds = deals.map((deal) => deal.id);

    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

    const formatValue = (value) => {
        if (formatCurrency) return formatCurrency(value);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: value >= 1000000 ? 'compact' : 'standard',
        }).format(value);
    };

    // Color styles based on stage color
    const getStageColorStyle = () => {
        const color = stage.color || '#6366f1';
        return {
            borderTopColor: color,
            '--stage-color': color,
        };
    };

    // Stage type badge variants
    const getStageTypeBadge = () => {
        switch (stage.stage_type) {
            case 'won':
                return { color: 'success', label: 'Won' };
            case 'lost':
                return { color: 'danger', label: 'Lost' };
            default:
                return null;
        }
    };

    const typeBadge = getStageTypeBadge();

    // Max deals indicator
    const maxDealsReached = stage.max_deals && deals.length >= stage.max_deals;
    const dealsProgress = stage.max_deals ? (deals.length / stage.max_deals) * 100 : 0;

    return (
        <div
            className="flex flex-col h-full min-w-[300px] max-w-[320px] shrink-0"
        >
            {/* Column Header */}
            <Card
                className={`
                    mb-3 border-t-4 transition-all duration-200
                    ${isOver ? 'ring-2 ring-primary-500 shadow-lg' : 'shadow-sm'}
                `}
                style={getStageColorStyle()}
            >
                <CardHeader className="pb-2 pt-3 px-4 flex flex-col gap-2">
                    {/* Stage Name Row */}
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                {stage.name}
                            </h3>
                            {typeBadge && (
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    color={typeBadge.color}
                                    className="text-tiny"
                                >
                                    {typeBadge.label}
                                </Chip>
                            )}
                        </div>

                        {/* Deal Count Badge */}
                        <Chip
                            size="sm"
                            variant="flat"
                            color={maxDealsReached ? 'warning' : 'default'}
                            className="text-tiny"
                        >
                            <DocumentIcon className="w-3 h-3 mr-1" />
                            {deals.length}
                            {stage.max_deals && `/${stage.max_deals}`}
                        </Chip>
                    </div>

                    {/* Total Value Row */}
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 text-default-500">
                            <CurrencyDollarIcon className="w-4 h-4 text-success-500" />
                            <span className="text-sm font-semibold text-success-600 dark:text-success-400">
                                {formatValue(totalValue)}
                            </span>
                        </div>

                        {/* Win Probability */}
                        <span className="text-xs text-default-400">
                            {stage.probability}% probability
                        </span>
                    </div>

                    {/* Max Deals Progress */}
                    {stage.max_deals && (
                        <Progress
                            size="sm"
                            value={dealsProgress}
                            color={maxDealsReached ? 'warning' : 'primary'}
                            className="mt-1"
                            aria-label="Stage capacity"
                        />
                    )}
                </CardHeader>
            </Card>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={`
                    flex-1 overflow-y-auto px-1 py-2 rounded-lg
                    transition-all duration-200 min-h-[200px]
                    ${isOver 
                        ? 'bg-primary-100/50 dark:bg-primary-900/20 ring-2 ring-dashed ring-primary-400' 
                        : 'bg-default-100/50 dark:bg-default-50/5'
                    }
                `}
            >
                {isLoading ? (
                    // Loading Skeletons
                    <div className="space-y-2 p-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="rounded-lg">
                                <div className="h-28 rounded-lg bg-default-200" />
                            </Skeleton>
                        ))}
                    </div>
                ) : deals.length === 0 ? (
                    // Empty State
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center p-4"
                    >
                        <DocumentIcon className="w-10 h-10 text-default-300 mb-2" />
                        <p className="text-sm text-default-400">
                            No deals in this stage
                        </p>
                        <p className="text-xs text-default-300 mt-1">
                            Drag deals here to move them
                        </p>
                    </motion.div>
                ) : (
                    // Deal Cards
                    <SortableContext
                        items={dealIds}
                        strategy={verticalListSortingStrategy}
                    >
                        <AnimatePresence mode="popLayout">
                            {deals.map((deal) => (
                                <DealCard
                                    key={deal.id}
                                    deal={deal}
                                    formatCurrency={formatCurrency}
                                />
                            ))}
                        </AnimatePresence>
                    </SortableContext>
                )}
            </div>
        </div>
    );
});

export default KanbanColumn;
