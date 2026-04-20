import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import UnifiedInstallationLayout from '@/Layouts/UnifiedInstallationLayout';
import { 
    Card, 
    CardHeader, 
    CardBody,
    CardFooter,
    Button, 
    Chip,
    Divider,
    Code
} from '@heroui/react';
import { 
    CheckBadgeIcon,
    ArrowTopRightOnSquareIcon,
    InformationCircleIcon,
    ClockIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * Already Installed Page
 * 
 * Shown when the application is already installed
 */
export default function AlreadyInstalled() {
    const { 
        mode = 'standalone',
        appUrl = '',
        installedAt = null,
        version = null
    } = usePage().props;

    const loginUrl = mode === 'saas' 
        ? `${appUrl}/admin/login`
        : `${appUrl}/login`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-100 to-default-200 dark:from-default-50 dark:to-default-100 p-4">
            <Head title="Already Installed" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
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
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                            <CheckBadgeIcon className="w-12 h-12 text-primary" />
                        </div>
                        
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-foreground mb-2">
                                Already Installed
                            </h1>
                            <p className="text-default-600">
                                This application has already been installed
                            </p>
                        </div>
                    </CardHeader>

                    <CardBody className="px-8 pb-6">
                        {/* Installation Info */}
                        <div className="bg-content2 rounded-xl p-4 space-y-3">
                            {version && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-default-500">
                                        <InformationCircleIcon className="w-4 h-4" />
                                        <span>Version</span>
                                    </div>
                                    <Chip size="sm" variant="flat">{version}</Chip>
                                </div>
                            )}
                            
                            {installedAt && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-default-500">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>Installed</span>
                                    </div>
                                    <span className="text-sm font-medium">{installedAt}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-default-500">
                                    <UserIcon className="w-4 h-4" />
                                    <span>Mode</span>
                                </div>
                                <Chip size="sm" variant="flat" color="primary">
                                    {mode === 'saas' ? 'Multi-Tenant SaaS' : 'Standalone'}
                                </Chip>
                            </div>
                        </div>

                        <Divider className="my-6" />

                        {/* Instructions */}
                        <div className="text-center space-y-4">
                            <p className="text-default-600">
                                To access the application, please log in with your credentials.
                            </p>
                            
                            <div className="bg-warning-50 dark:bg-warning/10 border border-warning-200 dark:border-warning/20 rounded-lg p-3">
                                <p className="text-sm text-warning-700 dark:text-warning">
                                    <strong>Need to reinstall?</strong> Delete the{' '}
                                    <Code className="text-xs">.installed</Code> lock file and clear the database, then refresh this page.
                                </p>
                            </div>
                        </div>
                    </CardBody>

                    <CardFooter className="px-8 pb-8 pt-4 border-t border-divider">
                        <div className="w-full flex justify-center">
                            <Button
                                as="a"
                                href={loginUrl}
                                color="primary"
                                size="lg"
                                endContent={<ArrowTopRightOnSquareIcon className="w-5 h-5" />}
                            >
                                Go to Login
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-default-400 mt-4">
                    Aero Enterprise Suite • {mode === 'saas' ? 'Platform' : 'Core'} Edition
                </p>
            </motion.div>
        </div>
    );
}
