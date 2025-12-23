import React, { useState, useRef } from 'react';
import { 
    PhotoIcon,
    TrashIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
    Button,
    Progress,
    Chip,
    Card,
    CardBody,
    Modal,
    ModalContent
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils';
import ProfileAvatar from './ProfileAvatar';

// Use the global axios instance which has CSRF configuration
const axios = window.axios;

const ProfilePictureModal = ({ 
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

    // Get current profile image URL - now uses the proper accessor
    const currentProfileImage = employee?.profile_image_url || null;
    const hasCurrentImage = currentProfileImage && currentProfileImage !== null;

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

    // Handle upload
    const handleUpload = async () => {
        if (!selectedFile || !employee) {
            console.error('[ProfileUpload] Missing file or employee:', { selectedFile, employee });
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setError('');

        const formData = new FormData();
        formData.append('profile_image', selectedFile);
        formData.append('user_id', employee.id);

        // Get CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
       

        try {
            const response = await axios.post(
                route('profile.image.upload'), 
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

           

            if (response.data.success) {
                showToast.success(response.data.message || 'Profile picture updated successfully!');
                
                // Callback to update the parent component with the new profile image URL
                if (onImageUpdate) {
                    const newImageUrl = response.data.profile_image_url;
                   
                    onImageUpdate(employee.id, newImageUrl);
                }
                
                handleClose();
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (error) {
            // Comprehensive error logging
            console.error('[ProfileUpload] Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                errors: error.response?.data?.errors,
                headers: error.response?.headers,
            });
            
            let errorMessage = 'Failed to upload profile picture';
            let errorDetails = '';
            
            if (error.response?.status === 419) {
                errorMessage = 'Session expired (CSRF token mismatch). Please refresh the page.';
                errorDetails = 'CSRF Token Error';
            } else if (error.response?.status === 413) {
                errorMessage = 'File too large. Please choose a smaller image.';
                errorDetails = 'File Size Error';
            } else if (error.response?.status === 422) {
                // Validation errors
                const errors = error.response.data?.errors;
                if (errors) {
                    const errorMessages = Object.values(errors).flat().join(', ');
                    errorMessage = errorMessages || error.response.data.message || 'Validation failed';
                } else {
                    errorMessage = error.response.data.message || 'Validation failed';
                }
                errorDetails = 'Validation Error';
            } else if (error.response?.status === 403) {
                errorMessage = error.response.data?.message || 'Unauthorized to upload profile image';
                errorDetails = 'Authorization Error';
            } else if (error.response?.status === 500) {
                errorMessage = error.response.data?.message || 'Server error during upload';
                errorDetails = 'Server Error: ' + (error.response.data?.exception || 'Unknown');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                errorDetails = `HTTP ${error.response.status}`;
            } else if (error.message) {
                errorMessage = error.message;
                errorDetails = 'Network/Client Error';
            }
            
            // Show detailed error in console
            console.error(`[ProfileUpload] ${errorDetails}:`, errorMessage);
            
            // Set error for UI display
            setError(`${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
            showToast.error(errorMessage);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Handle remove profile picture
    const handleRemoveProfilePicture = async () => {
        if (!employee) return;

        setUploading(true);
        setError('');

        // Get CSRF token from meta tag as fallback
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        try {
            const response = await axios.delete(
                route('profile.image.remove'), 
                {
                    data: { user_id: employee.id },
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                }
            );

            if (response.data.success) {
                showToast.success(response.data.message || 'Profile picture removed successfully!');
                
                // Callback to update the parent component
                if (onImageUpdate) {
                    // Use the explicit profile_image_url from response (should be null after removal)
                    const newImageUrl = response.data.profile_image_url;
                    onImageUpdate(employee.id, newImageUrl);
                }
                
                handleClose();
            } else {
                throw new Error(response.data.message || 'Remove failed');
            }
        } catch (error) {
            console.error('Remove error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to remove profile picture';
            setError(errorMessage);
            showToast.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (uploading) return; // Prevent closing during upload
        
        setSelectedFile(null);
        setPreviewUrl(null);
        setError('');
        setUploadProgress(0);
        
        // Clean up object URL
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
        onClose();
    };

    // Don't render if no employee
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
                        <PhotoIcon className="w-6 h-6 text-blue-500" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Update Profile Picture
                            </h3>
                            <p className="text-sm text-gray-500">
                                {employee?.name || 'Employee'}
                            </p>
                        </div>
                    </div>
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </Button>
                </div>

                {/* Current Profile Picture */}
                <div className="flex justify-center mb-6">
                    <ProfileAvatar
                        src={previewUrl || currentProfileImage || undefined}
                        name={employee?.name || 'Employee'}
                        size="lg"
                        className="w-24 h-24"
                        showBorder
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <Chip
                        color="danger"
                        variant="flat"
                        startContent={<ExclamationTriangleIcon className="w-4 h-4" />}
                        className="mb-4 w-full"
                    >
                        {error}
                    </Chip>
                )}

                {/* Upload Progress */}
                {uploading && (
                    <div className="mb-4">
                        <Progress
                            value={uploadProgress}
                            color="primary"
                            size="sm"
                            label="Uploading..."
                            showValueLabel={true}
                            className="w-full"
                        />
                    </div>
                )}

                {/* File Selection */}
                <Card className="mb-4">
                    <CardBody className="space-y-4">
                        <div className="text-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploading}
                            />
                            
                            <Button
                                onPress={() => fileInputRef.current?.click()}
                                startContent={<PhotoIcon className="w-5 h-5" />}
                                variant="flat"
                                color="primary"
                                disabled={uploading}
                                className="mb-3"
                            >
                                Choose New Picture
                            </Button>
                            
                            <div className="text-xs text-gray-500 space-y-1">
                                <p>Supported formats: JPEG, PNG, WebP</p>
                                <p>Maximum size: 2MB</p>
                                <p>Minimum dimensions: 100x100px</p>
                                <p>Maximum dimensions: 2000x2000px</p>
                            </div>
                        </div>

                        {/* Selected File Info */}
                        {selectedFile && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => {
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                            setError('');
                                        }}
                                        disabled={uploading}
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    {hasCurrentImage && (
                        <Button
                            onPress={handleRemoveProfilePicture}
                            startContent={<TrashIcon className="w-4 h-4" />}
                            color="danger"
                            variant="flat"
                            disabled={uploading}
                        >
                            Remove Picture
                        </Button>
                    )}
                    
                    <Button
                        onPress={handleClose}
                        variant="flat"
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    
                    <Button
                        onPress={handleUpload}
                        color="primary"
                        disabled={!selectedFile || uploading}
                        isLoading={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Update Picture'}
                    </Button>
                </div>
            </div>
            </ModalContent>
        </Modal>
    );
};

export default ProfilePictureModal;
