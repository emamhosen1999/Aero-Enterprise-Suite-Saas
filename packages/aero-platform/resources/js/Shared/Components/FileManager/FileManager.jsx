import React, { useState, useCallback, useRef } from 'react';
import { 
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Progress,
    Tooltip,
    Checkbox,
    Breadcrumbs,
    BreadcrumbItem,
    Spinner
} from '@heroui/react';
import { 
    FolderIcon,
    DocumentIcon,
    PhotoIcon,
    FilmIcon,
    MusicalNoteIcon,
    DocumentTextIcon,
    ArrowUpTrayIcon,
    FolderPlusIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    PencilIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    ListBulletIcon,
    ChevronDownIcon,
    EllipsisVerticalIcon,
    XMarkIcon,
    CheckIcon,
    ArrowPathIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Get file icon based on mime type
 */
const getFileIcon = (mimeType, className = "w-8 h-8") => {
    if (!mimeType) return <DocumentIcon className={className} />;
    
    if (mimeType.startsWith('image/')) {
        return <PhotoIcon className={`${className} text-success`} />;
    }
    if (mimeType.startsWith('video/')) {
        return <FilmIcon className={`${className} text-danger`} />;
    }
    if (mimeType.startsWith('audio/')) {
        return <MusicalNoteIcon className={`${className} text-warning`} />;
    }
    if (mimeType.includes('pdf')) {
        return <DocumentTextIcon className={`${className} text-danger`} />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
        return <DocumentTextIcon className={`${className} text-primary`} />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
        return <DocumentTextIcon className={`${className} text-success`} />;
    }
    
    return <DocumentIcon className={`${className} text-default-500`} />;
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Format date
 */
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

/**
 * File/Folder Item Component
 */
const FileItem = ({ 
    item, 
    viewMode,
    isSelected, 
    onSelect,
    onOpen,
    onRename,
    onDelete,
    onDownload,
    onPreview
}) => {
    const isFolder = item.type === 'folder';

    if (viewMode === 'grid') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`
                    relative p-4 rounded-xl cursor-pointer transition-all duration-200
                    border-2 hover:shadow-md
                    ${isSelected 
                        ? 'border-primary bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-transparent hover:border-default-200 hover:bg-default-50'
                    }
                `}
                onClick={() => onSelect?.(item)}
                onDoubleClick={() => onOpen?.(item)}
            >
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                        isSelected={isSelected}
                        onChange={() => onSelect?.(item)}
                        size="sm"
                    />
                </div>

                {/* Context menu */}
                <div className="absolute top-2 right-2 z-10">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="opacity-0 group-hover:opacity-100"
                            >
                                <EllipsisVerticalIcon className="w-4 h-4" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="File actions">
                            <DropdownItem 
                                key="open" 
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => onOpen?.(item)}
                            >
                                {isFolder ? 'Open' : 'Preview'}
                            </DropdownItem>
                            {!isFolder && (
                                <DropdownItem 
                                    key="download" 
                                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                    onPress={() => onDownload?.(item)}
                                >
                                    Download
                                </DropdownItem>
                            )}
                            <DropdownItem 
                                key="rename" 
                                startContent={<PencilIcon className="w-4 h-4" />}
                                onPress={() => onRename?.(item)}
                            >
                                Rename
                            </DropdownItem>
                            <DropdownItem 
                                key="delete" 
                                startContent={<TrashIcon className="w-4 h-4" />}
                                className="text-danger"
                                color="danger"
                                onPress={() => onDelete?.(item)}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-3 mt-4">
                    {isFolder ? (
                        <FolderIcon className="w-16 h-16 text-warning" />
                    ) : item.thumbnail_url ? (
                        <img 
                            src={item.thumbnail_url} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                        />
                    ) : (
                        getFileIcon(item.mime_type, "w-16 h-16")
                    )}
                </div>

                {/* Name */}
                <p className="text-sm font-medium text-center truncate" title={item.name}>
                    {item.name}
                </p>

                {/* Size/Count */}
                <p className="text-xs text-default-400 text-center mt-1">
                    {isFolder 
                        ? `${item.items_count || 0} items` 
                        : formatFileSize(item.size)
                    }
                </p>
            </motion.div>
        );
    }

    // List view
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`
                flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200
                border-2 hover:shadow-sm group
                ${isSelected 
                    ? 'border-primary bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-transparent hover:border-default-200 hover:bg-default-50'
                }
            `}
            onClick={() => onSelect?.(item)}
            onDoubleClick={() => onOpen?.(item)}
        >
            <Checkbox
                isSelected={isSelected}
                onChange={() => onSelect?.(item)}
                size="sm"
            />

            {/* Icon */}
            <div className="flex-shrink-0">
                {isFolder ? (
                    <FolderIcon className="w-8 h-8 text-warning" />
                ) : item.thumbnail_url ? (
                    <img 
                        src={item.thumbnail_url} 
                        alt={item.name}
                        className="w-8 h-8 object-cover rounded"
                    />
                ) : (
                    getFileIcon(item.mime_type)
                )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                {item.description && (
                    <p className="text-xs text-default-400 truncate">{item.description}</p>
                )}
            </div>

            {/* Size */}
            <div className="w-24 text-right">
                <p className="text-sm text-default-500">
                    {isFolder ? `${item.items_count || 0} items` : formatFileSize(item.size)}
                </p>
            </div>

            {/* Modified date */}
            <div className="w-32 text-right">
                <p className="text-sm text-default-500">
                    {formatDate(item.updated_at || item.created_at)}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isFolder && (
                    <Tooltip content="Download">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => onDownload?.(item)}
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                )}
                <Tooltip content="Delete">
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => onDelete?.(item)}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                </Tooltip>
            </div>
        </motion.div>
    );
};

