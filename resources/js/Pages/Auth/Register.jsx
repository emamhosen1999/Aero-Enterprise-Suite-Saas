import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    UserIcon,
    EnvelopeIcon, 
    LockClosedIcon,
    ShieldCheckIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Input, Button as HeroButton, Checkbox as HeroCheckbox } from '@heroui/react';
import AuthLayout from '@/Components/AuthLayout';
import Button from '@/Components/Button';
import Checkbox from '@/Components/Checkbox';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

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
        
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Create account"
           
        >
            <Head title="Register" />

            <form onSubmit={submit} className="auth-form-spacing">{/* Using responsive spacing class */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Input
                        type="text"
                        label="Full name"
                        placeholder="Enter your full name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        isInvalid={!!errors.name}
                        errorMessage={errors.name}
                        autoComplete="name"
                        autoFocus
                        isRequired
                        startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                        InputProps={{
                            startAdornment: (
                                <UserIcon className="w-4 h-4 text-default-400 pointer-events-none shrink-0 mr-2" />
                            ),
                            sx: {
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: '12px',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.08)',
                                },
                                '&.Mui-focused': {
                                    background: 'rgba(255, 255, 255, 0.08)',
                                },
                            }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                        }}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Input
                        type="email"
                        label="Email address"
                        placeholder="Enter your email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        isInvalid={!!errors.email}
                        errorMessage={errors.email}
                        autoComplete="username"
                        isRequired
                        startContent={<EnvelopeIcon className="w-4 h-4 text-default-400" />}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div>
                        <Input
                            type={isPasswordVisible ? "text" : "password"}
                            label="Password"
                            placeholder="Create a strong password"
                            value={data.password}
                            onChange={handlePasswordChange}
                            isInvalid={!!errors.password}
                            errorMessage={errors.password}
                            autoComplete="new-password"
                            isRequired
                            startContent={<LockClosedIcon className="w-4 h-4 text-default-400" />}
                            endContent={
                                <button
                                    className="focus:outline-none"
                                    type="button"
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {isPasswordVisible ? (
                                        <EyeSlashIcon className="w-4 h-4 text-default-400" />
                                    ) : (
                                        <EyeIcon className="w-4 h-4 text-default-400" />
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
                        label="Confirm password"
                        placeholder="Confirm your password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        isInvalid={!!errors.password_confirmation}
                        errorMessage={errors.password_confirmation}
                        autoComplete="new-password"
                        isRequired
                        startContent={<LockClosedIcon className="w-4 h-4 text-default-400" />}
                        endContent={
                            <button
                                className="focus:outline-none"
                                type="button"
                                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                            >
                                {isConfirmPasswordVisible ? (
                                    <EyeSlashIcon className="w-4 h-4 text-default-400" />
                                ) : (
                                    <EyeIcon className="w-4 h-4 text-default-400" />
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
                    <Checkbox
                        checked={data.terms}
                        onChange={(e) => setData('terms', e.target.checked)}
                        error={errors.terms}
                        label={
                            <span>
                                I agree to the{' '}
                                <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                                    <Link
                                        href="#"
                                        className="underline transition-colors duration-200"
                                        style={{ color: 'var(--theme-primary)' }}
                                    >
                                        Terms of Service
                                    </Link>
                                </motion.span>
                                {' '}and{' '}
                                <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                                    <Link
                                        href="#"
                                        className="underline transition-colors duration-200"
                                        style={{ color: 'var(--theme-primary)' }}
                                    >
                                        Privacy Policy
                                    </Link>
                                </motion.span>
                            </span>
                        }
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <HeroButton
                        type="submit"
                        color="primary"
                        size="lg"
                        className="w-full"
                        isLoading={processing}
                        disabled={processing}
                    >
                        {processing ? 'Creating account...' : 'Create account'}
                    </HeroButton>
                </motion.div>

                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Already have an account?{' '}
                        <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                            <Link
                                href={route('login')}
                                className="font-medium transition-colors duration-200 hover:underline"
                                style={{ color: 'var(--theme-primary)' }}
                            >
                                Sign in here
                            </Link>
                        </motion.span>
                    </p>
                </motion.div>
                {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 1.2 }}
                            className="mt-3"
                        >
                            <p className="text-xs text-default-500 text-center opacity-60">
                                © 2025 Emam Hosen. All rights reserved.
                            </p>
                        </motion.div>
            </form>

           
        </AuthLayout>
    );
}
