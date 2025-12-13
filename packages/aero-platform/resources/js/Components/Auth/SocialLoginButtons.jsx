import React from 'react';
import { Button, Divider } from '@heroui/react';
import { motion } from 'framer-motion';

/**
 * Social Login Buttons Component
 * 
 * Displays OAuth provider buttons for Google, Microsoft, and GitHub.
 * Only shows providers that are configured in the backend.
 * 
 * @param {Array} providers - List of available OAuth providers from backend
 * @param {boolean} isLoading - Whether a login action is in progress
 */
export default function SocialLoginButtons({ providers = [], isLoading = false }) {
    if (!providers || providers.length === 0) {
        return null;
    }

    const getProviderStyles = (provider) => {
        switch (provider.name) {
            case 'google':
                return {
                    bg: 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700',
                    border: 'border-gray-300 dark:border-gray-600',
                    text: 'text-gray-700 dark:text-gray-200',
                };
            case 'microsoft':
                return {
                    bg: 'bg-[#2F2F2F] hover:bg-[#404040]',
                    border: 'border-transparent',
                    text: 'text-white',
                };
            case 'github':
                return {
                    bg: 'bg-[#24292F] hover:bg-[#32383F] dark:bg-gray-900 dark:hover:bg-gray-800',
                    border: 'border-transparent',
                    text: 'text-white',
                };
            default:
                return {
                    bg: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
                    border: 'border-gray-300 dark:border-gray-600',
                    text: 'text-gray-700 dark:text-gray-200',
                };
        }
    };

    const ProviderIcon = ({ name }) => {
        switch (name) {
            case 'google':
                return (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                );
            case 'microsoft':
                return (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#F25022" d="M1 1h10.5v10.5H1z"/>
                        <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/>
                        <path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/>
                        <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/>
                    </svg>
                );
            case 'github':
                return (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                );
            default:
                return null;
        }
    };

    const handleSocialLogin = (url) => {
        // Navigate to OAuth redirect URL
        window.location.href = url;
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            <div className="relative">
                <Divider className="my-4" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
                    Or continue with
                </span>
            </div>

            <div className={`grid gap-3 ${providers.length === 1 ? 'grid-cols-1' : providers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {providers.map((provider) => {
                    const styles = getProviderStyles(provider);
                    return (
                        <Button
                            key={provider.name}
                            className={`w-full ${styles.bg} ${styles.text} border ${styles.border} transition-all duration-200 font-medium`}
                            size="lg"
                            variant="bordered"
                            isDisabled={isLoading}
                            onPress={() => handleSocialLogin(provider.url)}
                            startContent={<ProviderIcon name={provider.name} />}
                        >
                            {providers.length === 1 ? `Continue with ${provider.label}` : provider.label}
                        </Button>
                    );
                })}
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
        </motion.div>
    );
}
