import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
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
    WifiIcon,
    CodeBracketIcon,
    BugAntIcon,
    CubeTransparentIcon,
} from '@heroicons/react/24/outline';

/**
 * UnifiedError Component (Context-Aware Error Handler & Boundary)
 * 
 * A comprehensive error component that handles:
 * 1. HTTP error pages (401, 403, 404, 500, etc.)
 * 2. React Error Boundary (catches rendering errors)
 * 3. Global errors from the GlobalErrorManager
 * 4. Network/API errors
 * 5. Chunk loading failures
 * 6. Resource loading errors
 * 
 * Features:
 * - Animated UI with Framer Motion
 * - Color-coded error types
 * - Copy trace ID functionality
 * - Context-aware dashboard navigation
 * - Context-aware messaging (platform/tenant/standalone)
 * - Automatic error reporting to platform
 * - Support for backend and frontend error logging
 * - Global error state integration
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
 * 
 * Error types supported:
 * - ReactError: Component rendering errors
 * - GlobalError: Uncaught JavaScript errors
 * - NetworkError: Network connection failures
 * - APIError: Backend API errors
 * - ChunkLoadError: Dynamic import failures
 * - ResourceLoadError: Asset loading failures
 * - UnhandledPromiseRejection: Async errors
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
            globalError: null,
        };
        this.unsubscribeGlobalError = null;
    }

    componentDidMount() {
        // Subscribe to global error manager
        if (typeof window !== 'undefined' && window.__globalErrorManager) {
            this.unsubscribeGlobalError = window.__globalErrorManager.subscribe((error) => {
                this.setState({ globalError: error });
            });
            // Check for existing error
            const existingError = window.__globalErrorManager.getError();
            if (existingError) {
                this.setState({ globalError: existingError });
            }
        }
    }

    componentWillUnmount() {
        if (this.unsubscribeGlobalError) {
            this.unsubscribeGlobalError();
        }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.reportErrorToPlatform(error, errorInfo);
        this.setState({ errorInfo });
        console.error('UnifiedError caught an error:', error, errorInfo);
    }

    /**
     * Report React errors to platform
     */
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
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                module: this.detectModule(),
                component: this.getComponentName(errorInfo),
                context: {
                    installation_type: context.type,
                    source_domain: window.location.hostname,
                    user_agent: navigator.userAgent,
                    browser: this.getBrowserInfo(),
                    timestamp: new Date().toISOString(),
                },
            };

            const response = await fetch('/api/error-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log(`Error reported to platform [${context.type}]:`, traceId);
            }
        } catch (reportError) {
            console.error('Failed to report error to platform:', reportError);
        }
    }

    generateTraceId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    detectModule() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        const skipPrefixes = ['tenant', 'admin', 'platform'];
        while (segments.length && skipPrefixes.includes(segments[0])) {
            segments.shift();
        }
        return segments[0] || null;
    }

    getComponentName(errorInfo) {
        if (!errorInfo?.componentStack) return null;
        const match = errorInfo.componentStack.match(/^\s*at\s+(\w+)/);
        return match ? match[1] : null;
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';

        if (ua.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
            browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1];
        } else if (ua.indexOf('Edg') > -1) {
            browserName = 'Edge';
            browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1];
        } else if (ua.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
            browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1];
        } else if (ua.indexOf('Safari') > -1) {
            browserName = 'Safari';
            browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1];
        }

        return { name: browserName, version: browserVersion, platform: navigator.platform };
    }

    /**
     * Clear global error and allow retry
     */
    clearGlobalError = () => {
        if (typeof window !== 'undefined' && window.__globalErrorManager) {
            window.__globalErrorManager.clearError();
        }
        this.setState({ globalError: null });
    };

    render() {
        // Priority 1: Global errors from GlobalErrorManager (critical errors like chunk load failures)
        if (this.state.globalError) {
            return (
                <UnifiedErrorDisplay 
                    error={this.state.globalError} 
                    onClearError={this.clearGlobalError}
                />
            );
        }

        // Priority 2: React Error Boundary caught an error
        if (this.state.hasError) {
            const { error, errorInfo } = this.state;
            const reactError = {
                code: 500,
                type: 'ReactError',
                title: 'Something Went Wrong',
                message: error?.message || 'An unexpected error occurred while rendering this page.',
                trace_id: this.state.traceId,
                showHomeButton: true,
                showRetryButton: true,
                details: {
                    errorMessage: error?.message || 'Unknown error',
                    errorStack: error?.stack?.split('\n').slice(0, 5).join('\n') || null,
                    componentStack: errorInfo?.componentStack?.split('\n').slice(0, 8).join('\n') || null,
                },
            };
            
            return <UnifiedErrorDisplay error={reactError} />;
        }

        // Priority 3: Error prop passed from server (HTTP error)
        if (this.props.error) {
            return <UnifiedErrorDisplay error={this.props.error} />;
        }

        // Otherwise render children normally
        return this.props.children;
    }
}

/**
 * UnifiedErrorDisplay - Pure display component
 */
