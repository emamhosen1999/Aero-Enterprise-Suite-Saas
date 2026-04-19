import React from 'react';
import { Checkbox, Progress, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full"><Skeleton className="h-5 w-28 rounded" /></div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-4">
            <Skeleton className="h-3 w-full rounded" />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full rounded" />)}
        </ThemedCardBody>
    </ThemedCard>
);

const OnboardingProgressCard = ({ onboardingData }) => {
    useThemeRadius();
    if (onboardingData === undefined) return <LoadingSkeleton />;

    const progress = onboardingData?.onboardingProgress;
    if (!progress) return null;

    const tasks = progress.tasks || progress.checklist || [];
    const completed = tasks.filter((t) => t.completed || t.done).length;
    const total = tasks.length || 1;
    const pct = Math.round((completed / total) * 100);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full border-primary/30" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}>
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <RocketLaunchIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Onboarding</h3>
                                <p className="text-[10px] text-default-400">{completed}/{total} tasks completed</p>
                            </div>
                        </div>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-default-500">
                            <span>Overall Progress</span>
                            <span className="font-semibold text-foreground">{pct}%</span>
                        </div>
                        <Progress
                            size="md"
                            value={pct}
                            color={pct === 100 ? 'success' : 'primary'}
                            aria-label="Onboarding progress"
                        />
                    </div>

                    {/* Task Checklist */}
                    {tasks.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Pending Tasks</p>
                            {tasks.filter((t) => !(t.completed || t.done)).slice(0, 6).map((t, i) => (
                                <div key={t.id || i} className="flex items-center gap-2">
                                    <Checkbox isReadOnly size="sm" isSelected={false} color="primary" />
                                    <span className="text-xs text-foreground">{t.title || t.name}</span>
                                </div>
                            ))}
                            {tasks.filter((t) => t.completed || t.done).slice(0, 3).map((t, i) => (
                                <div key={`done-${t.id || i}`} className="flex items-center gap-2 opacity-60">
                                    <Checkbox isReadOnly size="sm" isSelected color="success" />
                                    <span className="text-xs text-foreground line-through">{t.title || t.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default OnboardingProgressCard;
