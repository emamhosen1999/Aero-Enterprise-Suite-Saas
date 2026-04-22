import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button,
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
    Pagination,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
    Tooltip,
} from '@heroui/react';
import {
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    FlagIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { showToast } from '@/utils/toastUtils.jsx';
import axios from 'axios';

// ─── Status Maps ──────────────────────────────────────────────────────────────

const statusColorMap = {
    draft: 'default',
    active: 'primary',
    completed: 'success',
    extended: 'warning',
    terminated: 'danger',
};

const goalStatusColorMap = {
    pending: 'default',
    in_progress: 'primary',
    achieved: 'success',
    missed: 'danger',
};

const statusOptions = [
    { key: 'draft', label: 'Draft' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'extended', label: 'Extended' },
    { key: 'terminated', label: 'Terminated' },
];

const goalStatusOptions = [
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'achieved', label: 'Achieved' },
    { key: 'missed', label: 'Missed' },
];

const TABLE_COLUMNS = [
    { uid: 'employee', name: 'Employee' },
    { uid: 'title', name: 'Title' },
    { uid: 'manager', name: 'Manager' },
    { uid: 'period', name: 'Period' },
    { uid: 'status', name: 'Status' },
    { uid: 'goals', name: 'Goals' },
    { uid: 'actions', name: 'Actions' },
];

// ─── Empty Goal Template ──────────────────────────────────────────────────────

