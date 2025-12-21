import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
    Chip,
    Divider,
    Card,
    CardBody,
    Input,
    ScrollShadow,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClipboardDocumentCheckIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * RFI Response Status options
 */
const RESPONSE_STATUS_OPTIONS = [
    { value: 'approved', label: 'Approved', color: 'success', description: 'RFI has been approved' },
    { value: 'rejected', label: 'Rejected', color: 'danger', description: 'RFI has been rejected' },
    { value: 'returned', label: 'Returned', color: 'warning', description: 'RFI returned for revision' },
    { value: 'concurred', label: 'Concurred', color: 'primary', description: 'Agreement with RFI' },
    { value: 'not_concurred', label: 'Not Concurred', color: 'secondary', description: 'Disagreement with RFI' },
];

/**
 * BulkResponseStatusModal - Modal for bulk RFI response status update with objection warnings.
 */
const BulkResponseStatusModal = ({
    isOpen,
    onClose,
    selectedWorks = [],
    onSuccess,
}) => {
    const [responseStatus, setResponseStatus] = useState('');
    const [responseDate, setResponseDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('confirm'); // 'confirm', 'objection-decision', 'result'
    const [objectedWorks, setObjectedWorks] = useState([]);
    const [cleanWorks, setCleanWorks] = useState([]);
    const [overrideReason, setOverrideReason] = useState('');
    const [result, setResult] = useState(null);

    // Calculate works with and without objections from selected works
    const { worksWithObjections, worksWithoutObjections } = useMemo(() => {
        const withObjections = selectedWorks.filter(w => (w.active_objections_count || 0) > 0);
        const withoutObjections = selectedWorks.filter(w => (w.active_objections_count || 0) === 0);
        return { worksWithObjections: withObjections, worksWithoutObjections: withoutObjections };
    }, [selectedWorks]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
            setOverrideReason('');
            setResult(null);
            setResponseStatus('');
            setResponseDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const getStatusConfig = (status) => {
        return RESPONSE_STATUS_OPTIONS.find(s => s.value === status) || {};
    };

    const handleSubmit = async (skipObjected = false, overrideObjected = false) => {
        if (selectedWorks.length === 0) {
            showToast.error('No RFIs selected');
            return;
        }

        if (!responseStatus) {
            showToast.error('Please select a response status');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(route('dailyWorks.bulkResponseStatusUpdate'), {
                ids: selectedWorks.map(w => w.id),
                rfi_response_status: responseStatus,
                rfi_response_date: responseDate,
                skip_objected: skipObjected,
                override_objected: overrideObjected,
                override_reason: overrideObjected ? overrideReason : null,
            });

            if (response.data.requires_decision) {
                // Need user decision about objected works
                setObjectedWorks(response.data.objected_works || []);
                setCleanWorks(worksWithoutObjections);
                setStep('objection-decision');
            } else {
                // Success
                setResult(response.data);
                setStep('result');
                showToast.success(response.data.message);
            }
        } catch (error) {
            if (error.response?.data?.requires_decision) {
                setObjectedWorks(error.response.data.objected_works || []);
                setCleanWorks(worksWithoutObjections);
                setStep('objection-decision');
            } else {
                showToast.error(error.response?.data?.error || 'Failed to update RFI response status');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSkipObjected = () => {
        handleSubmit(true, false);
    };

    const handleOverrideObjected = () => {
        if (!overrideReason.trim()) {
            showToast.error('Please provide a reason for overriding objected RFIs');
            return;
        }
        handleSubmit(false, true);
    };

    const handleClose = () => {
        if (step === 'result' && result) {
            onSuccess?.(result);
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="2xl"
            placement="bottom-center"
            isDismissable={step !== 'loading'}
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[100dvh] sm:max-h-[90vh] m-0 sm:m-4 mb-0",
                wrapper: "items-end sm:items-center",
                body: "px-4 sm:px-6 py-4",
                header: "px-4 sm:px-6",
                footer: "px-4 sm:px-6",
            }}
        >
            <ModalContent>
                {(onCloseModal) => (
                    <>
                        <ModalHeader className="flex flex-col gap-2 pb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <ClipboardDocumentCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                                <span className="font-bold text-sm sm:text-base">Bulk RFI Response Status</span>
                                <Chip size="sm" color="primary" variant="flat">
                                    {selectedWorks.length} RFI{selectedWorks.length !== 1 ? 's' : ''}
                                </Chip>
                            </div>
                        </ModalHeader>

                        <ModalBody className="py-4">
                            {/* Step 1: Confirm submission */}
                            {step === 'confirm' && (
                                <div className="space-y-4">
                                    {/* Response Status */}
                                    <Select
                                        label="Response Status"
                                        placeholder="Select response status"
                                        selectedKeys={responseStatus ? [responseStatus] : []}
                                        onSelectionChange={(keys) => setResponseStatus(Array.from(keys)[0])}
                                        startContent={<ClipboardDocumentCheckIcon className="w-4 h-4 text-default-400" />}
                                        isRequired
                                    >
                                        {RESPONSE_STATUS_OPTIONS.map((option) => (
                                            <SelectItem 
                                                key={option.value} 
                                                value={option.value}
                                                description={option.description}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    {/* Response Date */}
                                    <Input
                                        type="date"
                                        label="Response Date"
                                        value={responseDate}
                                        onChange={(e) => setResponseDate(e.target.value)}
                                        startContent={<CalendarDaysIcon className="w-4 h-4 text-default-400" />}
                                    />

                                    {/* Summary */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Card className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                                            <CardBody className="p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircleSolid className="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0" />
                                                    <span className="font-semibold text-xs sm:text-sm text-success-700 dark:text-success-400">
                                                        Ready to Update
                                                    </span>
                                                </div>
                                                <p className="text-xl sm:text-2xl font-bold text-success-800 dark:text-success-300">
                                                    {worksWithoutObjections.length}
                                                </p>
                                                <p className="text-xs text-success-600 dark:text-success-500">
                                                    RFIs without active objections
                                                </p>
                                            </CardBody>
                                        </Card>

                                        <Card className={`border ${worksWithObjections.length > 0 
                                            ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800' 
                                            : 'bg-default-50 dark:bg-default-900/20 border-default-200 dark:border-default-800'}`}>
                                            <CardBody className="p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ShieldExclamationIcon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${worksWithObjections.length > 0 ? 'text-warning' : 'text-default-400'}`} />
                                                    <span className={`font-semibold text-xs sm:text-sm ${worksWithObjections.length > 0 ? 'text-warning-700 dark:text-warning-400' : 'text-default-500'}`}>
                                                        With Objections
                                                    </span>
                                                </div>
                                                <p className={`text-xl sm:text-2xl font-bold ${worksWithObjections.length > 0 ? 'text-warning-800 dark:text-warning-300' : 'text-default-400'}`}>
                                                    {worksWithObjections.length}
                                                </p>
                                                <p className={`text-xs ${worksWithObjections.length > 0 ? 'text-warning-600 dark:text-warning-500' : 'text-default-400'}`}>
                                                    RFIs with active objections
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* Objection Warning */}
                                    {worksWithObjections.length > 0 && (
                                        <div className="bg-warning-100 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-700 rounded-lg p-3 sm:p-4">
                                            <div className="flex items-start gap-2 sm:gap-3">
                                                <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-warning-800 dark:text-warning-300 text-xs sm:text-sm">
                                                        {worksWithObjections.length} RFI{worksWithObjections.length !== 1 ? 's have' : ' has'} active objections
                                                    </p>
                                                    <p className="text-xs text-warning-700 dark:text-warning-400 mt-1">
                                                        You'll be asked to skip or override these RFIs in the next step.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected RFIs List */}
                                    <div>
                                        <p className="text-sm font-medium mb-2">Selected RFIs:</p>
                                        <ScrollShadow className="max-h-48">
                                            <div className="space-y-2">
                                                {selectedWorks.map((work) => (
                                                    <div 
                                                        key={work.id} 
                                                        className={`flex items-center justify-between p-2 rounded-lg text-xs sm:text-sm border ${
                                                            (work.active_objections_count || 0) > 0
                                                                ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700'
                                                                : 'bg-default-50 dark:bg-default-900/10 border-default-200 dark:border-default-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <DocumentTextIcon className="w-3 h-3 sm:w-4 sm:h-4 text-default-500 flex-shrink-0" />
                                                            <span className="font-medium truncate">{work.number}</span>
                                                            {work.location && (
                                                                <span className="text-xs text-default-400 flex items-center gap-1 hidden sm:flex">
                                                                    <MapPinIcon className="w-3 h-3" />
                                                                    {work.location}
                                                                </span>
                                                            )}
                                                            {work.rfi_response_status && (
                                                                <Chip size="sm" color={getStatusConfig(work.rfi_response_status).color || 'default'} variant="flat" className="hidden sm:flex">
                                                                    {getStatusConfig(work.rfi_response_status).label || work.rfi_response_status}
                                                                </Chip>
                                                            )}
                                                        </div>
                                                        {(work.active_objections_count || 0) > 0 && (
                                                            <Chip size="sm" color="warning" variant="flat" className="text-[10px] sm:text-xs flex-shrink-0">
                                                                <span className="hidden sm:inline">{work.active_objections_count} objection{work.active_objections_count !== 1 ? 's' : ''}</span>
                                                                <span className="sm:hidden">{work.active_objections_count}</span>
                                                            </Chip>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollShadow>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Objection Decision */}
                            {step === 'objection-decision' && (
                                <div className="space-y-4">
                                    <div className="bg-warning-100 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-700 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <ShieldExclamationIcon className="w-5 h-5 sm:w-6 sm:h-6 text-warning-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-warning-800 dark:text-warning-300 text-sm sm:text-base">
                                                    Action Required: RFIs with Active Objections
                                                </p>
                                                <p className="text-xs sm:text-sm text-warning-700 dark:text-warning-400 mt-1">
                                                    The following {objectedWorks.length} RFI{objectedWorks.length !== 1 ? 's have' : ' has'} active objections. 
                                                    Choose how to proceed:
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selected Status Display */}
                                    <div className="flex items-center gap-2 p-2 sm:p-3 bg-default-100 dark:bg-default-800/50 rounded-lg">
                                        <span className="text-xs sm:text-sm text-default-600">Setting status to:</span>
                                        <Chip size="sm" color={getStatusConfig(responseStatus).color || 'default'} variant="solid">
                                            {getStatusConfig(responseStatus).label || responseStatus}
                                        </Chip>
                                    </div>

                                    {/* Objected RFIs List */}
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium mb-2">RFIs with Objections:</p>
                                        <ScrollShadow className="max-h-32">
                                            <div className="space-y-2">
                                                {objectedWorks.map((work) => (
                                                    <div 
                                                        key={work.id} 
                                                        className="flex items-center justify-between p-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-xs sm:text-sm border border-warning-200 dark:border-warning-700"
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <ShieldExclamationIcon className="w-3 h-3 sm:w-4 sm:h-4 text-warning-600 flex-shrink-0" />
                                                            <span className="font-medium truncate">{work.number}</span>
                                                            <span className="text-xs text-default-400 hidden sm:inline truncate">{work.location}</span>
                                                        </div>
                                                        <Chip size="sm" color="warning" variant="flat" className="text-[10px] sm:text-xs flex-shrink-0">
                                                            {work.active_objections_count} objection{work.active_objections_count !== 1 ? 's' : ''}
                                                        </Chip>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollShadow>
                                    </div>

                                    <Divider />

                                    {/* Override Reason */}
                                    <div>
                                        <Textarea
                                            label="Override Reason (required to update objected RFIs)"
                                            placeholder="Explain why you're updating RFIs that have active objections..."
                                            value={overrideReason}
                                            onChange={(e) => setOverrideReason(e.target.value)}
                                            minRows={2}
                                            description="This reason will be logged for audit purposes."
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Card 
                                            isPressable 
                                            onPress={handleSkipObjected}
                                            className="border-2 border-default-200 hover:border-primary transition-colors"
                                        >
                                            <CardBody className="p-3 sm:p-4 text-center">
                                                <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-success mx-auto mb-2" />
                                                <p className="font-semibold text-sm sm:text-base">Skip Objected RFIs</p>
                                                <p className="text-xs text-default-500 mt-1">
                                                    Update only {cleanWorks.length} RFI{cleanWorks.length !== 1 ? 's' : ''} without objections
                                                </p>
                                            </CardBody>
                                        </Card>

                                        <Card 
                                            isPressable 
                                            onPress={handleOverrideObjected}
                                            isDisabled={!overrideReason.trim()}
                                            className={`border-2 transition-colors ${overrideReason.trim() ? 'border-warning-200 hover:border-warning' : 'border-default-200 opacity-60'}`}
                                        >
                                            <CardBody className="p-3 sm:p-4 text-center">
                                                <ExclamationTriangleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-warning mx-auto mb-2" />
                                                <p className="font-semibold text-sm sm:text-base">Override & Update All</p>
                                                <p className="text-xs text-default-500 mt-1">
                                                    Update all {selectedWorks.length} RFI{selectedWorks.length !== 1 ? 's' : ''} including objected
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Result */}
                            {step === 'result' && result && (
                                <div className="space-y-4">
                                    {/* Success Summary */}
                                    <div className="text-center py-4">
                                        <CheckCircleSolid className="w-12 h-12 sm:w-16 sm:h-16 text-success mx-auto mb-3" />
                                        <h3 className="text-lg sm:text-xl font-bold text-success-700 dark:text-success-400">
                                            Bulk Update Complete
                                        </h3>
                                        <p className="text-xs sm:text-sm text-default-500 mt-1">{result.message}</p>
                                    </div>

                                    {/* Results Grid */}
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        <Card className="bg-success-50 dark:bg-success-900/20 border border-success-200">
                                            <CardBody className="p-2 sm:p-3 text-center">
                                                <p className="text-xl sm:text-2xl font-bold text-success">{result.updated_count}</p>
                                                <p className="text-[10px] sm:text-xs text-success-600">Updated</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200">
                                            <CardBody className="p-2 sm:p-3 text-center">
                                                <p className="text-xl sm:text-2xl font-bold text-warning">{result.skipped_count}</p>
                                                <p className="text-[10px] sm:text-xs text-warning-600">Skipped</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200">
                                            <CardBody className="p-2 sm:p-3 text-center">
                                                <p className="text-xl sm:text-2xl font-bold text-danger">{result.failed_count}</p>
                                                <p className="text-[10px] sm:text-xs text-danger-600">Failed</p>
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* Updated List */}
                                    {result.updated?.length > 0 && (
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium mb-2 text-success-700 flex items-center gap-1">
                                                <CheckCircleSolid className="w-3 h-3 sm:w-4 sm:h-4" />
                                                Updated Successfully ({result.updated.length})
                                            </p>
                                            <ScrollShadow className="max-h-24">
                                                <div className="flex flex-wrap gap-1">
                                                    {result.updated.map((work) => (
                                                        <Chip key={work.id} size="sm" color="success" variant="flat">
                                                            {work.number}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </ScrollShadow>
                                        </div>
                                    )}

                                    {/* Skipped List */}
                                    {result.skipped?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2 text-warning-700 flex items-center gap-1">
                                                <ShieldExclamationIcon className="w-4 h-4" />
                                                Skipped (Have Objections) ({result.skipped.length})
                                            </p>
                                            <ScrollShadow className="max-h-24">
                                                <div className="flex flex-wrap gap-1">
                                                    {result.skipped.map((work) => (
                                                        <Chip key={work.id} size="sm" color="warning" variant="flat">
                                                            {work.number}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </ScrollShadow>
                                        </div>
                                    )}

                                    {/* Failed List */}
                                    {result.failed?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2 text-danger-700 flex items-center gap-1">
                                                <XCircleIcon className="w-4 h-4" />
                                                Failed ({result.failed.length})
                                            </p>
                                            <ScrollShadow className="max-h-24">
                                                <div className="flex flex-wrap gap-1">
                                                    {result.failed.map((work) => (
                                                        <Chip key={work.id} size="sm" color="danger" variant="flat">
                                                            {work.number}: {work.error}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </ScrollShadow>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ModalBody>

                        <ModalFooter className="flex flex-col-reverse sm:flex-row gap-2 py-3 sm:py-4">
                            {step === 'confirm' && (
                                <>
                                    <Button variant="light" onPress={handleClose} className="w-full sm:w-auto">
                                        Cancel
                                    </Button>
                                    <Button 
                                        color="primary" 
                                        onPress={() => handleSubmit(false, false)}
                                        isLoading={loading}
                                        isDisabled={!responseStatus}
                                        startContent={!loading && <ClipboardDocumentCheckIcon className="w-4 h-4" />}
                                        className="w-full sm:w-auto"
                                    >
                                        <span className="hidden sm:inline">Update {selectedWorks.length} RFI{selectedWorks.length !== 1 ? 's' : ''}</span>
                                        <span className="sm:hidden">Update ({selectedWorks.length})</span>
                                    </Button>
                                </>
                            )}

                            {step === 'objection-decision' && (
                                <Button variant="light" onPress={() => setStep('confirm')} className="w-full sm:w-auto">
                                    Back
                                </Button>
                            )}

                            {step === 'result' && (
                                <Button color="primary" onPress={handleClose} className="w-full sm:w-auto">
                                    Done
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default BulkResponseStatusModal;
