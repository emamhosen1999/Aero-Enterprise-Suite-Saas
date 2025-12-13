import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    IconButton
} from '@mui/material';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({ 
    open, 
    onClose, 
    onConfirm, 
    title, 
    description, 
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'primary',
    icon 
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xs" 
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
                    <Box display="flex" alignItems="center" gap={2}>
                        {icon || (
                            <ExclamationTriangleIcon 
                                className={`w-6 h-6 ${
                                    confirmColor === 'error' ? 'text-red-500' : 'text-orange-500'
                                }`} 
                            />
                        )}
                        <Typography variant="h6" component="div">
                            {title}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <XMarkIcon className="w-5 h-5" />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Typography variant="body1" className="text-gray-600 dark:text-gray-300">
                    {description}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined"
                >
                    {cancelText}
                </Button>
                <Button 
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    variant="contained"
                    color={confirmColor}
                    sx={confirmColor === 'error' ? {
                        backgroundColor: '#ef4444',
                        '&:hover': {
                            backgroundColor: '#dc2626',
                        }
                    } : {}}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
