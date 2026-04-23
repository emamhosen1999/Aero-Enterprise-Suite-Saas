import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Textarea,
} from "@heroui/react";
import { CalendarDaysIcon, CheckCircleIcon, ClockIcon, PlusIcon, XCircleIcon } from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const EMPTY_FORM = { leave_type_id: '', start_date: '', end_date: '', reason: '' };

const TimeOff = ({ title, requests = [], leaveTypes = [] }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, isSuperAdmin } = useHRMAC();
    const canRequest = canCreate('hrm.self-service.time-off') || isSuperAdmin();
    
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [modalOpen, setModalOpen]   = useState(false);
    const [form, setForm]             = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.time-off.store'), form);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Time-off request submitted']);
                    setModalOpen(false);
                    setForm(EMPTY_FORM);
                    router.reload({ only: ['requests'] });
                }
            } catch (error) {
                if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
                reject(error.response?.data?.message || 'Failed to submit request');
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: 'Submitting time-off request...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const stats = useMemo(() => {
        const pending = requests.filter(r => r.status === 'pending').length;
        const approved = requests.filter(r => r.status === 'approved').length;
        const rejected = requests.filter(r => r.status === 'rejected').length;
        return { total: requests.length, pending, approved, rejected };
    }, [requests]);

    const statsData = useMemo(() => [
        { title: "Total Requests", value: stats.total, icon: <CalendarDaysIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending", value: stats.pending, icon: <ClockIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Approved", value: stats.approved, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Rejected", value: stats.rejected, icon: <XCircleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    const statusColorMap = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
    };

    const columns = [
        { uid: 'type', name: 'Leave Type' },
        { uid: 'start_date', name: 'Start Date' },
        { uid: 'end_date', name: 'End Date' },
        { uid: 'days', name: 'Days' },
        { uid: 'status', name: 'Status' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'status':
                return <Chip color={statusColorMap[item.status] || 'default'} size="sm" variant="flat">{item.status}</Chip>;
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <>
            <Head title={title || 'My Time-Off'} />

            {modalOpen && (
                <Modal isOpen scrollBehavior="inside" size="lg" onOpenChange={(open) => { setModalOpen(open); if (!open) { setForm(EMPTY_FORM); setFormErrors({}); } }}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Request Time-Off</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Select label="Leave Type" placeholder="Select leave type" isRequired radius={themeRadius}
                                selectedKeys={form.leave_type_id ? [form.leave_type_id] : []}
                                onSelectionChange={(keys) => setForm(p => ({ ...p, leave_type_id: Array.from(keys)[0] || '' }))}
                                isInvalid={!!formErrors.leave_type_id} errorMessage={formErrors.leave_type_id}>
                                {leaveTypes.map(lt => <SelectItem key={String(lt.id)}>{lt.name}</SelectItem>)}
                            </Select>
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="date" label="Start Date" isRequired radius={themeRadius}
                                    value={form.start_date}
                                    onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))}
                                    isInvalid={!!formErrors.start_date} errorMessage={formErrors.start_date} />
                                <Input type="date" label="End Date" isRequired radius={themeRadius}
                                    value={form.end_date}
                                    onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))}
                                    isInvalid={!!formErrors.end_date} errorMessage={formErrors.end_date} />
                            </div>
                            <Textarea label="Reason" placeholder="Briefly describe your reason" radius={themeRadius}
                                value={form.reason} onValueChange={(v) => setForm(p => ({ ...p, reason: v }))} />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => { setModalOpen(false); setForm(EMPTY_FORM); setFormErrors({}); }}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={handleSubmit}>Submit Request</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="My Time-Off"
                subtitle="Request and track your time-off"
                icon={<CalendarDaysIcon />}
                stats={<StatsCards stats={statsData} />}
                actions={canRequest && (
                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />}
                        size={isMobile ? 'sm' : 'md'} onPress={() => setModalOpen(true)}>
                        Request Time-Off
                    </Button>
                )}
                ariaLabel="My Time-Off"
            >
            {requests.length > 0 ? (
                <Table aria-label="Time-off requests" classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}>
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={requests}>
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-default-500">
                    <CalendarDaysIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Time-Off Requests</p>
                    <p className="text-sm">You haven't submitted any time-off requests yet.</p>
                </div>
            )}
            </StandardPageLayout>
        </>
    );
};

TimeOff.layout = (page) => <App children={page} />;
export default TimeOff;
