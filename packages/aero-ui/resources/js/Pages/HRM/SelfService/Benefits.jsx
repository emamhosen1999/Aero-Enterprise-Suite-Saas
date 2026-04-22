import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button, Chip, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Textarea,
    Input, Card, CardHeader, CardBody,
} from "@heroui/react";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { GiftIcon, CheckCircleIcon, ClockIcon, PlusIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const BENEFIT_TYPES = ['Health Insurance', 'Life Insurance', 'Dental', 'Vision', 'Retirement/401k', 'Disability', 'Other'];
const EMPTY_FORM = { benefit_type: '', notes: '' };
const EMPTY_ENROLLMENT_FORM = {
    benefit_plan_id: '',
    coverage_level: '',
    effective_date: '',
    notes: '',
};

const Benefits = ({ title, benefits: initialBenefits = [] }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, isSuperAdmin } = useHRMAC();
    const canRequest = canCreate('hrm.self-service.benefits') || isSuperAdmin();

    const [benefits, setBenefits] = useState(initialBenefits);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [openEnrollmentLoading, setOpenEnrollmentLoading] = useState(false);
    const [openEnrollment, setOpenEnrollment] = useState({
        employee: null,
        active_period: null,
        available_plans: [],
        current_enrollments: [],
        can_submit: false,
    });
    const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
    const [enrollmentForm, setEnrollmentForm] = useState(EMPTY_ENROLLMENT_FORM);
    const [enrollmentErrors, setEnrollmentErrors] = useState({});
    const [enrollmentSubmitting, setEnrollmentSubmitting] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const fetchOpenEnrollment = useCallback(async () => {
        setOpenEnrollmentLoading(true);
        try {
            const response = await axios.get(route('hrm.selfservice.benefits.open-enrollment.payload'));
            if (response.status === 200) {
                const payload = response.data?.data || response.data || {};
                setOpenEnrollment({
                    employee: payload.employee || null,
                    active_period: payload.active_period || null,
                    available_plans: Array.isArray(payload.available_plans) ? payload.available_plans : [],
                    current_enrollments: Array.isArray(payload.current_enrollments) ? payload.current_enrollments : [],
                    can_submit: Boolean(payload.can_submit),
                });
            }
        } catch (error) {
            setOpenEnrollment({
                employee: null,
                active_period: null,
                available_plans: [],
                current_enrollments: [],
                can_submit: false,
            });
            showToast.promise(Promise.reject(error), { error: 'Failed to load open enrollment data' });
        } finally {
            setOpenEnrollmentLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOpenEnrollment();
    }, [fetchOpenEnrollment]);

    const handleRequestChange = () => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/hrm/self-service/benefits/request', form);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Benefit change request submitted']);
                    setModalOpen(false);
                    setForm(EMPTY_FORM);
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    reject('This feature is not available yet. Please contact HR directly.');
                } else {
                    reject(error.response?.data?.message || 'Failed to submit request');
                }
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: 'Submitting benefit change request...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const coverageLevelsForSelectedPlan = useMemo(() => {
        const selectedPlan = openEnrollment.available_plans.find(
            (plan) => String(plan.id) === String(enrollmentForm.benefit_plan_id)
        );

        if (Array.isArray(selectedPlan?.coverage_levels) && selectedPlan.coverage_levels.length > 0) {
            return selectedPlan.coverage_levels;
        }

        return ['employee_only', 'employee_spouse', 'employee_children', 'family'];
    }, [openEnrollment.available_plans, enrollmentForm.benefit_plan_id]);

    const openEnrollmentModal = (planId = '') => {
        setEnrollmentErrors({});
        setEnrollmentForm({
            ...EMPTY_ENROLLMENT_FORM,
            benefit_plan_id: planId ? String(planId) : '',
        });
        setEnrollmentModalOpen(true);
    };

    const handleOpenEnrollmentSubmit = () => {
        setEnrollmentSubmitting(true);
        setEnrollmentErrors({});

        const payload = {
            benefit_plan_id: enrollmentForm.benefit_plan_id,
            coverage_level: enrollmentForm.coverage_level,
            effective_date: enrollmentForm.effective_date || undefined,
            notes: enrollmentForm.notes || undefined,
        };

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('hrm.selfservice.benefits.open-enrollment.submit'),
                    payload
                );

                if (response.status === 200 || response.status === 201) {
                    resolve([response.data?.message || 'Enrollment submitted successfully']);
                    setEnrollmentModalOpen(false);
                    setEnrollmentForm(EMPTY_ENROLLMENT_FORM);
                    fetchOpenEnrollment();
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    const responseErrors = error.response?.data?.errors || {};
                    setEnrollmentErrors(responseErrors);
                    const periodError = responseErrors.active_period?.[0] || '';
                    const duplicateError = responseErrors.benefit_plan_id?.[0] || '';
                    const fallbackMessage = error.response?.data?.message || 'Unable to submit enrollment';
                    reject(periodError || duplicateError || fallbackMessage);
                    return;
                }

                reject(error.response?.data?.message || 'Failed to submit enrollment');
            } finally {
                setEnrollmentSubmitting(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Submitting open enrollment...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const stats = useMemo(() => {
        const active = benefits.filter(b => b.status === 'active').length;
        const pending = benefits.filter(b => b.status === 'pending').length;
        return { total: benefits.length, active, pending };
    }, [benefits]);

    const statsData = useMemo(() => [
        { title: "Total Benefits", value: stats.total, icon: <GiftIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Active", value: stats.active, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Pending", value: stats.pending, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
    ], [stats]);

    const statusColorMap = {
        active: 'success',
        pending: 'warning',
        inactive: 'default',
    };

    const columns = [
        { uid: 'name', name: 'Name' },
        { uid: 'type', name: 'Type' },
        { uid: 'provider', name: 'Provider' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'status':
                return <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">{item.status}</Chip>;
            case 'actions':
                return (
                    <Button size="sm" variant="flat" color="primary"
                        onPress={() => { setForm(p => ({ ...p, benefit_type: item.type || '' })); setModalOpen(true); }}>
                        Request Change
                    </Button>
                );
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <>
            <Head title={title || 'My Benefits'} />

            {modalOpen && (
                <Modal isOpen scrollBehavior="inside" size="lg"
                    onOpenChange={(open) => { setModalOpen(open); if (!open) setForm(EMPTY_FORM); }}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Request Benefit Change</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Select label="Benefit Type" placeholder="Select benefit type" isRequired radius={themeRadius}
                                selectedKeys={form.benefit_type ? [form.benefit_type] : []}
                                onSelectionChange={(keys) => setForm(p => ({ ...p, benefit_type: Array.from(keys)[0] || '' }))}>
                                {BENEFIT_TYPES.map(t => <SelectItem key={t}>{t}</SelectItem>)}
                            </Select>
                            <Textarea label="Notes" placeholder="Describe the change you're requesting"
                                radius={themeRadius} minRows={3}
                                value={form.notes} onValueChange={(v) => setForm(p => ({ ...p, notes: v }))} />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => { setModalOpen(false); setForm(EMPTY_FORM); }}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={handleRequestChange}>Submit Request</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {enrollmentModalOpen && (
                <Modal
                    isOpen
                    scrollBehavior="inside"
                    size="2xl"
                    onOpenChange={(open) => {
                        setEnrollmentModalOpen(open);
                        if (!open) {
                            setEnrollmentForm(EMPTY_ENROLLMENT_FORM);
                            setEnrollmentErrors({});
                        }
                    }}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}
                >
                    <ModalContent>
                        <ModalHeader>Open Enrollment</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            {!openEnrollment.active_period && (
                                <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-700 dark:text-warning-400">
                                    <ExclamationCircleIcon className="w-5 h-5" />
                                    <span>No active enrollment period is available at the moment.</span>
                                </div>
                            )}

                            <Select
                                label="Benefit Plan"
                                placeholder="Select a plan"
                                isRequired
                                radius={themeRadius}
                                selectedKeys={enrollmentForm.benefit_plan_id ? [String(enrollmentForm.benefit_plan_id)] : []}
                                onSelectionChange={(keys) => setEnrollmentForm((p) => ({ ...p, benefit_plan_id: Array.from(keys)[0] || '' }))}
                                isInvalid={!!enrollmentErrors.benefit_plan_id}
                                errorMessage={enrollmentErrors.benefit_plan_id?.[0]}
                            >
                                {openEnrollment.available_plans.map((plan) => (
                                    <SelectItem key={String(plan.id)}>{plan.name || plan.plan_name || `Plan #${plan.id}`}</SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="Coverage Level"
                                placeholder="Select coverage"
                                isRequired
                                radius={themeRadius}
                                selectedKeys={enrollmentForm.coverage_level ? [enrollmentForm.coverage_level] : []}
                                onSelectionChange={(keys) => setEnrollmentForm((p) => ({ ...p, coverage_level: Array.from(keys)[0] || '' }))}
                                isInvalid={!!enrollmentErrors.coverage_level}
                                errorMessage={enrollmentErrors.coverage_level?.[0]}
                            >
                                {coverageLevelsForSelectedPlan.map((level) => (
                                    <SelectItem key={String(level)}>{String(level).replaceAll('_', ' ')}</SelectItem>
                                ))}
                            </Select>

                            <Input
                                type="date"
                                label="Effective Date (Optional)"
                                radius={themeRadius}
                                value={enrollmentForm.effective_date}
                                onChange={(e) => setEnrollmentForm((p) => ({ ...p, effective_date: e.target.value }))}
                                isInvalid={!!enrollmentErrors.effective_date}
                                errorMessage={enrollmentErrors.effective_date?.[0]}
                            />

                            <Textarea
                                label="Notes (Optional)"
                                placeholder="Add notes for HR if needed"
                                radius={themeRadius}
                                minRows={3}
                                value={enrollmentForm.notes}
                                onValueChange={(v) => setEnrollmentForm((p) => ({ ...p, notes: v }))}
                                isInvalid={!!enrollmentErrors.notes}
                                errorMessage={enrollmentErrors.notes?.[0]}
                            />

                            {!!enrollmentErrors.active_period?.[0] && (
                                <p className="text-sm text-danger">{enrollmentErrors.active_period?.[0]}</p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="flat"
                                onPress={() => {
                                    setEnrollmentModalOpen(false);
                                    setEnrollmentForm(EMPTY_ENROLLMENT_FORM);
                                    setEnrollmentErrors({});
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                isLoading={enrollmentSubmitting}
                                isDisabled={!openEnrollment.can_submit}
                                onPress={handleOpenEnrollmentSubmit}
                            >
                                Submit Enrollment
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="My Benefits"
                subtitle="View your enrolled benefits and coverage"
                icon={<GiftIcon className="w-6 h-6" />}
                iconColorClass="text-primary"
                iconBgClass="bg-primary/20"
                stats={<StatsCards stats={statsData} />}
                actions={canRequest && (
                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />}
                        size={isMobile ? 'sm' : 'md'} onPress={() => setModalOpen(true)}>
                        Request Benefit Change
                    </Button>
                )}
                ariaLabel="My Benefits"
            >
                <Card className="mb-4 shadow-none border border-divider rounded-lg" style={{ background: 'var(--theme-content1)' }}>
                    <CardHeader className="flex items-center justify-between gap-3 border-b border-divider py-3">
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-foreground">Open Enrollment Status</span>
                        </div>
                        <Chip color={openEnrollment.can_submit ? 'success' : 'default'} variant="flat" size="sm">
                            {openEnrollment.can_submit ? 'Submission Open' : 'Submission Closed'}
                        </Chip>
                    </CardHeader>
                    <CardBody className="py-4">
                        {openEnrollmentLoading ? (
                            <p className="text-default-500 text-sm">Loading open enrollment details...</p>
                        ) : openEnrollment.active_period ? (
                            <div className="flex flex-col gap-2 text-sm">
                                <p className="text-foreground font-medium">{openEnrollment.active_period.name || 'Current Enrollment Period'}</p>
                                <p className="text-default-600">
                                    {openEnrollment.active_period.start_date || '-'} to {openEnrollment.active_period.end_date || '-'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 text-sm text-warning-700 dark:text-warning-400">
                                <ExclamationCircleIcon className="w-5 h-5 mt-0.5" />
                                <p>No active open enrollment period.</p>
                            </div>
                        )}
                    </CardBody>
                </Card>

                <Card className="mb-4 shadow-none border border-divider rounded-lg" style={{ background: 'var(--theme-content1)' }}>
                    <CardHeader className="border-b border-divider py-3">
                        <span className="font-semibold text-foreground">Available Plans</span>
                    </CardHeader>
                    <CardBody className="py-4">
                        {openEnrollment.available_plans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {openEnrollment.available_plans.map((plan) => (
                                    <Card key={plan.id} className="shadow-none border border-divider bg-content2">
                                        <CardBody className="p-4 gap-2">
                                            <p className="font-semibold text-foreground">{plan.name || plan.plan_name || `Plan #${plan.id}`}</p>
                                            <p className="text-sm text-default-600">{plan.description || 'No plan description provided.'}</p>
                                            {!!plan.premium && (
                                                <p className="text-sm text-default-600">Premium: {plan.premium}</p>
                                            )}
                                            <div className="pt-1">
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    variant="flat"
                                                    isDisabled={!openEnrollment.can_submit}
                                                    onPress={() => openEnrollmentModal(String(plan.id))}
                                                >
                                                    Enroll
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-default-500">No available plans for the current period.</p>
                        )}
                    </CardBody>
                </Card>

                <Card className="mb-4 shadow-none border border-divider rounded-lg" style={{ background: 'var(--theme-content1)' }}>
                    <CardHeader className="border-b border-divider py-3">
                        <span className="font-semibold text-foreground">Current Open Enrollment Selections</span>
                    </CardHeader>
                    <CardBody className="py-4">
                        {openEnrollment.current_enrollments.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {openEnrollment.current_enrollments.map((entry) => (
                                    <div
                                        key={entry.id || `${entry.benefit_plan_id}-${entry.coverage_level}`}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-divider bg-content2 p-3"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{entry.plan_name || entry.benefit_plan_name || 'Benefit Plan'}</p>
                                            <p className="text-xs text-default-600">Coverage: {entry.coverage_level || '-'}</p>
                                        </div>
                                        <Chip size="sm" variant="flat" color="primary">Open Enrollment</Chip>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-default-500">No open enrollment selections submitted yet.</p>
                        )}
                    </CardBody>
                </Card>

                {benefits.length > 0 ? (
                    <Table aria-label="Benefits" classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}>
                        <TableHeader columns={columns}>
                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={benefits}>
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12 text-default-500">
                        <GiftIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No Benefits Enrolled</p>
                        <p className="text-sm">Contact HR to learn about available benefits.</p>
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

Benefits.layout = (page) => <App children={page} />;
export default Benefits;
