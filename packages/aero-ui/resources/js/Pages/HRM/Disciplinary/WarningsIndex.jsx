import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Pagination, Select, SelectItem, Skeleton, Table, TableBody, TableCell,
    TableColumn, TableHeader, TableRow, Textarea,
} from '@heroui/react';
import {
    CheckCircleIcon, ClockIcon, ExclamationTriangleIcon,
    MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const WARNING_TYPE_COLORS = { verbal: 'warning', written: 'danger', final: 'danger', performance: 'default' };
const STATUS_COLORS = { active: 'warning', expired: 'default', resolved: 'success' };
const WARNING_TYPES = ['verbal', 'written', 'final', 'performance'];
const EMPTY_FORM = { employee_id: '', warning_type: 'verbal', reason: '', issued_date: '', expiry_date: '', status: 'active' };

const WarningsIndex = ({ title, employees = [] }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    const canAdd  = canCreate('hrm.disciplinary.warnings') || isSuperAdmin();
    const canEdit = canUpdate('hrm.disciplinary.warnings') || isSuperAdmin();
    const canDel  = canDelete('hrm.disciplinary.warnings') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [loading, setLoading]       = useState(false);
    const [warnings, setWarnings]     = useState([]);
    const [total, setTotal]           = useState(0);
    const [stats, setStats]           = useState({ total: 0, active: 0, expired: 0, verbal: 0, written: 0, final: 0 });
    const [search, setSearch]         = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 20;

    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false });
    const [selected, setSelected]       = useState(null);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [formErrors, setFormErrors]   = useState({});
    const [submitting, setSubmitting]   = useState(false);

    const statsData = useMemo(() => [
        { title: 'Total Warnings', value: stats.total,   icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: 'text-primary', iconBg: 'bg-primary/20' },
        { title: 'Active',         value: stats.active,  icon: <ClockIcon className="w-6 h-6" />,              color: 'text-warning', iconBg: 'bg-warning/20' },
        { title: 'Expired',        value: stats.expired, icon: <CheckCircleIcon className="w-6 h-6" />,        color: 'text-default', iconBg: 'bg-default/20' },
        { title: 'Verbal',         value: stats.verbal,  icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: 'text-warning', iconBg: 'bg-warning/20' },
    ], [stats]);

    const fetchWarnings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.disciplinary.warnings.list'), {
                params: { page: currentPage, perPage, search, warning_type: typeFilter || undefined },
            });
            if (response.status === 200) {
                const d = response.data;
                setWarnings(Array.isArray(d) ? d : (d.data || []));
                setTotal(d.total ?? 0);
                if (d.stats) setStats(d.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch warnings' });
        } finally { setLoading(false); }
    }, [currentPage, search, typeFilter]);

    useEffect(() => { fetchWarnings(); }, [fetchWarnings]);

    const openModal = (type, item = null) => {
        setSelected(item);
        setFormErrors({});
        setForm(item ? {
            employee_id: item.employee_id ? String(item.employee_id) : '',
            warning_type: item.warning_type || 'verbal',
            reason: item.reason || '',
            issued_date: item.issued_date || '',
            expiry_date: item.expiry_date || '',
            status: item.status || 'active',
        } : EMPTY_FORM);
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
                    ? await axios.post(route('hrm.disciplinary.warnings.store'), form)
                    : await axios.put(route('hrm.disciplinary.warnings.update', selected.id), form);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || (type === 'add' ? 'Warning issued' : 'Warning updated')]);
                    closeModal(type);
                    fetchWarnings();
                }
            } catch (error) {
                if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
                reject(error.response?.data?.message || 'Operation failed');
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: type === 'add' ? 'Issuing warning...' : 'Updating warning...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.disciplinary.warnings.destroy', selected.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Warning deleted']);
                    closeModal('delete');
                    fetchWarnings();
                }
            } catch (error) { reject(error.response?.data?.message || 'Delete failed'); }
        });
        showToast.promise(promise, { loading: 'Deleting...', success: (d) => d.join(', '), error: (e) => String(e) });
    };

    const columns = [
        { uid: 'employee',     name: 'EMPLOYEE' },
        { uid: 'warning_type', name: 'TYPE' },
        { uid: 'reason',       name: 'REASON' },
        { uid: 'issued_date',  name: 'ISSUED' },
        { uid: 'status',       name: 'STATUS' },
        { uid: 'actions',      name: 'ACTIONS' },
    ];

    const renderCell = (item, colKey) => {
        switch (colKey) {
            case 'employee':
                return <span className="font-medium text-sm">{item.employee?.name || item.employee_name || '—'}</span>;
            case 'warning_type':
                return <Chip color={WARNING_TYPE_COLORS[item.warning_type] || 'default'} size="sm" variant="flat" className="capitalize">{item.warning_type || '—'}</Chip>;
            case 'reason':
                return <span className="text-sm text-default-500 line-clamp-2">{item.reason || '—'}</span>;
            case 'issued_date': return item.issued_date || '—';
            case 'status':
                return <Chip color={STATUS_COLORS[item.status] || 'default'} size="sm" variant="flat" className="capitalize">{item.status || 'active'}</Chip>;
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
            <Head title={title || 'Warnings'} />

            {activeModal && (
                <Modal isOpen scrollBehavior="inside" size="lg" onOpenChange={() => closeModal(activeModal)}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>{activeModal === 'add' ? 'Issue Warning' : 'Edit Warning'}</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Select label="Employee" placeholder="Select employee" isRequired radius={themeRadius}
                                selectedKeys={form.employee_id ? [form.employee_id] : []}
                                onSelectionChange={(keys) => setForm(p => ({ ...p, employee_id: Array.from(keys)[0] || '' }))}
                                isInvalid={!!formErrors.employee_id} errorMessage={formErrors.employee_id}>
                                {employees.map(e => <SelectItem key={String(e.id)}>{e.name}</SelectItem>)}
                            </Select>
                            <Select label="Warning Type" isRequired radius={themeRadius}
                                selectedKeys={form.warning_type ? [form.warning_type] : []}
                                onSelectionChange={(keys) => setForm(p => ({ ...p, warning_type: Array.from(keys)[0] || 'verbal' }))}>
                                {WARNING_TYPES.map(t => <SelectItem key={t} className="capitalize">{t}</SelectItem>)}
                            </Select>
                            <Textarea label="Reason" placeholder="Describe the reason for this warning" isRequired radius={themeRadius}
                                value={form.reason} onValueChange={(v) => setForm(p => ({ ...p, reason: v }))}
                                isInvalid={!!formErrors.reason} errorMessage={formErrors.reason} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="date" label="Issued Date" isRequired radius={themeRadius}
                                    value={form.issued_date}
                                    onChange={(e) => setForm(p => ({ ...p, issued_date: e.target.value }))}
                                    isInvalid={!!formErrors.issued_date} errorMessage={formErrors.issued_date} />
                                <Input type="date" label="Expiry Date" radius={themeRadius}
                                    value={form.expiry_date}
                                    onChange={(e) => setForm(p => ({ ...p, expiry_date: e.target.value }))} />
                            </div>
                            {activeModal === 'edit' && (
                                <Select label="Status" radius={themeRadius}
                                    selectedKeys={form.status ? [form.status] : []}
                                    onSelectionChange={(keys) => setForm(p => ({ ...p, status: Array.from(keys)[0] || 'active' }))}>
                                    <SelectItem key="active">Active</SelectItem>
                                    <SelectItem key="expired">Expired</SelectItem>
                                    <SelectItem key="resolved">Resolved</SelectItem>
                                </Select>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(activeModal)}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={() => handleSubmit(activeModal)}>
                                {activeModal === 'add' ? 'Issue Warning' : 'Update'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && (
                <Modal isOpen size="sm" onOpenChange={() => closeModal('delete')}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Delete Warning</ModalHeader>
                        <ModalBody className="py-4">
                            <p>Delete this warning for <strong>{selected?.employee?.name || selected?.employee_name}</strong>? This cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="Employee Warnings"
                subtitle="Manage employee warnings and disciplinary actions"
                icon={<ExclamationTriangleIcon />}
                actions={canAdd && (
                    <Button color="primary" variant="shadow" size={isMobile ? 'sm' : 'md'}
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => openModal('add')}>
                        Issue Warning
                    </Button>
                )}
                stats={<StatsCards stats={statsData} />}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input label="Search" placeholder="Search by employee or reason..." variant="bordered" size="sm" radius={themeRadius}
                            value={search} onValueChange={(v) => { setSearch(v); setCurrentPage(1); }}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} />
                        <Select label="Warning Type" placeholder="All Types" variant="bordered" size="sm" radius={themeRadius}
                            selectedKeys={typeFilter ? [typeFilter] : []}
                            onSelectionChange={(keys) => { setTypeFilter(Array.from(keys)[0] || ''); setCurrentPage(1); }}>
                            {WARNING_TYPES.map(t => <SelectItem key={t} className="capitalize">{t}</SelectItem>)}
                        </Select>
                    </div>
                }
                pagination={total > perPage && (
                    <div className="flex justify-center">
                        <Pagination total={Math.ceil(total / perPage)} page={currentPage} onChange={setCurrentPage} size="sm" />
                    </div>
                )}
                ariaLabel="Employee Warnings"
            >
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                    </div>
                ) : (
                    <Table aria-label="Employee warnings" isHeaderSticky
                        classNames={{ wrapper: 'shadow-none border border-divider rounded-lg', th: 'bg-default-100 text-default-600 font-semibold', td: 'py-3' }}>
                        <TableHeader columns={columns}>
                            {(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={warnings} emptyContent="No warnings found">
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

WarningsIndex.layout = (page) => <App children={page} />;
export default WarningsIndex;
