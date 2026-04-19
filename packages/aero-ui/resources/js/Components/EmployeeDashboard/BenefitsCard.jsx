import React from 'react';
import { Chip, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const LoadingSkeleton = () => (
    <ThemedCard>
        <ThemedCardHeader>
            <div className="p-4 w-full"><Skeleton className="h-5 w-24 rounded" /></div>
        </ThemedCardHeader>
        <ThemedCardBody className="p-4 sm:p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </ThemedCardBody>
    </ThemedCard>
);

const STATUS_COLOR = { active: 'success', enrolled: 'success', pending: 'warning', expired: 'danger', inactive: 'default' };

const BenefitsCard = ({ benefitData }) => {
    const themeRadius = useThemeRadius();
    if (benefitData === undefined) return <LoadingSkeleton />;

    const benefits = (benefitData?.myBenefits || []).slice(0, 6);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ThemedCard className="h-full">
                <ThemedCardHeader>
                    <div className="p-4 sm:p-5 w-full">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', borderRadius: 'var(--borderRadius, 8px)' }}>
                                <ShieldCheckIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Benefits</h3>
                        </div>
                    </div>
                </ThemedCardHeader>

                <ThemedCardBody className="p-4 sm:p-5 space-y-3">
                    {benefits.length > 0 ? benefits.map((b, i) => (
                        <div key={b.id || i} className="flex items-center justify-between p-2 rounded-lg bg-default-50 dark:bg-default-50/10">
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{b.name || b.plan_name || b.title}</p>
                                {b.provider && <p className="text-[10px] text-default-400">{b.provider}</p>}
                            </div>
                            <Chip size="sm" variant="flat" color={STATUS_COLOR[b.status] || 'default'} radius={themeRadius}>
                                {b.status || 'Active'}
                            </Chip>
                        </div>
                    )) : (
                        <p className="text-sm text-default-400 text-center py-2">No benefits enrolled</p>
                    )}
                </ThemedCardBody>
            </ThemedCard>
        </motion.div>
    );
};

export default BenefitsCard;
