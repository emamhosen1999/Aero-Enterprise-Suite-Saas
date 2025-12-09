import React from 'react';
import { Card, CardBody, Progress, Chip, Tooltip } from '@heroui/react';
import { 
    ExclamationTriangleIcon,
    CheckCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * Reusable Usage Meter Widget
 * 
 * Displays usage metrics with visual progress bar and status indicators.
 * Can be used in dashboards, subscription pages, or anywhere usage needs to be shown.
 * 
 * @example
 * <UsageMeter
 *   label="Active Users"
 *   current={25}
 *   limit={50}
 *   unit="users"
 *   icon={UserGroupIcon}
 *   color="primary"
 *   showPercentage
 * />
 */
export default function UsageMeter({
    label,
    current = 0,
    limit = 0,
    unit = '',
    icon: Icon,
    color = 'primary',
    showPercentage = true,
    showAlert = true,
    alertThreshold = 80,
    size = 'md',
    className = ''
}) {
    // Calculate percentage
    const percentage = limit === -1 ? 0 : (current / limit) * 100;
    const isNearLimit = percentage >= alertThreshold;
    const isOverLimit = percentage > 100;
    const isUnlimited = limit === -1;

    // Determine color based on usage
    const getColor = () => {
        if (isOverLimit) return 'danger';
        if (isNearLimit) return 'warning';
        return color;
    };

    const actualColor = getColor();

    // Size variants
    const sizes = {
        sm: {
            text: 'text-sm',
            icon: 'w-4 h-4',
            padding: 'p-2',
            progress: 'h-1'
        },
        md: {
            text: 'text-base',
            icon: 'w-5 h-5',
            padding: 'p-3',
            progress: 'h-2'
        },
        lg: {
            text: 'text-lg',
            icon: 'w-6 h-6',
            padding: 'p-4',
            progress: 'h-3'
        }
    };

    const sizeClasses = sizes[size] || sizes.md;

    return (
        <Card className={`${isNearLimit && showAlert ? 'border-2 border-warning' : ''} ${className}`}>
            <CardBody className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {Icon && (
                            <div className={`${sizeClasses.padding} rounded-lg bg-${actualColor}/10`}>
                                <Icon className={`${sizeClasses.icon} text-${actualColor}`} />
                            </div>
                        )}
                        <div>
                            <h4 className={`font-semibold ${sizeClasses.text}`}>{label}</h4>
                            {!isUnlimited && (
                                <p className="text-xs text-default-500">
                                    Limit: {limit.toLocaleString()} {unit}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {showPercentage && !isUnlimited && (
                        <Tooltip content={`${current.toLocaleString()} / ${limit.toLocaleString()} ${unit}`}>
                            <Chip 
                                color={actualColor} 
                                variant="flat"
                                size={size}
                            >
                                {percentage.toFixed(0)}%
                            </Chip>
                        </Tooltip>
                    )}

                    {isUnlimited && (
                        <Chip color="success" variant="flat" size={size}>
                            Unlimited
                        </Chip>
                    )}
                </div>

                {/* Progress Bar */}
                {!isUnlimited && (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-default-500">Current</span>
                            <span className="font-medium">
                                {current.toLocaleString()} {unit}
                            </span>
                        </div>
                        <Progress 
                            value={Math.min(percentage, 100)}
                            color={actualColor}
                            className="w-full"
                            size={size}
                        />
                    </>
                )}

                {/* Alert Messages */}
                {showAlert && !isUnlimited && (
                    <>
                        {isOverLimit && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-start gap-2 p-2 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800"
                            >
                                <ExclamationTriangleIcon className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-danger-800 dark:text-danger-400">
                                    <strong>Limit Exceeded:</strong> You've exceeded your {label.toLowerCase()} limit. 
                                    Please upgrade your plan.
                                </p>
                            </motion.div>
                        )}

                        {isNearLimit && !isOverLimit && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-start gap-2 p-2 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
                            >
                                <ExclamationTriangleIcon className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-warning-800 dark:text-warning-400">
                                    <strong>Approaching Limit:</strong> You're using {percentage.toFixed(0)}% of your {label.toLowerCase()}. 
                                    Consider upgrading soon.
                                </p>
                            </motion.div>
                        )}

                        {percentage < alertThreshold && percentage > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-start gap-2 p-2 rounded-lg bg-success-50 dark:bg-success-900/20"
                            >
                                <CheckCircleIcon className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-success-800 dark:text-success-400">
                                    You're using {percentage.toFixed(0)}% of your {label.toLowerCase()}. You have plenty of room.
                                </p>
                            </motion.div>
                        )}
                    </>
                )}

                {isUnlimited && showAlert && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-start gap-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20"
                    >
                        <InformationCircleIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-primary-800 dark:text-primary-400">
                            Your plan includes unlimited {label.toLowerCase()}.
                        </p>
                    </motion.div>
                )}
            </CardBody>
        </Card>
    );
}