/**
 * Upload Progress Item
 */
const UploadProgressItem = ({ file, progress, status }) => (
    <div className="flex items-center gap-3 p-2 bg-default-50 rounded-lg">
        {getFileIcon(file.type, "w-6 h-6")}
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <Progress 
                size="sm" 
                value={progress} 
                color={status === 'error' ? 'danger' : status === 'complete' ? 'success' : 'primary'}
                className="mt-1"
            />
        </div>
        <div className="flex-shrink-0">
            {status === 'complete' && <CheckIcon className="w-5 h-5 text-success" />}
            {status === 'error' && <XMarkIcon className="w-5 h-5 text-danger" />}
            {status === 'uploading' && <Spinner size="sm" />}
        </div>
    </div>
);

/**
 * File Manager Component
 * 
 * A comprehensive file manager for browsing, uploading, and managing files.
 * 
 * @param {Array} items - Current folder items (files and folders)
 * @param {Array} path - Current path breadcrumbs
 * @param {Function} onNavigate - Callback when navigating to a folder
 * @param {Function} onUpload - Callback for file upload
 * @param {Function} onCreateFolder - Callback for creating a folder
 * @param {Function} onDelete - Callback for deleting items
 * @param {Function} onRename - Callback for renaming items
 * @param {Function} onDownload - Callback for downloading files
 * @param {Function} onPreview - Callback for previewing files
 * @param {boolean} isLoading - Loading state
 * @param {boolean} allowMultiSelect - Allow selecting multiple items
 * @param {Array} acceptedTypes - Accepted file types for upload
 * @param {number} maxFileSize - Maximum file size in bytes
 */
