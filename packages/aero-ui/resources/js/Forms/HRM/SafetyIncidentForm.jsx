import React, { useState, useEffect } from 'react';
import {
    Input,
    Select,
    SelectItem,
    Textarea,
    Button,
    Checkbox,
    Divider,
    Chip
} from "@heroui/react";
import { 
    PlusIcon,
    XMarkIcon,
    UserIcon
} from "@heroicons/react/24/outline";
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const SafetyIncidentForm = ({ 
    incident, 
    employees = [],
    locations = [],
    mode = 'incident', // 'incident' or 'inspection'
    onSubmit, 
    onCancel 
}) => {
    const themeRadius = useThemeRadius();
    const isEdit = !!incident;
    const isInspection = mode === 'inspection';
    
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        description: '',
        location: '',
        incident_date: '',
        incident_time: '',
        severity: 'medium',
        status: 'open',
        reporter_id: null,
        assignee_id: null,
        injured_employee_ids: [],
        witnesses: '',
        root_cause: '',
        corrective_actions: '',
        preventive_measures: '',
        requires_osha_report: false,
        // Inspection specific fields
        inspection_type: '',
        inspector_id: null,
        checklist_items: [],
        findings: '',
        recommendations: '',
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [witnessInput, setWitnessInput] = useState('');

    // Populate form when editing
    useEffect(() => {
        if (incident) {
            setFormData({
                title: incident.title || '',
                type: incident.type || '',
                description: incident.description || '',
                location: incident.location || '',
                incident_date: incident.incident_date?.split('T')[0] || incident.inspection_date?.split('T')[0] || '',
                incident_time: incident.incident_time || '',
                severity: incident.severity || 'medium',
                status: incident.status || 'open',
                reporter_id: incident.reporter_id || null,
                assignee_id: incident.assignee_id || null,
                injured_employee_ids: incident.injured_employees?.map(e => e.id) || [],
                witnesses: incident.witnesses || '',
                root_cause: incident.root_cause || '',
                corrective_actions: incident.corrective_actions || '',
                preventive_measures: incident.preventive_measures || '',
                requires_osha_report: incident.requires_osha_report || false,
                // Inspection fields
                inspection_type: incident.inspection_type || '',
                inspector_id: incident.inspector_id || null,
                findings: incident.findings || '',
                recommendations: incident.recommendations || '',
            });
        }
    }, [incident]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleInjuredEmployeeToggle = (employeeId) => {
        setFormData(prev => {
            const current = prev.injured_employee_ids || [];
            const updated = current.includes(employeeId)
                ? current.filter(id => id !== employeeId)
                : [...current, employeeId];
            return { ...prev, injured_employee_ids: updated };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        }
        
        if (!isInspection && !formData.type) {
            newErrors.type = 'Incident type is required';
        }
        
        if (!formData.incident_date) {
            newErrors.incident_date = 'Date is required';
        }
        
        if (!formData.location?.trim()) {
            newErrors.location = 'Location is required';
        }

        if (isInspection && !formData.inspector_id) {
            newErrors.inspector_id = 'Inspector is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setSubmitting(false);
        }
    };

    const incidentTypes = [
        { key: 'injury', label: 'Injury' },
        { key: 'near_miss', label: 'Near Miss' },
        { key: 'property_damage', label: 'Property Damage' },
        { key: 'environmental', label: 'Environmental' },
        { key: 'fire', label: 'Fire' },
        { key: 'chemical_spill', label: 'Chemical Spill' },
        { key: 'electrical', label: 'Electrical' },
        { key: 'fall', label: 'Fall/Slip/Trip' },
        { key: 'other', label: 'Other' },
    ];

    const inspectionTypes = [
        { key: 'routine', label: 'Routine Inspection' },
        { key: 'safety_walkthrough', label: 'Safety Walkthrough' },
        { key: 'equipment', label: 'Equipment Inspection' },
        { key: 'fire_safety', label: 'Fire Safety' },
        { key: 'emergency_equipment', label: 'Emergency Equipment' },
        { key: 'workstation', label: 'Workstation Assessment' },
        { key: 'compliance', label: 'Compliance Audit' },
    ];

    const severityOptions = [
        { key: 'low', label: 'Low' },
        { key: 'medium', label: 'Medium' },
        { key: 'high', label: 'High' },
        { key: 'critical', label: 'Critical' },
    ];

    const incidentStatusOptions = [
        { key: 'open', label: 'Open' },
        { key: 'investigating', label: 'Investigating' },
        { key: 'resolved', label: 'Resolved' },
        { key: 'closed', label: 'Closed' },
    ];

    const inspectionStatusOptions = [
        { key: 'scheduled', label: 'Scheduled' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'passed', label: 'Passed' },
        { key: 'failed', label: 'Failed' },
        { key: 'requires_followup', label: 'Requires Follow-up' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <h4 className="font-medium text-default-700">
                    {isInspection ? 'Inspection Details' : 'Incident Details'}
                </h4>
                
                <Input
                    label="Title"
                    placeholder={isInspection ? "Enter inspection title" : "Brief description of the incident"}
                    value={formData.title}
                    onValueChange={(value) => handleChange('title', value)}
                    isInvalid={!!errors.title}
                    errorMessage={errors.title}
                    isRequired
                    radius={themeRadius}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label={isInspection ? "Inspection Type" : "Incident Type"}
                        placeholder="Select type"
                        selectedKeys={formData.type || formData.inspection_type ? [formData.type || formData.inspection_type] : []}
                        onSelectionChange={(keys) => handleChange(isInspection ? 'inspection_type' : 'type', Array.from(keys)[0])}
                        isInvalid={!!errors.type}
                        errorMessage={errors.type}
                        isRequired={!isInspection}
                        radius={themeRadius}
                    >
                        {(isInspection ? inspectionTypes : incidentTypes).map(type => (
                            <SelectItem key={type.key}>{type.label}</SelectItem>
                        ))}
                    </Select>
                    
                    <Input
                        label="Location"
                        placeholder="Where did this occur?"
                        value={formData.location}
                        onValueChange={(value) => handleChange('location', value)}
                        isInvalid={!!errors.location}
                        errorMessage={errors.location}
                        isRequired
                        radius={themeRadius}
                        list="location-suggestions"
                    />
                    {locations.length > 0 && (
                        <datalist id="location-suggestions">
                            {locations.map((loc, idx) => (
                                <option key={idx} value={loc.name || loc} />
                            ))}
                        </datalist>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="Date"
                        value={formData.incident_date}
                        onChange={(e) => handleChange('incident_date', e.target.value)}
                        isInvalid={!!errors.incident_date}
                        errorMessage={errors.incident_date}
                        isRequired
                        radius={themeRadius}
                    />
                    
                    {!isInspection && (
                        <Input
                            type="time"
                            label="Time (if known)"
                            value={formData.incident_time}
                            onChange={(e) => handleChange('incident_time', e.target.value)}
                            radius={themeRadius}
                        />
                    )}
                </div>

                <Textarea
                    label="Description"
                    placeholder={isInspection 
                        ? "Describe the inspection scope and objectives..." 
                        : "Describe what happened in detail..."
                    }
                    value={formData.description}
                    onValueChange={(value) => handleChange('description', value)}
                    minRows={3}
                    radius={themeRadius}
                />
            </div>

            <Divider />

            {/* Severity and Status (for incidents) */}
            {!isInspection && (
                <div className="space-y-4">
                    <h4 className="font-medium text-default-700">Severity & Status</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Severity"
                            selectedKeys={formData.severity ? [formData.severity] : []}
                            onSelectionChange={(keys) => handleChange('severity', Array.from(keys)[0])}
                            radius={themeRadius}
                        >
                            {severityOptions.map(sev => (
                                <SelectItem key={sev.key}>{sev.label}</SelectItem>
                            ))}
                        </Select>
                        
                        <Select
                            label="Status"
                            selectedKeys={formData.status ? [formData.status] : []}
                            onSelectionChange={(keys) => handleChange('status', Array.from(keys)[0])}
                            radius={themeRadius}
                        >
                            {incidentStatusOptions.map(st => (
                                <SelectItem key={st.key}>{st.label}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    
                    <Checkbox
                        isSelected={formData.requires_osha_report}
                        onValueChange={(value) => handleChange('requires_osha_report', value)}
                    >
                        <span className="text-sm">Requires OSHA Report</span>
                    </Checkbox>
                </div>
            )}

            {/* Inspection Status */}
            {isInspection && (
                <div className="space-y-4">
                    <h4 className="font-medium text-default-700">Inspection Status</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Inspector"
                            placeholder="Select inspector"
                            selectedKeys={formData.inspector_id ? [String(formData.inspector_id)] : []}
                            onSelectionChange={(keys) => handleChange('inspector_id', Array.from(keys)[0])}
                            isInvalid={!!errors.inspector_id}
                            errorMessage={errors.inspector_id}
                            isRequired
                            radius={themeRadius}
                        >
                            {employees.map(emp => (
                                <SelectItem key={String(emp.id)} textValue={emp.name}>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" />
                                        <span>{emp.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </Select>
                        
                        <Select
                            label="Status"
                            selectedKeys={formData.status ? [formData.status] : []}
                            onSelectionChange={(keys) => handleChange('status', Array.from(keys)[0])}
                            radius={themeRadius}
                        >
                            {inspectionStatusOptions.map(st => (
                                <SelectItem key={st.key}>{st.label}</SelectItem>
                            ))}
                        </Select>
                    </div>
                </div>
            )}

            <Divider />

            {/* People Involved (for incidents) */}
            {!isInspection && (
                <div className="space-y-4">
                    <h4 className="font-medium text-default-700">People Involved</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Reported By"
                            placeholder="Select reporter"
                            selectedKeys={formData.reporter_id ? [String(formData.reporter_id)] : []}
                            onSelectionChange={(keys) => handleChange('reporter_id', Array.from(keys)[0])}
                            radius={themeRadius}
                        >
                            {employees.map(emp => (
                                <SelectItem key={String(emp.id)} textValue={emp.name}>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" />
                                        <span>{emp.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </Select>
                        
                        <Select
                            label="Assigned To"
                            placeholder="Assign investigator"
                            selectedKeys={formData.assignee_id ? [String(formData.assignee_id)] : []}
                            onSelectionChange={(keys) => handleChange('assignee_id', Array.from(keys)[0])}
                            radius={themeRadius}
                        >
                            {employees.map(emp => (
                                <SelectItem key={String(emp.id)} textValue={emp.name}>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" />
                                        <span>{emp.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                    
                    {/* Injured Employees */}
                    <div>
                        <label className="text-sm text-default-600 mb-2 block">
                            Injured Employees (select all that apply)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {employees.slice(0, 10).map(emp => (
                                <Chip
                                    key={emp.id}
                                    variant={formData.injured_employee_ids?.includes(emp.id) ? 'solid' : 'bordered'}
                                    color={formData.injured_employee_ids?.includes(emp.id) ? 'danger' : 'default'}
                                    className="cursor-pointer"
                                    onClick={() => handleInjuredEmployeeToggle(emp.id)}
                                >
                                    {emp.name}
                                </Chip>
                            ))}
                            {employees.length > 10 && (
                                <Chip variant="flat" size="sm">+{employees.length - 10} more</Chip>
                            )}
                        </div>
                    </div>
                    
                    <Textarea
                        label="Witnesses"
                        placeholder="List any witnesses (names, contact info if available)"
                        value={formData.witnesses}
                        onValueChange={(value) => handleChange('witnesses', value)}
                        minRows={2}
                        radius={themeRadius}
                    />
                </div>
            )}

            <Divider />

            {/* Investigation / Findings */}
            <div className="space-y-4">
                <h4 className="font-medium text-default-700">
                    {isInspection ? 'Findings & Recommendations' : 'Investigation'}
                </h4>
                
                {!isInspection && (
                    <Textarea
                        label="Root Cause Analysis"
                        placeholder="What was the root cause of this incident?"
                        value={formData.root_cause}
                        onValueChange={(value) => handleChange('root_cause', value)}
                        minRows={2}
                        radius={themeRadius}
                    />
                )}

                {isInspection && (
                    <Textarea
                        label="Findings"
                        placeholder="Document inspection findings..."
                        value={formData.findings}
                        onValueChange={(value) => handleChange('findings', value)}
                        minRows={3}
                        radius={themeRadius}
                    />
                )}
                
                <Textarea
                    label={isInspection ? "Recommendations" : "Corrective Actions"}
                    placeholder={isInspection 
                        ? "What improvements are recommended?" 
                        : "What actions are being taken to address this incident?"
                    }
                    value={isInspection ? formData.recommendations : formData.corrective_actions}
                    onValueChange={(value) => handleChange(isInspection ? 'recommendations' : 'corrective_actions', value)}
                    minRows={2}
                    radius={themeRadius}
                />
                
                {!isInspection && (
                    <Textarea
                        label="Preventive Measures"
                        placeholder="What measures will prevent similar incidents?"
                        value={formData.preventive_measures}
                        onValueChange={(value) => handleChange('preventive_measures', value)}
                        minRows={2}
                        radius={themeRadius}
                    />
                )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
                <Button variant="flat" onPress={onCancel} isDisabled={submitting}>
                    Cancel
                </Button>
                <Button 
                    color="primary" 
                    type="submit" 
                    isLoading={submitting}
                >
                    {isEdit 
                        ? (isInspection ? 'Update Inspection' : 'Update Incident') 
                        : (isInspection ? 'Create Inspection' : 'Report Incident')
                    }
                </Button>
            </div>
        </form>
    );
};

export default SafetyIncidentForm;
