import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Chip, Spinner } from '@heroui/react';
import { 
    CheckCircleIcon, 
    XCircleIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

export default function Requirements({ title, checks, canProceed }) {
    const [themeRadius, setThemeRadius] = useState('lg');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getThemeRadius = () => {
            const rootStyles = getComputedStyle(document.documentElement);
            const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
            const radiusValue = parseInt(borderRadius);
            if (radiusValue === 0) return 'none';
            if (radiusValue <= 4) return 'sm';
            if (radiusValue <= 8) return 'md';
            if (radiusValue <= 12) return 'lg';
            return 'xl';
        };
        setThemeRadius(getThemeRadius());
        
        // Simulate checking delay
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    const handleContinue = () => {
        router.visit(route('install.database'));
    };

    const handleBack = () => {
        router.visit(route('install.license'));
    };

    const renderCheckItem = (check) => (
        <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
                {check.passed ? (
                    <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0" />
                ) : (
                    <XCircleIcon className="w-6 h-6 text-danger flex-shrink-0" />
                )}
                <div className="flex-1">
                    <p className="font-medium text-foreground">{check.name}</p>
                    {check.path && (
                        <p className="text-xs text-default-500 mt-0.5">{check.path}</p>
                    )}
                </div>
            </div>
            <Chip
                color={check.passed ? 'success' : 'danger'}
                variant="flat"
                size="sm"
                radius={themeRadius}
            >
                {check.value}
            </Chip>
        </div>
    );

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen bg-gradient-to-br from-background via-content1 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    {/* Progress Indicator */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-primary font-semibold">Step 2 of 6</span>
                            <span className="text-default-500">System Requirements</span>
                        </div>
                        <div className="mt-2 h-2 bg-default-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '33.33%' }}></div>
                        </div>
                    </div>

                    {/* Main Card */}
                    <ThemedCard>
                        <ThemedCardHeader>
                            <div className="flex items-center gap-3">
                                <ClipboardDocumentCheckIcon className="w-8 h-8 text-primary" />
                                <div>
                                    <h2 className="text-2xl font-semibold">System Requirements</h2>
                                    <p className="text-sm text-default-600 mt-1">
                                        Checking your server configuration
                                    </p>
                                </div>
                            </div>
                        </ThemedCardHeader>
                        <ThemedCardBody>
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Spinner size="lg" color="primary" />
                                    <p className="mt-4 text-default-600">Checking system requirements...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* PHP Version */}
                                    {checks?.php && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">PHP Version</h3>
                                            {renderCheckItem(checks.php)}
                                        </div>
                                    )}

                                    {/* PHP Extensions */}
                                    {checks?.extensions && checks.extensions.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">PHP Extensions</h3>
                                            <div className="space-y-2">
                                                {checks.extensions.map((ext, index) => (
                                                    <div key={index}>
                                                        {renderCheckItem(ext)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Directory Permissions */}
                                    {checks?.permissions && checks.permissions.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Directory Permissions</h3>
                                            <div className="space-y-2">
                                                {checks.permissions.map((perm, index) => (
                                                    <div key={index}>
                                                        {renderCheckItem(perm)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Database Connection */}
                                    {checks?.database && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Database Connection</h3>
                                            {renderCheckItem(checks.database)}
                                        </div>
                                    )}

                                    {/* Status Summary */}
                                    <div className={`p-4 rounded-lg border-2 ${
                                        canProceed 
                                            ? 'bg-success/10 border-success/20' 
                                            : 'bg-danger/10 border-danger/20'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            {canProceed ? (
                                                <>
                                                    <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold text-success mb-1">
                                                            All Requirements Met
                                                        </p>
                                                        <p className="text-sm text-default-700 dark:text-default-300">
                                                            Your server meets all requirements. You can proceed with the installation.
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircleIcon className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold text-danger mb-1">
                                                            Requirements Not Met
                                                        </p>
                                                        <p className="text-sm text-default-700 dark:text-default-300">
                                                            Please fix the issues above before proceeding. Contact your hosting provider if needed.
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            variant="flat"
                                            radius={themeRadius}
                                            onPress={handleBack}
                                        >
                                            Back
                                        </Button>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="flat"
                                                radius={themeRadius}
                                                onPress={() => router.reload()}
                                            >
                                                Recheck
                                            </Button>
                                            <Button
                                                color="primary"
                                                radius={themeRadius}
                                                onPress={handleContinue}
                                                isDisabled={!canProceed}
                                                endContent={<CheckCircleIcon className="w-5 h-5" />}
                                            >
                                                Continue
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ThemedCardBody>
                    </ThemedCard>
                </div>
            </div>
        </>
    );
}
