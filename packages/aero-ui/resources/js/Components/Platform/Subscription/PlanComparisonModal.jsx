import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PlanComparisonModal({ isOpen, onClose, plans, currentPlan, onSelectPlan }) {
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'xl';
    };

    const themeRadius = getThemeRadius();

    const formatPrice = (price, currency = 'USD') => {
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', JPY: '¥' };
        return `${symbols[currency]}${price}`;
    };

    const getVolumeDiscount = (users) => {
        if (users >= 200) return 20;
        if (users >= 100) return 15;
        if (users >= 50) return 10;
        return 0;
    };

    const features = [
        { name: 'Users', key: 'users' },
        { name: 'Storage (GB)', key: 'storage' },
        { name: 'API Calls/month', key: 'api_calls' },
        { name: 'Employees', key: 'employees' },
        { name: 'Projects', key: 'projects' },
        { name: 'Support', key: 'support' },
        { name: 'Custom Branding', key: 'branding' },
        { name: 'Advanced Analytics', key: 'analytics' },
        { name: 'Priority Support', key: 'priority_support' },
    ];

    const planFeatures = {
        free: {
            users: '5', storage: '1', api_calls: '1,000', employees: '5', projects: '3',
            support: true, branding: false, analytics: false, priority_support: false
        },
        starter: {
            users: '25', storage: '10', api_calls: '10,000', employees: '25', projects: '10',
            support: true, branding: false, analytics: false, priority_support: false
        },
        professional: {
            users: '100', storage: '100', api_calls: '100,000', employees: '100', projects: 'Unlimited',
            support: true, branding: true, analytics: true, priority_support: false
        },
        enterprise: {
            users: 'Unlimited', storage: 'Unlimited', api_calls: 'Unlimited', employees: 'Unlimited', projects: 'Unlimited',
            support: true, branding: true, analytics: true, priority_support: true
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="5xl"
            scrollBehavior="inside"
            classNames={{
                base: "bg-content1",
                header: "border-b border-divider",
                body: "py-6",
                footer: "border-t border-divider"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Compare Plans</h2>
                    <p className="text-sm text-default-500 font-normal">Choose the plan that best fits your needs</p>
                </ModalHeader>
                <ModalBody>
                    <div className="overflow-x-auto">
                        <Table
                            aria-label="Plan comparison table"
                            classNames={{
                                wrapper: "shadow-none border border-divider rounded-lg",
                                th: "bg-default-100 text-default-600 font-semibold",
                                td: "py-4"
                            }}
                        >
                            <TableHeader>
                                <TableColumn>FEATURE</TableColumn>
                                <TableColumn>FREE</TableColumn>
                                <TableColumn>STARTER</TableColumn>
                                <TableColumn>PROFESSIONAL</TableColumn>
                                <TableColumn>ENTERPRISE</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {/* Pricing Row */}
                                <TableRow key="pricing">
                                    <TableCell className="font-semibold">Monthly Price</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold text-success">{formatPrice(0, selectedCurrency)}</span>
                                            <span className="text-xs text-default-500">Free forever</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold text-primary">{formatPrice(29, selectedCurrency)}</span>
                                            <span className="text-xs text-default-500">Per month</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold text-primary">{formatPrice(99, selectedCurrency)}</span>
                                            <span className="text-xs text-default-500">Per month</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold text-primary">Custom</span>
                                            <span className="text-xs text-default-500">Contact sales</span>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Feature Rows */}
                                {features.map((feature) => (
                                    <TableRow key={feature.key}>
                                        <TableCell className="font-medium">{feature.name}</TableCell>
                                        <TableCell>
                                            {typeof planFeatures.free[feature.key] === 'boolean' ? (
                                                planFeatures.free[feature.key] ? (
                                                    <CheckIcon className="w-5 h-5 text-success" />
                                                ) : (
                                                    <XMarkIcon className="w-5 h-5 text-danger" />
                                                )
                                            ) : (
                                                planFeatures.free[feature.key]
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {typeof planFeatures.starter[feature.key] === 'boolean' ? (
                                                planFeatures.starter[feature.key] ? (
                                                    <CheckIcon className="w-5 h-5 text-success" />
                                                ) : (
                                                    <XMarkIcon className="w-5 h-5 text-danger" />
                                                )
                                            ) : (
                                                planFeatures.starter[feature.key]
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {typeof planFeatures.professional[feature.key] === 'boolean' ? (
                                                planFeatures.professional[feature.key] ? (
                                                    <CheckIcon className="w-5 h-5 text-success" />
                                                ) : (
                                                    <XMarkIcon className="w-5 h-5 text-danger" />
                                                )
                                            ) : (
                                                planFeatures.professional[feature.key]
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {typeof planFeatures.enterprise[feature.key] === 'boolean' ? (
                                                planFeatures.enterprise[feature.key] ? (
                                                    <CheckIcon className="w-5 h-5 text-success" />
                                                ) : (
                                                    <XMarkIcon className="w-5 h-5 text-danger" />
                                                )
                                            ) : (
                                                planFeatures.enterprise[feature.key]
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* Action Row */}
                                <TableRow key="actions">
                                    <TableCell className="font-semibold">Action</TableCell>
                                    <TableCell>
                                        {currentPlan === 'free' ? (
                                            <Chip color="success" size="sm">Current Plan</Chip>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                onPress={() => onSelectPlan('free')}
                                                radius={themeRadius}
                                            >
                                                Downgrade
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {currentPlan === 'starter' ? (
                                            <Chip color="success" size="sm">Current Plan</Chip>
                                        ) : (
                                            <Button
                                                size="sm"
                                                color="primary"
                                                onPress={() => onSelectPlan('starter')}
                                                radius={themeRadius}
                                            >
                                                {['free'].includes(currentPlan) ? 'Upgrade' : 'Change Plan'}
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {currentPlan === 'professional' ? (
                                            <Chip color="success" size="sm">Current Plan</Chip>
                                        ) : (
                                            <Button
                                                size="sm"
                                                color="primary"
                                                onPress={() => onSelectPlan('professional')}
                                                radius={themeRadius}
                                            >
                                                {['free', 'starter'].includes(currentPlan) ? 'Upgrade' : 'Change Plan'}
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {currentPlan === 'enterprise' ? (
                                            <Chip color="success" size="sm">Current Plan</Chip>
                                        ) : (
                                            <Button
                                                size="sm"
                                                color="primary"
                                                onPress={() => onSelectPlan('enterprise')}
                                                radius={themeRadius}
                                            >
                                                Contact Sales
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Volume Discount Info */}
                    <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">Volume Discounts Available</h4>
                        <ul className="text-sm text-default-600 space-y-1">
                            <li>• 10% discount for 50-99 users</li>
                            <li>• 15% discount for 100-199 users</li>
                            <li>• 20% discount for 200+ users</li>
                        </ul>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose} radius={themeRadius}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
