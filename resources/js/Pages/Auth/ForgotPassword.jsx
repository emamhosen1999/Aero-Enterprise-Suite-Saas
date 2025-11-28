import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    EnvelopeIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { Input, Button as HeroButton, Checkbox as HeroCheckbox } from '@heroui/react';
import AuthLayout from '@/Components/AuthLayout';
import Button from '@/Components/Button';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (status) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 12000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout
            title="Reset password"
            subtitle="Enter your email to receive a password reset link"
        >
            <Head title="Forgot Password" />

            {/* Success Message */}
            {status && showSuccess && (
                <motion.div
                    className="mb-6 p-4 rounded-xl border"
                    style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 0.3)',
                        backdropFilter: 'blur(10px)'
                    }}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, type: "spring" }}
                >
                    <div className="flex items-center">
                        <motion.div
                            className="shrink-0"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                        >
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        </motion.div>
                        <div className="ml-3">
                            <motion.h3
                                className="text-sm font-medium text-green-800"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Reset link sent
                            </motion.h3>
                            <motion.p
                                className="text-sm text-green-700 mt-1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {status}
                            </motion.p>
                        </div>
                    </div>
                </motion.div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Input
                        type="email"
                        label="Email address"
                        placeholder="Enter your email address"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        isInvalid={!!errors.email}
                        errorMessage={errors.email}
                        autoComplete="username"
                        autoFocus
                        isRequired
                        startContent={<EnvelopeIcon className="w-4 h-4 text-default-400" />}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <HeroButton
                        type="submit"
                        color="primary"
                        size="lg"
                        className="w-full"
                        isLoading={processing}
                        disabled={processing}
                    >
                        {processing ? 'Sending...' : 'Send reset link'}
                    </HeroButton>
                </motion.div>

                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                            href={route('login')}
                            className="inline-flex items-center text-sm font-medium transition-colors duration-200"
                            style={{ color: theme.palette.text.secondary }}
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            Back to login
                        </Link>
                    </motion.div>
                </motion.div>
            </form>

            {/* Information */}
            <motion.div
                className="mt-8 p-4 rounded-xl border"
                style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                    backdropFilter: 'blur(10px)'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="flex items-start">
                    <motion.div
                        className="shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
                    >
                        <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                    </motion.div>
                    <div className="ml-3">
                        <motion.h3
                            className="text-sm font-medium text-blue-800"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            Secure Reset Process
                        </motion.h3>
                        <motion.div 
                            className="text-sm text-blue-700 mt-2 space-y-1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <p>• Reset links expire after 1 hour for security</p>
                            <p>• You'll receive a verification code via email</p>
                            <p>• All reset attempts are logged for security</p>
                            <p>• Check your spam folder if you don't see the email</p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Support */}
            <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <p className="text-sm" style={{ color: theme.palette.text.secondary }}>
                    Still having trouble?{' '}
                    <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                        <Link
                            href="#"
                            className="font-medium transition-colors duration-200"
                            style={{ color: 'var(--theme-primary)' }}
                        >
                            Contact support
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
        </AuthLayout>
    );
}
