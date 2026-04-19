import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Chip } from "@heroui/react";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

/**
 * Timeline Block
 * 
 * Displays events or milestones in a chronological timeline format.
 * Supports vertical and horizontal layouts with customizable styling.
 */
const Timeline = ({ content = {} }) => {
    const {
        title = '',
        subtitle = '',
        items = [],
        layout = 'vertical', // 'vertical', 'horizontal', 'alternating'
        lineColor = '#E4E4E7',
        dotColor = '#006FEE',
        showDates = true,
        showIcons = true,
        animate = true,
    } = content;

    // Default items if none provided
    const timelineItems = items.length > 0 ? items : [
        {
            title: 'Project Started',
            description: 'Initial planning and research phase began.',
            date: '2024-01-01',
            icon: 'clock',
            status: 'completed',
        },
        {
            title: 'Development Phase',
            description: 'Core features and functionality implemented.',
            date: '2024-03-15',
            icon: 'code',
            status: 'completed',
        },
        {
            title: 'Beta Launch',
            description: 'Released to early adopters for testing.',
            date: '2024-06-01',
            icon: 'rocket',
            status: 'in-progress',
        },
        {
            title: 'Public Release',
            description: 'Full public launch and marketing campaign.',
            date: '2024-09-01',
            icon: 'flag',
            status: 'upcoming',
        },
    ];

    // Status colors
    const statusColors = {
        completed: 'success',
        'in-progress': 'primary',
        upcoming: 'default',
        delayed: 'warning',
        cancelled: 'danger',
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.5 },
        },
    };

    const rightItemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.5 },
        },
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Render timeline dot
    const TimelineDot = ({ status = 'upcoming', index }) => (
        <motion.div
            initial={animate ? { scale: 0 } : false}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            className="relative z-10"
        >
            <div
                className={`w-4 h-4 rounded-full border-4 ${
                    status === 'completed'
                        ? 'bg-success border-success-200'
                        : status === 'in-progress'
                        ? 'bg-primary border-primary-200 animate-pulse'
                        : 'bg-default-200 border-default-300'
                }`}
                style={status === 'completed' || status === 'in-progress' ? { borderColor: dotColor + '40' } : {}}
            />
            {status === 'completed' && (
                <CheckCircleIcon className="absolute -top-1 -left-1 w-6 h-6 text-success" />
            )}
        </motion.div>
    );

    // Vertical Timeline
    if (layout === 'vertical') {
        return (
            <div className="py-8">
                {/* Header */}
                {(title || subtitle) && (
                    <div className="text-center mb-12">
                        {title && (
                            <h2 className="text-3xl font-bold mb-3">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="text-lg text-default-500">{subtitle}</p>
                        )}
                    </div>
                )}

                {/* Timeline */}
                <motion.div
                    variants={animate ? containerVariants : undefined}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="relative max-w-2xl mx-auto"
                >
                    {/* Vertical Line */}
                    <div
                        className="absolute left-4 top-0 bottom-0 w-0.5"
                        style={{ backgroundColor: lineColor }}
                    />

                    {/* Items */}
                    {timelineItems.map((item, index) => (
                        <motion.div
                            key={index}
                            variants={animate ? itemVariants : undefined}
                            className="relative flex gap-6 pb-8 last:pb-0"
                        >
                            {/* Dot */}
                            <div className="shrink-0 mt-1">
                                <TimelineDot status={item.status} index={index} />
                            </div>

                            {/* Content */}
                            <Card className="flex-1 shadow-sm">
                                <CardBody className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-lg">{item.title}</h4>
                                            {item.description && (
                                                <p className="text-default-500 mt-1">{item.description}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {showDates && item.date && (
                                                <span className="text-sm text-default-400 flex items-center gap-1">
                                                    <ClockIcon className="w-4 h-4" />
                                                    {formatDate(item.date)}
                                                </span>
                                            )}
                                            {item.status && (
                                                <Chip
                                                    size="sm"
                                                    color={statusColors[item.status] || 'default'}
                                                    variant="flat"
                                                >
                                                    {item.status.replace('-', ' ')}
                                                </Chip>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        );
    }

    // Alternating Timeline
    if (layout === 'alternating') {
        return (
            <div className="py-8">
                {/* Header */}
                {(title || subtitle) && (
                    <div className="text-center mb-12">
                        {title && (
                            <h2 className="text-3xl font-bold mb-3">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="text-lg text-default-500">{subtitle}</p>
                        )}
                    </div>
                )}

                {/* Timeline */}
                <motion.div
                    variants={animate ? containerVariants : undefined}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="relative max-w-4xl mx-auto"
                >
                    {/* Center Line */}
                    <div
                        className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5"
                        style={{ backgroundColor: lineColor }}
                    />

                    {/* Items */}
                    {timelineItems.map((item, index) => {
                        const isLeft = index % 2 === 0;

                        return (
                            <motion.div
                                key={index}
                                variants={animate ? (isLeft ? itemVariants : rightItemVariants) : undefined}
                                className={`relative flex items-center pb-8 last:pb-0 ${
                                    isLeft ? 'flex-row' : 'flex-row-reverse'
                                }`}
                            >
                                {/* Content */}
                                <div className={`w-[calc(50%-2rem)] ${isLeft ? 'pr-8 text-right' : 'pl-8'}`}>
                                    <Card className="shadow-sm">
                                        <CardBody className="p-4">
                                            <h4 className="font-semibold text-lg">{item.title}</h4>
                                            {item.description && (
                                                <p className="text-default-500 mt-1">{item.description}</p>
                                            )}
                                            <div className={`flex items-center gap-2 mt-3 ${isLeft ? 'justify-end' : ''}`}>
                                                {showDates && item.date && (
                                                    <span className="text-sm text-default-400">
                                                        {formatDate(item.date)}
                                                    </span>
                                                )}
                                                {item.status && (
                                                    <Chip
                                                        size="sm"
                                                        color={statusColors[item.status] || 'default'}
                                                        variant="flat"
                                                    >
                                                        {item.status.replace('-', ' ')}
                                                    </Chip>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>

                                {/* Center Dot */}
                                <div className="absolute left-1/2 transform -translate-x-1/2">
                                    <TimelineDot status={item.status} index={index} />
                                </div>

                                {/* Spacer */}
                                <div className="w-[calc(50%-2rem)]" />
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        );
    }

    // Horizontal Timeline
    return (
        <div className="py-8 overflow-x-auto">
            {/* Header */}
            {(title || subtitle) && (
                <div className="text-center mb-12">
                    {title && (
                        <h2 className="text-3xl font-bold mb-3">{title}</h2>
                    )}
                    {subtitle && (
                        <p className="text-lg text-default-500">{subtitle}</p>
                    )}
                </div>
            )}

            {/* Timeline */}
            <motion.div
                variants={animate ? containerVariants : undefined}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative inline-flex min-w-full"
            >
                {/* Horizontal Line */}
                <div
                    className="absolute top-4 left-0 right-0 h-0.5"
                    style={{ backgroundColor: lineColor }}
                />

                {/* Items */}
                <div className="flex gap-8 px-4">
                    {timelineItems.map((item, index) => (
                        <motion.div
                            key={index}
                            variants={animate ? itemVariants : undefined}
                            className="relative flex flex-col items-center min-w-[200px]"
                        >
                            {/* Dot */}
                            <div className="mb-4">
                                <TimelineDot status={item.status} index={index} />
                            </div>

                            {/* Content */}
                            <Card className="w-full shadow-sm">
                                <CardBody className="p-4 text-center">
                                    {showDates && item.date && (
                                        <span className="text-xs text-default-400 mb-2 block">
                                            {formatDate(item.date)}
                                        </span>
                                    )}
                                    <h4 className="font-semibold">{item.title}</h4>
                                    {item.description && (
                                        <p className="text-sm text-default-500 mt-1 line-clamp-2">
                                            {item.description}
                                        </p>
                                    )}
                                    {item.status && (
                                        <Chip
                                            size="sm"
                                            color={statusColors[item.status] || 'default'}
                                            variant="flat"
                                            className="mt-2"
                                        >
                                            {item.status.replace('-', ' ')}
                                        </Chip>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Timeline;
