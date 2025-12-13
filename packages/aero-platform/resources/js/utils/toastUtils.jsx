/**
 * Toast Utility - Consistent, Promise-based Toast Notifications
 * 
 * This utility provides standardized toast notifications across the application
 * with proper loading → success/error state transitions.
 * 
 * Usage:
 *   import { showToast, toastStyles } from '@/utils/toastUtils';
 *   
 *   // Simple promise-based toast
 *   showToast.promise(apiCall(), {
 *     loading: 'Saving changes...',
 *     success: 'Changes saved successfully!',
 *     error: 'Failed to save changes'
 *   });
 *   
 *   // With custom messages based on response
 *   showToast.promise(apiCall(), {
 *     loading: 'Deleting item...',
 *     success: (data) => data.message || 'Item deleted!',
 *     error: (err) => err.response?.data?.message || 'Failed to delete'
 *   });
 */

import { toast } from 'react-toastify';
import React from 'react';

// Consistent glassy toast styles matching the app theme
export const toastStyles = {
  base: {
    backdropFilter: 'blur(16px) saturate(200%)',
    background: 'var(--theme-content1)',
    border: '1px solid var(--theme-divider)',
    color: 'var(--theme-foreground)',
    borderRadius: 'var(--theme-radius, 12px)',
  },
  pending: {
    backdropFilter: 'blur(16px) saturate(200%)',
    background: 'var(--theme-content1)',
    border: '1px solid var(--theme-divider)',
    color: 'var(--theme-primary)',
  },
  success: {
    backdropFilter: 'blur(16px) saturate(200%)',
    background: 'var(--theme-content1)',
    border: '1px solid var(--theme-success, #22c55e)',
    color: 'var(--theme-success, #22c55e)',
  },
  error: {
    backdropFilter: 'blur(16px) saturate(200%)',
    background: 'var(--theme-content1)',
    border: '1px solid var(--theme-danger, #ef4444)',
    color: 'var(--theme-danger, #ef4444)',
  },
  warning: {
    backdropFilter: 'blur(16px) saturate(200%)',
    background: 'var(--theme-content1)',
    border: '1px solid var(--theme-warning, #f59e0b)',
    color: 'var(--theme-warning, #f59e0b)',
  },
  info: {
    backdropFilter: 'blur(16px) saturate(200%)',
    background: 'var(--theme-content1)',
    border: '1px solid var(--theme-primary)',
    color: 'var(--theme-primary)',
  },
};

// Loading spinner component for pending state
const LoadingSpinner = ({ size = 'sm' }) => (
  <div 
    className={`animate-spin rounded-full border-2 border-current border-t-transparent ${
      size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    }`}
  />
);

