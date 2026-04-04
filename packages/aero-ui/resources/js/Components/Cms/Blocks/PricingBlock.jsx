import React from 'react';
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';
import { CheckIcon } from '@heroicons/react/24/solid';

const PricingBlock = ({ data = {} }) => {
    const {
        title = 'Pricing',
        description = '',
        currency = 'USD',
        plans = []
    } = data;

    const planList = typeof plans === 'string' ? JSON.parse(plans || '[]') : (plans || []);

    return (
        <div className="text-center">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {description && <p className="text-lg text-default-600 mb-8 max-w-2xl mx-auto">{description}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {planList.map((plan, idx) => (
                    <Card key={idx} className={`border-2 relative ${plan.featured ? 'border-primary' : 'border-divider'}`}>
                        {plan.featured && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <Chip color="primary" size="lg">POPULAR</Chip>
                            </div>
                        )}
                        <CardHeader className="flex flex-col items-start px-6 py-4 border-b border-divider">
                            <p className="text-lg font-semibold">{plan.name}</p>
                            {plan.description && <p className="text-sm text-default-500">{plan.description}</p>}
                        </CardHeader>
                        <CardBody className="gap-4 p-6">
                            <div className="text-4xl font-bold">
                                {currency}{plan.price}
                                {plan.period && <span className="text-lg text-default-500">/{plan.period}</span>}
                            </div>
                            <div className="space-y-2">
                                {(plan.features || []).map((feature, fidx) => (
                                    <div key={fidx} className="flex items-center gap-2">
                                        <CheckIcon className="w-5 h-5 text-success" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                            <Button color={plan.featured ? 'primary' : 'default'} className="mt-4">
                                {plan.cta || 'Get Started'}
                            </Button>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PricingBlock;
