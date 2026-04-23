import React from 'react';
import { Card, CardBody, CardHeader, Progress, Chip, Button } from '@heroui/react';
import { CreditCardIcon, ArrowUpIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import { router } from '@inertiajs/react';
import { hasRoute } from '@/utils/routing/routeUtils';

const planMeta = {
    free:         { color: 'default',   gradient: 'from-default-100 to-default-50',   badge: '🆓' },
    starter:      { color: 'primary',   gradient: 'from-primary-100 to-primary-50',   badge: '🚀' },
    professional: { color: 'secondary', gradient: 'from-secondary-100 to-secondary-50', badge: '⭐' },
    enterprise:   { color: 'success',   gradient: 'from-success-100 to-success-50',   badge: '💎' },
};

const SubscriptionCard = ({ info = {} }) => {
    const plan = info.plan || { name: 'Free', slug: 'free' };
    const daysRemaining = info.daysRemaining;
    const isOnTrial = info.isOnTrial;
    const quotaUsage = info.quotaUsage || {};
    const meta = planMeta[plan.slug] || planMeta.free;
    const expiryUrgent = daysRemaining !== null && daysRemaining < 7;
    const expiryWarning = daysRemaining !== null && daysRemaining < 30;

    const handleUpgrade = () => {
        if (hasRoute('billing.plans')) {
            router.visit(route('billing.plans'));
        }
    };

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-0" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                {/* Plan banner */}
                <div className={`w-full p-4 bg-gradient-to-r ${meta.gradient}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            <h3 className="font-semibold">Subscription</h3>
                        </div>
                        <Chip size="sm" color={meta.color} variant="solid" className="font-bold">
                            {meta.badge} {plan.name}
                        </Chip>
                    </div>

                    {/* Trial / expiry status */}
                    {isOnTrial && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-warning font-medium">
                            <ClockIcon className="w-4 h-4" />
                            Trial Period Active
                            {daysRemaining !== null && <span className="ml-auto font-bold">{Math.max(0, daysRemaining)} days left</span>}
                        </div>
                    )}
                    {!isOnTrial && daysRemaining !== null && (
                        <div className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${expiryUrgent ? 'text-danger' : expiryWarning ? 'text-warning' : 'text-success'}`}>
                            <ClockIcon className="w-4 h-4" />
                            {expiryUrgent ? '🚨 Expiring soon!' : expiryWarning ? '⚠️ Renew soon' : '✅ Active'}
                            <span className="ml-auto font-bold">{Math.max(0, daysRemaining)}d remaining</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardBody className="p-4 space-y-4">
                {/* Quota bars */}
                {Object.keys(quotaUsage).length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-default-500 uppercase">Resource Usage</p>
                        {Object.entries(quotaUsage).map(([key, quota]) => {
                            const used = quota.used ?? 0;
                            const limit = quota.limit;
                            const isUnlimited = limit === 'unlimited';
                            const percentage = isUnlimited ? 0 : (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0);
                            const barColor = percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'primary';
                            return (
                                <div key={key}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-xs font-bold">
                                            {used}{isUnlimited ? ' / ∞' : ` / ${limit}`}
                                        </span>
                                    </div>
                                    {!isUnlimited && (
                                        <Progress
                                            value={percentage}
                                            size="sm"
                                            color={barColor}
                                            aria-label={`${key} usage`}
                                            showValueLabel
                                            classNames={{ value: 'text-[10px]' }}
                                        />
                                    )}
                                    {isUnlimited && (
                                        <Chip size="sm" color="success" variant="flat">Unlimited</Chip>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <SparklesIcon className="w-8 h-8 text-default-300 mx-auto mb-1" />
                        <p className="text-xs text-default-400">No quota limits on your plan</p>
                    </div>
                )}

                <Button
                    size="md"
                    color="primary"
                    variant="shadow"
                    className="w-full font-semibold"
                    startContent={<ArrowUpIcon className="w-4 h-4" />}
                    onPress={handleUpgrade}
                >
                    Upgrade Plan
                </Button>
            </CardBody>
        </Card>
    );
};

export default SubscriptionCard;
