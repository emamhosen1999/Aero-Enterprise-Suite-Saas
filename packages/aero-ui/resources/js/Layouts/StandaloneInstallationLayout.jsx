import React, { useEffect, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { Card, CardBody, Progress } from '@heroui/react';
import { ToastContainer } from 'react-toastify';
import { showToast } from '@/utils/toastUtils';
import { 
    CheckCircleIcon,
    HomeIcon,
    CpuChipIcon,
    ServerIcon,
    CircleStackIcon,
    UserPlusIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Standalone Installation Layout
 * 
 * A robust 6-step installation layout for standalone (non-SaaS) mode.
 * Steps: Welcome → Requirements → Database → Seeding → Admin → Review
 */
const StandaloneInstallationLayout = ({ children, currentStep = 1, totalSteps = 6, installationComplete = false }) => {
    const { app } = usePage().props;
    const appName = app?.name || 'Aero Enterprise Suite';
    const appVersion = app?.version || '1.0.0';
    const firstLetter = appName ? appName.charAt(0).toUpperCase() : 'A';

    // Use ref to track installation completion synchronously
    const installationCompleteRef = useRef(installationComplete);

    useEffect(() => {
        installationCompleteRef.current = installationComplete;
    }, [installationComplete]);

    // Expose global function to disable beforeunload warning
    useEffect(() => {
        window.disableInstallationWarning = () => {
            installationCompleteRef.current = true;
        };
        return () => {
            delete window.disableInstallationWarning;
        };
    }, []);

    const steps = [
        { number: 1, name: 'Welcome', shortName: 'Welcome', icon: HomeIcon },
        { number: 2, name: 'Requirements', shortName: 'Reqs', icon: CpuChipIcon },
        { number: 3, name: 'Database', shortName: 'DB', icon: ServerIcon },
        { number: 4, name: 'Seeding', shortName: 'Seed', icon: CircleStackIcon },
        { number: 5, name: 'Admin', shortName: 'Admin', icon: UserPlusIcon },
        { number: 6, name: 'Review', shortName: 'Review', icon: ClipboardDocumentCheckIcon },
    ];

    const progressPercentage = (currentStep / totalSteps) * 100;
    const isCompleteStep = currentStep > totalSteps;

    // Warn before leaving the page during installation
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isCompleteStep || installationCompleteRef.current) {
                return;
            }
            if (currentStep > 1 && currentStep <= totalSteps) {
                e.preventDefault();
                e.returnValue = 'Installation progress will be lost if you leave. Are you sure?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [currentStep, totalSteps, isCompleteStep]);

    // Online/offline detection
    useEffect(() => {
        const handleOffline = () => {
            showToast.error('You are offline. Please check your internet connection.', { duration: 0 });
        };

        const handleOnline = () => {
            showToast.success('Connection restored!');
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
                {/* Header */}
                <div className="w-full bg-white dark:bg-gray-900 border-b border-divider shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">{firstLetter}</span>
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-foreground">
                                        {appName}
                                    </h1>
                                    <p className="text-xs text-default-500">Installation Wizard</p>
                                </div>
                            </div>
                            <div className="text-xs sm:text-sm text-default-500">
                                v{appVersion}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="w-full bg-white dark:bg-gray-900 border-b border-divider">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                        {/* Step indicators */}
                        <div className="flex justify-between mb-4">
                            {steps.map((step) => {
                                const Icon = step.icon;
                                const isCompleted = step.number < currentStep;
                                const isCurrent = step.number === currentStep;
                                
                                return (
                                    <div
                                        key={step.number}
                                        className={`flex flex-col items-center ${
                                            step.number <= currentStep ? 'text-primary' : 'text-default-400'
                                        }`}
                                    >
                                        <div
                                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 transition-all duration-300
                                                ${isCompleted 
                                                    ? 'bg-success text-white' 
                                                    : isCurrent 
                                                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary border-2 border-primary' 
                                                        : 'bg-default-100 dark:bg-default-800 text-default-400'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircleIcon className="w-5 h-5" />
                                            ) : (
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            )}
                                        </div>
                                        <span className="text-xs font-medium hidden sm:block">{step.name}</span>
                                        <span className="text-xs font-medium sm:hidden">{step.shortName}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress bar */}
                        <Progress
                            aria-label="Installation progress"
                            value={progressPercentage}
                            color="primary"
                            size="sm"
                            className="max-w-full"
                        />

                        <div className="flex justify-between text-xs text-default-500 mt-2">
                            <span>Step {currentStep} of {totalSteps}</span>
                            <span>{Math.round(progressPercentage)}% Complete</span>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {children}
                </div>

                {/* Footer */}
                <div className="w-full bg-white dark:bg-gray-900 border-t border-divider">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-default-500">
                            <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
                            <p>Powered by Aero Enterprise Suite</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StandaloneInstallationLayout;
