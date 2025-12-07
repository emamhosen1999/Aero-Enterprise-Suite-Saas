import React from 'react';
import { Card, CardBody, Button, Accordion, AccordionItem, Chip } from '@heroui/react';
import { ChevronDownIcon, ArrowPathIcon, BugAntIcon, HomeIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Inertia } from '@inertiajs/inertia';

/**
 * Unified Global Error Boundary Component
 * Provides graceful error handling with detailed information, recovery options,
 * and automatic error logging to the centralized error log system.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            traceId: null,
            timestamp: null,
            moduleName: null,
            showDetails: false,
            copied: false,
        };
    }

    static getDerivedStateFromError(error) {
        // Generate trace ID matching backend format
        const traceId = 'ERR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        
        return {
            hasError: true,
            traceId,
            timestamp: new Date().toISOString(),
        };
    }

    componentDidCatch(error, errorInfo) {
        // Detect module name from URL
        const moduleName = this.detectModuleName();
        
        this.setState({
            error,
            errorInfo,
            moduleName,
        });

        // Log error to centralized error log service
        this.logErrorToService(error, errorInfo, moduleName);
    }

    detectModuleName = () => {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(Boolean);
        
        // Module detection logic
        if (pathParts.includes('admin')) {
            return 'Platform Admin';
        } else if (pathParts.includes('hr')) {
            return 'HR Management';
        } else if (pathParts.includes('projects')) {
            return 'Project Management';
        } else if (pathParts.includes('quality')) {
            return 'Quality Control';
        } else if (pathParts.includes('dms')) {
            return 'Document Management';
        } else if (pathParts.includes('analytics')) {
            return 'Analytics';
        } else if (pathParts.includes('settings')) {
            return 'Settings';
        } else if (pathParts.includes('dashboard')) {
            return 'Dashboard';
        } else if (pathParts.length > 0) {
            return pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
        }
        
        return 'Application';
    };

    logErrorToService = async (error, errorInfo, moduleName) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            await fetch('/api/error-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    trace_id: this.state.traceId,
                    error_type: error?.name || 'ReactError',
                    error_message: error?.message || 'Unknown error occurred',
                    stack_trace: error?.stack || null,
                    component_stack: errorInfo?.componentStack || null,
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                    timestamp: this.state.timestamp,
                    module: moduleName,
                    context: {
                        viewport: {
                            width: window.innerWidth,
                            height: window.innerHeight,
                        },
                        referrer: document.referrer || null,
                        language: navigator.language,
                    },
                }),
            });
        } catch (logError) {
            // Silent fail - don't break the error boundary if logging fails
            console.error('Failed to log error:', logError);
        }
    };

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            traceId: null,
            timestamp: null,
            moduleName: null,
            showDetails: false,
            copied: false,
        });
    };

    handleGoHome = () => {
        Inertia.visit('/dashboard');
    };

    handleReload = () => {
        // Try graceful recovery first
        this.handleRetry();
        
        // If still has error after a short delay, navigate to dashboard
        setTimeout(() => {
            if (this.state.hasError) {
                this.handleGoHome();
            }
        }, 1000);
    };

    handleCopyTraceId = () => {
        if (this.state.traceId) {
            navigator.clipboard.writeText(this.state.traceId);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        }
    };

    formatTimestamp = (isoString) => {
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

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, traceId, timestamp, moduleName, copied } = this.state;

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-6">
                    <div className="max-w-2xl w-full text-center">
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <BugAntIcon className="w-20 h-20 text-danger" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-danger rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">!</span>
                                </div>
                            </div>
                        </div>

                        {/* Error Title */}
                        <h1 className="text-4xl font-bold text-danger mb-4">
                            Oops! Something went wrong
                        </h1>

                        {/* Error Description */}
                        <p className="text-lg text-default-600 mb-6">
                            We encountered an unexpected error. Our team has been notified and will investigate this issue.
                        </p>

                        {/* Unified Error Info Card */}
                        <Card 
                            className="mb-6 border-l-4 border-l-danger"
                            style={{
                                background: `linear-gradient(135deg, 
                                    var(--theme-content1, #FAFAFA) 20%, 
                                    var(--theme-content2, #F4F4F5) 10%, 
                                    var(--theme-content3, #F1F3F4) 20%)`,
                            }}
                        >
                            <CardBody className="space-y-3">
                                {/* Error Code / Trace ID */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-default-600">Error Code:</span>
                                        <code className="font-mono bg-danger-100 dark:bg-danger-900/30 text-danger px-2 py-1 rounded text-sm font-semibold">
                                            {traceId}
                                        </code>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color={copied ? 'success' : 'default'}
                                        startContent={copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                                        onPress={this.handleCopyTraceId}
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>

                                {/* Module Name */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-default-600">Module:</span>
                                    <Chip size="sm" variant="flat" color="primary">
                                        {moduleName || 'Unknown'}
                                    </Chip>
                                </div>

                                {/* Timestamp */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-default-600">Occurred:</span>
                                    <span className="text-sm text-default-500">
                                        {this.formatTimestamp(timestamp)}
                                    </span>
                                </div>

                                {/* Error Type */}
                                {error?.name && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-default-600">Type:</span>
                                        <Chip size="sm" variant="flat" color="danger">
                                            {error.name}
                                        </Chip>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center flex-wrap mb-6">
                            <Button
                                color="primary"
                                variant="solid"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={this.handleRetry}
                            >
                                Try Again
                            </Button>

                            <Button
                                color="primary"
                                variant="bordered"
                                startContent={<HomeIcon className="w-4 h-4" />}
                                onPress={this.handleGoHome}
                            >
                                Go to Dashboard
                            </Button>

                            <Button
                                color="secondary"
                                variant="bordered"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={this.handleReload}
                            >
                                Recover
                            </Button>
                        </div>

                        {/* Error Details Accordion */}
                        {(error || errorInfo) && (
                            <Accordion variant="bordered" className="mb-6">
                                <AccordionItem
                                    key="error-details"
                                    aria-label="Technical Details"
                                    title="Technical Details"
                                    indicator={<ChevronDownIcon className="w-4 h-4" />}
                                >
                                    <div className="text-left space-y-4">
                                        {error && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-danger mb-2">
                                                    Error Message:
                                                </h4>
                                                <pre className="bg-default-100 dark:bg-default-800 p-3 rounded-lg text-xs overflow-auto font-mono">
                                                    {error.message}
                                                </pre>
                                            </div>
                                        )}

                                        {errorInfo && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-danger mb-2">
                                                    Component Stack:
                                                </h4>
                                                <pre className="bg-default-100 dark:bg-default-800 p-3 rounded-lg text-xs overflow-auto font-mono max-h-48">
                                                    {errorInfo.componentStack}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </AccordionItem>
                            </Accordion>
                        )}

                        {/* Support Information */}
                        <Card className="bg-default-50 dark:bg-default-900/50">
                            <CardBody className="text-center">
                                <h3 className="font-semibold mb-2">Need Help?</h3>
                                <p className="text-sm text-default-600">
                                    If this problem persists, please contact our support team at{' '}
                                    <strong className="text-primary">support@aeos365.com</strong> with the error ID provided above.
                                </p>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
