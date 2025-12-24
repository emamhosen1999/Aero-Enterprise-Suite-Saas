import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    Divider,
    Chip,
    Card,
    CardBody,
    Progress,
    Checkbox,
    RadioGroup,
    Radio,
    DatePicker,
    Autocomplete,
    AutocompleteItem,
    AvatarGroup,
} from "@heroui/react";
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    DocumentArrowDownIcon,
    ArchiveBoxIcon,
    TrashIcon,
    TagIcon,
    UserGroupIcon,
    FlagIcon,
    DocumentDuplicateIcon,
    CheckCircleIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import ProfileAvatar from '@/Components/ProfileAvatar';

const BulkActionModal = ({ 
    isOpen, 
    onClose, 
    selectedProjects, 
    availableUsers, 
    availableTags, 
    onBulkAction 
}) => {
    const [actionType, setActionType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        priority: '',
        status: '',
        assignedLeader: '',
        tags: [],
        archiveReason: '',
        exportFormat: 'excel',
        newCategory: '',
        dueDate: null,
        notes: ''
    });

    // ISO 21500 compliant action types
    const actionTypes = [
        {
            key: 'export',
            label: 'Export Selected Projects',
            icon: <DocumentArrowDownIcon className="w-5 h-5" />,
            description: 'Export project data for reporting and compliance',
            category: 'reporting',
            requiresApproval: false
        },
        {
            key: 'archive',
            label: 'Archive Projects',
            icon: <ArchiveBoxIcon className="w-5 h-5" />,
            description: 'Move projects to archived status (ISO 21500 closure)',
            category: 'lifecycle',
            requiresApproval: true
        },
        {
            key: 'updatePriority',
            label: 'Update Priority Level',
            icon: <FlagIcon className="w-5 h-5" />,
            description: 'Bulk update project priority classifications',
            category: 'management',
            requiresApproval: false
        },
        {
            key: 'updateStatus',
            label: 'Change Project Status',
            icon: <CheckCircleIcon className="w-5 h-5" />,
            description: 'Transition projects through lifecycle phases',
            category: 'lifecycle',
            requiresApproval: true
        },
        {
            key: 'assignLeader',
            label: 'Assign Project Leader',
            icon: <UserGroupIcon className="w-5 h-5" />,
            description: 'Bulk assignment of project managers',
            category: 'resource',
            requiresApproval: false
        },
        {
            key: 'addTags',
            label: 'Add Tags/Categories',
            icon: <TagIcon className="w-5 h-5" />,
            description: 'Categorize projects for better organization',
            category: 'organization',
            requiresApproval: false
        },
        {
            key: 'duplicate',
            label: 'Create Project Templates',
            icon: <DocumentDuplicateIcon className="w-5 h-5" />,
            description: 'Generate reusable project templates',
            category: 'template',
            requiresApproval: false
        },
        {
            key: 'delete',
            label: 'Delete Projects',
            icon: <TrashIcon className="w-5 h-5" />,
            description: 'Permanently remove projects (requires audit approval)',
            category: 'deletion',
            requiresApproval: true,
            dangerous: true
        }
    ];

    // Status options aligned with PMBOK lifecycle
    const statusOptions = [
        { key: 'not_started', label: 'Not Started', phase: 'Initiation' },
        { key: 'planning', label: 'Planning', phase: 'Planning' },
        { key: 'in_progress', label: 'In Progress', phase: 'Execution' },
        { key: 'monitoring', label: 'Monitoring', phase: 'Monitoring & Controlling' },
        { key: 'on_hold', label: 'On Hold', phase: 'Control' },
        { key: 'completed', label: 'Completed', phase: 'Closing' },
        { key: 'cancelled', label: 'Cancelled', phase: 'Closing' }
    ];

    // Priority levels aligned with risk management standards
    const priorityOptions = [
        { key: 'low', label: 'Low Priority', color: 'success', impact: 'Minimal business impact' },
        { key: 'medium', label: 'Medium Priority', color: 'warning', impact: 'Moderate business impact' },
        { key: 'high', label: 'High Priority', color: 'warning', impact: 'Significant business impact' },
        { key: 'critical', label: 'Critical Priority', color: 'danger', impact: 'Mission-critical business impact' }
    ];

    // Export format options
    const exportFormats = [
        { key: 'excel', label: 'Excel (.xlsx)', description: 'Comprehensive project data with charts' },
        { key: 'pdf', label: 'PDF Report', description: 'Executive summary and status report' },
        { key: 'csv', label: 'CSV Data', description: 'Raw data for analysis' },
        { key: 'json', label: 'JSON Export', description: 'API-compatible data format' }
    ];

    const selectedAction = useMemo(() => {
        return actionTypes.find(action => action.key === actionType);
    }, [actionType]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (!actionType) {
            showToast.error('Please select an action to perform');
            return false;
        }

        switch (actionType) {
            case 'updatePriority':
                if (!formData.priority) {
                    showToast.error('Please select a priority level');
                    return false;
                }
                break;
            case 'updateStatus':
                if (!formData.status) {
                    showToast.error('Please select a status');
                    return false;
                }
                break;
            case 'assignLeader':
                if (!formData.assignedLeader) {
                    showToast.error('Please select a project leader');
                    return false;
                }
                break;
            case 'archive':
                if (!formData.archiveReason.trim()) {
                    showToast.error('Please provide a reason for archiving');
                    return false;
                }
                break;
            case 'delete':
                if (!formData.notes.trim()) {
                    showToast.error('Please provide justification for deletion');
                    return false;
                }
                break;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const payload = {
                action: actionType,
                projectIds: selectedProjects.map(p => p.id),
                data: formData,
                metadata: {
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    selectedCount: selectedProjects.length,
                    actionCategory: selectedAction.category
                }
            };

            // Route to appropriate bulk action endpoint
            await safePost('project-management.projects.bulk-action', payload, {
                onSuccess: (response) => {
                    showToast.success(`Successfully performed ${selectedAction.label} on ${selectedProjects.length} projects`);
                    onBulkAction?.(payload);
                    onClose();
                    resetForm();
                },
                onError: (errors) => {
                    console.error('Bulk action failed:', errors);
                    showToast.error('Failed to perform bulk action. Please try again.');
                }
            });
        } catch (error) {
            console.error('Bulk action error:', error);
            showToast.error('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setActionType('');
        setFormData({
            priority: '',
            status: '',
            assignedLeader: '',
            tags: [],
            archiveReason: '',
            exportFormat: 'excel',
            newCategory: '',
            dueDate: null,
            notes: ''
        });
    };

    const renderActionForm = () => {
        switch (actionType) {
            case 'export':
                return (
                    <div className="space-y-4">
                        <FormControl 
                            fullWidth 
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'text.secondary',
                                },
                            }}
                        >
                            <InputLabel>Export Format</InputLabel>
                            <Select
                                value={formData.exportFormat}
                                label="Export Format"
                                onChange={(e) => handleFormChange('exportFormat', e.target.value)}
                            >
                                {exportFormats.map((format) => (
                                    <MenuItem key={format.key} value={format.key}>
                                        <div>
                                            <div className="font-medium">{format.label}</div>
                                            <div className="text-sm text-default-500">{format.description}</div>
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                );

            case 'updatePriority':
                return (
                    <div className="space-y-4">
                        <FormControl 
                            fullWidth 
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'text.secondary',
                                },
                            }}
                        >
                            <InputLabel>New Priority Level</InputLabel>
                            <Select
                                value={formData.priority}
                                label="New Priority Level"
                                onChange={(e) => handleFormChange('priority', e.target.value)}
                            >
                                {priorityOptions.map((priority) => (
                                    <MenuItem key={priority.key} value={priority.key}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>{priority.label}</span>
                                            <Chip size="sm" color={priority.color} variant="flat">
                                                {priority.impact}
                                            </Chip>
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                );

            case 'updateStatus':
                return (
                    <div className="space-y-4">
                        <FormControl 
                            fullWidth 
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'text.secondary',
                                },
                            }}
                        >
                            <InputLabel>New Project Status</InputLabel>
                            <Select
                                value={formData.status}
                                label="New Project Status"
                                onChange={(e) => handleFormChange('status', e.target.value)}
                            >
                                {statusOptions.map((status) => (
                                    <MenuItem key={status.key} value={status.key}>
                                        <div>
                                            <div className="font-medium">{status.label}</div>
                                            <div className="text-sm text-default-500">PMBOK Phase: {status.phase}</div>
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Textarea
                            label="Status Change Notes"
                            placeholder="Provide context for this status change..."
                            value={formData.notes}
                            onValueChange={(value) => handleFormChange('notes', value)}
                            variant="bordered"
                        />
                    </div>
                );

            case 'assignLeader':
                return (
                    <div className="space-y-4">
                        <Autocomplete
                            label="Select Project Leader"
                            placeholder="Search for a team member..."
                            variant="bordered"
                            onSelectionChange={(key) => handleFormChange('assignedLeader', key)}
                        >
                            {availableUsers?.map((user) => (
                                <AutocompleteItem key={user.id} value={user.id}>
                                    <div className="flex items-center space-x-3">
                                        <ProfileAvatar src={user.avatar} name={user.name} size="sm" />
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-default-500">{user.title} • {user.department}</div>
                                        </div>
                                    </div>
                                </AutocompleteItem>
                            ))}
                        </Autocomplete>
                    </div>
                );

            case 'addTags':
                return (
                    <div className="space-y-4">
                        <FormControl 
                            fullWidth 
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'text.secondary',
                                },
                            }}
                        >
                            <InputLabel>Select Tags/Categories</InputLabel>
                            <Select
                                multiple
                                value={formData.tags}
                                label="Select Tags/Categories"
                                onChange={(e) => handleFormChange('tags', e.target.value)}
                                renderValue={(selected) => 
                                    selected.map(tagId => {
                                        const tag = availableTags?.find(t => t.id === tagId);
                                        return tag ? (
                                            <Chip key={tag.id} size="sm" color={tag.color} variant="flat">
                                                {tag.name}
                                            </Chip>
                                        ) : null;
                                    })
                                }
                            >
                                {availableTags?.map((tag) => (
                                    <MenuItem key={tag.id} value={tag.id}>
                                        <Chip size="sm" color={tag.color} variant="flat">
                                            {tag.name}
                                        </Chip>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Input
                            label="Create New Category"
                            placeholder="Enter new category name..."
                            value={formData.newCategory}
                            onValueChange={(value) => handleFormChange('newCategory', value)}
                            variant="bordered"
                        />
                    </div>
                );

            case 'archive':
                return (
                    <div className="space-y-4">
                        <Textarea
                            label="Archive Reason"
                            placeholder="Provide reason for archiving these projects (required for compliance)..."
                            value={formData.archiveReason}
                            onValueChange={(value) => handleFormChange('archiveReason', value)}
                            variant="bordered"
                            isRequired
                        />
                        <div className="bg-warning-50 p-3 rounded-lg border border-warning-200">
                            <div className="flex items-start space-x-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 mt-0.5" />
                                <div>
                                    <div className="font-medium text-warning-800">Archive Compliance Notice</div>
                                    <div className="text-sm text-warning-700">
                                        Archived projects will be moved to read-only status and included in compliance reporting.
                                        This action will be logged for audit purposes.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'delete':
                return (
                    <div className="space-y-4">
                        <div className="bg-danger-50 p-4 rounded-lg border border-danger-200">
                            <div className="flex items-start space-x-3">
                                <ExclamationTriangleIcon className="w-6 h-6 text-danger-600 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-danger-800">Permanent Deletion Warning</div>
                                    <div className="text-sm text-danger-700 mt-1">
                                        This action will permanently delete the selected projects and cannot be undone.
                                        All associated data, files, and history will be lost.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Textarea
                            label="Deletion Justification"
                            placeholder="Provide detailed justification for permanent deletion (required for audit)..."
                            value={formData.notes}
                            onValueChange={(value) => handleFormChange('notes', value)}
                            variant="bordered"
                            isRequired
                        />
                        <Checkbox
                            isRequired
                            color="danger"
                        >
                            I understand this action is permanent and cannot be undone
                        </Checkbox>
                    </div>
                );

            case 'duplicate':
                return (
                    <div className="space-y-4">
                        <Input
                            label="Template Name Prefix"
                            placeholder="Enter prefix for template names..."
                            value={formData.newCategory}
                            onValueChange={(value) => handleFormChange('newCategory', value)}
                            variant="bordered"
                        />
                        <div className="bg-info-50 p-3 rounded-lg border border-info-200">
                            <div className="flex items-start space-x-2">
                                <InformationCircleIcon className="w-5 h-5 text-info-600 mt-0.5" />
                                <div>
                                    <div className="font-medium text-info-800">Template Creation</div>
                                    <div className="text-sm text-info-700">
                                        This will create reusable project templates based on the selected projects' structure.
                                        Project data will be reset for template use.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="2xl" 
            scrollBehavior="inside"
            isDismissable={!isLoading}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <h3 className="text-lg font-semibold">Bulk Project Actions</h3>
                            <p className="text-sm text-default-500">
                                Perform actions on {selectedProjects.length} selected project{selectedProjects.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Chip size="sm" color="primary" variant="flat">
                            ISO 21500 Compliant
                        </Chip>
                    </div>
                </ModalHeader>

                <ModalBody>
                    {/* Selected Projects Summary */}
                    <Card className="mb-4">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">Selected Projects</h4>
                                <Chip size="sm" variant="flat">{selectedProjects.length} projects</Chip>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedProjects.map((project) => (
                                    <div key={project.id} className="flex items-center justify-between text-sm">
                                        <span className="truncate">{project.project_name}</span>
                                        <div className="flex items-center space-x-2">
                                            <Chip size="sm" color="default" variant="flat">
                                                {project.status?.replace('_', ' ')}
                                            </Chip>
                                            <AvatarGroup size="sm" max={3}>
                                                {project.team_members?.slice(0, 3).map((member) => (
                                                    <ProfileAvatar key={member.id} src={member.avatar} name={member.name} size="sm" />
                                                ))}
                                            </AvatarGroup>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Action Selection */}
                    <div className="space-y-4">
                        <FormControl 
                            fullWidth 
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'text.secondary',
                                },
                            }}
                        >
                            <InputLabel>Select Action</InputLabel>
                            <Select
                                value={actionType}
                                label="Select Action"
                                onChange={(e) => setActionType(e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="">
                                    <em>Choose an action to perform...</em>
                                </MenuItem>
                                {actionTypes.map((action) => (
                                    <MenuItem key={action.key} value={action.key}>
                                        <div className="flex items-start space-x-3">
                                            <div className={`p-2 rounded-lg ${action.dangerous ? 'bg-danger-100' : 'bg-primary-100'}`}>
                                                {action.icon}
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center space-x-2">
                                                    <span>{action.label}</span>
                                                    {action.requiresApproval && (
                                                        <Chip size="sm" color="warning" variant="flat">Requires Approval</Chip>
                                                    )}
                                                    {action.dangerous && (
                                                        <Chip size="sm" color="danger" variant="flat">High Risk</Chip>
                                                    )}
                                                </div>
                                                <div className="text-sm text-default-500">{action.description}</div>
                                                <div className="text-xs text-default-400 mt-1">
                                                    Category: {action.category}
                                                </div>
                                            </div>
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Action-specific Form */}
                        {actionType && (
                            <>
                                <Divider />
                                {renderActionForm()}
                            </>
                        )}

                        {/* Progress Indicator */}
                        {isLoading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Processing {selectedAction?.label}...</span>
                                    <span>Please wait</span>
                                </div>
                                <Progress isIndeterminate color="primary" size="sm" />
                            </div>
                        )}
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
                        color={selectedAction?.dangerous ? "danger" : "primary"}
                        onPress={handleSubmit}
                        isLoading={isLoading}
                        isDisabled={!actionType}
                        startContent={selectedAction?.icon}
                    >
                        {isLoading ? 'Processing...' : `Execute ${selectedAction?.label || 'Action'}`}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default BulkActionModal;
