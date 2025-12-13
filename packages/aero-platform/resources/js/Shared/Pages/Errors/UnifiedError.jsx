import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    ServerIcon,
    XCircleIcon,
    ClockIcon,
    WrenchScrewdriverIcon,
    HomeIcon,
    ArrowPathIcon,
    ClipboardDocumentIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import { useState } from 'react';

/**
 * UnifiedError Component (Context-Aware Error Handler & Boundary)
 */
class UnifiedError extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            copied: false,
            traceId: null,
            reported: false,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.reportErrorToPlatform(error, errorInfo);
        this.setState({ errorInfo });
        console.error('UnifiedError caught an error:', error, errorInfo);
    }

    async reportErrorToPlatform(error, errorInfo) {
        if (this.state.reported) return;
        const traceId = this.generateTraceId();
        this.setState({ traceId, reported: true });

        try {
            const context = this.detectContext();
            const payload = {
                trace_id: traceId,
                origin: 'frontend',
                error_type: 'ReactError',
                http_code: 0,
                message: error?.message || 'Unknown React error',
                stack: error?.stack || null,
                component_stack: errorInfo?.componentStack || null,
                url: window.location.href,
                referrer: document.referrer,
                viewport: { width: window.innerWidth, height: window.innerHeight },
                module: this.detectModule(),
                component: this.getComponentName(errorInfo),
                context: {
                    installation_type: context.type,
                    source_domain: window.location.hostname,
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                },
            };

            await fetch('/api/error-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            console.error('Failed to report error:', e);
        }
    }

    generateTraceId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    detectModule() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        while (segments.length && ['tenant', 'admin', 'platform'].includes(segments[0])) {
            segments.shift();
        }
        return segments[0] || null;
    }

    getComponentName(errorInfo) {
        const match = errorInfo?.componentStack?.match(/^\s*at\s+(\w+)/);
        return match ? match[1] : null;
    }

    detectContext() {
        const hostname = window.location.hostname;
        const dotCount = hostname.split('.').length - 1;
        
        if (hostname.startsWith('admin.') || dotCount <= 1) {
            return {
                type: 'platform',
                notificationTitle: 'Error Logged and Team Notified',
                notificationMessage: 'Your platform admin team can review this error in the Error Logs section.',
                dashboardUrl: '/admin/dashboard',
            };
        }
        
        if (dotCount === 2) {
            return {
                type: 'tenant',
                notificationTitle: 'Platform Has Been Informed',
                notificationMessage: 'The Aero platform team has received this error report and will investigate.',
                dashboardUrl: '/dashboard',
            };
        }
        
        return {
            type: 'standalone',
            notificationTitle: 'Error Reported for Analysis',
            notificationMessage: 'Error details have been sent to Aero to help improve the product.',
            dashboardUrl: '/dashboard',
        };
    }

    render() {
        if (this.state.hasError) {
            const reactError = {
                code: 500,
                type: 'ReactError',
                title: 'Something Went Wrong',
                message: 'An unexpected error occurred while rendering this page.',
                trace_id: this.state.traceId,
                showHomeButton: true,
                showRetryButton: true,
            };
            
            return <UnifiedErrorDisplay error={reactError} />;
        }

        return <UnifiedErrorDisplay error={this.props.error} />;
    }
}

