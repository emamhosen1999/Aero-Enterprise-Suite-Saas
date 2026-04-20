import React from 'react';
import { Link } from '@inertiajs/react';
import { Button, Chip, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full"><Skeleton className="h-5 w-24 rounded" /></div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-4">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
        </ThemedCardBody>
    </ThemedCard>
);

const FeedbackCard = ({ feedbackData }) => {
    const themeRadius = useThemeRadius();
    if (feedbackData === undefined) return <LoadingSkeleton />;

    const { pendingFeedbackRequests, myFeedbackSummary } = feedbackData || {};
    const pendingCount = Array.isArray(pendingFeedbackRequests) ? pendingFeedbackRequests.length : (pendingFeedbackRequests ?? 0);
    const avgScore = myFeedbackSummary?.average_score ?? myFeedbackSummary?.avg_score;

    let feedbackHref = '#';
    try { feedbackHref = route('hrm.feedback.index'); } catch {}

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <ChatBubbleLeftRightIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Feedback</h3>
                        </div>
                        {pendingCount > 0 && (
                            <Chip size="sm" variant="solid" color="warning" radius={themeRadius}>{pendingCount} pending</Chip>
                        )}
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-4">
                    {/* Pending Feedback */}
                    {pendingCount > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                            <div>
                                <p className="text-sm font-medium text-foreground">{pendingCount} Feedback Request{pendingCount > 1 ? 's' : ''}</p>
                                <p className="text-[10px] text-default-500">Awaiting your response</p>
                            </div>
                            <Link href={feedbackHref}>
                                <Button size="sm" color="warning" variant="flat" radius={themeRadius} endContent={<ArrowRightIcon className="w-3 h-3" />}>
                                    Respond
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Average Score */}
                    {avgScore != null && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-content2">
                            <span className="text-xs text-default-500">Average Score</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--theme-primary)' }}>
                                {Number(avgScore).toFixed(1)}
                            </span>
                        </div>
                    )}

                    {pendingCount === 0 && avgScore == null && (
                        <p className="text-sm text-default-400 text-center py-2">No feedback data available</p>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default FeedbackCard;
