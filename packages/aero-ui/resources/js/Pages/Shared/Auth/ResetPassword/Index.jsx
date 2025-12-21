import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { Input, Button, Card, Progress } from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext';
import { useBranding } from '@/Hooks/useBranding';

/**
 * Reset Password Component
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

// Password strength calculator
const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'default' };
    
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    const strengthMap = {
        0: { label: '', color: 'default' },
        1: { label: 'Very Weak', color: 'danger' },
        2: { label: 'Weak', color: 'warning' },
        3: { label: 'Fair', color: 'warning' },
        4: { label: 'Good', color: 'primary' },
        5: { label: 'Strong', color: 'success' },
    };
    
    return { score, ...strengthMap[score], checks };
};

export default function ResetPassword({ token, email }) {
    const { themeSettings } = useTheme();
    const { logo, siteName } = useBranding();
    const { isMobile } = useDeviceType();
    const [isLoaded, setIsLoaded] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: 'default' });

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        setPasswordStrength(calculatePasswordStrength(data.password));
    }, [data.password]);

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
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
        post(route('password.store'));
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
            <Head title="Reset Password" />
            
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

                <motion.div
                    className="absolute top-1/3 right-32 w-12 h-12 rounded-full hidden lg:block"
                    style={{
                        background: `linear-gradient(135deg,
                            color-mix(in srgb, var(--theme-success, #22C55E) 15%, transparent),
                            color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)
                        )`,
                        backdropFilter: 'blur(20px)',
                        border: '1px solid color-mix(in srgb, var(--theme-success, #22C55E) 20%, transparent)',
                        transform: `scale(var(--scale, 1))`
                    }}
                    animate={{ 
                        y: [5, -5, 5],
                        x: [0, 5, 0]
                    }}
                    transition={{ 
                        duration: 8, 
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
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
                                    Reset Password
                                </h1>
                                <p 
                                    className="text-sm"
                                    style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.7 }}
                                >
                                    Create a new secure password for your account
                                </p>
                            </motion.div>

                            {/* Email Display */}
                            <motion.div variants={itemVariants} className="mb-6">
                                <Card
                                    className="border-none"
                                    style={{
                                        background: 'color-mix(in srgb, var(--theme-primary, #006FEE) 8%, transparent)',
                                        borderColor: 'color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)',
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        borderRadius: `var(--borderRadius, 12px)`
                                    }}
                                >
                                    <div className="p-3">
                                        <p className="text-xs" style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.6 }}>
                                            Resetting password for:
                                        </p>
                                        <p className="text-sm font-medium" style={{ color: 'var(--theme-primary, #006FEE)' }}>
                                            {email}
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Form */}
                            <form onSubmit={submit} className="space-y-5" noValidate>
                                {/* Password Field */}
                                <motion.div variants={itemVariants}>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        label="New Password"
                                        placeholder="Enter new password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        isInvalid={!!errors.password}
                                        errorMessage={errors.password}
                                        autoComplete="new-password"
                                        autoFocus
                                        isRequired
                                        size="lg"
                                        radius={getThemeRadius()}
                                        variant="bordered"
                                        color={errors.password ? "danger" : "primary"}
                                        startContent={
                                            <LockClosedIcon 
                                                className="w-4 h-4"
                                                style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.6 }}
                                            />
                                        }
                                        endContent={
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => setShowPassword(!showPassword)}
                                                tabIndex={-1}
                                            >
                                                {showPassword ? (
                                                    <EyeSlashIcon className="w-4 h-4" />
                                                ) : (
                                                    <EyeIcon className="w-4 h-4" />
                                                )}
                                            </Button>
                                        }
                                    />

                                    {/* Password Strength Indicator */}
                                    {data.password && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-3 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs" style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.7 }}>
                                                    Password Strength
                                                </span>
                                                <span className={`text-xs font-medium text-${passwordStrength.color}`}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>
                                            <Progress
                                                value={(passwordStrength.score / 5) * 100}
                                                color={passwordStrength.color}
                                                size="sm"
                                                radius={getThemeRadius()}
                                            />
                                            
                                            {/* Password Requirements */}
                                            {passwordStrength.checks && (
                                                <div className="grid grid-cols-2 gap-1 mt-2">
                                                    {[
                                                        { key: 'length', label: '8+ characters' },
                                                        { key: 'uppercase', label: 'Uppercase' },
                                                        { key: 'lowercase', label: 'Lowercase' },
                                                        { key: 'numbers', label: 'Numbers' },
                                                        { key: 'special', label: 'Special char' }
                                                    ].map(({ key, label }) => (
                                                        <div key={key} className="flex items-center gap-1.5">
                                                            {passwordStrength.checks[key] ? (
                                                                <CheckCircleIcon className="w-3.5 h-3.5 text-success" />
                                                            ) : (
                                                                <XCircleIcon className="w-3.5 h-3.5 text-default-300" />
                                                            )}
                                                            <span 
                                                                className="text-xs"
                                                                style={{ 
                                                                    color: passwordStrength.checks[key] 
                                                                        ? 'var(--theme-success, #22C55E)' 
                                                                        : 'var(--theme-foreground, #11181C)',
                                                                    opacity: passwordStrength.checks[key] ? 1 : 0.5
                                                                }}
                                                            >
                                                                {label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* Confirm Password Field */}
                                <motion.div variants={itemVariants}>
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        label="Confirm Password"
                                        placeholder="Confirm new password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        isInvalid={!!errors.password_confirmation}
                                        errorMessage={errors.password_confirmation}
                                        autoComplete="new-password"
                                        isRequired
                                        size="lg"
                                        radius={getThemeRadius()}
                                        variant="bordered"
                                        color={errors.password_confirmation ? "danger" : 
                                            (data.password_confirmation && data.password === data.password_confirmation) ? "success" : "primary"}
                                        startContent={
                                            <LockClosedIcon 
                                                className="w-4 h-4"
                                                style={{ color: 'var(--theme-foreground, #11181C)', opacity: 0.6 }}
                                            />
                                        }
                                        endContent={
                                            <div className="flex items-center gap-1">
                                                {data.password_confirmation && data.password === data.password_confirmation && (
                                                    <CheckCircleIcon className="w-4 h-4 text-success" />
                                                )}
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeSlashIcon className="w-4 h-4" />
                                                    ) : (
                                                        <EyeIcon className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        }
                                    />
                                    
                                    {/* Password match indicator */}
                                    {data.password_confirmation && data.password !== data.password_confirmation && (
                                        <p className="text-xs text-danger mt-1">Passwords do not match</p>
                                    )}
                                </motion.div>

                                {/* Submit Button */}
                                <motion.div variants={itemVariants}>
                                    <Button
                                        type="submit"
                                        color="primary"
                                        size="lg"
                                        radius={getThemeRadius()}
                                        className="w-full font-semibold"
                                        isLoading={processing}
                                        isDisabled={passwordStrength.score < 3 || data.password !== data.password_confirmation}
                                        endContent={!processing && <ArrowRightIcon className="w-4 h-4" />}
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
                                        {processing ? 'Resetting...' : 'Reset Password'}
                                    </Button>
                                </motion.div>

                                {/* Back to Login */}
                                <motion.div variants={itemVariants} className="text-center">
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                                        style={{ color: 'var(--theme-primary, #006FEE)' }}
                                    >
                                        Remember your password? Sign In
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
