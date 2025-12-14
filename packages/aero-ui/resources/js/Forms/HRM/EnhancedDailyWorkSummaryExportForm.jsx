import React, { useState } from 'react';
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
    RadioGroup,
    Radio,
    Divider
} from "@heroui/react";
import {
    DocumentArrowDownIcon,
    ChartBarIcon,
    InformationCircleIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { parseDate } from "@internationalized/date";

const EnhancedDailyWorkSummaryExportForm = ({ 
    open, 
    closeModal, 
    filteredData = [],
    inCharges = [] 
}) => {
    const [exportSettings, setExportSettings] = useState({
        format: 'excel',
        columns: [
            'date', 'totalDailyWorks', 'completed', 'pending', 
            'completionPercentage', 'rfiSubmissions', 'embankment', 
            'structure', 'pavement', 'resubmissions'
        ],
        includeCharts: false,
        groupBy: 'date' // date, incharge, type
    });

    const [isLoading, setIsLoading] = useState(false);

    const exportFormats = [
        {
            key: 'excel',
            label: 'Excel (.xlsx)',
            description: 'Comprehensive spreadsheet with summary data',
            icon: <FileSpreadsheet size={20} className="text-green-600" />
        },
        {
            key: 'csv',
            label: 'CSV (.csv)',
            description: 'Simple comma-separated values',
            icon: <FileText size={20} className="text-blue-600" />
        }
    ];

    const columnOptions = [
        { key: 'date', label: 'Date', description: 'Summary date' },
        { key: 'totalDailyWorks', label: 'Total Works', description: 'Total number of daily works' },
        { key: 'completed', label: 'Completed', description: 'Number of completed works' },
        { key: 'pending', label: 'Pending', description: 'Number of pending works' },
        { key: 'completionPercentage', label: 'Completion %', description: 'Completion percentage' },
        { key: 'rfiSubmissions', label: 'RFI Submissions', description: 'Number of RFI submissions' },
        { key: 'rfiSubmissionPercentage', label: 'RFI Submission %', description: 'RFI submission percentage' },
        { key: 'embankment', label: 'Embankment Works', description: 'Number of embankment works' },
        { key: 'structure', label: 'Structure Works', description: 'Number of structure works' },
        { key: 'pavement', label: 'Pavement Works', description: 'Number of pavement works' },
        { key: 'resubmissions', label: 'Resubmissions', description: 'Number of resubmissions' }
    ];

    const groupByOptions = [
        { key: 'date', label: 'By Date', description: 'Group summary by date' },
        { key: 'type', label: 'By Type', description: 'Group summary by work type' },
        { key: 'overall', label: 'Overall Summary', description: 'Single overall summary' }
    ];

    const handleExport = async () => {
        setIsLoading(true);
        
        try {
            // Prepare export data based on settings
            let exportData = prepareExportData();
            
            const filename = `daily_work_summary_${new Date().toISOString().split('T')[0]}`;
            
            switch (exportSettings.format) {
                case 'excel':
                    exportToExcel(exportData, filename);
                    break;
                case 'csv':
                    exportToCSV(exportData, filename);
                    break;
            }

            showToast.success(`Successfully exported ${exportData.length} summary records`, {
                icon: <CheckCircleIcon className="w-5 h-5" />,
            });
            
            closeModal();
        } catch (error) {
            showToast.error('Export failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const prepareExportData = () => {
        let data = [...filteredData];
        
        if (exportSettings.groupBy === 'overall') {
            // Create overall summary
            const totalWorks = data.reduce((sum, item) => sum + item.totalDailyWorks, 0);
            const totalCompleted = data.reduce((sum, item) => sum + item.completed, 0);
            const totalRFI = data.reduce((sum, item) => sum + item.rfiSubmissions, 0);
            const totalEmbankment = data.reduce((sum, item) => sum + item.embankment, 0);
            const totalStructure = data.reduce((sum, item) => sum + item.structure, 0);
            const totalPavement = data.reduce((sum, item) => sum + item.pavement, 0);
            const totalResubmissions = data.reduce((sum, item) => sum + item.resubmissions, 0);
            
            data = [{
                date: 'Overall Summary',
                totalDailyWorks: totalWorks,
                completed: totalCompleted,
                pending: totalWorks - totalCompleted,
                completionPercentage: totalWorks > 0 ? ((totalCompleted / totalWorks) * 100).toFixed(1) + '%' : '0%',
                rfiSubmissions: totalRFI,
                rfiSubmissionPercentage: totalWorks > 0 ? ((totalRFI / totalWorks) * 100).toFixed(1) + '%' : '0%',
                embankment: totalEmbankment,
                structure: totalStructure,
                pavement: totalPavement,
                resubmissions: totalResubmissions
            }];
        } else if (exportSettings.groupBy === 'type') {
            // Group by work type
            const typeGroups = data.reduce((groups, item) => {
                ['embankment', 'structure', 'pavement'].forEach(type => {
                    if (item[type] > 0) {
                        if (!groups[type]) {
                            groups[type] = { 
                                type: type.charAt(0).toUpperCase() + type.slice(1),
                                totalWorks: 0, 
                                dates: [] 
                            };
                        }
                        groups[type].totalWorks += item[type];
                        groups[type].dates.push(item.date);
                    }
                });
                return groups;
            }, {});
            
            data = Object.values(typeGroups).map(group => ({
                type: group.type,
                totalWorks: group.totalWorks,
                dateRange: `${Math.min(...group.dates)} to ${Math.max(...group.dates)}`,
                dateCount: group.dates.length
            }));
        }
        
        // Filter columns based on selection
        return data.map(row => {
            const filteredRow = {};
            exportSettings.columns.forEach(column => {
                if (row.hasOwnProperty(column)) {
                    const label = columnOptions.find(col => col.key === column)?.label || column;
                    filteredRow[label] = row[column];
                }
            });
            return filteredRow;
        });
    };

    const exportToExcel = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
        
        // Auto-size columns
        const cols = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
        worksheet['!cols'] = cols;
        
        // Add styling for headers
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!worksheet[cellAddress]) continue;
            worksheet[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "CCCCCC" } }
            };
        }
        
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

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="3xl"
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md",
                backdrop: "bg-black/50 backdrop-blur-sm"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <ChartBarIcon className="w-6 h-6 text-primary" />
                        <span>Export Daily Work Summary</span>
                    </div>
                    <p className="text-sm text-default-500 font-normal">
                        Export summary data with customizable grouping and format options
                    </p>
                </ModalHeader>
                
                <ModalBody>
                    <div className="space-y-6">
                        {/* Export Format */}
                        <Card className="bg-default-50">
                            <CardBody>
                                <h4 className="font-semibold mb-3">Export Format</h4>
                                <RadioGroup
                                    value={exportSettings.format}
                                    onValueChange={(value) => setExportSettings(prev => ({ ...prev, format: value }))}
                                    orientation="horizontal"
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

                        {/* Grouping Options */}
                        <div>
                            <h4 className="font-semibold mb-3">Grouping & Summary</h4>
                            <RadioGroup
                                value={exportSettings.groupBy}
                                onValueChange={(value) => setExportSettings(prev => ({ ...prev, groupBy: value }))}
                            >
                                {groupByOptions.map((option) => (
                                    <Radio key={option.key} value={option.key}>
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-default-500">{option.description}</div>
                                        </div>
                                    </Radio>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Column Selection */}
                        <div>
                            <h4 className="font-semibold mb-3">Columns to Export</h4>
                            <CheckboxGroup
                                value={exportSettings.columns}
                                onValueChange={(columns) => setExportSettings(prev => ({ 
                                    ...prev, 
                                    columns 
                                }))}
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
                        <Card className="bg-primary-50 border-primary-200">
                            <CardBody>
                                <div className="flex items-start space-x-3">
                                    <InformationCircleIcon className="w-5 h-5 text-primary-600 mt-0.5" />
                                    <div>
                                        <h5 className="font-medium text-primary-900">Export Summary</h5>
                                        <div className="text-sm text-primary-700 space-y-1">
                                            <p>• Format: {exportFormats.find(f => f.key === exportSettings.format)?.label}</p>
                                            <p>• Grouping: {groupByOptions.find(g => g.key === exportSettings.groupBy)?.label}</p>
                                            <p>• Columns: {exportSettings.columns.length} selected</p>
                                            <p>• Records: {filteredData.length} summary entries</p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </ModalBody>
                
                <ModalFooter>
                    <Button 
                        variant="light" 
                        onPress={closeModal}
                        isDisabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleExport}
                        isLoading={isLoading}
                        startContent={!isLoading && <Download size={16} />}
                        isDisabled={exportSettings.columns.length === 0}
                    >
                        {isLoading ? 'Exporting...' : 'Export Summary'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EnhancedDailyWorkSummaryExportForm;