function UnifiedErrorDisplay({ error = {}, onClearError = null }) {
    const [copied, setCopied] = useState(false);
    
    // Check if we're inside Inertia context (for safe Head usage)
    let hasInertiaContext = false;
    try {
        // usePage will throw if we're outside Inertia context
        usePage();
        hasInertiaContext = true;
    } catch {
        hasInertiaContext = false;
    }

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
     * Detect runtime context (tenant/standalone/platform)
     */
    UnifiedError.prototype.detectContext = function() {
        const hostname = window.location.hostname;
        const dotCount = hostname.split('.').length - 1;
        
        // Platform/Admin domain (admin.domain.com or domain.com)
        if (hostname.startsWith('admin.') || dotCount <= 1) {
            return {
                type: 'platform',
                notificationTitle: 'Error Logged and Team Notified',
                notificationMessage: 'Your platform admin team can review this error in the Error Logs section.',
            };
        }
        
        // Tenant subdomain (tenant.domain.com)
        if (dotCount === 2) {
            return {
                type: 'tenant',
                notificationTitle: 'Platform Has Been Informed',
                notificationMessage: 'The Aero platform team has received this error report and will investigate.',
            };
        }
        
        // Standalone installation (custom domain)
        return {
            type: 'standalone',
            notificationTitle: 'Error Reported for Analysis',
            notificationMessage: 'Error details have been sent to Aero to help improve the product.',
        };
    };

    const detectContext = () => {
        const hostname = window.location.hostname;
        const dotCount = hostname.split('.').length - 1;
        
        if (hostname.startsWith('admin.') || dotCount <= 1) {
            return {
                type: 'platform',
                notificationTitle: 'Error Logged and Team Notified',
                notificationMessage: 'Your platform admin team can review this error in the Error Logs section.',
            };
        }
        
        if (dotCount === 2) {
            return {
                type: 'tenant',
                notificationTitle: 'Platform Has Been Informed',
                notificationMessage: 'The Aero platform team has received this error report and will investigate.',
            };
        }
        
        return {
            type: 'standalone',
            notificationTitle: 'Error Reported for Analysis',
            notificationMessage: 'Error details have been sent to Aero to help improve the product.',
        };
    };

    const context = detectContext();

    /**
     * Get error configuration based on HTTP status code OR error type string
     * Returns appropriate icon, colors, and gradients
     * 
     * Supports:
     * - HTTP status codes: 400, 401, 403, 404, 408, 419, 422, 429, 500, 502, 503
     * - Error type strings: ReactError, NetworkError, APIError, ChunkLoadError, 
     *   ResourceLoadError, GlobalError, UnhandledPromiseRejection, TimeoutError
     */
    const getErrorConfig = (codeOrType) => {
        // HTTP status code configurations
        const httpConfigs = {
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

        // Error type string configurations (for global/non-HTTP errors)
        const typeConfigs = {
            ReactError: {
                icon: BugAntIcon,
                color: 'danger',
                gradient: 'from-danger-400 to-danger-600',
                bgGradient: 'from-danger-100 to-danger-200',
            },
            NetworkError: {
                icon: WifiIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            APIError: {
                icon: ServerIcon,
                color: 'danger',
                gradient: 'from-danger-400 to-danger-600',
                bgGradient: 'from-danger-100 to-danger-200',
            },
            ChunkLoadError: {
                icon: CubeTransparentIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            ResourceLoadError: {
                icon: ExclamationTriangleIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            GlobalError: {
                icon: CodeBracketIcon,
                color: 'danger',
                gradient: 'from-danger-400 to-danger-600',
                bgGradient: 'from-danger-100 to-danger-200',
            },
            UnhandledPromiseRejection: {
                icon: ExclamationTriangleIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
            TimeoutError: {
                icon: ClockIcon,
                color: 'warning',
                gradient: 'from-warning-400 to-warning-600',
                bgGradient: 'from-warning-100 to-warning-200',
            },
        };

        // Check if it's a number (HTTP code) or string (error type)
        if (typeof codeOrType === 'number') {
            return httpConfigs[codeOrType] || httpConfigs[500];
        }

        if (typeof codeOrType === 'string') {
            return typeConfigs[codeOrType] || httpConfigs[500];
        }

        return httpConfigs[500];
    };

    // Use error type for non-HTTP errors, otherwise use HTTP code
    // If type is a known error type string (not a PHP exception class), prefer it
    const knownErrorTypes = ['ReactError', 'NetworkError', 'APIError', 'ChunkLoadError', 
        'ResourceLoadError', 'GlobalError', 'UnhandledPromiseRejection', 'TimeoutError'];
    const configKey = knownErrorTypes.includes(type) ? type : code;
    const errorConfig = getErrorConfig(configKey);
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
     * Uses Inertia router for SPA navigation instead of full page reload
     * Falls back to window reload only for chunk load errors
     */
    const handleRetry = () => {
        // Clear global error first if callback provided
        if (onClearError) {
            onClearError();
        }

        // For chunk load errors, we need a full reload to refetch the module
        if (type === 'ChunkLoadError' || type === 'ResourceLoadError') {
            window.location.reload();
            return;
        }

        // Use Inertia router for SPA navigation (no full reload)
        if (typeof window !== 'undefined' && window.Inertia) {
            window.Inertia.reload({
                preserveScroll: false,
                preserveState: false,
                only: [],
            });
        } else {
            // Fallback for non-Inertia contexts
            window.location.reload();
        }
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
            {hasInertiaContext && <Head title={title} />}
            
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
                            onPress={() => window.history.length > 1 ? window.history.back() : router.visit(dashboardUrl)}
                        >
                            Go Back
                        </Button>
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

export default UnifiedError;
