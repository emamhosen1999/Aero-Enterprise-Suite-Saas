import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import { 
    CheckCircleIcon,
    ArrowRightIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

export default function AlreadyInstalled({ title, appUrl }) {
    const [themeRadius, setThemeRadius] = useState('lg');

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
    }, []);

    const handleGoToLogin = () => {
        window.location.href = appUrl || '/';
    };

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen bg-gradient-to-br from-background via-content1 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <ThemedCard>
                        <ThemedCardBody>
                            <div className="text-center py-12 px-4">
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-success/20 blur-3xl rounded-full"></div>
                                        <ShieldCheckIcon className="w-24 h-24 text-success relative" />
                                    </div>
                                </div>

                                <h1 className="text-4xl font-bold text-foreground mb-4">
                                    Already Installed
                                </h1>
                                
                                <p className="text-lg text-default-600 mb-8 max-w-md mx-auto">
                                    Your system has already been installed and configured. 
                                    You can proceed to the login page.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        radius={themeRadius}
                                        onPress={handleGoToLogin}
                                        endContent={<ArrowRightIcon className="w-5 h-5" />}
                                    >
                                        Go to Login
                                    </Button>
                                </div>

                                <div className="mt-12 pt-8 border-t border-divider">
                                    <p className="text-sm text-default-500">
                                        Need help? Contact your system administrator.
                                    </p>
                                </div>
                            </div>
                        </ThemedCardBody>
                    </ThemedCard>

                    {/* Footer */}
                    <div className="text-center mt-8 text-sm text-default-500">
                        <p>© {new Date().getFullYear()} Aero Enterprise Suite. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
