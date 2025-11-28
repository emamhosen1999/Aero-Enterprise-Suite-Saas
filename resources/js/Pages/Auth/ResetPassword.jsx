import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    LockClosedIcon,
    KeyIcon,
    ShieldCheckIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Input, Button as HeroButton, Checkbox as HeroCheckbox } from '@heroui/react';
import AuthLayout from '@/Components/AuthLayout';
import Button from '@/Components/Button';
import { useTheme } from '@/Contexts/ThemeContext';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        verification_code: '',
        password: '',
        password_confirmation: '',
    });

    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const theme = useTheme();

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;
        setData('password', password);
        setPasswordStrength(calculatePasswordStrength(password));
    };

    const getPasswordStrengthText = () => {
        switch (passwordStrength) {
            case 0:
            case 1:
                return 'Very weak';
            case 2:
                return 'Weak';
            case 3:
                return 'Fair';
            case 4:
                return 'Good';
            case 5:
                return 'Strong';
            default:
                return '';
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0:
            case 1:
                return theme.palette.error.main;
            case 2:
                return '#f59e0b';
            case 3:
                return '#eab308';
            case 4:
                return theme.palette.primary.main;
            case 5:
                return theme.palette.success.main;
            default:
                return theme.palette.grey[300];
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('password.update'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Set new password"
            subtitle="Enter the verification code and create a new secure password"
        >
            <Head title="Reset Password" />

            <form onSubmit={submit} className="space-y-6">
                {/* Email Display */}
                <motion.div
                    className="p-4 rounded-xl border"
                    style={{
                        background: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.8)',
                        borderColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <p className="text-sm" style={{ color: theme.palette.text.secondary }}>
                        Resetting password for: <span className="font-medium" style={{ color: theme.palette.text.primary }}>{email}</span>
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Input
                        type="text"
                        label="Verification code"
                        placeholder="Enter 6-digit code from email"
                        value={data.verification_code}
                        onChange={(e) => setData('verification_code', e.target.value)}
                        isInvalid={!!errors.verification_code}
                        errorMessage={errors.verification_code}
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={6}
                        isRequired
                        startContent={<KeyIcon className="w-4 h-4 text-default-400" />}
                    />
                    <motion.p
                        className="text-xs mt-2"
                        style={{ color: theme.palette.text.secondary }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Check your email for the 6-digit verification code
                    </motion.p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div>
                        <Input
                            type={isPasswordVisible ? "text" : "password"}
                            label="New password"
                            placeholder="Create a strong password"
                            value={data.password}
                            onChange={handlePasswordChange}
                            isInvalid={!!errors.password}
                            errorMessage={errors.password}
                            autoComplete="new-password"
                            isRequired
                            startContent={<LockClosedIcon className="w-4 h-4 text-default-400 pointer-events-none shrink-0" />}
                            endContent={
                                <button
                                    className="focus:outline-hidden"
                                    type="button"
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                >
                                    {isPasswordVisible ? (
                                        <EyeSlashIcon className="w-4 h-4 text-default-400 pointer-events-none" />
                                    ) : (
                                        <EyeIcon className="w-4 h-4 text-default-400 pointer-events-none" />
                                    )}
                                </button>
                            }
                        />
                        
                        {/* Password Strength Indicator */}
                        {data.password && (
                            <motion.div
                                className="mt-3 space-y-2"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div 
                                        className="flex-1 h-2 rounded-full overflow-hidden"
                                        style={{ backgroundColor: theme.palette.grey[200] }}
                                    >
                                        <motion.div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ backgroundColor: getPasswordStrengthColor() }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                                        />
                                    </div>
                                    <motion.span
                                        className="text-xs font-medium w-20 text-right"
                                        style={{ color: getPasswordStrengthColor() }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {getPasswordStrengthText()}
                                    </motion.span>
                                </div>
                                <motion.p
                                    className="text-xs"
                                    style={{ color: theme.palette.text.secondary }}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Use 8+ characters with uppercase, lowercase, numbers, and symbols
                                </motion.p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Input
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        label="Confirm new password"
                        placeholder="Confirm your new password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        isInvalid={!!errors.password_confirmation}
                        errorMessage={errors.password_confirmation}
                        autoComplete="new-password"
                        isRequired
                        startContent={<LockClosedIcon className="w-4 h-4 text-default-400 pointer-events-none shrink-0" />}
                        endContent={
                            <button
                                className="focus:outline-hidden"
                                type="button"
                                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                            >
                                {isConfirmPasswordVisible ? (
                                    <EyeSlashIcon className="w-4 h-4 text-default-400 pointer-events-none" />
                                ) : (
                                    <EyeIcon className="w-4 h-4 text-default-400 pointer-events-none" />
                                )}
                            </button>
                        }
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <HeroButton
                        type="submit"
                        color="primary"
                        size="lg"
                        className="w-full"
                        isLoading={processing}
                        disabled={processing}
                    >
                        {processing ? 'Updating password...' : 'Update password'}
                    </HeroButton>
                </motion.div>
            </form>

            {/* Security Notice */}
            <motion.div
                className="mt-8 p-4 rounded-xl border"
                style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 0.2)',
                    backdropFilter: 'blur(10px)'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <div className="flex items-start">
                    <motion.div
                        className="shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: "spring", stiffness: 500 }}
                    >
                        <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                    </motion.div>
                    <div className="ml-3">
                        <motion.h3
                            className="text-sm font-medium text-green-800"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            Secure Password Reset
                        </motion.h3>
                        <motion.div 
                            className="text-sm text-green-700 mt-2 space-y-1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 }}
                        >
                            <p>• Your password reset is protected with two-factor verification</p>
                            <p>• All sessions will be invalidated after password change</p>
                            <p>• This activity is logged for security monitoring</p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </AuthLayout>
    );
}
