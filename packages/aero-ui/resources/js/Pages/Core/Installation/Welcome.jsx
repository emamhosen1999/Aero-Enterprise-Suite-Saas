import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';
import { CheckCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';


export default function Welcome({ title, product, version, phpVersion, laravelVersion }) {
    const [themeRadius, setThemeRadius] = useState('lg');

    useEffect(() => {
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
        setThemeRadius(getThemeRadius());
    }, []);

    const handleStart = () => {
        safeNavigate('install.license');
    };

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen bg-gradient-to-br from-background via-content1 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <RocketLaunchIcon className="w-12 h-12 text-primary" />
                            <h1 className="text-4xl font-bold text-foreground">
                                {product?.name || 'Aero Enterprise Suite'}
                            </h1>
                        </div>
                        <p className="text-lg text-default-600">
                            Welcome to the installation wizard
                        </p>
                    </div>

                    {/* Main Card */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-2xl font-semibold">Getting Started</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-6">
                                {/* Product Info */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-success" />
                                        Product Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-default-100 rounded-lg">
                                            <p className="text-sm text-default-600">Product</p>
                                            <p className="font-semibold">{product?.name}</p>
                                        </div>
                                        <div className="p-4 bg-default-100 rounded-lg">
                                            <p className="text-sm text-default-600">Version</p>
                                            <p className="font-semibold">{version}</p>
                                        </div>
                                    </div>
                                    
                                    {product?.description && (
                                        <p className="mt-3 text-default-600">{product.description}</p>
                                    )}
                                </div>

                                {/* Included Modules - Only show if there are visible modules (excluding core) */}
                                {product?.included_modules && 
                                 product.included_modules.filter(m => m !== 'core').length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Included Modules</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.included_modules
                                                .filter(module => module !== 'core') // Hide core module
                                                .map((module) => (
                                                <Chip
                                                    key={module}
                                                    color="primary"
                                                    variant="flat"
                                                    radius={themeRadius}
                                                >
                                                    {module === 'all' ? 'All Modules' : module.toUpperCase()}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* System Info */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">System Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-default-100 rounded-lg">
                                            <p className="text-sm text-default-600">PHP Version</p>
                                            <p className="font-semibold">{phpVersion}</p>
                                        </div>
                                        <div className="p-4 bg-default-100 rounded-lg">
                                            <p className="text-sm text-default-600">Laravel Version</p>
                                            <p className="font-semibold">{laravelVersion}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Installation Steps */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Installation Steps</h3>
                                    <div className="space-y-2">
                                        {[
                                            'License Validation',
                                            'System Requirements Check',
                                            'Database Configuration',
                                            'Application Settings & Email',
                                            'Admin User Creation',
                                            'Installation Process',
                                        ].map((step, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                                                    {index + 1}
                                                </div>
                                                <span className="text-default-700">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Important Note */}
                                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                                    <p className="text-sm text-warning-700 dark:text-warning">
                                        <strong>Important:</strong> Please ensure you have your license key ready and a valid email address. 
                                        Email configuration is required for system notifications.
                                    </p>
                                </div>

                                {/* Action Button */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        radius={themeRadius}
                                        onPress={handleStart}
                                        endContent={<CheckCircleIcon className="w-5 h-5" />}
                                    >
                                        Start Installation
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Footer */}
                    <div className="text-center mt-8 text-sm text-default-500">
                        <p>© {new Date().getFullYear()} Aero Enterprise Suite. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
