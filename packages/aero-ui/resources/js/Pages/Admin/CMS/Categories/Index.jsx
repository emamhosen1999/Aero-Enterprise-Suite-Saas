import React, { useCallback, useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Textarea } from "@heroui/react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const CmsCategories = ({ title = 'CMS Categories' }) => {
    const { auth } = usePage().props;

    const themeRadius = useThemeRadius();

    const [isMobile, setIsMobile] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: '', color: '#000000' });

    const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteChange } = useDisclosure();
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.cms.categories.index'));
            if (response.status === 200) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch categories' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleCreate = () => {
        setSelectedCategory(null);
        setFormData({ name: '', slug: '', description: '', icon: '', color: '#000000' });
        onFormOpen();
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setFormData(category);
        onFormOpen();
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let response;
            if (selectedCategory?.id) {
                response = await axios.put(route('admin.cms.categories.update', selectedCategory.id), formData);
            } else {
                response = await axios.post(route('admin.cms.categories.store'), formData);
            }

            if (response.status === 200 || response.status === 201) {
                const newCategory = response.data.data || response.data;
                
                if (selectedCategory?.id) {
                    setCategories(categories.map(c => c.id === newCategory.id ? newCategory : c));
                    showToast.promise(Promise.resolve([]), { success: 'Category updated' });
                } else {
                    setCategories([...categories, newCategory]);
                    showToast.promise(Promise.resolve([]), { success: 'Category created' });
                }
                onFormChange(false);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to save category' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (category) => {
        setCategoryToDelete(category);
        onDeleteOpen();
    };

    const confirmDelete = async () => {
        if (categoryToDelete) {
            setLoading(true);
            try {
                const response = await axios.delete(route('admin.cms.categories.destroy', categoryToDelete.id));
                if (response.status === 200) {
                    setCategories(categories.filter(c => c.id !== categoryToDelete.id));
                    showToast.promise(Promise.resolve([]), { success: 'Category deleted' });
                    onDeleteChange(false);
                }
            } catch (error) {
                showToast.promise(Promise.reject(error), { error: 'Failed to delete category' });
            } finally {
                setLoading(false);
            }
        }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'description', label: 'Description' },
        { key: 'pages_count', label: 'Pages' },
        { key: 'actions', label: 'Actions' },
    ];

    const renderCell = (category, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex items-center gap-2">
                        {category.icon && <span className="text-lg">{category.icon}</span>}
                        <span className="font-medium">{category.name}</span>
                    </div>
                );
            case 'slug':
                return <code className="text-xs bg-default-100 px-2 py-1 rounded">{category.slug}</code>;
            case 'description':
                return <span className="text-sm text-default-500 line-clamp-2">{category.description}</span>;
            case 'pages_count':
                return <Chip size="sm" variant="flat">{category.pages_count || 0}</Chip>;
            case 'actions':
                return (
                    <div className="flex gap-2">
                        <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(category)}>
                            <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(category)}>
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return category[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            {/* Form Modal */}
            <Modal isOpen={isFormOpen} onOpenChange={onFormChange} size="2xl">
                <ModalContent>
                    <ModalHeader>{selectedCategory?.id ? 'Edit Category' : 'Create Category'}</ModalHeader>
                    <ModalBody className="gap-4">
                        <Input
                            label="Category Name"
                            placeholder="e.g. Blog Posts"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                        <Input
                            label="Slug"
                            placeholder="e.g. blog-posts"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                        <Textarea
                            label="Description"
                            placeholder="Describe this category..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            minRows={2}
                        />
                        <Input
                            label="Icon"
                            placeholder="e.g. 📚 or icon-name"
                            value={formData.icon || ''}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                        <Input
                            label="Color"
                            type="color"
                            value={formData.color || '#000000'}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => onFormChange(false)}>Cancel</Button>
                        <Button color="primary" isLoading={loading} onPress={handleSave}>
                            {selectedCategory?.id ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteChange}>
                <ModalContent>
                    <ModalHeader>Confirm Delete</ModalHeader>
                    <ModalBody>
                        Are you sure you want to delete "{categoryToDelete?.name}"?
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => onDeleteChange(false)}>Cancel</Button>
                        <Button color="danger" isLoading={loading} onPress={confirmDelete}>Delete</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="flex flex-col w-full h-full p-4" role="main">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                    <Card className="transition-all duration-200">
                        <CardHeader className="border-b p-0">
                            <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl bg-primary/20`}>
                                            <span className="text-lg">🏷️</span>
                                        </div>
                                        <div>
                                            <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Page Categories</h4>
                                            <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Organize pages into categories</p>
                                        </div>
                                    </div>
                                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} onPress={handleCreate}>
                                        New Category
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <Table aria-label="Categories table" isHeaderSticky classNames={{
                                wrapper: "shadow-none border border-divider rounded-lg",
                                th: "bg-default-100 text-default-600 font-semibold",
                            }}>
                                <TableHeader columns={columns}>
                                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                                </TableHeader>
                                <TableBody items={categories} emptyContent="No categories found">
                                    {(category) => (
                                        <TableRow key={category.id}>
                                            {(columnKey) => <TableCell>{renderCell(category, columnKey)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

CmsCategories.layout = (page) => <App children={page} />;
export default CmsCategories;