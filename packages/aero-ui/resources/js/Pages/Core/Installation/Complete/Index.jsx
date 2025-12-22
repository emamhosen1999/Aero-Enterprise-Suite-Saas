import React, { useEffect, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import StandaloneInstallationLayout from '@/Layouts/StandaloneInstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button } from '@heroui/react';
import { 
    CheckCircleIcon, 
    ArrowRightIcon,
    RocketLaunchIcon,
    ShieldCheckIcon,
    CubeIcon
} from '@heroicons/react/24/outline';

export default function Complete() {
    const { title, message, app } = usePage().props;
    const appName = app?.name || 'Aero Enterprise Suite';
    const [showConfetti, setShowConfetti] = useState(true);

    // Simple confetti effect using CSS
    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleGoToLogin = () => {
        // Disable beforeunload warning
        if (window.disableInstallationWarning) {
            window.disableInstallationWarning();
        }
        window.location.href = '/login';
    };

    const handleGoToDashboard = () => {
        // Disable beforeunload warning
        if (window.disableInstallationWarning) {
            window.disableInstallationWarning();
        }
        window.location.href = '/dashboard';
    };

    return (
        <StandaloneInstallationLayout currentStep={6} totalSteps={6} installationComplete={true}>
            <Head title={title} />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6 border-b border-divider">
                    <div className="w-20 h-20 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center animate-pulse">
                        <CheckCircleIcon className="w-12 h-12 text-success-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            🎉 Installation Complete!
                        </h2>
                        <p className="text-default-600 text-lg">
                            {message || `${appName} has been successfully installed`}
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-8">
                    <div className="space-y-6">
                        {/* Success summary */}
                        <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-6 border border-success-200 dark:border-success-800">
                            <h3 className="font-semibold text-success-800 dark:text-success-200 mb-4">
                                What was set up:
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-success-700 dark:text-success-300">
                                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>Database tables created and configured</span>
                                </div>
                                <div className="flex items-center gap-3 text-success-700 dark:text-success-300">
                                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>Essential roles and permissions seeded</span>
                                </div>
                                <div className="flex items-center gap-3 text-success-700 dark:text-success-300">
                                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>Module hierarchy configured</span>
                                </div>
                                <div className="flex items-center gap-3 text-success-700 dark:text-success-300">
                                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>Super Administrator account created</span>
                                </div>
                            </div>
                        </div>

                        {/* Next steps */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                <RocketLaunchIcon className="w-5 h-5 text-primary" />
                                What's Next?
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-default-200 dark:border-default-700">
                                    <div className="flex-shrink-0">
                                        <ShieldCheckIcon className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground">Log in to your account</h4>
                                        <p className="text-sm text-default-600">
                                            Use the Super Administrator credentials you just created
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-default-200 dark:border-default-700">
                                    <div className="flex-shrink-0">
                                        <CubeIcon className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground">Configure your modules</h4>
                                        <p className="text-sm text-default-600">
                                            Enable and customize the modules you need for your organization
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security reminder */}
                        <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800">
                            <p className="text-sm text-warning-800 dark:text-warning-200">
                                <strong>Security Reminder:</strong> Make sure to keep your administrator credentials 
                                secure. Consider enabling two-factor authentication once logged in.
                            </p>
                        </div>
                    </div>
                </CardBody>

                <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 border-t border-divider px-8 py-6">
                    <Button
                        color="primary"
                        size="lg"
                        onPress={handleGoToLogin}
                        endContent={<ArrowRightIcon className="w-4 h-4" />}
                        className="w-full sm:w-auto"
                    >
                        Go to Login
                    </Button>
                </CardFooter>
            </Card>
        </StandaloneInstallationLayout>
    );
}
