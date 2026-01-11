import React, { useState, useRef, useEffect } from 'react';
import { 
    PhotoIcon,
    TrashIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';
import { 
    Button,
    Progress,
    Chip,
    Card,
    CardBody,
    Modal,
    ModalContent,
    Avatar
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils';

// Use the global axios instance which has CSRF configuration
const axios = window.axios;

/**
 * Employee Image Modal
 * 
 * Manages Employee HR images (badges, org charts, ID cards).
 * This is SEPARATE from User profile images.
 * 
 * Architecture:
 * - Employee Image (this modal): For HR/work purposes (badges, org charts, ID cards)
 *   - Stored on: Employee model (HRM package)
 *   - Route: hrm.employees.image.upload
 * 
 * - User Profile Image (ProfilePictureModal): For authentication/identity purposes
 *   - Stored on: User model (Core package)
 *   - Route: core.profile.image.upload
 */
const EmployeeImageModal = ({ 
    isOpen, 
    onClose, 
    employee,
    onImageUpdate
}) => {
    const fileInputRef = useRef(null);
    
    // State management
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    // Validation constraints
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const MIN_DIMENSION = 100;
    const MAX_DIMENSION = 2000;

    // Get current employee image URL - uses Employee model's image, not User's
    const currentEmployeeImage = employee?.employee_image_url || null;
    const hasCurrentImage = currentEmployeeImage && currentEmployeeImage !== null;

    // Also get User's profile image for reference (displayed separately)
    const userProfileImage = employee?.user?.profile_image_url || employee?.profile_image_url || null;

    // Handle file selection with validation
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError('');

        // Basic file type validation
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Invalid file type. Please select a JPEG, PNG, or WebP image.');
            return;
        }

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            setError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
            return;
        }

        // Create a single object URL to use for both validation and preview
        const objectUrl = URL.createObjectURL(file);

        // Image dimension validation
        const img = new Image();
        img.onload = () => {
            if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
                setError(`Image dimensions too small. Minimum size is ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.`);
                URL.revokeObjectURL(objectUrl);
                return;
            }

            if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
                setError(`Image dimensions too large. Maximum size is ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.`);
                URL.revokeObjectURL(objectUrl);
                return;
            }

            // File is valid - use the same object URL for preview
            setSelectedFile(file);
            setPreviewUrl(objectUrl);
        };

        img.onerror = () => {
            setError('Invalid image file.');
            URL.revokeObjectURL(objectUrl);
        };

        img.src = objectUrl;
    };

    // Handle upload - uploads to Employee image route, not User profile route
    const handleUpload = async () => {
        if (!selectedFile || !employee) {
            console.error('[EmployeeImageUpload] Missing file or employee:', { selectedFile, employee });
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setError('');

        const formData = new FormData();
        formData.append('employee_image', selectedFile);
        formData.append('employee_id', employee.id);

        // Get CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('hrm.employees.image.upload'), 
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'X-CSRF-TOKEN': csrfToken,
                        },
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            setUploadProgress(percentCompleted);
                        },
                    }
                );

                if (response.status === 200 && response.data.success) {
                    // Callback to update the parent component with the new employee image URL
                    if (onImageUpdate) {
                        const newImageUrl = response.data.employee_image_url;
                        onImageUpdate(employee.id, newImageUrl);
                    }
                    
                    handleClose();
                    resolve([response.data.message || 'Employee image updated successfully!']);
                } else {
                    reject([response.data.message || 'Upload failed']);
                }
            } catch (error) {
                // Comprehensive error logging
                console.error('[EmployeeImageUpload] Error details:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    responseData: error.response?.data,
                    errors: error.response?.data?.errors,
                });
                
                let errorMessage = 'Failed to upload employee image';
                let errorDetails = '';
                
                if (error.response?.status === 419) {
                    errorMessage = 'Session expired (CSRF token mismatch). Please refresh the page.';
                    errorDetails = 'CSRF Token Error';
                } else if (error.response?.status === 413) {
                    errorMessage = 'File too large. Please choose a smaller image.';
                    errorDetails = 'File Size Error';
                } else if (error.response?.status === 422) {
                    const errors = error.response.data?.errors;
                    if (errors) {
                        const errorMessages = Object.values(errors).flat().join(', ');
                        errorMessage = errorMessages || error.response.data.message || 'Validation failed';
                    } else {
                        errorMessage = error.response.data.message || 'Validation failed';
                    }
                    errorDetails = 'Validation Error';
                } else if (error.response?.status === 403) {
                    errorMessage = error.response.data?.message || 'Unauthorized to upload employee image';
                    errorDetails = 'Authorization Error';
                } else if (error.response?.status === 500) {
                    errorMessage = error.response.data?.message || 'Server error during upload';
                    errorDetails = 'Server Error';
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                    errorDetails = `HTTP ${error.response.status}`;
                } else if (error.message) {
                    errorMessage = error.message;
                    errorDetails = 'Network/Client Error';
                }
                
                setError(`${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
                reject([errorMessage]);
            } finally {
                setUploading(false);
                setUploadProgress(0);
            }
        });

        showToast.promise(promise, {
            loading: 'Uploading employee image...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };

    // Handle remove employee image
    const handleRemoveEmployeeImage = async () => {
        if (!employee) return;

        setUploading(true);
        setError('');

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(
                    route('hrm.employees.image.remove'), 
                    {
                        data: { employee_id: employee.id },
                        headers: {
                            'X-CSRF-TOKEN': csrfToken,
                        },
                    }
                );

                if (response.status === 200 && response.data.success) {
                    if (onImageUpdate) {
                        const newImageUrl = response.data.employee_image_url;
                        onImageUpdate(employee.id, newImageUrl);
                    }
                    
                    handleClose();
                    resolve([response.data.message || 'Employee image removed successfully!']);
                } else {
                    reject([response.data.message || 'Remove failed']);
                }
            } catch (error) {
                console.error('Remove error:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to remove employee image';
                setError(errorMessage);
                reject([errorMessage]);
            } finally {
                setUploading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Removing employee image...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };

    // Handle close
    const handleClose = () => {
        if (uploading) return;
        
        setSelectedFile(null);
        setPreviewUrl(null);
        setError('');
        setUploadProgress(0);
        
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
        onClose();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    if (!employee) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="lg"
            classNames={{
                base: "border border-divider bg-content1 shadow-lg",
                header: "border-b border-divider",
                footer: "border-t border-divider",
            }}
        >
            <ModalContent>
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <IdentificationIcon className="w-6 h-6 text-primary" />
                            <div>
                                <h3 className="text-lg font-semibold">Employee HR Image</h3>
                                <p className="text-sm text-default-500">
                                    For badges, org charts, and ID cards
                                </p>
                            </div>
                        </div>
                        <Button 
                            isIconOnly 
                            variant="light" 
                            onPress={handleClose}
                            isDisabled={uploading}
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Employee Info */}
                    <div className="mb-6 p-4 bg-default-100 rounded-lg">
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={previewUrl || currentEmployeeImage || userProfileImage}
                                name={employee.user?.name || employee.employee_code}
                                size="lg"
                                className="ring-2 ring-primary/20"
                            />
                            <div>
                                <p className="font-medium">{employee.user?.name || 'Employee'}</p>
                                <p className="text-sm text-default-500">{employee.employee_code}</p>
                                {employee.designation?.name && (
                                    <p className="text-xs text-default-400">{employee.designation.name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Image Comparison (if both exist) */}
                    {hasCurrentImage && userProfileImage && currentEmployeeImage !== userProfileImage && (
                        <div className="mb-6 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                            <p className="text-sm text-warning-700 flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                <span>
                                    <strong>Note:</strong> This employee has both an HR image and a User profile image.
                                </span>
                            </p>
                            <div className="flex gap-4 mt-3">
                                <div className="text-center">
                                    <Avatar src={currentEmployeeImage} size="md" />
                                    <p className="text-xs text-default-500 mt-1">HR Image</p>
                                </div>
                                <div className="text-center">
                                    <Avatar src={userProfileImage} size="md" />
                                    <p className="text-xs text-default-500 mt-1">Profile Image</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Current Image Preview */}
                    <div className="mb-6">
                        <Card className="border border-divider">
                            <CardBody className="p-4">
                                <div className="flex flex-col items-center gap-4">
                                    {/* Preview */}
                                    <div className="relative">
                                        <Avatar
                                            src={previewUrl || currentEmployeeImage}
                                            name={employee.user?.name || employee.employee_code}
                                            className="w-32 h-32 text-large ring-4 ring-primary/20"
                                            showFallback
                                            fallback={
                                                <IdentificationIcon className="w-12 h-12 text-default-400" />
                                            }
                                        />
                                        {selectedFile && (
                                            <Chip 
                                                size="sm" 
                                                color="primary"
                                                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                                            >
                                                New
                                            </Chip>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="text-center">
                                        {selectedFile ? (
                                            <div className="flex items-center gap-2 text-primary">
                                                <CheckCircleIcon className="w-4 h-4" />
                                                <span className="text-sm">{selectedFile.name}</span>
                                            </div>
                                        ) : hasCurrentImage ? (
                                            <span className="text-sm text-default-500">Current HR image</span>
                                        ) : (
                                            <span className="text-sm text-default-400">No HR image set</span>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Upload Progress */}
                    {uploading && uploadProgress > 0 && (
                        <div className="mb-6">
                            <Progress 
                                value={uploadProgress} 
                                color="primary"
                                size="sm"
                                showValueLabel
                                className="max-w-full"
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                            <p className="text-sm text-danger flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                {error}
                            </p>
                        </div>
                    )}

                    {/* File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {/* Select File Button */}
                        <Button
                            color="primary"
                            variant={selectedFile ? "flat" : "solid"}
                            startContent={<PhotoIcon className="w-5 h-5" />}
                            onPress={() => fileInputRef.current?.click()}
                            isDisabled={uploading}
                            fullWidth
                        >
                            {selectedFile ? 'Choose Different Image' : 'Select Image'}
                        </Button>

                        {/* Upload Button */}
                        {selectedFile && (
                            <Button
                                color="success"
                                variant="solid"
                                startContent={<CheckCircleIcon className="w-5 h-5" />}
                                onPress={handleUpload}
                                isLoading={uploading}
                                fullWidth
                            >
                                Upload HR Image
                            </Button>
                        )}

                        {/* Remove Button */}
                        {hasCurrentImage && !selectedFile && (
                            <Button
                                color="danger"
                                variant="flat"
                                startContent={<TrashIcon className="w-5 h-5" />}
                                onPress={handleRemoveEmployeeImage}
                                isLoading={uploading}
                                fullWidth
                            >
                                Remove HR Image
                            </Button>
                        )}

                        {/* Cancel Button */}
                        <Button
                            variant="flat"
                            onPress={handleClose}
                            isDisabled={uploading}
                            fullWidth
                        >
                            Cancel
                        </Button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 p-3 bg-default-100 rounded-lg">
                        <p className="text-xs text-default-500">
                            <strong>HR Image</strong> is used for:
                        </p>
                        <ul className="text-xs text-default-400 list-disc list-inside mt-1">
                            <li>Employee ID badges</li>
                            <li>Organization charts</li>
                            <li>HR directory</li>
                            <li>Internal documents</li>
                        </ul>
                        <p className="text-xs text-default-400 mt-2">
                            Max size: 2MB • Formats: JPEG, PNG, WebP • Min: 100×100px
                        </p>
                    </div>
                </div>
            </ModalContent>
        </Modal>
    );
};

export default EmployeeImageModal;
