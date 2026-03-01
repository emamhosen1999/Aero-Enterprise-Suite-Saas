import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UnifiedInstallationLayout from '@/Layouts/UnifiedInstallationLayout';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    Progress,
    Chip,
    Button,
    Spinner
} from '@heroui/react';
import { 
    CogIcon, 
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

/**
 * Processing Page - Shows installation progress
 * 
 * Polls the backend for installation status updates
 */
export default function Processing() {
    const { 
        mode = 'standalone',
        initialProgress = null
    } = usePage().props;

    // Current step depends on mode
    const currentStep = mode === 'saas' ? 7 : 8;

    const [progress, setProgress] = useState(initialProgress || {
        percentage: 0,
        currentStep: '',
        steps: [],
        status: 'running', // running, completed, failed
        error: null
    });

    const pollIntervalRef = useRef(null);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        // Start polling for progress updates
        startPolling();

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const startPolling = () => {
        pollIntervalRef.current = setInterval(async () => {
            try {
                const response = await axios.get('/install/progress');
                const data = response.data;

                setProgress(data);

                // Stop polling if completed or failed
                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(pollIntervalRef.current);

                    if (data.status === 'completed') {
                        // Redirect to complete page after a short delay
                        setTimeout(() => {
                            router.visit('/install/complete');
                        }, 1500);
                    }
                }
            } catch (error) {
                console.error('Progress poll error:', error);
            }
        }, 1000);
    };

    const retryInstallation = async () => {
        setRetrying(true);
        try {
            await axios.post('/install/retry');
            setProgress(prev => ({
                ...prev,
                status: 'running',
                error: null,
            }));
            startPolling();
        } catch (error) {
            console.error('Retry failed:', error);
        } finally {
            setRetrying(false);
        }
    };

    const cancelInstallation = async () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        
        try {
            await axios.post('/install/cleanup');
            router.visit('/install/welcome');
        } catch (error) {
            console.error('Cleanup failed:', error);
            router.visit('/install/welcome');
        }
    };

    // Default installation steps
    const defaultSteps = mode === 'saas' 
        ? [
            { key: 'config', label: 'Writing configuration files...' },
            { key: 'database', label: 'Setting up central database...' },
            { key: 'migrations', label: 'Running migrations...' },
            { key: 'admin', label: 'Creating platform admin...' },
            { key: 'modules', label: 'Syncing platform modules...' },
            { key: 'settings', label: 'Saving platform settings...' },
            { key: 'cache', label: 'Clearing and warming cache...' },
            { key: 'finalize', label: 'Finalizing installation...' },
        ]
        : [
            { key: 'config', label: 'Writing configuration files...' },
            { key: 'database', label: 'Setting up database...' },
            { key: 'migrations', label: 'Running migrations...' },
            { key: 'seeders', label: 'Seeding initial data...' },
            { key: 'roles', label: 'Creating roles & permissions...' },
            { key: 'admin', label: 'Creating super admin...' },
            { key: 'settings', label: 'Saving system settings...' },
            { key: 'modules', label: 'Installing licensed products...' },
            { key: 'cache', label: 'Clearing and warming cache...' },
            { key: 'finalize', label: 'Finalizing installation...' },
        ];

    const steps = progress.steps && progress.steps.length > 0 ? progress.steps : defaultSteps;

    const getStepStatus = (step, index) => {
        if (progress.status === 'failed' && progress.currentStep === step.key) {
            return 'failed';
        }
        
        const currentIndex = steps.findIndex(s => s.key === progress.currentStep);
        
        if (currentIndex === -1) {
            return index === 0 ? 'current' : 'pending';
        }
        
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'pending';
    };

    return (
        <UnifiedInstallationLayout currentStep={currentStep} mode={mode} hideCancel>
            <Head title="Installation - Installing" />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                }}
            >
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6">
                    <div className="relative">
                        <motion.div
                            animate={progress.status === 'running' ? { rotate: 360 } : { rotate: 0 }}
                            transition={progress.status === 'running' ? { 
                                duration: 2, 
                                repeat: Infinity, 
                                ease: "linear" 
                            } : {}}
                            className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center"
                        >
                            {progress.status === 'completed' ? (
                                <CheckCircleIcon className="w-10 h-10 text-success" />
                            ) : progress.status === 'failed' ? (
                                <XCircleIcon className="w-10 h-10 text-danger" />
                            ) : (
                                <CogIcon className="w-10 h-10 text-primary" />
                            )}
                        </motion.div>
                        
                        {progress.status === 'running' && (
                            <motion.div
                                className="absolute -inset-2 rounded-3xl border-2 border-primary/30"
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                    </div>
                    
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            {progress.status === 'completed' 
                                ? 'Installation Complete!' 
                                : progress.status === 'failed'
                                    ? 'Installation Failed'
                                    : 'Installing...'}
                        </h1>
                        <p className="text-default-600">
                            {progress.status === 'completed' 
                                ? 'Redirecting to completion page...'
                                : progress.status === 'failed'
                                    ? 'An error occurred during installation'
                                    : 'Please wait while we set up your application'}
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-8">
                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-default-500">Progress</span>
                            <span className="font-medium">{Math.round(progress.percentage)}%</span>
                        </div>
                        <Progress
                            value={progress.percentage}
                            color={
                                progress.status === 'completed' ? 'success' :
                                progress.status === 'failed' ? 'danger' : 'primary'
                            }
                            size="lg"
                            className="w-full"
                            isStriped={progress.status === 'running'}
                        />
                    </div>

                    {/* Current Step Display */}
                    {progress.status === 'running' && progress.currentStep && (
                        <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-primary-50 dark:bg-primary/10 rounded-lg">
                            <Spinner size="sm" color="primary" />
                            <span className="text-primary font-medium">
                                {steps.find(s => s.key === progress.currentStep)?.label || progress.currentStep}
                            </span>
                        </div>
                    )}

                    {/* Error Display */}
                    {progress.status === 'failed' && progress.error && (
                        <div className="mb-6 p-4 bg-danger-50 dark:bg-danger/10 border border-danger-200 dark:border-danger/20 rounded-lg">
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-danger mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-danger">Error Details</p>
                                    <p className="text-sm text-danger/80 mt-1">{progress.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Steps List */}
                    <div className="space-y-3">
                        <AnimatePresence mode="sync">
                            {steps.map((step, index) => {
                                const status = getStepStatus(step, index);
                                
                                return (
                                    <motion.div
                                        key={step.key}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                            status === 'current' 
                                                ? 'bg-primary-50 dark:bg-primary/10 border border-primary-200 dark:border-primary/20' 
                                                : status === 'completed'
                                                    ? 'bg-success-50 dark:bg-success/10'
                                                    : status === 'failed'
                                                        ? 'bg-danger-50 dark:bg-danger/10'
                                                        : 'bg-default-50 dark:bg-default-100/10'
                                        }`}
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            {status === 'completed' ? (
                                                <CheckCircleIcon className="w-5 h-5 text-success" />
                                            ) : status === 'failed' ? (
                                                <XCircleIcon className="w-5 h-5 text-danger" />
                                            ) : status === 'current' ? (
                                                <Spinner size="sm" color="primary" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-default-300" />
                                            )}
                                        </div>
                                        <span className={`flex-1 ${
                                            status === 'completed' ? 'text-success' :
                                            status === 'failed' ? 'text-danger' :
                                            status === 'current' ? 'text-primary font-medium' :
                                            'text-default-400'
                                        }`}>
                                            {step.label}
                                        </span>
                                        {status === 'completed' && (
                                            <Chip size="sm" color="success" variant="flat">Done</Chip>
                                        )}
                                        {status === 'failed' && (
                                            <Chip size="sm" color="danger" variant="flat">Failed</Chip>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Action Buttons (for failed state) */}
                    {progress.status === 'failed' && (
                        <div className="flex justify-center gap-4 mt-6">
                            <Button
                                color="danger"
                                variant="flat"
                                onPress={cancelInstallation}
                            >
                                Cancel Installation
                            </Button>
                            <Button
                                color="primary"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={retryInstallation}
                                isLoading={retrying}
                            >
                                {retrying ? 'Retrying...' : 'Retry Installation'}
                            </Button>
                        </div>
                    )}
                </CardBody>
            </Card>
        </UnifiedInstallationLayout>
    );
}
