import React from 'react';
import { Link } from '@inertiajs/react';
import { Chip, Progress, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { AcademicCapIcon, ArrowRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
            </div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><div className="flex-1 space-y-1"><Skeleton className="h-3 w-32 rounded" /><Skeleton className="h-2 w-20 rounded" /></div></div>
            ))}
        </ThemedCardBody>
    </ThemedCard>
);

const certExpiryColor = (expiryDate) => {
    if (!expiryDate) return 'default';
    const diff = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'danger';
    if (diff < 30) return 'warning';
    return 'success';
};

const TrainingCard = ({ trainingData }) => {
    const themeRadius = useThemeRadius();
    if (trainingData === undefined) return <LoadingSkeleton />;

    const { myTrainings, upcomingTrainingSessions, certifications } = trainingData || {};
    const trainings = (myTrainings || []).slice(0, 4);
    const sessions = (upcomingTrainingSessions || []).slice(0, 3);
    const certs = (certifications || []).slice(0, 4);

    let viewHref = '#';
    try { viewHref = route('hrm.training.index'); } catch {}

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <AcademicCapIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Training</h3>
                        </div>
                        <Link href={viewHref} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-5">
                    {/* Active Enrollments */}
                    {trainings.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Active Enrollments</p>
                            {trainings.map((t, i) => (
                                <div key={t.id || i} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-default-600 dark:text-default-400 truncate max-w-[65%]">{t.name || t.training_name || t.title}</span>
                                        <span className="font-semibold text-foreground">{t.progress ?? 0}%</span>
                                    </div>
                                    <Progress size="sm" value={t.progress ?? 0} color="primary" aria-label={t.name || 'Training progress'} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upcoming Sessions */}
                    {sessions.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Upcoming Sessions</p>
                            {sessions.map((s, i) => (
                                <div key={s.id || i} className="flex items-center gap-2 p-2 rounded-lg bg-default-50 dark:bg-default-50/10">
                                    <CalendarDaysIcon className="w-4 h-4 text-primary shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">{s.name || s.title}</p>
                                        <p className="text-[10px] text-default-400">{s.date || s.scheduled_date}{s.time ? ` at ${s.time}` : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Certifications */}
                    {certs.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Certifications</p>
                            {certs.map((c, i) => (
                                <div key={c.id || i} className="flex items-center justify-between p-2 rounded-lg bg-default-50 dark:bg-default-50/10">
                                    <span className="text-xs text-foreground truncate max-w-[60%]">{c.name || c.title}</span>
                                    <Chip size="sm" variant="flat" color={certExpiryColor(c.expiry_date)} radius={themeRadius}>
                                        {c.expiry_date ? (certExpiryColor(c.expiry_date) === 'danger' ? 'Expired' : certExpiryColor(c.expiry_date) === 'warning' ? 'Expiring' : 'Valid') : 'No Expiry'}
                                    </Chip>
                                </div>
                            ))}
                        </div>
                    )}

                    {!trainings.length && !sessions.length && !certs.length && (
                        <p className="text-sm text-default-400 text-center py-2">No training data available</p>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default TrainingCard;
