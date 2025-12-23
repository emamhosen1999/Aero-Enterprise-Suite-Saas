import React from 'react';
import { Head, router } from '@inertiajs/react';
import App from '@/Layouts/App';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Divider,
    User as UserAvatar,
    ScrollShadow,
} from '@heroui/react';
import {
    ArrowLeftIcon,
    PencilIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    UserIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

const statusColorMap = {
    open: 'warning',
    in_review: 'primary',
    resolved: 'success',
    rejected: 'danger',
    closed: 'default',
};

const ObjectionsShow = ({
    auth,
    title = 'Objection Details',
    objection = {},
    statusLabels = {},
    categoryLabels = {},
}) => {
    const handleBack = () => {
        router.visit(route('rfi.objections.index'));
    };

    const handleEdit = () => {
        router.visit(route('rfi.objections.edit', objection.id));
    };

    const handleResolve = () => {
        router.post(route('rfi.objections.resolve', objection.id), {}, {
            onSuccess: () => showToast.success('Objection resolved'),
            onError: () => showToast.error('Failed to resolve objection'),
        });
    };

    const handleReject = () => {
        router.post(route('rfi.objections.reject', objection.id), {}, {
            onSuccess: () => showToast.success('Objection rejected'),
            onError: () => showToast.error('Failed to reject objection'),
        });
    };

    return (
        <App auth={auth}>
            <Head title={`${title} - #${objection.id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            isIconOnly
                            variant="flat"
                            onPress={handleBack}
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">Objection #{objection.id}</h1>
                                <Chip
                                    color={statusColorMap[objection.status] || 'default'}
                                    variant="flat"
                                >
                                    {statusLabels[objection.status] || objection.status}
                                </Chip>
                            </div>
                            <p className="text-default-500">{objection.title}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {objection.status === 'open' || objection.status === 'in_review' ? (
                            <>
                                <Button
                                    color="success"
                                    variant="flat"
                                    startContent={<CheckCircleIcon className="w-5 h-5" />}
                                    onPress={handleResolve}
                                >
                                    Resolve
                                </Button>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    startContent={<XCircleIcon className="w-5 h-5" />}
                                    onPress={handleReject}
                                >
                                    Reject
                                </Button>
                            </>
                        ) : null}
                        <Button
                            color="primary"
                            startContent={<PencilIcon className="w-5 h-5" />}
                            onPress={handleEdit}
                        >
                            Edit
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="aero-card">
                            <CardHeader className="border-b border-divider p-4">
                                <h3 className="text-lg font-semibold">Details</h3>
                            </CardHeader>
                            <CardBody className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm text-default-500">Category</label>
                                    <p className="font-medium">
                                        {categoryLabels[objection.category] || objection.category || '-'}
                                    </p>
                                </div>
                                <Divider />
                                <div>
                                    <label className="text-sm text-default-500">Description</label>
                                    <p className="whitespace-pre-wrap">
                                        {objection.description || 'No description provided'}
                                    </p>
                                </div>
                                {objection.notes && (
                                    <>
                                        <Divider />
                                        <div>
                                            <label className="text-sm text-default-500">Notes</label>
                                            <p className="whitespace-pre-wrap">{objection.notes}</p>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card>

                        {/* Related Daily Works */}
                        {objection.daily_works && objection.daily_works.length > 0 && (
                            <Card className="aero-card">
                                <CardHeader className="border-b border-divider p-4">
                                    <h3 className="text-lg font-semibold">Related Daily Works</h3>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <ScrollShadow className="max-h-64">
                                        <div className="space-y-2">
                                            {objection.daily_works.map((work) => (
                                                <div
                                                    key={work.id}
                                                    className="flex items-center justify-between p-3 bg-default-50 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="font-medium">RFI #{work.id}</p>
                                                        <p className="text-sm text-default-500">
                                                            {work.description || 'No description'}
                                                        </p>
                                                    </div>
                                                    <Chip size="sm" variant="flat">
                                                        {work.status}
                                                    </Chip>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollShadow>
                                </CardBody>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="aero-card">
                            <CardHeader className="border-b border-divider p-4">
                                <h3 className="text-lg font-semibold">Information</h3>
                            </CardHeader>
                            <CardBody className="p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <UserIcon className="w-5 h-5 text-default-400" />
                                    <div>
                                        <label className="text-xs text-default-500">Created By</label>
                                        <p className="font-medium">
                                            {objection.created_by_user?.name || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CalendarIcon className="w-5 h-5 text-default-400" />
                                    <div>
                                        <label className="text-xs text-default-500">Created At</label>
                                        <p className="font-medium">
                                            {objection.created_at
                                                ? new Date(objection.created_at).toLocaleDateString()
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                                {objection.resolved_by_user && (
                                    <div className="flex items-center gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-success" />
                                        <div>
                                            <label className="text-xs text-default-500">Resolved By</label>
                                            <p className="font-medium">
                                                {objection.resolved_by_user.name}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Status History */}
                        {objection.status_logs && objection.status_logs.length > 0 && (
                            <Card className="aero-card">
                                <CardHeader className="border-b border-divider p-4">
                                    <h3 className="text-lg font-semibold">Status History</h3>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <ScrollShadow className="max-h-48">
                                        <div className="space-y-3">
                                            {objection.status_logs.map((log, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <ClockIcon className="w-4 h-4 text-default-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {statusLabels[log.to_status] || log.to_status}
                                                        </p>
                                                        <p className="text-xs text-default-500">
                                                            {log.changed_by_user?.name} •{' '}
                                                            {new Date(log.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollShadow>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </App>
    );
};

export default ObjectionsShow;
