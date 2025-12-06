import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Breadcrumbs,
    BreadcrumbItem,
    Checkbox,
} from '@heroui/react';
import {
    FolderIcon,
    DocumentIcon,
    PhotoIcon,
    VideoCameraIcon,
    MusicalNoteIcon,
    ArchiveBoxIcon,
    EllipsisVerticalIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    ListBulletIcon,
    FolderPlusIcon,
    ArrowUpTrayIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    PencilIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

export default function FileBrowser({ files = [], currentPath = '/', onUpload, onPathChange }) {
    const [viewMode, setViewMode] = useState('list'); // list, grid, tree
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalState, setModalState] = useState({ open: false, type: null, file: null });
    const [newName, setNewName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [previewFile, setPreviewFile] = useState(null);

    // Theme radius
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

    // File type icon
    const getFileIcon = (file) => {
        if (file.type === 'folder') return <FolderIcon className="w-5 h-5 text-warning" />;
        const mimeType = file.mime_type || '';
        if (mimeType.startsWith('image/')) return <PhotoIcon className="w-5 h-5 text-success" />;
        if (mimeType.startsWith('video/')) return <VideoCameraIcon className="w-5 h-5 text-danger" />;
        if (mimeType.startsWith('audio/')) return <MusicalNoteIcon className="w-5 h-5 text-primary" />;
        if (mimeType.includes('zip') || mimeType.includes('archive')) return <ArchiveBoxIcon className="w-5 h-5 text-secondary" />;
        return <DocumentIcon className="w-5 h-5 text-default-500" />;
    };

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    };

    // Filter files by search
    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle select all
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedFiles(filteredFiles.map(f => f.id));
        } else {
            setSelectedFiles([]);
        }
    };

    // Handle file click
    const handleFileClick = (file) => {
        if (file.type === 'folder') {
            const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
            onPathChange && onPathChange(newPath);
        } else {
            setPreviewFile(file);
        }
    };

    // Handle rename
    const handleRename = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('admin.files.rename'), {
                    file_id: modalState.file.id,
                    new_name: newName,
                });
                resolve(['File renamed successfully']);
                setModalState({ open: false, type: null, file: null });
                router.reload();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to rename file']);
            }
        });

        showToast.promise(promise, {
            loading: 'Renaming file...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : data),
        });
    };

    // Handle delete
    const handleDelete = (fileIds) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('admin.files.delete'), {
                    data: { file_ids: Array.isArray(fileIds) ? fileIds : [fileIds] },
                });
                resolve(['File(s) moved to trash']);
                setSelectedFiles([]);
                router.reload();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete file(s)']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting file(s)...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : data),
        });
    };

    // Handle create folder
    const handleCreateFolder = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.files.create-folder'), {
                    path: currentPath,
                    name: newFolderName,
                });
                resolve(['Folder created successfully']);
                setModalState({ open: false, type: null, file: null });
                setNewFolderName('');
                router.reload();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to create folder']);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating folder...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : data),
        });
    };

    // Handle download
    const handleDownload = (fileId) => {
        window.location.href = route('admin.files.download', fileId);
    };

    // Breadcrumb navigation
    const pathParts = currentPath.split('/').filter(p => p);
    
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex gap-2">
                    <Button
                        color="primary"
                        startContent={<FolderPlusIcon className="w-4 h-4" />}
                        radius={themeRadius}
                        onPress={() => setModalState({ open: true, type: 'createFolder', file: null })}
                    >
                        New Folder
                    </Button>
                    <Button
                        color="primary"
                        variant="flat"
                        startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                        radius={themeRadius}
                        onPress={onUpload}
                    >
                        Upload
                    </Button>
                    {selectedFiles.length > 0 && (
                        <Button
                            color="danger"
                            variant="flat"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            radius={themeRadius}
                            onPress={() => handleDelete(selectedFiles)}
                        >
                            Delete ({selectedFiles.length})
                        </Button>
                    )}
                </div>

                <div className="flex gap-2 items-center">
                    <Input
                        placeholder="Search files..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        radius={themeRadius}
                        classNames={{ inputWrapper: 'bg-default-100' }}
                        className="w-64"
                    />
                    <div className="flex gap-1 bg-default-100 rounded-lg p-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant={viewMode === 'list' ? 'solid' : 'light'}
                            onPress={() => setViewMode('list')}
                        >
                            <ListBulletIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={viewMode === 'grid' ? 'solid' : 'light'}
                            onPress={() => setViewMode('grid')}
                        >
                            <Squares2X2Icon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Breadcrumbs */}
            <Breadcrumbs>
                <BreadcrumbItem
                    onPress={() => onPathChange && onPathChange('/')}
                    className="cursor-pointer"
                >
                    Home
                </BreadcrumbItem>
                {pathParts.map((part, index) => (
                    <BreadcrumbItem
                        key={index}
                        onPress={() => {
                            const newPath = '/' + pathParts.slice(0, index + 1).join('/');
                            onPathChange && onPathChange(newPath);
                        }}
                        className="cursor-pointer"
                    >
                        {part}
                    </BreadcrumbItem>
                ))}
            </Breadcrumbs>

            {/* File List/Grid */}
            {viewMode === 'list' ? (
                <Table
                    aria-label="Files table"
                    classNames={{
                        wrapper: 'shadow-none border border-divider rounded-lg',
                    }}
                >
                    <TableHeader>
                        <TableColumn width={50}>
                            <Checkbox
                                isSelected={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                                onChange={handleSelectAll}
                            />
                        </TableColumn>
                        <TableColumn>NAME</TableColumn>
                        <TableColumn>SIZE</TableColumn>
                        <TableColumn>MODIFIED</TableColumn>
                        <TableColumn width={50}>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {filteredFiles.map((file) => (
                            <TableRow key={file.id}>
                                <TableCell>
                                    <Checkbox
                                        isSelected={selectedFiles.includes(file.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFiles([...selectedFiles, file.id]);
                                            } else {
                                                setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div
                                        className="flex items-center gap-2 cursor-pointer hover:text-primary"
                                        onClick={() => handleFileClick(file)}
                                    >
                                        {getFileIcon(file)}
                                        <span className="font-medium">{file.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{formatSize(file.size)}</TableCell>
                                <TableCell>{new Date(file.updated_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button isIconOnly size="sm" variant="light">
                                                <EllipsisVerticalIcon className="w-5 h-5" />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu aria-label="File actions">
                                            {file.type !== 'folder' && (
                                                <DropdownItem
                                                    key="download"
                                                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                    onPress={() => handleDownload(file.id)}
                                                >
                                                    Download
                                                </DropdownItem>
                                            )}
                                            <DropdownItem
                                                key="rename"
                                                startContent={<PencilIcon className="w-4 h-4" />}
                                                onPress={() => {
                                                    setNewName(file.name);
                                                    setModalState({ open: true, type: 'rename', file });
                                                }}
                                            >
                                                Rename
                                            </DropdownItem>
                                            <DropdownItem
                                                key="delete"
                                                className="text-danger"
                                                color="danger"
                                                startContent={<TrashIcon className="w-4 h-4" />}
                                                onPress={() => handleDelete(file.id)}
                                            >
                                                Delete
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredFiles.map((file) => (
                        <Card
                            key={file.id}
                            isPressable
                            onPress={() => handleFileClick(file)}
                            className="relative"
                        >
                            <CardBody className="p-4 items-center text-center gap-2">
                                <div className="absolute top-2 left-2">
                                    <Checkbox
                                        isSelected={selectedFiles.includes(file.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFiles([...selectedFiles, file.id]);
                                            } else {
                                                setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="w-16 h-16 flex items-center justify-center">
                                    {React.cloneElement(getFileIcon(file), { className: 'w-16 h-16' })}
                                </div>
                                <p className="text-sm font-medium truncate w-full">{file.name}</p>
                                <p className="text-xs text-default-500">{formatSize(file.size)}</p>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Rename Modal */}
            <Modal
                isOpen={modalState.open && modalState.type === 'rename'}
                onOpenChange={() => setModalState({ open: false, type: null, file: null })}
                size="md"
            >
                <ModalContent>
                    <ModalHeader>Rename {modalState.file?.type === 'folder' ? 'Folder' : 'File'}</ModalHeader>
                    <ModalBody>
                        <Input
                            label="New Name"
                            value={newName}
                            onValueChange={setNewName}
                            radius={themeRadius}
                            autoFocus
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="flat"
                            onPress={() => setModalState({ open: false, type: null, file: null })}
                            radius={themeRadius}
                        >
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleRename} radius={themeRadius}>
                            Rename
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Create Folder Modal */}
            <Modal
                isOpen={modalState.open && modalState.type === 'createFolder'}
                onOpenChange={() => setModalState({ open: false, type: null, file: null })}
                size="md"
            >
                <ModalContent>
                    <ModalHeader>Create New Folder</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Folder Name"
                            value={newFolderName}
                            onValueChange={setNewFolderName}
                            radius={themeRadius}
                            autoFocus
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="flat"
                            onPress={() => setModalState({ open: false, type: null, file: null })}
                            radius={themeRadius}
                        >
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleCreateFolder} radius={themeRadius}>
                            Create
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={!!previewFile}
                onOpenChange={() => setPreviewFile(null)}
                size="3xl"
            >
                <ModalContent>
                    <ModalHeader>{previewFile?.name}</ModalHeader>
                    <ModalBody>
                        {previewFile?.mime_type?.startsWith('image/') ? (
                            <img src={previewFile.url} alt={previewFile.name} className="w-full" />
                        ) : (
                            <div className="p-8 text-center">
                                <div className="text-6xl mb-4">{getFileIcon(previewFile)}</div>
                                <p className="text-lg font-semibold">{previewFile?.name}</p>
                                <p className="text-sm text-default-500">Size: {formatSize(previewFile?.size)}</p>
                                <p className="text-sm text-default-500">
                                    Modified: {previewFile && new Date(previewFile.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setPreviewFile(null)} radius={themeRadius}>
                            Close
                        </Button>
                        <Button
                            color="primary"
                            onPress={() => handleDownload(previewFile.id)}
                            radius={themeRadius}
                        >
                            Download
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
