import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Button, Chip } from "@heroui/react";
import {
    ClipboardDocumentCheckIcon, ArrowLeftIcon, CalendarDaysIcon,
    MapPinIcon, UserIcon, DocumentTextIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const statusColorMap = {
    scheduled: 'primary',
    'in-progress': 'warning',
    completed: 'success',
    cancelled: 'danger',
};

const DetailRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b border-divider last:border-0">
        <span className="sm:w-48 shrink-0 text-sm font-medium text-default-500">{label}</span>
        <span className="text-sm text-foreground">{value ?? '—'}</span>
    </div>
);

const SafetyInspectionsShow = ({ title, inspection }) => {
    const themeRadius = useThemeRadius();

    return (
        <>
            <Head title={title ?? `Inspection: ${inspection?.title}`} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Inspection Detail">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg,
                                        var(--theme-content1, #FAFAFA) 20%,
                                        var(--theme-content2, #F4F4F5) 10%,
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                    color: `var(--theme-foreground)`,
                                }}
                            >
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg,
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%,
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className="p-6 w-full">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className="p-3 rounded-xl"
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ClipboardDocumentCheckIcon
                                                        className="w-8 h-8"
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-bold">{inspection?.title}</h4>
                                                    <p className="text-sm text-default-500">Inspection Details</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {inspection?.status && (
                                                    <Chip
                                                        color={statusColorMap[inspection.status] ?? 'default'}
                                                        variant="flat"
                                                        className="capitalize"
                                                    >
                                                        {inspection.status.replace('-', ' ')}
                                                    </Chip>
                                                )}
                                                <Button
                                                    variant="flat"
                                                    startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                                    onPress={() => router.visit(route('hrm.safety.inspections.index'))}
                                                    radius={themeRadius}
                                                >
                                                    Back to Inspections
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <div className="max-w-3xl">
                                        <DetailRow label="Title" value={inspection?.title} />
                                        <DetailRow label="Department" value={inspection?.department?.name} />
                                        <DetailRow label="Inspection Date" value={inspection?.inspection_date} />
                                        <DetailRow label="Location" value={inspection?.location} />
                                        <DetailRow label="Inspector" value={inspection?.inspector?.name} />
                                        <DetailRow label="Follow-up Date" value={inspection?.follow_up_date} />
                                        <DetailRow label="Findings" value={inspection?.findings} />
                                        <DetailRow label="Recommendations" value={inspection?.recommendations} />
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

SafetyInspectionsShow.layout = (page) => <App children={page} />;
export default SafetyInspectionsShow;
