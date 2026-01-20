import React from 'react';
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';
import { CheckIcon } from '@heroicons/react/24/outline';

const PricingCards = ({ content = {}, settings = {} }) => {
  const {
    title = 'Simple, Transparent Pricing',
    subtitle = 'Choose the plan that works for you',
    plans = [],
    currency = '$',
    billingPeriod = '/month',
    highlightPlan = 0,
  } = content;

  const {
    bgColor = '#ffffff',
    textColor = '#000000',
    padding = 'lg',
    textAlign = 'center',
  } = settings;

  const paddingMap = {
    none: 'p-0',
    sm: 'p-4 md:p-6',
    md: 'p-6 md:p-8 lg:p-12',
    lg: 'p-8 md:p-12 lg:p-16',
    xl: 'p-12 md:p-16 lg:p-20',
  };

  return (
    <div
      className={`w-full ${paddingMap[padding]}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container mx-auto">
        {/* Header */}
        {title || subtitle ? (
          <div className="mb-12 text-center">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        ) : null}

        {/* Pricing Cards Grid */}
        {plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const isHighlighted = index === highlightPlan;

              return (
                <Card
                  key={index}
                  className={`relative transition-all duration-300 ${
                    isHighlighted
                      ? 'ring-2 ring-primary shadow-xl scale-105 md:scale-110 md:z-10'
                      : 'shadow-md hover:shadow-lg'
                  } border border-slate-200 dark:border-white/10`}
                >
                  {isHighlighted && (
                    <Chip
                      color="primary"
                      variant="flat"
                      className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                    >
                      Most Popular
                    </Chip>
                  )}

                  <CardHeader className="flex flex-col items-start gap-3 p-6">
                    {plan.name && (
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                    )}
                    {plan.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {plan.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-4xl font-bold">
                        {currency}
                        {plan.price}
                      </span>
                      {plan.price_suffix && (
                        <span className="text-slate-600 dark:text-slate-400">
                          {plan.price_suffix}
                        </span>
                      )}
                    </div>
                    {billingPeriod && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {billingPeriod}
                      </p>
                    )}
                  </CardHeader>

                  <CardBody className="p-6 gap-6 flex-grow">
                    {/* Call-to-Action Button */}
                    {plan.button_text && (
                      <Button
                        color={isHighlighted ? 'primary' : 'default'}
                        variant={isHighlighted ? 'solid' : 'bordered'}
                        className="w-full"
                        as="a"
                        href={plan.button_url || '#'}
                      >
                        {plan.button_text}
                      </Button>
                    )}

                    {/* Features List */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-3 flex-grow">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start gap-3">
                            <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer Note */}
                    {plan.footer_text && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-white/10">
                        {plan.footer_text}
                      </p>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No pricing plans added
          </div>
        )}

        {/* Footer Text */}
        {content.footer_text && (
          <div className="mt-12 text-center text-slate-600 dark:text-slate-400">
            <p className="max-w-2xl mx-auto">{content.footer_text}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingCards;
