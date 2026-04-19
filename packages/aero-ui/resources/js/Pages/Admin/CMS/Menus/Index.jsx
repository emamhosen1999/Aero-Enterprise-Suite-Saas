import React, { useCallback, useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const CmsMenus = ({ title = 'CMS Menus' }) => {
    const { auth } = usePage().props;

    const themeRadius = useThemeRadius();

    const [isMobile, setIsMobile] = useState(false);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '', location: '' });

    const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteChange } = useDisclosure();
    const { isOpen: isItemsOpen, onOpen: onItemsOpen, onOpenChange: onItemsChange } = useDisclosure();
    const [menuToDelete, setMenuToDelete] = useState(null);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const fetchMenus = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.cms.menus.index'));
            if (response.status === 200) {
                setMenus(response.data.data || []);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch menus' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenus();
    }, [fetchMenus]);

    const handleCreate = () => {
        setSelectedMenu(null);
        setFormData({ name: '', slug: '', location: '' });
        onFormOpen();
    };

    const handleEdit = (menu) => {
        setSelectedMenu(menu);
        setFormData(menu);
        onFormOpen();
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let response;
            if (selectedMenu?.id) {
                response = await axios.put(route('admin.cms.menus.update', selectedMenu.id), formData);
            } else {
                response = await axios.post(route('admin.cms.menus.store'), formData);
            }

            if (response.status === 200 || response.status === 201) {
                const newMenu = response.data.data || response.data;
                
                if (selectedMenu?.id) {
                    setMenus(menus.map(m => m.id === newMenu.id ? newMenu : m));
                    showToast.promise(Promise.resolve([]), { success: 'Menu updated' });
                } else {
                    setMenus([...menus, newMenu]);
                    showToast.promise(Promise.resolve([]), { success: 'Menu created' });
                }
                onFormChange(false);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to save menu' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (menu) => {
        setMenuToDelete(menu);
        onDeleteOpen();
    };

    const confirmDelete = async () => {
        if (menuToDelete) {
            setLoading(true);
            try {
                const response = await axios.delete(route('admin.cms.menus.destroy', menuToDelete.id));
                if (response.status === 200) {
                    setMenus(menus.filter(m => m.id !== menuToDelete.id));
                    showToast.promise(Promise.resolve([]), { success: 'Menu deleted' });
                    onDeleteChange(false);
                }
            } catch (error) {
                showToast.promise(Promise.reject(error), { error: 'Failed to delete menu' });
            } finally {
                setLoading(false);
            }
        }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'location', label: 'Location' },
        { key: 'items_count', label: 'Items' },
        { key: 'actions', label: 'Actions' },
    ];

    const renderCell = (menu, columnKey) => {
        switch (columnKey) {
            case 'name':
                return <span className="font-medium">{menu.name}</span>;
            case 'slug':
                return <code className="text-xs bg-default-100 px-2 py-1 rounded">{menu.slug}</code>;
            case 'location':
                return <Chip size="sm" variant="flat" color="primary">{menu.location}</Chip>;
            case 'items_count':
                return <Chip size="sm" variant="flat">{menu.items_count || 0}</Chip>;
            case 'actions':
                return (
                    <div className="flex gap-2">
                        <Button isIconOnly size="sm" variant="light" onPress={() => {
                            setSelectedMenu(menu);
                            onItemsOpen();
                        }}>
                            📋
                        </Button>
                        <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(menu)}>
                            <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(menu)}>
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return menu[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            {/* Menu Items Modal */}
            <Modal isOpen={isItemsOpen} onOpenChange={onItemsChange} size="2xl">
                <ModalContent>
                    <ModalHeader>Menu Items: {selectedMenu?.name}</ModalHeader>
                    <ModalBody>
                        <div className="space-y-2">
                            {selectedMenu?.items?.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 border border-divider rounded">
                                    <div>
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-xs text-default-500">{item.url}</p>
                                    </div>
                                    <Button isIconOnly size="sm" variant="light" color="danger">
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4">
                            <Input label="Add New Item" placeholder="Menu item label" size="sm" />
                            <Button className="mt-2 w-full" size="sm" color="primary">Add Item</Button>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Form Modal */}
            <Modal isOpen={isFormOpen} onOpenChange={onFormChange} size="2xl">
                <ModalContent>
                    <ModalHeader>{selectedMenu?.id ? 'Edit Menu' : 'Create Menu'}</ModalHeader>
                    <ModalBody className="gap-4">
                        <Input
                            label="Menu Name"
                            placeholder="e.g. Main Navigation"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                        <Input
                            label="Slug"
                            placeholder="e.g. main-nav"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                        <Input
                            label="Location"
                            placeholder="e.g. header, footer"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            size="sm"
                            radius={themeRadius}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => onFormChange(false)}>Cancel</Button>
                        <Button color="primary" isLoading={loading} onPress={handleSave}>
                            {selectedMenu?.id ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteChange}>
                <ModalContent>
                    <ModalHeader>Confirm Delete</ModalHeader>
                    <ModalBody>
                        Are you sure you want to delete "{menuToDelete?.name}"?
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
                                            <span className="text-lg">🔗</span>
                                        </div>
                                        <div>
                                            <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Navigation Menus</h4>
                                            <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Manage site navigation menus</p>
                                        </div>
                                    </div>
                                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} onPress={handleCreate}>
                                        New Menu
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <Table aria-label="Menus table" isHeaderSticky classNames={{
                                wrapper: "shadow-none border border-divider rounded-lg",
                                th: "bg-default-100 text-default-600 font-semibold",
                            }}>
                                <TableHeader columns={columns}>
                                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                                </TableHeader>
                                <TableBody items={menus} emptyContent="No menus found">
                                    {(menu) => (
                                        <TableRow key={menu.id}>
                                            {(columnKey) => <TableCell>{renderCell(menu, columnKey)}</TableCell>}
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

CmsMenus.layout = (page) => <App children={page} />;
export default CmsMenus;