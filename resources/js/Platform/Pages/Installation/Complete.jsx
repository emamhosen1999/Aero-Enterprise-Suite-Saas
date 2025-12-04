import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardBody, Button } from '@heroui/react';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Complete() {
    const { app } = usePage().props;
    const appName = app?.name || 'Aero Enterprise Suite';
    
    return (
        <InstallationLayout currentStep={8}>
            <Head title="Installation Complete" />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    transform: `scale(var(--scale, 1))`,
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                }}
            >
                <CardBody className="px-8 py-12">
                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Success icon */}
                        <div className="w-24 h-24 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center animate-pulse">
                            <CheckCircleIcon className="w-16 h-16 text-success-600" />
                        </div>

                        {/* Success message */}
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-3">
                                Installation Complete!
                            </h1>
                            <p className="text-default-600 text-lg max-w-2xl">
                                Congratulations! {appName} has been successfully installed and configured.
                            </p>
                        </div>

                        {/* Next steps */}
                        <div className="w-full max-w-2xl bg-default-50 dark:bg-default-100/10 rounded-lg p-6 text-left">
                            <h3 className="font-semibold text-foreground mb-4">Next Steps:</h3>
                            <ol className="space-y-3 text-sm text-default-600">
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">1.</span>
                                    <span>Log in with your admin account credentials</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">2.</span>
                                    <span>Configure additional platform settings (SMTP, storage, etc.)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">3.</span>
                                    <span>Set up your first tenant organization</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">4.</span>
                                    <span>Configure subscription plans and modules</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">5.</span>
                                    <span>Review security settings and enable features</span>
                                </li>
                            </ol>
                        </div>

                        {/* Important notes */}
                        <div className="w-full max-w-2xl bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800 text-left">
                            <p className="text-sm text-warning-800 dark:text-warning-200">
                                <strong>Security Note:</strong> Please delete or secure the installation files and ensure your 
                                server is properly configured with SSL/HTTPS for production use.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                as="a"
                                href="/login"
                                color="primary"
                                size="lg"
                                endContent={<ArrowRightIcon className="w-5 h-5" />}
                                className="px-8"
                            >
                                Go to Login
                            </Button>
                            <Button
                                as="a"
                                href="https://docs.aero-enterprise-suite.com"
                                target="_blank"
                                variant="bordered"
                                size="lg"
                                className="px-8"
                            >
                                View Documentation
                            </Button>
                        </div>

                        {/* Version info */}
                        <div className="text-xs text-default-400 pt-8">
                            Aero Enterprise Suite v1.0.0 | © 2025 All rights reserved
                        </div>
                    </div>
                </CardBody>
            </Card>
        </InstallationLayout>
    );
}
