import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    Input,
    Select,
    SelectItem,
    Textarea,
} from "@heroui/react";
import {
    ArrowUpTrayIcon,
    DocumentPlusIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { motion } from 'framer-motion';

const DocumentCreate = ({ categories = [], folders = [] }) => {
    const { auth } = usePage().props;
    const { canCreate } = useHRMAC('dms');
    const themeRadius = useThemeRadius();
    
    // Manual responsive state management (HRMAC pattern)
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: null,
        folder_id: null,
        visibility: 'internal',
        tags: '',
        expires_at: '',
    });
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const visibilityOptions = [
        { value: 'private', label: 'Private - Only you can access' },
        { value: 'internal', label: 'Internal - All authenticated users' },
        { value: 'public', label: 'Public - Anyone with the link' },
    ];

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!formData.title) {
                // Auto-fill title from filename
                const nameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, "");
                setFormData(prev => ({ ...prev, title: nameWithoutExtension }));
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = () => {
        if (!file) {
            setErrors({ file: 'Please select a file to upload' });
            return;
        }

        if (!formData.title.trim()) {
            setErrors({ title: 'Title is required' });
            return;
        }

        if (!formData.category_id) {
            setErrors({ category_id: 'Please select a category' });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        const data = new FormData();
        data.append('file', file);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category_id', formData.category_id);
        if (formData.folder_id) data.append('folder_id', formData.folder_id);
        data.append('visibility', formData.visibility);
        if (formData.tags) {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            data.append('tags', JSON.stringify(tagsArray));
        }
        if (formData.expires_at) data.append('expires_at', formData.expires_at);

        const promise = new Promise((resolve, reject) => {
            router.post(route('dms.documents.store'), data, {
                forceFormData: true,
                onSuccess: () => resolve(['Document uploaded successfully']),
                onError: (errors) => {
                    setErrors(errors);
                    reject(Object.values(errors));
                },
                onFinish: () => setIsSubmitting(false),
            });
        });

        showToast.promise(promise, {
            loading: 'Uploading document...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleCancel = () => {
        router.visit(route('dms.documents'));
    };

    const contentSection = (
        <Card className="border border-divider">
            <CardBody className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - File Upload */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Upload File</h3>
                        
                        {!file ? (
                            <div className="border-2 border-dashed border-divider rounded-xl p-8 text-center">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <label 
                                    htmlFor="file-upload" 
                                    className="cursor-pointer flex flex-col items-center gap-4"
                                >
                                    <div className="p-4 rounded-full bg-primary/10">
                                        <ArrowUpTrayIcon className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Click to upload or drag and drop</p>
                                        <p className="text-sm text-default-400 mt-1">
                                            PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG up to 100MB
                                        </p>
                                    </div>
                                    <Button color="primary" variant="flat" as="span">
                                        Select File
                                    </Button>
                                </label>
                            </div>
                        ) : (
                            <div className="border border-divider rounded-xl p-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-success/10">
                                        <DocumentPlusIcon className="w-8 h-8 text-success" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-default-400">
                                            {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                                        </p>
                                    </div>
                                    <Button 
                                        isIconOnly 
                                        size="sm" 
                                        variant="light" 
                                        color="danger"
                                        onPress={handleRemoveFile}
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        {errors.file && (
                            <p className="text-danger text-sm">{errors.file}</p>
                        )}
                    </div>

                    {/* Right Column - Document Details */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Document Details</h3>
                        
                        <Input
                            label="Title"
                            placeholder="Enter document title"
                            value={formData.title}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
                            isRequired
                            isInvalid={!!errors.title}
                            errorMessage={errors.title}
                        />

                        <Textarea
                            label="Description"
                            placeholder="Enter document description"
                            value={formData.description}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                            minRows={3}
                        />

                        <Select
                            label="Category"
                            placeholder="Select category"
                            selectedKeys={formData.category_id ? [String(formData.category_id)] : []}
                            onSelectionChange={(keys) => setFormData(prev => ({ 
                                ...prev, 
                                category_id: Array.from(keys)[0] 
                            }))}
                            isRequired
                            isInvalid={!!errors.category_id}
                            errorMessage={errors.category_id}
                        >
                            {categories.map(category => (
                                <SelectItem key={String(category.id)}>{category.name}</SelectItem>
                            ))}
                        </Select>

                        <Select
                            label="Folder (Optional)"
                            placeholder="Select folder"
                            selectedKeys={formData.folder_id ? [String(formData.folder_id)] : []}
                            onSelectionChange={(keys) => setFormData(prev => ({ 
                                ...prev, 
                                folder_id: Array.from(keys)[0] || null 
                            }))}
                        >
                            {folders.map(folder => (
                                <SelectItem key={String(folder.id)}>{folder.name}</SelectItem>
                            ))}
                        </Select>

                        <Select
                            label="Visibility"
                            selectedKeys={[formData.visibility]}
                            onSelectionChange={(keys) => setFormData(prev => ({ 
                                ...prev, 
                                visibility: Array.from(keys)[0] 
                            }))}
                        >
                            {visibilityOptions.map(option => (
                                <SelectItem key={option.value}>{option.label}</SelectItem>
                            ))}
                        </Select>

                        <Input
                            label="Tags"
                            placeholder="Enter tags separated by commas"
                            value={formData.tags}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
                            description="Separate multiple tags with commas"
                        />

                        <Input
                            type="date"
                            label="Expiry Date (Optional)"
                            value={formData.expires_at}
                            onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                            description="Document will be archived after this date"
                        />
                    </div>
                </div>
            </CardBody>
        </Card>
    );

    const headerActions = (
        <div className="flex gap-2">
            <Button variant="flat" onPress={handleCancel}>
                Cancel
            </Button>
            <Button 
                color="primary" 
                variant="shadow"
                startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                onPress={handleSubmit}
                isLoading={isSubmitting}
            >
                Upload Document
            </Button>
        </div>
    );

    return (
        <>
            <Head title="Upload Document" />
            <StandardPageLayout
                title="Upload Document"
                subtitle="Add a new document to the repository"
                icon={<DocumentPlusIcon className="w-8 h-8" />}
                actions={headerActions}
                content={contentSection}
                breadcrumbs={[
                    { label: 'Home', href: route('core.dashboard') },
                    { label: 'Document Management' },
                    { label: 'Documents', href: route('dms.documents') },
                    { label: 'Upload' },
                ]}
            />
        </>
    );
};

export default DocumentCreate;
