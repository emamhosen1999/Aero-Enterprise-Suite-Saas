import React from 'react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip, Input, Select, SelectItem, Checkbox, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { MagnifyingGlassIcon, ArrowPathIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function TrashManager({ deletedFiles = [], onRestore, onDelete }) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [fileTypeFilter, setFileTypeFilter] = React.useState('all');
    const [selectedFiles, setSelectedFiles] = React.useState(new Set());
    const [showDeleteAllModal, setShowDeleteAllModal] = React.useState(false);
    const [autoDeleteDays, setAutoDeleteDays] = React.useState('30');
    const [loading, setLoading] = React.useState(false);

    const fileTypes = [
        { key: 'all', label: 'All Files' },
        { key: 'document', label: 'Documents' },
        { key: 'image', label: 'Images' },
        { key: 'video', label: 'Videos' },
        { key: 'audio', label: 'Audio' },
        { key: 'archive', label: 'Archives' },
        { key: 'other', label: 'Other' },
    ];

    const filteredFiles = React.useMemo(() => {
        return deletedFiles.filter(file => {
            const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = fileTypeFilter === 'all' || file.type === fileTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [deletedFiles, searchTerm, fileTypeFilter]);

    const handleSelectAll = () => {
        if (selectedFiles.size === filteredFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
        }
    };

    const handleSelectFile = (fileId) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
    };

    const handleRestore = async (fileIds) => {
        const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                setLoading(true);
                const response = await axios.post(route('admin.files.trash.restore'), {
                    file_ids: ids
                });
                resolve([response.data.message || 'Files restored successfully']);
                setSelectedFiles(new Set());
                onRestore?.();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to restore files']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Restoring files...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handlePermanentDelete = async (fileIds) => {
        const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                setLoading(true);
                const response = await axios.delete(route('admin.files.trash.permanent-delete'), {
                    data: { file_ids: ids }
                });
                resolve([response.data.message || 'Files permanently deleted']);
                setSelectedFiles(new Set());
                onDelete?.();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete files']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting files permanently...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDeleteAll = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                setLoading(true);
                const response = await axios.delete(route('admin.files.trash.empty'));
                resolve([response.data.message || 'All files permanently deleted']);
                setShowDeleteAllModal(false);
                setSelectedFiles(new Set());
                onDelete?.();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to empty trash']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Emptying trash...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleAutoDeleteConfig = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                setLoading(true);
                const response = await axios.put(route('admin.files.trash.auto-delete-config'), {
                    days: autoDeleteDays
                });
                resolve([response.data.message || 'Auto-delete configuration updated']);
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to update configuration']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating configuration...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const totalSize = React.useMemo(() => {
        return filteredFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    }, [filteredFiles]);

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            <Card>
                <CardHeader className="flex flex-col gap-3">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h3 className="text-lg font-semibold">Trash</h3>
                            <p className="text-sm text-default-500">
                                {filteredFiles.length} files ({formatBytes(totalSize)})
                            </p>
                        </div>
                        <Button
                            color="danger"
                            variant="flat"
                            size="sm"
                            onPress={() => setShowDeleteAllModal(true)}
                            isDisabled={deletedFiles.length === 0}
                        >
                            Empty Trash
                        </Button>
                    </div>

                    <div className="flex gap-3">
                        <Input
                            placeholder="Search files..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            className="max-w-xs"
                        />
                        <Select
                            placeholder="Filter by type"
                            selectedKeys={[fileTypeFilter]}
                            onSelectionChange={(keys) => setFileTypeFilter(Array.from(keys)[0])}
                            className="max-w-xs"
                            startContent={<FunnelIcon className="w-4 h-4" />}
                        >
                            {fileTypes.map((type) => (
                                <SelectItem key={type.key}>{type.label}</SelectItem>
                            ))}
                        </Select>
                    </div>

                    {selectedFiles.size > 0 && (
                        <div className="flex gap-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                            <Chip size="sm" variant="flat" color="primary">
                                {selectedFiles.size} selected
                            </Chip>
                            <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={() => handleRestore(Array.from(selectedFiles))}
                                isLoading={loading}
                            >
                                Restore Selected
                            </Button>
                            <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => handlePermanentDelete(Array.from(selectedFiles))}
                                isLoading={loading}
                            >
                                Delete Permanently
                            </Button>
                        </div>
                    )}
                </CardHeader>
            </Card>

            {/* Files Table */}
            <Card>
                <CardBody>
                    <Table aria-label="Deleted files table">
                        <TableHeader>
                            <TableColumn>
                                <Checkbox
                                    isSelected={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                                    onValueChange={handleSelectAll}
                                />
                            </TableColumn>
                            <TableColumn>FILE NAME</TableColumn>
                            <TableColumn>ORIGINAL LOCATION</TableColumn>
                            <TableColumn>DELETED DATE</TableColumn>
                            <TableColumn>SIZE</TableColumn>
                            <TableColumn>DELETED BY</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No files in trash">
                            {filteredFiles.map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell>
                                        <Checkbox
                                            isSelected={selectedFiles.has(file.id)}
                                            onValueChange={() => handleSelectFile(file.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{file.name}</p>
                                            <p className="text-xs text-default-500">{file.type}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-default-600">{file.original_path}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{formatDate(file.deleted_at)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{formatBytes(file.size)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{file.deleted_by?.name || 'Unknown'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                                onPress={() => handleRestore(file.id)}
                                                isLoading={loading}
                                            >
                                                Restore
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="danger"
                                                onPress={() => handlePermanentDelete(file.id)}
                                                isLoading={loading}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Auto-delete configuration */}
            <Card>
                <CardHeader>
                    <h4 className="font-semibold">Auto-delete Configuration</h4>
                </CardHeader>
                <CardBody>
                    <div className="flex gap-3 items-end">
                        <Select
                            label="Auto-delete files after"
                            selectedKeys={[autoDeleteDays]}
                            onSelectionChange={(keys) => setAutoDeleteDays(Array.from(keys)[0])}
                            className="max-w-xs"
                        >
                            <SelectItem key="7">7 days</SelectItem>
                            <SelectItem key="30">30 days</SelectItem>
                            <SelectItem key="60">60 days</SelectItem>
                            <SelectItem key="90">90 days</SelectItem>
                        </Select>
                        <Button
                            color="primary"
                            onPress={handleAutoDeleteConfig}
                            isLoading={loading}
                        >
                            Save Configuration
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Delete All Confirmation Modal */}
            <Modal isOpen={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)}>
                <ModalContent>
                    <ModalHeader>Confirm Empty Trash</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to permanently delete all files in trash? This action cannot be undone.</p>
                        <p className="text-danger mt-2">
                            {deletedFiles.length} files ({formatBytes(totalSize)}) will be permanently deleted.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setShowDeleteAllModal(false)}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleDeleteAll} isLoading={loading}>
                            Delete All Permanently
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
