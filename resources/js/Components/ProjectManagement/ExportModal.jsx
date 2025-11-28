import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Checkbox,
    CheckboxGroup,
    Card,
    CardBody,
    Divider,
    Chip,
    RadioGroup,
    Radio,
    DateRangePicker,
    Input,
    Textarea,
} from "@heroui/react";
import {
    DocumentArrowDownIcon,
    DocumentTextIcon,
    TableCellsIcon,
    ChartBarSquareIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/outline";

const ExportModal = ({ 
    isOpen, 
    onClose, 
    selectedProjects = [], 
    totalProjects = 0,
    onExport 
}) => {
    const [exportSettings, setExportSettings] = useState({
        format: 'excel',
        scope: 'selected',
        fields: [
            'basic_info',
            'progress',
            'budget',
            'timeline',
            'team',
            'performance'
        ],
        dateRange: null,
        includeCharts: true,
        includeAttachments: false,
        customFields: [],
        templateType: 'standard'
    });

    const [isLoading, setIsLoading] = useState(false);

    const exportFormats = [
        {
            key: 'excel',
            label: 'Excel (.xlsx)',
            description: 'Comprehensive spreadsheet with multiple sheets',
            icon: <TableCellsIcon className="w-5 h-5" />
        },
        {
            key: 'pdf',
            label: 'PDF Report',
            description: 'Professional formatted report document',
            icon: <DocumentTextIcon className="w-5 h-5" />
        },
        {
            key: 'csv',
            label: 'CSV (.csv)',
            description: 'Simple comma-separated values',
            icon: <DocumentArrowDownIcon className="w-5 h-5" />
        },
        {
            key: 'json',
            label: 'JSON Data',
            description: 'Raw data in JSON format',
            icon: <Cog6ToothIcon className="w-5 h-5" />
        }
    ];

    const fieldGroups = [
        {
            key: 'basic_info',
            label: 'Basic Information',
            description: 'Project name, ID, status, priority',
            fields: ['project_name', 'project_code', 'status', 'priority', 'phase']
        },
        {
            key: 'progress',
            label: 'Progress & Tasks',
            description: 'Progress percentage, task counts, milestones',
            fields: ['progress', 'total_tasks', 'completed_tasks', 'next_milestone']
        },
        {
            key: 'budget',
            label: 'Budget & Finance',
            description: 'Budget allocation, spent amount, cost tracking',
            fields: ['budget_allocated', 'budget_spent', 'budget_utilization']
        },
        {
            key: 'timeline',
            label: 'Timeline & Dates',
            description: 'Start/end dates, duration, deadlines',
            fields: ['start_date', 'end_date', 'duration', 'planned_end_date']
        },
        {
            key: 'team',
            label: 'Team & Resources',
            description: 'Project lead, team members, departments',
            fields: ['project_leader', 'team_size', 'department', 'methodology']
        },
        {
            key: 'performance',
            label: 'Performance Metrics',
            description: 'SPI, CPI, health, risk indicators',
            fields: ['spi', 'cpi', 'health_status', 'risk_level']
        }
    ];

    const templateTypes = [
        {
            key: 'standard',
            label: 'Standard Report',
            description: 'Default project portfolio export'
        },
        {
            key: 'executive',
            label: 'Executive Summary',
            description: 'High-level overview for leadership'
        },
        {
            key: 'detailed',
            label: 'Detailed Analysis',
            description: 'Comprehensive data with analytics'
        },
        {
            key: 'compliance',
            label: 'Compliance Report',
            description: 'ISO 21500 & PMBOK compliant format'
        }
    ];

    const handleExport = async () => {
        setIsLoading(true);
        
        try {
            const exportData = {
                ...exportSettings,
                projectIds: exportSettings.scope === 'selected' ? selectedProjects : null,
                timestamp: new Date().toISOString()
            };

            await onExport(exportData);
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getExportCount = () => {
        return exportSettings.scope === 'selected' ? selectedProjects.length : totalProjects;
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center space-x-2">
                        <DocumentArrowDownIcon className="w-6 h-6" />
                        <span>Export Project Portfolio</span>
                    </div>
                    <p className="text-sm text-default-500 font-normal">
                        Export {getExportCount()} projects to your preferred format
                    </p>
                </ModalHeader>
                
                <ModalBody>
                    <div className="space-y-6">
                        {/* Export Scope */}
                        <Card className="bg-default-50">
                            <CardBody>
                                <h4 className="font-semibold mb-3">Export Scope</h4>
                                <RadioGroup
                                    value={exportSettings.scope}
                                    onValueChange={(value) => setExportSettings(prev => ({ ...prev, scope: value }))}
                                >
                                    <Radio value="selected" isDisabled={selectedProjects.length === 0}>
                                        Selected Projects ({selectedProjects.length})
                                    </Radio>
                                    <Radio value="all">
                                        All Projects ({totalProjects})
                                    </Radio>
                                    <Radio value="filtered">
                                        Current Filtered View
                                    </Radio>
                                </RadioGroup>
                            </CardBody>
                        </Card>

                        {/* Export Format */}
                        <div>
                            <h4 className="font-semibold mb-3">Export Format</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {exportFormats.map((format) => (
                                    <Card 
                                        key={format.key}
                                        isPressable
                                        className={`cursor-pointer transition-colors ${
                                            exportSettings.format === format.key 
                                                ? 'border-primary-500 bg-primary-50' 
                                                : 'hover:bg-default-50'
                                        }`}
                                        onPress={() => setExportSettings(prev => ({ ...prev, format: format.key }))}
                                    >
                                        <CardBody className="p-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="text-primary-600">
                                                    {format.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h5 className="font-medium">{format.label}</h5>
                                                    <p className="text-sm text-default-500">{format.description}</p>
                                                </div>
                                                {exportSettings.format === format.key && (
                                                    <Chip size="sm" color="primary" variant="flat">
                                                        Selected
                                                    </Chip>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Template Type */}
                        <div>
                            <h4 className="font-semibold mb-3">Template Type</h4>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Select template type
                                </InputLabel>
                                <Select
                                    value={exportSettings.templateType || ''}
                                    onChange={(e) => setExportSettings(prev => ({ 
                                        ...prev, 
                                        templateType: e.target.value 
                                    }))}
                                    label="Select template type"
                                    sx={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(16px)',
                                        borderRadius: '12px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(59, 130, 246, 0.5)',
                                        },
                                        '& .MuiSelect-select': {
                                            color: 'rgba(255, 255, 255, 0.9)',
                                        },
                                        '& .MuiSelect-icon': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                backdropFilter: 'blur(16px)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '12px',
                                                '& .MuiMenuItem-root': {
                                                    color: 'rgba(255, 255, 255, 0.9)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                    },
                                                    '&.Mui-selected': {
                                                        backgroundColor: 'rgba(59, 130, 246, 0.3)',
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                >
                                    {templateTypes.map((template) => (
                                        <MenuItem key={template.key} value={template.key}>
                                            <div>
                                                <div>{template.label}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                                    {template.description}
                                                </div>
                                            </div>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>

                        {/* Field Selection */}
                        <div>
                            <h4 className="font-semibold mb-3">Data Fields to Include</h4>
                            <CheckboxGroup
                                value={exportSettings.fields}
                                onValueChange={(value) => setExportSettings(prev => ({ ...prev, fields: value }))}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {fieldGroups.map((group) => (
                                        <Card key={group.key} className="p-3">
                                            <div className="flex items-start space-x-3">
                                                <Checkbox value={group.key} size="sm" />
                                                <div className="flex-1">
                                                    <h6 className="font-medium text-sm">{group.label}</h6>
                                                    <p className="text-xs text-default-500">{group.description}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CheckboxGroup>
                        </div>

                        {/* Advanced Options */}
                        {exportSettings.format === 'pdf' && (
                            <div>
                                <h4 className="font-semibold mb-3">Advanced Options</h4>
                                <div className="space-y-3">
                                    <Checkbox
                                        isSelected={exportSettings.includeCharts}
                                        onValueChange={(checked) => setExportSettings(prev => ({ 
                                            ...prev, 
                                            includeCharts: checked 
                                        }))}
                                    >
                                        Include Charts and Visualizations
                                    </Checkbox>
                                    <Checkbox
                                        isSelected={exportSettings.includeAttachments}
                                        onValueChange={(checked) => setExportSettings(prev => ({ 
                                            ...prev, 
                                            includeAttachments: checked 
                                        }))}
                                    >
                                        Include Project Attachments
                                    </Checkbox>
                                </div>
                            </div>
                        )}

                        {/* Export Summary */}
                        <Card className="bg-primary-50 border-primary-200">
                            <CardBody>
                                <div className="flex items-start space-x-3">
                                    <InformationCircleIcon className="w-5 h-5 text-primary-600 mt-0.5" />
                                    <div>
                                        <h5 className="font-medium text-primary-900">Export Summary</h5>
                                        <div className="text-sm text-primary-700 space-y-1">
                                            <p>• {getExportCount()} projects will be exported</p>
                                            <p>• Format: {exportFormats.find(f => f.key === exportSettings.format)?.label}</p>
                                            <p>• Template: {templateTypes.find(t => t.key === exportSettings.templateType)?.label}</p>
                                            <p>• Data fields: {exportSettings.fields.length} field groups selected</p>
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
                        onPress={onClose}
                        isDisabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleExport}
                        isLoading={isLoading}
                        startContent={!isLoading && <DocumentArrowDownIcon className="w-4 h-4" />}
                    >
                        {isLoading ? 'Exporting...' : 'Export Projects'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ExportModal;
