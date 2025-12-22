import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardBody, Button, Progress } from '@heroui/react';
import { CheckCircleIcon, ArrowRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Complete() {
    const { app, loginUrl } = usePage().props;
    const appName = app?.name || 'Aero Enterprise Suite';
    const appVersion = app?.version || '1.0.0';
    
    // Auto-redirect countdown
    const [countdown, setCountdown] = useState(10);
    const [autoRedirect, setAutoRedirect] = useState(true);
    
    // Redirect URL (from controller or fallback)
    const redirectUrl = loginUrl || '/login';

    // Auto-redirect countdown
    useEffect(() => {
        if (!autoRedirect || countdown <= 0) return;
        
        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [countdown, autoRedirect]);

    // Redirect when countdown reaches 0
    useEffect(() => {
        if (countdown === 0 && autoRedirect) {
            window.location.href = redirectUrl;
        }
    }, [countdown, autoRedirect, redirectUrl]);

    const handleCancelAutoRedirect = () => {
        setAutoRedirect(false);
    };

    const handleGoToLogin = () => {
        window.location.href = redirectUrl;
    };
    
    return (
        <InstallationLayout currentStep={8} installationComplete={true}>
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
                        {/* Success icon with checkmark animation */}
                        <div className="w-24 h-24 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="w-16 h-16 text-success-600 animate-bounce" />
                        </div>

                        {/* Success message */}
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-3">
                                🎉 Installation Complete!
                            </h1>
                            <p className="text-default-600 text-lg max-w-2xl">
                                Congratulations! {appName} has been successfully installed and configured.
                            </p>
                        </div>

                        {/* Auto-redirect progress */}
                        {autoRedirect && countdown > 0 && (
                            <div className="w-full max-w-md space-y-3">
                                <div className="flex items-center justify-center gap-2 text-sm text-default-600">
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    <span>Redirecting to login in <strong className="text-primary">{countdown}</strong> seconds...</span>
                                </div>
                                <Progress 
                                    value={((10 - countdown) / 10) * 100}
                                    color="primary"
                                    size="sm"
                                    className="w-full"
                                />
                                <Button
                                    variant="flat"
                                    size="sm"
                                    onPress={handleCancelAutoRedirect}
                                    className="text-default-600"
                                >
                                    Cancel auto-redirect
                                </Button>
                            </div>
                        )}

                        {/* Redirect destination info */}
                        <div className="w-full max-w-2xl bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                            <p className="text-sm text-primary-800 dark:text-primary-200">
                                <strong>Redirect Destination:</strong> {redirectUrl}
                            </p>
                            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                                You will be redirected to the admin login page where you can sign in with your admin credentials.
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
                                color="primary"
                                size="lg"
                                endContent={<ArrowRightIcon className="w-5 h-5" />}
                                className="px-8"
                                onPress={handleGoToLogin}
                            >
                                Go to Login Now
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
                            {appName} v{appVersion} | © 2025 All rights reserved
                        </div>
                    </div>
                </CardBody>
            </Card>
        </InstallationLayout>
    );
}
