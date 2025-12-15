import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    EnvelopeIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Spinner } from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext';
import { useBranding } from '@/Hooks/useBranding';

/**
 * Verify Email Component
 * UI matches Login page exactly
 */

// Device type detection hook
const useDeviceType = () => {
    const [deviceState, setDeviceState] = useState({
        isMobile: false,
        isTablet: false,
        isDesktop: false
    });

    const updateDeviceType = useCallback(() => {
        const width = window.innerWidth;
        setDeviceState({
            isMobile: width <= 768,
            isTablet: width > 768 && width <= 1024,
            isDesktop: width > 1024
        });
    }, []);

    useEffect(() => {
        updateDeviceType();
        window.addEventListener('resize', updateDeviceType);
        return () => window.removeEventListener('resize', updateDeviceType);
    }, [updateDeviceType]);

    return deviceState;
};

export default function VerifyEmail({ status }) {
    const { themeSettings } = useTheme();
    const { logo, siteName } = useBranding();
    const { isMobile } = useDeviceType();
    const [isLoaded, setIsLoaded] = useState(false);

    const { post, processing } = useForm({});

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const getThemeRadius = () => {
        const borderRadius = themeSettings?.layout?.borderRadius;
        if (!borderRadius) return 'lg';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }
        }
    };

    return (
        <>
            <Head title="Verify Email" />
            
            <div 
                className="min-h-screen flex items-center justify-center p-4 relative"
                style={{
                    fontFamily: `var(--fontFamily, 'Inter')`,
                    transform: `scale(var(--scale, 1))`,
                    transformOrigin: 'center center'
                }}
            >
                {/* Floating Elements */}
                <motion.div
                    className="absolute top-20 left-20 w-20 h-20 rounded-full hidden lg:block"
                    style={{
                        background: `linear-gradient(135deg, 
                            color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent),
                            color-mix(in srgb, var(--theme-secondary, #7C3AED) 12%, transparent)
                        )`,
                        backdropFilter: 'blur(20px)',
                        border: '1px solid color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)',
                        transform: `scale(var(--scale, 1))`
                    }}
                    animate={{ 
                        y: [-10, 10, -10],
                        rotate: [0, 180, 360],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                        duration: 20, 
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                <motion.div
                    className="absolute bottom-20 right-20 w-16 h-16 rounded-full hidden lg:block"
                    style={{
                        background: `linear-gradient(135deg,
                            color-mix(in srgb, var(--theme-secondary, #7C3AED) 18%, transparent),
                            color-mix(in srgb, var(--theme-primary, #006FEE) 12%, transparent)
                        )`,
                        backdropFilter: 'blur(20px)',
                        border: '1px solid color-mix(in srgb, var(--theme-secondary, #7C3AED) 20%, transparent)',
                        transform: `scale(var(--scale, 1))`
                    }}
                    animate={{ 
                        x: [-8, 8, -8],
                        scale: [1, 1.1, 1],
                        rotate: [0, -180, 0]
                    }}
                    transition={{ 
                        duration: 15, 
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 5
                    }}
                />

                {/* Form Card */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isLoaded ? "visible" : "hidden"}
                    className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'}`}
                >
                    <Card
                        className="backdrop-blur-xl border-none shadow-2xl"
                        style={{
                            background: `linear-gradient(to bottom right, 
                                color-mix(in srgb, var(--theme-content1, #FAFAFA) 98%, transparent), 
                                color-mix(in srgb, var(--theme-content2, #F4F4F5) 95%, transparent)
                            )`,
                            borderColor: 'color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)',
                            borderWidth: 'var(--borderWidth, 2px)',
                            borderStyle: 'solid',
                            borderRadius: `var(--borderRadius, ${isMobile ? '20px' : '24px'})`,
                            fontFamily: 'var(--fontFamily, "Inter")',
                            transform: `scale(var(--scale, 1))`,
                            boxShadow: `
                                0 20px 40px color-mix(in srgb, var(--theme-shadow, #000000) 15%, transparent),
                                0 8px 16px color-mix(in srgb, var(--theme-shadow, #000000) 10%, transparent),
                                inset 0 1px 0 color-mix(in srgb, var(--theme-background, #FFFFFF) 50%, transparent)
                            `
                        }}
                    >
                        <div className={`${isMobile ? 'p-6' : 'p-8'}`}>
                            {/* Header Section */}
                            <motion.div
                                variants={itemVariants}
                                className="text-center mb-8"
                            >
                                {/* Logo */}
                                <motion.div
                                    className="flex justify-center mb-6"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                >
                                    {logo ? (
                                        <img 
                                            src={logo} 
                                            alt={siteName} 
                                            className={`${isMobile ? 'h-16' : 'h-20'} w-auto object-contain`}
                                        />
                                    ) : (
                                        <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white`}>
                                            {siteName?.charAt(0) || 'A'}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Email Icon */}
                                <motion.div
                                    className="flex justify-center mb-4"
                                    animate={{ 
                                        y: [0, -8, 0],
                                    }}
                                    transition={{ 
                                        duration: 2, 
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <div 
                                        className="w-16 h-16 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'color-mix(in srgb, var(--theme-primary, #006FEE) 12%, transparent)',
                                            border: '2px solid color-mix(in srgb, var(--theme-primary, #006FEE) 25%, transparent)'
                                        }}
                                    >
                                        <EnvelopeIcon 
                                            className="w-8 h-8"
                                            style={{ color: 'var(--theme-primary, #006FEE)' }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Title */}
                                <h1 
                                    className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-2`}
                                    style={{ 
                                        color: 'var(--theme-foreground, #11181C)',
                                        background: `linear-gradient(135deg, 
                                            var(--theme-foreground, #11181C), 
                                            color-mix(in srgb, var(--theme-foreground, #11181C) 80%, var(--theme-primary, #006FEE))
                                        )`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                    }}
                                >
                                    Verify Your Email
                                </h1>
                                <p 
                                    className="text-sm leading-relaxed"
                                    style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.7 }}
                                >
                                    Thanks for signing up! Before getting started, please verify your email address by clicking the link we just sent you.
                                </p>
                            </motion.div>

                            {/* Status Message */}
                            {status === 'verification-link-sent' && (
                                <motion.div
                                    variants={itemVariants}
                                    className="mb-6"
                                >
                                    <Card
                                        className="border-none"
                                        style={{
                                            background: 'color-mix(in srgb, var(--theme-success, #22C55E) 12%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--theme-success, #22C55E) 30%, transparent)',
                                            borderWidth: 'var(--borderWidth, 2px)',
                                            borderStyle: 'solid',
                                            borderRadius: `var(--borderRadius, 12px)`,
                                            fontFamily: 'var(--fontFamily, "Inter")',
                                            transform: `scale(var(--scale, 1))`
                                        }}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center gap-3">
                                                <CheckCircleIcon 
                                                    className="w-5 h-5 flex-shrink-0"
                                                    style={{ color: 'var(--theme-success, #22C55E)' }}
                                                />
                                                <p 
                                                    className="text-sm font-medium"
                                                    style={{ color: 'var(--theme-success-foreground, #166534)' }}
                                                >
                                                    A new verification link has been sent to your email address.
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Actions */}
                            <form onSubmit={submit} className="space-y-4">
                                {/* Resend Button */}
                                <motion.div variants={itemVariants}>
                                    <Button
                                        type="submit"
                                        color="primary"
                                        size="lg"
                                        radius={getThemeRadius()}
                                        className="w-full font-semibold"
                                        isLoading={processing}
                                        startContent={!processing && <ArrowPathIcon className="w-4 h-4" />}
                                        style={{
                                            background: `linear-gradient(135deg, 
                                                var(--theme-primary, #006FEE),
                                                color-mix(in srgb, var(--theme-primary, #006FEE) 85%, var(--theme-secondary, #7C3AED))
                                            )`,
                                            boxShadow: `
                                                0 4px 14px color-mix(in srgb, var(--theme-primary, #006FEE) 40%, transparent),
                                                0 2px 6px color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)
                                            `
                                        }}
                                    >
                                        {processing ? 'Sending...' : 'Resend Verification Email'}
                                    </Button>
                                </motion.div>

                                {/* Helpful Tips */}
                                <motion.div variants={itemVariants}>
                                    <Card
                                        className="border-none"
                                        style={{
                                            background: 'color-mix(in srgb, var(--theme-warning, #F5A524) 10%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--theme-warning, #F5A524) 25%, transparent)',
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                            borderRadius: `var(--borderRadius, 12px)`
                                        }}
                                    >
                                        <div className="p-4">
                                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--theme-warning, #F5A524)' }}>
                                                Can't find the email?
                                            </p>
                                            <ul className="text-xs space-y-1" style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.7 }}>
                                                <li>• Check your spam or junk folder</li>
                                                <li>• Make sure you registered with the correct email</li>
                                                <li>• Click resend if needed - links expire after 60 minutes</li>
                                            </ul>
                                        </div>
                                    </Card>
                                </motion.div>

                                {/* Logout Link */}
                                <motion.div variants={itemVariants} className="text-center pt-2">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                                        style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.7 }}
                                    >
                                        <ArrowLeftIcon className="w-4 h-4" />
                                        Log Out & Use Different Account
                                    </Link>
                                </motion.div>
                            </form>
                        </div>
                    </Card>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                        className="mt-6"
                    >
                        <p className="text-xs text-center" style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.5 }}>
                            © 2025 {siteName}. All rights reserved.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
}
