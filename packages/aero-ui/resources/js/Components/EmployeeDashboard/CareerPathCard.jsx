import React from 'react';
import { Progress, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full"><Skeleton className="h-5 w-28 rounded" /></div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-4">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-4 w-36 rounded" />
        </ThemedCardBody>
    </ThemedCard>
);

const CareerPathCard = ({ careerData }) => {
    useThemeRadius();
    if (careerData === undefined) return <LoadingSkeleton />;

    const { careerPath } = careerData || {};
    if (!careerPath) {
        return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                <ThemedCard className="h-full">
                    <ThemedCardHeader>
                        <div className="p-4 sm:p-5 w-full">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                    <ArrowTrendingUpIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">Career Path</h3>
                            </div>
                        </div>
                    </ThemedCardHeader>
                    <ThemedCardBody className="p-4 sm:p-5">
                        <p className="text-sm text-default-400 text-center py-2">No career path data available</p>
                    </ThemedCardBody>
                </ThemedCard>
            </motion.div>
        );
    }

    const pct = Number(careerPath.progress_percentage) || 0;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <ArrowTrendingUpIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Career Path</h3>
                        </div>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-4">
                    {/* Current → Next Position */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                            <p className="text-[10px] text-default-500 uppercase tracking-wider">Current</p>
                            <p className="font-semibold text-foreground truncate">{careerPath.current_position || 'N/A'}</p>
                        </div>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-primary shrink-0 mx-2" />
                        <div className="min-w-0 text-right">
                            <p className="text-[10px] text-default-500 uppercase tracking-wider">Next</p>
                            <p className="font-semibold text-foreground truncate">{careerPath.next_position || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-default-500">
                            <span>Progress</span>
                            <span className="font-semibold text-foreground">{pct}%</span>
                        </div>
                        <Progress
                            size="md"
                            value={pct}
                            color={pct >= 80 ? 'success' : pct >= 50 ? 'primary' : 'warning'}
                            aria-label="Career progress"
                        />
                    </div>
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default CareerPathCard;
