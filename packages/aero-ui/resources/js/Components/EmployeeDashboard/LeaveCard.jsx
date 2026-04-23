import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Button, Chip, Progress, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import {
    CalendarDaysIcon,
    PlusIcon,
    ArrowRightIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

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
                <div key={i} className="space-y-1.5">
                    <div className="flex justify-between"><Skeleton className="h-3 w-20 rounded" /><Skeleton className="h-3 w-10 rounded" /></div>
                    <Skeleton className="h-2 w-full rounded" />
                </div>
            ))}
            <Skeleton className="h-8 w-full rounded-lg" />
        </ThemedCardBody>
    </ThemedCard>
);

const STATUS_COLOR = { pending: 'warning', approved: 'success', rejected: 'danger' };

const LeaveCard = ({ leaveBalances, pendingLeaves, upcomingApprovedLeaves }) => {
    const themeRadius = useThemeRadius();
    const isLoading = leaveBalances === undefined && pendingLeaves === undefined;

    if (isLoading) return <LoadingSkeleton />;

    const balances = leaveBalances || [];
    const pending = (pendingLeaves || []).slice(0, 5);
    const upcoming = (upcomingApprovedLeaves || []).slice(0, 3);

    let viewAllHref = '#';
    try { viewAllHref = route('hrm.leaves.index'); } catch {}
    let applyHref = '#';
    try { applyHref = route('hrm.leaves.create'); } catch {}

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <CalendarDaysIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Leave</h3>
                        </div>
                        <Link href={viewAllHref} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-5">
                    {/* Leave Balances */}
                    {balances.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Balances</p>
                            {balances.map((b, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-default-600 dark:text-default-400">{b.leave_type || b.type || 'Leave'}</span>
                                        <span className="font-semibold text-foreground">{b.used ?? 0}/{b.total ?? b.allocated ?? 0}</span>
                                    </div>
                                    <Progress size="sm" value={b.total ? ((b.used ?? 0) / b.total) * 100 : 0} color={b.total && (b.used / b.total) > 0.8 ? 'danger' : 'primary'} aria-label={`${b.leave_type || 'Leave'} balance`} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pending Requests */}
                    {pending.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Pending Requests</p>
                            <div className="space-y-1.5">
                                {pending.map((l, i) => (
                                    <div key={l.id || i} className="flex items-center justify-between p-2 rounded-lg bg-content2">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-foreground truncate">{l.leave_type || l.type || 'Leave'}</p>
                                            <p className="text-[10px] text-default-400">{l.from_date} → {l.to_date}</p>
                                        </div>
                                        <Chip size="sm" variant="flat" color={STATUS_COLOR[l.status] || 'default'} radius={themeRadius}>{l.status || 'Pending'}</Chip>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Approved */}
                    {upcoming.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Upcoming Approved</p>
                            {upcoming.map((l, i) => (
                                <div key={l.id || i} className="flex items-center gap-2 text-xs">
                                    <ClockIcon className="w-3.5 h-3.5 text-success shrink-0" />
                                    <span className="text-default-600 dark:text-default-400 truncate">{l.leave_type || 'Leave'}: {l.from_date} → {l.to_date}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Apply Leave Button */}
                    <Link href={applyHref} className="block">
                        <Button color="primary" variant="flat" size="sm" radius={themeRadius} className="w-full" startContent={<PlusIcon className="w-4 h-4" />}>
                            Apply Leave
                        </Button>
                    </Link>
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default LeaveCard;
