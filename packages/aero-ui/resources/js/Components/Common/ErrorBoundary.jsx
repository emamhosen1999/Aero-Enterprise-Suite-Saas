import React, { Component } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Error Boundary component for catching and handling React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 * 
 * @example
 * <ErrorBoundary fallbackTitle="Table Error" onRetry={() => refreshData()}>
 *   <DataTable data={data} />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({ errorInfo });
        
        // Call optional error callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleRetry = () => {
        // Reset error state
        this.setState({ hasError: false, error: null, errorInfo: null });
        
        // Call optional retry callback
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const {
                fallbackTitle = 'Something went wrong',
                fallbackDescription = 'An unexpected error occurred. Please try again.',
                showDetails = process.env.NODE_ENV === 'development',
                showRetry = true,
            } = this.props;

            return (
                <Card 
                    className="border border-danger/20 bg-danger/5"
                    style={{ borderRadius: 'var(--borderRadius, 12px)' }}
                >
                    <CardBody className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
                            <ExclamationTriangleIcon className="w-8 h-8 text-danger" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-danger mb-2">
                            {fallbackTitle}
                        </h3>
                        
                        <p className="text-sm text-default-600 mb-4 max-w-md">
                            {fallbackDescription}
                        </p>

                        {showDetails && this.state.error && (
                            <div className="w-full max-w-lg mb-4">
                                <details className="text-left">
                                    <summary className="text-xs text-default-500 cursor-pointer hover:text-default-700">
                                        Error Details
                                    </summary>
                                    <pre className="mt-2 p-3 bg-default-100 rounded-lg text-xs text-danger overflow-x-auto">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack && (
                                            <span className="text-default-500">
                                                {this.state.errorInfo.componentStack}
                                            </span>
                                        )}
                                    </pre>
                                </details>
                            </div>
                        )}

                        {showRetry && (
                            <Button
                                color="danger"
                                variant="flat"
                                onPress={this.handleRetry}
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                style={{ borderRadius: 'var(--borderRadius, 12px)' }}
                            >
                                Try Again
                            </Button>
                        )}
                    </CardBody>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
