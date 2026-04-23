import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Button, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { BanknotesIcon, ArrowRightIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import MiniChart from './MiniChart';

const fmt = (v) => {
    const n = Number(v);
    if (isNaN(n)) return '--';
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
            <Skeleton className="h-20 w-full rounded" />
            <Skeleton className="h-8 w-full rounded-lg" />
        </ThemedCardBody>
    </ThemedCard>
);

const PayrollCard = ({ payrollData }) => {
    const themeRadius = useThemeRadius();
    if (payrollData === undefined) return <LoadingSkeleton />;

    const { latestPayslip, payrollHistory } = payrollData || {};

    const chartData = useMemo(() => {
        if (!payrollHistory?.length) return [];
        return payrollHistory.slice(-6).map((p) => ({
            label: p.month || p.pay_period || '',
            value: Number(p.net_pay || p.net || 0),
        }));
    }, [payrollHistory]);

    let viewHref = '#';
    try { viewHref = route('hrm.payroll.index'); } catch {}

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <BanknotesIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Payroll</h3>
                        </div>
                        <Link href={viewHref} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-5">
                    {/* Latest Payslip Summary */}
                    {latestPayslip ? (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">
                                Latest — {latestPayslip.month || latestPayslip.pay_period || 'Current'}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Gross', value: latestPayslip.gross_pay || latestPayslip.gross, color: 'bg-primary/10', textColor: 'text-primary' },
                                    { label: 'Deductions', value: latestPayslip.total_deductions || latestPayslip.deductions, color: 'bg-danger/10', textColor: 'text-danger' },
                                    { label: 'Net', value: latestPayslip.net_pay || latestPayslip.net, color: 'bg-success/10', textColor: 'text-success' },
                                ].map(({ label, value, color, textColor }) => (
                                    <div key={label} className={`flex flex-col items-center p-2 rounded-lg ${color}`}>
                                        <span className="text-[10px] text-default-500">{label}</span>
                                        <span className={`text-sm font-bold ${textColor}`}>{fmt(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-default-400">No payslip data available</p>
                    )}

                    {/* Mini Bar Chart - Last 6 months */}
                    {chartData.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Net Pay Trend</p>
                            <MiniChart data={chartData} height={80} barColor="success" />
                        </div>
                    )}

                    {/* Download Payslip */}
                    {latestPayslip?.download_url && (
                        <Button
                            as="a"
                            href={latestPayslip.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="primary"
                            variant="flat"
                            size="sm"
                            radius={themeRadius}
                            className="w-full"
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                        >
                            Download Payslip
                        </Button>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default PayrollCard;
