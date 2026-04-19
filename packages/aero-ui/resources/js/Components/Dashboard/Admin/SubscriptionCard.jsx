import React from 'react';
import { Card, CardBody, CardHeader, Progress, Chip, Button } from '@heroui/react';
import { CreditCardIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const SubscriptionCard = ({ info = {} }) => {
    const plan = info.plan || { name: 'Free', slug: 'free' };
    const daysRemaining = info.daysRemaining;
    const isOnTrial = info.isOnTrial;
    const quotaUsage = info.quotaUsage || {};

    const planColorMap = {
        free: 'default',
        starter: 'primary',
        professional: 'secondary',
        enterprise: 'success',
    };

    const statusColor = daysRemaining !== null && daysRemaining < 7 ? 'danger' : 'success';

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <CreditCardIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        <h3 className="font-semibold">Subscription</h3>
                    </div>
                    <Chip size="sm" color={planColorMap[plan.slug] || 'default'} variant="flat">
                        {plan.name}
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
                {isOnTrial && (
                    <Chip size="sm" color="warning" variant="flat" className="w-full justify-center">
                        Trial Period
                    </Chip>
                )}

                {daysRemaining !== null && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-default-500">Days remaining</span>
                        <Chip size="sm" color={statusColor} variant="flat">{Math.max(0, daysRemaining)} days</Chip>
                    </div>
                )}

                {/* Quota bars */}
                {Object.entries(quotaUsage).map(([key, quota]) => {
                    const used = quota.used ?? 0;
                    const limit = quota.limit;
                    const isUnlimited = limit === 'unlimited';
                    const percentage = isUnlimited ? 0 : (limit > 0 ? Math.round((used / limit) * 100) : 0);

                    return (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-default-500 capitalize">{key}</span>
                                <span className="text-xs font-medium">
                                    {used}{isUnlimited ? '' : ` / ${limit}`}
                                </span>
                            </div>
                            {!isUnlimited && (
                                <Progress
                                    value={percentage}
                                    size="sm"
                                    color={percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'primary'}
                                    aria-label={`${key} usage`}
                                />
                            )}
                        </div>
                    );
                })}

                <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="w-full"
                    startContent={<ArrowUpIcon className="w-4 h-4" />}
                >
                    Upgrade Plan
                </Button>
            </CardBody>
        </Card>
    );
};

export default SubscriptionCard;
