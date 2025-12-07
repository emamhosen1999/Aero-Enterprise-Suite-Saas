import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * Custom hook for common form functionality
 * Reduces duplication across form components
 */
export const useForm = (initialData = {}, options = {}) => {
    const {
        onSuccess = () => {},
        onError = () => {},
        resetOnSuccess = true,
        successMessage = 'Operation completed successfully',
        errorMessage = 'An error occurred. Please try again.',
    } = options;

    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Update form data
    const updateFormData = useCallback((field, value) => {
        if (typeof field === 'object') {
            // Update multiple fields at once
            setFormData(prev => ({ ...prev, ...field }));
        } else {
            // Update single field
            setFormData(prev => ({ ...prev, [field]: value }));
        }
        
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    }, [errors]);

    // Handle form input changes
    const handleChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        updateFormData(name, fieldValue);
    }, [updateFormData]);

    // Reset form to initial state
    const resetForm = useCallback(() => {
        setFormData(initialData);
        setErrors({});
        setLoading(false);
    }, [initialData]);

    // Set form data (useful for editing)
    const setForm = useCallback((data) => {
        setFormData(data);
        setErrors({});
    }, []);

    // Generic form submission handler
    const submitForm = useCallback(async (url, method = 'POST', customData = null) => {
        setLoading(true);
        setErrors({});

        try {
            const dataToSubmit = customData || formData;
            const response = await axios({
                method,
                url,
                data: dataToSubmit,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.data) {
                toast.success(successMessage);
                onSuccess(response.data);
                
                if (resetOnSuccess) {
                    resetForm();
                }
            }

            return response.data;
        } catch (error) {
            console.error('Form submission error:', error);
            
            if (error.response?.data?.errors) {
                // Laravel validation errors
                setErrors(error.response.data.errors);
                toast.error('Please check the form for errors.');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error(errorMessage);
            }
            
            onError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [formData, successMessage, errorMessage, onSuccess, onError, resetOnSuccess, resetForm]);

    // Get error message for a field
    const getFieldError = useCallback((fieldName) => {
        return errors[fieldName]?.[0] || null;
    }, [errors]);

    // Check if field has error
    const hasFieldError = useCallback((fieldName) => {
        return !!(errors[fieldName] && errors[fieldName].length > 0);
    }, [errors]);

    // Validate required fields
    const validateRequired = useCallback((requiredFields) => {
        const newErrors = {};
        
        requiredFields.forEach(field => {
            if (!formData[field] || formData[field] === '') {
                newErrors[field] = ['This field is required'];
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    return {
        // State
        formData,
        errors,
        loading,
        
        // Methods
        updateFormData,
        handleChange,
        resetForm,
        setForm,
        submitForm,
        getFieldError,
        hasFieldError,
        validateRequired,
        
        // Utilities
        setErrors,
        setLoading,
    };
};

export default useForm;