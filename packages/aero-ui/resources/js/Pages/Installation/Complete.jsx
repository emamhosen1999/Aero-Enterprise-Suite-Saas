import React, { useState, useEffect } from 'react';
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
    CheckCircleIcon,
    RocketLaunchIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ClipboardDocumentIcon,
    ArrowTopRightOnSquareIcon,
    SparklesIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { showToast } from '@/utils/toastUtils';

/**
 * Complete Page - Installation successful
 * 
 * Shows success message and next steps
 */
export default function Complete() {
    const { 
        mode = 'standalone',
        appUrl: configAppUrl = '',
        adminEmail = '',
        adminPassword = '',
        licensedModules = [],
        installationKey = null
    } = usePage().props;

    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Auto-detect the app URL from the current browser window
    const getDetectedAppUrl = () => {
        if (typeof window !== 'undefined') {
            // Use the current browser URL's origin (protocol + host)
            return window.location.origin;
        }
        return configAppUrl;
    };

    const appUrl = getDetectedAppUrl();

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        showToast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    // Build admin subdomain URL for SaaS mode (admin.domain.com/login)
    const getAdminUrl = (path = '') => {
        if (mode === 'saas') {
            try {
                const url = new URL(appUrl);
                // Use admin subdomain: admin.domain.com
                return `${url.protocol}//admin.${url.host}${path}`;
            } catch {
                return `${appUrl}${path}`;
            }
        }
        return `${appUrl}${path}`;
    };

    const loginUrl = mode === 'saas' 
        ? getAdminUrl('/login')
        : `${appUrl}/login`;

    const dashboardUrl = mode === 'saas'
        ? getAdminUrl('/')
        : `${appUrl}/dashboard`;

    return (
        <UnifiedInstallationLayout currentStep={mode === 'saas' ? 8 : 9} mode={mode} hideCancel>
            <Head title="Installation Complete" />
            
            <Card 
                className="transition-all duration-200 overflow-visible"
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
                    {/* Animated Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="relative"
                    >
                        <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="w-16 h-16 text-success" />
                        </div>
                        
                        {/* Celebratory particles */}
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ 
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0.5],
                                    x: [0, Math.cos(i * 45 * Math.PI / 180) * 60],
                                    y: [0, Math.sin(i * 45 * Math.PI / 180) * 60],
                                }}
                                transition={{ delay: 0.3, duration: 1 }}
                                className="absolute top-1/2 left-1/2 w-2 h-2 bg-success rounded-full"
                            />
                        ))}
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center"
                    >
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            🎉 Installation Complete!
                        </h1>
                        <p className="text-default-600 text-lg">
                            Your {mode === 'saas' ? 'platform' : 'application'} is ready to use
                        </p>
                    </motion.div>
                </CardHeader>

                <CardBody className="px-8 pb-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-6"
                    >
                        {/* Quick Access */}
                        <div className="bg-success-50 dark:bg-success/10 border border-success-200 dark:border-success/20 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <RocketLaunchIcon className="w-6 h-6 text-success" />
                                <h3 className="font-semibold text-success-800 dark:text-success">
                                    Quick Access
                                </h3>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-content1 rounded-lg">
                                    <div>
                                        <p className="font-medium">Login URL</p>
                                        <Code className="text-xs">{loginUrl}</Code>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            isIconOnly
                                            onPress={() => copyToClipboard(loginUrl)}
                                        >
                                            <ClipboardDocumentIcon className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            isIconOnly
                                            as="a"
                                            href={loginUrl}
                                            target="_blank"
                                        >
                                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white dark:bg-content1 rounded-lg">
                                    <div>
                                        <p className="font-medium">Admin Email</p>
                                        <Code className="text-xs">{adminEmail}</Code>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        isIconOnly
                                        onPress={() => copyToClipboard(adminEmail)}
                                    >
                                        <ClipboardDocumentIcon className="w-4 h-4" />
                                    </Button>
                                </div>

                                {adminPassword && (
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-content1 rounded-lg">
                                        <div>
                                            <p className="font-medium">Admin Password</p>
                                            <Code className="text-xs">
                                                {showPassword ? adminPassword : '••••••••••••'}
                                            </Code>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                isIconOnly
                                                onPress={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeSlashIcon className="w-4 h-4" />
                                                ) : (
                                                    <EyeIcon className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                isIconOnly
                                                onPress={() => copyToClipboard(adminPassword)}
                                            >
                                                <ClipboardDocumentIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Installation Key (for support) */}
                        {installationKey && (
                            <div className="bg-content2 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheckIcon className="w-4 h-4 text-default-500" />
                                    <span className="text-sm text-default-500">Installation Key (for support)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Code className="text-xs flex-1 overflow-x-auto">{installationKey}</Code>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        isIconOnly
                                        onPress={() => copyToClipboard(installationKey)}
                                    >
                                        <ClipboardDocumentIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Licensed Products (Standalone) */}
                        {mode === 'standalone' && licensedModules.length > 0 && (
                            <div className="bg-primary-50 dark:bg-primary/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <SparklesIcon className="w-5 h-5 text-primary" />
                                    <span className="font-medium text-primary">Licensed Products</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {licensedModules.map((module, index) => (
                                        <Chip key={index} color="primary" variant="flat" size="sm">
                                            {module}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Divider />

                        {/* Next Steps */}
                        <div>
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5" />
                                Recommended Next Steps
                            </h3>
                            <ol className="list-decimal list-inside space-y-2 text-default-600">
                                {mode === 'saas' ? (
                                    <>
                                        <li>Log in to the Platform Admin panel</li>
                                        <li>Configure subscription plans and pricing</li>
                                        <li>Set up payment gateway (Stripe/Paddle)</li>
                                        <li>Customize branding and email templates</li>
                                        <li>Create your first tenant organization</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Log in with your admin credentials</li>
                                        <li>Complete organization profile setup</li>
                                        <li>Configure departments and roles</li>
                                        <li>Invite team members</li>
                                        <li>Start using your licensed modules</li>
                                    </>
                                )}
                            </ol>
                        </div>

                        {/* Security Notice */}
                        <div className="bg-warning-50 dark:bg-warning/10 border border-warning-200 dark:border-warning/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <ShieldCheckIcon className="w-5 h-5 text-warning mt-0.5" />
                                <div>
                                    <p className="font-medium text-warning-800 dark:text-warning">
                                        Security Reminder
                                    </p>
                                    <ul className="text-sm text-warning-600 dark:text-warning/80 mt-1 space-y-1">
                                        <li>• Delete the <Code className="text-xs">install</Code> directory if it exists</li>
                                        <li>• Ensure your <Code className="text-xs">.env</Code> file is not publicly accessible</li>
                                        <li>• Set up regular database backups</li>
                                        <li>• Enable 2FA for admin accounts</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </CardBody>

                <CardFooter className="px-8 pb-8 pt-4 border-t border-divider">
                    <div className="w-full flex justify-center gap-4">
                        <Button
                            as="a"
                            href={dashboardUrl}
                            color="primary"
                            size="lg"
                            endContent={<ArrowTopRightOnSquareIcon className="w-5 h-5" />}
                        >
                            Go to {mode === 'saas' ? 'Admin Panel' : 'Dashboard'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </UnifiedInstallationLayout>
    );
}
