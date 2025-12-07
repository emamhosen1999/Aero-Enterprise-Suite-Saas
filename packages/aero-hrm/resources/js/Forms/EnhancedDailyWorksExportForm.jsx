import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    DateRangePicker,
    Checkbox,
    CheckboxGroup,
    Card,
    CardBody,
    Divider,
    RadioGroup,
    Radio,
    Chip,
    Progress
} from "@heroui/react";
import {
    DocumentArrowDownIcon,
    DocumentTextIcon,
    TableCellsIcon,
    CalendarDaysIcon,
    InformationCircleIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import { Download, FileSpreadsheet, FileText, Database } from 'lucide-react';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { parseDate } from "@internationalized/date";

const EnhancedDailyWorksExportForm = ({ 
    open, 
    closeModal, 
    filterData = {}, 
    users = [],
    inCharges = [] 
}) => {
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

    const [exportSettings, setExportSettings] = useState({
        format: 'excel',
        dateRange: {
            start: filterData.startDate ? parseDate(filterData.startDate) : null,
            end: filterData.endDate ? parseDate(filterData.endDate) : null
        },
        columns: [
            'date', 'number', 'type', 'status', 'description', 
            'location', 'incharge', 'assigned', 'completion_time', 'rfi_submission_date'
        ],
        filters: {
            status: filterData.status || 'all',
            incharge: filterData.incharge || 'all',
            type: filterData.type || 'all',
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const exportFormats = [
        {
            key: 'excel',
            label: 'Excel (.xlsx)',
            description: 'Comprehensive spreadsheet format',
            icon: <FileSpreadsheet size={20} className="text-green-600" />
        },
        {
            key: 'csv',
            label: 'CSV (.csv)',
            description: 'Simple comma-separated values',
            icon: <TableCellsIcon className="w-5 h-5 text-blue-600" />
        },
        {
            key: 'json',
            label: 'JSON Data',
            description: 'Structured data format',
            icon: <Database size={20} className="text-purple-600" />
        }
    ];

    const columnOptions = [
        { key: 'date', label: 'Date', description: 'RFI submission date' },
        { key: 'number', label: 'RFI Number', description: 'Unique RFI identifier' },
        { key: 'type', label: 'Type', description: 'Work type (Embankment, Structure, Pavement)' },
        { key: 'status', label: 'Status', description: 'Current work status' },
        { key: 'description', label: 'Description', description: 'Work description' },
        { key: 'location', label: 'Location', description: 'Work location/chainage' },
        { key: 'side', label: 'Side', description: 'Road side (SR-R, SR-L)' },
        { key: 'qty_layer', label: 'Quantity/Layer', description: 'Quantity or layer information' },
        { key: 'planned_time', label: 'Planned Time', description: 'Planned completion time' },
        { key: 'incharge', label: 'In Charge', description: 'Supervision engineer' },
        { key: 'assigned', label: 'Assigned To', description: 'Assigned team member' },
        { key: 'completion_time', label: 'Completion Time', description: 'Actual completion time' },
        { key: 'inspection_details', label: 'Inspection Details', description: 'Quality inspection results' },
        { key: 'resubmission_count', label: 'Resubmission Count', description: 'Number of resubmissions' },
        { key: 'rfi_submission_date', label: 'RFI Submission Date', description: 'Date RFI was submitted' }
    ];

    const statusOptions = [
        { key: 'all', label: 'All Statuses' },
        { key: 'new', label: 'New' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'review', label: 'Under Review' },
        { key: 'completed', label: 'Completed' },
        { key: 'rejected', label: 'Rejected' }
    ];

    const typeOptions = [
        { key: 'all', label: 'All Types' },
        { key: 'Embankment', label: 'Embankment' },
        { key: 'Structure', label: 'Structure' },
        { key: 'Pavement', label: 'Pavement' }
    ];

    const handleExport = async () => {
        setIsLoading(true);
        
        try {
            const exportParams = {
                columns: exportSettings.columns,
                ...exportSettings.filters,
                ...(exportSettings.dateRange.start && { 
                    startDate: exportSettings.dateRange.start.toString() 
                }),
                ...(exportSettings.dateRange.end && { 
                    endDate: exportSettings.dateRange.end.toString() 
                })
            };

            const response = await axios.post(route('dailyWorks.export'), exportParams);
            
            if (response.data.data) {
                const { data: exportData, filename } = response.data;
                
                switch (exportSettings.format) {
                    case 'excel':
                        exportToExcel(exportData, filename);
                        break;
                    case 'csv':
                        exportToCSV(exportData, filename);
                        break;
                    case 'json':
                        exportToJSON(exportData, filename);
                        break;
                }

                showToast.success(`Successfully exported ${exportData.length} records`, {
                    icon: <CheckCircleIcon className="w-5 h-5" />,
                });
                
                closeModal();
            }
        } catch (error) {
            showToast.error('Export failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const exportToExcel = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Works');
        
        // Auto-size columns
        const cols = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
        worksheet['!cols'] = cols;
        
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    const exportToCSV = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToJSON = (data, filename) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getEstimatedRecords = () => {
        // This would ideally come from a separate API call
        return "Calculating...";
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="4xl"
            radius={getThemeRadius()}
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
                            <DocumentArrowDownIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                Export Daily Works
                            </h2>
                            <p className="text-sm text-default-500">
                                Export daily work records with customizable options
                            </p>
                        </div>
                    </div>
                </ModalHeader>
                
                <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="space-y-6">
                        {/* Export Format */}
                        <Card 
                            className="bg-default-50"
                            radius={getThemeRadius()}
                            style={{
                                borderRadius: `var(--borderRadius, 12px)`,
                            }}
                        >
                            <CardBody style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <h4 className="font-semibold mb-3" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>Export Format</h4>
                                <RadioGroup
                                    value={exportSettings.format}
                                    onValueChange={(value) => setExportSettings(prev => ({ ...prev, format: value }))}
                                    orientation="horizontal"
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {exportFormats.map((format) => (
                                        <Radio key={format.key} value={format.key}>
                                            <div className="flex items-center gap-2">
                                                {format.icon}
                                                <div>
                                                    <div className="font-medium">{format.label}</div>
                                                    <div className="text-xs text-default-500">{format.description}</div>
                                                </div>
                                            </div>
                                        </Radio>
                                    ))}
                                </RadioGroup>
                            </CardBody>
                        </Card>

                        {/* Date Range */}
                        <div>
                            <h4 className="font-semibold mb-3" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>Date Range</h4>
                            <DateRangePicker
                                label="Select date range"
                                value={exportSettings.dateRange}
                                onChange={(range) => setExportSettings(prev => ({ 
                                    ...prev, 
                                    dateRange: range 
                                }))}
                                size="sm"
                                variant="bordered"
                                radius={getThemeRadius()}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            />
                        </div>

                        {/* Filters */}
                        <div>
                            <h4 className="font-semibold mb-3" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>Filters</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select
                                    label="Status"
                                    selectedKeys={[exportSettings.filters.status]}
                                    onSelectionChange={(keys) => setExportSettings(prev => ({
                                        ...prev,
                                        filters: { ...prev.filters, status: Array.from(keys)[0] }
                                    }))}
                                    size="sm"
                                    variant="bordered"
                                    radius={getThemeRadius()}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {statusOptions.map((status) => (
                                        <SelectItem key={status.key} value={status.key}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Type"
                                    selectedKeys={[exportSettings.filters.type]}
                                    onSelectionChange={(keys) => setExportSettings(prev => ({
                                        ...prev,
                                        filters: { ...prev.filters, type: Array.from(keys)[0] }
                                    }))}
                                    size="sm"
                                    variant="bordered"
                                    radius={getThemeRadius()}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {typeOptions.map((type) => (
                                        <SelectItem key={type.key} value={type.key}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="In Charge"
                                    selectedKeys={[exportSettings.filters.incharge]}
                                    onSelectionChange={(keys) => setExportSettings(prev => ({
                                        ...prev,
                                        filters: { ...prev.filters, incharge: Array.from(keys)[0] }
                                    }))}
                                    size="sm"
                                    variant="bordered"
                                    radius={getThemeRadius()}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    <SelectItem key="all" value="all">All In Charges</SelectItem>
                                    {inCharges.map((inCharge) => (
                                        <SelectItem key={inCharge.id} value={inCharge.id}>
                                            {inCharge.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Column Selection */}
                        <div>
                            <h4 className="font-semibold mb-3" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>Columns to Export</h4>
                            <CheckboxGroup
                                value={exportSettings.columns}
                                onValueChange={(columns) => setExportSettings(prev => ({ 
                                    ...prev, 
                                    columns 
                                }))}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {columnOptions.map((column) => (
                                        <Checkbox key={column.key} value={column.key}>
                                            <div>
                                                <div className="font-medium">{column.label}</div>
                                                <div className="text-xs text-default-500">{column.description}</div>
                                            </div>
                                        </Checkbox>
                                    ))}
                                </div>
                            </CheckboxGroup>
                        </div>

                        {/* Export Summary */}
                        <Card 
                            className="bg-primary-50 border-primary-200"
                            radius={getThemeRadius()}
                            style={{
                                borderRadius: `var(--borderRadius, 12px)`,
                                background: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                                borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                            }}
                        >
                            <CardBody style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <div className="flex items-start space-x-3">
                                    <InformationCircleIcon 
                                        className="w-5 h-5 mt-0.5" 
                                        style={{ color: 'var(--theme-primary)' }}
                                    />
                                    <div>
                                        <h5 
                                            className="font-medium mb-2"
                                            style={{ 
                                                color: 'var(--theme-primary)',
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            Export Summary
                                        </h5>
                                        <div 
                                            className="text-sm space-y-1"
                                            style={{ 
                                                color: `color-mix(in srgb, var(--theme-primary) 80%, black)`,
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <p>• Format: {exportFormats.find(f => f.key === exportSettings.format)?.label}</p>
                                            <p>• Columns: {exportSettings.columns.length} selected</p>
                                            <p>• Estimated records: {getEstimatedRecords()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </ModalBody>
                
                <ModalFooter className="flex flex-col sm:flex-row justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4" style={{
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <Button 
                        color="default"
                        variant="bordered"
                        onPress={closeModal}
                        isDisabled={isLoading}
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
                        onPress={handleExport}
                        isLoading={isLoading}
                        startContent={!isLoading && <Download size={16} />}
                        isDisabled={exportSettings.columns.length === 0}
                        radius={getThemeRadius()}
                        size="sm"
                        style={{
                            borderRadius: `var(--borderRadius, 8px)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        {isLoading ? 'Exporting...' : 'Export Data'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EnhancedDailyWorksExportForm;
