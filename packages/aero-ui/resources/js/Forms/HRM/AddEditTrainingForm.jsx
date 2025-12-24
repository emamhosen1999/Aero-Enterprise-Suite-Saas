import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Select,
    TextField,
    Typography
} from '@mui/material';
import {XMarkIcon} from '@heroicons/react/24/outline';
import {showToast} from '@/utils/toastUtils';
import axios from 'axios';

const AddEditTrainingForm = ({ open, onClose, training = null, fetchData, currentPage, perPage, filterData }) => {
    const isEditing = !!training;
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        instructor: '',
        duration: '',
        duration_unit: 'days',
        status: 'planned',
        location: '',
        max_participants: '',
        start_date: '',
        end_date: '',
        cost: '',
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    useEffect(() => {
        // Fetch categories
        const fetchCategories = async () => {
            try {
                const response = await axios.get(route('hr.training.categories.list'));
                setCategories(response.data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                showToast.error('Failed to load training categories.');
            }
        };
        
        fetchCategories();
        
        // Set form data if editing
        if (isEditing && training) {
            setFormData({
                title: training.title || '',
                description: training.description || '',
                category_id: training.category_id || '',
                instructor: training.instructor || '',
                duration: training.duration || '',
                duration_unit: training.duration_unit || 'days',
                status: training.status || 'planned',
                location: training.location || '',
                max_participants: training.max_participants || '',
                start_date: training.start_date ? training.start_date.substring(0, 10) : '',
                end_date: training.end_date ? training.end_date.substring(0, 10) : '',
                cost: training.cost || '',
            });
        }
    }, [isEditing, training]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when field is changed
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title) newErrors.title = 'Title is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.category_id) newErrors.category_id = 'Category is required';
        if (!formData.duration) newErrors.duration = 'Duration is required';
        if (!formData.status) newErrors.status = 'Status is required';
        
        if (formData.max_participants && isNaN(formData.max_participants)) {
            newErrors.max_participants = 'Max participants must be a number';
        }
        
        if (formData.cost && isNaN(formData.cost)) {
            newErrors.cost = 'Cost must be a number';
        }
        
        if (formData.start_date && formData.end_date) {
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);
            
            if (endDate < startDate) {
                newErrors.end_date = 'End date cannot be before start date';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                let response;
                
                if (isEditing) {
                    response = await axios.put(route('hr.training.update', training.id), formData);
                } else {
                    response = await axios.post(route('hr.training.store'), formData);
                }
                
                if (response.status === 200) {
                    onClose();
                    fetchData(currentPage, perPage, filterData);
                    resolve([response.data.message || `Training ${isEditing ? 'updated' : 'created'} successfully!`]);
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                    reject([Object.values(error.response.data.errors).flat().join(', ')]);
                } else {
                    reject([error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} training session.`]);
                }
            } finally {
                setLoading(false);
            }
        });
        
        showToast.promise(promise, {
            loading: `${isEditing ? 'Updating' : 'Creating'} training session...`,
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };
    
    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                    {isEditing ? 'Edit Training Session' : 'Create New Training Session'}
                </Typography>
                <IconButton onClick={onClose} aria-label="close">
                    <XMarkIcon className="w-5 h-5" />
                </IconButton>
            </DialogTitle>
            
            <DialogContent dividers>
                <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                name="title"
                                label="Training Title"
                                placeholder="Enter training title"
                                value={formData.title}
                                onChange={(e) => handleChange(e)}
                                error={!!errors.title}
                                helperText={errors.title}
                                required
                                variant="outlined"
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Textarea
                                name="description"
                                label="Description"
                                placeholder="Enter training description"
                                value={formData.description}
                                onChange={(e) => handleChange({ target: { name: 'description', value: e.target.value }})}
                                isInvalid={!!errors.description}
                                errorMessage={errors.description}
                                isRequired
                                variant="bordered"
                                minRows={3}
                                classNames={{
                                    input: "text-small",
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Select
                                name="category_id"
                                label="Category"
                                placeholder="Select a category"
                                selectedKeys={formData.category_id ? [formData.category_id.toString()] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0];
                                    handleChange({ target: { name: 'category_id', value }});
                                }}
                                isInvalid={!!errors.category_id}
                                errorMessage={errors.category_id}
                                isRequired
                                variant="bordered"
                                classNames={{
                                    trigger: "h-unit-12",
                                }}
                            >
                                {categories.map(category => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="instructor"
                                label="Instructor"
                                placeholder="Enter instructor name"
                                value={formData.instructor}
                                onChange={(e) => handleChange(e)}
                                error={!!errors.instructor}
                                helperText={errors.instructor}
                                variant="outlined"
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={6} md={3}>
                            <TextField
                                name="duration"
                                label="Duration"
                                placeholder="Enter duration"
                                type="number"
                                value={formData.duration}
                                onChange={(e) => handleChange(e)}
                                error={!!errors.duration}
                                helperText={errors.duration}
                                required
                                variant="outlined"
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={6} md={3}>
                            <Select
                                name="duration_unit"
                                label="Unit"
                                placeholder="Select unit"
                                selectedKeys={[formData.duration_unit]}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0];
                                    handleChange({ target: { name: 'duration_unit', value }});
                                }}
                                variant="bordered"
                                classNames={{
                                    trigger: "h-unit-12",
                                }}
                            >
                                <SelectItem key="hours" value="hours">Hours</SelectItem>
                                <SelectItem key="days" value="days">Days</SelectItem>
                                <SelectItem key="weeks" value="weeks">Weeks</SelectItem>
                                <SelectItem key="months" value="months">Months</SelectItem>
                            </Select>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Select
                                name="status"
                                label="Status"
                                placeholder="Select status"
                                selectedKeys={[formData.status]}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0];
                                    handleChange({ target: { name: 'status', value }});
                                }}
                                isInvalid={!!errors.status}
                                errorMessage={errors.status}
                                isRequired
                                variant="bordered"
                                classNames={{
                                    trigger: "h-unit-12",
                                }}
                            >
                                <SelectItem key="planned" value="planned">Planned</SelectItem>
                                <SelectItem key="active" value="active">Active</SelectItem>
                                <SelectItem key="completed" value="completed">Completed</SelectItem>
                                <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                            </Select>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="location"
                                label="Location"
                                placeholder="Enter training location"
                                value={formData.location}
                                onChange={(e) => handleChange(e)}
                                error={!!errors.location}
                                helperText={errors.location}
                                variant="outlined"
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="max_participants"
                                label="Maximum Participants"
                                placeholder="Enter max participants"
                                type="number"
                                value={formData.max_participants}
                                onChange={(e) => handleChange(e)}
                                error={!!errors.max_participants}
                                helperText={errors.max_participants}
                                variant="outlined"
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="cost"
                                label="Cost"
                                placeholder="Enter training cost"
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={(e) => handleChange(e)}
                                error={!!errors.cost}
                                helperText={errors.cost}
                                variant="outlined"
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <DatePicker
                                name="start_date"
                                label="Start Date"
                                value={formData.start_date}
                                onChange={(date) => handleChange({ target: { name: 'start_date', value: date }})}
                                isInvalid={!!errors.start_date}
                                errorMessage={errors.start_date}
                                variant="bordered"
                                showMonthAndYearPickers
                                classNames={{
                                    base: "w-full",
                                    input: "text-small",
                                    inputWrapper: "h-unit-12",
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <DatePicker
                                name="end_date"
                                label="End Date"
                                value={formData.end_date}
                                onChange={(date) => handleChange({ target: { name: 'end_date', value: date }})}
                                isInvalid={!!errors.end_date}
                                errorMessage={errors.end_date}
                                variant="bordered"
                                showMonthAndYearPickers
                                classNames={{
                                    base: "w-full",
                                    input: "text-small",
                                    inputWrapper: "h-unit-12",
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Button 
                    onClick={onClose} 
                    variant="light"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit}
                    color="primary"
                    isLoading={loading}
                >
                    {isEditing ? 'Update Training' : 'Create Training'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddEditTrainingForm;
