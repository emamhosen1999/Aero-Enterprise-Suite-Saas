import React from 'react';
import { Card, CardBody, Button } from "@heroui/react";
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * ErrorBoundary Component
 * 
 * A React Error Boundary that catches JavaScript errors anywhere in the child
 * component tree, logs them to the platform API, and displays a fallback UI.
 * 
 * Features:
 * - Catches all React rendering errors
 * - Reports errors to the central Aero platform
 * - Shows user-friendly error message
 * - Provides retry functionality
 * 
 * Usage:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * Or with custom fallback:
 * <ErrorBoundary fallback={<CustomError />}>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            traceId: null,
            reported: false,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to our platform
        this.reportErrorToPlatform(error, errorInfo);
        
        this.setState({ errorInfo });

        // Also log to console for development
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    /**
     * Report the error to the central Aero platform
     */
    async reportErrorToPlatform(error, errorInfo) {
        if (this.state.reported) return;

        const traceId = this.generateTraceId();
        this.setState({ traceId, reported: true });

        try {
            const payload = {
                trace_id: traceId,
                origin: 'frontend',
                error_type: 'ReactError',
                http_code: 0, // Not an HTTP error
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
            };

            // Try to send to the backend API which will forward to platform
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
                console.log('Error reported to platform:', traceId);
            }
        } catch (reportError) {
            // Don't throw on reporting failure - just log
            console.error('Failed to report error to platform:', reportError);
        }
    }

    /**
     * Generate a UUID v4 trace ID
     */
    generateTraceId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get CSRF token from meta tag
     */
    getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    /**
     * Detect current module from URL
     */
    detectModule() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        
        // Skip common prefixes
        const skipPrefixes = ['tenant', 'admin', 'platform'];
        while (segments.length && skipPrefixes.includes(segments[0])) {
            segments.shift();
        }
        
        return segments[0] || null;
    }

    /**
     * Try to extract component name from error info
     */
    getComponentName(errorInfo) {
        if (!errorInfo?.componentStack) return null;
        
        // Parse the first component from the stack
        const match = errorInfo.componentStack.match(/^\s*at\s+(\w+)/);
        return match ? match[1] : null;
    }

    /**
     * Handle retry - reset state and remount children
     */
    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            reported: false,
        });
    };

    /**
     * Handle reload page
     */
    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Check if custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-6">
                    <div className="max-w-lg w-full text-center">
                        {/* Error Icon */}
                        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-danger-100 to-danger-200">
                            <ExclamationTriangleIcon className="w-10 h-10 text-danger-600" />
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-foreground mb-4">
                            Something Went Wrong
                        </h1>

                        {/* Message */}
                        <p className="text-default-600 mb-6">
                            An unexpected error occurred while rendering this page. 
                            Our team has been automatically notified and is working to fix it.
                        </p>

                        {/* Trace ID */}
                        {this.state.traceId && (
                            <Card className="mb-6 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                                <CardBody className="text-center py-3">
                                    <p className="text-sm text-success-700 dark:text-success-400 font-medium">
                                        ✓ Error reported to our team
                                    </p>
                                    <p className="text-xs text-default-500 mt-1">
                                        Reference: <code className="bg-default-100 px-1 rounded">{this.state.traceId}</code>
                                    </p>
                                </CardBody>
                            </Card>
                        )}

                        {/* Error Details (Dev only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <Card className="mb-6 text-left">
                                <CardBody>
                                    <h3 className="font-semibold text-danger-600 mb-2">Error Details (Dev Only)</h3>
                                    <pre className="bg-default-100 dark:bg-default-800 p-3 rounded text-xs overflow-auto max-h-40">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </CardBody>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center">
                            <Button
                                color="primary"
                                variant="solid"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={this.handleRetry}
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="flat"
                                color="default"
                                onPress={this.handleReload}
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
