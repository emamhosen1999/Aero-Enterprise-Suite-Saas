import React from 'react';
import { toast } from 'react-toastify';
import { Spinner, Card, CardBody } from '@heroui/react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * GlassToast - Enhanced toast notifications with glass morphism design
 * Supports loading states with resolve/reject patterns
 */
class GlassToast {
  // Default styles for glass morphism effect
  static defaultStyles = {
    background: 'rgba(15, 20, 25, 0.15)',
    backdropFilter: 'blur(10px) saturate(180%)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
    color: '#ffffff',
    padding: '0',
    minHeight: '60px'
  };

  // Loading toast with promise resolution
  static loading(message, options = {}) {
    const loadingContent = (
      <Card className="bg-transparent border-0 shadow-none m-0 p-0">
        <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
          <Spinner size="sm" color="primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{message}</span>
            <span className="text-xs text-default-400">Please wait...</span>
          </div>
        </CardBody>
      </Card>
    );

    const toastId = toast.loading(loadingContent, {
      style: this.defaultStyles,
      hideProgressBar: true,
      closeButton: false,
      autoClose: false,
      ...options
    });

    // Return resolve and reject methods
    return {
      resolve: (successMessage, successOptions = {}) => {
        const successContent = (
          <Card className="bg-transparent border-0 shadow-none m-0 p-0">
            <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
              <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{successMessage}</span>
                <span className="text-xs text-green-400">Operation completed successfully</span>
              </div>
            </CardBody>
          </Card>
        );

        toast.update(toastId, {
          render: successContent,
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
          style: {
            ...this.defaultStyles,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)'
          },
          ...successOptions
        });
      },

      reject: (errorMessage, errorOptions = {}) => {
        const errorContent = (
          <Card className="bg-transparent border-0 shadow-none m-0 p-0">
            <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
              <XCircleIcon className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{errorMessage}</span>
                <span className="text-xs text-red-400">Operation failed</span>
              </div>
            </CardBody>
          </Card>
        );

        toast.update(toastId, {
          render: errorContent,
          type: "error",
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
          style: {
            ...this.defaultStyles,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
          },
          ...errorOptions
        });
      },

      toastId
    };
  }

  // Success toast
  static success(message, options = {}) {
    const successContent = (
      <Card className="bg-transparent border-0 shadow-none m-0 p-0">
        <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
          <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{message}</span>
            <span className="text-xs text-green-400">Success</span>
          </div>
        </CardBody>
      </Card>
    );

    return toast.success(successContent, {
      style: {
        ...this.defaultStyles,
        background: 'rgba(34, 197, 94, 0.15)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)'
      },
      hideProgressBar: true,
      autoClose: 3000,
      ...options
    });
  }

  // Error toast
  static error(message, options = {}) {
    const errorContent = (
      <Card className="bg-transparent border-0 shadow-none m-0 p-0">
        <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
          <XCircleIcon className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{message}</span>
            <span className="text-xs text-red-400">Error</span>
          </div>
        </CardBody>
      </Card>
    );

    return toast.error(errorContent, {
      style: {
        ...this.defaultStyles,
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
      },
      hideProgressBar: true,
      autoClose: 5000,
      ...options
    });
  }

  // Info toast
  static info(message, options = {}) {
    const infoContent = (
      <Card className="bg-transparent border-0 shadow-none m-0 p-0">
        <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
          <InformationCircleIcon className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{message}</span>
            <span className="text-xs text-blue-400">Information</span>
          </div>
        </CardBody>
      </Card>
    );

    return toast.info(infoContent, {
      style: {
        ...this.defaultStyles,
        background: 'rgba(59, 130, 246, 0.15)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
      },
      hideProgressBar: true,
      autoClose: 4000,
      ...options
    });
  }

  // Warning toast
  static warning(message, options = {}) {
    const warningContent = (
      <Card className="bg-transparent border-0 shadow-none m-0 p-0">
        <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
          <InformationCircleIcon className="w-5 h-5 text-orange-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{message}</span>
            <span className="text-xs text-orange-400">Warning</span>
          </div>
        </CardBody>
      </Card>
    );

    return toast.warning(warningContent, {
      style: {
        ...this.defaultStyles,
        background: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2)'
      },
      hideProgressBar: true,
      autoClose: 4000,
      ...options
    });
  }

  // Dismiss specific toast
  static dismiss(toastId) {
    toast.dismiss(toastId);
  }

  // Dismiss all toasts
  static dismissAll() {
    toast.dismiss();
  }
}

export default GlassToast;
