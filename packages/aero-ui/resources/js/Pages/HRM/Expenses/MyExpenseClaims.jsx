import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Pagination, Select, SelectItem, Skeleton, Table, TableBody, TableCell,
    TableColumn, TableHeader, TableRow, Textarea,
} from '@heroui/react';
import {
    BanknotesIcon, CheckCircleIcon, ClockIcon,
    MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'danger' };
const EMPTY_FORM = { category_id: '', amount: '', date: '', description: '', receipt_url: '' };

const MyExpenseClaims = ({ title, expenseCategories = [] }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    const canSubmit = canCreate('hrm.expenses.my-claims') || isSuperAdmin();
    const canEdit   = canUpdate('hrm.expenses.my-claims') || isSuperAdmin();
    const canDel    = canDelete('hrm.expenses.my-claims') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [loading, setLoading]   = useState(false);
    const [claims, setClaims]     = useState([]);
    const [total, setTotal]       = useState(0);
    const [stats, setStats]       = useState({ total: 0, pending: 0, approved: 0, rejected: 0, total_amount: 0 });
    const [search, setSearch]     = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 20;

    const [modalStates, setModalStates] = useState({ add: false, edit: false, delete: false });
    const [selected, setSelected]       = useState(null);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [formErrors, setFormErrors]   = useState({});
    const [submitting, setSubmitting]   = useState(false);

    const statsData = useMemo(() => [
        { title: 'Total Claims',  value: stats.total,        icon: <BanknotesIcon className="w-6 h-6" />,   color: 'text-primary', iconBg: 'bg-primary/20' },
        { title: 'Pending',       value: stats.pending,      icon: <ClockIcon className="w-6 h-6" />,       color: 'text-warning', iconBg: 'bg-warning/20' },
        { title: 'Approved',      value: stats.approved,     icon: <CheckCircleIcon className="w-6 h-6" />, color: 'text-success', iconBg: 'bg-success/20' },
        { title: 'Total Amount',  value: `$${Number(stats.total_amount || 0).toFixed(2)}`, icon: <BanknotesIcon className="w-6 h-6" />, color: 'text-secondary', iconBg: 'bg-secondary/20' },
    ], [stats]);

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.expenses.my-claims.list'), {
                params: { page: currentPage, perPage, search },
            });
            if (response.status === 200) {
                const d = response.data;
                setClaims(Array.isArray(d) ? d : (d.data || []));
                setTotal(d.total ?? 0);
                if (d.stats) setStats(d.stats);
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch claims' });
        } finally { setLoading(false); }
    }, [currentPage, search]);

    useEffect(() => { fetchClaims(); }, [fetchClaims]);

    const openModal = (type, item = null) => {
        setSelected(item);
        setFormErrors({});
        setForm(item ? {
            category_id: item.category_id ? String(item.category_id) : '',
            amount: item.amount ? String(item.amount) : '',
            date: item.date || '',
            description: item.description || '',
            receipt_url: item.receipt_url || '',
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
                    ? await axios.post(route('hrm.expenses.my-claims.store'), form)
                    : await axios.put(route('hrm.expenses.my-claims.update', selected.id), form);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || (type === 'add' ? 'Claim submitted' : 'Claim updated')]);
                    closeModal(type);
                    fetchClaims();
                }
            } catch (error) {
                if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
                reject(error.response?.data?.message || 'Operation failed');
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: type === 'add' ? 'Submitting claim...' : 'Updating claim...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.expenses.my-claims.destroy', selected.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Claim deleted']);
                    closeModal('delete');
                    fetchClaims();
                }
            } catch (error) { reject(error.response?.data?.message || 'Delete failed'); }
        });
        showToast.promise(promise, { loading: 'Deleting...', success: (d) => d.join(', '), error: (e) => String(e) });
    };

    const columns = [
        { uid: 'category',    name: 'CATEGORY' },
        { uid: 'amount',      name: 'AMOUNT' },
        { uid: 'date',        name: 'DATE' },
        { uid: 'description', name: 'DESCRIPTION' },
        { uid: 'status',      name: 'STATUS' },
        { uid: 'actions',     name: 'ACTIONS' },
    ];

    const renderCell = (item, colKey) => {
        switch (colKey) {
            case 'category':
                return <span className="font-medium text-sm">{item.category?.name || item.category_name || '—'}</span>;
            case 'amount':
                return <span className="font-semibold">${Number(item.amount || 0).toFixed(2)}</span>;
            case 'date': return item.date || '—';
            case 'description':
                return <span className="text-sm text-default-500 line-clamp-2">{item.description || '—'}</span>;
            case 'status':
                return <Chip color={STATUS_COLORS[item.status] || 'default'} size="sm" variant="flat" className="capitalize">{item.status || 'pending'}</Chip>;
            case 'actions': {
                const isPending = !item.status || item.status === 'pending';
                return (
                    <div className="flex gap-1">
                        {canEdit && isPending && <Button isIconOnly size="sm" variant="light" onPress={() => openModal('edit', item)}><PencilIcon className="w-4 h-4" /></Button>}
                        {canDel  && isPending && <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => openModal('delete', item)}><TrashIcon className="w-4 h-4" /></Button>}
                    </div>
                );
            }
            default: return item[colKey] ?? '—';
        }
    };

    const activeModal = modalStates.add ? 'add' : modalStates.edit ? 'edit' : null;

    return (
        <>
            <Head title={title || 'My Expense Claims'} />

            {activeModal && (
                <Modal isOpen scrollBehavior="inside" size="lg" onOpenChange={() => closeModal(activeModal)}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>{activeModal === 'add' ? 'Submit Expense Claim' : 'Edit Claim'}</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Select label="Category" placeholder="Select category" isRequired radius={themeRadius}
                                selectedKeys={form.category_id ? [form.category_id] : []}
                                onSelectionChange={(keys) => setForm(p => ({ ...p, category_id: Array.from(keys)[0] || '' }))}
                                isInvalid={!!formErrors.category_id} errorMessage={formErrors.category_id}>
                                {expenseCategories.map(c => <SelectItem key={String(c.id)}>{c.name}</SelectItem>)}
                            </Select>
                            <Input type="number" label="Amount" placeholder="0.00" isRequired radius={themeRadius}
                                value={form.amount} onValueChange={(v) => setForm(p => ({ ...p, amount: v }))}
                                isInvalid={!!formErrors.amount} errorMessage={formErrors.amount}
                                startContent={<span className="text-default-400 text-sm">$</span>} />
                            <Input type="date" label="Date" isRequired radius={themeRadius}
                                value={form.date}
                                onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
                                isInvalid={!!formErrors.date} errorMessage={formErrors.date} />
                            <Textarea label="Description" placeholder="Describe the expense" radius={themeRadius}
                                value={form.description} onValueChange={(v) => setForm(p => ({ ...p, description: v }))}
                                isInvalid={!!formErrors.description} errorMessage={formErrors.description} />
                            <Input label="Receipt URL" placeholder="https://..." radius={themeRadius}
                                value={form.receipt_url} onValueChange={(v) => setForm(p => ({ ...p, receipt_url: v }))} />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(activeModal)}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={() => handleSubmit(activeModal)}>
                                {activeModal === 'add' ? 'Submit Claim' : 'Update'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && (
                <Modal isOpen size="sm" onOpenChange={() => closeModal('delete')}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Delete Claim</ModalHeader>
                        <ModalBody className="py-4">
                            <p>Delete this expense claim? This cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="My Expense Claims"
                subtitle="Submit and track your expense reimbursements"
                icon={<BanknotesIcon />}
                actions={canSubmit && (
                    <Button color="primary" variant="shadow" size={isMobile ? 'sm' : 'md'}
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => openModal('add')}>
                        Submit Claim
                    </Button>
                )}
                stats={<StatsCards stats={statsData} />}
                filters={
                    <Input label="Search" placeholder="Search claims..." variant="bordered" size="sm" radius={themeRadius}
                        value={search} onValueChange={(v) => { setSearch(v); setCurrentPage(1); }}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />} />
                }
                pagination={total > perPage && (
                    <div className="flex justify-center">
                        <Pagination total={Math.ceil(total / perPage)} page={currentPage} onChange={setCurrentPage} size="sm" />
                    </div>
                )}
                ariaLabel="My Expense Claims"
            >
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                    </div>
                ) : (
                    <Table aria-label="My expense claims" isHeaderSticky
                        classNames={{ wrapper: 'shadow-none border border-divider rounded-lg', th: 'bg-default-100 text-default-600 font-semibold', td: 'py-3' }}>
                        <TableHeader columns={columns}>
                            {(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={claims} emptyContent="No expense claims found">
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

MyExpenseClaims.layout = (page) => <App children={page} />;
export default MyExpenseClaims;
