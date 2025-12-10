import React, {createContext, useContext, useRef, useState} from 'react';
import {Toast} from 'primereact/toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    let toast = useRef(null);

    const showToast = (message, severity = 'info', life = 3000) => {
        setToasts([...toasts, { id: Date.now(), message, severity, life }]);
    };

    const hideToast = (id) => {
        setToasts(toasts.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            <Toast ref={(el) => (toast.current = el)} position="top-center" />
            {children}
        </ToastContext.Provider>
    );
};

 const useToast = () => {
    return useContext(ToastContext);
};

export default useToast;
