import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Progress, Card, CardBody, Chip } from '@heroui/react';
import {
    CloudArrowUpIcon,
    DocumentIcon,
    PauseIcon,
    PlayIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useChunkedUpload } from '@/Hooks/useChunkedUpload';

/**
 * Format bytes to human readable size.
 */
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * ChunkedUploader component for handling large file uploads with progress and resume capability.
 *
 * @param {Object} props
 * @param {function} props.onComplete - Callback when upload completes
 * @param {function} props.onError - Callback on upload error
 * @param {string[]} [props.accept] - Accepted file types
 * @param {number} [props.maxSize] - Maximum file size in bytes
 * @param {number} [props.chunkSize] - Chunk size in bytes
 * @param {Object} [props.metadata] - Additional metadata to send
 * @param {string} [props.className] - Additional CSS classes
 */
export function ChunkedUploader({
    onComplete,
    onError,
    accept = {},
    maxSize = 1024 * 1024 * 1024, // 1GB default
    chunkSize = 1024 * 1024, // 1MB default
    metadata = {},
    className = '',
}) {
    const [file, setFile] = useState(null);

    const {
        progress,
        upload,
        pause,
        resume,
        cancel,
        reset,
    } = useChunkedUpload({
        chunkSize,
        onComplete: (result) => {
            onComplete?.(result);
        },
        onError: (error) => {
            onError?.(error);
        },
    });

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            setFile(selectedFile);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false,
        disabled: progress.status === 'uploading' || progress.status === 'assembling',
    });

    const handleUpload = async () => {
        if (!file) return;
        try {
            await upload(file, metadata);
        } catch (e) {
            // Error handled by hook
        }
    };

    const handlePause = () => {
        pause();
    };

    const handleResume = async () => {
        if (!file) return;
        try {
            await resume(file);
        } catch (e) {
            // Error handled by hook
        }
    };

    const handleCancel = async () => {
        await cancel();
        setFile(null);
    };

    const handleReset = () => {
        reset();
        setFile(null);
    };

    const getStatusColor = () => {
        switch (progress.status) {
            case 'completed':
                return 'success';
            case 'error':
                return 'danger';
            case 'uploading':
            case 'assembling':
                return 'primary';
            case 'paused':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatusLabel = () => {
        switch (progress.status) {
            case 'idle':
                return 'Ready';
            case 'initializing':
                return 'Initializing...';
            case 'uploading':
                return `Uploading (${progress.uploadedChunks}/${progress.totalChunks} chunks)`;
            case 'assembling':
                return 'Assembling file...';
            case 'completed':
                return 'Upload complete!';
            case 'error':
                return 'Upload failed';
            case 'paused':
                return 'Paused';
            default:
                return progress.status;
        }
    };

    return (
        <Card className={`w-full ${className}`}>
            <CardBody className="gap-4">
                {/* Drop zone */}
                {!file && (
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                            transition-colors duration-200
                            ${isDragActive
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                            }
                        `}
                    >
                        <input {...getInputProps()} />
                        <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        {isDragActive ? (
                            <p className="text-primary-600 dark:text-primary-400">
                                Drop the file here...
                            </p>
                        ) : (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-2">
                                    Drag and drop a file here, or click to select
                                </p>
                                <p className="text-sm text-gray-400">
                                    Max size: {formatBytes(maxSize)}
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* File rejection errors */}
                {fileRejections.length > 0 && (
                    <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg text-danger-600 dark:text-danger-400 text-sm">
                        {fileRejections.map(({ file, errors }) => (
                            <div key={file.name}>
                                <strong>{file.name}</strong>: {errors.map(e => e.message).join(', ')}
                            </div>
                        ))}
                    </div>
                )}

                {/* Selected file info */}
                {file && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <DocumentIcon className="w-10 h-10 text-gray-400" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                            </p>
                            <p className="text-sm text-gray-500">
                                {formatBytes(file.size)} • {progress.totalChunks} chunks
                            </p>
                        </div>
                        <Chip color={getStatusColor()} size="sm" variant="flat">
                            {getStatusLabel()}
                        </Chip>
                    </div>
                )}

                {/* Progress bar */}
                {file && progress.status !== 'idle' && progress.status !== 'completed' && (
                    <div className="space-y-2">
                        <Progress
                            value={progress.progress}
                            color={getStatusColor()}
                            size="md"
                            showValueLabel
                            className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>
                                {formatBytes(progress.uploadedSize)} / {formatBytes(progress.totalSize)}
                            </span>
                            <span>
                                {progress.uploadedChunks} / {progress.totalChunks} chunks
                            </span>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {progress.error && (
                    <div className="flex items-center gap-2 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                        <ExclamationTriangleIcon className="w-5 h-5 text-danger-500" />
                        <span className="text-danger-600 dark:text-danger-400">
                            {progress.error}
                        </span>
                    </div>
                )}

                {/* Success message */}
                {progress.status === 'completed' && (
                    <div className="flex items-center gap-2 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-success-500" />
                        <span className="text-success-600 dark:text-success-400">
                            File uploaded successfully!
                        </span>
                    </div>
                )}

                {/* Action buttons */}
                {file && (
                    <div className="flex gap-2">
                        {progress.status === 'idle' && (
                            <>
                                <Button
                                    color="primary"
                                    onPress={handleUpload}
                                    startContent={<CloudArrowUpIcon className="w-4 h-4" />}
                                >
                                    Upload
                                </Button>
                                <Button
                                    variant="flat"
                                    onPress={handleReset}
                                    startContent={<XMarkIcon className="w-4 h-4" />}
                                >
                                    Clear
                                </Button>
                            </>
                        )}

                        {progress.status === 'uploading' && (
                            <>
                                <Button
                                    color="warning"
                                    variant="flat"
                                    onPress={handlePause}
                                    startContent={<PauseIcon className="w-4 h-4" />}
                                >
                                    Pause
                                </Button>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onPress={handleCancel}
                                    startContent={<XMarkIcon className="w-4 h-4" />}
                                >
                                    Cancel
                                </Button>
                            </>
                        )}

                        {progress.status === 'paused' && (
                            <>
                                <Button
                                    color="primary"
                                    onPress={handleResume}
                                    startContent={<PlayIcon className="w-4 h-4" />}
                                >
                                    Resume
                                </Button>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onPress={handleCancel}
                                    startContent={<XMarkIcon className="w-4 h-4" />}
                                >
                                    Cancel
                                </Button>
                            </>
                        )}

                        {(progress.status === 'completed' || progress.status === 'error') && (
                            <Button
                                variant="flat"
                                onPress={handleReset}
                                startContent={<CloudArrowUpIcon className="w-4 h-4" />}
                            >
                                Upload Another
                            </Button>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export default ChunkedUploader;
