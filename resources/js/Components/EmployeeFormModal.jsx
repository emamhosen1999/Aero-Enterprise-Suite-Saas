import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    MenuItem,
    Chip,
    Stack,
    TextField,
    Select,
    Switch,
    TextareaAutosize,
    Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Modal, ModalContent } from '@heroui/react';

import ProfileAvatar from '@/Components/ProfileAvatar';

const EmployeeFormModal = ({ 
    open, 
    onClose, 
    employee = null,
    onSubmit,
    departments = [],
    designations = [],
    attendanceTypes = [],
    loading = false,
    mode = 'create' // 'create', 'edit', 'view'
}) => {

    const isEdit = mode === 'edit';
    const isView = mode === 'view';
    const isCreate = mode === 'create';
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department_id: '',
        designation_id: '',
        attendance_type_id: '',
        hire_date: '',
        salary: '',
        active: true,
        notes: ''
    });
    
    // Validation state
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    
    // Initialize form data when employee changes
    useEffect(() => {
        if (employee && (isEdit || isView)) {
            setFormData({
                name: employee.name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                department_id: employee.department_id || '',
                designation_id: employee.designation_id || '',
                attendance_type_id: employee.attendance_type_id || '',
                hire_date: employee.hire_date || '',
                salary: employee.salary || '',
                active: employee.active ?? true,
                notes: employee.notes || ''
            });
        } else if (isCreate) {
            // Reset form for create mode
            setFormData({
                name: '',
                email: '',
                phone: '',
                department_id: '',
                designation_id: '',
                attendance_type_id: '',
                hire_date: '',
                salary: '',
                active: true,
                notes: ''
            });
        }
        setErrors({});
        setTouched({});
    }, [employee, mode]);

    // Field validation rules
    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value || value.trim().length < 2) {
                    return 'Name must be at least 2 characters long';
                }
                if (value.length > 255) {
                    return 'Name cannot exceed 255 characters';
                }
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    return 'Email is required';
                }
                if (!emailRegex.test(value)) {
                    return 'Please enter a valid email address';
                }
                break;
                
            case 'phone':
                if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
                    return 'Please enter a valid phone number';
                }
                if (value && value.length > 20) {
                    return 'Phone number cannot exceed 20 characters';
                }
                break;
                
            case 'salary':
                if (value && (isNaN(value) || parseFloat(value) < 0)) {
                    return 'Salary must be a positive number';
                }
                if (value && parseFloat(value) > 999999999) {
                    return 'Salary amount is too large';
                }
                break;
                
            case 'hire_date':
                if (value && new Date(value) > new Date()) {
                    return 'Hire date cannot be in the future';
                }
                break;
                
            default:
                break;
        }
        return null;
    };

    // Handle field changes
    const handleFieldChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Mark field as touched
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
        
        // Validate field and update errors
        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    // Validate entire form
    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ['name', 'email'];
        
        // Check required fields
        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
            }
        });
        
        // Validate all fields
        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = () => {
        // Mark all fields as touched
        const allTouched = {};
        Object.keys(formData).forEach(key => {
            allTouched[key] = true;
        });
        setTouched(allTouched);
        
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    // Get department name for view mode
    const getDepartmentName = (id) => {
        const dept = departments.find(d => d.id === id);
        return dept?.name || 'Not assigned';
    };

    // Get designation name for view mode
    const getDesignationName = (id) => {
        const desig = designations.find(d => d.id === id);
        return desig?.name || 'Not assigned';
    };

    // Get attendance type name for view mode
    const getAttendanceTypeName = (id) => {
        const type = attendanceTypes.find(t => t.id === id);
        return type?.name || 'Not assigned';
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "border border-divider bg-content1 shadow-lg",
                header: "border-b border-divider",
                footer: "border-t border-divider",
            }}
        >
            <ModalContent>
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                pb: 2
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2
                }}>
                    <UserIcon className="w-6 h-6" />
                    <Typography variant="h6" component="h2">
                        {isCreate && 'Add New Employee'}
                        {isEdit && 'Edit Employee'}
                        {isView && 'Employee Details'}
                    </Typography>
                </Box>
                {employee && (
                    <Chip 
                        size="small"
                        color={employee.active ? 'success' : 'danger'}
                        variant="flat"
                    >
                        {employee.active ? 'Active' : 'Inactive'}
                    </Chip>
                )}
            </DialogTitle>

            <DialogContent sx={{ py: 0 }}>
                {/* Employee Avatar (Edit/View mode) */}
                {employee && (isEdit || isView) && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mb: 3 
                    }}>
                        <ProfileAvatar
                            src={employee.profile_image_url || employee.profile_image}
                            name={employee.name}
                            size="lg"
                            className="w-20 h-20"
                        />
                    </Box>
                )}

                <Box component="form" sx={{ mt: 2 }}>
                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                                Basic Information
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Full Name"
                                placeholder="Enter employee's full name"
                                value={formData.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                required
                                disabled={isView}
                                error={touched.name && !!errors.name}
                                helperText={touched.name && errors.name}
                                fullWidth
                                InputProps={{
                                    startAdornment: <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(16px)',
                                        borderRadius: '12px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(59, 130, 246, 0.5)',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: 'rgba(255, 255, 255, 0.9)',
                                    },
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Email Address"
                                placeholder="Enter email address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                required
                                disabled={isView}
                                error={touched.email && !!errors.email}
                                helperText={touched.email && errors.email}
                                fullWidth
                                InputProps={{
                                    startAdornment: <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(16px)',
                                        borderRadius: '12px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(59, 130, 246, 0.5)',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: 'rgba(255, 255, 255, 0.9)',
                                    },
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Phone Number"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={(e) => handleFieldChange('phone', e.target.value)}
                                disabled={isView}
                                error={touched.phone && !!errors.phone}
                                helperText={touched.phone && errors.phone}
                                fullWidth
                                InputProps={{
                                    startAdornment: <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(16px)',
                                        borderRadius: '12px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(59, 130, 246, 0.5)',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: 'rgba(255, 255, 255, 0.9)',
                                    },
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <Input
                                label="Hire Date"
                                placeholder="Select hire date"
                                type="date"
                                value={formData.hire_date}
                                onValueChange={(value) => handleFieldChange('hire_date', value)}
                                isReadOnly={isView}
                                isInvalid={touched.hire_date && !!errors.hire_date}
                                errorMessage={touched.hire_date && errors.hire_date}
                                startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
                            />
                        </Grid>

                        {/* Job Information */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, mt: 2 }}>
                                Job Information
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            {isView ? (
                                <Input
                                    label="Department"
                                    value={getDepartmentName(formData.department_id)}
                                    isReadOnly
                                />
                            ) : (
                                <Select
                                    label="Department"
                                    placeholder="Select department"
                                    selectedKeys={formData.department_id ? [String(formData.department_id)] : []}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0];
                                        handleFieldChange('department_id', value ? parseInt(value) : '');
                                    }}
                                >
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            {isView ? (
                                <Input
                                    label="Designation"
                                    value={getDesignationName(formData.designation_id)}
                                    isReadOnly
                                />
                            ) : (
                                <Select
                                    label="Designation"
                                    placeholder="Select designation"
                                    selectedKeys={formData.designation_id ? [String(formData.designation_id)] : []}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0];
                                        handleFieldChange('designation_id', value ? parseInt(value) : '');
                                    }}
                                >
                                    {designations.map((desig) => (
                                        <SelectItem key={desig.id} value={desig.id}>
                                            {desig.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            {isView ? (
                                <Input
                                    label="Attendance Type"
                                    value={getAttendanceTypeName(formData.attendance_type_id)}
                                    isReadOnly
                                />
                            ) : (
                                <Select
                                    label="Attendance Type"
                                    placeholder="Select attendance type"
                                    selectedKeys={formData.attendance_type_id ? [String(formData.attendance_type_id)] : []}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0];
                                        handleFieldChange('attendance_type_id', value ? parseInt(value) : '');
                                    }}
                                >
                                    {attendanceTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <Input
                                label="Salary"
                                placeholder="Enter salary amount"
                                type="number"
                                value={formData.salary}
                                onValueChange={(value) => handleFieldChange('salary', value)}
                                isReadOnly={isView}
                                isInvalid={touched.salary && !!errors.salary}
                                errorMessage={touched.salary && errors.salary}
                                startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                            />
                        </Grid>

                        {/* Status and Notes */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, mt: 2 }}>
                                Additional Information
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Switch
                                    isSelected={formData.active}
                                    onValueChange={(value) => handleFieldChange('active', value)}
                                    isReadOnly={isView}
                                >
                                    Active Employee
                                </Switch>
                                <Chip
                                    size="small"
                                    color={formData.active ? 'success' : 'danger'}
                                    variant="flat"
                                >
                                    {formData.active ? 'Active' : 'Inactive'}
                                </Chip>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Textarea
                                label="Notes"
                                placeholder="Additional notes or comments"
                                value={formData.notes}
                                onValueChange={(value) => handleFieldChange('notes', value)}
                                isReadOnly={isView}
                                minRows={3}
                                maxRows={5}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Validation Summary */}
                {Object.keys(errors).length > 0 && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                        <Typography variant="body2" fontWeight="500">
                            Please fix the following errors:
                        </Typography>
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            {Object.values(errors).map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ 
                px: 3, 
                py: 3, 
                justifyContent: 'space-between',
                borderTop: `1px solid ${theme.palette.divider}`
            }}>
                <Button 
                    variant="light" 
                    onPress={onClose}
                    disabled={loading}
                >
                    {isView ? 'Close' : 'Cancel'}
                </Button>
                
                {!isView && (
                    <Button
                        color="primary"
                        variant="solid"
                        onPress={handleSubmit}
                        isLoading={loading}
                        startContent={!loading && <CheckCircleIcon className="w-4 h-4" />}
                    >
                        {loading ? 'Saving...' : (isCreate ? 'Create Employee' : 'Update Employee')}
                    </Button>
                )}
            </DialogActions>
            </ModalContent>
        </Modal>
    );
};

export default EmployeeFormModal;
