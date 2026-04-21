import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Pagination, Select, SelectItem, Skeleton, Table, TableBody, TableCell,
    TableColumn, TableHeader, TableRow, Textarea,
} from '@heroui/react';
import {
    CheckCircleIcon, Cog6ToothIcon, ExclamationTriangleIcon,
    MagnifyingGlassIcon, PencilIcon, PlusIcon, ShieldExclamationIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const SEVERITY_COLORS = { minor: 'warning', major: 'danger', gross: 'danger' };
const SEVERITY_OPTIONS = ['minor', 'major', 'gross'];
const EMPTY_FORM = { name: '', description: '', severity_level: 'minor', is_active: true };

const ActionTypesIndex = ({ title }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    const canAdd  = canCreate('hrm.disciplinary.action-types') || isSuperAdmin();
    const canEdit = canUpdate('hrm.disciplinary.action-types') || isSuperAdmin();
    const canDel  = canDelete('hrm.disciplinary.action-types') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [loading, setLoading]         = useState(false);
    const [actionTypes, setActionTypes] = useState([]);
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
        const active = actionTypes.filter(t => t.is_active).length;
        const minor  = actionTypes.filter(t => t.severity_level === 'minor').length;
        const major  = actionTypes.filter(t => t.severity_level === 'major').length;
        const gross  = actionTypes.filter(t => t.severity_level === 'gross').length;
        return [
            { title: 'Total Types',  value: total || actionTypes.length, icon: <Cog6ToothIcon className="w-6 h-6" />,            color: 'text-primary', iconBg: 'bg-primary/20' },
            { title: 'Active',       value: active,                      icon: <CheckCircleIcon className="w-6 h-6" />,          color: 'text-success', iconBg: 'bg-success/20' },
            { title: 'Minor',        value: minor,                       icon: <ExclamationTriangleIcon className="w-6 h-6" />,  color: 'text-warning', iconBg: 'bg-warning/20' },
            { title: 'Major / Gross', value: major + gross,              icon: <ShieldExclamationIcon className="w-6 h-6" />,   color: 'text-danger',  iconBg: 'bg-danger/20'  },
        ];
    }, [actionTypes, total]);

    const fetchActionTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.disciplinary.action-types.list'), {
                params: { page: currentPage, perPage, search },
            });
            if (response.status === 200) {
                const d = response.data;
                setActionTypes(Array.isArray(d) ? d : (d.data || []));
                setTotal(d.total ?? (Array.isArray(d) ? d.length : 0));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch action types' });
        } finally { setLoading(false); }
    }, [currentPage, search]);

    useEffect(() => { fetchActionTypes(); }, [fetchActionTypes]);

    const openModal = (type, item = null) => {
        setSelected(item);
        setFormErrors({});
        setForm(item ? { name: item.name || '', description: item.description || '', severity_level: item.severity_level || 'minor', is_active: item.is_active ?? true } : EMPTY_FORM);
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
                    ? await axios.post(route('hrm.disciplinary.action-types.store'), form)
                    : await axios.put(route('hrm.disciplinary.action-types.update', selected.id), form);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || (type === 'add' ? 'Action type created' : 'Action type updated')]);
                    closeModal(type);
                    fetchActionTypes();
                }
            } catch (error) {
                if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
                reject(error.response?.data?.message || 'Operation failed');
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: type === 'add' ? 'Creating action type...' : 'Updating action type...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.disciplinary.action-types.destroy', selected.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Action type deleted']);
                    closeModal('delete');
                    fetchActionTypes();
                }
            } catch (error) { reject(error.response?.data?.message || 'Delete failed'); }
        });
        showToast.promise(promise, { loading: 'Deleting...', success: (d) => d.join(', '), error: (e) => String(e) });
    };

    const columns = [
        { uid: 'name',           name: 'NAME' },
        { uid: 'severity_level', name: 'SEVERITY' },
        { uid: 'status',         name: 'STATUS' },
        { uid: 'actions',        name: 'ACTIONS' },
    ];

    const renderCell = (item, colKey) => {
        switch (colKey) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.name}</span>
                        {item.description && <span className="text-xs text-default-500 line-clamp-1">{item.description}</span>}
                    </div>
                );
            case 'severity_level':
                return <Chip color={SEVERITY_COLORS[item.severity_level] || 'default'} size="sm" variant="flat" className="capitalize">{item.severity_level || '—'}</Chip>;
            case 'status':
                return <Chip color={item.is_active ? 'success' : 'default'} size="sm" variant="flat">{item.is_active ? 'Active' : 'Inactive'}</Chip>;
            case 'actions':
                return (
                    <div className="flex gap-1">
                        {canEdit && <Button isIconOnly size="sm" variant="light" onPress={() => openModal('edit', item)}><PencilIcon className="w-4 h-4" /></Button>}
                        {canDel  && <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => openModal('delete', item)}><TrashIcon className="w-4 h-4" /></Button>}
                    </div>
                );
            default: return item[colKey] ?? '—';
        }
    };

    const activeModal = modalStates.add ? 'add' : modalStates.edit ? 'edit' : null;

    return (
        <>
            <Head title={title || 'Disciplinary Action Types'} />

            {/* Add / Edit Modal */}
            {activeModal && (
                <Modal isOpen scrollBehavior="inside" size="lg" onOpenChange={() => closeModal(activeModal)}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>{activeModal === 'add' ? 'Add Action Type' : 'Edit Action Type'}</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Input label="Name" placeholder="Action type name" isRequired radius={themeRadius}
                                value={form.name} onValueChange={(v) => setForm(p => ({ ...p, name: v }))}
                                isInvalid={!!formErrors.name} errorMessage={formErrors.name} />
                            <Textarea label="Description" placeholder="Optional description" radius={themeRadius}
                                value={form.description} onValueChange={(v) => setForm(p => ({ ...p, description: v }))} />
                            <Select label="Severity Level" isRequired radius={themeRadius}
                                selectedKeys={form.severity_level ? [form.severity_level] : []}
                                onSelectionChange={(keys) => setForm(p => ({ ...p, severity_level: Array.from(keys)[0] || 'minor' }))}
                                isInvalid={!!formErrors.severity_level} errorMessage={formErrors.severity_level}>
                                {SEVERITY_OPTIONS.map(s => <SelectItem key={s} className="capitalize">{s}</SelectItem>)}
                            </Select>
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

            {/* Delete Modal */}
            {modalStates.delete && (
                <Modal isOpen size="sm" onOpenChange={() => closeModal('delete')}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Delete Action Type</ModalHeader>
                        <ModalBody className="py-4">
                            <p>Delete <strong>{selected?.name}</strong>? This cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="Disciplinary Action Types"
                subtitle="Configure action types and severity levels"
                icon={<Cog6ToothIcon />}
                actions={canAdd && (
                    <Button color="primary" variant="shadow" size={isMobile ? 'sm' : 'md'}
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => openModal('add')}>
                        Add Action Type
                    </Button>
                )}
                stats={<StatsCards stats={statsData} />}
                filters={
                    <Input label="Search" placeholder="Search action types..." variant="bordered" size="sm" radius={themeRadius}
                        value={search} onValueChange={(v) => { setSearch(v); setCurrentPage(1); }}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} />
                }
                pagination={total > perPage && (
                    <div className="flex justify-center">
                        <Pagination total={Math.ceil(total / perPage)} page={currentPage} onChange={setCurrentPage} size="sm" />
                    </div>
                )}
                ariaLabel="Disciplinary Action Types"
            >
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                    </div>
                ) : (
                    <Table aria-label="Disciplinary action types" isHeaderSticky
                        classNames={{ wrapper: 'shadow-none border border-divider rounded-lg', th: 'bg-default-100 text-default-600 font-semibold', td: 'py-3' }}>
                        <TableHeader columns={columns}>
                            {(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={actionTypes} emptyContent="No action types found">
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

ActionTypesIndex.layout = (page) => <App children={page} />;
export default ActionTypesIndex;
