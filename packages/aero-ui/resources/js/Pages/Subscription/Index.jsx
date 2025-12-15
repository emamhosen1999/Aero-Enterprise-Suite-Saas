import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Card, 
    CardBody, 
    CardHeader,
    Button,
    Chip,
    Progress,
    Divider,
    Avatar,
    Tooltip
} from '@heroui/react';
import {
    CreditCardIcon,
    ArrowUpCircleIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    BanknotesIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import App from '@/Layouts/App';
import { showToast } from '@/utils/toastUtils';

/**
 * Tenant Subscription Dashboard
 * 
 * Shows current subscription status, plan details, usage, and billing info.
 */
export default function SubscriptionIndex({ 
    subscription,
    plan,
    usage,
    nextInvoice,
    paymentMethod,
    invoices = []
}) {
    const [loading, setLoading] = useState(false);

    // Status badge color mapping
    const statusColors = {
        active: 'success',
        trialing: 'warning',
        past_due: 'danger',
        cancelled: 'default',
        expired: 'danger'
    };

    // Handle plan upgrade
    const handleUpgrade = () => {
        router.visit('/subscription/plans');
    };

    // Handle cancel subscription
    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
            setLoading(true);
            router.post('/subscription/cancel', {}, {
                onSuccess: () => {
                    showToast('success', 'Subscription cancelled', 'Your subscription will remain active until the end of the billing period.');
                },
                onError: () => {
                    showToast('error', 'Failed to cancel subscription');
                },
                onFinish: () => setLoading(false)
            });
        }
    };

    // Handle resume subscription
    const handleResume = () => {
        setLoading(true);
        router.post('/subscription/resume', {}, {
            onSuccess: () => {
                showToast('success', 'Subscription resumed');
            },
            onError: () => {
                showToast('error', 'Failed to resume subscription');
            },
            onFinish: () => setLoading(false)
        });
    };

    return (
        <App>
            <Head title="Subscription & Billing" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Subscription & Billing
                    </h1>
                    <p className="text-default-500">
                        Manage your subscription, view usage, and access billing information
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Current Plan Card */}
                        <Card>
                            <CardHeader className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-semibold">Current Plan</h2>
                                    <p className="text-sm text-default-500 mt-1">
                                        Your active subscription details
                                    </p>
                                </div>
                                <Chip 
                                    color={statusColors[subscription?.status] || 'default'}
                                    variant="flat"
                                    size="lg"
                                >
                                    {subscription?.status?.toUpperCase()}
                                </Chip>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                            <CreditCardIcon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">{plan?.name || 'Free Plan'}</h3>
                                            <p className="text-default-500">{plan?.billing_cycle || 'monthly'} billing</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-primary">
                                            ${plan?.price || '0'}
                                        </p>
                                        <p className="text-sm text-default-500">per {plan?.billing_cycle || 'month'}</p>
                                    </div>
                                </div>

                                <Divider />

                                {/* Trial Info */}
                                {subscription?.status === 'trialing' && subscription?.trial_ends_at && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
                                    >
                                        <div className="flex items-start gap-3">
                                            <ClockIcon className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-warning-800 dark:text-warning-400">
                                                    Trial Period Active
                                                </p>
                                                <p className="text-sm text-warning-700 dark:text-warning-500 mt-1">
                                                    Your trial ends on {new Date(subscription.trial_ends_at).toLocaleDateString('en-US', { 
                                                        month: 'long', 
                                                        day: 'numeric', 
                                                        year: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Cancelled Info */}
                                {subscription?.status === 'cancelled' && subscription?.ends_at && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800"
                                    >
                                        <div className="flex items-start gap-3">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-danger-800 dark:text-danger-400">
                                                    Subscription Cancelled
                                                </p>
                                                <p className="text-sm text-danger-700 dark:text-danger-500 mt-1">
                                                    Your subscription will remain active until {new Date(subscription.ends_at).toLocaleDateString('en-US', { 
                                                        month: 'long', 
                                                        day: 'numeric', 
                                                        year: 'numeric' 
                                                    })}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    className="mt-2"
                                                    onPress={handleResume}
                                                    isLoading={loading}
                                                >
                                                    Resume Subscription
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Plan Features */}
                                <div>
                                    <h4 className="font-semibold mb-3">Plan Features</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {plan?.features?.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <CheckCircleIcon className="w-4 h-4 text-success" />
                                                <span className="text-sm">{feature}</span>
                                            </div>
                                        )) || (
                                            <p className="text-sm text-default-500 col-span-2">No features listed</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        color="primary"
                                        startContent={<ArrowUpCircleIcon className="w-4 h-4" />}
                                        onPress={handleUpgrade}
                                    >
                                        Upgrade Plan
                                    </Button>
                                    {subscription?.status === 'active' && (
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            onPress={handleCancel}
                                            isLoading={loading}
                                        >
                                            Cancel Subscription
                                        </Button>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Usage Overview */}
                        <Card>
                            <CardHeader>
                                <div>
                                    <h2 className="text-xl font-semibold">Usage Overview</h2>
                                    <p className="text-sm text-default-500 mt-1">
                                        Current usage against your plan limits
                                    </p>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <Link href="/subscription/usage">
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        size="sm"
                                        startContent={<ChartBarIcon className="w-4 h-4" />}
                                    >
                                        View Detailed Usage
                                    </Button>
                                </Link>

                                {/* Users */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium">Active Users</span>
                                        <span className="text-sm text-default-500">
                                            {usage?.users || 0} / {plan?.max_users === -1 ? 'Unlimited' : plan?.max_users || 0}
                                        </span>
                                    </div>
                                    <Progress 
                                        value={plan?.max_users === -1 ? 0 : ((usage?.users || 0) / (plan?.max_users || 1)) * 100}
                                        color={((usage?.users || 0) / (plan?.max_users || 1)) > 0.8 ? 'danger' : 'primary'}
                                        className="max-w-full"
                                    />
                                </div>

                                {/* Storage */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium">Storage Used</span>
                                        <span className="text-sm text-default-500">
                                            {((usage?.storage_bytes || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB / {plan?.max_storage_gb || 0} GB
                                        </span>
                                    </div>
                                    <Progress 
                                        value={((usage?.storage_bytes || 0) / ((plan?.max_storage_gb || 1) * 1024 * 1024 * 1024)) * 100}
                                        color={((usage?.storage_bytes || 0) / ((plan?.max_storage_gb || 1) * 1024 * 1024 * 1024)) > 0.8 ? 'danger' : 'primary'}
                                        className="max-w-full"
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* Recent Invoices */}
                        <Card>
                            <CardHeader className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-semibold">Recent Invoices</h2>
                                    <p className="text-sm text-default-500 mt-1">
                                        View your billing history
                                    </p>
                                </div>
                                <Link href="/subscription/invoices">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        startContent={<DocumentTextIcon className="w-4 h-4" />}
                                    >
                                        View All
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardBody>
                                {invoices.length > 0 ? (
                                    <div className="space-y-3">
                                        {invoices.slice(0, 5).map((invoice) => (
                                            <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-default-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <DocumentTextIcon className="w-5 h-5 text-default-500" />
                                                    <div>
                                                        <p className="font-medium">
                                                            Invoice #{invoice.number}
                                                        </p>
                                                        <p className="text-sm text-default-500">
                                                            {new Date(invoice.date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">${invoice.amount}</span>
                                                    <Chip 
                                                        size="sm"
                                                        color={invoice.status === 'paid' ? 'success' : 'warning'}
                                                        variant="flat"
                                                    >
                                                        {invoice.status}
                                                    </Chip>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-default-500 py-8">
                                        No invoices yet
                                    </p>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Next Payment */}
                        {nextInvoice && subscription?.status === 'active' && (
                            <Card>
                                <CardHeader>
                                    <h3 className="font-semibold">Next Payment</h3>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
                                        <p className="text-sm text-default-500 mb-1">Amount Due</p>
                                        <p className="text-3xl font-bold text-primary">
                                            ${nextInvoice.amount}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CalendarIcon className="w-4 h-4 text-default-500" />
                                        <span className="text-default-500">
                                            Due on {new Date(nextInvoice.date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold">Payment Method</h3>
                            </CardHeader>
                            <CardBody className="space-y-3">
                                {paymentMethod ? (
                                    <>
                                        <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                                            <CreditCardIcon className="w-8 h-8 text-default-500" />
                                            <div>
                                                <p className="font-medium">
                                                    •••• {paymentMethod.last4}
                                                </p>
                                                <p className="text-sm text-default-500">
                                                    Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            className="w-full"
                                            onPress={() => router.visit('/subscription/payment-method')}
                                        >
                                            Update Payment Method
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-default-500 text-center py-4">
                                            No payment method on file
                                        </p>
                                        <Button
                                            size="sm"
                                            color="primary"
                                            className="w-full"
                                            onPress={() => router.visit('/subscription/payment-method')}
                                        >
                                            Add Payment Method
                                        </Button>
                                    </>
                                )}
                            </CardBody>
                        </Card>

                        {/* Quick Links */}
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold">Quick Links</h3>
                            </CardHeader>
                            <CardBody className="space-y-2">
                                <Link href="/subscription/plans">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="w-full justify-start"
                                        startContent={<ArrowUpCircleIcon className="w-4 h-4" />}
                                    >
                                        Compare Plans
                                    </Button>
                                </Link>
                                <Link href="/subscription/usage">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="w-full justify-start"
                                        startContent={<ChartBarIcon className="w-4 h-4" />}
                                    >
                                        Usage Details
                                    </Button>
                                </Link>
                                <Link href="/subscription/invoices">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="w-full justify-start"
                                        startContent={<DocumentTextIcon className="w-4 h-4" />}
                                    >
                                        All Invoices
                                    </Button>
                                </Link>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </App>
    );
}
