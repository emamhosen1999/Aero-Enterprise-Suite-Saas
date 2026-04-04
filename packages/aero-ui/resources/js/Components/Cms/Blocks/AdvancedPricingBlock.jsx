import React from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Divider } from '@heroui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

const AdvancedPricingBlock = ({ data = {} }) => {
    const plans = data.plans || [];

    if (!plans || plans.length === 0) {
        return (
            <div className="text-center text-default-500 py-8">
                <p>No pricing plans to display</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {data.title && (
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground">{data.title}</h2>
                    {data.description && (
                        <p className="text-default-600 mt-2 max-w-2xl mx-auto">
                            {data.description}
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                    <div
                        key={index}
                        className="flex flex-col"
                    >
                        <Card
                            className={`flex-1 transition-all duration-300 ${
                                plan.highlighted
                                    ? 'ring-2 ring-primary shadow-lg scale-105 md:scale-110'
                                    : 'hover:shadow-lg'
                            }`}
                            style={{
                                background: plan.highlighted
                                    ? `color-mix(in srgb, var(--theme-primary, #0070F0) 10%, var(--theme-content1, #FAFAFA))`
                                    : `var(--theme-content1, #FAFAFA)`,
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                borderWidth: `var(--borderWidth, 2px)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                            }}
                        >
                            <CardHeader className="flex-col items-start px-6 py-4 border-b border-divider">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-foreground">
                                            {plan.name}
                                        </h3>
                                        {plan.highlighted && (
                                            <Chip
                                                color="primary"
                                                variant="flat"
                                                size="sm"
                                                label="Popular"
                                            />
                                        )}
                                    </div>
                                    {plan.description && (
                                        <p className="text-sm text-default-500">
                                            {plan.description}
                                        </p>
                                    )}
                                </div>
                            </CardHeader>

                            <CardBody className="px-6 py-6 space-y-6">
                                {/* Pricing */}
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground">
                                            {plan.currency === 'USD' ? '$' : '€'}
                                            {plan.price}
                                        </span>
                                        {plan.billing_period && (
                                            <span className="text-default-600">
                                                {plan.billing_period}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Features List */}
                                {plan.features && plan.features.length > 0 && (
                                    <div className="space-y-3">
                                        {plan.features.map((feature, featureIndex) => {
                                            const isIncluded = feature.included !== false;
                                            return (
                                                <div
                                                    key={featureIndex}
                                                    className="flex items-start gap-3"
                                                >
                                                    {isIncluded ? (
                                                        <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <XMarkIcon className="w-5 h-5 text-default-300 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <span
                                                        className={`text-sm ${
                                                            isIncluded
                                                                ? 'text-foreground'
                                                                : 'text-default-400 opacity-60'
                                                        }`}
                                                    >
                                                        {typeof feature === 'string'
                                                            ? feature
                                                            : feature.name || feature.label || feature}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* CTA Button */}
                                {plan.cta_text && (
                                    <div className="pt-4">
                                        <Button
                                            as="a"
                                            href={plan.cta_link || '#'}
                                            color={plan.highlighted ? 'primary' : 'default'}
                                            variant={plan.highlighted ? 'shadow' : 'bordered'}
                                            fullWidth
                                            className={plan.highlighted ? 'font-semibold' : ''}
                                        >
                                            {plan.cta_text}
                                        </Button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdvancedPricingBlock;
