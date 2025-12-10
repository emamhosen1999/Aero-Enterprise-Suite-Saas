import React, { useState, useRef, useEffect } from 'react';
import { Card, CardBody, Button, Progress } from '@heroui/react';
import { ArrowUpTrayIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

export default function UploadManager({ currentPath = '/', onComplete }) {
    const [uploads, setUploads] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const [themeRadius, setThemeRadius] = useState('lg');
    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) setThemeRadius('none');
        else if (radiusValue <= 4) setThemeRadius('sm');
        else if (radiusValue <= 8) setThemeRadius('md');
        else if (radiusValue <= 12) setThemeRadius('lg');
        else setThemeRadius('full');
    }, []);

    const handleFiles = (files) => {
        const fileArray = Array.from(files);
        const newUploads = fileArray.map((file, index) => ({
            id: Date.now() + index,
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'pending',
            error: null,
            xhr: null,
        }));

        setUploads((prev) => [...prev, ...newUploads]);
        newUploads.forEach((upload) => startUpload(upload));
    };

    const startUpload = (upload) => {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('path', currentPath);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === upload.id ? { ...u, progress, status: 'uploading' } : u
                    )
                );
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === upload.id ? { ...u, status: 'completed', progress: 100 } : u
                    )
                );
                showToast.success(`${upload.name} uploaded successfully`);
            } else {
                const error = JSON.parse(xhr.responseText)?.message || 'Upload failed';
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === upload.id ? { ...u, status: 'failed', error } : u
                    )
                );
                showToast.error(`Failed to upload ${upload.name}`);
            }
        });

        xhr.addEventListener('error', () => {
            setUploads((prev) =>
                prev.map((u) =>
                    u.id === upload.id ? { ...u, status: 'failed', error: 'Network error' } : u
                )
            );
            showToast.error(`Failed to upload ${upload.name}`);
        });

        xhr.open('POST', route('admin.files.upload'));
        xhr.setRequestHeader('X-CSRF-TOKEN', document.querySelector('meta[name="csrf-token"]').content);
        xhr.send(formData);

        setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, xhr } : u))
        );
    };

    const cancelUpload = (uploadId) => {
        const upload = uploads.find((u) => u.id === uploadId);
        if (upload && upload.xhr) {
            upload.xhr.abort();
        }
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
    };

    const retryUpload = (uploadId) => {
        const upload = uploads.find((u) => u.id === uploadId);
        if (upload) {
            setUploads((prev) =>
                prev.map((u) =>
                    u.id === uploadId ? { ...u, status: 'pending', progress: 0, error: null } : u
                )
            );
            startUpload(upload);
        }
    };

    const clearCompleted = () => {
        setUploads((prev) => prev.filter((u) => u.status !== 'completed'));
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    };

    const overallProgress = uploads.length > 0
        ? uploads.reduce((sum, u) => sum + u.progress, 0) / uploads.length
        : 0;

    const completedCount = uploads.filter((u) => u.status === 'completed').length;
    const failedCount = uploads.filter((u) => u.status === 'failed').length;
    const uploadingCount = uploads.filter((u) => u.status === 'uploading').length;

    return (
        <div className="space-y-4">
            <Card
                className={`border-2 border-dashed transition-colors ${
                    isDragging ? 'border-primary bg-primary-50' : 'border-default-300'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <CardBody className="flex flex-col items-center justify-center py-12 text-center">
                    <ArrowUpTrayIcon className="w-12 h-12 text-default-400 mb-4" />
                    <p className="text-lg font-semibold mb-2">Drop files here to upload</p>
                    <p className="text-sm text-default-500 mb-4">or</p>
                    <Button
                        color="primary"
                        radius={themeRadius}
                        onPress={() => fileInputRef.current?.click()}
                    >
                        Browse Files
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInput}
                    />
                </CardBody>
            </Card>

            {uploads.length > 0 && (
                <Card>
                    <CardBody className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold">
                                    Uploading {uploads.length} file{uploads.length > 1 ? 's' : ''}
                                </span>
                                <span className="text-default-500">
                                    {completedCount} completed • {failedCount} failed • {uploadingCount} in progress
                                </span>
                            </div>
                            <Progress
                                value={overallProgress}
                                color={failedCount > 0 ? 'danger' : 'primary'}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {uploads.map((upload) => (
                                <div key={upload.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {upload.status === 'completed' && (
                                                <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0" />
                                            )}
                                            {upload.status === 'failed' && (
                                                <ExclamationCircleIcon className="w-5 h-5 text-danger flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{upload.name}</p>
                                                <p className="text-xs text-default-500">
                                                    {formatSize(upload.size)}
                                                    {upload.status === 'uploading' && ` • ${upload.progress}%`}
                                                    {upload.error && ` • ${upload.error}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {upload.status === 'failed' && (
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    radius={themeRadius}
                                                    onPress={() => retryUpload(upload.id)}
                                                >
                                                    Retry
                                                </Button>
                                            )}
                                            {upload.status !== 'completed' && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => cancelUpload(upload.id)}
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {upload.status === 'uploading' && (
                                        <Progress value={upload.progress} size="sm" color="primary" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {completedCount > 0 && (
                            <div className="flex justify-end">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius={themeRadius}
                                    onPress={clearCompleted}
                                >
                                    Clear Completed
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
