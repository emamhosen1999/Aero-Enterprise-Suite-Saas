import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button,
    Chip,
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
} from '@heroui/react';
import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { showToast } from '@/utils/toastUtils.jsx';

const getSeverityColor = (score) => {
    if (score >= 80) return 'danger';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'primary';
    return 'success';
};

const getStatusColor = (status) => {
    if (status === 'reviewed') return 'success';
    return 'warning';
};

const Anomalies = ({ title, anomalies, filters, anomalyTypes }) => {
    const themeRadius = useThemeRadius();
    const { hasAccess, canUpdate, isSuperAdmin } = useHRMAC();
    const canReview = canUpdate('hrm.ai-analytics.anomalies') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    const [reviewModal, setReviewModal] = useState({ open: false, anomaly: null });
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const pendingCount = useMemo(
        () => (anomalies?.data || []).filter((a) => a.status === 'pending').length,
        [anomalies]
    );

    const statsData = useMemo(() => [
        {
            title: 'Total Anomalies',
            value: anomalies?.total || 0,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'Detected this period',
        },
        {
            title: 'Pending Review',
            value: anomalies?.data?.filter((a) => a.status === 'pending').length ?? 0,
            icon: <ClockIcon className="w-6 h-6" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Awaiting action',
        },
        {
            title: 'Reviewed',
            value: anomalies?.data?.filter((a) => a.status === 'reviewed').length ?? 0,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Resolved anomalies',
        },
    ], [anomalies]);

    const handleFilterChange = (key, value) => {
        router.get(
            route('hrm.ai-analytics.anomalies'),
            { ...filters, [key]: value || '' },
            { preserveState: true, replace: true }
        );
    };

    const openReviewModal = (anomaly) => {
        setReviewNotes('');
        setReviewModal({ open: true, anomaly });
    };

    const closeReviewModal = () => {
        setReviewModal({ open: false, anomaly: null });
        setReviewNotes('');
    };

    const handleMarkReviewed = () => {
        if (!reviewModal.anomaly) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                setSubmitting(true);
                const response = await axios.post(
                    route('hrm.ai-analytics.anomalies.resolve', reviewModal.anomaly.id),
                    { action: 'reviewed', notes: reviewNotes }
                );
                if (response.status === 200) {
                    resolve([response.data.message || 'Anomaly marked as reviewed']);
                    closeReviewModal();
                    router.reload({ only: ['anomalies'] });
                } else {
                    reject(['Failed to update anomaly']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            } finally {
                setSubmitting(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Marking as reviewed...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : data),
        });
    };

    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'anomaly_type', name: 'Anomaly Type' },
        { uid: 'score', name: 'Score' },
        { uid: 'deviation', name: 'Deviation %' },
        { uid: 'anomaly_date', name: 'Date' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div>
                        <p className="font-medium">{item.employee?.full_name}</p>
                        <p className="text-xs text-default-500">
                            {item.employee?.department?.name}
                        </p>
                    </div>
                );
            case 'anomaly_type':
                return (
                    <Chip size="sm" variant="flat" color="secondary">
                        {item.anomaly_type?.replace(/_/g, ' ')}
                    </Chip>
                );
            case 'score':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={getSeverityColor(item.anomaly_score)}
                    >
                        {item.anomaly_score}
                    </Chip>
                );
            case 'deviation':
                return (
                    <span className="font-medium">
                        {item.deviation_percentage != null
                            ? `${item.deviation_percentage}%`
                            : '—'}
                    </span>
                );
            case 'anomaly_date':
                return item.anomaly_date
                    ? new Date(item.anomaly_date).toLocaleDateString()
                    : '—';
            case 'status':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(item.status)}
                    >
                        {item.status}
                    </Chip>
                );
            case 'actions':
                return canReview && item.status === 'pending' ? (
                    <Button
                        size="sm"
                        variant="flat"
                        color="success"
                        startContent={<ShieldCheckIcon className="w-4 h-4" />}
                        onPress={() => openReviewModal(item)}
                    >
                        Mark Reviewed
                    </Button>
                ) : null;
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title ?? 'Behavioral Anomalies'} />

            {reviewModal.open && (
                <Modal
                    isOpen={reviewModal.open}
                    onOpenChange={closeReviewModal}
                    size="lg"
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
                            <h2 className="text-lg font-semibold">Mark Anomaly as Reviewed</h2>
                            <p className="text-sm text-default-500 font-normal">
                                {reviewModal.anomaly?.employee?.full_name} —{' '}
                                {reviewModal.anomaly?.anomaly_type?.replace(/_/g, ' ')}
                            </p>
                        </ModalHeader>
                        <ModalBody>
                            <Textarea
                                label="Review Notes"
                                placeholder="Enter your review notes or observations..."
                                value={reviewNotes}
                                onValueChange={setReviewNotes}
                                radius={themeRadius}
                                minRows={3}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={closeReviewModal}>
                                Cancel
                            </Button>
                            <Button
                                color="success"
                                onPress={handleMarkReviewed}
                                isLoading={submitting}
                                startContent={!submitting && <ShieldCheckIcon className="w-4 h-4" />}
                            >
                                Confirm Review
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="Behavioral Anomalies"
                subtitle="Detected behavioral deviations requiring HR attention"
                icon={<ExclamationTriangleIcon className="w-6 h-6" />}
                iconColorClass="text-warning"
                iconBgClass="bg-warning/20"
                stats={<StatsCards stats={statsData} />}
                actions={
                    <Button
                        variant="flat"
                        size={isMobile ? 'sm' : 'md'}
                        onPress={() => router.visit(route('hrm.ai-analytics.dashboard'))}
                    >
                        Back to Dashboard
                    </Button>
                }
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select
                            label="Anomaly Type"
                            placeholder="All Types"
                            selectedKeys={filters?.anomaly_type ? [filters.anomaly_type] : []}
                            onSelectionChange={(keys) =>
                                handleFilterChange('anomaly_type', Array.from(keys)[0] || '')
                            }
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            {(anomalyTypes || []).map((type) => (
                                <SelectItem key={type}>{type.replace(/_/g, ' ')}</SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="Severity"
                            placeholder="All Severities"
                            selectedKeys={filters?.severity ? [filters.severity] : []}
                            onSelectionChange={(keys) =>
                                handleFilterChange('severity', Array.from(keys)[0] || '')
                            }
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            <SelectItem key="critical">Critical (80%+)</SelectItem>
                            <SelectItem key="high">High (60-79%)</SelectItem>
                            <SelectItem key="moderate">Moderate (40-59%)</SelectItem>
                            <SelectItem key="low">Low (&lt;40%)</SelectItem>
                        </Select>
                    </div>
                }
                ariaLabel="Behavioral Anomalies"
            >
                <Table
                    aria-label="Behavioral anomalies table"
                    isHeaderSticky
                    classNames={{
                        wrapper: 'shadow-none border border-divider rounded-lg',
                        th: 'bg-default-100 text-default-600 font-semibold',
                        td: 'py-3',
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid}>{column.name}</TableColumn>
                        )}
                    </TableHeader>
                    <TableBody
                        items={anomalies?.data || []}
                        emptyContent="No behavioral anomalies detected"
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => (
                                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {anomalies?.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={anomalies.last_page}
                            page={anomalies.current_page}
                            onChange={(page) =>
                                router.get(route('hrm.ai-analytics.anomalies'), {
                                    ...filters,
                                    page,
                                })
                            }
                        />
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

Anomalies.layout = (page) => <App children={page} />;
export default Anomalies;
