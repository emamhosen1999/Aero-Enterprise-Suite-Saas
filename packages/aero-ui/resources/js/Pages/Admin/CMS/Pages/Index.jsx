import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Pagination, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon, CheckCircleIcon, ClockIcon, DocumentIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';

const CmsPagesList = ({ title, categories = [], templates = [] }) => {
    const { auth } = usePage().props;

    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    const [isMobile, setIsMobile] = useState(false);
    const [pages, setPages] = useState([]);
    const [filters, setFilters] = useState({ search: '', status: 'all', category: 'all' });
    const [pagination, setPagination] = useState({ perPage: 20, currentPage: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });
    const [selectedPages, setSelectedPages] = useState([]);
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteChange } = useDisclosure();
    const [pageToDelete, setPageToDelete] = useState(null);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const fetchPages = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.cms.pages.index'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            if (response.status === 200) {
                setPages(response.data.data || response.data.pages || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || response.data.data?.length || 0
                }));
                setStats({
                    total: response.data.total || pages.length,
                    published: pages.filter(p => p.status === 'published').length,
                    draft: pages.filter(p => p.status === 'draft').length,
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch pages' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const statsData = useMemo(() => [
        { title: "Total Pages", value: stats.total, icon: <DocumentIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Published", value: stats.published, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Drafts", value: stats.draft, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
    ], [stats]);

    const { hasAccess: hrmacHasAccess } = useHRMAC();
    const canCreate = hrmacHasAccess('cms.pages.list.create');
    const canEdit = hrmacHasAccess('cms.pages.editor.edit');
    const canDelete = hrmacHasAccess('cms.pages.list.delete');

    const handleDelete = (page) => {
        setPageToDelete(page);
        onDeleteOpen();
    };

    const confirmDelete = () => {
        if (pageToDelete) {
            const promise = new Promise(async (resolve, reject) => {
                try {
                    const response = await axios.delete(route('admin.cms.pages.destroy', pageToDelete.id));
                    if (response.status === 200) {
                        setPages(pages.filter(p => p.id !== pageToDelete.id));
                        resolve(['Page deleted successfully']);
                    }
                } catch (error) {
                    reject(error.response?.data?.message || 'Failed to delete page');
                }
            });
            showToast.promise(promise, {
                loading: 'Deleting page...',
                success: (data) => data[0],
                error: (err) => err
            });
            onDeleteChange(false);
        }
    };

    const statusColorMap = { published: 'success', draft: 'warning', archived: 'danger' };

    const columns = [
        { key: 'title', label: 'Title' },
        { key: 'slug', label: 'Slug' },
        { key: 'status', label: 'Status' },
        { key: 'category', label: 'Category' },
        { key: 'updated_at', label: 'Updated' },
        { key: 'actions', label: 'Actions' },
    ];

    const renderCell = (page, columnKey) => {
        switch (columnKey) {
            case 'title':
                return <span className="font-medium">{page.title}</span>;
            case 'slug':
                return <code className="text-xs bg-default-100 px-2 py-1 rounded">{page.slug}</code>;
            case 'status':
                return <Chip size="sm" color={statusColorMap[page.status]} variant="flat">{page.status}</Chip>;
            case 'category':
                return page.category?.name || '-';
            case 'updated_at':
                return new Date(page.updated_at).toLocaleDateString();
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <span className="text-lg">⋮</span>
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}>
                                View
                            </DropdownItem>
                            {canEdit && <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />} href={route('admin.cms.pages.edit', page.id)}>
                                Edit
                            </DropdownItem>}
                            {canDelete && <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => handleDelete(page)}>
                                Delete
                            </DropdownItem>}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return page[columnKey];
        }
    };

    return (
        <>
            <Head title={title} />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteChange}>
                <ModalContent>
                    <ModalHeader>Confirm Delete</ModalHeader>
                    <ModalBody>
                        Are you sure you want to delete "{pageToDelete?.title}"? This action cannot be undone.
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => onDeleteChange(false)}>Cancel</Button>
                        <Button color="danger" onPress={confirmDelete}>Delete</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Create Page Modal */}
            <Modal isOpen={isCreateOpen} onOpenChange={onCreateChange} size="2xl">
                <ModalContent>
                    <ModalHeader>Create New Page</ModalHeader>
                    <ModalBody>
                        <Input label="Page Title" placeholder="e.g., About Us" isRequired />
                        <Select label="Category" placeholder="Select category">
                            {categories.map(cat => (
                                <SelectItem key={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </Select>
                        <Select label="Template" placeholder="Choose a template">
                            {templates.map(tpl => (
                                <SelectItem key={tpl.id}>{tpl.name}</SelectItem>
                            ))}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => onCreateChange(false)}>Cancel</Button>
                        <Button color="primary" onPress={() => {
                            showToast.promise(Promise.resolve(['Page created']), { success: 'Page created - redirecting...' });
                            setTimeout(() => window.location.href = route('admin.cms.pages.create'), 500);
                        }}>Create</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="flex flex-col w-full h-full p-4" role="main">
                <div className="space-y-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                        <Card className="transition-all duration-200" style={{
                            background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%)`,
                        }}>
                            <CardHeader className="border-b p-0">
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl bg-primary/20`}>
                                                <DocumentIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Pages Manager</h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Create and manage CMS pages</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {canCreate && (
                                                <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} onPress={onCreateOpen} size={isMobile ? "sm" : "md"}>
                                                    New Page
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <StatsCards stats={statsData} className="mb-6" />

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <Input
                                        label="Search"
                                        placeholder="Search pages..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                        variant="bordered"
                                        size="sm"
                                        radius={getThemeRadius()}
                                    />
                                    <Select
                                        label="Status"
                                        placeholder="All Status"
                                        selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                        onSelectionChange={(keys) => setFilters({ ...filters, status: Array.from(keys)[0] || 'all' })}
                                        size="sm"
                                        radius={getThemeRadius()}
                                    >
                                        <SelectItem key="all">All Statuses</SelectItem>
                                        <SelectItem key="published">Published</SelectItem>
                                        <SelectItem key="draft">Draft</SelectItem>
                                        <SelectItem key="archived">Archived</SelectItem>
                                    </Select>
                                </div>

                                <Table aria-label="Pages table" isHeaderSticky classNames={{
                                    wrapper: "shadow-none border border-divider rounded-lg",
                                    th: "bg-default-100 text-default-600 font-semibold",
                                }}>
                                    <TableHeader columns={columns}>
                                        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                                    </TableHeader>
                                    <TableBody items={pages} emptyContent="No pages found">
                                        {(page) => (
                                            <TableRow key={page.id}>
                                                {(columnKey) => <TableCell>{renderCell(page, columnKey)}</TableCell>}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                <div className="flex justify-center mt-4">
                                    <Pagination
                                        total={Math.ceil(pagination.total / pagination.perPage)}
                                        page={pagination.currentPage}
                                        onChange={(page) => setPagination({ ...pagination, currentPage: page })}
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

CmsPagesList.layout = (page) => <App children={page} />;
export default CmsPagesList;
