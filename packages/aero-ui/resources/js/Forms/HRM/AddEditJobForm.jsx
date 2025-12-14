import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography
} from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import LoadingButton from "@mui/lab/LoadingButton";

import {showToast} from "@/utils/toastUtils";
import {Modal, ModalContent} from "@heroui/react";
import {usePage} from "@inertiajs/react";
import axios from 'axios';
import dayjs from 'dayjs';

const AddEditJobForm = ({
    open,
    onClose,
    job = null,
    onSuccess,
    departments: propDepartments = [],
    managers: propManagers = [],
    addJobOptimized,
    updateJobOptimized,
    fetchJobStats
}) => {
    const { auth } = usePage().props;

    const isEditing = !!job;

    // State management like LeaveForm
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    // Form data state
    const [formData, setFormData] = useState({
        title: job?.title || '',
        department_id: job?.department_id || '',
        type: job?.type || 'full_time',
        location: job?.location || '',
        is_remote_allowed: job?.is_remote_allowed || false,
        description: job?.description || '',
        responsibilities: job?.responsibilities || [],
        requirements: job?.requirements || [],
        qualifications: job?.qualifications || [],
        salary_min: job?.salary_min || '',
        salary_max: job?.salary_max || '',
        salary_currency: job?.salary_currency || 'USD',
        benefits: job?.benefits || [],
        posting_date: job?.posting_date ? dayjs(job.posting_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        closing_date: job?.closing_date ? dayjs(job.closing_date).format('YYYY-MM-DD') : '',
        status: job?.status || 'draft',
        hiring_manager_id: job?.hiring_manager_id || '',
        positions: job?.positions || 1,
        salary_visible: job?.salary_visible || false,
        is_featured: job?.is_featured || false,
        skills_required: job?.skills_required || [],
        custom_fields: job?.custom_fields || []
    });

    // Initialize state variables
    const [departments, setDepartments] = useState(propDepartments);
    const [managers, setManagers] = useState(propManagers);
    const [loadingManagers, setLoadingManagers] = useState(false);

    // Array item management - separate states for each type
    const [newResponsibility, setNewResponsibility] = useState('');
    const [newRequirement, setNewRequirement] = useState('');
    const [newQualification, setNewQualification] = useState('');
    const [newBenefit, setNewBenefit] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [newCustomField, setNewCustomField] = useState({ key: '', value: '' });

    // Fetch all managers when form opens
    useEffect(() => {
        if (open && managers && managers.length === 0) {
            // Only fetch managers if they're not already provided
            setLoadingManagers(true);
            axios.get(route('hr.managers.list'))
                .then(response => {
                    if (response.data && Array.isArray(response.data)) {
                        setManagers(response.data);
                    }
                })
                .catch(error => {
                    console.error('Error fetching managers:', error);
                })
                .finally(() => {
                    setLoadingManagers(false);
                });
        } else if (open && managers && managers.length > 0) {
            // Use the managers passed in from props
            setManagers(managers);
            setLoadingManagers(false);
        }
    }, [open, managers]);

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        
        if (typeof dateString === 'string' && dateString.includes('T')) {
            return dateString.split('T')[0];
        }
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return '';
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    // Load form data if editing
    useEffect(() => {
        if (open && isEditing && job) {
            setFormData({
                title: job.title || '',
                department_id: job.department_id || '',
                type: job.type || 'full_time',
                location: job.location || '',
                is_remote_allowed: job.is_remote_allowed || false,
                description: job.description || '',
                responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
                requirements: Array.isArray(job.requirements) ? job.requirements : [],
                qualifications: Array.isArray(job.qualifications) ? job.qualifications : [],
                salary_min: job.salary_min || '',
                salary_max: job.salary_max || '',
                salary_currency: job.salary_currency || 'USD',
                benefits: Array.isArray(job.benefits) ? job.benefits : [],
                posting_date: job.posting_date ? formatDate(job.posting_date) : dayjs().format('YYYY-MM-DD'),
                closing_date: job.closing_date ? formatDate(job.closing_date) : '',
                status: job.status || 'draft',
                hiring_manager_id: job.hiring_manager_id || '',
                positions: job.positions || 1,
                salary_visible: job.salary_visible || false,
                is_featured: job.is_featured || false,
                skills_required: Array.isArray(job.skills_required) ? job.skills_required : [],
                custom_fields: Array.isArray(job.custom_fields) ? job.custom_fields : []
            });
        }
        if (open) {
            setErrors({});
        }
    }, [open, isEditing, job]);
            

    // Form handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: fieldValue
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Array item handlers - separate for each type
    const handleAddResponsibility = () => {
        if (!newResponsibility.trim()) return;
        
        setFormData(prev => ({
            ...prev,
            responsibilities: [...prev.responsibilities, newResponsibility.trim()]
        }));
        
        setNewResponsibility('');
    };

    const handleAddRequirement = () => {
        if (!newRequirement.trim()) return;
        
        setFormData(prev => ({
            ...prev,
            requirements: [...prev.requirements, newRequirement.trim()]
        }));
        
        setNewRequirement('');
    };

    const handleAddQualification = () => {
        if (!newQualification.trim()) return;
        
        setFormData(prev => ({
            ...prev,
            qualifications: [...prev.qualifications, newQualification.trim()]
        }));
        
        setNewQualification('');
    };

    const handleAddBenefit = () => {
        if (!newBenefit.trim()) return;
        
        setFormData(prev => ({
            ...prev,
            benefits: [...prev.benefits, newBenefit.trim()]
        }));
        
        setNewBenefit('');
    };

    const handleAddSkill = () => {
        if (!newSkill.trim()) return;
        
        setFormData(prev => ({
            ...prev,
            skills_required: [...prev.skills_required, newSkill.trim()]
        }));
        
        setNewSkill('');
    };

    const handleAddCustomField = () => {
        if (!newCustomField.key.trim() || !newCustomField.value.trim()) return;
        
        setFormData(prev => ({
            ...prev,
            custom_fields: [
                ...prev.custom_fields, 
                { 
                    key: newCustomField.key.trim(), 
                    value: newCustomField.value.trim(),
                    id: Date.now() // Simple ID for tracking
                }
            ]
        }));
        
        setNewCustomField({ key: '', value: '' });
    };
    
    const handleDeleteItem = (item, type) => {
        setFormData(prev => ({
            ...prev,
            [type]: type === 'custom_fields' 
                ? prev[type].filter(field => field.id !== item.id)
                : prev[type].filter(i => i !== item)
        }));
    };

    // Submit handler - Updated to use AJAX like LeaveForm
    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const apiRoute = isEditing 
                    ? route('hr.recruitment.update.ajax', job.id) 
                    : route('hr.recruitment.store.ajax');

                const requestData = {
                    ...formData,
                    _method: isEditing ? 'PUT' : 'POST'
                };

                const response = await axios.post(apiRoute, requestData);

                if (response.status === 200) {
                    // Use optimized data manipulation like LeaveForm
                    if (isEditing && updateJobOptimized && response.data.job) {
                        updateJobOptimized(response.data.job);
                        fetchJobStats && fetchJobStats();
                    } else if (addJobOptimized && response.data.job) {
                        addJobOptimized(response.data.job);
                        fetchJobStats && fetchJobStats();
                    }
                    
                    onClose();
                    resolve([response.data.message || (isEditing ? 'Job updated successfully!' : 'Job created successfully!')]);
                }
            } catch (error) {
                console.error(error);
                setProcessing(false);

                if (error.response) {
                    if (error.response.status === 422) {
                        setErrors(error.response.data.errors || {});
                        reject(error.response.data.message || 'Please correct the validation errors.');
                    } else {
                        reject('An unexpected error occurred. Please try again later.');
                    }
                } else if (error.request) {
                    reject('No response received from the server. Please check your internet connection.');
                } else {
                    reject('An error occurred while setting up the request.');
                }
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <CircularProgress />
                                <span style={{ marginLeft: '8px' }}>
                                    {isEditing ? 'Updating job...' : 'Creating job...'}
                                </span>
                            </div>
                        );
                    },
                    icon: false,
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard?.background || 'rgba(255, 255, 255, 0.1)',
                        border: theme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
                        color: theme.palette.text.primary,
                    },
                },
                success: {
                    render({ data }) {
                        return (
                            <>
                                {data.map((message, index) => (
                                    <div key={index}>{message}</div>
                                ))}
                            </>
                        );
                    },
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard?.background || 'rgba(255, 255, 255, 0.1)',
                        border: theme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
                        color: theme.palette.text.primary,
                    },
                },
                error: {
                    render({ data }) {
                        return <>{data}</>;
                    },
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard?.background || 'rgba(255, 255, 255, 0.1)',
                        border: theme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
                        color: theme.palette.text.primary,
                    },
                },
            }
        );
    };
    
    
    const jobTypeOptions = [
        { value: 'full_time', label: 'Full Time' },
        { value: 'part_time', label: 'Part Time' },
        { value: 'contract', label: 'Contract' },
        { value: 'temporary', label: 'Temporary' },
        { value: 'internship', label: 'Internship' },
        { value: 'remote', label: 'Remote' }
    ];
    
    const currencyOptions = [
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
        { value: 'INR', label: 'INR (₹)' },
        { value: 'JPY', label: 'JPY (¥)' },
        { value: 'CAD', label: 'CAD ($)' },
        { value: 'AUD', label: 'AUD ($)' }
    ];
    
    const statusOptions = [
        { value: 'draft', label: 'Draft' },
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'cancelled', label: 'Cancelled' }
    ];
    
    return (
        <Modal 
            isOpen={open} 
            onClose={onClose}
            size="5xl"
            scrollBehavior="inside"
            classNames={{
                base: "border border-divider bg-content1 shadow-lg min-h-[80vh] max-h-[90vh]",
                header: "border-b border-divider",
                footer: "border-t border-divider",
            }}
        >
            <ModalContent>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', pb: 2 }}>
                <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
                    {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
                </Typography>
                <IconButton
                    onClick={onClose}
                    sx={{ 
                        position: 'absolute', 
                        right: 8, 
                        top: 8,
                        color: theme.palette.grey[500]
                    }}
                >
                    <ClearIcon />
                </IconButton>
            </DialogTitle>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <DialogContent sx={{ 
                    pt: 1, 
                    flex: 1,
                    maxHeight: 'calc(90vh - 120px)', 
                    overflowY: 'auto',
                    paddingBottom: '80px', // Add padding to prevent content from hiding behind footer
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: theme.palette.primary.main,
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: theme.palette.primary.dark,
                    }
                }}>
                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                                Basic Information
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Job Title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                error={!!errors.title}
                                helperText={errors.title}
                                placeholder="e.g., Senior Software Engineer"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            {/* Designation removed because it's not in the database schema */}
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required error={!!errors.department_id}>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    name="department_id"
                                    value={formData.department_id}
                                    onChange={(e) => handleSelectChange('department_id', e.target.value)}
                                    label="Department"
                                >
                                    {departments.map((department) => (
                                        <MenuItem key={department.id} value={department.id}>
                                            {department.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.department_id && <FormHelperText>{errors.department_id}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required error={!!errors.type}>
                                <InputLabel>Job Type</InputLabel>
                                <Select
                                    name="type"
                                    value={formData.type}
                                    onChange={(e) => handleSelectChange('type', e.target.value)}
                                    label="Job Type"
                                >
                                    {jobTypeOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        {/* Location and Remote */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', height: '56px' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_remote_allowed}
                                            onChange={handleChange}
                                            name="is_remote_allowed"
                                            color="primary"
                                        />
                                    }
                                    label="Remote Job"
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                disabled={formData.is_remote_allowed}
                                required={!formData.is_remote_allowed}
                                error={!!errors.location}
                                helperText={errors.location || (formData.is_remote_allowed ? "Not applicable for remote jobs" : "")}
                                placeholder={formData.is_remote_allowed ? "Not applicable for remote jobs" : "e.g., New York, NY"}
                            />
                        </Grid>

                        {/* Management and Positions */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required error={!!errors.hiring_manager_id}>
                                <InputLabel>Hiring Manager</InputLabel>
                                <Select
                                    name="hiring_manager_id"
                                    value={formData.hiring_manager_id || ''}
                                    onChange={(e) => handleSelectChange('hiring_manager_id', e.target.value)}
                                    label="Hiring Manager"
                                    disabled={loadingManagers}
                                    startAdornment={
                                        loadingManagers ? (
                                            <InputAdornment position="start">
                                                <CircularProgress size={20} />
                                            </InputAdornment>
                                        ) : null
                                    }
                                >
                                    <MenuItem value="">
                                        <em>Select a Manager</em>
                                    </MenuItem>
                                    {managers.map((manager) => (
                                        <MenuItem key={manager.id} value={manager.id}>
                                            {manager.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.hiring_manager_id && <FormHelperText>{errors.hiring_manager_id}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Number of Positions"
                                name="positions"
                                type="number"
                                value={formData.positions}
                                onChange={handleChange}
                                required
                                error={!!errors.positions}
                                helperText={errors.positions}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>

                        {/* Status and Dates */}
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth required error={!!errors.status}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={(e) => handleSelectChange('status', e.target.value)}
                                    label="Status"
                                >
                                    {statusOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Posted Date"
                                name="posting_date"
                                type="date"
                                value={formData.posting_date}
                                onChange={handleChange}
                                required
                                error={!!errors.posting_date}
                                helperText={errors.posting_date}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Closing Date"
                                name="closing_date"
                                type="date"
                                value={formData.closing_date}
                                onChange={handleChange}
                                error={!!errors.closing_date}
                                helperText={errors.closing_date}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>

                        {/* Job Description */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Job Description
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Job Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                error={!!errors.description}
                                helperText={errors.description}
                                placeholder="Describe the job role, company culture, and what makes this position attractive..."
                            />
                        </Grid>

                        {/* Responsibilities */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Key Responsibilities
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Add Responsibility"
                                    value={newResponsibility}
                                    onChange={(e) => setNewResponsibility(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddResponsibility();
                                        }
                                    }}
                                    size="small"
                                    placeholder="e.g., Develop and maintain web applications"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleAddResponsibility}
                                    disabled={!newResponsibility.trim()}
                                    startIcon={<AddIcon />}
                                    sx={{ minWidth: 100 }}
                                >
                                    Add
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.responsibilities.map((item, index) => (
                                    <Chip
                                        key={index}
                                        label={item}
                                        onDelete={() => handleDeleteItem(item, 'responsibilities')}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                            {errors.responsibilities && (
                                <FormHelperText error sx={{ mt: 1 }}>{errors.responsibilities}</FormHelperText>
                            )}
                        </Grid>

                        {/* Requirements */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Requirements
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Add Requirement"
                                    value={newRequirement}
                                    onChange={(e) => setNewRequirement(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddRequirement();
                                        }
                                    }}
                                    size="small"
                                    placeholder="e.g., 3+ years of experience with React"
                                />
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleAddRequirement}
                                    disabled={!newRequirement.trim()}
                                    startIcon={<AddIcon />}
                                    sx={{ minWidth: 100 }}
                                >
                                    Add
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.requirements.map((item, index) => (
                                    <Chip
                                        key={index}
                                        label={item}
                                        onDelete={() => handleDeleteItem(item, 'requirements')}
                                        color="secondary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                            {errors.requirements && (
                                <FormHelperText error sx={{ mt: 1 }}>{errors.requirements}</FormHelperText>
                            )}
                        </Grid>

                        {/* Qualifications */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Preferred Qualifications
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Add Qualification"
                                    value={newQualification}
                                    onChange={(e) => setNewQualification(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddQualification();
                                        }
                                    }}
                                    size="small"
                                    placeholder="e.g., Bachelor's degree in Computer Science"
                                />
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleAddQualification}
                                    disabled={!newQualification.trim()}
                                    startIcon={<AddIcon />}
                                    sx={{ minWidth: 100 }}
                                >
                                    Add
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.qualifications.map((item, index) => (
                                    <Chip
                                        key={index}
                                        label={item}
                                        onDelete={() => handleDeleteItem(item, 'qualifications')}
                                        color="success"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Grid>

                        {/* Required Skills */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Required Skills
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Add Skill"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSkill();
                                        }
                                    }}
                                    size="small"
                                    placeholder="e.g., JavaScript, React, Node.js"
                                />
                                <Button
                                    variant="contained"
                                    color="info"
                                    onClick={handleAddSkill}
                                    disabled={!newSkill.trim()}
                                    startIcon={<AddIcon />}
                                    sx={{ minWidth: 100 }}
                                >
                                    Add
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.skills_required.map((skill, index) => (
                                    <Chip
                                        key={index}
                                        label={skill}
                                        onDelete={() => handleDeleteItem(skill, 'skills_required')}
                                        color="info"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Grid>

                        {/* Custom Fields */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Additional Information
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Field Name"
                                    value={newCustomField.key}
                                    onChange={(e) => setNewCustomField(prev => ({ ...prev, key: e.target.value }))}
                                    size="small"
                                    placeholder="e.g., Travel Required, Security Clearance"
                                />
                                <TextField
                                    fullWidth
                                    label="Field Value"
                                    value={newCustomField.value}
                                    onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustomField();
                                        }
                                    }}
                                    size="small"
                                    placeholder="e.g., 25%, Required"
                                />
                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={handleAddCustomField}
                                    disabled={!newCustomField.key.trim() || !newCustomField.value.trim()}
                                    startIcon={<AddIcon />}
                                    sx={{ minWidth: 100 }}
                                >
                                    Add
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.custom_fields.map((field, index) => (
                                    <Chip
                                        key={field.id || index}
                                        label={`${field.key}: ${field.value}`}
                                        onDelete={() => handleDeleteItem(field, 'custom_fields')}
                                        color="warning"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Grid>

                        {/* Salary Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Compensation
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Minimum Salary"
                                name="salary_min"
                                type="number"
                                value={formData.salary_min}
                                onChange={handleChange}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">
                                        {currencyOptions.find(c => c.value === formData.salary_currency)?.label.split(' ')[1] || '$'}
                                    </InputAdornment>
                                }}
                                placeholder="50000"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Maximum Salary"
                                name="salary_max"
                                type="number"
                                value={formData.salary_max}
                                onChange={handleChange}
                                error={!!errors.salary_max}
                                helperText={errors.salary_max}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">
                                        {currencyOptions.find(c => c.value === formData.salary_currency)?.label.split(' ')[1] || '$'}
                                    </InputAdornment>
                                }}
                                placeholder="80000"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Currency</InputLabel>
                                <Select
                                    name="salary_currency"
                                    value={formData.salary_currency}
                                    onChange={(e) => handleSelectChange('salary_currency', e.target.value)}
                                    label="Currency"
                                >
                                    {currencyOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Benefits */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Benefits & Perks
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Add Benefit"
                                    value={newBenefit}
                                    onChange={(e) => setNewBenefit(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddBenefit();
                                        }
                                    }}
                                    size="small"
                                    placeholder="e.g., Health insurance, Flexible working hours"
                                />
                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={handleAddBenefit}
                                    disabled={!newBenefit.trim()}
                                    startIcon={<AddIcon />}
                                    sx={{ minWidth: 100 }}
                                >
                                    Add
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.benefits.map((item, index) => (
                                    <Chip
                                        key={index}
                                        label={item}
                                        onDelete={() => handleDeleteItem(item, 'benefits')}
                                        color="warning"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Grid>

                        {/* Additional Settings */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600, mt: 3 }}>
                                Additional Settings
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.salary_visible}
                                        onChange={handleChange}
                                        name="salary_visible"
                                        color="primary"
                                    />
                                }
                                label="Display Salary Information"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_featured}
                                        onChange={handleChange}
                                        name="is_featured"
                                        color="primary"
                                    />
                                }
                                label="Featured Job Listing"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                
                <DialogActions sx={{ 
                    padding: '16px', 
                    justifyContent: 'center',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 1,
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderTop: `1px solid rgba(255, 255, 255, 0.2)`,
                    gap: 2
                }}>
                    <LoadingButton
                        onClick={onClose}
                        disabled={processing}
                        variant="outlined"
                        color="primary"
                        sx={{ borderRadius: '50px' }}
                    >
                        Cancel
                    </LoadingButton>
                    <LoadingButton
                        type="submit"
                        variant="outlined"
                        color="primary"
                        loading={processing}
                        sx={{ borderRadius: '50px' }}
                    >
                        {isEditing ? 'Update Job Posting' : 'Create Job Posting'}
                    </LoadingButton>
                </DialogActions>
            </form>
            </ModalContent>
        </Modal>
    );
};

export default AddEditJobForm;
