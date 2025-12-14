import React, { useState, useCallback } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardBody,
    Divider,
    Chip,
    Progress,
    Accordion,
    AccordionItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    ScrollShadow,
} from "@heroui/react";
import { 
    DocumentArrowUpIcon, 
    DocumentTextIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon,
    XMarkIcon,
    InformationCircleIcon,
    TableCellsIcon,
    DocumentIcon,
    ClockIcon,
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { showToast } from "@/utils/toastUtils";
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const DailyWorksUploadForm = ({ open, closeModal, setTotalRows, setData, refreshData, onSuccess }) => {
    // Expected Excel format data - based on actual project format
    const expectedFormat = [
        { column: 'A', field: 'Date', example: '4/27/2025', required: true, processed: true },
        { column: 'B', field: 'RFI Number', example: 'S2025-0425-9663, E2025-0426-14687, P2025-0427-3180', required: true, processed: true },
        { column: 'C', field: 'Work Type', example: 'Structure, Embankment, Pavement', required: true, processed: true },
        { column: 'D', field: 'Description', example: 'Isolation Barrier (Type-2, Steel Post) Installation Work', required: true, processed: true },
        { column: 'E', field: 'Location/Chainage', example: 'K05+560-K05+660', required: true, processed: true },
        { column: 'F', field: 'Quantity/Layer', example: '150 MT, 2 Layers, 500 SQM', required: false, processed: false },
        { column: 'G', field: 'Side (Optional)', example: 'TR-R, TR-L, SR-L, SR-R', required: false, processed: false },
        { column: 'H', field: 'Time (Optional)', example: '3:00 PM, 4:00 PM, 9:00 AM', required: false, processed: false },
    ];

    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [serverErrors, setServerErrors] = useState({});
    const [previewData, setPreviewData] = useState(null);

    // Helper function to convert theme borderRadius to HeroUI radius values
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    // Validate file before processing
    const validateFile = (file) => {
        const errors = [];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];

        if (!allowedTypes.includes(file.type)) {
            errors.push('Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)');
        }

        if (file.size > maxSize) {
            errors.push('File size must be less than 10MB');
        }

        return errors;
    };

    // Handle file selection
    const onFileChange = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            const errors = validateFile(selectedFile);
            
            if (errors.length > 0) {
                setValidationErrors(errors);
                showToast.error('File validation failed');
                return;
            }

            setFile(selectedFile);
            setValidationErrors([]);
            setServerErrors({});
            setPreviewData(null);
        }
    }, []);

    // Clear selected file
    const clearFile = () => {
        setFile(null);
        setValidationErrors([]);
        setServerErrors({});
        setPreviewData(null);
        setUploadProgress(0);
    };

    // Setup dropzone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onFileChange,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        multiple: false,
        onDragEnter: () => setDragActive(true),
        onDragLeave: () => setDragActive(false)
    });

    // Get file icon based on type
    const getFileIcon = (file) => {
        if (!file) return <DocumentArrowUpIcon className="w-8 h-8" />;
        
        if (file.type.includes('sheet') || file.type.includes('excel')) {
            return <TableCellsIcon className="w-8 h-8 text-green-500" />;
        } else if (file.type.includes('csv')) {
            return <DocumentTextIcon className="w-8 h-8 text-blue-500" />;
        }
        return <DocumentIcon className="w-8 h-8" />;
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!file) {
            showToast.error('Please select a file to upload');
            return;
        }

        setProcessing(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        const promise = new Promise(async (resolve, reject) => {
            try {
                // Get CSRF token safely
                const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content 
                    || document.querySelector('input[name="_token"]')?.value 
                    || window.Laravel?.csrfToken;

                const response = await axios.post(route('dailyWorks.import'), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                });

                if (response.status === 200) {
                    // Clear form data and close modal first
                    clearFile();
                    setServerErrors({});
                    closeModal();
                    
                    // Call onSuccess callback with import results (includes date info)
                    // This allows parent to update date range/selectedDate
                    if (typeof onSuccess === 'function') {
                        onSuccess(response.data.results);
                    } else {
                        // Fallback: Legacy behavior - set data directly and refresh
                        if (response.data.data) {
                            setData(response.data.data);
                        }
                        if (response.data.total) {
                            setTotalRows(response.data.total);
                        }
                        if (typeof refreshData === 'function') {
                            refreshData();
                        }
                    }
                    
                    resolve(response.data.message || 'Daily works imported successfully.');
                }
            } catch (error) {
                console.error('Upload error:', error);
                
                if (error.response) {
                    console.error('Error response status:', error.response.status);
                    console.error('Error response data:', error.response.data);
                    console.error('Error response headers:', error.response.headers);
                    
                    if (error.response.status === 422) {
                        // Handle validation errors
                        setServerErrors(error.response.data.errors || {});
                        reject(error.response.data.error || 'Failed to import daily works');
                    } else if (error.response.status === 500) {
                        // Handle server errors
                        const errorMessage = error.response.data.error || error.response.data.message || 'Internal server error occurred';
                        setServerErrors({ general: [errorMessage] });
                        reject(`Server Error: ${errorMessage}`);
                    } else {
                        // Handle other HTTP errors
                        const errorMessage = error.response.data.message || error.response.data.error || 'An unexpected error occurred';
                        setServerErrors({ general: [errorMessage] });
                        reject(`HTTP Error ${error.response.status}: ${errorMessage}`);
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error('No response received:', error.request);
                    setServerErrors({ general: ['No response received from the server. Please check your internet connection.'] });
                    reject('No response received from the server. Please check your internet connection.');
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Request setup error:', error.message);
                    setServerErrors({ general: ['An error occurred while setting up the request.'] });
                    reject('An error occurred while setting up the request.');
                }
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(promise, {
            pending: 'Uploading file...',
            success: {
                render({ data }) {
                    return <>{data}</>;
                },
            },
            error: {
                render({ data }) {
                    return <>{data}</>;
                },
            },
        });
    };

    // Handle modal close
    const handleClose = () => {
        if (!processing) {
            clearFile();
            setServerErrors({});
            closeModal();
        }
    };


    return (
        <Modal 
            isOpen={open} 
            onClose={handleClose}
            size="4xl"
            radius={getThemeRadius()}
            placement="center"
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md mx-2 my-2 sm:mx-4 sm:my-8 max-h-[95vh]",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider",
                body: "overflow-y-auto",
                footer: "border-t border-divider",
                closeButton: "hover:bg-white/5 active:bg-white/10"
            }}
            style={{
                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
                transform: `scale(var(--scale, 1))`,
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-3">
                                <div 
                                    className="p-2 rounded-lg"
                                    style={{
                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                        color: 'var(--theme-primary)'
                                    }}
                                >
                                    <DocumentArrowUpIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Import Daily Works
                                    </h2>
                                    <p className="text-sm text-default-500">
                                        Upload Excel or CSV file to import multiple daily work entries
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="space-y-6">
                                {/* File Upload Section */}
                                <div className="space-y-4">
                                    {/* Upload Area */}
                                    <Card 
                                        className={`border-2 border-dashed transition-all duration-200 ${
                                            isDragActive 
                                                ? 'border-primary bg-primary/5' 
                                                : file 
                                                    ? 'border-success bg-success/5' 
                                                    : 'border-default-300 hover:border-default-400'
                                        }`}
                                        radius={getThemeRadius()}
                                    >
                                        <CardBody className="p-8">
                                            <div
                                                {...getRootProps()}
                                                className="flex flex-col items-center justify-center text-center cursor-pointer"
                                            >
                                                <input {...getInputProps()} />
                                                
                                                <div className={`p-4 rounded-full mb-4 ${
                                                    file ? 'bg-success/10' : 'bg-default-100'
                                                }`}>
                                                    {getFileIcon(file)}
                                                </div>

                                                {file ? (
                                                    <div className="space-y-2">
                                                        <h3 className="text-lg font-medium text-foreground">
                                                            {file.name}
                                                        </h3>
                                                        <p className="text-sm text-default-500">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <Chip
                                                                size="sm"
                                                                color="success"
                                                                variant="flat"
                                                                startContent={<CheckCircleIcon className="w-3 h-3" />}
                                                            >
                                                                File Ready
                                                            </Chip>
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                color="danger"
                                                                onPress={clearFile}
                                                                isIconOnly
                                                            >
                                                                <XMarkIcon className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <h3 className="text-lg font-medium text-foreground">
                                                            {isDragActive ? 'Drop your file here' : 'Choose file to upload'}
                                                        </h3>
                                                        <p className="text-sm text-default-500">
                                                            Drag and drop your Excel or CSV file here, or click to browse
                                                        </p>
                                                        <p className="text-xs text-default-400">
                                                            Supported formats: .xlsx, .xls, .csv (Max: 10MB)
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Upload Progress */}
                                    {processing && (
                                        <Card>
                                            <CardBody className="p-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">Uploading...</span>
                                                        <span className="text-sm text-default-500">{uploadProgress}%</span>
                                                    </div>
                                                    <Progress 
                                                        value={uploadProgress} 
                                                        color="primary"
                                                        size="sm"
                                                        className="w-full"
                                                    />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )}

                                    {/* Validation Errors */}
                                    {validationErrors.length > 0 && (
                                        <Card className="border border-danger/20 bg-danger/5">
                                            <CardBody className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-danger mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-danger mb-1">File Validation Errors</h4>
                                                        <ul className="space-y-1">
                                                            {validationErrors.map((error, index) => (
                                                                <li key={index} className="text-sm text-danger/80">
                                                                    • {error}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )}

                                    {/* Server Errors */}
                                    {Object.keys(serverErrors).length > 0 && (
                                        <Card className="border border-danger/20 bg-danger/5">
                                            <CardBody className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-danger mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-danger mb-1">Upload Errors</h4>
                                                        <div className="space-y-2">
                                                            {Object.entries(serverErrors).map(([field, errors]) => (
                                                                <div key={field}>
                                                                    {field !== 'general' && (
                                                                        <p className="text-sm font-medium text-danger capitalize">{field.replace('_', ' ')}:</p>
                                                                    )}
                                                                    <ul className="space-y-1">
                                                                        {Array.isArray(errors) ? errors.map((error, index) => (
                                                                            <li key={index} className="text-sm text-danger/80">
                                                                                • {error}
                                                                            </li>
                                                                        )) : (
                                                                            <li className="text-sm text-danger/80">• {errors}</li>
                                                                        )}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )}
                                </div>

                                <Divider />

                                {/* File Format Guide */}
                                <Accordion variant="bordered">
                                    <AccordionItem
                                        key="format"
                                        aria-label="Expected File Format"
                                        startContent={<InformationCircleIcon className="w-5 h-5 text-primary" />}
                                        title="Expected File Format"
                                        subtitle="Click to view the required Excel/CSV structure"
                                    >
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-lg bg-default-50">
                                                <h4 className="font-medium mb-2 text-foreground">Excel/CSV Column Structure:</h4>
                                                <div className="text-sm text-default-600">
                                                    Your file should have exactly 8 columns in this order (with or without headers):
                                                </div>
                                            </div>

                                            <Table
                                                aria-label="Expected format table"
                                                removeWrapper
                                                classNames={{
                                                    th: "bg-default-100 text-default-700 text-xs font-semibold",
                                                    td: "py-2 text-sm"
                                                }}
                                            >
                                                <TableHeader>
                                                    <TableColumn>Column</TableColumn>
                                                    <TableColumn>Field Name</TableColumn>
                                                    <TableColumn>Example</TableColumn>
                                                    <TableColumn>Required</TableColumn>
                                                    <TableColumn>Processed</TableColumn>
                                                </TableHeader>
                                                <TableBody>
                                                    {expectedFormat.map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                <Chip size="sm" variant="flat" color="primary">
                                                                    {item.column}
                                                                </Chip>
                                                            </TableCell>
                                                            <TableCell className="font-medium">{item.field}</TableCell>
                                                            <TableCell className="text-default-500">{item.example}</TableCell>
                                                            <TableCell>
                                                                {item.required ? (
                                                                    <Chip size="sm" color="danger" variant="flat">Required</Chip>
                                                                ) : (
                                                                    <Chip size="sm" color="default" variant="flat">Optional</Chip>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {item.processed ? (
                                                                    <Chip size="sm" color="success" variant="flat">Yes</Chip>
                                                                ) : (
                                                                    <Chip size="sm" color="warning" variant="flat">No</Chip>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                                <InformationCircleIcon className="w-4 h-4 text-primary mt-0.5" />
                                                <div className="text-xs text-primary-700">
                                                    <strong>Format Tips:</strong> 
                                                    • Only columns A-E are processed by the system (columns F-H are for reference only)
                                                    • Work Type examples: Structure, Embankment, Pavement
                                                    • Quantity/Layer examples: 150 MT (metric tons), 2 Layers, 500 SQM (square meters)
                                                    • Side values: TR-R (Traffic Right), TR-L (Traffic Left), SR-R (Service Right), SR-L (Service Left)
                                                    • Location/Chainage format: K05+560-K05+660 (kilometer markers with ranges)
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                                                <ExclamationTriangleIcon className="w-4 h-4 text-warning mt-0.5" />
                                                <div className="text-xs text-warning-700">
                                                    <strong>Important:</strong> The first row can contain headers (they will be skipped). 
                                                    Date format should be M/D/YYYY (e.g., 4/27/2025). RFI Number can contain multiple comma-separated values.
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionItem>

                                    <AccordionItem
                                        key="template"
                                        aria-label="Download Template"
                                        startContent={<ArrowDownTrayIcon className="w-5 h-5 text-success" />}
                                        title="Download Template"
                                        subtitle="Get a pre-formatted Excel template"
                                    >
                                        <div className="space-y-3">
                                            <p className="text-sm text-default-600">
                                                Download our Excel template with the correct 8-column format and sample daily work data:
                                            </p>
                                            <Button
                                                color="success"
                                                variant="flat"
                                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                onPress={() => {
                                                    // Create and download template
                                                    window.open(route('dailyWorks.downloadTemplate'), '_blank');
                                                }}
                                            >
                                                Download Excel Template
                                            </Button>
                                        </div>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </ModalBody>
                        
                        <ModalFooter className="flex flex-col sm:flex-row justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <Button
                                color="default"
                                variant="bordered"
                                onPress={handleClose}
                                disabled={processing}
                                radius={getThemeRadius()}
                                size="sm"
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSubmit}
                                isLoading={processing}
                                disabled={!file || validationErrors.length > 0}
                                radius={getThemeRadius()}
                                size="sm"
                                startContent={!processing ? <DocumentArrowUpIcon className="w-4 h-4" /> : null}
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {processing ? `Uploading... ${uploadProgress}%` : 'Import Daily Works'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DailyWorksUploadForm;