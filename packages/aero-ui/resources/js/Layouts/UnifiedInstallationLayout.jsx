import React, { useEffect, useState, useRef, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Card, CardBody, Progress, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { ToastContainer } from 'react-toastify';
import { showToast } from '@/utils/toastUtils';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Unified Installation Layout
 * 
 * Mode-aware layout that adapts steps based on installation mode:
 * - SaaS Mode: No license step, Platform Settings
 * - Standalone Mode: License validation step, System Settings
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {number} props.currentStep - Current step number (1-based)
 * @param {string} props.mode - 'saas' | 'standalone' 
 * @param {boolean} props.installationComplete - Whether installation finished successfully
 */
const UnifiedInstallationLayout = ({ 
    children, 
    currentStep = 1, 
    mode = 'standalone',
    installationComplete = false 
}) => {
    const { app, platformSettings, systemSettings } = usePage().props;
    
    // Get branding from props based on mode
    const appName = mode === 'saas' 
        ? (platformSettings?.site_name || app?.name || 'Aero Enterprise Suite')
        : (systemSettings?.company_name || app?.name || 'Aero Enterprise Suite');
    
    const appVersion = app?.version || '1.0.0';
    
    const logo = mode === 'saas'
        ? (platformSettings?.branding?.logo || platformSettings?.branding?.logo_light)
        : (systemSettings?.branding?.logo_light);
    
    const firstLetter = appName ? appName.charAt(0).toUpperCase() : 'A';

    // State
    const [sessionWarningShown, setSessionWarningShown] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    
    // Define steps based on mode
    const steps = useMemo(() => {
        if (mode === 'saas') {
            return [
                { number: 1, name: 'Welcome', key: 'welcome' },
                { number: 2, name: 'Requirements', key: 'requirements' },
                { number: 3, name: 'Database', key: 'database' },
                { number: 4, name: 'Platform', key: 'settings' },
                { number: 5, name: 'Admin', key: 'admin' },
                { number: 6, name: 'Review', key: 'review' },
                { number: 7, name: 'Complete', key: 'complete' },
            ];
        } else {
            // Standalone mode includes license validation
            return [
                { number: 1, name: 'Welcome', key: 'welcome' },
                { number: 2, name: 'License', key: 'license' },
                { number: 3, name: 'Requirements', key: 'requirements' },
                { number: 4, name: 'Database', key: 'database' },
                { number: 5, name: 'System', key: 'settings' },
                { number: 6, name: 'Admin', key: 'admin' },
                { number: 7, name: 'Review', key: 'review' },
                { number: 8, name: 'Complete', key: 'complete' },
            ];
        }
    }, [mode]);

    const totalSteps = steps.length;
    const progressPercentage = (currentStep / totalSteps) * 100;
    const isCompleteStep = currentStep >= totalSteps;

    // Track installation completion via ref (for synchronous access in event handlers)
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

    // Warn before leaving during installation
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isCompleteStep || installationCompleteRef.current) {
                return;
            }
            if (currentStep > 1 && currentStep < totalSteps) {
                e.preventDefault();
                e.returnValue = 'Installation progress will be lost if you leave. Are you sure?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [currentStep, totalSteps, isCompleteStep]);

    // Session timeout warning (55 minutes)
    useEffect(() => {
        if (sessionWarningShown) return;

        const warningTimeout = setTimeout(() => {
            if (currentStep > 1 && currentStep < totalSteps) {
                showToast.warning(
                    'Your session will expire soon. Please complete the installation to avoid losing progress.',
                    { duration: 10000 }
                );
                setSessionWarningShown(true);
            }
        }, 55 * 60 * 1000);

        return () => clearTimeout(warningTimeout);
    }, [currentStep, totalSteps, sessionWarningShown]);

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

    // Handle cancel installation
    const handleCancelInstallation = async () => {
        setCancelLoading(true);
        try {
            // Call cleanup endpoint
            const response = await fetch('/install/cleanup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                showToast.success('Installation cancelled. All data has been cleaned up.');
                window.disableInstallationWarning?.();
                
                // Redirect to welcome or home
                setTimeout(() => {
                    window.location.href = '/install';
                }, 1500);
            } else {
                showToast.error('Failed to cleanup installation. Please try again.');
            }
        } catch (error) {
            console.error('Cleanup error:', error);
            showToast.error('Failed to cleanup installation.');
        } finally {
            setCancelLoading(false);
            setShowCancelModal(false);
        }
    };

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

            {/* Cancel Confirmation Modal */}
            <Modal 
                isOpen={showCancelModal} 
                onOpenChange={setShowCancelModal}
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-6 h-6 text-warning" />
                        Cancel Installation?
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-default-600">
                            Are you sure you want to cancel the installation? All progress will be lost 
                            and any partially created data will be cleaned up.
                        </p>
                        <p className="text-sm text-warning mt-2">
                            This action cannot be undone.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={() => setShowCancelModal(false)}
                            isDisabled={cancelLoading}
                        >
                            Continue Installation
                        </Button>
                        <Button 
                            color="danger" 
                            onPress={handleCancelInstallation}
                            isLoading={cancelLoading}
                        >
                            Yes, Cancel Installation
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
                {/* Header */}
                <div className="w-full bg-background border-b border-divider shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            {/* Logo & App Name */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {logo ? (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center bg-content2">
                                        <img 
                                            src={logo} 
                                            alt={appName}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                const img = e?.target;
                                                if (img) {
                                                    try {
                                                        img.style.display = 'none';
                                                        const parent = img.parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = `<span class="text-white font-bold text-lg sm:text-xl">${firstLetter}</span>`;
                                                            parent.classList.add('bg-primary');
                                                        }
                                                    } catch (err) {
                                                        // Swallow DOM errors
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-lg sm:text-xl">{firstLetter}</span>
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-base sm:text-lg font-semibold text-foreground">
                                        {appName}
                                    </h1>
                                    <p className="text-xs text-default-500 hidden sm:block">
                                        {mode === 'saas' ? 'Platform' : 'Standalone'} Installation • v{appVersion}
                                    </p>
                                </div>
                            </div>

                            {/* Cancel Button (show only during installation, not on welcome or complete) */}
                            {currentStep > 1 && currentStep < totalSteps && !installationComplete && (
                                <Button
                                    variant="light"
                                    color="danger"
                                    size="sm"
                                    startContent={<XMarkIcon className="w-4 h-4" />}
                                    onPress={() => setShowCancelModal(true)}
                                >
                                    <span className="hidden sm:inline">Cancel</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-background border-b border-divider">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">
                                Step {currentStep} of {totalSteps}: {steps[currentStep - 1]?.name || ''}
                            </span>
                            <span className="text-sm text-default-500">
                                {Math.round(progressPercentage)}% Complete
                            </span>
                        </div>
                        <Progress
                            value={progressPercentage}
                            color="primary"
                            size="sm"
                            className="w-full"
                            aria-label="Installation progress"
                        />
                    </div>
                </div>

                {/* Step Indicators (Desktop) */}
                <div className="hidden md:block w-full bg-white/50 dark:bg-content2/50 border-b border-divider">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div 
                                    key={step.number}
                                    className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className={`
                                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                                transition-all duration-200
                                                ${currentStep > step.number 
                                                    ? 'bg-success text-white' 
                                                    : currentStep === step.number 
                                                        ? 'bg-primary text-white ring-4 ring-primary/20' 
                                                        : 'bg-default-200 text-default-600'}
                                            `}
                                        >
                                            {currentStep > step.number ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                step.number
                                            )}
                                        </div>
                                        <span 
                                            className={`
                                                text-sm font-medium hidden lg:block
                                                ${currentStep >= step.number ? 'text-foreground' : 'text-default-400'}
                                            `}
                                        >
                                            {step.name}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div 
                                            className={`
                                                flex-1 h-0.5 mx-4 transition-all duration-200
                                                ${currentStep > step.number ? 'bg-success' : 'bg-default-200'}
                                            `}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
                        {children}
                    </div>
                </div>

                {/* Footer */}
                <div className="w-full bg-white/80 dark:bg-content3/80 border-t border-divider py-4">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-sm text-default-500">
                            &copy; {new Date().getFullYear()} {appName}. 
                            {mode === 'saas' ? ' Multi-Tenant SaaS Platform.' : ' Enterprise Suite.'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UnifiedInstallationLayout;
