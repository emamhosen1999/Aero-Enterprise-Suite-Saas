import React, { useEffect, useState, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
    Card, CardBody, CardHeader, Progress, Button, Chip, Skeleton, Tooltip, Divider,
} from '@heroui/react';
import {
    UsersIcon, ServerStackIcon, FolderIcon, DocumentTextIcon,
    ArrowUpRightIcon, ExclamationTriangleIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import axios from 'axios';
import { hasRoute } from '@/utils/routing/routeUtils';

const quotaConfig = {
    users:      { label: 'Users',      icon: UsersIcon,        unit: '' },
    storage:    { label: 'Storage',    icon: ServerStackIcon,  unit: 'GB' },
    projects:   { label: 'Projects',   icon: FolderIcon,       unit: '' },
    documents:  { label: 'Documents',  icon: DocumentTextIcon, unit: '' },
    employees:  { label: 'Employees',  icon: UsersIcon,        unit: '' },
};

const getColor = (pct) => {
    if (pct >= 90) return 'danger';
    if (pct >= 75) return 'warning';
    return 'primary';
};

const formatValue = (val, type) => {
    if (type === 'storage') return `${Number(val).toFixed(1)} GB`;
    return Number(val).toLocaleString();
};

/**
 * PlanOverviewWidget — shows plan name, quota progress bars, upgrade CTA.
 * Data from Inertia shared `planLimits` + async quota usage fetch.
 */
export default function PlanOverviewWidget() {
    const { planLimits, tenant, subscription_alert } = usePage().props;
    const themeRadius = useThemeRadius();

    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUsage = useCallback(async () => {
        try {
            if (hasRoute('tenant.quotas.index')) {
                const res = await axios.get(route('tenant.quotas.index'));
                setUsage(res.data.quotas || {});
            }
        } catch {
            // Quota API may not be available — degrade gracefully
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsage(); }, [fetchUsage]);

    const planName = planLimits?.plan_name || 'Free';
    const alert = subscription_alert;
    const onTrial = tenant?.onTrial;

    // Build quota items from planLimits
    const quotaItems = [];
    if (planLimits) {
        if (planLimits.max_users)     quotaItems.push({ type: 'users',     limit: planLimits.max_users });
        if (planLimits.max_storage_gb) quotaItems.push({ type: 'storage',  limit: planLimits.max_storage_gb });
        if (planLimits.max_projects)  quotaItems.push({ type: 'projects',  limit: planLimits.max_projects });
        if (planLimits.max_documents) quotaItems.push({ type: 'documents', limit: planLimits.max_documents });
    }

    return (
        <Card
            className="aero-card"
            radius={themeRadius}
        >
            <CardHeader className="flex items-center justify-between border-b border-divider px-5 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-xl"
                        style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}
                    >
                        <SparklesIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold">Plan Overview</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Chip size="sm" color="primary" variant="flat">{planName}</Chip>
                            {onTrial && <Chip size="sm" color="warning" variant="flat">Trial</Chip>}
                            {alert?.severity === 'expired' && <Chip size="sm" color="danger" variant="flat">Expired</Chip>}
                        </div>
                    </div>
                </div>
                {hasRoute('billing.plans') && (
                    <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        endContent={<ArrowUpRightIcon className="w-3.5 h-3.5" />}
                        onPress={() => router.visit(route('billing.plans'))}
                        radius={themeRadius}
                    >
                        Upgrade
                    </Button>
                )}
            </CardHeader>

            <CardBody className="px-5 py-4 space-y-4">
                {/* Subscription Alert Banner */}
                {alert && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm
                        ${alert.type === 'danger' ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400'
                        : 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400'}`}
                    >
                        <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                        <span>{alert.message}</span>
                    </div>
                )}

                {/* Quota Progress Bars */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-32 rounded" />
                                <Skeleton className="h-3 w-full rounded" />
                            </div>
                        ))}
                    </div>
                ) : quotaItems.length > 0 ? (
                    <div className="space-y-4">
                        {quotaItems.map(({ type, limit }) => {
                            const cfg = quotaConfig[type] || quotaConfig.users;
                            const Icon = cfg.icon;
                            const current = usage?.[type]?.current ?? 0;
                            const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;

                            return (
                                <div key={type} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-default-500" />
                                            <span className="font-medium">{cfg.label}</span>
                                        </div>
                                        <span className="text-default-500">
                                            {formatValue(current, type)} / {formatValue(limit, type)}
                                            {cfg.unit && ` ${cfg.unit}`}
                                        </span>
                                    </div>
                                    <Tooltip content={`${pct}% used`}>
                                        <Progress
                                            value={pct}
                                            color={getColor(pct)}
                                            size="sm"
                                            radius={themeRadius}
                                            aria-label={`${cfg.label} usage`}
                                        />
                                    </Tooltip>
                                    {pct >= 90 && (
                                        <p className="text-xs text-danger flex items-center gap-1">
                                            <ExclamationTriangleIcon className="w-3 h-3" />
                                            {pct >= 100 ? 'Limit reached' : 'Approaching limit'}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-default-400 text-center py-4">
                        No quota information available for your plan.
                    </p>
                )}

                {/* Feature Highlights */}
                {planLimits?.features && (
                    <>
                        <Divider />
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(planLimits.features)
                                .filter(([, v]) => v === true)
                                .slice(0, 5)
                                .map(([key]) => (
                                    <Chip key={key} size="sm" variant="bordered" className="capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </Chip>
                                ))}
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
