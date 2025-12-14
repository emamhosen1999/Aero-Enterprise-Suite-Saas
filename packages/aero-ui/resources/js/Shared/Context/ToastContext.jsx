/**
 * Toast Context - Using react-toastify instead of PrimeReact
 * 
 * NOTE: This is a legacy context for backward compatibility.
 * Prefer using showToast from '@/utils/toastUtils' directly.
 */
import React, { createContext, useContext } from 'react';
import { toast } from 'react-toastify';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const showToast = (message, severity = 'info', life = 3000) => {
        const options = { autoClose: life };
        
        switch (severity) {
            case 'success':
                toast.success(message, options);
                break;
            case 'error':
            case 'danger':
                toast.error(message, options);
                break;
            case 'warn':
            case 'warning':
                toast.warning(message, options);
                break;
            default:
                toast.info(message, options);
        }
    };

    const hideToast = (id) => {
        if (id) {
            toast.dismiss(id);
        } else {
            toast.dismiss();
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
        </ToastContext.Provider>
    );
};

const useToast = () => {
    return useContext(ToastContext);
};

export default useToast;
