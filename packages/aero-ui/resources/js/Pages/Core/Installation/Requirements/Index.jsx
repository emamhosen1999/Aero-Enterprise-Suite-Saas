import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import StandaloneInstallationLayout from '@/Layouts/StandaloneInstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Chip, Divider } from '@heroui/react';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    CpuChipIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    FolderIcon,
    CommandLineIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function Requirements() {
    const { title, step, totalSteps, requirements, allPassed } = usePage().props;

    const handleContinue = () => {
        router.visit(route('installation.database'));
    };

    const handleBack = () => {
        router.visit(route('installation.index'));
    };

    // Count passed/failed requirements
    const extensionStats = {
        passed: Object.values(requirements?.extensions || {}).filter(ext => ext.loaded).length,
        total: Object.values(requirements?.extensions || {}).length,
    };

    const directoryStats = {
        passed: Object.values(requirements?.directories || {}).filter(dir => dir.writable).length,
        total: Object.values(requirements?.directories || {}).length,
    };

    return (
        <StandaloneInstallationLayout currentStep={step} totalSteps={totalSteps}>
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
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <CpuChipIcon className="w-10 h-10 text-primary-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            System Requirements
                        </h2>
                        <p className="text-default-600">
                            Checking your server meets all requirements
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-8">
                    <div className="space-y-6">
                        {/* Overall Status */}
                        <div className={`rounded-lg p-4 border ${allPassed 
                            ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800' 
                            : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                {allPassed ? (
                                    <>
                                        <CheckCircleIcon className="w-6 h-6 text-success" />
                                        <div>
                                            <p className="font-semibold text-success-800 dark:text-success-200">
                                                All Requirements Met!
                                            </p>
                                            <p className="text-sm text-success-700 dark:text-success-300">
                                                Your server is ready for installation.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ExclamationTriangleIcon className="w-6 h-6 text-warning" />
                                        <div>
                                            <p className="font-semibold text-warning-800 dark:text-warning-200">
                                                Some Requirements Not Met
                                            </p>
                                            <p className="text-sm text-warning-700 dark:text-warning-300">
                                                Please resolve the issues below before continuing.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* PHP Version */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        requirements?.php?.passed 
                                            ? 'bg-success-100 dark:bg-success-900/30' 
                                            : 'bg-danger-100 dark:bg-danger-900/30'
                                    }`}>
                                        <CpuChipIcon className={`w-5 h-5 ${
                                            requirements?.php?.passed ? 'text-success' : 'text-danger'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">PHP Version</h3>
                                        <p className="text-sm text-default-500">
                                            Required: {requirements?.php?.required} | Current: {requirements?.php?.current}
                                        </p>
                                    </div>
                                </div>
                                <Chip 
                                    size="sm" 
                                    color={requirements?.php?.passed ? 'success' : 'danger'}
                                    variant="flat"
                                    startContent={requirements?.php?.passed ? 
                                        <CheckCircleIcon className="w-3 h-3" /> : 
                                        <XCircleIcon className="w-3 h-3" />
                                    }
                                >
                                    {requirements?.php?.passed ? 'Passed' : 'Failed'}
                                </Chip>
                            </div>
                        </div>

                        {/* Required Extensions */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <CommandLineIcon className="w-5 h-5" />
                                    Required PHP Extensions
                                </h3>
                                <Chip size="sm" color={extensionStats.passed === extensionStats.total ? 'success' : 'warning'} variant="flat">
                                    {extensionStats.passed}/{extensionStats.total} Loaded
                                </Chip>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(requirements?.extensions || {}).map(([name, ext]) => (
                                    <div 
                                        key={name} 
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            ext.loaded 
                                                ? 'bg-success-50 dark:bg-success-900/10' 
                                                : 'bg-danger-50 dark:bg-danger-900/10'
                                        }`}
                                    >
                                        <div>
                                            <span className="font-medium text-sm">{name}</span>
                                            <p className="text-xs text-default-500">{ext.description}</p>
                                        </div>
                                        {ext.loaded ? (
                                            <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0" />
                                        ) : (
                                            <XCircleIcon className="w-5 h-5 text-danger flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Optional Extensions */}
                        {Object.keys(requirements?.optional_extensions || {}).length > 0 && (
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <InformationCircleIcon className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold text-foreground">Optional Extensions</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {Object.entries(requirements?.optional_extensions || {}).map(([name, ext]) => (
                                        <div 
                                            key={name} 
                                            className="flex items-center justify-between p-2 rounded bg-default-100 dark:bg-default-800"
                                        >
                                            <div>
                                                <span className="text-sm">{name}</span>
                                                <p className="text-xs text-default-500">{ext.description}</p>
                                            </div>
                                            {ext.loaded ? (
                                                <CheckCircleIcon className="w-4 h-4 text-success" />
                                            ) : (
                                                <span className="text-xs text-default-400">Not installed</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Directory Permissions */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <FolderIcon className="w-5 h-5" />
                                    Directory Permissions
                                </h3>
                                <Chip size="sm" color={directoryStats.passed === directoryStats.total ? 'success' : 'danger'} variant="flat">
                                    {directoryStats.passed}/{directoryStats.total} Writable
                                </Chip>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(requirements?.directories || {}).map(([name, dir]) => (
                                    <div 
                                        key={name} 
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            dir.writable 
                                                ? 'bg-success-50 dark:bg-success-900/10' 
                                                : 'bg-danger-50 dark:bg-danger-900/10'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-sm">{name}</span>
                                            <p className="text-xs text-default-500 truncate">{dir.path}</p>
                                        </div>
                                        {dir.writable ? (
                                            <Chip size="sm" color="success" variant="flat">Writable</Chip>
                                        ) : (
                                            <Chip size="sm" color="danger" variant="flat">Not Writable</Chip>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Functions Check */}
                        {Object.keys(requirements?.functions || {}).length > 0 && (
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <CommandLineIcon className="w-5 h-5" />
                                    <h3 className="font-semibold text-foreground">PHP Functions</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(requirements?.functions || {}).map(([name, func]) => (
                                        <Chip 
                                            key={name}
                                            size="sm" 
                                            color={func.enabled ? 'success' : 'default'}
                                            variant="flat"
                                            startContent={func.enabled ? 
                                                <CheckCircleIcon className="w-3 h-3" /> : 
                                                <XCircleIcon className="w-3 h-3" />
                                            }
                                        >
                                            {name}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardBody>

                <CardFooter className="flex justify-between items-center border-t border-divider px-8 py-6">
                    <Button
                        variant="flat"
                        color="default"
                        onPress={handleBack}
                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    >
                        Back
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleContinue}
                        isDisabled={!allPassed}
                        endContent={<ArrowRightIcon className="w-4 h-4" />}
                    >
                        Continue to Database
                    </Button>
                </CardFooter>
            </Card>
        </StandaloneInstallationLayout>
    );
}
