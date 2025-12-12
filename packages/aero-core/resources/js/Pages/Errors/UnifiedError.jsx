import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    ExclamationTriangleIcon,
    XCircleIcon,
    ShieldExclamationIcon,
    ClockIcon,
    NoSymbolIcon,
    ServerIcon,
    ArrowPathIcon,
    HomeIcon,
    ClipboardDocumentIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

/**
 * UnifiedError Component
 * 
 * A comprehensive error page component that handles all HTTP error codes with:
 * - Animated UI with Framer Motion
 * - Color-coded error types
 * - Copy trace ID functionality
 * - Context-aware dashboard navigation
 * - Support for backend and frontend error logging
 * 
 * Error codes supported:
 * - 400: Bad Request
 * - 401: Unauthorized
 * - 403: Forbidden
 * - 404: Not Found
 * - 408: Request Timeout
 * - 419: Page Expired (CSRF)
 * - 422: Unprocessable Entity
 * - 429: Too Many Requests
 * - 500: Internal Server Error
 * - 502: Bad Gateway
 * - 503: Service Unavailable
 */
export default function UnifiedError({ error = {} }) {
    const [copied, setCopied] = useState(false);

    // Extract error properties with defaults
    const {
        code = 500,
        type = 'ServerException',
        title = 'Something Went Wrong',
        message = 'An unexpected error occurred. Please try again later.',
        trace_id = null,
        showHomeButton = true,
        showRetryButton = true,
        details = null,
        timestamp = null,
    } = error;

    /**
     * Get error configuration based on HTTP status code
     * Returns appropriate icon, colors, and gradients
     */
    const getErrorConfig = (statusCode) => {
        const configs = {
            400: {
                icon: ExclamationTriangleIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            401: {
                icon: ShieldExclamationIcon,
                color: 'primary',
                gradient: 'from-primary-400 to-primary-600',
                bgGradient: 'from-primary-100 to-primary-200',
            },
            403: {
                icon: NoSymbolIcon,
                color: 'danger',
                gradient: 'from-danger-400 to-danger-600',
                bgGradient: 'from-danger-100 to-danger-200',
            },
            404: {
                icon: ExclamationTriangleIcon,
                color: 'secondary',
                gradient: 'from-secondary-400 to-secondary-600',
                bgGradient: 'from-secondary-100 to-secondary-200',
            },
            408: {
                icon: ClockIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            419: {
                icon: ClockIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            422: {
                icon: ExclamationTriangleIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            429: {
                icon: ClockIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            500: {
                icon: XCircleIcon,
                color: 'danger',
                gradient: 'from-danger-400 to-danger-600',
                bgGradient: 'from-danger-100 to-danger-200',
            },
            502: {
                icon: ServerIcon,
                color: 'danger',
                gradient: 'from-danger-400 to-danger-600',
                bgGradient: 'from-danger-100 to-danger-200',
            },
            503: {
                icon: ServerIcon,
                color: 'secondary',
                gradient: 'from-secondary-400 to-secondary-600',
                bgGradient: 'from-secondary-100 to-secondary-200',
            },
        };

        return configs[statusCode] || configs[500];
    };

    const errorConfig = getErrorConfig(code);
    const ErrorIcon = errorConfig.icon;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    /**
     * Handle retry button click
     * Reloads the current page
     */
    const handleRetry = () => {
        window.location.reload();
    };

    /**
     * Copy trace ID to clipboard
     */
    const handleCopyTraceId = async () => {
        if (!trace_id) return;

        try {
            await navigator.clipboard.writeText(trace_id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy trace ID:', err);
        }
    };

    /**
     * Get appropriate dashboard URL based on domain context
     * Determines if user is on admin, platform, or tenant domain
     */
    const getDashboardUrl = () => {
        const host = window.location.hostname;

        // Admin subdomain - go to admin dashboard
        if (host.startsWith('admin.')) {
            return '/admin/dashboard';
        }

        // Platform domain (no subdomain or www) - go to platform dashboard
        if (host.split('.').length <= 2 || host.startsWith('www.')) {
            return '/platform/dashboard';
        }

        // Tenant subdomain - go to tenant dashboard
        return '/dashboard';
    };

    const dashboardUrl = getDashboardUrl();

    /**
     * Format timestamp for display
     */
    const formatTimestamp = (isoString) => {
        if (!isoString) return 'Unknown';
        const date = new Date(isoString);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <motion.div
                    className="max-w-2xl w-full text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Icon */}
                    <motion.div
                        className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-8 bg-gradient-to-br ${errorConfig.bgGradient}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    >
                        <ErrorIcon className={`w-12 h-12`} style={{ color: `var(--theme-${errorConfig.color}, currentColor)` }} />
                    </motion.div>

                    {/* Error Code */}
                    <motion.h1
                        className={`text-8xl font-bold bg-clip-text text-transparent mb-4 bg-gradient-to-r ${errorConfig.gradient}`}
                        variants={itemVariants}
                    >
                        {code}
                    </motion.h1>

                    {/* Title */}
                    <motion.h2
                        className="text-2xl font-semibold text-foreground mb-4"
                        variants={itemVariants}
                    >
                        {title}
                    </motion.h2>

                    {/* Message */}
                    <motion.p
                        className="text-default-600 mb-8 leading-relaxed"
                        variants={itemVariants}
                    >
                        {message}
                    </motion.p>

                    {/* Error Details Card */}
                    {(trace_id || type || details) && (
                        <motion.div variants={itemVariants} className="mb-8">
                            <Card 
                                className={`border-l-4`}
                                style={{
                                    borderLeftColor: `var(--theme-${errorConfig.color}, currentColor)`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardBody className="space-y-3">
                                    {/* Trace ID */}
                                    {trace_id && (
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-default-600">Error ID:</span>
                                                <code className="font-mono text-xs bg-default-100 dark:bg-default-800 px-2 py-1 rounded">
                                                    {trace_id}
                                                </code>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color={copied ? 'success' : 'default'}
                                                startContent={copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                                                onPress={handleCopyTraceId}
                                            >
                                                {copied ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Error Type */}
                                    {type && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-default-600">Type:</span>
                                            <Chip size="sm" variant="flat" color={errorConfig.color}>
                                                {type}
                                            </Chip>
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    {timestamp && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-default-600">Occurred:</span>
                                            <span className="text-sm text-default-500">
                                                {formatTimestamp(timestamp)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Additional Details */}
                                    {details && (
                                        <div className="text-left">
                                            <span className="text-sm font-medium text-default-600 block mb-2">Details:</span>
                                            <pre className="bg-default-100 dark:bg-default-800 p-3 rounded-lg text-xs overflow-auto font-mono">
                                                {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        className="flex gap-3 justify-center flex-wrap"
                        variants={itemVariants}
                    >
                        {showHomeButton && (
                            <Link href={dashboardUrl}>
                                <Button
                                    color="primary"
                                    variant="solid"
                                    startContent={<HomeIcon className="w-4 h-4" />}
                                >
                                    Go to Dashboard
                                </Button>
                            </Link>
                        )}

                        {showRetryButton && (
                            <Button
                                color="primary"
                                variant="bordered"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={handleRetry}
                            >
                                Try Again
                            </Button>
                        )}

                        <Button
                            variant="flat"
                            color="default"
                            onPress={() => window.history.length > 1 ? window.history.back() : window.location.href = dashboardUrl}
                        >
                            Go Back
                        </Button>
                    </motion.div>

                    {/* Support Information */}
                    {trace_id && (
                        <motion.div variants={itemVariants} className="mt-8">
                            <Card className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                                <CardBody className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <CheckIcon className="w-5 h-5 text-success-600" />
                                        <h3 className="font-semibold text-success-700 dark:text-success-400">Our Team Has Been Notified</h3>
                                    </div>
                                    <p className="text-sm text-success-600 dark:text-success-500">
                                        This error has been automatically reported to our development team. 
                                        We're working to resolve it as quickly as possible.
                                    </p>
                                    <p className="text-xs text-default-500 mt-2">
                                        Reference: <code className="bg-default-100 dark:bg-default-800 px-1 rounded">{trace_id}</code>
                                    </p>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}

                    {/* Additional Help */}
                    <motion.div variants={itemVariants} className="mt-4">
                        <Card className="bg-default-50 dark:bg-default-900/50">
                            <CardBody className="text-center">
                                <h3 className="font-semibold mb-2 text-foreground">Need Immediate Help?</h3>
                                <p className="text-sm text-default-600">
                                    If this problem persists, please contact support with the error ID provided above.
                                </p>
                            </CardBody>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
}
