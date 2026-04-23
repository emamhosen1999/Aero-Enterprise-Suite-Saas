import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Pagination,
    Select,
    SelectItem,
    Switch,
    Textarea,
    Tooltip,
} from '@heroui/react';
import {
    BoltIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    LightBulbIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { showToast } from '@/utils/ui/toastUtils';

const getSeverityColor = (severity) => {
    switch (severity) {
        case 'critical': return 'danger';
        case 'high': return 'warning';
        case 'moderate': return 'primary';
        default: return 'success';
    }
};

const getScopeColor = (scope) => {
    switch (scope) {
        case 'organization': return 'secondary';
        case 'department': return 'primary';
        default: return 'default';
    }
};

const Insights = ({ title, insights, filters, insightTypes }) => {
    const themeRadius = useThemeRadius();
    const { hasAccess, canUpdate, isSuperAdmin } = useHRMAC();
    const canResolve = canUpdate('hrm.ai-analytics.insights') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    const [resolveModal, setResolveModal] = useState({ open: false, insight: null });
    const [resolveNotes, setResolveNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [unresolvedOnly, setUnresolvedOnly] = useState(filters?.unresolved_only === '1' || false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const statsData = useMemo(() => [
        {
            title: 'Total Insights',
            value: insights?.total || 0,
            icon: <LightBulbIcon className="w-6 h-6" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'AI-generated insights',
        },
        {
            title: 'Critical',
            value: (insights?.data || []).filter((i) => i.severity === 'critical').length,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
            description: 'Immediate attention needed',
        },
        {
            title: 'High Priority',
            value: (insights?.data || []).filter((i) => i.severity === 'high').length,
            icon: <BoltIcon className="w-6 h-6" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
            description: 'Action required soon',
        },
        {
            title: 'Resolved',
            value: (insights?.data || []).filter((i) => i.status === 'resolved').length,
            icon: <CheckCircleIcon className="w-6 h-6" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
            description: 'Actioned insights',
        },
    ], [insights]);

    const handleFilterChange = (key, value) => {
        router.get(
            route('hrm.ai-analytics.insights'),
            { ...filters, [key]: value ?? '' },
            { preserveState: true, replace: true }
        );
    };

    const handleUnresolvedToggle = (checked) => {
        setUnresolvedOnly(checked);
        router.get(
            route('hrm.ai-analytics.insights'),
            { ...filters, unresolved_only: checked ? '1' : '' },
            { preserveState: true, replace: true }
        );
    };

    const openResolveModal = (insight) => {
        setResolveNotes('');
        setResolveModal({ open: true, insight });
    };

    const closeResolveModal = () => {
        setResolveModal({ open: false, insight: null });
        setResolveNotes('');
    };

    const handleMarkResolved = () => {
        if (!resolveModal.insight) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                setSubmitting(true);
                const response = await axios.post(
                    route('hrm.ai-analytics.insights.resolve', resolveModal.insight.id),
                    { notes: resolveNotes }
                );
                if (response.status === 200) {
                    resolve([response.data.message || 'Insight marked as resolved']);
                    closeResolveModal();
                    router.reload({ only: ['insights'] });
                } else {
                    reject(['Failed to update insight']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            } finally {
                setSubmitting(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Resolving insight...',
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : data),
        });
    };

    const insightItems = insights?.data || [];

    return (
        <>
            <Head title={title ?? 'AI Insights'} />

            {resolveModal.open && (
                <Modal
                    isOpen={resolveModal.open}
                    onOpenChange={closeResolveModal}
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
                            <h2 className="text-lg font-semibold">Mark Insight as Resolved</h2>
                            <p className="text-sm text-default-500 font-normal line-clamp-2">
                                {resolveModal.insight?.title}
                            </p>
                        </ModalHeader>
                        <ModalBody>
                            <Textarea
                                label="Resolution Notes"
                                placeholder="Describe the action taken to address this insight..."
                                value={resolveNotes}
                                onValueChange={setResolveNotes}
                                radius={themeRadius}
                                minRows={3}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={closeResolveModal}>
                                Cancel
                            </Button>
                            <Button
                                color="success"
                                onPress={handleMarkResolved}
                                isLoading={submitting}
                                startContent={!submitting && <ShieldCheckIcon className="w-4 h-4" />}
                            >
                                Mark Resolved
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="AI Insights"
                subtitle="AI-generated actionable insights for workforce management"
                icon={<LightBulbIcon className="w-6 h-6" />}
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
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <Select
                            label="Insight Type"
                            placeholder="All Types"
                            selectedKeys={filters?.insight_type ? [filters.insight_type] : []}
                            onSelectionChange={(keys) =>
                                handleFilterChange('insight_type', Array.from(keys)[0] || '')
                            }
                            radius={themeRadius}
                            className="sm:max-w-xs"
                        >
                            {(insightTypes || []).map((type) => (
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
                            <SelectItem key="critical">Critical</SelectItem>
                            <SelectItem key="high">High</SelectItem>
                            <SelectItem key="moderate">Moderate</SelectItem>
                            <SelectItem key="low">Low</SelectItem>
                        </Select>
                        <div className="flex items-center gap-2 pb-1">
                            <Switch
                                isSelected={unresolvedOnly}
                                onValueChange={handleUnresolvedToggle}
                                size="sm"
                            />
                            <span className="text-sm text-default-600">Unresolved only</span>
                        </div>
                    </div>
                }
                ariaLabel="AI Insights"
            >
                {insightItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <LightBulbIcon className="w-12 h-12 text-default-300" />
                        <p className="text-default-500 text-sm">
                            No insights found for the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {insightItems.map((insight) => (
                            <Card
                                key={insight.id}
                                className="aero-card"
                                shadow="none"
                            >
                                <CardBody className="p-5">
                                    <div className="flex flex-col gap-3">
                                        {/* Header row */}
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={getSeverityColor(insight.severity)}
                                                >
                                                    {insight.severity}
                                                </Chip>
                                                <Chip
                                                    size="sm"
                                                    variant="bordered"
                                                    color={getScopeColor(insight.scope)}
                                                >
                                                    {insight.insight_type?.replace(/_/g, ' ')}
                                                </Chip>
                                                {insight.scope && (
                                                    <Chip size="sm" variant="dot" color="default">
                                                        {insight.scope}
                                                    </Chip>
                                                )}
                                                {insight.status === 'resolved' && (
                                                    <Chip size="sm" variant="flat" color="success">
                                                        Resolved
                                                    </Chip>
                                                )}
                                            </div>
                                            {insight.confidence_score != null && (
                                                <Tooltip content="AI Confidence Score">
                                                    <span className="text-xs text-default-500 shrink-0">
                                                        Confidence:{' '}
                                                        <span className="font-semibold text-foreground">
                                                            {insight.confidence_score}%
                                                        </span>
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </div>

                                        {/* Title + description */}
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1">
                                                {insight.title}
                                            </h4>
                                            {insight.description && (
                                                <p className="text-sm text-default-600 dark:text-default-400">
                                                    {insight.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Recommended actions */}
                                        {Array.isArray(insight.recommended_actions) &&
                                            insight.recommended_actions.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-default-500 mb-1.5 uppercase tracking-wide">
                                                        Recommended Actions
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {insight.recommended_actions.map(
                                                            (action, idx) => (
                                                                <li
                                                                    key={idx}
                                                                    className="flex items-start gap-2 text-sm text-default-600 dark:text-default-400"
                                                                >
                                                                    <span className="mt-1 text-primary shrink-0">
                                                                        •
                                                                    </span>
                                                                    {typeof action === 'string'
                                                                        ? action
                                                                        : action.action || action.text || JSON.stringify(action)}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <span className="text-xs text-default-400">
                                                {insight.insight_date
                                                    ? new Date(insight.insight_date).toLocaleDateString()
                                                    : ''}
                                                {insight.valid_until && (
                                                    <> · Valid until {new Date(insight.valid_until).toLocaleDateString()}</>
                                                )}
                                            </span>
                                            {canResolve && insight.status !== 'resolved' && (
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="success"
                                                    startContent={<ShieldCheckIcon className="w-4 h-4" />}
                                                    onPress={() => openResolveModal(insight)}
                                                >
                                                    Mark Resolved
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}

                {insights?.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={insights.last_page}
                            page={insights.current_page}
                            onChange={(page) =>
                                router.get(route('hrm.ai-analytics.insights'), {
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

Insights.layout = (page) => <App children={page} />;
export default Insights;
