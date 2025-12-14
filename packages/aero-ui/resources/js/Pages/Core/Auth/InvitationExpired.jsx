import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
} from '@heroui/react';
import {
    AlertCircle,
    ArrowLeft,
    Mail,
} from 'lucide-react';

// Helper function to convert theme borderRadius to HeroUI radius values
const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 16) return 'lg';
    return 'full';
};

export default function InvitationExpired({ message }) {
    const [themeRadius, setThemeRadius] = useState('lg');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);

    return (
        <>
            <Head title="Invitation Invalid" />
            
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-900 dark:to-black p-4">
                <Card
                    className="w-full max-w-md text-center"
                    radius={themeRadius}
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
                    <CardBody className="py-12 px-6">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-full bg-danger/10">
                                <AlertCircle className="w-12 h-12 text-danger" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-3">
                            Invitation Unavailable
                        </h1>

                        <p className="text-default-500 mb-8">
                            {message || 'This invitation link is no longer valid.'}
                        </p>

                        <div className="space-y-3">
                            <p className="text-sm text-default-400">
                                If you believe this is an error, please contact your team administrator to request a new invitation.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                                <Link href="/login">
                                    <Button
                                        variant="flat"
                                        radius={themeRadius}
                                        startContent={<ArrowLeft className="w-4 h-4" />}
                                    >
                                        Go to Login
                                    </Button>
                                </Link>
                                <a href="mailto:support@example.com">
                                    <Button
                                        color="primary"
                                        radius={themeRadius}
                                        startContent={<Mail className="w-4 h-4" />}
                                    >
                                        Contact Support
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
