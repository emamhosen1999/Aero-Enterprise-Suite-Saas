import React from 'react';
import { Link } from '@inertiajs/react';
import { Button, Chip, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { ReceiptPercentIcon, PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const fmt = (v) => {
    const n = Number(v);
    return isNaN(n) ? '--' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
            </div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </ThemedCardBody>
    </ThemedCard>
);

const STATUS_COLOR = { pending: 'warning', approved: 'success', rejected: 'danger', paid: 'primary' };

const ExpensesCard = ({ expenseData }) => {
    const themeRadius = useThemeRadius();
    if (expenseData === undefined) return <LoadingSkeleton />;

    const { expenseSummary, recentExpenses } = expenseData || {};
    const summary = expenseSummary || {};
    const recent = (recentExpenses || []).slice(0, 5);

    let viewHref = '#';
    try { viewHref = route('hrm.expenses.index'); } catch {}
    let submitHref = '#';
    try { submitHref = route('hrm.expenses.create'); } catch {}

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <ReceiptPercentIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Expenses</h3>
                        </div>
                        <Link href={viewHref} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-5">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Pending', value: summary.pending_count ?? 0, sub: fmt(summary.pending_amount), color: 'bg-warning/10', textColor: 'text-warning' },
                            { label: 'Approved', value: summary.approved_count ?? 0, sub: fmt(summary.approved_amount), color: 'bg-success/10', textColor: 'text-success' },
                            { label: 'YTD', value: '', sub: fmt(summary.ytd_total), color: 'bg-primary/10', textColor: 'text-primary' },
                        ].map(({ label, value, sub, color, textColor }) => (
                            <div key={label} className={`flex flex-col items-center p-2 rounded-lg ${color}`}>
                                <span className="text-[10px] text-default-500">{label}</span>
                                {value !== '' && <span className={`text-base font-bold ${textColor}`}>{value}</span>}
                                <span className={`text-xs font-semibold ${textColor}`}>{sub}</span>
                            </div>
                        ))}
                    </div>

                    {/* Recent Expenses */}
                    {recent.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Recent</p>
                            {recent.map((e, i) => (
                                <div key={e.id || i} className="flex items-center justify-between p-2 rounded-lg bg-default-50 dark:bg-default-50/10">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">{e.title || e.description || 'Expense'}</p>
                                        <p className="text-[10px] text-default-400">{e.date || e.created_at}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs font-semibold text-foreground">{fmt(e.amount)}</span>
                                        <Chip size="sm" variant="flat" color={STATUS_COLOR[e.status] || 'default'} radius={themeRadius}>{e.status || 'N/A'}</Chip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Submit Expense */}
                    <Link href={submitHref} className="block">
                        <Button color="primary" variant="flat" size="sm" radius={themeRadius} className="w-full" startContent={<PlusIcon className="w-4 h-4" />}>
                            Submit Expense
                        </Button>
                    </Link>
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default ExpensesCard;
