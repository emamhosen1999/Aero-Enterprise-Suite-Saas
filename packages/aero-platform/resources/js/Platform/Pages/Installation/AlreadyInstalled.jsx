import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardBody, Button } from '@heroui/react';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function AlreadyInstalled() {
    const { app } = usePage().props;
    const appName = app?.name || 'Aero Enterprise Suite';
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
            <Head title="Already Installed" />
            
            <Card 
                className="transition-all duration-200 max-w-2xl w-full"
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
                        <div className="w-24 h-24 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="w-16 h-16 text-success-600" />
                        </div>

                        {/* Message */}
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-3">
                                Platform Already Installed
                            </h1>
                            <p className="text-default-600 text-lg">
                                The {appName} has already been installed on this server.
                            </p>
                        </div>

                        {/* Info box */}
                        <div className="w-full bg-default-50 dark:bg-default-100/10 rounded-lg p-6 text-left">
                            <h3 className="font-semibold text-foreground mb-3">What's Next?</h3>
                            <ul className="space-y-2 text-sm text-default-600">
                                <li>• Use the login page to access the platform</li>
                                <li>• Contact your administrator if you've forgotten your credentials</li>
                                <li>• Check documentation for help and guidance</li>
                            </ul>
                        </div>

                        {/* Warning for reinstall */}
                        <div className="w-full bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800 text-left">
                            <p className="text-sm text-warning-800 dark:text-warning-200">
                                <strong>Need to reinstall?</strong> Delete the <code className="px-1 py-0.5 bg-warning-200 dark:bg-warning-900 rounded text-xs">storage/installed</code> file 
                                from your server and clear the database before running the installation wizard again.
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
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
