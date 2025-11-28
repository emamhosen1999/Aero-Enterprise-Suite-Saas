import React from 'react';
import { Card, CardBody, Button, Accordion, AccordionItem } from '@heroui/react';
import { ChevronDownIcon, ArrowPathIcon, BugAntIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Inertia } from '@inertiajs/inertia';

/**
 * Enhanced Error Boundary Component
 * Provides graceful error handling with detailed information and recovery options
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            showDetails: false
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
        };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo
        });

        // Log error to monitoring service
        this.logErrorToService(error, errorInfo);
    }

    logErrorToService = async (error, errorInfo) => {
        try {
            await fetch('/api/log-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    error_id: this.state.errorId,
                    message: error.message,
                    stack: error.stack,
                    component_stack: errorInfo.componentStack,
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }
    };

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            showDetails: false
        });
    };

    handleGoHome = () => {
        Inertia.visit('/dashboard');
    };

    handleReload = () => {
        // Instead of full page reload, try to recover gracefully
        // First try to retry the component
        this.handleRetry();
        
        // If that doesn't work, navigate to dashboard instead of reload
        setTimeout(() => {
            if (this.state.hasError) {
                this.handleGoHome();
            }
        }, 1000);
    };    render() {
        if (this.state.hasError) {
            const { error, errorInfo, errorId, showDetails } = this.state;

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-6">
                    <div className="max-w-2xl w-full text-center">
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <BugAntIcon className="w-20 h-20 text-danger" />
                        </div>

                        {/* Error Title */}
                        <h1 className="text-4xl font-bold text-danger mb-4">
                            Oops! Something went wrong
                        </h1>

                        {/* Error Description */}
                        <p className="text-lg text-default-600 mb-6">
                            We encountered an unexpected error. Our team has been notified and will investigate this issue.
                        </p>

                        {/* Error ID Card */}
                        <Card className="mb-6 bg-primary-50 dark:bg-primary-950/20 border-l-4 border-l-primary">
                            <CardBody className="text-left">
                                <p className="text-sm">
                                    <strong>Error ID:</strong> <code className="font-mono bg-default-100 px-1 rounded-sm">{errorId}</code>
                                </p>
                                <p className="text-sm text-default-600 mt-1">
                                    Please provide this ID when contacting support.
                                </p>
                            </CardBody>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center flex-wrap mb-6">
                            <Button
                                color="primary"
                                variant="solid"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onClick={this.handleRetry}
                            >
                                Try Again
                            </Button>

                            <Button
                                color="primary"
                                variant="bordered"
                                startContent={<HomeIcon className="w-4 h-4" />}
                                onClick={this.handleGoHome}
                            >
                                Go to Dashboard
                            </Button>

                            <Button
                                color="secondary"
                                variant="bordered"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onClick={this.handleReload}
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
                                    <strong className="text-primary">support@dbedc.com</strong> with the error ID provided above.
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
