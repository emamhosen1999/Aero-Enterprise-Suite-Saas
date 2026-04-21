import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Pagination, Select, SelectItem, Skeleton, Table, TableBody, TableCell,
    TableColumn, TableHeader, TableRow, Textarea,
} from '@heroui/react';
import {
    CheckCircleIcon, FolderIcon, MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const EMPTY_FORM = { name: '', description: '', color: '#3b82f6', is_active: true };

const AssetCategoriesIndex = ({ title }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    const canAdd  = canCreate('hrm.assets.categories') || isSuperAdmin();
    const canEdit = canUpdate('hrm.assets.categories') || isSuperAdmin();
    const canDel  = canDelete('hrm.assets.categories') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [loading, setLoading]         = useState(false);
    const [categories, setCategories]   = useState([]);
    const [total, setTotal]             = useState(0);
    const [search, setSearch]           = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 20;

    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false });
    const [selected, setSelected]       = useState(null);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [formErrors, setFormErrors]   = useState({});
    const [submitting, setSubmitting]   = useState(false);

    const statsData = useMemo(() => {
        const active = categories.filter(c => c.is_active).length;
        return [
            { title: 'Total Categories', value: total || categories.length, icon: <FolderIcon className="w-6 h-6" />, color: 'text-primary', iconBg: 'bg-primary/20' },
            { title: 'Active', value: active, icon: <CheckCircleIcon className="w-6 h-6" />, color: 'text-success', iconBg: 'bg-success/20' },
        ];
    }, [categories, total]);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.assets.categories.list'), {
                params: { page: currentPage, perPage, search },
            });
            if (response.status === 200) {
                const d = response.data;
                setCategories(Array.isArray(d) ? d : (d.data || []));
                setTotal(d.total ?? (Array.isArray(d) ? d.length : 0));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch categories' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, search]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const openModal = (type, item = null) => {
        setSelected(item);
        setFormErrors({});
        setForm(item ? { name: item.name || '', description: item.description || '', color: item.color || '#3b82f6', is_active: item.is_active ?? true } : EMPTY_FORM);
        setModalStates(prev => ({ ...prev, [type]: true }));
    };
    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelected(null);
        setFormErrors({});
    };

    const handleSubmit = (type) => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = type === 'add'
                    ? await axios.post(route('hrm.assets.categories.store'), form)
                    : await axios.put(route('hrm.assets.categories.update', selected.id), form);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || (type === 'add' ? 'Category created' : 'Category updated')]);
                    closeModal(type);
                    fetchCategories();
                }
            } catch (error) {
                if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
                reject(error.response?.data?.message || 'Operation failed');
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: type === 'add' ? 'Creating category...' : 'Updating category...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.assets.categories.destroy', selected.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Category deleted']);
                    closeModal('delete');
                    fetchCategories();
                }
            } catch (error) {
                reject(error.response?.data?.message || 'Delete failed');
            }
        });
        showToast.promise(promise, {
            loading: 'Deleting category...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const columns = [
        { uid: 'name', name: 'NAME' },
        { uid: 'description', name: 'DESCRIPTION' },
        { uid: 'status', name: 'STATUS' },
        { uid: 'actions', name: 'ACTIONS' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex items-center gap-2">
                        {item.color && <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />}
                        <span className="font-medium text-sm">{item.name}</span>
                    </div>
                );
            case 'description':
                return <span className="text-sm text-default-500 line-clamp-2">{item.description || '—'}</span>;
            case 'status':
                return <Chip color={item.is_active ? 'success' : 'default'} size="sm" variant="flat">{item.is_active ? 'Active' : 'Inactive'}</Chip>;
            case 'actions':
                return (
                    <div className="flex gap-1">
                        {canEdit && <Button isIconOnly size="sm" variant="light" onPress={() => openModal('edit', item)}><PencilIcon className="w-4 h-4" /></Button>}
                        {canDel  && <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => openModal('delete', item)}><TrashIcon className="w-4 h-4" /></Button>}
                    </div>
                );
            default:
                return item[columnKey] ?? '—';
        }
    };

    const activeModal = modalStates.add ? 'add' : modalStates.edit ? 'edit' : null;

    return (
        <>
            <Head title={title || 'Asset Categories'} />

            {/* Add / Edit Modal */}
            {activeModal && (
                <Modal isOpen scrollBehavior="inside" size="lg" onOpenChange={() => closeModal(activeModal)}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>{activeModal === 'add' ? 'Add Asset Category' : 'Edit Asset Category'}</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Input label="Name" placeholder="Category name" isRequired radius={themeRadius}
                                value={form.name} onValueChange={(v) => setForm(p => ({ ...p, name: v }))}
                                isInvalid={!!formErrors.name} errorMessage={formErrors.name} />
                            <Textarea label="Description" placeholder="Optional description" radius={themeRadius}
                                value={form.description} onValueChange={(v) => setForm(p => ({ ...p, description: v }))}
                                isInvalid={!!formErrors.description} errorMessage={formErrors.description} />
                            <Input type="color" label="Color" radius={themeRadius}
                                value={form.color} onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))} />
                            <Select label="Status" radius={themeRadius}
                                selectedKeys={[String(form.is_active)]}
                                onSelectionChange={(keys) => setForm(p => ({ ...p, is_active: Array.from(keys)[0] === 'true' }))}>
                                <SelectItem key="true">Active</SelectItem>
                                <SelectItem key="false">Inactive</SelectItem>
                            </Select>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(activeModal)}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={() => handleSubmit(activeModal)}>
                                {activeModal === 'add' ? 'Create' : 'Update'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Delete Confirm Modal */}
            {modalStates.delete && (
                <Modal isOpen size="sm" onOpenChange={() => closeModal('delete')}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Delete Category</ModalHeader>
                        <ModalBody className="py-4">
                            <p>Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="Asset Categories"
                subtitle="Manage asset categories and types"
                icon={<FolderIcon />}
                actions={canAdd && (
                    <Button color="primary" variant="shadow" size={isMobile ? 'sm' : 'md'}
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => openModal('add')}>
                        Add Category
                    </Button>
                )}
                stats={<StatsCards stats={statsData} />}
                filters={
                    <Input label="Search" placeholder="Search categories..." variant="bordered" size="sm" radius={themeRadius}
                        value={search} onValueChange={(v) => { setSearch(v); setCurrentPage(1); }}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} />
                }
                pagination={total > perPage && (
                    <div className="flex justify-center">
                        <Pagination total={Math.ceil(total / perPage)} page={currentPage} onChange={setCurrentPage} size="sm" />
                    </div>
                )}
                ariaLabel="Asset Categories"
            >
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                    </div>
                ) : (
                    <Table aria-label="Asset categories" isHeaderSticky
                        classNames={{ wrapper: 'shadow-none border border-divider rounded-lg', th: 'bg-default-100 text-default-600 font-semibold', td: 'py-3' }}>
                        <TableHeader columns={columns}>
                            {(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={categories} emptyContent="No categories found">
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(colKey) => <TableCell>{renderCell(item, colKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </StandardPageLayout>
        </>
    );
};

AssetCategoriesIndex.layout = (page) => <App children={page} />;
export default AssetCategoriesIndex;
