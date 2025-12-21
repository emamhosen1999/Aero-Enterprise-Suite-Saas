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
    Progress,
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
    ExclamationCircleIcon,
    QuestionMarkCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { getThemeRadius } from '@/Hooks/useThemeRadius';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * BulkImportSubmitModal - Modal for importing RFI submission dates from Excel.
 * Excel should have two columns: RFI Number and Submission Date.
 */
const BulkImportSubmitModal = ({
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

            const response = await axios.post(route('dailyWorks.bulkImportSubmit'), formData, {
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
                    invalid: response.data.invalid_count || 0,
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
                    invalid: error.response.data.invalid_count || 0,
                    notFoundList: error.response.data.not_found || [],
                    invalidList: error.response.data.invalid || [],
                });
                setStep('objection-decision');
            } else if (error.response?.data?.invalid || error.response?.data?.not_found) {
                // Show validation errors step
                setValidationErrors({
                    error: error.response?.data?.error || 'Validation errors found',
                    invalid: error.response?.data?.invalid || [],
                    notFound: error.response?.data?.not_found || [],
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
        window.location.href = route('dailyWorks.bulkImportTemplate');
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
                                <span className="font-bold text-sm sm:text-base">Import RFI Submissions</span>
                            </div>
                            <p className="text-xs text-default-500 font-normal">
                                Upload an Excel file with RFI numbers and submission dates
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
                                                    Download the Excel template with the correct format (RFI Number, Submission Date).
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
                                                        <th className="text-left py-2 px-2 sm:px-3 font-semibold">Submission Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b border-default-100">
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">RFI-001</td>
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">2024-12-20</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">RFI-002</td>
                                                        <td className="py-2 px-2 sm:px-3 text-default-600">2024-12-21</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
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
                                            Please check your file format and try again. The expected format is:
                                            <strong> Column A: RFI Number, Column B: Submission Date (YYYY-MM-DD)</strong>
                                        </p>
                                    </div>

                                    {/* Invalid Rows */}
                                    {validationErrors.invalid?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-medium text-sm text-danger-600 flex items-center gap-2">
                                                <XCircleIcon className="w-4 h-4" />
                                                Invalid Rows ({validationErrors.invalid.length})
                                            </p>
                                            <div className="max-h-48 overflow-y-auto rounded-lg border border-danger-200 dark:border-danger-800">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-danger-50 dark:bg-danger-900/30 sticky top-0">
                                                        <tr>
                                                            <th className="text-left py-2 px-3 font-semibold">Row</th>
                                                            <th className="text-left py-2 px-3 font-semibold">RFI Number</th>
                                                            <th className="text-left py-2 px-3 font-semibold">Error</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {validationErrors.invalid.map((item, idx) => (
                                                            <tr key={idx} className="border-t border-danger-100 dark:border-danger-800/50">
                                                                <td className="py-2 px-3 text-default-600">{item.row}</td>
                                                                <td className="py-2 px-3 text-default-600 font-mono">{item.rfi_number}</td>
                                                                <td className="py-2 px-3 text-danger-600">{item.error}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Not Found Rows */}
                                    {validationErrors.notFound?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-medium text-sm text-warning-600 flex items-center gap-2">
                                                <ExclamationTriangleIcon className="w-4 h-4" />
                                                RFIs Not Found ({validationErrors.notFound.length})
                                            </p>
                                            <div className="max-h-32 overflow-y-auto rounded-lg border border-warning-200 dark:border-warning-800">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-warning-50 dark:bg-warning-900/30 sticky top-0">
                                                        <tr>
                                                            <th className="text-left py-2 px-3 font-semibold">Row</th>
                                                            <th className="text-left py-2 px-3 font-semibold">RFI Number</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {validationErrors.notFound.map((item, idx) => (
                                                            <tr key={idx} className="border-t border-warning-100 dark:border-warning-800/50">
                                                                <td className="py-2 px-3 text-default-600">{item.row}</td>
                                                                <td className="py-2 px-3 text-default-600 font-mono">{item.rfi_number}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
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
                                                    <p className="text-xs text-default-500">Total Parsed</p>
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
                                                    <p className="text-xl font-bold text-danger">{parseSummary.notFound + parseSummary.invalid}</p>
                                                    <p className="text-xs text-danger-600">Issues</p>
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
                                                {objectedWorks.map((work) => (
                                                    <div 
                                                        key={work.id || work.row} 
                                                        className="flex items-center justify-between p-2 rounded-lg text-sm bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <DocumentTextIcon className="w-4 h-4 text-warning-500" />
                                                            <span className="font-medium">{work.number}</span>
                                                            {work.location && (
                                                                <span className="text-xs text-default-400">@ {work.location}</span>
                                                            )}
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

                                    {/* Decision options */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Skip option */}
                                        <Card 
                                            isPressable 
                                            onPress={handleSkipObjected}
                                            className="border-2 border-transparent hover:border-default-300 transition-colors"
                                        >
                                            <CardBody className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-default-100 rounded-lg">
                                                        <XCircleIcon className="w-5 h-5 text-default-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold">Skip Objected RFIs</p>
                                                        <p className="text-xs text-default-500 mt-1">
                                                            Only submit RFIs without objections. {parseSummary?.clean || 0} RFIs will be submitted.
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {/* Override option */}
                                        <Card className="border-2 border-warning-300 dark:border-warning-700">
                                            <CardBody className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-warning-100 rounded-lg">
                                                        <ExclamationTriangleIcon className="w-5 h-5 text-warning-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-warning-700 dark:text-warning-300">Override & Submit All</p>
                                                        <p className="text-xs text-default-500 mt-1">
                                                            Submit all RFIs including objected ones. Requires a reason.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Textarea
                                                    placeholder="Reason for overriding objections (required)..."
                                                    value={overrideReason}
                                                    onChange={(e) => setOverrideReason(e.target.value)}
                                                    minRows={2}
                                                    className="mt-3"
                                                    radius={getThemeRadius()}
                                                />
                                                <Button
                                                    color="warning"
                                                    className="mt-2 w-full"
                                                    radius={getThemeRadius()}
                                                    onPress={handleOverrideObjected}
                                                    isLoading={loading}
                                                    isDisabled={!overrideReason.trim()}
                                                >
                                                    Override & Submit All ({parseSummary?.total || 0} RFIs)
                                                </Button>
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* Issues info */}
                                    {parseSummary && (parseSummary.notFound > 0 || parseSummary.invalid > 0) && (
                                        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <ExclamationCircleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-danger-700 dark:text-danger-400 text-sm">
                                                        Some rows have issues
                                                    </p>
                                                    <p className="text-xs text-danger-600 dark:text-danger-500 mt-1">
                                                        {parseSummary.notFound > 0 && `${parseSummary.notFound} RFI(s) not found. `}
                                                        {parseSummary.invalid > 0 && `${parseSummary.invalid} row(s) have invalid data.`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Results */}
                            {step === 'result' && result && (
                                <div className="space-y-4">
                                    {/* Summary cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        <Card className="bg-success-50 dark:bg-success-900/20 border border-success-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-xl font-bold text-success">{result.submitted_count}</p>
                                                <p className="text-xs text-success-600">Submitted</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-xl font-bold text-warning">{result.skipped_count}</p>
                                                <p className="text-xs text-warning-600">Skipped</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-xl font-bold text-danger">{result.failed_count}</p>
                                                <p className="text-xs text-danger-600">Failed</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-default-50 dark:bg-default-900/20 border border-default-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-xl font-bold text-default-600">{result.not_found_count || 0}</p>
                                                <p className="text-xs text-default-500">Not Found</p>
                                            </CardBody>
                                        </Card>
                                        <Card className="bg-default-50 dark:bg-default-900/20 border border-default-200">
                                            <CardBody className="p-3 text-center">
                                                <p className="text-xl font-bold text-default-600">{result.invalid_count || 0}</p>
                                                <p className="text-xs text-default-500">Invalid</p>
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* Submitted List */}
                                    {result.submitted?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2 text-success-700 flex items-center gap-1">
                                                <CheckCircleSolid className="w-4 h-4" />
                                                Submitted Successfully ({result.submitted.length})
                                            </p>
                                            <ScrollShadow className="max-h-24">
                                                <div className="flex flex-wrap gap-1">
                                                    {result.submitted.map((work) => (
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
                                                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                    onPress={() => {
                                                        // Download skipped RFIs as CSV
                                                        const csvContent = "RFI Number,Objections Count\n" + 
                                                            result.skipped.map(w => `${w.number},${w.active_objections_count || 'N/A'}`).join('\n');
                                                        const blob = new Blob([csvContent], { type: 'text/csv' });
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = 'skipped_objected_rfis.csv';
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                    }}
                                                >
                                                    Download List
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
                                                        <Chip key={idx} size="sm" variant="flat">
                                                            Row {item.row}: {item.rfi_number}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </ScrollShadow>
                                        </div>
                                    )}

                                    {/* Invalid List */}
                                    {result.invalid?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2 text-default-600 flex items-center gap-1">
                                                <ExclamationCircleIcon className="w-4 h-4" />
                                                Invalid Rows ({result.invalid.length})
                                            </p>
                                            <ScrollShadow className="max-h-24">
                                                <div className="flex flex-wrap gap-1">
                                                    {result.invalid.map((item, idx) => (
                                                        <Chip key={idx} size="sm" variant="flat" color="danger">
                                                            Row {item.row}: {item.error}
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
                                        startContent={!loading && <DocumentArrowUpIcon className="w-4 h-4" />}
                                    >
                                        Import & Submit
                                    </Button>
                                </>
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

export default BulkImportSubmitModal;
