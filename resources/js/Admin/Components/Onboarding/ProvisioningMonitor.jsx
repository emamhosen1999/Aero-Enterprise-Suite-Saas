import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Progress, Chip, Button } from "@heroui/react";
import { CheckCircleIcon, ClockIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function ProvisioningMonitor({ tenantId, status: initialStatus = 'pending' }) {
    const [status, setStatus] = useState(initialStatus);
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [polling, setPolling] = useState(false);

    // Get theme radius
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const themeRadius = getThemeRadius();

    const provisioningSteps = [
        { id: 1, name: 'Validating Information', icon: '📋', duration: 2 },
        { id: 2, name: 'Creating Database', icon: '🗄️', duration: 5 },
        { id: 3, name: 'Running Migrations', icon: '⚙️', duration: 8 },
        { id: 4, name: 'Seeding Default Data', icon: '🌱', duration: 3 },
        { id: 5, name: 'Configuring Subdomain', icon: '🌐', duration: 2 },
        { id: 6, name: 'Setting Up Admin User', icon: '👤', duration: 2 },
        { id: 7, name: 'Applying Plan Settings', icon: '💎', duration: 2 },
        { id: 8, name: 'Finalizing Setup', icon: '✨', duration: 3 },
    ];

    const statusColorMap = {
        pending: 'warning',
        in_progress: 'primary',
        completed: 'success',
        failed: 'danger',
    };

    // Poll provisioning status
    useEffect(() => {
        if (status === 'in_progress' && tenantId) {
            setPolling(true);
            
            const interval = setInterval(async () => {
                try {
                    const response = await axios.get(route('admin.onboarding.status', tenantId));
                    const data = response.data;
                    
                    setStatus(data.status);
                    setCurrentStep(data.current_step || 0);
                    setProgress(data.progress || 0);
                    setError(data.error || null);
                    
                    if (data.status === 'completed' || data.status === 'failed') {
                        clearInterval(interval);
                        setPolling(false);
                        
                        if (data.status === 'completed') {
                            showToast.success('Tenant provisioning completed successfully');
                            router.reload({ only: ['tenants'] });
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch provisioning status:', err);
                }
            }, 2000);
            
            return () => {
                clearInterval(interval);
                setPolling(false);
            };
        }
    }, [status, tenantId]);

    const getStepStatus = (stepId) => {
        if (stepId < currentStep) return 'completed';
        if (stepId === currentStep) return 'in_progress';
        return 'pending';
    };

    const getStepIcon = (stepId, stepStatus) => {
        if (stepStatus === 'completed') {
            return <CheckCircleIcon className="w-6 h-6 text-success" />;
        } else if (stepStatus === 'in_progress') {
            return <ClockIcon className="w-6 h-6 text-primary animate-pulse" />;
        } else if (stepStatus === 'failed') {
            return <XCircleIcon className="w-6 h-6 text-danger" />;
        }
        return <ClockIcon className="w-6 h-6 text-default-300" />;
    };

    const handleRetry = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.retry', tenantId));
                setStatus('in_progress');
                setCurrentStep(0);
                setProgress(0);
                setError(null);
                resolve([response.data.message || 'Retrying provisioning...']);
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to retry provisioning']);
            }
        });

        showToast.promise(promise, {
            loading: 'Retrying provisioning...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    const getCardHeaderStyle = () => ({
        borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
    });

    return (
        <Card 
            className="transition-all duration-200"
            style={getCardStyle()}
        >
            <CardHeader 
                className="flex justify-between items-center"
                style={getCardHeaderStyle()}
            >
                <div>
                    <h3 className="text-lg font-semibold">Provisioning Status</h3>
                    <p className="text-sm text-default-500">Real-time tenant setup progress</p>
                </div>
                <Chip 
                    color={statusColorMap[status]} 
                    variant="flat"
                    size="lg"
                >
                    {status.replace('_', ' ').toUpperCase()}
                </Chip>
            </CardHeader>
            
            <CardBody className="space-y-6">
                {/* Overall Progress */}
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-default-500">{Math.round(progress)}%</span>
                    </div>
                    <Progress 
                        value={progress} 
                        color={statusColorMap[status]}
                        className="mb-2"
                    />
                    <p className="text-xs text-default-400">
                        Step {currentStep} of {provisioningSteps.length}
                    </p>
                </div>

                {/* Error Message */}
                {error && status === 'failed' && (
                    <div className="border border-danger rounded-lg p-4 bg-danger-50">
                        <div className="flex items-start gap-2">
                            <XCircleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-danger">Provisioning Failed</h4>
                                <p className="text-sm text-danger mt-1">{error}</p>
                            </div>
                        </div>
                        <Button
                            color="danger"
                            variant="flat"
                            size="sm"
                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                            onPress={handleRetry}
                            className="mt-3"
                            radius={themeRadius}
                        >
                            Retry Provisioning
                        </Button>
                    </div>
                )}

                {/* Provisioning Steps */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold mb-3">Provisioning Steps</h4>
                    {provisioningSteps.map((step) => {
                        const stepStatus = getStepStatus(step.id);
                        const isFailed = status === 'failed' && step.id === currentStep;
                        
                        return (
                            <div 
                                key={step.id} 
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    stepStatus === 'completed' 
                                        ? 'bg-success-50' 
                                        : stepStatus === 'in_progress' 
                                        ? 'bg-primary-50' 
                                        : isFailed
                                        ? 'bg-danger-50'
                                        : 'bg-default-50'
                                }`}
                            >
                                <div className="flex-shrink-0">
                                    {isFailed ? (
                                        <XCircleIcon className="w-6 h-6 text-danger" />
                                    ) : (
                                        getStepIcon(step.id, stepStatus)
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{step.icon}</span>
                                        <span className={`text-sm font-medium ${
                                            stepStatus === 'completed' ? 'text-success' :
                                            stepStatus === 'in_progress' ? 'text-primary' :
                                            isFailed ? 'text-danger' :
                                            'text-default-500'
                                        }`}>
                                            {step.name}
                                        </span>
                                    </div>
                                    
                                    {stepStatus === 'in_progress' && (
                                        <Progress 
                                            size="sm"
                                            isIndeterminate
                                            color="primary"
                                            className="mt-2"
                                        />
                                    )}
                                </div>
                                
                                {stepStatus === 'completed' && (
                                    <Chip size="sm" color="success" variant="flat">
                                        Done
                                    </Chip>
                                )}
                                
                                {stepStatus === 'in_progress' && (
                                    <Chip size="sm" color="primary" variant="flat">
                                        Running...
                                    </Chip>
                                )}

                                {isFailed && (
                                    <Chip size="sm" color="danger" variant="flat">
                                        Failed
                                    </Chip>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Completion Message */}
                {status === 'completed' && (
                    <div className="border border-success rounded-lg p-4 bg-success-50">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-success" />
                            <div>
                                <h4 className="font-semibold text-success">Provisioning Complete!</h4>
                                <p className="text-sm text-success mt-1">
                                    The tenant has been successfully set up and is ready to use.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Estimated Time */}
                {status === 'in_progress' && (
                    <div className="text-xs text-default-400 text-center">
                        <ClockIcon className="w-4 h-4 inline mr-1" />
                        Estimated time remaining: ~{Math.max(0, provisioningSteps.reduce((sum, step) => sum + step.duration, 0) - (currentStep * 3))} seconds
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
