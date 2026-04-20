import React from 'react';
import { Link } from '@inertiajs/react';
import { Button, Chip, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { ClipboardDocumentListIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full"><Skeleton className="h-5 w-24 rounded" /></div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </ThemedCardBody>
    </ThemedCard>
);

const SurveysCard = ({ surveyData }) => {
    const themeRadius = useThemeRadius();
    if (surveyData === undefined) return <LoadingSkeleton />;

    const surveys = (surveyData?.activeSurveys || []).slice(0, 5);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <ClipboardDocumentListIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Surveys</h3>
                        </div>
                        {surveys.length > 0 && (
                            <Chip size="sm" variant="flat" color="primary" radius={themeRadius}>{surveys.length} active</Chip>
                        )}
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-3">
                    {surveys.length > 0 ? surveys.map((s, i) => {
                        let surveyHref = '#';
                        try { surveyHref = route('hrm.surveys.show', s.id); } catch {}

                        return (
                            <div key={s.id || i} className="flex items-center justify-between p-3 rounded-lg bg-content2">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{s.title || s.name}</p>
                                    {s.deadline && <p className="text-[10px] text-default-400">Due: {s.deadline}</p>}
                                </div>
                                <Link href={surveyHref}>
                                    <Button size="sm" color="primary" variant="flat" radius={themeRadius} endContent={<ArrowRightIcon className="w-3 h-3" />}>
                                        Take
                                    </Button>
                                </Link>
                            </div>
                        );
                    }) : (
                        <p className="text-sm text-default-400 text-center py-2">No active surveys</p>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default SurveysCard;
