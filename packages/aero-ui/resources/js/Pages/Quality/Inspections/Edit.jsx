import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Textarea,
} from "@heroui/react";
import {
    ClipboardDocumentCheckIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { showToast } from '@/utils/toastUtils.jsx';

const InspectionsEdit = ({ title, inspection = {}, inspectors = [], projects = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    
    // Manual responsive state management (HRMAC pattern)
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    // HRMAC permissions
    const { canUpdate, isSuperAdmin } = useHRMAC();
    const canEditInspection = canUpdate('quality.inspections') || isSuperAdmin();

    // Form state
    const [formData, setFormData] = useState({
        title: inspection.title || '',
        type: inspection.type || '',
        description: inspection.description || '',
        location: inspection.location || '',
        scheduled_date: inspection.scheduled_date || '',
        inspector_id: inspection.inspector_id ? String(inspection.inspector_id) : '',
        project_id: inspection.project_id ? String(inspection.project_id) : '',
        status: inspection.status || 'pending',
        remarks: inspection.remarks || '',
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Handle input change
    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: null }));
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        
        router.put(route('quality.inspections.update', inspection.id), formData, {
            onSuccess: () => {
                showToast.promise(Promise.resolve(), {
                    loading: 'Updating inspection...',
                    success: 'Inspection updated successfully!',
                    error: 'Failed to update inspection'
                });
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    // Action buttons
    const actionButtons = (
        <div className="flex gap-2 flex-wrap">
            <Link href={route('quality.inspections.show', inspection.id || 0)}>
                <Button
                    variant="flat"
                    startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    size={isMobile ? "sm" : "md"}
                >
                    Cancel
                </Button>
            </Link>
            <Button
                color="primary"
                variant="shadow"
                onPress={handleSubmit}
                isLoading={processing}
                isDisabled={!canEditInspection}
                size={isMobile ? "sm" : "md"}
            >
                Save Changes
            </Button>
        </div>
    );

    // Content
    const content = (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border border-divider">
                <CardHeader className="border-b border-divider">
                    <h3 className="text-lg font-semibold">Inspection Information</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Input
                            label="Title"
                            placeholder="Enter inspection title"
                            value={formData.title}
                            onValueChange={(value) => handleChange('title', value)}
                            isInvalid={!!errors.title}
                            errorMessage={errors.title}
                            isRequired
                            radius={themeRadius}
                        />
                        <Select
                            label="Type"
                            placeholder="Select inspection type"
                            selectedKeys={formData.type ? [formData.type] : []}
                            onSelectionChange={(keys) => handleChange('type', Array.from(keys)[0] || '')}
                            isInvalid={!!errors.type}
                            errorMessage={errors.type}
                            isRequired
                            radius={themeRadius}
                        >
                            <SelectItem key="wir">Work Inspection Request (WIR)</SelectItem>
                            <SelectItem key="itp">Inspection & Test Plan (ITP)</SelectItem>
                            <SelectItem key="checklist">Smart Checklist</SelectItem>
                        </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Select
                            label="Status"
                            placeholder="Select status"
                            selectedKeys={formData.status ? [formData.status] : []}
                            onSelectionChange={(keys) => handleChange('status', Array.from(keys)[0] || '')}
                            isInvalid={!!errors.status}
                            errorMessage={errors.status}
                            isRequired
                            radius={themeRadius}
                        >
                            <SelectItem key="pending">Pending</SelectItem>
                            <SelectItem key="scheduled">Scheduled</SelectItem>
                            <SelectItem key="in_progress">In Progress</SelectItem>
                            <SelectItem key="approved">Approved</SelectItem>
                            <SelectItem key="rejected">Rejected</SelectItem>
                        </Select>
                        <div />
                    </div>
                    <Textarea
                        label="Description"
                        placeholder="Enter inspection description"
                        value={formData.description}
                        onValueChange={(value) => handleChange('description', value)}
                        isInvalid={!!errors.description}
                        errorMessage={errors.description}
                        minRows={3}
                        radius={themeRadius}
                    />
                </CardBody>
            </Card>

            <Card className="border border-divider">
                <CardHeader className="border-b border-divider">
                    <h3 className="text-lg font-semibold">Schedule & Assignment</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Input
                            type="datetime-local"
                            label="Scheduled Date & Time"
                            value={formData.scheduled_date}
                            onValueChange={(value) => handleChange('scheduled_date', value)}
                            isInvalid={!!errors.scheduled_date}
                            errorMessage={errors.scheduled_date}
                            radius={themeRadius}
                        />
                        <Input
                            label="Location"
                            placeholder="Enter inspection location"
                            value={formData.location}
                            onValueChange={(value) => handleChange('location', value)}
                            isInvalid={!!errors.location}
                            errorMessage={errors.location}
                            radius={themeRadius}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Select
                            label="Inspector"
                            placeholder="Select inspector"
                            selectedKeys={formData.inspector_id ? [formData.inspector_id] : []}
                            onSelectionChange={(keys) => handleChange('inspector_id', Array.from(keys)[0] || '')}
                            isInvalid={!!errors.inspector_id}
                            errorMessage={errors.inspector_id}
                            radius={themeRadius}
                        >
                            {inspectors.map(inspector => (
                                <SelectItem key={String(inspector.id)}>{inspector.name}</SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="Project"
                            placeholder="Select project (optional)"
                            selectedKeys={formData.project_id ? [formData.project_id] : []}
                            onSelectionChange={(keys) => handleChange('project_id', Array.from(keys)[0] || '')}
                            isInvalid={!!errors.project_id}
                            errorMessage={errors.project_id}
                            radius={themeRadius}
                        >
                            {projects.map(project => (
                                <SelectItem key={String(project.id)}>{project.name}</SelectItem>
                            ))}
                        </Select>
                    </div>
                </CardBody>
            </Card>

            <Card className="border border-divider">
                <CardHeader className="border-b border-divider">
                    <h3 className="text-lg font-semibold">Additional Notes</h3>
                </CardHeader>
                <CardBody>
                    <Textarea
                        label="Remarks"
                        placeholder="Enter any additional remarks or notes"
                        value={formData.remarks}
                        onValueChange={(value) => handleChange('remarks', value)}
                        isInvalid={!!errors.remarks}
                        errorMessage={errors.remarks}
                        minRows={3}
                        radius={themeRadius}
                    />
                </CardBody>
            </Card>
        </form>
    );

    return (
        <>
            <Head title={title || `Edit Inspection #${inspection.id}`} />
            <StandardPageLayout
                title="Edit Inspection"
                subtitle={`INS-${String(inspection.id || 0).padStart(4, '0')}: ${inspection.title || ''}`}
                icon={<ClipboardDocumentCheckIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
                iconColor="primary"
                ariaLabel="Edit Inspection Form"
                actions={actionButtons}
                content={content}
            />
        </>
    );
};

InspectionsEdit.layout = (page) => <App children={page} />;

export default InspectionsEdit;