const emptyGoal = () => ({ title: '', description: '', target_date: '' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const goalsProgress = (goals = []) => {
    const achieved = goals.filter((g) => g.status === 'achieved').length;
    return { achieved, total: goals.length };
};

// ─── Modal: Create / Edit PIP ─────────────────────────────────────────────────

const PipFormModal = ({ isOpen, onClose, pipPlan, employees, themeRadius, onSuccess }) => {
    const isEdit = !!pipPlan;

    const [form, setForm] = useState({
        employee_id: '',
        title: '',
        reason: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        description: '',
        expected_outcomes: '',
        notes: '',
    });
    const [goals, setGoals] = useState([emptyGoal()]);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (pipPlan) {
            setForm({
                employee_id: String(pipPlan.employee_id ?? ''),
                title: pipPlan.title ?? '',
                reason: pipPlan.reason ?? '',
                start_date: pipPlan.start_date ?? '',
                end_date: pipPlan.end_date ?? '',
                status: pipPlan.status ?? 'draft',
                description: pipPlan.description ?? '',
                expected_outcomes: pipPlan.expected_outcomes ?? '',
                notes: pipPlan.notes ?? '',
            });
            setGoals(pipPlan.goals?.length ? pipPlan.goals : [emptyGoal()]);
        } else {
            setForm({
                employee_id: '',
                title: '',
                reason: '',
                start_date: '',
                end_date: '',
                status: 'draft',
                description: '',
                expected_outcomes: '',
                notes: '',
            });
            setGoals([emptyGoal()]);
        }
        setErrors({});
    }, [pipPlan, isOpen]);

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target?.value ?? e }));
    const setSelect = (field) => (keys) => setForm((p) => ({ ...p, [field]: Array.from(keys)[0] ?? '' }));

    const addGoal = () => setGoals((p) => [...p, emptyGoal()]);
    const removeGoal = (i) => setGoals((p) => p.filter((_, idx) => idx !== i));
    const setGoalField = (i, field, value) =>
        setGoals((p) => p.map((g, idx) => (idx === i ? { ...g, [field]: value } : g)));

    const handleSubmit = () => {
        const payload = { ...form };
        if (!isEdit) {
            payload.goals = goals.filter((g) => g.title.trim());
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = isEdit
                    ? await axios.put(route('hrm.performance.pip.update', pipPlan.id), payload)
                    : await axios.post(route('hrm.performance.pip.store'), payload);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || (isEdit ? 'PIP updated.' : 'PIP created.')]);
                    onSuccess?.(response.data);
                    onClose();
                } else {
                    reject(['Unexpected response.']);
                }
            } catch (error) {
                const errs = error.response?.data?.errors;
                if (errs) setErrors(errs);
                reject(Object.values(errs || {}).flat() || ['An error occurred.']);
            } finally {
                setProcessing(false);
            }
        });

        setProcessing(true);
        showToast.promise(promise, {
            loading: isEdit ? 'Updating PIP...' : 'Creating PIP...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : String(data)),
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="3xl"
            scrollBehavior="inside"
            classNames={{
                base: 'bg-content1',
                header: 'border-b border-divider',
                body: 'py-6',
                footer: 'border-t border-divider',
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">
                        {isEdit ? 'Edit Performance Improvement Plan' : 'New Performance Improvement Plan'}
                    </h2>
                </ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Employee */}
                        <Select
                            label="Employee"
                            placeholder="Select employee"
                            isRequired
                            isDisabled={isEdit}
                            selectedKeys={form.employee_id ? new Set([form.employee_id]) : new Set()}
                            onSelectionChange={setSelect('employee_id')}
                            isInvalid={!!errors.employee_id}
                            errorMessage={errors.employee_id?.[0]}
                            radius={themeRadius}
                            variant="bordered"
                        >
                            {employees.map((emp) => (
                                <SelectItem key={String(emp.id)}>
                                    {emp.name} ({emp.employee_code})
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Title */}
                        <div className="md:col-span-2">
                            <Input
                                label="Title"
                                placeholder="PIP title"
                                isRequired
                                value={form.title}
                                onChange={set('title')}
                                isInvalid={!!errors.title}
                                errorMessage={errors.title?.[0]}
                                radius={themeRadius}
                                variant="bordered"
                            />
                        </div>

                        {/* Reason */}
                        <div className="md:col-span-2">
                            <Textarea
                                label="Reason"
                                placeholder="Reason for the PIP"
                                isRequired
                                value={form.reason}
                                onChange={set('reason')}
                                isInvalid={!!errors.reason}
                                errorMessage={errors.reason?.[0]}
                                radius={themeRadius}
                                variant="bordered"
                                minRows={3}
                            />
                        </div>

                        {/* Dates */}
                        <Input
                            type="date"
                            label="Start Date"
                            isRequired
                            value={form.start_date}
                            onChange={set('start_date')}
                            isInvalid={!!errors.start_date}
                            errorMessage={errors.start_date?.[0]}
                            radius={themeRadius}
                            variant="bordered"
                        />
                        <Input
                            type="date"
                            label="End Date"
                            isRequired
                            value={form.end_date}
                            onChange={set('end_date')}
                            isInvalid={!!errors.end_date}
                            errorMessage={errors.end_date?.[0]}
                            radius={themeRadius}
                            variant="bordered"
                        />

                        {/* Status */}
                        <Select
                            label="Status"
                            placeholder="Select status"
                            selectedKeys={form.status ? new Set([form.status]) : new Set()}
                            onSelectionChange={setSelect('status')}
                            isInvalid={!!errors.status}
                            errorMessage={errors.status?.[0]}
                            radius={themeRadius}
                            variant="bordered"
                        >
                            {(isEdit ? statusOptions : statusOptions.filter((s) => ['draft', 'active'].includes(s.key))).map(
                                (s) => (
                                    <SelectItem key={s.key}>{s.label}</SelectItem>
                                )
                            )}
                        </Select>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <Textarea
                                label="Description"
                                placeholder="Detailed description (optional)"
                                value={form.description}
                                onChange={set('description')}
                                isInvalid={!!errors.description}
                                errorMessage={errors.description?.[0]}
                                radius={themeRadius}
                                variant="bordered"
                                minRows={2}
                            />
                        </div>

                        {/* Expected Outcomes */}
                        <div className="md:col-span-2">
                            <Textarea
                                label="Expected Outcomes"
                                placeholder="Expected outcomes (optional)"
                                value={form.expected_outcomes}
                                onChange={set('expected_outcomes')}
                                radius={themeRadius}
                                variant="bordered"
                                minRows={2}
                            />
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <Textarea
                                label="Notes"
                                placeholder="Additional notes (optional)"
                                value={form.notes}
                                onChange={set('notes')}
                                radius={themeRadius}
                                variant="bordered"
                                minRows={2}
                            />
                        </div>
                    </div>

                    {/* Goals — create mode only */}
                    {!isEdit && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-sm">Goals</h3>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    startContent={<PlusIcon className="w-4 h-4" />}
                                    onPress={addGoal}
                                >
                                    Add Goal
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {goals.map((goal, i) => (
                                    <div
                                        key={i}
                                        className="border border-divider rounded-lg p-4 space-y-3"
                                        style={{ borderRadius: `var(--borderRadius, 12px)` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-default-500 font-medium">
                                                Goal {i + 1}
                                            </span>
                                            {goals.length > 1 && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onPress={() => removeGoal(i)}
                                                >
                                                    <XCircleIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <Input
                                            label="Goal Title"
                                            placeholder="Goal title"
                                            isRequired
                                            value={goal.title}
                                            onChange={(e) => setGoalField(i, 'title', e.target.value)}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                        />
                                        <Textarea
                                            label="Description"
                                            placeholder="Goal description (optional)"
                                            value={goal.description}
                                            onChange={(e) => setGoalField(i, 'description', e.target.value)}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                            minRows={2}
                                        />
                                        <Input
                                            type="date"
                                            label="Target Date"
                                            isRequired
                                            value={goal.target_date}
                                            onChange={(e) => setGoalField(i, 'target_date', e.target.value)}
                                            radius={themeRadius}
                                            variant="bordered"
                                            size="sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose} isDisabled={processing}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={processing}>
                        {isEdit ? 'Update PIP' : 'Create PIP'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// ─── Modal: Update Status ─────────────────────────────────────────────────────

const UpdateStatusModal = ({ isOpen, onClose, pipPlan, themeRadius, onSuccess }) => {
    const [status, setStatus] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setStatus(pipPlan?.status ?? '');
        setNotes('');
    }, [pipPlan, isOpen]);

    const handleSubmit = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.patch(
                    route('hrm.performance.pip.update-status', pipPlan.id),
                    { status, notes }
                );
                if (response.status === 200) {
                    resolve([response.data.message || 'Status updated.']);
                    onSuccess?.(response.data);
                    onClose();
                } else {
                    reject(['Unexpected response.']);
                }
            } catch (error) {
                reject(error.response?.data?.errors ? Object.values(error.response.data.errors).flat() : ['An error occurred.']);
            } finally {
                setProcessing(false);
            }
        });

        setProcessing(true);
        showToast.promise(promise, {
            loading: 'Updating status...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : String(data)),
        });
    };

    const changeableStatuses = statusOptions.filter((s) => s.key !== 'draft');

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="md"
            classNames={{
                base: 'bg-content1',
                header: 'border-b border-divider',
                body: 'py-6',
                footer: 'border-t border-divider',
            }}
        >
            <ModalContent>
                <ModalHeader>
                    <h2 className="text-lg font-semibold">Update PIP Status</h2>
                </ModalHeader>
                <ModalBody>
                    {pipPlan && (
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-content2">
                            <span className="text-sm text-default-500">Current status:</span>
                            <Chip size="sm" color={statusColorMap[pipPlan.status] ?? 'default'} variant="flat">
                                {pipPlan.status}
                            </Chip>
                        </div>
                    )}
                    <div className="space-y-4">
                        <Select
                            label="New Status"
                            placeholder="Select new status"
                            isRequired
                            selectedKeys={status ? new Set([status]) : new Set()}
                            onSelectionChange={(keys) => setStatus(Array.from(keys)[0] ?? '')}
                            radius={themeRadius}
                            variant="bordered"
                        >
                            {changeableStatuses.map((s) => (
                                <SelectItem key={s.key}>{s.label}</SelectItem>
                            ))}
                        </Select>
                        <Textarea
                            label="Notes"
                            placeholder="Optional notes about this status change"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            radius={themeRadius}
                            variant="bordered"
                            minRows={3}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose} isDisabled={processing}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={processing} isDisabled={!status}>
                        Update Status
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// ─── Modal: Add Goal ──────────────────────────────────────────────────────────

const AddGoalModal = ({ isOpen, onClose, pipPlan, themeRadius, onSuccess }) => {
    const [form, setForm] = useState({ title: '', description: '', target_date: '' });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setForm({ title: '', description: '', target_date: '' });
        setErrors({});
    }, [isOpen]);

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

    const handleSubmit = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('hrm.performance.pip.goals.store', pipPlan.id),
                    form
                );
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Goal added.']);
                    onSuccess?.(response.data);
                    onClose();
                } else {
                    reject(['Unexpected response.']);
                }
            } catch (error) {
                const errs = error.response?.data?.errors;
                if (errs) setErrors(errs);
                reject(Object.values(errs || {}).flat() || ['An error occurred.']);
            } finally {
                setProcessing(false);
            }
        });

        setProcessing(true);
        showToast.promise(promise, {
            loading: 'Adding goal...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : String(data)),
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="lg"
            classNames={{
                base: 'bg-content1',
                header: 'border-b border-divider',
                body: 'py-6',
                footer: 'border-t border-divider',
            }}
        >
            <ModalContent>
                <ModalHeader>
                    <h2 className="text-lg font-semibold">Add Goal</h2>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <Input
                            label="Goal Title"
                            placeholder="Enter goal title"
                            isRequired
                            value={form.title}
                            onChange={set('title')}
                            isInvalid={!!errors.title}
                            errorMessage={errors.title?.[0]}
                            radius={themeRadius}
                            variant="bordered"
                        />
                        <Textarea
                            label="Description"
                            placeholder="Goal description (optional)"
                            value={form.description}
                            onChange={set('description')}
                            isInvalid={!!errors.description}
                            errorMessage={errors.description?.[0]}
                            radius={themeRadius}
                            variant="bordered"
                            minRows={3}
                        />
                        <Input
                            type="date"
                            label="Target Date"
                            isRequired
                            value={form.target_date}
                            onChange={set('target_date')}
                            isInvalid={!!errors.target_date}
                            errorMessage={errors.target_date?.[0]}
                            radius={themeRadius}
                            variant="bordered"
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose} isDisabled={processing}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={processing}>
                        Add Goal
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// ─── Modal: Update Goal ───────────────────────────────────────────────────────

const UpdateGoalModal = ({ isOpen, onClose, pipPlan, goal, themeRadius, onSuccess }) => {
    const [status, setStatus] = useState('');
    const [progressNotes, setProgressNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setStatus(goal?.status ?? 'pending');
        setProgressNotes(goal?.progress_notes ?? '');
    }, [goal, isOpen]);

    const handleSubmit = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(
                    route('hrm.performance.pip.goals.update', { pipPlan: pipPlan.id, goal: goal.id }),
                    { status, progress_notes: progressNotes }
                );
                if (response.status === 200) {
                    resolve([response.data.message || 'Goal updated.']);
                    onSuccess?.(response.data);
                    onClose();
                } else {
                    reject(['Unexpected response.']);
                }
            } catch (error) {
                reject(error.response?.data?.errors ? Object.values(error.response.data.errors).flat() : ['An error occurred.']);
            } finally {
                setProcessing(false);
            }
        });

        setProcessing(true);
        showToast.promise(promise, {
            loading: 'Updating goal...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : String(data)),
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="md"
            classNames={{
                base: 'bg-content1',
                header: 'border-b border-divider',
                body: 'py-6',
                footer: 'border-t border-divider',
            }}
        >
            <ModalContent>
                <ModalHeader>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">Update Goal Progress</h2>
                        {goal && <p className="text-sm text-default-500 font-normal">{goal.title}</p>}
                    </div>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <Select
                            label="Goal Status"
                            placeholder="Select status"
                            isRequired
                            selectedKeys={status ? new Set([status]) : new Set()}
                            onSelectionChange={(keys) => setStatus(Array.from(keys)[0] ?? '')}
                            radius={themeRadius}
                            variant="bordered"
                        >
                            {goalStatusOptions.map((s) => (
                                <SelectItem key={s.key}>{s.label}</SelectItem>
                            ))}
                        </Select>
                        <Textarea
                            label="Progress Notes"
                            placeholder="Notes on progress (optional)"
                            value={progressNotes}
                            onChange={(e) => setProgressNotes(e.target.value)}
                            radius={themeRadius}
                            variant="bordered"
                            minRows={3}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose} isDisabled={processing}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={processing}>
                        Update Goal
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// ─── Modal: View Details ──────────────────────────────────────────────────────

const ViewDetailsModal = ({ isOpen, onClose, pipPlan, themeRadius, onUpdateGoal, canUpdate }) => {
    if (!pipPlan) return null;

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="3xl"
            scrollBehavior="inside"
            classNames={{
                base: 'bg-content1',
                header: 'border-b border-divider',
                body: 'py-6',
                footer: 'border-t border-divider',
            }}
        >
            <ModalContent>
                <ModalHeader>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">{pipPlan.title}</h2>
                        <div className="flex items-center gap-2">
                            <Chip
                                size="sm"
                                color={statusColorMap[pipPlan.status] ?? 'default'}
                                variant="flat"
                            >
                                {pipPlan.status}
                            </Chip>
                            <span className="text-sm text-default-500">
                                {pipPlan.employee?.user?.name} ({pipPlan.employee?.employee_code})
                            </span>
                        </div>
                    </div>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-6">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-content2">
                            <div>
                                <p className="text-xs text-default-500 mb-1">Manager</p>
                                <p className="text-sm font-medium">{pipPlan.manager?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-default-500 mb-1">Period</p>
                                <p className="text-sm font-medium">
                                    {formatDate(pipPlan.start_date)} → {formatDate(pipPlan.end_date)}
                                </p>
                            </div>
                            {pipPlan.reason && (
                                <div className="col-span-2">
                                    <p className="text-xs text-default-500 mb-1">Reason</p>
                                    <p className="text-sm">{pipPlan.reason}</p>
                                </div>
                            )}
                            {pipPlan.description && (
                                <div className="col-span-2">
                                    <p className="text-xs text-default-500 mb-1">Description</p>
                                    <p className="text-sm">{pipPlan.description}</p>
                                </div>
                            )}
                            {pipPlan.expected_outcomes && (
                                <div className="col-span-2">
                                    <p className="text-xs text-default-500 mb-1">Expected Outcomes</p>
                                    <p className="text-sm">{pipPlan.expected_outcomes}</p>
                                </div>
                            )}
                            {pipPlan.notes && (
                                <div className="col-span-2">
                                    <p className="text-xs text-default-500 mb-1">Notes</p>
                                    <p className="text-sm">{pipPlan.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Goals */}
                        <div>
                            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <FlagIcon className="w-4 h-4 text-primary" />
                                Goals ({pipPlan.goals?.length ?? 0})
                            </h3>
                            {pipPlan.goals?.length > 0 ? (
                                <Table
                                    aria-label="PIP Goals"
                                    classNames={{
                                        wrapper: 'shadow-none border border-divider rounded-lg',
                                        th: 'bg-content2 text-default-600 font-semibold',
                                        td: 'py-2',
                                    }}
                                >
                                    <TableHeader>
                                        <TableColumn>Goal</TableColumn>
                                        <TableColumn>Target Date</TableColumn>
                                        <TableColumn>Status</TableColumn>
                                        {canUpdate && <TableColumn>Actions</TableColumn>}
                                    </TableHeader>
                                    <TableBody>
                                        {pipPlan.goals.map((goal) => (
                                            <TableRow key={goal.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{goal.title}</p>
                                                        {goal.description && (
                                                            <p className="text-xs text-default-500">
                                                                {goal.description}
                                                            </p>
                                                        )}
                                                        {goal.progress_notes && (
                                                            <p className="text-xs text-default-400 italic mt-1">
                                                                {goal.progress_notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {formatDate(goal.target_date)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="sm"
                                                        color={goalStatusColorMap[goal.status] ?? 'default'}
                                                        variant="flat"
                                                    >
                                                        {goal.status?.replace('_', ' ')}
                                                    </Chip>
                                                </TableCell>
                                                {canUpdate && (
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            color="primary"
                                                            onPress={() => onUpdateGoal?.(goal)}
                                                        >
                                                            Update
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-default-400 text-center py-4">
                                    No goals defined yet.
                                </p>
                            )}
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ImprovementPlan = ({ title, pips, stats, employees, filters: initialFilters }) => {
    const themeRadius = useThemeRadius();
    const isMobile = useMediaQuery('(max-width: 640px)');
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();

    // HRMAC guards
    const canAdd = canCreate('hrm.performance.improvement_plans') || isSuperAdmin();
    const canEdit = canUpdate('hrm.performance.improvement_plans') || isSuperAdmin();
    const canRemove = canDelete('hrm.performance.improvement_plans') || isSuperAdmin();

    // ── Filter state (mirrors Inertia URL state) ──────────────────────────────
    const [filters, setFilters] = useState({
        search: initialFilters?.search ?? '',
        status: initialFilters?.status ?? '',
        employee_id: initialFilters?.employee_id ?? '',
        per_page: initialFilters?.per_page ?? 15,
    });

    // ── Modal state ───────────────────────────────────────────────────────────
    const [modalStates, setModalStates] = useState({
        form: false,
        status: false,
        add_goal: false,
        update_goal: false,
        view: false,
        delete_confirm: false,
    });
    const [activePip, setActivePip] = useState(null);
    const [activeGoal, setActiveGoal] = useState(null);

    const openModal = useCallback((type, pip = null, goal = null) => {
        setActivePip(pip);
        setActiveGoal(goal);
        setModalStates((p) => ({ ...p, [type]: true }));
    }, []);

    const closeModal = useCallback((type) => {
        setModalStates((p) => ({ ...p, [type]: false }));
        if (!Object.values({ ...modalStates, [type]: false }).some(Boolean)) {
            setActivePip(null);
            setActiveGoal(null);
        }
    }, [modalStates]);

    // ── Filter navigation ─────────────────────────────────────────────────────
    const applyFilters = useCallback(
        (newFilters) => {
            const merged = { ...filters, ...newFilters };
            setFilters(merged);
            router.get(route('hrm.performance.pip.index'), merged, {
                preserveState: true,
                replace: true,
            });
        },
        [filters]
    );

    const handleFilterChange = useCallback(
        (field, value) => {
            applyFilters({ [field]: value });
        },
        [applyFilters]
    );

    // ── Stats ─────────────────────────────────────────────────────────────────
    const statsData = useMemo(
        () => [
            {
                title: 'Total PIPs',
                value: stats?.total ?? 0,
                icon: <ClipboardDocumentListIcon />,
                color: 'text-primary',
                iconBg: 'bg-primary/20',
                description: 'All improvement plans',
            },
            {
                title: 'Active',
                value: stats?.active ?? 0,
                icon: <FlagIcon />,
                color: 'text-warning',
                iconBg: 'bg-warning/20',
                description: 'Currently active plans',
            },
            {
                title: 'Completed',
                value: stats?.completed ?? 0,
                icon: <CheckCircleIcon />,
                color: 'text-success',
                iconBg: 'bg-success/20',
                description: 'Successfully completed',
            },
            {
                title: 'Overdue',
                value: stats?.overdue ?? 0,
                icon: <XCircleIcon />,
                color: 'text-danger',
                iconBg: 'bg-danger/20',
                description: 'Past end date, not closed',
            },
        ],
        [stats]
    );

    // ── Delete handler ────────────────────────────────────────────────────────
    const handleDelete = useCallback(
        (pip) => {
            const promise = new Promise(async (resolve, reject) => {
                try {
                    const response = await axios.delete(
                        route('hrm.performance.pip.destroy', pip.id)
                    );
                    if (response.status === 200) {
                        resolve([response.data.message || 'PIP deleted.']);
                        router.reload({ only: ['pips', 'stats'] });
                    } else {
                        reject(['Unexpected response.']);
                    }
                } catch (error) {
                    reject(
                        error.response?.data?.errors
                            ? Object.values(error.response.data.errors).flat()
                            : ['An error occurred.']
                    );
                }
            });

            showToast.promise(promise, {
                loading: 'Deleting PIP...',
                success: (data) => data.join(', '),
                error: (data) => (Array.isArray(data) ? data.join(', ') : String(data)),
            });
        },
        []
    );

    // ── Reload after mutation ─────────────────────────────────────────────────
    const handleMutationSuccess = useCallback(() => {
        router.reload({ only: ['pips', 'stats'] });
    }, []);

    // ── Table render cell ─────────────────────────────────────────────────────
    const renderCell = useCallback(
        (pip, columnKey) => {
            switch (columnKey) {
                case 'employee':
                    return (
                        <div>
                            <p className="font-medium text-sm">{pip.employee?.user?.name ?? '—'}</p>
                            <p className="text-xs text-default-500">{pip.employee?.employee_code}</p>
                        </div>
                    );
                case 'title':
                    return (
                        <Tooltip content={pip.reason} placement="top" className="max-w-xs">
                            <span className="text-sm font-medium cursor-default line-clamp-2">
                                {pip.title}
                            </span>
                        </Tooltip>
                    );
                case 'manager':
                    return (
                        <span className="text-sm">{pip.manager?.name ?? '—'}</span>
                    );
                case 'period':
                    return (
                        <div className="text-xs whitespace-nowrap">
                            <p>{formatDate(pip.start_date)}</p>
                            <p className="text-default-400">→ {formatDate(pip.end_date)}</p>
                        </div>
                    );
                case 'status':
                    return (
                        <Chip
                            size="sm"
                            color={statusColorMap[pip.status] ?? 'default'}
                            variant="flat"
                            className="capitalize"
                        >
                            {pip.status}
                        </Chip>
                    );
                case 'goals': {
                    const { achieved, total } = goalsProgress(pip.goals);
                    if (total === 0) {
                        return <span className="text-xs text-default-400">No goals</span>;
                    }
                    const allAchieved = achieved === total;
                    return (
                        <Chip
                            size="sm"
                            color={allAchieved ? 'success' : achieved > 0 ? 'warning' : 'default'}
                            variant="flat"
                        >
                            {achieved}/{total} Goals
                        </Chip>
                    );
                }
                case 'actions':
                    return (
                        <div className="flex items-center justify-end">
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light">
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="PIP Actions">
                                    <DropdownItem
                                        key="view"
                                        startContent={<EyeIcon className="w-4 h-4" />}
                                        onPress={() => openModal('view', pip)}
                                    >
                                        View Details
                                    </DropdownItem>
                                    {canEdit && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => openModal('form', pip)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {canEdit && (
                                        <DropdownItem
                                            key="status"
                                            startContent={<FlagIcon className="w-4 h-4" />}
                                            onPress={() => openModal('status', pip)}
                                        >
                                            Update Status
                                        </DropdownItem>
                                    )}
                                    {canEdit && (
                                        <DropdownItem
                                            key="add_goal"
                                            startContent={<PlusIcon className="w-4 h-4" />}
                                            onPress={() => openModal('add_goal', pip)}
                                        >
                                            Add Goal
                                        </DropdownItem>
                                    )}
                                    {canRemove && (
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={() => handleDelete(pip)}
                                        >
                                            Delete
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    );
                default:
                    return null;
            }
        },
        [openModal, canEdit, canRemove, handleDelete]
    );

    // ── Action Buttons slot ───────────────────────────────────────────────────
    const actionButtons = useMemo(
        () =>
            canAdd ? (
                <Button
                    color="primary"
                    variant="shadow"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={() => openModal('form', null)}
                    size={isMobile ? 'sm' : 'md'}
                >
                    New PIP
                </Button>
            ) : null,
        [canAdd, isMobile, openModal]
    );

    // ── Filters slot ──────────────────────────────────────────────────────────
    const filtersSection = useMemo(
        () => (
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    placeholder="Search by employee or title..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    variant="bordered"
                    size="sm"
                    radius={themeRadius}
                    classNames={{ inputWrapper: 'bg-content2' }}
                    aria-label="Search PIPs"
                />
                <Select
                    placeholder="All Statuses"
                    selectedKeys={filters.status ? new Set([filters.status]) : new Set()}
                    onSelectionChange={(keys) =>
                        handleFilterChange('status', Array.from(keys)[0] ?? '')
                    }
                    variant="bordered"
                    size="sm"
                    radius={themeRadius}
                    classNames={{ trigger: 'bg-content2' }}
                    aria-label="Filter by status"
                >
                    <SelectItem key="">All Statuses</SelectItem>
                    {statusOptions.map((s) => (
                        <SelectItem key={s.key}>{s.label}</SelectItem>
                    ))}
                </Select>
                <Select
                    placeholder="All Employees"
                    selectedKeys={
                        filters.employee_id ? new Set([String(filters.employee_id)]) : new Set()
                    }
                    onSelectionChange={(keys) =>
                        handleFilterChange('employee_id', Array.from(keys)[0] ?? '')
                    }
                    variant="bordered"
                    size="sm"
                    radius={themeRadius}
                    classNames={{ trigger: 'bg-content2' }}
                    aria-label="Filter by employee"
                >
                    <SelectItem key="">All Employees</SelectItem>
                    {employees.map((emp) => (
                        <SelectItem key={String(emp.id)}>
                            {emp.name} ({emp.employee_code})
                        </SelectItem>
                    ))}
                </Select>
            </div>
        ),
        [filters, employees, themeRadius, handleFilterChange]
    );

    // ── Table rows ────────────────────────────────────────────────────────────
    const pipRows = useMemo(() => pips?.data ?? [], [pips]);

    // ── Pagination ────────────────────────────────────────────────────────────
    const paginationNode = useMemo(() => {
        if (!pips || pips.last_page <= 1) return null;
        return (
            <div className="flex justify-center mt-4">
                <Pagination
                    total={pips.last_page}
                    page={pips.current_page}
                    onChange={(page) => applyFilters({ page })}
                    color="primary"
                    radius={themeRadius}
                    showControls
                />
            </div>
        );
    }, [pips, themeRadius, applyFilters]);

    // ── Handle goal update from ViewDetails modal ─────────────────────────────
    const handleUpdateGoalFromView = useCallback(
        (goal) => {
            setActiveGoal(goal);
            setModalStates((p) => ({ ...p, update_goal: true }));
        },
        []
    );

    return (
        <>
            <Head title={title ?? 'Performance Improvement Plans'} />

            {/* ── Modals BEFORE main content ───────────────────────────────── */}
            {modalStates.form && (
                <PipFormModal
                    isOpen={modalStates.form}
                    onClose={() => closeModal('form')}
                    pipPlan={activePip}
                    employees={employees}
                    themeRadius={themeRadius}
                    onSuccess={handleMutationSuccess}
                />
            )}

            {modalStates.status && activePip && (
                <UpdateStatusModal
                    isOpen={modalStates.status}
                    onClose={() => closeModal('status')}
                    pipPlan={activePip}
                    themeRadius={themeRadius}
                    onSuccess={handleMutationSuccess}
                />
            )}

            {modalStates.add_goal && activePip && (
                <AddGoalModal
                    isOpen={modalStates.add_goal}
                    onClose={() => closeModal('add_goal')}
                    pipPlan={activePip}
                    themeRadius={themeRadius}
                    onSuccess={handleMutationSuccess}
                />
            )}

            {modalStates.update_goal && activePip && activeGoal && (
                <UpdateGoalModal
                    isOpen={modalStates.update_goal}
                    onClose={() => closeModal('update_goal')}
                    pipPlan={activePip}
                    goal={activeGoal}
                    themeRadius={themeRadius}
                    onSuccess={handleMutationSuccess}
                />
            )}

            {modalStates.view && activePip && (
                <ViewDetailsModal
                    isOpen={modalStates.view}
                    onClose={() => closeModal('view')}
                    pipPlan={activePip}
                    themeRadius={themeRadius}
                    canUpdate={canEdit}
                    onUpdateGoal={handleUpdateGoalFromView}
                />
            )}

            {/* ── Main layout ───────────────────────────────────────────────── */}
            <StandardPageLayout
                title="Performance Improvement Plans"
                subtitle="Track and manage employee improvement plans"
                icon={<ClipboardDocumentListIcon />}
                actions={actionButtons}
                stats={<StatsCards stats={statsData} />}
                filters={filtersSection}
                pagination={paginationNode}
                ariaLabel="Performance Improvement Plans"
            >
                {pipRows.length === 0 ? (
                    <div className="text-center py-16">
                        <UserGroupIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Improvement Plans Found</h3>
                        <p className="text-default-500 text-sm">
                            {filters.search || filters.status || filters.employee_id
                                ? 'Try adjusting your filters.'
                                : 'Create the first PIP by clicking "New PIP".'}
                        </p>
                    </div>
                ) : (
                    <Table
                        aria-label="Performance Improvement Plans Table"
                        isHeaderSticky
                        classNames={{
                            wrapper: 'shadow-none border border-divider rounded-lg',
                            th: 'bg-content2 text-default-600 font-semibold',
                            td: 'py-3',
                        }}
                    >
                        <TableHeader columns={TABLE_COLUMNS}>
                            {(column) => (
                                <TableColumn
                                    key={column.uid}
                                    align={column.uid === 'actions' ? 'end' : 'start'}
                                >
                                    {column.name}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody items={pipRows} emptyContent="No PIPs found.">
                            {(pip) => (
                                <TableRow key={pip.id}>
                                    {(columnKey) => (
                                        <TableCell>{renderCell(pip, columnKey)}</TableCell>
                                    )}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </StandardPageLayout>
        </>
    );
};

ImprovementPlan.layout = (page) => <App>{page}</App>;

export default ImprovementPlan;
