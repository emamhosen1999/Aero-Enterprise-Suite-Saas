import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Card, 
    CardBody, 
    CardHeader,
    Button,
    Chip,
    Switch,
    Divider
} from '@heroui/react';
import {
    CheckIcon,
    XMarkIcon,
    SparklesIcon,
    ArrowRightIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import App from '@/Layouts/App';
import { showToast } from '@/utils/toastUtils';

/**
 * Plan Comparison & Upgrade Page
 * 
 * Interactive pricing table with plan comparison and upgrade functionality.
 */
export default function SubscriptionPlans({ plans = [], currentPlan, billingCycle: initialCycle = 'monthly' }) {
    const [billingCycle, setBillingCycle] = useState(initialCycle);
    const [loading, setLoading] = useState(null);

    // Handle plan selection
    const handleSelectPlan = (plan) => {
        if (plan.id === currentPlan?.id) {
            showToast('info', 'This is your current plan');
            return;
        }

        setLoading(plan.id);
        
        router.post(`/subscription/change-plan`, {
            plan_id: plan.id,
            billing_cycle: billingCycle
        }, {
            onSuccess: () => {
                showToast('success', 'Plan updated successfully');
            },
            onError: (errors) => {
                showToast('error', errors.message || 'Failed to update plan');
            },
            onFinish: () => setLoading(null)
        });
    };

    // Get plan price based on billing cycle
    const getPlanPrice = (plan) => {
        if (billingCycle === 'yearly' && plan.yearly_price) {
            return plan.yearly_price;
        }
        return plan.monthly_price || plan.price || 0;
    };

    // Calculate yearly savings
    const getYearlySavings = (plan) => {
        if (!plan.yearly_price || !plan.monthly_price) return 0;
        const monthlyCost = plan.monthly_price * 12;
        return monthlyCost - plan.yearly_price;
    };

    // Check if feature is included
    const hasFeature = (plan, feature) => {
        if (typeof feature === 'string') {
            return plan.features?.includes(feature);
        }
        return feature.plans?.includes(plan.id);
    };

    return (
        <App>
            <Head title="Compare Plans" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-default-500 max-w-2xl mx-auto">
                        Scale your business with the right plan. Upgrade or downgrade anytime.
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-default-500'}`}>
                            Monthly
                        </span>
                        <Switch 
                            isSelected={billingCycle === 'yearly'}
                            onValueChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                            size="lg"
                        />
                        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-foreground' : 'text-default-500'}`}>
                            Yearly
                        </span>
                        {billingCycle === 'yearly' && (
                            <Chip color="success" size="sm" variant="flat">
                                Save up to 20%
                            </Chip>
                        )}
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {plans.map((plan, index) => {
                        const isCurrentPlan = plan.id === currentPlan?.id;
                        const isPopular = plan.is_popular;
                        const price = getPlanPrice(plan);
                        const savings = getYearlySavings(plan);

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card 
                                    className={`relative ${isPopular ? 'border-2 border-primary shadow-2xl scale-105' : ''} ${isCurrentPlan ? 'border-2 border-success' : ''}`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <Chip 
                                                color="primary" 
                                                variant="shadow"
                                                startContent={<SparklesIcon className="w-4 h-4" />}
                                            >
                                                Most Popular
                                            </Chip>
                                        </div>
                                    )}

                                    {isCurrentPlan && (
                                        <div className="absolute -top-4 right-4">
                                            <Chip color="success" variant="shadow">
                                                Current Plan
                                            </Chip>
                                        </div>
                                    )}

                                    <CardHeader className="flex-col items-start pt-8">
                                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                        <p className="text-default-500 text-sm mb-4">{plan.description}</p>
                                        
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-4xl font-bold">${price}</span>
                                            <span className="text-default-500">
                                                / {billingCycle === 'yearly' ? 'year' : 'month'}
                                            </span>
                                        </div>

                                        {billingCycle === 'yearly' && savings > 0 && (
                                            <p className="text-success text-sm">
                                                Save ${savings.toFixed(2)}/year
                                            </p>
                                        )}
                                    </CardHeader>

                                    <CardBody className="pt-0">
                                        <Button
                                            color={isCurrentPlan ? 'success' : (isPopular ? 'primary' : 'default')}
                                            variant={isCurrentPlan ? 'flat' : 'solid'}
                                            className="w-full mb-6"
                                            size="lg"
                                            onPress={() => handleSelectPlan(plan)}
                                            isLoading={loading === plan.id}
                                            isDisabled={isCurrentPlan}
                                            endContent={!isCurrentPlan && <ArrowRightIcon className="w-4 h-4" />}
                                        >
                                            {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                                        </Button>

                                        <Divider className="mb-6" />

                                        {/* Features List */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-semibold mb-3">What's included:</p>
                                            {plan.features?.map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                    <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm">{feature}</span>
                                                </div>
                                            ))}

                                            {/* Limits */}
                                            {plan.max_users && (
                                                <div className="flex items-start gap-2">
                                                    <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm">
                                                        {plan.max_users === -1 ? 'Unlimited' : plan.max_users} users
                                                    </span>
                                                </div>
                                            )}

                                            {plan.max_storage_gb && (
                                                <div className="flex items-start gap-2">
                                                    <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm">
                                                        {plan.max_storage_gb} GB storage
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Feature Comparison Table */}
                <Card>
                    <CardHeader>
                        <h2 className="text-2xl font-bold">Compare Plan Features</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-divider">
                                        <th className="text-left py-4 px-4 font-semibold">Feature</th>
                                        {plans.map(plan => (
                                            <th key={plan.id} className="text-center py-4 px-4 font-semibold">
                                                {plan.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Users */}
                                    <tr className="border-b border-divider">
                                        <td className="py-4 px-4">Active Users</td>
                                        {plans.map(plan => (
                                            <td key={plan.id} className="text-center py-4 px-4">
                                                {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Storage */}
                                    <tr className="border-b border-divider">
                                        <td className="py-4 px-4">Storage</td>
                                        {plans.map(plan => (
                                            <td key={plan.id} className="text-center py-4 px-4">
                                                {plan.max_storage_gb} GB
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Modules */}
                                    <tr className="border-b border-divider">
                                        <td className="py-4 px-4">Modules</td>
                                        {plans.map(plan => (
                                            <td key={plan.id} className="text-center py-4 px-4">
                                                {plan.features?.includes('All modules') ? 'All' : 'Limited'}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Support */}
                                    <tr className="border-b border-divider">
                                        <td className="py-4 px-4">Support</td>
                                        {plans.map(plan => (
                                            <td key={plan.id} className="text-center py-4 px-4">
                                                {plan.features?.includes('Priority support') ? 'Priority' : 
                                                 plan.features?.includes('Premium support') ? 'Premium' : 'Standard'}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* API Access */}
                                    <tr className="border-b border-divider">
                                        <td className="py-4 px-4">API Access</td>
                                        {plans.map(plan => (
                                            <td key={plan.id} className="text-center py-4 px-4">
                                                {plan.features?.includes('API access') ? (
                                                    <CheckIcon className="w-5 h-5 text-success mx-auto" />
                                                ) : (
                                                    <XMarkIcon className="w-5 h-5 text-danger mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Custom Branding */}
                                    <tr>
                                        <td className="py-4 px-4">Custom Branding</td>
                                        {plans.map(plan => (
                                            <td key={plan.id} className="text-center py-4 px-4">
                                                {plan.features?.includes('Custom branding') ? (
                                                    <CheckIcon className="w-5 h-5 text-success mx-auto" />
                                                ) : (
                                                    <XMarkIcon className="w-5 h-5 text-danger mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>

                {/* Enterprise CTA */}
                <Card className="mt-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
                    <CardBody className="text-center py-12">
                        <RocketLaunchIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Need a Custom Enterprise Solution?</h3>
                        <p className="text-default-500 mb-6 max-w-2xl mx-auto">
                            Get dedicated support, custom integrations, and tailored products for your organization.
                        </p>
                        <Button 
                            color="primary" 
                            size="lg"
                            onPress={() => router.visit('/contact')}
                        >
                            Contact Sales
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </App>
    );
}
