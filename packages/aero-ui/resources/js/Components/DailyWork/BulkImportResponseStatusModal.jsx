import React, { useState, useEffect, useRef } from 'react';
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
    ScrollShadow,
} from "@heroui/react";
import {
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentArrowUpIcon,
    ArrowDownTrayIcon,
    DocumentArrowDownIcon,
    QuestionMarkCircleIcon,
    ArrowPathIcon,
    ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { getThemeRadius } from '@/Hooks/useThemeRadius';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * Response Status config for display
 */
const RESPONSE_STATUS_CONFIG = {
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'danger' },
    returned: { label: 'Returned', color: 'warning' },
    concurred: { label: 'Concurred', color: 'primary' },
    not_concurred: { label: 'Not Concurred', color: 'secondary' },
};

/**
 * BulkImportResponseStatusModal - Modal for importing RFI response statuses from Excel.
 * Excel should have three columns: RFI Number, Response Status, and Response Date.
 */
const BulkImportResponseStatusModal = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('upload'); // 'upload', 'validation-errors', 'objection-decision', 'result'
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [objectedWorks, setObjectedWorks] = useState([]);
    const [overrideReason, setOverrideReason] = useState('');
    const [result, setResult] = useState(null);
    const [parseSummary, setParseSummary] = useState(null);
    const [validationErrors, setValidationErrors] = useState(null);
    const fileInputRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('upload');
            setFile(null);
            setOverrideReason('');
            setResult(null);
            setParseSummary(null);
            setValidationErrors(null);
            setObjectedWorks([]);
        }
    }, [isOpen]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        const validExtensions = ['.xlsx', '.xls', '.csv'];

        const fileName = selectedFile.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

        if (!validTypes.includes(selectedFile.type) && !hasValidExtension) {
            showToast.error('Please upload an Excel file (.xlsx, .xls) or CSV file');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            showToast.error('File size should be less than 10MB');
            return;
        }

        setFile(selectedFile);
    };

    const handleUpload = async (skipObjected = false, overrideObjected = false) => {
        if (!file) {
            showToast.error('Please select a file');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('skip_objected', skipObjected ? '1' : '0');
            formData.append('override_objected', overrideObjected ? '1' : '0');
            if (overrideObjected && overrideReason) {
                formData.append('override_reason', overrideReason);
            }

            const response = await axios.post(route('dailyWorks.bulkImportResponseStatus'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.requires_decision) {
                // Need user decision about objected works
                setObjectedWorks(response.data.objected_works || []);
                setParseSummary({
                    total: response.data.total_count,
                    objected: response.data.objected_count,
                    clean: response.data.clean_count,
                    notFound: response.data.not_found_count || 0,
                });
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
                setParseSummary({
                    total: error.response.data.total_count,
                    objected: error.response.data.objected_count,
                    clean: error.response.data.clean_count,
                    notFound: error.response.data.not_found_count || 0,
                });
                setStep('objection-decision');
            } else if (error.response?.data?.validation_errors) {
                // Show validation errors step
                setValidationErrors({
                    error: error.response?.data?.message || 'Validation errors found',
                    errors: error.response?.data?.validation_errors || [],
                });
                setStep('validation-errors');
            } else {
                showToast.error(error.response?.data?.error || 'Failed to import file');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSkipObjected = () => {
        handleUpload(true, false);
    };

    const handleOverrideObjected = () => {
        if (!overrideReason.trim()) {
            showToast.error('Please provide a reason for overriding objected RFIs');
            return;
        }
        handleUpload(false, true);
    };

    const handleDownloadTemplate = () => {
        window.location.href = route('dailyWorks.downloadResponseStatusTemplate');
    };

    const handleClose = () => {
        if (step === 'result' && result) {
            onSuccess?.(result);
        }
        onClose();
    };

    const handleDownloadSkipped = () => {
        if (!result?.skipped?.length) return;

        const csvContent = [
            ['RFI Number', 'Objections Count'].join(','),
            ...result.skipped.map(w => [w.number, w.active_objections_count || ''].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `skipped_rfis_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getStatusChip = (status) => {
        const config = RESPONSE_STATUS_CONFIG[status] || { label: status, color: 'default' };
        return (
            <Chip size="sm" color={config.color} variant="flat">
                {config.label}
            </Chip>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="2xl"
            placement="bottom-center"
            isDismissable={!loading}
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
                                <DocumentArrowDownIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                                <span className="font-bold text-sm sm:text-base">Import RFI Response Status</span>
                            </div>
                            <p className="text-xs text-default-500 font-normal">
                                Upload an Excel file with RFI numbers, response status, and date
                            </p>
                        </ModalHeader>

                        <ModalBody className="py-4">
                            {/* Step 1: Upload file */}
                            {step === 'upload' && (
                                <div className="space-y-3 sm:space-y-4">
                                    {/* Template download */}
                                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <QuestionMarkCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-primary-800 dark:text-primary-300 text-xs sm:text-sm">
                                                    Need a template?
                                                </p>
                                                <p className="text-xs text-primary-700 dark:text-primary-400 mt-1">
                                                    Download the Excel template with the correct format (RFI Number, Response Status, Response Date).
                                                </p>
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    variant="flat"
                                                    className="mt-2 w-full sm:w-auto"
                                                    radius={getThemeRadius()}
                                                    onPress={handleDownloadTemplate}
                                                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                >
                                                    Download Template
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File drop zone */}
                                    <div
                                        className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                                            dragActive
                                                ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                                                : file
                                                ? 'border-success bg-success-50 dark:bg-success-900/20'
                                                : 'border-default-300 dark:border-default-600 hover:border-primary hover:bg-default-50 dark:hover:bg-default-900/50'
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        {file ? (
                                            <div className="space-y-2">
                                                <CheckCircleSolid className="w-10 h-10 sm:w-12 sm:h-12 text-success mx-auto" />
                                                <p className="font-medium text-success-700 dark:text-success-400 text-sm sm:text-base truncate px-4">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-default-500">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onPress={() => setFile(null)}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <DocumentArrowUpIcon className="w-10 h-10 sm:w-12 sm:h-12 text-default-400 mx-auto" />
                                                <p className="font-medium text-default-700 dark:text-default-300 text-sm sm:text-base">
                                                    Drag and drop your file here
                                                </p>
                                                <p className="text-xs sm:text-sm text-default-500">or</p>
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    variant="flat"
                                                    radius={getThemeRadius()}
                                                    onPress={() => fileInputRef.current?.click()}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Browse Files
                                                </Button>
                                                <p className="text-xs text-default-400 mt-2">
                                                    Supported: .xlsx, .xls, .csv (max 10MB)
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Format info */}
                                    <div className="bg-default-100 dark:bg-default-800/50 rounded-lg p-3 sm:p-4">
                                        <p className="font-medium text-xs sm:text-sm mb-2">Expected Format:</p>
                                        {/* Allow horizontal scroll on mobile for table readability */}
                                        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                                            <table className="text-xs w-full">
                                                <thead>
                                                    <tr className="border-b border-default-200">
                                                        <th className="text-left py-2 px-2 sm:px-3 font-semibold">RFI Number</th>
                                                        <th className="text-left py-2 px-2 sm:px-3 font-semibold">Response Status</th>
                                                        <th className="text-left py-2 px-2 sm:px-3 font-semibold">Response Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b border-default-100">
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">RFI-001</td>
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">approved</td>
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">2024-12-20</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">RFI-002</td>
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">rejected</td>
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">2024-12-21</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-xs text-default-500 mt-2">
                                            Valid statuses: <span className="font-mono">approved, rejected, returned, concurred, not_concurred</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Validation Errors Step */}
                            {step === 'validation-errors' && validationErrors && (
                                <div className="space-y-4">
                                    {/* Error Header */}
                                    <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-danger-600 dark:text-danger-400">
                                            <ExclamationTriangleIcon className="w-5 h-5" />
                                            <span className="font-semibold">{validationErrors.error}</span>
                                        </div>
                                        <p className="text-sm text-danger-600/80 dark:text-danger-400/80 mt-2">
                                            Please check your file and try again.
                                        </p>
                                    </div>

                                    {/* Error List */}
                                    {validationErrors.errors?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-medium text-sm text-danger-600 flex items-center gap-2">
                                                <XCircleIcon className="w-4 h-4" />
                                                Validation Errors ({validationErrors.errors.length})
                                            </p>
                                            <ScrollShadow className="max-h-48">
                                                <div className="space-y-1">
                                                    {validationErrors.errors.map((error, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className="p-2 rounded-lg text-sm bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700"
                                                        >
                                                            <span className="text-danger-600">{error}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollShadow>
                                        </div>
                                    )}

                                    {/* Try Again Button */}
                                    <div className="flex justify-center pt-2">
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            onPress={() => {
                                                setStep('upload');
                                                setFile(null);
                                                setValidationErrors(null);
                                            }}
                                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                                        >
                                            Try Different File
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Objection decision */}
                            {step === 'objection-decision' && (
                                <div className="space-y-4">
                                    {/* Parse Summary */}
                                    {parseSummary && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <Card className="bg-default-50 dark:bg-default-900/20 border border-default-200">
                                                <CardBody className="p-3 text-center">
                                                    <p className="text-xl font-bold text-default-700">{parseSummary.total}</p>
                                                    <p className="text-xs text-default-500">Total Found</p>
                                                </CardBody>
                                            </Card>
                                            <Card className="bg-success-50 dark:bg-success-900/20 border border-success-200">
                                                <CardBody className="p-3 text-center">
                                                    <p className="text-xl font-bold text-success">{parseSummary.clean}</p>
                                                    <p className="text-xs text-success-600">Ready</p>
                                                </CardBody>
                                            </Card>
                                            <Card className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200">
                                                <CardBody className="p-3 text-center">
                                                    <p className="text-xl font-bold text-warning">{parseSummary.objected}</p>
                                                    <p className="text-xs text-warning-600">Objected</p>
                                                </CardBody>
                                            </Card>
                                            <Card className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200">
                                                <CardBody className="p-3 text-center">
                                                    <p className="text-xl font-bold text-danger">{parseSummary.notFound}</p>
                                                    <p className="text-xs text-danger-600">Not Found</p>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    )}

                                    {/* Warning message */}
                                    <div className="bg-warning-100 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-700 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <ShieldExclamationIcon className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-warning-800 dark:text-warning-300 text-sm">
                                                    {objectedWorks.length} RFI{objectedWorks.length !== 1 ? 's have' : ' has'} active objections
                                                </p>
                                                <p className="text-xs text-warning-700 dark:text-warning-400 mt-1">
                                                    Choose how to handle these RFIs below.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Objected RFIs list */}
                                    <div>
                                        <p className="text-sm font-medium mb-2">RFIs with Objections:</p>
                                        <ScrollShadow className="max-h-32">
                                            <div className="space-y-1">
                                                {objectedWorks.map((work, idx) => (
                                                    <div 
                                                        key={work.id || idx} 
                                                        className="flex items-center justify-between p-2 rounded-lg text-sm bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <ShieldExclamationIcon className="w-4 h-4 text-warning-600 flex-shrink-0" />
                                                            <span className="font-medium">{work.number}</span>
                                                            {work.status && getStatusChip(work.status)}
                                                        </div>
                                                        <Chip size="sm" color="warning" variant="flat">
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
                                    <div className="grid grid-cols-2 gap-3">
                                        <Card 
                                            isPressable 
                                            onPress={handleSkipObjected}
                                            className="border-2 border-default-200 hover:border-primary transition-colors"
                                        >
                                            <CardBody className="p-4 text-center">
                                                <CheckCircleIcon className="w-8 h-8 text-success mx-auto mb-2" />
                                                <p className="font-semibold">Skip Objected RFIs</p>
                                                <p className="text-xs text-default-500 mt-1">
                                                    Update only {parseSummary?.clean || 0} RFI{(parseSummary?.clean || 0) !== 1 ? 's' : ''} without objections
                                                </p>
                                            </CardBody>
                                        </Card>

                                        <Card 
                                            isPressable 
                                            onPress={handleOverrideObjected}
                                            isDisabled={!overrideReason.trim()}
                                            className={`border-2 transition-colors ${overrideReason.trim() ? 'border-warning-200 hover:border-warning' : 'border-default-200 opacity-60'}`}
                                        >
                                            <CardBody className="p-4 text-center">
                                                <ExclamationTriangleIcon className="w-8 h-8 text-warning mx-auto mb-2" />
                                                <p className="font-semibold">Override & Update All</p>
                                                <p className="text-xs text-default-500 mt-1">
                                                    Update all {parseSummary?.total || 0} RFI{(parseSummary?.total || 0) !== 1 ? 's' : ''} including objected
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
                                        <CheckCircleSolid className="w-16 h-16 text-success mx-auto mb-3" />
                                        <h3 className="text-xl font-bold text-success-700 dark:text-success-400">
                                            Import Complete
                                        </h3>
                                        <p className="text-default-500 mt-1">{result.message}</p>
                                    </div>

                                    {/* Results Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <Card className="bg-success-50 dark:bg-success-900/20 border border-success-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-2xl font-bold text-success">{result.updated_count}</p>
                                                <p className="text-xs text-success-600">Updated</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-2xl font-bold text-warning">{result.skipped_count}</p>
                                                <p className="text-xs text-warning-600">Skipped</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-2xl font-bold text-danger">{result.failed_count}</p>
                                                <p className="text-xs text-danger-600">Failed</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-default-50 dark:bg-default-900/20 border border-default-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-2xl font-bold text-default-600">{result.not_found_count}</p>
                                                <p className="text-xs text-default-500">Not Found</p>
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* Updated List */}
                                    {result.updated?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2 text-success-700 flex items-center gap-1">
                                                <CheckCircleSolid className="w-4 h-4" />
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
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium text-warning-700 flex items-center gap-1">
                                                    <ShieldExclamationIcon className="w-4 h-4" />
                                                    Skipped (Have Objections) ({result.skipped.length})
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="warning"
                                                    onPress={handleDownloadSkipped}
                                                    startContent={<ArrowDownTrayIcon className="w-3 h-3" />}
                                                >
                                                    Download
                                                </Button>
                                            </div>
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
                                                    {result.failed.map((work, idx) => (
                                                        <Chip key={work.id || idx} size="sm" color="danger" variant="flat">
                                                            {work.number}: {work.error}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </ScrollShadow>
                                        </div>
                                    )}

                                    {/* Not Found List */}
                                    {result.not_found?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2 text-default-600 flex items-center gap-1">
                                                <QuestionMarkCircleIcon className="w-4 h-4" />
                                                Not Found ({result.not_found.length})
                                            </p>
                                            <ScrollShadow className="max-h-24">
                                                <div className="flex flex-wrap gap-1">
                                                    {result.not_found.map((item, idx) => (
                                                        <Chip key={idx} size="sm" color="default" variant="flat">
                                                            {item.rfi_number}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </ScrollShadow>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            {step === 'upload' && (
                                <>
                                    <Button variant="light" onPress={handleClose}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        color="primary" 
                                        onPress={() => handleUpload(false, false)}
                                        isLoading={loading}
                                        isDisabled={!file}
                                        startContent={!loading && <ClipboardDocumentCheckIcon className="w-4 h-4" />}
                                    >
                                        Import & Update
                                    </Button>
                                </>
                            )}

                            {step === 'validation-errors' && (
                                <Button variant="light" onPress={handleClose}>
                                    Close
                                </Button>
                            )}

                            {step === 'objection-decision' && (
                                <Button variant="light" onPress={() => setStep('upload')}>
                                    Back
                                </Button>
                            )}

                            {step === 'result' && (
                                <Button color="primary" onPress={handleClose}>
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

export default BulkImportResponseStatusModal;
