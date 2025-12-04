import React from 'react';
import { usePage } from '@inertiajs/react';
import { Card, CardBody, Progress } from '@heroui/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const InstallationLayout = ({ children, currentStep = 1, totalSteps = 8 }) => {
    const { app, platformSettings } = usePage().props;
    const appName = app?.name || 'Aero Enterprise Suite';
    const appVersion = app?.version || '1.0.0';
    const logo = platformSettings?.branding?.logo || platformSettings?.branding?.logo_light;
    const firstLetter = appName ? appName.charAt(0).toUpperCase() : 'A';
    const steps = [
        { number: 1, name: 'Welcome' },
        { number: 2, name: 'Verification' },
        { number: 3, name: 'Requirements' },
        { number: 4, name: 'Database' },
        { number: 5, name: 'Platform' },
        { number: 6, name: 'Admin' },
        { number: 7, name: 'Review' },
        { number: 8, name: 'Complete' },
    ];

    const progressPercentage = (currentStep / totalSteps) * 100;

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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            {logo ? (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-gray-800">
                                    <img 
                                        src={logo} 
                                        alt={appName}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `<span class="text-white font-bold text-lg sm:text-xl">${firstLetter}</span>`;
                                            e.target.parentElement.classList.add('bg-primary');
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg sm:text-xl">{firstLetter}</span>
                                </div>
                            )}
                            <div>
                                <h1 className="text-base sm:text-xl font-bold text-foreground">{appName}</h1>
                                <p className="text-xs sm:text-sm text-default-500 hidden xs:block">Platform Installation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-xs sm:text-sm text-default-600 hidden sm:inline">Version</span>
                            <span className="text-xs sm:text-sm font-semibold text-primary">{appVersion}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {currentStep <= totalSteps && (
                <div className="w-full bg-white dark:bg-gray-900 border-b border-divider">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs sm:text-sm font-medium text-foreground">
                                    Step {currentStep} of {totalSteps}
                                </span>
                                <span className="text-xs sm:text-sm text-default-500">
                                    {Math.round(progressPercentage)}%
                                </span>
                            </div>
                            <Progress 
                                value={progressPercentage} 
                                color="primary"
                                className="w-full"
                                size="sm"
                            />
                            {/* Step indicators - Desktop only */}
                            <div className="hidden lg:flex justify-between mt-4">
                                {steps.map((step) => (
                                    <div 
                                        key={step.number}
                                        className={`flex flex-col items-center ${
                                            step.number === currentStep 
                                                ? 'text-primary' 
                                                : step.number < currentStep 
                                                    ? 'text-success' 
                                                    : 'text-default-400'
                                        }`}
                                    >
                                        <div 
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                                                step.number === currentStep
                                                    ? 'bg-primary text-white'
                                                    : step.number < currentStep
                                                        ? 'bg-success text-white'
                                                        : 'bg-default-100 text-default-400'
                                            }`}
                                        >
                                            {step.number}
                                        </div>
                                        <span className="text-xs">{step.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6">
                <div className="w-full max-w-4xl">
                    {children}
                </div>
            </div>

            {/* Footer */}
            <div className="w-full bg-white dark:bg-gray-900 border-t border-divider">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm text-default-500">
                        <span className="text-center sm:text-left">© 2025 {appName}. All rights reserved.</span>
                        <div className="flex gap-3 sm:gap-4">
                            <a href="#" className="hover:text-primary transition-colors">Docs</a>
                            <a href="#" className="hover:text-primary transition-colors">Support</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default InstallationLayout;
