import React from 'react';
import { Head, Link } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Chip } from '@heroui/react';
import { CheckCircleIcon, XCircleIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function Requirements({ requirements }) {
    const allPassed = Object.values(requirements).every(group => 
        Object.values(group).every(item => item.satisfied)
    );

    const renderRequirementItem = (name, requirement) => {
        return (
            <div key={name} className="flex items-center justify-between p-2 sm:p-3 bg-default-50 dark:bg-default-100/10 rounded-lg gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {requirement.satisfied ? (
                        <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0" />
                    ) : (
                        <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-danger flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">{name}</p>
                        {requirement.message && (
                            <p className="text-xs sm:text-sm text-default-600 break-words">{requirement.message}</p>
                        )}
                    </div>
                </div>
                <Chip
                    color={requirement.satisfied ? 'success' : 'danger'}
                    variant="flat"
                    size="sm"
                    className="flex-shrink-0"
                >
                    {requirement.satisfied ? 'OK' : 'Failed'}
                </Chip>
            </div>
        );
    };

    return (
        <InstallationLayout currentStep={3}>
            <Head title="Installation - Requirements Check" />
            
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
                <CardHeader className="flex flex-col items-center gap-3 sm:gap-4 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-divider">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
                        allPassed 
                            ? 'bg-success-100 dark:bg-success-900/30' 
                            : 'bg-warning-100 dark:bg-warning-900/30'
                    }`}>
                        <ClipboardDocumentCheckIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${
                            allPassed ? 'text-success-600' : 'text-warning-600'
                        }`} />
                    </div>
                    <div className="text-center px-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                            System Requirements
                        </h2>
                        <p className="text-sm sm:text-base text-default-600">
                            {allPassed 
                                ? 'All requirements passed! You can proceed with installation.' 
                                : 'Some requirements need attention before proceeding.'}
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                    <div className="space-y-4 sm:space-y-6">
                        {/* Overall status */}
                        <div className={`rounded-lg p-4 border ${
                            allPassed
                                ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                                : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                        }`}>
                            <div className="flex items-center gap-2">
                                {allPassed ? (
                                    <CheckCircleIcon className="w-5 h-5 text-success-600" />
                                ) : (
                                    <XCircleIcon className="w-5 h-5 text-warning-600" />
                                )}
                                <p className={`font-semibold ${
                                    allPassed 
                                        ? 'text-success-800 dark:text-success-200' 
                                        : 'text-warning-800 dark:text-warning-200'
                                }`}>
                                    {allPassed 
                                        ? 'System ready for installation' 
                                        : 'Please resolve the issues below'}
                                </p>
                            </div>
                        </div>

                        {/* PHP Version */}
                        {requirements.php && (
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <span>PHP Version</span>
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(requirements.php).map(([key, req]) => 
                                        renderRequirementItem(key, req)
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PHP Extensions */}
                        {requirements.extensions && (
                            <div>
                                <h3 className="font-semibold text-foreground mb-3">
                                    PHP Extensions
                                </h3>
                                <div className="grid gap-2">
                                    {Object.entries(requirements.extensions).map(([key, req]) => 
                                        renderRequirementItem(key, req)
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Directory Permissions */}
                        {requirements.permissions && (
                            <div>
                                <h3 className="font-semibold text-foreground mb-3">
                                    Directory Permissions
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(requirements.permissions).map(([key, req]) => 
                                        renderRequirementItem(key, req)
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Warning if not all passed */}
                        {!allPassed && (
                            <div className="bg-danger-50 dark:bg-danger-900/20 rounded-lg p-3 sm:p-4 border border-danger-200 dark:border-danger-800">
                                <p className="text-xs sm:text-sm text-danger-800 dark:text-danger-200">
                                    <strong>Action Required:</strong> Please fix the failed requirements above before continuing. 
                                    Contact your system administrator if you need assistance.
                                </p>
                            </div>
                        )}
                    </div>
                </CardBody>

                <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-divider px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                    <Button
                        as={Link}
                        href={route('installation.secret')}
                        variant="flat"
                        color="default"
                        className="w-full sm:w-auto order-2 sm:order-1"
                    >
                        Back
                    </Button>
                    <Button
                        as={Link}
                        href={route('installation.database')}
                        color="primary"
                        isDisabled={!allPassed}
                        className="w-full sm:w-auto order-1 sm:order-2"
                    >
                        Continue
                    </Button>
                </CardFooter>
            </Card>
        </InstallationLayout>
    );
}
