import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider,
} from "@heroui/react";
import {
    ClipboardDocumentCheckIcon,
    ArrowLeftIcon,
    PencilIcon,
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import dayjs from 'dayjs';

const InspectionsShow = ({ title, inspection = {} }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const isMobile = useMediaQuery('(max-width: 640px)');
    
    // HRMAC permissions
    const { canUpdate, isSuperAdmin } = useHRMAC();
    const canEditInspection = canUpdate('quality.inspections') || isSuperAdmin();

    // Status color map
    const statusColorMap = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        in_progress: 'primary',
        scheduled: 'secondary',
    };

    // Type color map
    const typeColorMap = {
        wir: 'primary',
        itp: 'secondary',
        checklist: 'success',
    };

    // Action buttons
    const actionButtons = (
        <div className="flex gap-2 flex-wrap">
            <Link href={route('quality.inspections.index')}>
                <Button
                    variant="flat"
                    startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    size={isMobile ? "sm" : "md"}
                >
                    Back to List
                </Button>
            </Link>
            {canEditInspection && (
                <Link href={route('quality.inspections.edit', inspection.id || 0)}>
                    <Button
                        color="primary"
                        variant="shadow"
                        startContent={<PencilIcon className="w-4 h-4" />}
                        size={isMobile ? "sm" : "md"}
                    >
                        Edit Inspection
                    </Button>
                </Link>
            )}
        </div>
    );

    // Content
    const content = (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Main Details Card */}
            <Card className="border border-divider">
                <CardHeader className="border-b border-divider">
                    <h3 className="text-lg font-semibold">Inspection Details</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-default-500">Inspection ID</span>
                        <span className="font-mono font-medium">
                            INS-{String(inspection.id || 0).padStart(4, '0')}
                        </span>
                    </div>
                    <Divider />
                    <div className="flex justify-between items-center">
                        <span className="text-default-500">Title</span>
                        <span className="font-medium">{inspection.title || 'N/A'}</span>
                    </div>
                    <Divider />
                    <div className="flex justify-between items-center">
                        <span className="text-default-500">Type</span>
                        <Chip 
                            size="sm" 
                            variant="flat" 
                            color={typeColorMap[inspection.type] || 'default'}
                        >
                            {inspection.type?.toUpperCase() || 'N/A'}
                        </Chip>
                    </div>
                    <Divider />
                    <div className="flex justify-between items-center">
                        <span className="text-default-500">Status</span>
                        <Chip 
                            size="sm" 
                            variant="flat" 
                            color={statusColorMap[inspection.status] || 'default'}
                        >
                            {inspection.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </Chip>
                    </div>
                </CardBody>
            </Card>

            {/* Schedule & Location Card */}
            <Card className="border border-divider">
                <CardHeader className="border-b border-divider">
                    <h3 className="text-lg font-semibold">Schedule & Location</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 text-default-400" />
                        <div>
                            <p className="text-sm text-default-500">Scheduled Date</p>
                            <p className="font-medium">
                                {inspection.scheduled_date 
                                    ? dayjs(inspection.scheduled_date).format('DD MMM YYYY, h:mm A')
                                    : 'Not scheduled'}
                            </p>
                        </div>
                    </div>
                    <Divider />
                    <div className="flex items-center gap-3">
                        <MapPinIcon className="w-5 h-5 text-default-400" />
                        <div>
                            <p className="text-sm text-default-500">Location</p>
                            <p className="font-medium">{inspection.location || 'N/A'}</p>
                        </div>
                    </div>
                    <Divider />
                    <div className="flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-default-400" />
                        <div>
                            <p className="text-sm text-default-500">Inspector</p>
                            <p className="font-medium">{inspection.inspector?.name || 'Not assigned'}</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Description Card */}
            <Card className="border border-divider md:col-span-2">
                <CardHeader className="border-b border-divider">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-default-400" />
                        <h3 className="text-lg font-semibold">Description</h3>
                    </div>
                </CardHeader>
                <CardBody>
                    <p className="text-default-700 whitespace-pre-wrap">
                        {inspection.description || 'No description provided.'}
                    </p>
                </CardBody>
            </Card>

            {/* Remarks/Notes Card */}
            {inspection.remarks && (
                <Card className="border border-divider md:col-span-2">
                    <CardHeader className="border-b border-divider">
                        <h3 className="text-lg font-semibold">Remarks</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-700 whitespace-pre-wrap">
                            {inspection.remarks}
                        </p>
                    </CardBody>
                </Card>
            )}
        </div>
    );

    return (
        <>
            <Head title={title || `Inspection #${inspection.id}`} />
            <StandardPageLayout
                title={`Inspection: ${inspection.title || 'Details'}`}
                subtitle={`INS-${String(inspection.id || 0).padStart(4, '0')}`}
                icon={<ClipboardDocumentCheckIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
                iconColor="primary"
                ariaLabel="Inspection Details"
                actions={actionButtons}
                content={content}
            />
        </>
    );
};

InspectionsShow.layout = (page) => <App children={page} />;

export default InspectionsShow;
