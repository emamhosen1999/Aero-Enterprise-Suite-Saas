import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Spinner,
    Card,
    CardBody,
    Tabs,
    Tab,
    Pagination,
} from "@heroui/react";
import {
    PhotoIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ArrowUpTrayIcon,
    FolderIcon,
    TrashIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import axios from 'axios';

const ImagePicker = ({
    value,
    onChange,
    label = "Image",
    placeholder = "Select an image",
    required = false,
    accept = "image/*",
    maxSize = 5 * 1024 * 1024, // 5MB default
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [media, setMedia] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [pagination, setPagination] = useState({ current: 1, total: 1 });
    const [activeTab, setActiveTab] = useState('library');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    // Fetch media from library
    const fetchMedia = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.admin.cms.media.index'), {
                params: {
                    page,
                    folder: currentFolder,
                    search,
                    type: 'image',
                    per_page: 20,
                },
            });

            if (response.data) {
                setMedia(response.data.data || []);
                setPagination({
                    current: response.data.current_page || 1,
                    total: response.data.last_page || 1,
                });
            }
        } catch (error) {
            console.error('Failed to fetch media:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFolder, search]);

    // Fetch folders
    const fetchFolders = useCallback(async () => {
        try {
            const response = await axios.get(route('api.admin.cms.media.folders'));
            if (response.data) {
                setFolders(response.data.folders || []);
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
            fetchFolders();
        }
    }, [isOpen, fetchMedia, fetchFolders]);

    useEffect(() => {
        if (isOpen && search !== undefined) {
            const debounce = setTimeout(() => {
                fetchMedia(1);
            }, 300);
            return () => clearTimeout(debounce);
        }
    }, [search]);

    // Handle file upload
    const handleUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        Array.from(files).forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        
        if (currentFolder) {
            formData.append('folder', currentFolder);
        }

        try {
            const response = await axios.post(route('api.admin.cms.media.upload'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                },
            });

            if (response.data?.media?.length > 0) {
                // Select the first uploaded image
                const uploaded = response.data.media[0];
                setSelectedImage(uploaded);
                setActiveTab('library');
                fetchMedia();
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Handle drag and drop
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    }, [currentFolder]);

    // Confirm selection
    const handleConfirm = () => {
        if (selectedImage) {
            onChange(selectedImage.url || selectedImage.path);
        }
        setIsOpen(false);
    };

    // Clear selection
    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSelectedImage(null);
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-default-700">
                    {label}
                    {required && <span className="text-danger ml-1">*</span>}
                </label>
            )}

            {/* Preview / Picker Trigger */}
            <div
                className="relative border-2 border-dashed border-default-300 rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => setIsOpen(true)}
            >
                {value ? (
                    <div className="relative aspect-video bg-default-100">
                        <img
                            src={value}
                            alt="Selected"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={() => setIsOpen(true)}
                            >
                                Change
                            </Button>
                            <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                onPress={handleClear}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="aspect-video flex flex-col items-center justify-center gap-2 text-default-400">
                        <PhotoIcon className="w-12 h-12" />
                        <span className="text-sm">{placeholder}</span>
                    </div>
                )}
            </div>

            {/* Media Library Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                size="5xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-0",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">Select Image</h2>
                        <p className="text-sm text-default-500">
                            Choose from library or upload a new image
                        </p>
                    </ModalHeader>
                    <ModalBody className="p-4">
                        <Tabs
                            selectedKey={activeTab}
                            onSelectionChange={setActiveTab}
                            variant="underlined"
                            classNames={{ panel: "pt-4" }}
                        >
                            {/* Library Tab */}
                            <Tab key="library" title="Media Library">
                                <div className="space-y-4">
                                    {/* Search & Folder Navigation */}
                                    <div className="flex gap-3">
                                        <Input
                                            placeholder="Search images..."
                                            value={search}
                                            onValueChange={setSearch}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            className="flex-1"
                                            size="sm"
                                        />
                                        {currentFolder && (
                                            <Button
                                                variant="flat"
                                                size="sm"
                                                startContent={<FolderIcon className="w-4 h-4" />}
                                                onPress={() => setCurrentFolder(null)}
                                            >
                                                Back to Root
                                            </Button>
                                        )}
                                    </div>

                                    {/* Folders */}
                                    {!currentFolder && folders.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {folders.map((folder) => (
                                                <Button
                                                    key={folder}
                                                    variant="flat"
                                                    size="sm"
                                                    startContent={<FolderIcon className="w-4 h-4" />}
                                                    onPress={() => setCurrentFolder(folder)}
                                                >
                                                    {folder}
                                                </Button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Image Grid */}
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : media.length === 0 ? (
                                        <div className="text-center py-12 text-default-400">
                                            <PhotoIcon className="w-16 h-16 mx-auto mb-4" />
                                            <p>No images found</p>
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                className="mt-4"
                                                onPress={() => setActiveTab('upload')}
                                            >
                                                Upload New Image
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-4 gap-3">
                                                <AnimatePresence>
                                                    {media.map((item) => (
                                                        <motion.div
                                                            key={item.id}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                                                                selectedImage?.id === item.id
                                                                    ? 'border-primary ring-2 ring-primary/30'
                                                                    : 'border-transparent hover:border-default-300'
                                                            }`}
                                                            onClick={() => setSelectedImage(item)}
                                                        >
                                                            <img
                                                                src={item.thumbnail_url || item.url}
                                                                alt={item.filename}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {selectedImage?.id === item.id && (
                                                                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                                    <CheckIcon className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                                <p className="text-xs text-white truncate">
                                                                    {item.filename}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>

                                            {/* Pagination */}
                                            {pagination.total > 1 && (
                                                <div className="flex justify-center mt-4">
                                                    <Pagination
                                                        total={pagination.total}
                                                        page={pagination.current}
                                                        onChange={(page) => fetchMedia(page)}
                                                        showControls
                                                        size="sm"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Tab>

                            {/* Upload Tab */}
                            <Tab key="upload" title="Upload New">
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-12 transition-colors ${
                                        dragActive
                                            ? 'border-primary bg-primary/5'
                                            : 'border-default-300 hover:border-default-400'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <div className="text-center">
                                        {uploading ? (
                                            <div className="space-y-4">
                                                <Spinner size="lg" />
                                                <div className="w-full max-w-xs mx-auto">
                                                    <div className="h-2 bg-default-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-300"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-default-500 mt-2">
                                                        Uploading... {uploadProgress}%
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <ArrowUpTrayIcon className="w-16 h-16 mx-auto text-default-400 mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">
                                                    Drop your image here
                                                </h3>
                                                <p className="text-sm text-default-500 mb-4">
                                                    or click to browse
                                                </p>
                                                <input
                                                    type="file"
                                                    accept={accept}
                                                    onChange={(e) => handleUpload(e.target.files)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    multiple
                                                />
                                                <p className="text-xs text-default-400 mt-4">
                                                    Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Tab>
                        </Tabs>

                        {/* Selected Image Preview */}
                        {selectedImage && (
                            <Card className="mt-4">
                                <CardBody className="flex flex-row gap-4">
                                    <img
                                        src={selectedImage.thumbnail_url || selectedImage.url}
                                        alt={selectedImage.filename}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-medium">{selectedImage.filename}</h4>
                                        <p className="text-sm text-default-500">
                                            {selectedImage.width}x{selectedImage.height} • {
                                                selectedImage.size
                                                    ? `${Math.round(selectedImage.size / 1024)}KB`
                                                    : ''
                                            }
                                        </p>
                                        {selectedImage.alt_text && (
                                            <p className="text-sm text-default-400 mt-1">
                                                Alt: {selectedImage.alt_text}
                                            </p>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleConfirm}
                            isDisabled={!selectedImage}
                        >
                            Select Image
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default ImagePicker;
