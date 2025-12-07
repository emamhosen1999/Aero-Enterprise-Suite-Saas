import React from 'react';
import { Grid } from '@mui/material';
import FormDialog from '@/Components/FormDialog';
import { FormTextField, FormSelectField, FormSwitchField } from '@/Components/FormFields';
import { useForm } from '@/hooks/useForm';

/**
 * Example of refactored form using new abstractions
 * This demonstrates how the new components reduce duplication
 */
const RefactoredDesignationForm = ({ 
    open, 
    onClose, 
    onSuccess, 
    designation = null, 
    departments = [] 
}) => {
    const isEditing = !!designation;
    
    const {
        formData,
        loading,
        handleChange,
        submitForm,
        getFieldError,
        setForm,
        resetForm
    } = useForm(
        {
            title: '',
            department_id: '',
            is_active: true,
        },
        {
            onSuccess: (data) => {
                onSuccess(data);
                onClose();
            },
            successMessage: isEditing ? 'Designation updated successfully' : 'Designation created successfully',
        }
    );

    // Set form data when editing
    React.useEffect(() => {
        if (designation) {
            setForm({
                title: designation.title || '',
                department_id: designation.department_id || '',
                is_active: designation.is_active ?? true,
            });
        } else {
            resetForm();
        }
    }, [designation, setForm, resetForm]);

    const handleSubmit = async () => {
        const url = isEditing 
            ? `/hr/designations/${designation.id}`
            : '/hr/designations';
        const method = isEditing ? 'PUT' : 'POST';
        
        await submitForm(url, method);
    };

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            title={isEditing ? 'Edit Designation' : 'Add New Designation'}
            loading={loading}
            onSubmit={handleSubmit}
            submitText={isEditing ? 'Update' : 'Create'}
        >
            <Grid container spacing={3}>
                <FormTextField
                    name="title"
                    label="Designation Title"
                    value={formData.title}
                    onChange={handleChange}
                    error={getFieldError('title')}
                    required
                    gridProps={{ xs: 12 }}
                />

                <FormSelectField
                    name="department_id"
                    label="Department"
                    value={formData.department_id}
                    onChange={handleChange}
                    options={departments}
                    error={getFieldError('department_id')}
                    required
                    gridProps={{ xs: 12 }}
                />

                <FormSwitchField
                    name="is_active"
                    label="Active Status"
                    checked={formData.is_active}
                    onChange={handleChange}
                    gridProps={{ xs: 12 }}
                />
            </Grid>
        </FormDialog>
    );
};

export default RefactoredDesignationForm;