// Toast content with icon and message
const ToastContent = ({ icon, message, showSpinner = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {showSpinner ? <LoadingSpinner /> : icon && <span>{icon}</span>}
    <span>{message}</span>
  </div>
);

/**
 * Action context messages for consistent UX
 */
export const actionMessages = {
  // CRUD Operations
  create: {
    loading: (entity) => `Creating ${entity}...`,
    success: (entity) => `${entity} created successfully!`,
    error: (entity) => `Failed to create ${entity}`,
  },
  update: {
    loading: (entity) => `Updating ${entity}...`,
    success: (entity) => `${entity} updated successfully!`,
    error: (entity) => `Failed to update ${entity}`,
  },
  delete: {
    loading: (entity) => `Deleting ${entity}...`,
    success: (entity) => `${entity} deleted successfully!`,
    error: (entity) => `Failed to delete ${entity}`,
  },
  save: {
    loading: (entity) => `Saving ${entity}...`,
    success: (entity) => `${entity} saved successfully!`,
    error: (entity) => `Failed to save ${entity}`,
  },
  
  // Data Operations
  fetch: {
    loading: (entity) => `Loading ${entity}...`,
    success: (entity) => `${entity} loaded successfully!`,
    error: (entity) => `Failed to load ${entity}`,
  },
  refresh: {
    loading: (entity) => `Refreshing ${entity}...`,
    success: (entity) => `${entity} refreshed successfully!`,
    error: (entity) => `Failed to refresh ${entity}`,
  },
  export: {
    loading: (entity) => `Exporting ${entity}...`,
    success: (entity) => `${entity} exported successfully!`,
    error: (entity) => `Failed to export ${entity}`,
  },
  import: {
    loading: (entity) => `Importing ${entity}...`,
    success: (entity) => `${entity} imported successfully!`,
    error: (entity) => `Failed to import ${entity}`,
  },
  
  // Status Operations
  approve: {
    loading: (entity) => `Approving ${entity}...`,
    success: (entity) => `${entity} approved successfully!`,
    error: (entity) => `Failed to approve ${entity}`,
  },
  reject: {
    loading: (entity) => `Rejecting ${entity}...`,
    success: (entity) => `${entity} rejected successfully!`,
    error: (entity) => `Failed to reject ${entity}`,
  },
  submit: {
    loading: (entity) => `Submitting ${entity}...`,
    success: (entity) => `${entity} submitted successfully!`,
    error: (entity) => `Failed to submit ${entity}`,
  },
  cancel: {
    loading: (entity) => `Cancelling ${entity}...`,
    success: (entity) => `${entity} cancelled successfully!`,
    error: (entity) => `Failed to cancel ${entity}`,
  },
  
  // User/Auth Operations
  login: {
    loading: () => 'Signing in...',
    success: () => 'Signed in successfully!',
    error: () => 'Failed to sign in',
  },
  logout: {
    loading: () => 'Signing out...',
    success: () => 'Signed out successfully!',
    error: () => 'Failed to sign out',
  },
  register: {
    loading: () => 'Creating account...',
    success: () => 'Account created successfully!',
    error: () => 'Failed to create account',
  },
  
  // Assignment Operations
  assign: {
    loading: (entity) => `Assigning ${entity}...`,
    success: (entity) => `${entity} assigned successfully!`,
    error: (entity) => `Failed to assign ${entity}`,
  },
  unassign: {
    loading: (entity) => `Removing ${entity}...`,
    success: (entity) => `${entity} removed successfully!`,
    error: (entity) => `Failed to remove ${entity}`,
  },
};

/**
 * Get error message from various error formats
 */
const getErrorMessage = (error, fallbackMessage = 'An error occurred') => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return fallbackMessage;
};

/**
 * Get success message from various response formats
 */
const getSuccessMessage = (response, fallbackMessage = 'Operation completed') => {
  if (typeof response === 'string') return response;
  if (response?.data?.message) return response.data.message;
  if (response?.message) return response.message;
  return fallbackMessage;
};

/**
 * Main toast utility object with all methods
 */
