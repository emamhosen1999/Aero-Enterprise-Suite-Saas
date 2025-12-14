import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Card,
    CardBody,
    Avatar,
    Chip,
    Tooltip,
} from '@heroui/react';
import {
    CurrencyDollarIcon,
    UserIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const priorityConfig = {
    low: { color: 'default', label: 'Low' },
    medium: { color: 'primary', label: 'Medium' },
    high: { color: 'warning', label: 'High' },
    urgent: { color: 'danger', label: 'Urgent' },
};

const DealCard = memo(function DealCard({
    deal,
    isDragging = false,
    formatCurrency,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({
        id: deal.id,
        data: {
            type: 'deal',
            deal,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1,
        cursor: 'grab',
    };

    const isRotting = deal.is_rotting;
    const priority = deal.priority || 'medium';

    const formatValue = (value) => {
        if (formatCurrency) return formatCurrency(value);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: deal.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const daysUntilClose = () => {
        if (!deal.expected_close_date) return null;
        const diff = Math.ceil(
            (new Date(deal.expected_close_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return diff;
    };

    const closeDays = daysUntilClose();

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="touch-none"
        >
            <Card
                className={`
                    w-full mb-2 transition-all duration-200 
                    hover:shadow-md hover:scale-[1.02]
                    ${isRotting ? 'ring-2 ring-warning-400 bg-warning-50/30 dark:bg-warning-900/20' : ''}
                    ${isSortableDragging ? 'shadow-xl ring-2 ring-primary-500' : 'shadow-sm'}
                `}
                isPressable
            >
                <CardBody className="p-3 gap-2">
                    {/* Header Row - Title & Priority */}
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-2 flex-1">
                            {deal.title}
                        </h4>
                        <Chip
                            size="sm"
                            variant="flat"
                            color={priorityConfig[priority]?.color || 'default'}
                            className="text-tiny shrink-0"
                        >
                            {priorityConfig[priority]?.label || priority}
                        </Chip>
                    </div>

                    {/* Customer */}
                    {deal.customer && (
                        <div className="flex items-center gap-2 text-default-500">
                            <UserIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs truncate">
                                {deal.customer.name}
                            </span>
                        </div>
                    )}

                    {/* Value Row */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1.5">
                            <CurrencyDollarIcon className="w-4 h-4 text-success-500" />
                            <span className="text-sm font-bold text-success-600 dark:text-success-400">
                                {formatValue(deal.value)}
                            </span>
                        </div>

                        {/* Probability Badge */}
                        <Tooltip content={`Win probability: ${deal.probability}%`}>
                            <div className="px-1.5 py-0.5 rounded-md bg-default-100 dark:bg-default-50/10">
                                <span className="text-tiny font-medium text-default-600">
                                    {deal.probability}%
                                </span>
                            </div>
                        </Tooltip>
                    </div>

                    {/* Footer Row - Date & Indicators */}
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-divider">
                        {/* Expected Close Date */}
                        {deal.expected_close_date && (
                            <Tooltip content={`Expected close: ${formatDate(deal.expected_close_date)}`}>
                                <div className={`flex items-center gap-1 ${
                                    closeDays !== null && closeDays < 0 
                                        ? 'text-danger-500' 
                                        : closeDays !== null && closeDays <= 7 
                                            ? 'text-warning-500' 
                                            : 'text-default-400'
                                }`}>
                                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                                    <span className="text-xs">
                                        {closeDays !== null && closeDays < 0 
                                            ? `${Math.abs(closeDays)}d overdue` 
                                            : formatDate(deal.expected_close_date)
                                        }
                                    </span>
                                </div>
                            </Tooltip>
                        )}

                        {/* Rotting Indicator */}
                        {isRotting && (
                            <Tooltip content="Deal is rotting - no activity recently">
                                <div className="flex items-center gap-1 text-warning-500">
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                    <span className="text-xs">Rotting</span>
                                </div>
                            </Tooltip>
                        )}

                        {/* Assigned User Avatar */}
                        {deal.assigned_to_user && (
                            <Tooltip content={`Assigned to: ${deal.assigned_to_user.name}`}>
                                <Avatar
                                    src={deal.assigned_to_user.avatar}
                                    name={deal.assigned_to_user.name}
                                    size="sm"
                                    className="w-6 h-6"
                                />
                            </Tooltip>
                        )}
                    </div>

                    {/* Deal Number */}
                    <div className="text-tiny text-default-400 mt-1">
                        {deal.deal_number}
                    </div>
                </CardBody>
            </Card>
        </motion.div>
    );
});

export default DealCard;
