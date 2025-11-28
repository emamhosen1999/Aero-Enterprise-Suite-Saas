import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    EnvelopeIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Button as HeroButton } from '@heroui/react';
import AuthLayout from '@/Components/AuthLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});
    const { app } = usePage().props;
    const [emailSent, setEmailSent] = useState(false);
    const { isDark } = useTheme();
    const primaryColor = getThemePrimaryColor();

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'), {
            onSuccess: () => setEmailSent(true),
        });
    };

    return (
        <AuthLayout
            title="Verify your email"
            subtitle="Check your email for a verification link to continue"
        >
            <Head title="Email Verification" />

            <div className="text-center space-y-6">
                {/* Animated Icon */}
                <motion.div
                    className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.2)}, ${hexToRgba(primaryColor, 0.1)})`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${hexToRgba(primaryColor, 0.3)}`
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                        delay: 0.2, 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 30 
                    }}
                >
                    <EnvelopeIcon 
                        className="w-10 h-10" 
                        style={{ color: primaryColor }}
                    />
                    
                    {/* Pulse animation */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                            background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.1)}, ${hexToRgba(primaryColor, 0.05)})`
                        }}
                        animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>

                {/* Status Messages */}
                {status === 'verification-link-sent' && (
                    <motion.div
                        className="p-4 rounded-xl border"
                        style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            borderColor: 'rgba(34, 197, 94, 0.3)',
                            backdropFilter: 'blur(10px)'
                        }}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, type: "spring" }}
                    >
                        <div className="flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                            >
                                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                            </motion.div>
                            <p className="text-sm font-medium text-green-800">
                                A new verification link has been sent to your email address.
                            </p>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 
                        className={`text-lg font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                        Please verify your email address
                    </h3>
                    <p 
                        className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                        We've sent a verification link to your email address. 
                        Click the link in the email to verify your account and continue to {app?.name || 'the application'}.
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <form onSubmit={submit}>
                        <HeroButton
                            type="submit"
                            color="primary"
                            size="lg"
                            className="w-full"
                            isLoading={processing}
                            disabled={processing}
                        >
                            {processing ? 'Sending...' : 'Resend verification email'}
                        </HeroButton>
                    </form>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            as={Link}
                            href={route('logout')}
                            method="post"
                            variant="secondary"
                            size="lg"
                            className="w-full"
                        >
                            Sign out
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Help Information */}
                <motion.div
                    className="p-4 rounded-xl border"
                    style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderColor: 'rgba(245, 158, 11, 0.2)',
                        backdropFilter: 'blur(10px)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-start">
                        <motion.div
                            className="shrink-0 mr-3 mt-0.5"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring", stiffness: 500 }}
                        >
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                        </motion.div>
                        <div className="text-left">
                            <motion.h4
                                className="text-sm font-medium text-amber-800 mb-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                Didn't receive the email?
                            </motion.h4>
                            <motion.div 
                                className="text-sm text-amber-700 space-y-1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <p>• Check your spam or junk folder</p>
                                <p>• Make sure the email address is correct</p>
                                <p>• Wait a few minutes for the email to arrive</p>
                                <p>• Try resending the verification email</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Support Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Still having trouble?{' '}
                        <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                            <Link
                                href="#"
                                className="font-medium transition-colors duration-200"
                                style={{ color: primaryColor }}
                            >
                                Contact support
                            </Link>
                        </motion.span>
                    </p>
                </motion.div>
            </div>
        </AuthLayout>
    );
}
