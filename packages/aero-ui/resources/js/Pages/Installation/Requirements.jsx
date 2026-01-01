import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UnifiedInstallationLayout from '@/Layouts/UnifiedInstallationLayout';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    CardFooter, 
    Button, 
    Spinner,
    Chip,
    Tooltip
} from '@heroui/react';
import { 
    CpuChipIcon, 
    ArrowRightIcon, 
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * Requirements Check Page
 * 
 * Verifies:
 * - PHP version (>= 8.2)
 * - Required PHP extensions
 * - Directory permissions
 * - Database connection (optional pre-check)
 */
export default function Requirements() {
    const { 
        mode = 'standalone',
        requirements: initialRequirements = null
    } = usePage().props;

    const [checking, setChecking] = useState(!initialRequirements);
    const [requirements, setRequirements] = useState(initialRequirements);
    const [canProceed, setCanProceed] = useState(false);

    // Current step depends on mode
    const currentStep = mode === 'saas' ? 2 : 3;

    useEffect(() => {
        if (!initialRequirements) {
            checkRequirements();
        } else {
            evaluateRequirements(initialRequirements);
        }
    }, []);

    const checkRequirements = async () => {
        setChecking(true);
        try {
            const response = await axios.get('/install/check-requirements');
            
            // Normalize the API response to match expected UI structure
            const apiData = response.data.checks || response.data;
            const normalizedData = {
                php: apiData.php,
                extensions: apiData.extensions?.map(ext => ({
                    ...ext,
                    passed: ext.passed ?? ext.installed ?? false
                })) || [],
                permissions: (apiData.permissions || apiData.directories)?.map(dir => ({
                    path: dir.path,
                    passed: dir.passed ?? dir.writable ?? false,
                    required: dir.required || 'Writable'
                })) || [],
                allPassed: response.data.canProceed ?? apiData.allPassed ?? false
            };
            
            setRequirements(normalizedData);
            evaluateRequirements(normalizedData);
        } catch (error) {
            showToast.error('Failed to check requirements');
            console.error('Requirements check failed:', error);
        } finally {
            setChecking(false);
        }
    };

    const evaluateRequirements = (reqs) => {
        if (!reqs) {
            setCanProceed(false);
            return;
        }

        // Use the server's canProceed value if available (it considers required vs optional)
        if (reqs.allPassed !== undefined) {
            setCanProceed(reqs.allPassed);
            return;
        }

        // Fallback: Check if all required items pass
        const phpPasses = reqs.php?.passed ?? false;
        // Only check required extensions (filter out optional ones)
        const extensionsPasses = reqs.extensions?.filter(ext => ext.required !== false).every(ext => ext.passed) ?? false;
        const permissionsPasses = reqs.permissions?.every(perm => perm.passed) ?? false;

        setCanProceed(phpPasses && extensionsPasses && permissionsPasses);
    };

    const handleNext = () => {
        if (!canProceed) {
            showToast.warning('Please resolve all requirements before continuing');
            return;
        }
        router.visit('/install/database');
    };

    const handleBack = () => {
        if (mode === 'saas') {
            router.visit('/install');
        } else {
            router.visit('/install/license');
        }
    };

    const getStatusIcon = (passed) => {
        if (passed) {
            return <CheckCircleIcon className="w-5 h-5 text-success" />;
        }
        return <XCircleIcon className="w-5 h-5 text-danger" />;
    };

    const getStatusChip = (passed, required = true) => {
        if (passed) {
            return <Chip color="success" variant="flat" size="sm">Passed</Chip>;
        }
        return <Chip color={required ? "danger" : "warning"} variant="flat" size="sm">
            {required ? 'Failed' : 'Warning'}
        </Chip>;
    };

    return (
        <UnifiedInstallationLayout currentStep={currentStep} mode={mode}>
            <Head title="Installation - Requirements Check" />
            
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
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <CpuChipIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            System Requirements
                        </h1>
                        <p className="text-default-600">
                            Checking if your server meets the minimum requirements
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-6">
                    {checking ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Spinner size="lg" color="primary" />
                            <p className="mt-4 text-default-600">Checking requirements...</p>
                        </div>
                    ) : requirements ? (
                        <div className="space-y-6">
                            {/* PHP Version */}
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        PHP Version
                                        {getStatusIcon(requirements.php?.passed)}
                                    </h3>
                                    {getStatusChip(requirements.php?.passed)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-default-600">Current Version</span>
                                    <span className={`font-mono ${requirements.php?.passed ? 'text-success' : 'text-danger'}`}>
                                        {requirements.php?.current || 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-default-600">Required</span>
                                    <span className="font-mono text-default-500">
                                        {requirements.php?.required || '>= 8.2'}
                                    </span>
                                </div>
                            </div>

                            {/* PHP Extensions */}
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                                <h3 className="font-semibold text-foreground mb-3">PHP Extensions</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {requirements.extensions?.map((ext, index) => (
                                        <div 
                                            key={index}
                                            className={`
                                                flex items-center justify-between p-2 rounded-lg text-sm
                                                ${ext.passed 
                                                    ? 'bg-success-50 dark:bg-success-900/20' 
                                                    : 'bg-danger-50 dark:bg-danger-900/20'}
                                            `}
                                        >
                                            <span className="font-mono">{ext.name}</span>
                                            {getStatusIcon(ext.passed)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Directory Permissions */}
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                                <h3 className="font-semibold text-foreground mb-3">Directory Permissions</h3>
                                <div className="space-y-2">
                                    {requirements.permissions?.map((perm, index) => (
                                        <div 
                                            key={index}
                                            className={`
                                                flex items-center justify-between p-3 rounded-lg
                                                ${perm.passed 
                                                    ? 'bg-success-50 dark:bg-success-900/20' 
                                                    : 'bg-danger-50 dark:bg-danger-900/20'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm">{perm.path}</span>
                                                {!perm.passed && (
                                                    <Tooltip content={`Run: chmod -R 775 ${perm.path}`}>
                                                        <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-default-500">
                                                    {perm.required}
                                                </span>
                                                {getStatusIcon(perm.passed)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Overall Status */}
                            {!canProceed && (
                                <div className="bg-danger-50 dark:bg-danger-900/20 rounded-lg p-4 border border-danger-200 dark:border-danger-800">
                                    <div className="flex items-start gap-3">
                                        <XCircleIcon className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-danger-700 dark:text-danger-300">
                                                Requirements Not Met
                                            </h4>
                                            <p className="text-sm text-danger-600 dark:text-danger-400 mt-1">
                                                Please resolve the failed requirements above before continuing.
                                                Contact your hosting provider if you need assistance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {canProceed && (
                                <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-4 border border-success-200 dark:border-success-800">
                                    <div className="flex items-start gap-3">
                                        <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-success-700 dark:text-success-300">
                                                All Requirements Met
                                            </h4>
                                            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
                                                Your server meets all the requirements. You can proceed to the next step.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recheck Button */}
                            <div className="flex justify-center">
                                <Button
                                    variant="flat"
                                    color="secondary"
                                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                                    onPress={checkRequirements}
                                    isDisabled={checking}
                                >
                                    Re-check Requirements
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <XCircleIcon className="w-12 h-12 text-danger mx-auto mb-4" />
                            <p className="text-default-600">Failed to load requirements.</p>
                            <Button
                                variant="flat"
                                color="primary"
                                className="mt-4"
                                onPress={checkRequirements}
                            >
                                Try Again
                            </Button>
                        </div>
                    )}
                </CardBody>

                <CardFooter className="px-8 pb-8 pt-4 border-t border-divider">
                    <div className="w-full flex justify-between">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            onPress={handleBack}
                        >
                            Back
                        </Button>
                        <Button
                            color="primary"
                            size="lg"
                            endContent={<ArrowRightIcon className="w-5 h-5" />}
                            onPress={handleNext}
                            isDisabled={!canProceed || checking}
                        >
                            Continue
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </UnifiedInstallationLayout>
    );
}
