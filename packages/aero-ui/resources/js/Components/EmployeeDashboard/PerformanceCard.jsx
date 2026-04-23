import React from 'react';
import { Link } from '@inertiajs/react';
import { Chip, Progress, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { ChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full flex items-center justify-between">
                <Skeleton className="h-5 w-28 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
            </div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-4">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-24 rounded-full" />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1"><Skeleton className="h-3 w-28 rounded" /><Skeleton className="h-2 w-full rounded" /></div>
            ))}
        </ThemedCardBody>
    </ThemedCard>
);

const REVIEW_STATUS_COLOR = {
    in_progress: 'primary', completed: 'success', pending: 'warning', draft: 'default', overdue: 'danger',
};

const PerformanceCard = ({ performanceData }) => {
    const themeRadius = useThemeRadius();
    if (performanceData === undefined) return <LoadingSkeleton />;

    const { currentReview, myKPIs } = performanceData || {};
    const kpis = (myKPIs || []).slice(0, 5);

    let viewHref = '#';
    try { viewHref = route('hrm.performance.index'); } catch {}

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <ChartBarIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Performance</h3>
                        </div>
                        <Link href={viewHref} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            View My Performance <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-4">
                    {/* Current Review Cycle */}
                    {currentReview ? (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Current Review</p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{currentReview.cycle_name || currentReview.title || 'Review Cycle'}</span>
                                <Chip size="sm" variant="flat" color={REVIEW_STATUS_COLOR[currentReview.status] || 'default'} radius={themeRadius}>
                                    {currentReview.status || 'N/A'}
                                </Chip>
                            </div>
                            {currentReview.score != null && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-default-500">
                                        <span>Score</span>
                                        <span className="font-semibold text-foreground">{currentReview.score}/100</span>
                                    </div>
                                    <Progress size="sm" value={currentReview.score} color={currentReview.score >= 80 ? 'success' : currentReview.score >= 60 ? 'warning' : 'danger'} aria-label="Review score" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-default-400">No active review cycle</p>
                    )}

                    {/* KPI Progress */}
                    {kpis.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">KPIs</p>
                            {kpis.map((kpi, i) => (
                                <div key={kpi.id || i} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-default-600 dark:text-default-400 truncate max-w-[60%]">{kpi.name || kpi.title}</span>
                                        <span className="font-semibold text-foreground">{kpi.progress ?? kpi.achievement ?? 0}%</span>
                                    </div>
                                    <Progress size="sm" value={kpi.progress ?? kpi.achievement ?? 0} color={kpi.progress >= 80 ? 'success' : kpi.progress >= 50 ? 'primary' : 'warning'} aria-label={kpi.name} />
                                </div>
                            ))}
                        </div>
                    )}

                    {!currentReview && kpis.length === 0 && (
                        <p className="text-sm text-default-400 text-center py-2">No performance data available</p>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default PerformanceCard;