export const showToast = {
  /**
   * Show a promise-based toast with loading → success/error states
   * 
   * Supports both new simplified format and legacy toast.promise format:
   * 
   * New format:
   * { loading: 'Message', success: 'Message' or fn, error: 'Message' or fn }
   * 
   * Legacy format (with render functions):
   * { pending: { render() {...} }, success: { render({data}) {...} }, error: { render({data}) {...} } }
   * 
   * @param {Promise} promise - The promise to track
   * @param {Object} messages - Object with loading/pending, success, error messages
   * @param {Object} options - Additional toast options
   * @returns {Promise} - The original promise for chaining
   */
  promise: (promise, messages, options = {}) => {
    // Detect legacy format (has render functions or pending key)
    const isLegacyFormat = messages.pending || 
      (messages.success && typeof messages.success === 'object' && messages.success.render) ||
      (messages.error && typeof messages.error === 'object' && messages.error.render);
    
    if (isLegacyFormat) {
      // Pass through to raw toast.promise for backwards compatibility
      return toast.promise(promise, messages, {
        position: 'top-right',
        autoClose: 3000,
        ...options,
      });
    }
    
    // New simplified format
    const {
      loading = 'Processing...',
      success = 'Success!',
      error = 'Something went wrong',
    } = messages;

    return toast.promise(promise, {
      pending: {
        render() {
          const msg = typeof loading === 'function' ? loading() : loading;
          return <ToastContent message={msg} showSpinner />;
        },
        icon: false,
        style: toastStyles.pending,
      },
      success: {
        render({ data }) {
          const msg = typeof success === 'function' 
            ? success(data) 
            : getSuccessMessage(data, success);
          return <ToastContent icon="✓" message={msg} />;
        },
        icon: false,
        style: toastStyles.success,
      },
      error: {
        render({ data }) {
          const msg = typeof error === 'function' 
            ? error(data) 
            : getErrorMessage(data, error);
          return <ToastContent icon="✕" message={msg} />;
        },
        icon: false,
        style: toastStyles.error,
      },
    }, {
      position: 'top-right',
      autoClose: 3000,
      ...options,
    });
  },

  /**
   * Shorthand for common action + entity patterns
   * 
   * @example
   * showToast.action('update', 'department', axios.put('/api/departments/1', data));
   */
  action: (action, entity, promise, options = {}) => {
    const messages = actionMessages[action];
    if (!messages) {
      console.warn(`Unknown action type: ${action}`);
      return showToast.promise(promise, {
        loading: `Processing ${entity}...`,
        success: `${entity} operation completed!`,
        error: `Failed to process ${entity}`,
      }, options);
    }

    return showToast.promise(promise, {
      loading: messages.loading(entity),
      success: (data) => getSuccessMessage(data, messages.success(entity)),
      error: (err) => getErrorMessage(err, messages.error(entity)),
    }, options);
  },

  /**
   * Simple success toast
   */
  success: (message, options = {}) => {
    return toast.success(
      <ToastContent icon="✓" message={message} />,
      {
        icon: false,
        style: toastStyles.success,
        position: 'top-right',
        autoClose: 3000,
        ...options,
      }
    );
  },

  /**
   * Simple error toast
   */
  error: (message, options = {}) => {
    return toast.error(
      <ToastContent icon="✕" message={message} />,
      {
        icon: false,
        style: toastStyles.error,
        position: 'top-right',
        autoClose: 5000, // Errors stay longer
        ...options,
      }
    );
  },

  /**
   * Simple warning toast
   */
  warning: (message, options = {}) => {
    return toast.warning(
      <ToastContent icon="⚠" message={message} />,
      {
        icon: false,
        style: toastStyles.warning,
        position: 'top-right',
        autoClose: 4000,
        ...options,
      }
    );
  },

  /**
   * Simple info toast
   */
  info: (message, options = {}) => {
    return toast.info(
      <ToastContent icon="ℹ" message={message} />,
      {
        icon: false,
        style: toastStyles.info,
        position: 'top-right',
        autoClose: 3000,
        ...options,
      }
    );
  },

  /**
   * Show a loading toast that can be updated later
   * Returns the toast ID for later updates
   * 
   * @example
   * const toastId = showToast.loading('Uploading file...');
   * // Later...
   * showToast.updateSuccess(toastId, 'File uploaded!');
   * // Or on error...
   * showToast.updateError(toastId, 'Upload failed!');
   */
  loading: (message, options = {}) => {
    return toast.loading(
      <ToastContent message={message} showSpinner />,
      {
        icon: false,
        style: toastStyles.pending,
        position: 'top-right',
        ...options,
      }
    );
  },

  /**
   * Update an existing toast to success state
   */
  updateSuccess: (toastId, message, options = {}) => {
    return toast.update(toastId, {
      render: <ToastContent icon="✓" message={message} />,
      type: 'success',
      isLoading: false,
      icon: false,
      style: toastStyles.success,
      autoClose: 3000,
      ...options,
    });
  },

  /**
   * Update an existing toast to error state
   */
  updateError: (toastId, message, options = {}) => {
    return toast.update(toastId, {
      render: <ToastContent icon="✕" message={message} />,
      type: 'error',
      isLoading: false,
      icon: false,
      style: toastStyles.error,
      autoClose: 5000,
      ...options,
    });
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

/**
 * Helper to extract error message from API errors
 */
export const extractErrorMessage = getErrorMessage;

/**
 * Helper to extract success message from API responses
 */
export const extractSuccessMessage = getSuccessMessage;

export default showToast;
