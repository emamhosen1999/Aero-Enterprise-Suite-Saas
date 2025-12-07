import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Box,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LoadingButton from '@mui/lab/LoadingButton';
import GlassDialog from '@/Components/GlassDialog';

/**
 * Reusable form dialog wrapper
 * Reduces duplication across form components
 */
const FormDialog = ({
    open,
    onClose,
    title,
    loading = false,
    onSubmit,
    submitText = 'Save',
    cancelText = 'Cancel',
    children,
    maxWidth = 'md',
    fullWidth = true,
    useGlass = true,
    showCancelButton = true,
    submitButtonProps = {},
    ...dialogProps
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const DialogComponent = useGlass ? GlassDialog : Dialog;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (onSubmit) {
            onSubmit(event);
        }
    };

    return (
        <DialogComponent
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            fullScreen={fullScreen}
            {...dialogProps}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1,
                }}
            >
                <Typography variant="h6" component="div">
                    {title}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: theme.palette.grey[500],
                    }}
                >
                    <XMarkIcon className="h-6 w-6" />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent
                    sx={{
                        pb: 2,
                    }}
                >
                    {children}
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2,
                        gap: 1,
                    }}
                >
                    {showCancelButton && (
                        <LoadingButton
                            onClick={onClose}
                            variant="outlined"
                            disabled={loading}
                        >
                            {cancelText}
                        </LoadingButton>
                    )}
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={loading}
                        {...submitButtonProps}
                    >
                        {submitText}
                    </LoadingButton>
                </DialogActions>
            </form>
        </DialogComponent>
    );
};

export default FormDialog;