function UnifiedErrorDisplay({ error = {} }) {
    const [copied, setCopied] = useState(false);

    /**
     * Detect runtime context (tenant/standalone/platform)
     * Same logic as ErrorBoundary for consistency
     */
    const detectContext = () => {
        const hostname = window.location.hostname;
        const dotCount = hostname.split('.').length - 1;
        
        // Platform/Admin domain (admin.domain.com or domain.com)
        if (hostname.startsWith('admin.') || dotCount <= 1) {
            return {
                type: 'platform',
                notificationTitle: 'Error Logged and Team Notified',
                notificationMessage: 'Your platform admin team can review this error in the Error Logs section.',
                dashboardUrl: '/admin/dashboard',
            };
        }
        
        // Tenant subdomain (tenant.domain.com)
        if (dotCount === 2) {
            return {
                type: 'tenant',
                notificationTitle: 'Platform Has Been Informed',
                notificationMessage: 'The Aero platform team has received this error report and will investigate.',
                dashboardUrl: '/dashboard',
            };
        }
        
        // Standalone installation (custom domain)
        return {
            type: 'standalone',
            notificationTitle: 'Error Reported for Analysis',
            notificationMessage: 'Error details have been sent to Aero to help improve the product.',
            dashboardUrl: '/dashboard',
        };
    };

    const context = detectContext();
    const dashboardUrl = context.dashboardUrl;

    // Extract error properties with defaults
    const {
        code = 500,
        type = 'ServerError',
        title = 'An Error Occurred',
        message = 'Something went wrong. Please try again later.',
        trace_id = null,
        showHomeButton = true,
        showRetryButton = false,
        details = null,
        timestamp = new Date().toISOString(),
    } = error;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    // Map error codes to icons and colors
    const getErrorConfig = (errorCode) => {
        const configs = {
            400: { 
                icon: ExclamationTriangleIcon, 
                gradient: 'from-yellow-400 via-orange-400 to-red-400',
                bgGradient: 'from-yellow-500/20 to-orange-500/20',
                color: 'warning'
            },
            401: { 
                icon: ShieldExclamationIcon, 
                gradient: 'from-red-400 via-pink-400 to-purple-400',
                bgGradient: 'from-red-500/20 to-pink-500/20',
                color: 'danger'
            },
            403: { 
                icon: ShieldExclamationIcon, 
                gradient: 'from-red-400 via-orange-400 to-yellow-400',
                bgGradient: 'from-red-500/20 to-orange-500/20',
                color: 'danger'
            },
            404: { 
                icon: XCircleIcon, 
                gradient: 'from-blue-400 via-purple-400 to-pink-400',
                bgGradient: 'from-blue-500/20 to-purple-500/20',
                color: 'primary'
            },
            408: { 
                icon: ClockIcon, 
                gradient: 'from-orange-400 via-amber-400 to-yellow-400',
                bgGradient: 'from-orange-500/20 to-amber-500/20',
                color: 'warning'
            },
            422: { 
                icon: ExclamationTriangleIcon, 
                gradient: 'from-yellow-400 via-amber-400 to-orange-400',
                bgGradient: 'from-yellow-500/20 to-amber-500/20',
                color: 'warning'
            },
            429: { 
                icon: ClockIcon, 
                gradient: 'from-red-400 via-orange-400 to-amber-400',
                bgGradient: 'from-red-500/20 to-orange-500/20',
                color: 'danger'
            },
            500: { 
                icon: ServerIcon, 
                gradient: 'from-red-400 via-pink-400 to-rose-400',
                bgGradient: 'from-red-500/20 to-pink-500/20',
                color: 'danger'
            },
            502: { 
                icon: ServerIcon, 
                gradient: 'from-red-400 via-orange-400 to-amber-400',
                bgGradient: 'from-red-500/20 to-orange-500/20',
                color: 'danger'
            },
            503: { 
                icon: WrenchScrewdriverIcon, 
                gradient: 'from-blue-400 via-indigo-400 to-purple-400',
                bgGradient: 'from-blue-500/20 to-indigo-500/20',
                color: 'primary'
            },
            default: { 
                icon: ExclamationTriangleIcon, 
                gradient: 'from-gray-400 via-gray-500 to-gray-600',
                bgGradient: 'from-gray-500/20 to-gray-600/20',
                color: 'default'
            }
        };

        return configs[errorCode] || configs.default;
    };

    const errorConfig = getErrorConfig(code);
    const ErrorIcon = errorConfig.icon;

    const handleCopyTraceId = () => {
        if (trace_id) {
            navigator.clipboard.writeText(trace_id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRetry = () => {
        window.location.reload();
    };

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

                        <Link href={window.history.length > 1 ? 'javascript:history.back()' : dashboardUrl}>
                            <Button
                                variant="flat"
                                color="default"
                            >
                                Go Back
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Context-Aware Support Information */}
                    {trace_id && (
                        <motion.div variants={itemVariants} className="mt-8">
                            <Card className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                                <CardBody className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <CheckIcon className="w-5 h-5 text-success-600" />
                                        <h3 className="font-semibold text-success-700 dark:text-success-400">
                                            {context.notificationTitle}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-success-600 dark:text-success-500">
                                        {context.notificationMessage}
                                    </p>
                                    <p className="text-xs text-default-500 mt-2">
                                        Reference: <code className="bg-default-100 dark:bg-default-800 px-1 rounded">{trace_id}</code>
                                    </p>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </>
    );
}

export default UnifiedError;
