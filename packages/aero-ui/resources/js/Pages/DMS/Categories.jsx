import React, { useState, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
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
    PencilIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Categories = ({ categories = [] }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete } = useHRMAC('dms');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' });

    const columns = [
        { uid: 'name', name: 'Category Name' },
        { uid: 'documents_count', name: 'Documents' },
        { uid: 'color', name: 'Color' },
        { uid: 'is_active', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '', color: '#3b82f6' });
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            color: category.color || '#3b82f6',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const routeName = editingCategory ? 'dms.categories.update' : 'dms.categories.store';
        const method = editingCategory ? 'put' : 'post';
        const url = editingCategory 
            ? route(routeName, editingCategory.id) 
            : route(routeName);

        const promise = new Promise((resolve, reject) => {
            router[method](url, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    resolve(['Category saved successfully']);
                },
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Saving category...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleDelete = (category) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        const promise = new Promise((resolve, reject) => {
            router.delete(route('dms.categories.destroy', category.id), {
                preserveScroll: true,
                onSuccess: () => resolve(['Category deleted successfully']),
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Deleting category...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex items-center gap-3">
                        <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${item.color}20` }}
                        >
                            <FolderIcon className="w-5 h-5" style={{ color: item.color }} />
                        </div>
                        <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-default-400">{item.description || 'No description'}</p>
                        </div>
                    </div>
                );
            case 'documents_count':
                return (
                    <Chip size="sm" variant="flat">{item.documents_count || 0} documents</Chip>
                );
            case 'color':
                return (
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-6 h-6 rounded-full border border-divider"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-default-500">{item.color}</span>
                    </div>
                );
            case 'is_active':
                return (
                    <Chip 
                        size="sm" 
                        color={item.is_active ? 'success' : 'default'}
                        variant="flat"
                    >
                        {item.is_active ? 'Active' : 'Inactive'}
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
                        <DropdownMenu aria-label="Category actions">
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
            Add Category
        </Button>
    );

    const contentSection = (
        <Table
            aria-label="Categories table"
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
            <TableBody items={categories} emptyContent="No categories found. Create your first category.">
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
            <Head title="Document Categories" />
            
            <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>
                        {editingCategory ? 'Edit Category' : 'Create Category'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <Input
                                label="Category Name"
                                placeholder="Enter category name"
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
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium">Color</label>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            {editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title="Document Categories"
                subtitle="Organize your documents with categories"
                icon={<FolderIcon className="w-8 h-8" />}
                actions={headerActions}
                content={contentSection}
                breadcrumbs={[
                    { label: 'Home', href: route('core.dashboard') },
                    { label: 'Document Management' },
                    { label: 'Categories' },
                ]}
            />
        </>
    );
};

export default Categories;
