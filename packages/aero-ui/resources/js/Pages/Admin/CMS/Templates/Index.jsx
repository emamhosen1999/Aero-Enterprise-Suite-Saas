import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Textarea, Select, SelectItem } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const CmsTemplates = ({ title = 'CMS Templates' }) => {
    const { auth } = usePage().props;

    const themeRadius = useThemeRadius();

    const [isMobile, setIsMobile] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '', layout: '{}' });

    const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteChange } = useDisclosure();
    const [templateToDelete, setTemplateToDelete] = useState(null);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.cms.templates.index'));
            if (response.status === 200) {
                setTemplates(response.data.data || []);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch templates' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleCreate = () => {
        setSelectedTemplate(null);
        setFormData({ name: '', slug: '', description: '', layout: '{}' });
        onFormOpen();
    };

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setFormData(template);
        onFormOpen();
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let response;
            if (selectedTemplate?.id) {
                response = await axios.put(route('admin.cms.templates.update', selectedTemplate.id), formData);
            } else {
                response = await axios.post(route('admin.cms.templates.store'), formData);
            }

            if (response.status === 200 || response.status === 201) {
                const newTemplate = response.data.data || response.data;
                
                if (selectedTemplate?.id) {
                    setTemplates(templates.map(t => t.id === newTemplate.id ? newTemplate : t));
                    showToast.promise(Promise.resolve([]), { success: 'Template updated' });
                } else {
                    setTemplates([...templates, newTemplate]);
                    showToast.promise(Promise.resolve([]), { success: 'Template created' });
                }
                onFormChange(false);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to save template' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (template) => {
        setTemplateToDelete(template);
        onDeleteOpen();
    };

    const confirmDelete = async () => {
        if (templateToDelete) {
            setLoading(true);
            try {
                const response = await axios.delete(route('admin.cms.templates.destroy', templateToDelete.id));
                if (response.status === 200) {
                    setTemplates(templates.filter(t => t.id !== templateToDelete.id));
                    showToast.promise(Promise.resolve([]), { success: 'Template deleted' });
                    onDeleteChange(false);
                }
            } catch (error) {
                showToast.promise(Promise.reject(error), { error: 'Failed to delete template' });
            } finally {
                setLoading(false);
            }
        }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'description', label: 'Description' },
        { key: 'pages_count', label: 'Pages Using' },
        { key: 'actions', label: 'Actions' },
    ];

    const renderCell = (template, columnKey) => {
        switch (columnKey) {
            case 'name':
                return <span className="font-medium">{template.name}</span>;
            case 'slug':
                return <code className="text-xs bg-default-100 px-2 py-1 rounded">{template.slug}</code>;
            case 'description':
                return <span className="text-sm text-default-500 line-clamp-2">{template.description}</span>;
            case 'pages_count':
                return <Chip size="sm" variant="flat">{template.pages_count || 0}</Chip>;
            case 'actions':
                return (
                    <div className="flex gap-2">
                        <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(template)}>
                            <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(template)}>
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return template[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            {/* Form Modal */}
            <Modal isOpen={isFormOpen} onOpenChange={onFormChange} size="2xl">
                <ModalContent>
                    <ModalHeader>{selectedTemplate?.id ? 'Edit Template' : 'Create Template'}</ModalHeader>
                    <ModalBody className="gap-4">
                        <Input
                            label="Template Name"
                            placeholder="e.g. Landing Page"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                        <Input
                            label="Slug"
                            placeholder="e.g. landing-page"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                        <Textarea
                            label="Description"
                            placeholder="Describe this template..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            minRows={2}
                        />
                        <Textarea
                            label="Layout (JSON)"
                            placeholder='{"columns": 1}'
                            value={formData.layout}
                            onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                            className="font-mono text-xs"
                            minRows={4}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => onFormChange(false)}>Cancel</Button>
                        <Button color="primary" isLoading={loading} onPress={handleSave}>
                            {selectedTemplate?.id ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteChange}>
                <ModalContent>
                    <ModalHeader>Confirm Delete</ModalHeader>
                    <ModalBody>
                        Are you sure you want to delete "{templateToDelete?.name}"?
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
                                            <span className="text-lg">🎨</span>
                                        </div>
                                        <div>
                                            <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Page Templates</h4>
                                            <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Manage reusable page layouts</p>
                                        </div>
                                    </div>
                                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} onPress={handleCreate}>
                                        New Template
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <Table aria-label="Templates table" isHeaderSticky classNames={{
                                wrapper: "shadow-none border border-divider rounded-lg",
                                th: "bg-default-100 text-default-600 font-semibold",
                            }}>
                                <TableHeader columns={columns}>
                                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                                </TableHeader>
                                <TableBody items={templates} emptyContent="No templates found">
                                    {(template) => (
                                        <TableRow key={template.id}>
                                            {(columnKey) => <TableCell>{renderCell(template, columnKey)}</TableCell>}
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

CmsTemplates.layout = (page) => <App children={page} />;
export default CmsTemplates;