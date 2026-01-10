import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import {
    EllipsisVerticalIcon,
    FolderIcon,
    FolderOpenIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Folders = ({ folders = [] }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete } = useHRMAC('dms');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', parent_id: null });

    const columns = [
        { uid: 'name', name: 'Folder Name' },
        { uid: 'documents_count', name: 'Documents' },
        { uid: 'children', name: 'Subfolders' },
        { uid: 'is_shared', name: 'Shared' },
        { uid: 'actions', name: 'Actions' },
    ];

    const openCreateModal = () => {
        setEditingFolder(null);
        setFormData({ name: '', description: '', parent_id: null });
        setIsModalOpen(true);
    };

    const openEditModal = (folder) => {
        setEditingFolder(folder);
        setFormData({
            name: folder.name,
            description: folder.description || '',
            parent_id: folder.parent_id,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const routeName = editingFolder ? 'dms.folders.update' : 'dms.folders.store';
        const method = editingFolder ? 'put' : 'post';
        const url = editingFolder 
            ? route(routeName, editingFolder.id) 
            : route(routeName);

        const promise = new Promise((resolve, reject) => {
            router[method](url, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    resolve(['Folder saved successfully']);
                },
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Saving folder...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleDelete = (folder) => {
        if (!confirm('Are you sure you want to delete this folder?')) return;

        const promise = new Promise((resolve, reject) => {
            router.delete(route('dms.folders.destroy', folder.id), {
                preserveScroll: true,
                onSuccess: () => resolve(['Folder deleted successfully']),
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Deleting folder...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                            <FolderIcon className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-default-400">{item.description || 'No description'}</p>
                        </div>
                    </div>
                );
            case 'documents_count':
                return (
                    <Chip size="sm" variant="flat">{item.documents_count || 0} files</Chip>
                );
            case 'children':
                return (
                    <span className="text-sm text-default-500">
                        {item.children?.length || 0} subfolders
                    </span>
                );
            case 'is_shared':
                return (
                    <Chip 
                        size="sm" 
                        color={item.is_shared ? 'primary' : 'default'}
                        variant="flat"
                    >
                        {item.is_shared ? 'Shared' : 'Private'}
                    </Chip>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Folder actions">
                            <DropdownItem 
                                key="open" 
                                startContent={<FolderOpenIcon className="w-4 h-4" />}
                            >
                                Open
                            </DropdownItem>
                            {canUpdate && (
                                <DropdownItem 
                                    key="edit" 
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => openEditModal(item)}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete && (
                                <DropdownItem 
                                    key="delete" 
                                    className="text-danger" 
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(item)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    const headerActions = canCreate && (
        <Button 
            color="primary" 
            variant="shadow"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={openCreateModal}
        >
            New Folder
        </Button>
    );

    const contentSection = (
        <Table
            aria-label="Folders table"
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3"
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody items={folders} emptyContent="No folders found. Create your first folder.">
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <Head title="Document Folders" />
            
            <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>
                        {editingFolder ? 'Edit Folder' : 'Create Folder'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <Input
                                label="Folder Name"
                                placeholder="Enter folder name"
                                value={formData.name}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                                isRequired
                            />
                            <Input
                                label="Description"
                                placeholder="Enter description"
                                value={formData.description}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            {editingFolder ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title="Document Folders"
                subtitle="Organize documents into folders"
                icon={<FolderIcon className="w-8 h-8" />}
                actions={headerActions}
                content={contentSection}
                breadcrumbs={[
                    { label: 'Home', href: route('core.dashboard') },
                    { label: 'Document Management' },
                    { label: 'Folders' },
                ]}
            />
        </>
    );
};

export default Folders;
