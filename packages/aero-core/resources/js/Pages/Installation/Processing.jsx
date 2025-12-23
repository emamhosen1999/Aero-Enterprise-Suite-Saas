import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Progress, Spinner } from '@heroui/react';
import { 
    CogIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Processing({ title }) {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Start installation process
        performInstallation();
    }, []);

    const performInstallation = async () => {
        try {
            const response = await axios.post(route('install.process'));
            
            if (response.data.success) {
                setIsComplete(true);
                setProgress(100);
                setCurrentStep('Installation completed successfully!');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = response.data.redirect || route('login');
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Installation failed');
            }
        } catch (error) {
            setHasError(true);
            setErrorMessage(error.response?.data?.message || error.message || 'Installation failed');
            showToast.error(errorMessage);
        }
    };

    // Simulate progress for UI feedback
    useEffect(() => {
        if (!isComplete && !hasError) {
            const steps = [
                { progress: 10, message: 'Validating license...' },
                { progress: 20, message: 'Running database migrations...' },
                { progress: 40, message: 'Seeding core data...' },
                { progress: 60, message: 'Creating admin user...' },
                { progress: 75, message: 'Storing license information...' },
                { progress: 85, message: 'Syncing modules...' },
                { progress: 95, message: 'Writing configuration files...' },
                { progress: 99, message: 'Finalizing installation...' },
            ];

            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex < steps.length) {
                    setProgress(steps[currentIndex].progress);
                    setCurrentStep(steps[currentIndex].message);
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 1500);

            return () => clearInterval(interval);
        }
    }, [isComplete, hasError]);

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen bg-gradient-to-br from-background via-content1 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    {/* Progress Indicator */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-primary font-semibold">Step 6 of 6</span>
                            <span className="text-default-500">Installation in Progress</span>
                        </div>
                        <div className="mt-2 h-2 bg-default-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* Main Card */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <div className="flex items-center gap-3">
                                {hasError ? (
                                    <ExclamationCircleIcon className="w-8 h-8 text-danger" />
                                ) : isComplete ? (
                                    <CheckCircleIcon className="w-8 h-8 text-success" />
                                ) : (
                                    <CogIcon className="w-8 h-8 text-primary animate-spin" />
                                )}
                                <div>
                                    <h2 className="text-2xl font-semibold">
                                        {hasError ? 'Installation Failed' : isComplete ? 'Installation Complete!' : 'Installing...'}
                                    </h2>
                                    <p className="text-sm text-default-600 mt-1">
                                        {hasError ? 'An error occurred during installation' : isComplete ? 'Redirecting to login page...' : 'Please wait while we set up your system'}
                                    </p>
                                </div>
                            </div>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            <div className="space-y-8">
                                {!hasError && (
                                    <>
                                        {/* Progress Bar */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-foreground">
                                                    {currentStep}
                                                </span>
                                                <span className="text-sm font-semibold text-primary">
                                                    {progress}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={progress}
                                                color={isComplete ? 'success' : 'primary'}
                                                size="lg"
                                                className="max-w-full"
                                            />
                                        </div>

                                        {/* Installation Steps */}
                                        <div className="space-y-3">
                                            {[
                                                { name: 'License Validation', done: progress > 10 },
                                                { name: 'Database Migrations', done: progress > 20 },
                                                { name: 'Core Data Seeding', done: progress > 40 },
                                                { name: 'Admin User Creation', done: progress > 60 },
                                                { name: 'License Storage', done: progress > 75 },
                                                { name: 'Module Synchronization', done: progress > 85 },
                                                { name: 'Configuration Files', done: progress > 95 },
                                                { name: 'Finalization', done: progress === 100 },
                                            ].map((step, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                                        step.done
                                                            ? 'bg-success/10 text-success'
                                                            : progress >= (index + 1) * 12.5 - 5
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-default-50 text-default-500'
                                                    }`}
                                                >
                                                    {step.done ? (
                                                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                                    ) : progress >= (index + 1) * 12.5 - 5 ? (
                                                        <Spinner size="sm" color="current" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-current flex-shrink-0" />
                                                    )}
                                                    <span className="font-medium">{step.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Error Display */}
                                {hasError && (
                                    <div className="p-6 bg-danger/10 border-2 border-danger/20 rounded-lg">
                                        <div className="flex gap-4">
                                            <ExclamationCircleIcon className="w-8 h-8 text-danger flex-shrink-0" />
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-danger mb-2">
                                                    Installation Error
                                                </h3>
                                                <p className="text-default-700 dark:text-default-300 mb-4">
                                                    {errorMessage}
                                                </p>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => window.location.reload()}
                                                        className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors"
                                                    >
                                                        Try Again
                                                    </button>
                                                    <button
                                                        onClick={() => router.visit(route('install.index'))}
                                                        className="px-4 py-2 bg-default-200 text-foreground rounded-lg hover:bg-default-300 transition-colors"
                                                    >
                                                        Start Over
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Success Message */}
                                {isComplete && (
                                    <div className="p-6 bg-success/10 border-2 border-success/20 rounded-lg text-center">
                                        <CheckCircleIcon className="w-16 h-16 text-success mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-success mb-2">
                                            Installation Successful!
                                        </h3>
                                        <p className="text-default-700 dark:text-default-300">
                                            Your system has been installed successfully. Redirecting to login page...
                                        </p>
                                    </div>
                                )}

                                {/* Warning */}
                                {!hasError && !isComplete && (
                                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                                        <p className="text-sm text-warning-700 dark:text-warning flex items-center gap-2">
                                            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                                            <span>
                                                <strong>Please do not close this window</strong> or navigate away until the installation is complete.
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>
                </div>
            </div>
        </>
    );
}
