import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Pagination, Select, SelectItem, Skeleton, Table, TableBody, TableCell,
    TableColumn, TableHeader, TableRow,
} from '@heroui/react';
import {
    ArrowUturnLeftIcon, CheckCircleIcon, ClockIcon, ComputerDesktopIcon,
    MagnifyingGlassIcon, PlusIcon, TrashIcon, UserIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const STATUS_COLORS = { active: 'warning', returned: 'success', overdue: 'danger', pending: 'default' };
const EMPTY_ALLOC_FORM = { asset_id: '', employee_id: '', allocation_date: '', return_date: '', condition: '', notes: '' };
const EMPTY_RETURN_FORM = { return_date: new Date().toISOString().split('T')[0], condition: '', notes: '' };

const AssetAllocationsIndex = ({ title, assets = [], employees = [] }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    const canAllocate = canCreate('hrm.assets.allocations') || isSuperAdmin();
    const canReturn   = canUpdate('hrm.assets.allocations') || isSuperAdmin();
    const canDel      = canDelete('hrm.assets.allocations') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [loading, setLoading]           = useState(false);
    const [allocations, setAllocations]   = useState([]);
    const [total, setTotal]               = useState(0);
    const [stats, setStats]               = useState({ total: 0, active: 0, returned: 0, overdue: 0 });
    const [search, setSearch]             = useState('');
    const [currentPage, setCurrentPage]   = useState(1);
    const perPage = 20;

    const [modalStates, setModalStates]   = useState({ allocate: false, return: false, delete: false });
    const [selected, setSelected]         = useState(null);
    const [allocForm, setAllocForm]       = useState(EMPTY_ALLOC_FORM);
    const [returnForm, setReturnForm]     = useState(EMPTY_RETURN_FORM);
    const [formErrors, setFormErrors]     = useState({});
    const [submitting, setSubmitting]     = useState(false);

    const statsData = useMemo(() => [
        { title: 'Total Allocations', value: stats.total,    icon: <ComputerDesktopIcon className="w-6 h-6" />, color: 'text-primary', iconBg: 'bg-primary/20' },
        { title: 'Active',            value: stats.active,   icon: <UserIcon className="w-6 h-6" />,           color: 'text-warning', iconBg: 'bg-warning/20' },
        { title: 'Returned',          value: stats.returned, icon: <CheckCircleIcon className="w-6 h-6" />,    color: 'text-success', iconBg: 'bg-success/20' },
        { title: 'Overdue',           value: stats.overdue,  icon: <ClockIcon className="w-6 h-6" />,          color: 'text-danger',  iconBg: 'bg-danger/20'  },
    ], [stats]);

    const fetchAllocations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.assets.allocations.list'), {
                params: { page: currentPage, perPage, search },
            });
            if (response.status === 200) {
                const d = response.data;
                setAllocations(Array.isArray(d) ? d : (d.data || []));
                setTotal(d.total ?? 0);
                if (d.stats) setStats(d.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch allocations' });
        } finally { setLoading(false); }
    }, [currentPage, search]);

    useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

    const openModal = (type, item = null) => {
        setSelected(item);
        setFormErrors({});
        if (type === 'return') setReturnForm(EMPTY_RETURN_FORM);
        if (type === 'allocate') setAllocForm(EMPTY_ALLOC_FORM);
        setModalStates(prev => ({ ...prev, [type]: true }));
    };
    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelected(null);
        setFormErrors({});
    };

    const handleAllocate = () => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.assets.allocations.store'), allocForm);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Asset allocated successfully']);
                    closeModal('allocate');
                    fetchAllocations();
                }
            } catch (error) {
                if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
                reject(error.response?.data?.message || 'Allocation failed');
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, { loading: 'Allocating asset...', success: (d) => d.join(', '), error: (e) => String(e) });
    };

    const handleReturn = () => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('hrm.assets.allocations.update', selected.id), { ...returnForm, status: 'returned' });
                if (response.status === 200) {
                    resolve([response.data.message || 'Asset returned successfully']);
                    closeModal('return');
                    fetchAllocations();
                }
            } catch (error) {
                if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
                reject(error.response?.data?.message || 'Return failed');
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, { loading: 'Processing return...', success: (d) => d.join(', '), error: (e) => String(e) });
    };

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.assets.allocations.destroy', selected.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Allocation deleted']);
                    closeModal('delete');
                    fetchAllocations();
                }
            } catch (error) { reject(error.response?.data?.message || 'Delete failed'); }
        });
        showToast.promise(promise, { loading: 'Deleting...', success: (d) => d.join(', '), error: (e) => String(e) });
    };

    const columns = [
        { uid: 'asset',           name: 'ASSET' },
        { uid: 'employee',        name: 'EMPLOYEE' },
        { uid: 'allocation_date', name: 'ALLOCATED' },
        { uid: 'return_date',     name: 'RETURN DATE' },
        { uid: 'status',          name: 'STATUS' },
        { uid: 'actions',         name: 'ACTIONS' },
    ];

    const renderCell = (item, colKey) => {
        switch (colKey) {
            case 'asset':    return <span className="font-medium text-sm">{item.asset?.name || item.asset_name || '—'}</span>;
            case 'employee': return <span className="text-sm">{item.employee?.name || item.employee_name || '—'}</span>;
            case 'allocation_date': return item.allocation_date || '—';
            case 'return_date':     return item.return_date || '—';
            case 'status':
                return <Chip color={STATUS_COLORS[item.status] || 'default'} size="sm" variant="flat" className="capitalize">{item.status || 'active'}</Chip>;
            case 'actions':
                return (
                    <div className="flex gap-1">
                        {canReturn && item.status !== 'returned' && (
                            <Button isIconOnly size="sm" variant="light" color="success" onPress={() => openModal('return', item)}>
                                <ArrowUturnLeftIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDel && (
                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => openModal('delete', item)}>
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default: return item[colKey] ?? '—';
        }
    };

    return (
        <>
            <Head title={title || 'Asset Allocations'} />

            {/* Allocate Modal */}
            {modalStates.allocate && (
                <Modal isOpen scrollBehavior="inside" size="lg" onOpenChange={() => closeModal('allocate')}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Allocate Asset</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Select label="Asset" placeholder="Select asset" isRequired radius={themeRadius}
                                selectedKeys={allocForm.asset_id ? [String(allocForm.asset_id)] : []}
                                onSelectionChange={(keys) => setAllocForm(p => ({ ...p, asset_id: Array.from(keys)[0] || '' }))}
                                isInvalid={!!formErrors.asset_id} errorMessage={formErrors.asset_id}>
                                {assets.map(a => <SelectItem key={String(a.id)}>{a.name}</SelectItem>)}
                            </Select>
                            <Select label="Employee" placeholder="Select employee" isRequired radius={themeRadius}
                                selectedKeys={allocForm.employee_id ? [String(allocForm.employee_id)] : []}
                                onSelectionChange={(keys) => setAllocForm(p => ({ ...p, employee_id: Array.from(keys)[0] || '' }))}
                                isInvalid={!!formErrors.employee_id} errorMessage={formErrors.employee_id}>
                                {employees.map(e => <SelectItem key={String(e.id)}>{e.name}</SelectItem>)}
                            </Select>
                            <Input type="date" label="Allocation Date" isRequired radius={themeRadius}
                                value={allocForm.allocation_date}
                                onChange={(e) => setAllocForm(p => ({ ...p, allocation_date: e.target.value }))}
                                isInvalid={!!formErrors.allocation_date} errorMessage={formErrors.allocation_date} />
                            <Input type="date" label="Expected Return Date" radius={themeRadius}
                                value={allocForm.return_date}
                                onChange={(e) => setAllocForm(p => ({ ...p, return_date: e.target.value }))} />
                            <Input label="Condition" placeholder="e.g. Good, Fair" radius={themeRadius}
                                value={allocForm.condition}
                                onValueChange={(v) => setAllocForm(p => ({ ...p, condition: v }))} />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('allocate')}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={handleAllocate}>Allocate</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Return Modal */}
            {modalStates.return && (
                <Modal isOpen size="md" onOpenChange={() => closeModal('return')}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Return Asset — {selected?.asset?.name || selected?.asset_name}</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Input type="date" label="Return Date" isRequired radius={themeRadius}
                                value={returnForm.return_date}
                                onChange={(e) => setReturnForm(p => ({ ...p, return_date: e.target.value }))} />
                            <Input label="Condition on Return" placeholder="e.g. Good, Damaged" radius={themeRadius}
                                value={returnForm.condition}
                                onValueChange={(v) => setReturnForm(p => ({ ...p, condition: v }))} />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('return')}>Cancel</Button>
                            <Button color="success" isLoading={submitting} onPress={handleReturn}>Confirm Return</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Delete Modal */}
            {modalStates.delete && (
                <Modal isOpen size="sm" onOpenChange={() => closeModal('delete')}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Delete Allocation</ModalHeader>
                        <ModalBody className="py-4">
                            <p>Delete the allocation for <strong>{selected?.employee?.name || selected?.employee_name}</strong>? This cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="Asset Allocations"
                subtitle="Track asset assignments to employees"
                icon={<ComputerDesktopIcon />}
                actions={canAllocate && (
                    <Button color="primary" variant="shadow" size={isMobile ? 'sm' : 'md'}
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => openModal('allocate')}>
                        Allocate Asset
                    </Button>
                )}
                stats={<StatsCards stats={statsData} />}
                filters={
                    <Input label="Search" placeholder="Search by employee or asset..." variant="bordered" size="sm" radius={themeRadius}
                        value={search} onValueChange={(v) => { setSearch(v); setCurrentPage(1); }}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} />
                }
                pagination={total > perPage && (
                    <div className="flex justify-center">
                        <Pagination total={Math.ceil(total / perPage)} page={currentPage} onChange={setCurrentPage} size="sm" />
                    </div>
                )}
                ariaLabel="Asset Allocations"
            >
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                    </div>
                ) : (
                    <Table aria-label="Asset allocations" isHeaderSticky
                        classNames={{ wrapper: 'shadow-none border border-divider rounded-lg', th: 'bg-default-100 text-default-600 font-semibold', td: 'py-3' }}>
                        <TableHeader columns={columns}>
                            {(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={allocations} emptyContent="No allocations found">
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

AssetAllocationsIndex.layout = (page) => <App children={page} />;
export default AssetAllocationsIndex;
