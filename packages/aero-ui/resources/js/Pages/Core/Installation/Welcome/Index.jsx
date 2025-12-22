import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import StandaloneInstallationLayout from '@/Layouts/StandaloneInstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Chip } from '@heroui/react';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ServerIcon, 
    CpuChipIcon, 
    ShieldCheckIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function Welcome() {
    const { title, step, totalSteps, databaseStatus, requirements, app } = usePage().props;
    const appName = app?.name || 'Aero Enterprise Suite';

    const allRequirementsMet = requirements?.php?.passed && 
        Object.values(requirements?.extensions || {}).every(ext => ext.loaded) &&
        Object.values(requirements?.directories || {}).every(dir => dir.writable);

    const handleContinue = () => {
        // Always follow the 6-step flow: Welcome → Requirements → Database → Seeding → Admin → Review
        router.visit(route('installation.requirements'));
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
                    <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-4xl">
                            {appName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome to {appName}
                        </h1>
                        <p className="text-default-600">
                            Standalone Installation Wizard
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-8">
                    <div className="space-y-6">
                        {/* Welcome message */}
                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
                            <p className="text-foreground leading-relaxed">
                                This wizard will help you set up {appName} in standalone mode. 
                                We'll configure the database, seed essential data, and create your super administrator account.
                            </p>
                        </div>

                        {/* Database Status */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                <ServerIcon className="w-5 h-5" />
                                Database Status
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Connection</span>
                                    <Chip 
                                        size="sm" 
                                        color={databaseStatus?.connected ? 'success' : 'danger'}
                                        variant="flat"
                                    >
                                        {databaseStatus?.connected ? 'Connected' : 'Not Connected'}
                                    </Chip>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Tables Ready</span>
                                    <Chip 
                                        size="sm" 
                                        color={databaseStatus?.tables_exist ? 'success' : 'warning'}
                                        variant="flat"
                                    >
                                        {databaseStatus?.tables_exist ? 'Ready' : 'Needs Migration'}
                                    </Chip>
                                </div>
                                {databaseStatus?.message && (
                                    <p className="text-xs text-default-500 mt-2">{databaseStatus.message}</p>
                                )}
                            </div>
                        </div>

                        {/* System Requirements */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                <CpuChipIcon className="w-5 h-5" />
                                System Requirements
                            </h3>
                            
                            {/* PHP Version */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">PHP Version</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-default-500">
                                            {requirements?.php?.current} (required: {requirements?.php?.required})
                                        </span>
                                        {requirements?.php?.passed ? (
                                            <CheckCircleIcon className="w-5 h-5 text-success" />
                                        ) : (
                                            <XCircleIcon className="w-5 h-5 text-danger" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Extensions */}
                            <div className="mb-4">
                                <span className="text-sm font-medium">Required Extensions</span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                    {Object.entries(requirements?.extensions || {}).map(([name, ext]) => (
                                        <div key={name} className="flex items-center gap-2 text-xs">
                                            {ext.loaded ? (
                                                <CheckCircleIcon className="w-4 h-4 text-success" />
                                            ) : (
                                                <XCircleIcon className="w-4 h-4 text-danger" />
                                            )}
                                            <span>{name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Directories */}
                            <div>
                                <span className="text-sm font-medium">Directory Permissions</span>
                                <div className="space-y-1 mt-2">
                                    {Object.entries(requirements?.directories || {}).map(([name, dir]) => (
                                        <div key={name} className="flex items-center justify-between text-xs">
                                            <span>{name}</span>
                                            {dir.writable ? (
                                                <CheckCircleIcon className="w-4 h-4 text-success" />
                                            ) : (
                                                <XCircleIcon className="w-4 h-4 text-danger" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Installation Steps Preview */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5" />
                                Installation Steps
                            </h3>
                            <ol className="space-y-2 text-sm text-default-600">
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">1.</span>
                                    <span>Database migration (create tables)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">2.</span>
                                    <span>Seed essential data (roles, modules, permissions)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary">3.</span>
                                    <span>Create Super Administrator account</span>
                                </li>
                            </ol>
                        </div>

                        {/* Warning if requirements not met */}
                        {!allRequirementsMet && (
                            <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800">
                                <div className="flex gap-3">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-warning-800 dark:text-warning-200">
                                        Some system requirements are not met. Please resolve them before continuing.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardBody>

                <CardFooter className="flex justify-end items-center border-t border-divider px-8 py-6">
                    <Button
                        color="primary"
                        onPress={handleContinue}
                        endContent={<ArrowRightIcon className="w-4 h-4" />}
                        isDisabled={!allRequirementsMet || !databaseStatus?.connected}
                    >
                        Continue
                    </Button>
                </CardFooter>
            </Card>
        </StandaloneInstallationLayout>
    );
}