export default function FileManager({
    items = [],
    path = [{ id: null, name: 'Root' }],
    onNavigate,
    onUpload,
    onCreateFolder,
    onDelete,
    onRename,
    onDownload,
    onPreview,
    onRefresh,
    isLoading = false,
    allowMultiSelect = true,
    acceptedTypes = ['*/*'],
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    title = "File Manager"
}) {
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    
    const { isOpen: isNewFolderOpen, onOpen: onNewFolderOpen, onClose: onNewFolderClose } = useDisclosure();
    const { isOpen: isRenameOpen, onOpen: onRenameOpen, onClose: onRenameClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    
    const [newFolderName, setNewFolderName] = useState('');
    const [renameItem, setRenameItem] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [deleteItems, setDeleteItems] = useState([]);

    // Filter items by search
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort: folders first, then by name
    const sortedItems = [...filteredItems].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    const handleSelect = useCallback((item) => {
        setSelectedItems(prev => {
            const isSelected = prev.some(i => i.id === item.id);
            if (isSelected) {
                return prev.filter(i => i.id !== item.id);
            }
            if (allowMultiSelect) {
                return [...prev, item];
            }
            return [item];
        });
    }, [allowMultiSelect]);

    const handleSelectAll = () => {
        if (selectedItems.length === sortedItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems([...sortedItems]);
        }
    };

    const handleOpen = (item) => {
        if (item.type === 'folder') {
            onNavigate?.(item);
        } else {
            onPreview?.(item);
        }
    };

    const handleRenameClick = (item) => {
        setRenameItem(item);
        setRenameValue(item.name);
        onRenameOpen();
    };

    const handleRenameSubmit = () => {
        if (renameItem && renameValue.trim()) {
            onRename?.(renameItem, renameValue.trim());
        }
        onRenameClose();
        setRenameItem(null);
        setRenameValue('');
    };

    const handleDeleteClick = (items) => {
        setDeleteItems(Array.isArray(items) ? items : [items]);
        onDeleteOpen();
    };

    const handleDeleteConfirm = () => {
        deleteItems.forEach(item => onDelete?.(item));
        setSelectedItems([]);
        onDeleteClose();
        setDeleteItems([]);
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            onCreateFolder?.(newFolderName.trim());
        }
        onNewFolderClose();
        setNewFolderName('');
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        processFiles(files);
    };

    const processFiles = (files) => {
        const validFiles = files.filter(file => {
            if (file.size > maxFileSize) {
                console.warn(`File ${file.name} exceeds max size`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setUploadQueue(validFiles.map(file => ({
                file,
                progress: 0,
                status: 'pending'
            })));
            
            // Start uploads
            validFiles.forEach((file, index) => {
                onUpload?.(file, (progress) => {
                    setUploadQueue(prev => prev.map((item, i) => 
                        i === index ? { ...item, progress, status: 'uploading' } : item
                    ));
                }).then(() => {
                    setUploadQueue(prev => prev.map((item, i) => 
                        i === index ? { ...item, progress: 100, status: 'complete' } : item
                    ));
                }).catch(() => {
                    setUploadQueue(prev => prev.map((item, i) => 
                        i === index ? { ...item, status: 'error' } : item
                    ));
                });
            });
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-col gap-4 px-6 pt-6 pb-4">
                {/* Title and Actions */}
                <div className="flex items-center justify-between w-full">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="flat"
                            startContent={<FolderPlusIcon className="w-4 h-4" />}
                            onPress={onNewFolderOpen}
                        >
                            New Folder
                        </Button>
                        <Button
                            color="primary"
                            startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                            onPress={() => fileInputRef.current?.click()}
                        >
                            Upload
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={acceptedTypes.join(',')}
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Breadcrumbs */}
                <Breadcrumbs className="w-full">
                    {path.map((item, index) => (
                        <BreadcrumbItem 
                            key={item.id || 'root'}
                            onPress={() => onNavigate?.(item, index)}
                            isCurrent={index === path.length - 1}
                        >
                            {item.name}
                        </BreadcrumbItem>
                    ))}
                </Breadcrumbs>

                {/* Toolbar */}
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-2">
                        {selectedItems.length > 0 && (
                            <>
                                <Chip size="sm" variant="flat">
                                    {selectedItems.length} selected
                                </Chip>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => handleDeleteClick(selectedItems)}
                                >
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            isClearable
                            onClear={() => setSearchQuery('')}
                            className="w-64"
                            size="sm"
                        />

                        <div className="flex items-center border rounded-lg">
                            <Button
                                isIconOnly
                                size="sm"
                                variant={viewMode === 'grid' ? 'flat' : 'light'}
                                onPress={() => setViewMode('grid')}
                            >
                                <Squares2X2Icon className="w-4 h-4" />
                            </Button>
                            <Button
                                isIconOnly
                                size="sm"
                                variant={viewMode === 'list' ? 'flat' : 'light'}
                                onPress={() => setViewMode('list')}
                            >
                                <ListBulletIcon className="w-4 h-4" />
                            </Button>
                        </div>

                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={onRefresh}
                            isLoading={isLoading}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardBody 
                className="px-6 pb-6 min-h-[400px]"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag overlay */}
                <AnimatePresence>
                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-primary-50/90 dark:bg-primary-900/90 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary"
                        >
                            <CloudArrowUpIcon className="w-16 h-16 text-primary mb-4" />
                            <p className="text-lg font-medium text-primary">Drop files here to upload</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Upload queue */}
                {uploadQueue.length > 0 && (
                    <div className="mb-4 p-4 bg-default-50 rounded-xl space-y-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Uploading files...</span>
                            <Button
                                size="sm"
                                variant="light"
                                onPress={() => setUploadQueue([])}
                            >
                                Clear
                            </Button>
                        </div>
                        {uploadQueue.map((item, index) => (
                            <UploadProgressItem
                                key={index}
                                file={item.file}
                                progress={item.progress}
                                status={item.status}
                            />
                        ))}
                    </div>
                )}

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Spinner size="lg" />
                    </div>
                ) : sortedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-default-400">
                        <FolderIcon className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">No files or folders</p>
                        <p className="text-sm">Upload files or create a folder to get started</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <AnimatePresence>
                            {sortedItems.map(item => (
                                <FileItem
                                    key={item.id}
                                    item={item}
                                    viewMode={viewMode}
                                    isSelected={selectedItems.some(i => i.id === item.id)}
                                    onSelect={handleSelect}
                                    onOpen={handleOpen}
                                    onRename={handleRenameClick}
                                    onDelete={handleDeleteClick}
                                    onDownload={onDownload}
                                    onPreview={onPreview}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* List header */}
                        <div className="flex items-center gap-4 p-3 text-xs font-semibold text-default-500 uppercase">
                            <Checkbox
                                isSelected={selectedItems.length === sortedItems.length && sortedItems.length > 0}
                                isIndeterminate={selectedItems.length > 0 && selectedItems.length < sortedItems.length}
                                onChange={handleSelectAll}
                                size="sm"
                            />
                            <div className="w-8" />
                            <div className="flex-1">Name</div>
                            <div className="w-24 text-right">Size</div>
                            <div className="w-32 text-right">Modified</div>
                            <div className="w-20" />
                        </div>

                        <AnimatePresence>
                            {sortedItems.map(item => (
                                <FileItem
                                    key={item.id}
                                    item={item}
                                    viewMode={viewMode}
                                    isSelected={selectedItems.some(i => i.id === item.id)}
                                    onSelect={handleSelect}
                                    onOpen={handleOpen}
                                    onRename={handleRenameClick}
                                    onDelete={handleDeleteClick}
                                    onDownload={onDownload}
                                    onPreview={onPreview}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </CardBody>

            {/* New Folder Modal */}
            <Modal isOpen={isNewFolderOpen} onClose={onNewFolderClose}>
                <ModalContent>
                    <ModalHeader>Create New Folder</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Folder Name"
                            placeholder="Enter folder name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onNewFolderClose}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleCreateFolder}>
                            Create
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Rename Modal */}
            <Modal isOpen={isRenameOpen} onClose={onRenameClose}>
                <ModalContent>
                    <ModalHeader>Rename</ModalHeader>
                    <ModalBody>
                        <Input
                            label="New Name"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onRenameClose}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleRenameSubmit}>
                            Rename
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <ModalContent>
                    <ModalHeader>Delete Confirmation</ModalHeader>
                    <ModalBody>
                        <p>
                            Are you sure you want to delete {deleteItems.length} item(s)?
                            This action cannot be undone.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onDeleteClose}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleDeleteConfirm}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Card>
    );
}
