import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    IconButton,
    Typography,
    Box
} from '@mui/material';
import { XMarkIcon } from '@heroicons/react/24/outline';

const RoleDialog = ({ open, onClose, onSave, role, title, isEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name || '',
                description: role.description || ''
            });
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
        setErrors({});
    }, [role, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await onSave(formData);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleChange = (field) => (e) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }
            }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div">
                        {title}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <XMarkIcon className="w-5 h-5" />
                    </IconButton>
                </Box>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <TextField
                            label="Role Name"
                            value={formData.name}
                            onChange={handleChange('name')}
                            error={!!errors.name}
                            helperText={errors.name?.[0]}
                            disabled={processing}
                            required
                            fullWidth
                            autoFocus
                        />
                        
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={handleChange('description')}
                            error={!!errors.description}
                            helperText={errors.description?.[0]}
                            disabled={processing}
                            multiline
                            rows={3}
                            fullWidth
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={onClose} 
                        disabled={processing}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={processing || !formData.name.trim()}
                        variant="contained"
                        startIcon={processing && <CircularProgress size={20} />}
                        sx={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            }
                        }}
                    >
                        {processing ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default RoleDialog;
