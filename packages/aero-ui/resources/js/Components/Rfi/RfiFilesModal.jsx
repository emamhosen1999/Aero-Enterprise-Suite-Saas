import React, { useState, useCallback, useRef } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Image,
    Spinner,
    Chip,
    Divider,
    Progress,
} from "@heroui/react";
import {
    DocumentIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    PlusIcon,
    XMarkIcon,
    PhotoIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import axios from 'axios';

/**
 * RfiFilesModal - Modal for managing RFI file attachments
 * Supports upload, preview, download, and deletion of images and PDFs
 */
const RfiFilesModal = ({
    isOpen,
    onClose,
    rfi,
    onFilesUpdated,
}) => {
    const [files, setFiles] = useState([]);
    const themeRadius = useThemeRadius();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deletingId, setDeletingId] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch files when modal opens
    React.useEffect(() => {
        if (isOpen && rfi?.id) {
            fetchFiles();
        }
    }, [isOpen, rfi?.id]);

    const fetchFiles = async () => {
        if (!rfi?.id) return;
        
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.daily-works.files.list', rfi.id));
            setFiles(response.data.files || []);
        } catch (error) {
            console.error('Error fetching RFI files:', error.response?.data || error.message || error);
            showToast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to load RFI files');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('rfi.daily-works.files.upload', rfi.id),
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                        onUploadProgress: (progressEvent) => {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadProgress(percent);
                        },
                    }
                );

                // Check if there were any upload errors in the response
                if (response.data.errors && response.data.errors.length > 0) {
                    const errorMessages = response.data.errors.map(e => e.error || e.file).join('; ');
                    console.error('Upload errors from server:', response.data.errors);
                    reject(errorMessages);
                    return;
                }

                // Check if no files were uploaded
                if (!response.data.files || response.data.files.length === 0) {
                    console.error('No files were uploaded:', response.data);
                    reject('No files were uploaded. Please try again.');
                    return;
                }

                // Refresh file list
                await fetchFiles();
                
                // Notify parent to update counts
                if (onFilesUpdated) {
                    onFilesUpdated(response.data.total_files);
                }
                
                resolve(response.data.message || 'Files uploaded successfully');
            } catch (error) {
                console.error('Error uploading files:', error.response?.data || error.message || error);
                const errorMessage = error.response?.data?.errors?.files?.[0] 
                    || error.response?.data?.error 
                    || error.response?.data?.message
                    || 'Failed to upload files';
                reject(errorMessage);
            } finally {
                setUploading(false);
                setUploadProgress(0);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        });

        showToast.promise(promise, {
            loading: 'Uploading files...',
            success: (msg) => msg,
            error: (msg) => msg,
        });
    };

    const handleDelete = async (mediaId) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        setDeletingId(mediaId);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('rfi.daily-works.files.delete', [rfi.id, mediaId]));
                
                // Refresh file list
                await fetchFiles();
                
                // Notify parent to update counts
                if (onFilesUpdated) {
                    const newCount = files.length - 1;
                    onFilesUpdated(newCount);
                }
                
                resolve('File deleted successfully');
            } catch (error) {
                console.error('Error deleting file:', error.response?.data || error.message || error);
                reject(error.response?.data?.error || error.response?.data?.message || 'Failed to delete file');
            } finally {
                setDeletingId(null);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting file...',
            success: (msg) => msg,
            error: (msg) => msg,
        });
    };

    const handlePreview = (file) => {
        if (file.is_image) {
            setPreviewFile(file);
        } else {
            // Open PDF in new tab
            window.open(file.url, '_blank');
        }
    };

    const handleDownload = (file) => {
        window.open(route('rfi.daily-works.files.download', [rfi.id, file.id]), '_blank');
    };

    const renderFileIcon = (file) => {
        if (file.is_image) {
            return <PhotoIcon className="w-5 h-5 text-blue-500" />;
        }
        return <DocumentTextIcon className="w-5 h-5 text-red-500" />;
    };

    const renderFilePreview = (file) => {
        if (file.is_image) {
            return (
                <div className="relative group">
                    <Image
                        src={file.thumb_url || file.url}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                        onClick={() => handlePreview(file)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer" onClick={() => handlePreview(file)}>
                        <EyeIcon className="w-5 h-5 text-white" />
                    </div>
                </div>
            );
        }
        return (
            <div 
                className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                onClick={() => handlePreview(file)}
            >
                <DocumentTextIcon className="w-8 h-8 text-red-500" />
            </div>
        );
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size="2xl"
                scrollBehavior="inside"
                placement="bottom-center"
                radius={themeRadius}
                classNames={{
                    base: "max-h-[100dvh] sm:max-h-[90vh] m-0 sm:m-4 mb-0",
                    wrapper: "items-end sm:items-center",
                }}
            >
                <ModalContent>
                    {(onCloseModal) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <DocumentIcon className="w-5 h-5 text-primary" />
                                    <span>RFI Files - {rfi?.number}</span>
                                </div>
                                <p className="text-sm text-default-500 font-normal">
                                    Manage uploaded RFI documents and images
                                </p>
                            </ModalHeader>
                            
                            <ModalBody>
                                {/* Upload Section */}
                                <div className="border-2 border-dashed border-default-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="rfi-file-input"
                                    />
                                    
                                    {uploading ? (
                                        <div className="py-4">
                                            <Progress
                                                value={uploadProgress}
                                                className="max-w-md mx-auto"
                                                color="primary"
                                                showValueLabel
                                            />
                                            <p className="text-sm text-default-500 mt-2">Uploading files...</p>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="rfi-file-input"
                                            className="cursor-pointer flex flex-col items-center gap-2 py-4"
                                        >
                                            <div className="p-3 bg-primary/10 rounded-full">
                                                <PlusIcon className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Click to upload files</p>
                                                <p className="text-xs text-default-400">
                                                    Images (JPEG, PNG, WebP, GIF) or PDF files up to 10MB each
                                                </p>
                                            </div>
                                        </label>
                                    )}
                                </div>

                                <Divider className="my-2" />

                                {/* Files List */}
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner size="lg" />
                                    </div>
                                ) : files.length === 0 ? (
                                    <div className="text-center py-8 text-default-400">
                                        <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No files uploaded yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {files.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-3 p-3 bg-default-50 dark:bg-default-100/10 rounded-lg hover:bg-default-100 dark:hover:bg-default-100/20 transition-colors"
                                            >
                                                {/* File Preview */}
                                                {renderFilePreview(file)}

                                                {/* File Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate" title={file.name}>
                                                        {file.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Chip
                                                            size="sm"
                                                            variant="flat"
                                                            color={file.is_image ? 'primary' : 'danger'}
                                                            className="h-5"
                                                        >
                                                            {file.is_image ? 'Image' : 'PDF'}
                                                        </Chip>
                                                        <span className="text-xs text-default-400">
                                                            {file.human_size}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handlePreview(file)}
                                                        title="Preview"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handleDownload(file)}
                                                        title="Download"
                                                    >
                                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        isLoading={deletingId === file.id}
                                                        onPress={() => handleDelete(file.id)}
                                                        title="Delete"
                                                    >
                                                        {deletingId !== file.id && <TrashIcon className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ModalBody>

                            <ModalFooter>
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-sm text-default-500">
                                        {files.length} file{files.length !== 1 ? 's' : ''} uploaded
                                    </span>
                                    <Button color="primary" variant="light" onPress={onCloseModal}>
                                        Close
                                    </Button>
                                </div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Image Preview Modal */}
            {previewFile && (
                <Modal
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    size="4xl"
                    placement="bottom-center"
                    radius={themeRadius}
                    classNames={{
                        base: "max-h-[100dvh] sm:max-h-[90vh] m-0 sm:m-4 mb-0",
                        wrapper: "items-end sm:items-center",
                    }}
                >
                    <ModalContent>
                        {(onClosePreview) => (
                            <>
                                <ModalHeader className="flex items-center justify-between">
                                    <span className="truncate">{previewFile.name}</span>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={onClosePreview}
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </Button>
                                </ModalHeader>
                                <ModalBody className="p-0">
                                    <Image
                                        src={previewFile.url}
                                        alt={previewFile.name}
                                        className="w-full h-auto max-h-[70vh] object-contain"
                                        removeWrapper
                                    />
                                </ModalBody>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};

export default RfiFilesModal;
