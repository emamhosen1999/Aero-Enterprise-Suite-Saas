import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Checkbox, Textarea, Tabs, Tab, Chip, Progress } from "@heroui/react";
import { PaperAirplaneIcon, UsersIcon, DocumentTextIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function BulkNotificationModal({ open, onClose, templates = [], users = [], roles = [], departments = [] }) {
    const [activeTab, setActiveTab] = useState('recipients');
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // Recipients state
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [customEmails, setCustomEmails] = useState('');
    const [userSearch, setUserSearch] = useState('');
    
    // Content state
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedChannel, setSelectedChannel] = useState('email');
    const [variables, setVariables] = useState({});
    const [templatePreview, setTemplatePreview] = useState({ subject: '', body: '' });
    
    // Schedule state
    const [scheduleType, setScheduleType] = useState('immediate');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // Get theme radius
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const themeRadius = getThemeRadius();

    // Calculate total recipients
    const getTotalRecipients = () => {
        let count = selectedUsers.length;
        count += selectedRoles.reduce((sum, roleId) => {
            const role = roles.find(r => r.id === roleId);
            return sum + (role?.users_count || 0);
        }, 0);
        count += selectedDepartments.reduce((sum, deptId) => {
            const dept = departments.find(d => d.id === deptId);
            return sum + (dept?.users_count || 0);
        }, 0);
        if (customEmails) {
            count += customEmails.split(',').filter(e => e.trim()).length;
        }
        return count;
    };

    // Extract template variables
    const extractVariables = (text) => {
        if (!text) return [];
        const regex = /\{\{(\w+)\}\}/g;
        const matches = [...text.matchAll(regex)];
        return [...new Set(matches.map(m => m[1]))];
    };

    // Update template preview when template or variables change
    useEffect(() => {
        if (selectedTemplate) {
            const template = templates.find(t => t.id === parseInt(selectedTemplate));
            if (template) {
                let subject = template.subject || '';
                let body = template.body || '';
                
                // Replace variables
                Object.entries(variables).forEach(([key, value]) => {
                    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                    subject = subject.replace(regex, value || `{{${key}}}`);
                    body = body.replace(regex, value || `{{${key}}}`);
                });
                
                setTemplatePreview({ subject, body });
            }
        }
    }, [selectedTemplate, variables, templates]);

    // Detect variables when template changes
    useEffect(() => {
        if (selectedTemplate) {
            const template = templates.find(t => t.id === parseInt(selectedTemplate));
            if (template) {
                const subjectVars = extractVariables(template.subject);
                const bodyVars = extractVariables(template.body);
                const allVars = [...new Set([...subjectVars, ...bodyVars])];
                
                // Initialize variables with defaults
                const newVariables = {};
                allVars.forEach(v => {
                    newVariables[v] = variables[v] || '';
                });
                setVariables(newVariables);
            }
        }
    }, [selectedTemplate, templates]);

    const handleSend = async () => {
        // Validation
        if (getTotalRecipients() === 0) {
            showToast.error('Please select at least one recipient');
            return;
        }
        
        if (!selectedTemplate) {
            showToast.error('Please select a template');
            return;
        }
        
        if (scheduleType === 'scheduled' && (!scheduleDate || !scheduleTime)) {
            showToast.error('Please set schedule date and time');
            return;
        }

        const data = {
            recipients: {
                users: selectedUsers,
                roles: selectedRoles,
                departments: selectedDepartments,
                custom_emails: customEmails.split(',').map(e => e.trim()).filter(e => e)
            },
            template_id: selectedTemplate,
            channel: selectedChannel,
            variables,
            schedule_type: scheduleType,
            ...(scheduleType === 'scheduled' && {
                scheduled_at: `${scheduleDate} ${scheduleTime}`
            })
        };

        setSending(true);
        setProgress(0);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.notifications.bulk.send'), data);
                
                // Simulate progress updates
                const interval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(interval);
                            return prev;
                        }
                        return prev + 10;
                    });
                }, 200);

                // Wait for completion
                setTimeout(() => {
                    clearInterval(interval);
                    setProgress(100);
                    resolve(['Notifications sent successfully']);
                    setTimeout(() => {
                        handleClose();
                        router.reload({ only: ['notifications'] });
                    }, 1000);
                }, 2000);
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to send notifications']);
            }
        });

        showToast.promise(promise, {
            loading: 'Sending notifications...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        promise.finally(() => setSending(false));
    };

    const handleClose = () => {
        setActiveTab('recipients');
        setSelectedUsers([]);
        setSelectedRoles([]);
        setSelectedDepartments([]);
        setCustomEmails('');
        setSelectedTemplate('');
        setSelectedChannel('email');
        setVariables({});
        setScheduleType('immediate');
        setScheduleDate('');
        setScheduleTime('');
        setProgress(0);
        onClose();
    };

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const canProceedToContent = getTotalRecipients() > 0;
    const canProceedToSchedule = selectedTemplate && selectedChannel;
    const canSend = canProceedToContent && canProceedToSchedule;

    return (
        <Modal 
            isOpen={open} 
            onOpenChange={handleClose}
            size="3xl"
            scrollBehavior="inside"
            isDismissable={!sending}
            classNames={{
                base: "bg-content1",
                header: "border-b border-divider",
                body: "py-6",
                footer: "border-t border-divider"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <PaperAirplaneIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Send Bulk Notification</h2>
                    </div>
                    {getTotalRecipients() > 0 && (
                        <p className="text-sm text-default-500 font-normal">
                            {getTotalRecipients()} recipient{getTotalRecipients() !== 1 ? 's' : ''} selected
                        </p>
                    )}
                </ModalHeader>
                
                <ModalBody>
                    {sending && progress < 100 && (
                        <div className="mb-4">
                            <Progress 
                                value={progress} 
                                color="primary"
                                showValueLabel
                                label="Sending notifications..."
                                className="mb-2"
                            />
                        </div>
                    )}

                    <Tabs 
                        selectedKey={activeTab} 
                        onSelectionChange={setActiveTab}
                        aria-label="Notification wizard"
                        radius={themeRadius}
                        color="primary"
                        isDisabled={sending}
                    >
                        <Tab key="recipients" title={
                            <div className="flex items-center gap-2">
                                <UsersIcon className="w-4 h-4" />
                                <span>Recipients</span>
                            </div>
                        }>
                            <div className="space-y-4 py-4">
                                {/* User Selection */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Select Users</label>
                                    <Input
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onValueChange={setUserSearch}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                        className="mb-2"
                                    />
                                    <div className="max-h-40 overflow-y-auto border border-divider rounded-lg p-2 space-y-1">
                                        {filteredUsers.map(user => (
                                            <Checkbox
                                                key={user.id}
                                                isSelected={selectedUsers.includes(user.id)}
                                                onValueChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedUsers([...selectedUsers, user.id]);
                                                    } else {
                                                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                    }
                                                }}
                                                radius={themeRadius}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{user.name}</span>
                                                    <span className="text-xs text-default-400">{user.email}</span>
                                                </div>
                                            </Checkbox>
                                        ))}
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <Select
                                    label="Select Roles"
                                    placeholder="Choose roles to notify"
                                    selectionMode="multiple"
                                    selectedKeys={selectedRoles}
                                    onSelectionChange={(keys) => setSelectedRoles(Array.from(keys))}
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    {roles.map(role => (
                                        <SelectItem key={role.id} textValue={role.name}>
                                            <div className="flex justify-between items-center">
                                                <span>{role.name}</span>
                                                <Chip size="sm" variant="flat">{role.users_count || 0} users</Chip>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>

                                {/* Department Selection */}
                                <Select
                                    label="Select Departments"
                                    placeholder="Choose departments to notify"
                                    selectionMode="multiple"
                                    selectedKeys={selectedDepartments}
                                    onSelectionChange={(keys) => setSelectedDepartments(Array.from(keys))}
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} textValue={dept.name}>
                                            <div className="flex justify-between items-center">
                                                <span>{dept.name}</span>
                                                <Chip size="sm" variant="flat">{dept.users_count || 0} users</Chip>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>

                                {/* Custom Emails */}
                                <Textarea
                                    label="Custom Email Addresses"
                                    placeholder="Enter email addresses separated by commas"
                                    value={customEmails}
                                    onValueChange={setCustomEmails}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    description="You can add email addresses that are not in the system"
                                />
                            </div>
                        </Tab>

                        <Tab key="content" title={
                            <div className="flex items-center gap-2">
                                <DocumentTextIcon className="w-4 h-4" />
                                <span>Content</span>
                            </div>
                        } isDisabled={!canProceedToContent}>
                            <div className="space-y-4 py-4">
                                {/* Template Selection */}
                                <Select
                                    label="Notification Template"
                                    placeholder="Select a template"
                                    selectedKeys={selectedTemplate ? [selectedTemplate] : []}
                                    onSelectionChange={(keys) => setSelectedTemplate(Array.from(keys)[0])}
                                    radius={themeRadius}
                                    isRequired
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    {templates.map(template => (
                                        <SelectItem key={String(template.id)} textValue={template.name}>
                                            <div className="flex items-center gap-2">
                                                <Chip size="sm" color={template.is_active ? "success" : "default"} variant="flat">
                                                    {template.channel}
                                                </Chip>
                                                <span>{template.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>

                                {/* Channel Selection */}
                                <Select
                                    label="Notification Channel"
                                    placeholder="Select channel"
                                    selectedKeys={[selectedChannel]}
                                    onSelectionChange={(keys) => setSelectedChannel(Array.from(keys)[0])}
                                    radius={themeRadius}
                                    isRequired
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    <SelectItem key="email">Email</SelectItem>
                                    <SelectItem key="sms">SMS</SelectItem>
                                    <SelectItem key="push">Push Notification</SelectItem>
                                    <SelectItem key="slack">Slack</SelectItem>
                                </Select>

                                {/* Variable Mapping */}
                                {Object.keys(variables).length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Template Variables</label>
                                        <div className="space-y-2">
                                            {Object.keys(variables).map(key => (
                                                <Input
                                                    key={key}
                                                    label={`{{${key}}}`}
                                                    placeholder={`Enter value for ${key}`}
                                                    value={variables[key]}
                                                    onValueChange={(value) => setVariables({ ...variables, [key]: value })}
                                                    radius={themeRadius}
                                                    classNames={{ inputWrapper: "bg-default-100" }}
                                                    description={`Default: {{${key}}}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preview */}
                                {selectedTemplate && (
                                    <div className="border border-divider rounded-lg p-4">
                                        <h4 className="text-sm font-semibold mb-2">Preview</h4>
                                        {templatePreview.subject && (
                                            <div className="mb-2">
                                                <span className="text-xs text-default-500">Subject:</span>
                                                <p className="text-sm font-medium">{templatePreview.subject}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-xs text-default-500">Body:</span>
                                            <p className="text-sm whitespace-pre-wrap">{templatePreview.body}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Tab>

                        <Tab key="schedule" title={
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                <span>Schedule</span>
                            </div>
                        } isDisabled={!canProceedToSchedule}>
                            <div className="space-y-4 py-4">
                                <Select
                                    label="When to send"
                                    placeholder="Select timing"
                                    selectedKeys={[scheduleType]}
                                    onSelectionChange={(keys) => setScheduleType(Array.from(keys)[0])}
                                    radius={themeRadius}
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    <SelectItem key="immediate">Send Immediately</SelectItem>
                                    <SelectItem key="scheduled">Schedule for Later</SelectItem>
                                </Select>

                                {scheduleType === 'scheduled' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            type="date"
                                            label="Date"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            radius={themeRadius}
                                            isRequired
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                        <Input
                                            type="time"
                                            label="Time"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            radius={themeRadius}
                                            isRequired
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                        />
                                    </div>
                                )}

                                {/* Summary */}
                                <div className="border border-divider rounded-lg p-4 bg-default-50">
                                    <h4 className="text-sm font-semibold mb-3">Notification Summary</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-default-500">Recipients:</span>
                                            <span className="font-medium">{getTotalRecipients()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-default-500">Channel:</span>
                                            <Chip size="sm" variant="flat" color="primary">{selectedChannel}</Chip>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-default-500">Schedule:</span>
                                            <span className="font-medium">
                                                {scheduleType === 'immediate' ? 'Immediate' : `${scheduleDate} ${scheduleTime}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Tab>
                    </Tabs>
                </ModalBody>
                
                <ModalFooter>
                    <Button 
                        variant="flat" 
                        onPress={handleClose}
                        isDisabled={sending}
                        radius={themeRadius}
                    >
                        Cancel
                    </Button>
                    
                    {activeTab === 'recipients' && (
                        <Button 
                            color="primary" 
                            onPress={() => setActiveTab('content')}
                            isDisabled={!canProceedToContent || sending}
                            radius={themeRadius}
                        >
                            Next: Content
                        </Button>
                    )}
                    
                    {activeTab === 'content' && (
                        <>
                            <Button 
                                variant="flat"
                                onPress={() => setActiveTab('recipients')}
                                isDisabled={sending}
                                radius={themeRadius}
                            >
                                Back
                            </Button>
                            <Button 
                                color="primary" 
                                onPress={() => setActiveTab('schedule')}
                                isDisabled={!canProceedToSchedule || sending}
                                radius={themeRadius}
                            >
                                Next: Schedule
                            </Button>
                        </>
                    )}
                    
                    {activeTab === 'schedule' && (
                        <>
                            <Button 
                                variant="flat"
                                onPress={() => setActiveTab('content')}
                                isDisabled={sending}
                                radius={themeRadius}
                            >
                                Back
                            </Button>
                            <Button 
                                color="primary" 
                                onPress={handleSend}
                                isLoading={sending}
                                isDisabled={!canSend}
                                startContent={!sending && <PaperAirplaneIcon className="w-4 h-4" />}
                                radius={themeRadius}
                            >
                                {scheduleType === 'immediate' ? 'Send Now' : 'Schedule Notification'}
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
