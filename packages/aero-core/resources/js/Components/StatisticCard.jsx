import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { Skeleton, Card } from '@heroui/react';

const StatisticCard = ({ title, value, icon: IconComponent, color, isLoaded, testId }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full w-full"
    >
        <Card 
            className="h-full w-full transition-all duration-200 cursor-pointer shadow-lg"
            style={{
                border: `var(--borderWidth, 2px) solid transparent`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
                transform: `scale(var(--scale, 1))`,
                background: `linear-gradient(135deg, 
                    var(--theme-content1, #FAFAFA) 20%, 
                    var(--theme-content2, #F4F4F5) 10%, 
                    var(--theme-content3, #F1F3F4) 20%)`,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, ${color} 50%, transparent)`;
                e.currentTarget.style.borderRadius = `var(--borderRadius, 12px)`;
                e.currentTarget.style.transform = `scale(calc(var(--scale, 1) * 1.02))`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid transparent`;
                e.currentTarget.style.transform = `scale(var(--scale, 1))`;
            }}
        >
            <div className="p-4 h-full w-full flex flex-col">
                <Skeleton 
                    className="rounded-lg" 
                    isLoaded={isLoaded}
                    data-testid={testId}
                    style={{
                        borderRadius: `var(--borderRadius, 8px)`
                    }}
                >
                    <div 
                        className="flex flex-col gap-2 h-full"
                        role="region"
                        aria-label={`${title} statistics`}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                            transform: `scale(var(--scale, 1))`
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <h3 
                                className="text-xs font-medium text-default-500 leading-tight flex-1 mr-1"
                                style={{ 
                                    fontFamily: `var(--fontFamily, "Inter")`
                                }}
                            >
                                {title}
                            </h3>
                            <div
                                className="flex items-center justify-center min-w-[40px] sm:min-w-[48px] min-h-[40px] sm:min-h-[48px] flex-shrink-0"
                                style={{ 
                                    backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    border: `var(--borderWidth, 1px) solid color-mix(in srgb, ${color} 25%, transparent)`
                                }}
                            >
                                <IconComponent 
                                    className="w-6 h-6 stroke-2"
                                    style={{ color: color }}
                                    aria-hidden="true"
                                />
                            </div>
                        </div>

                        {/* Value */}
                        <div className="mt-auto">
                            <div 
                                className="text-2xl font-bold text-foreground leading-none"
                                aria-live="polite"
                                style={{ 
                                    fontFamily: `var(--fontFamily, "Inter")`
                                }}
                            >
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </div>
                        </div>
                    </div>
                </Skeleton>
            </div>
        </Card>
    </motion.div>
);

const StatisticsWidgets = () => {
    const [statistics, setStatistics] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        rfi_submissions: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(route('stats'), {
                    signal: controller.signal,
                    timeout: 10000 // 10 second timeout
                });
                
                if (isMounted && response.data?.statistics) {
                    setStatistics(response.data.statistics);
                } else {
                    throw new Error('Invalid response structure');
                }
            } catch (err) {
                if (isMounted && !controller.signal.aborted) {
                    console.error('Failed to fetch statistics:', err);
                    setError(err.message);
                    setStatistics({
                        total: 0,
                        completed: 0,
                        pending: 0,
                        rfi_submissions: 0
                    });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStatistics();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    const statisticsConfig = [
        {
            id: 'total-daily-works',
            title: 'Total Daily Works',
            value: statistics.total,
            icon: ClipboardDocumentListIcon,
            color: 'var(--theme-primary, #006FEE)',
            testId: 'stat-total-works'
        },
        {
            id: 'completed-daily-works',
            title: 'Completed Daily Works',
            value: statistics.completed,
            icon: CheckCircleIcon,
            color: 'var(--theme-success, #17C964)',
            testId: 'stat-completed-works'
        },
        {
            id: 'pending-daily-works',
            title: 'Pending Daily Works',
            value: statistics.pending,
            icon: ClockIcon,
            color: 'var(--theme-warning, #F5A524)',
            testId: 'stat-pending-works'
        },
        {
            id: 'rfi-submissions',
            title: 'RFI Submissions',
            value: statistics.rfi_submissions,
            icon: DocumentTextIcon,
            color: 'var(--theme-secondary, #7C3AED)',
            testId: 'stat-rfi-submissions'
        }
    ];

    if (error) {
        return (
            <div className="flex flex-col w-full h-full p-4">
                <div className="flex-grow h-full flex items-center justify-center">
                <Card 
                    className="p-4 transition-all duration-200"
                    style={{
                        background: `color-mix(in srgb, var(--theme-danger, #F31260) 10%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--theme-danger, #F31260) 25%, transparent)`,
                        borderWidth: `var(--borderWidth, 2px)`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                        transform: `scale(var(--scale, 1))`
                    }}
                >
                    <p 
                        className="text-base"
                        style={{ color: `var(--theme-danger, #F31260)` }}
                    >
                        Failed to load statistics: {error}
                    </p>
                </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full p-4">
            <section 
                className="h-full w-full"
                aria-label="Statistics Dashboard"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full max-w-full">
                {statisticsConfig.map((stat, index) => (
                    <div key={stat.id} className="w-full">
                        <StatisticCard
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                            isLoaded={!loading}
                            testId={stat.testId}
                        />
                    </div>
                ))}
            </div>
            </section>
        </div>
    );
};

export default StatisticsWidgets;
