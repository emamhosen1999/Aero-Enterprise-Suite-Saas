import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { 
    Button, 
    Card, 
    CardBody, 
    CardHeader, 
    Input, 
    Select, 
    SelectItem,
    Switch,
    Tabs,
    Tab,
    Divider,
    Chip
} from "@heroui/react";
import { 
    Cog6ToothIcon,
    CalendarDaysIcon,
    ClockIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    BellIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const TimeOffSettings = ({ title, settings: initialSettings, leaveTypes: initialLeaveTypes }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canUpdate, hasAccess } = useHRMAC();
    
    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State management
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [settings, setSettings] = useState(initialSettings || {});
    const [leaveTypes, setLeaveTypes] = useState(initialLeaveTypes || []);
    const [activeTab, setActiveTab] = useState('general');
    const [stats, setStats] = useState({ 
        activeTypes: 0, 
        totalPolicies: 0, 
        autoApproval: 0, 
        notifications: 0 
    });

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Active Leave Types", 
            value: stats.activeTypes, 
            icon: <CalendarDaysIcon className="w-5 h-5" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Total Policies", 
            value: stats.totalPolicies, 
            icon: <DocumentTextIcon className="w-5 h-5" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Auto Approval Rules", 
            value: stats.autoApproval, 
            icon: <ShieldCheckIcon className="w-5 h-5" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Notification Rules", 
            value: stats.notifications, 
            icon: <BellIcon className="w-5 h-5" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        }
    ], [stats]);

    // Permission checks
    const canUpdateSettings = canUpdate && hasAccess('hrm.time-off.settings');

    // Fetch settings data
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.time-off.settings'));
            if (response.status === 200) {
                setSettings(response.data.settings || {});
                setLeaveTypes(response.data.leaveTypes || []);
                setStats(response.data.stats || { 
                    activeTypes: 0, 
                    totalPolicies: 0, 
                    autoApproval: 0, 
                    notifications: 0 
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch settings' });
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    // Settings update handler
    const handleSettingsUpdate = useCallback(async (section, key, value) => {
        if (!canUpdateSettings) return;
        
        setSaving(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('hrm.time-off.settings.update'), {
                    section,
                    key,
                    value
                });
                if (response.status === 200) {
                    // Update local state
                    setSettings(prev => ({
                        ...prev,
                        [section]: {
                            ...prev[section],
                            [key]: value
                        }
                    }));
                    resolve([response.data.message || 'Settings updated successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to update settings']);
            } finally {
                setSaving(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating settings...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [canUpdateSettings]);

    return (
        <>
            <Head title={title} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Time Off Settings">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Animated Card wrapper */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Main Card with theme styling */}
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                {/* Card Header */}
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Title Section */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <Cog6ToothIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Time Off Settings
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Configure time off policies and system settings
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />

                                    {/* Settings Tabs */}
                                    <Tabs 
                                        selectedKey={activeTab}
                                        onSelectionChange={setActiveTab}
                                        className="mb-6"
                                    >
                                        <Tab key="general" title="General Settings">
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="text-lg font-semibold">General Configuration</h3>
                                                    </CardHeader>
                                                    <CardBody className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">Allow Weekend Requests</p>
                                                                <p className="text-sm text-default-500">Allow employees to request time off on weekends</p>
                                                            </div>
                                                            <Switch 
                                                                isSelected={settings.general?.allowWeekends || false}
                                                                onValueChange={(value) => handleSettingsUpdate('general', 'allowWeekends', value)}
                                                                isDisabled={!canUpdateSettings || saving}
                                                            />
                                                        </div>
                                                        
                                                        <Divider />
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">Require Reason</p>
                                                                <p className="text-sm text-default-500">Require employees to provide a reason for time off</p>
                                                            </div>
                                                            <Switch 
                                                                isSelected={settings.general?.requireReason || false}
                                                                onValueChange={(value) => handleSettingsUpdate('general', 'requireReason', value)}
                                                                isDisabled={!canUpdateSettings || saving}
                                                            />
                                                        </div>
                                                        
                                                        <Divider />
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <Input
                                                                label="Minimum Notice (Days)"
                                                                type="number"
                                                                value={settings.general?.minimumNotice || 1}
                                                                onChange={(e) => handleSettingsUpdate('general', 'minimumNotice', parseInt(e.target.value))}
                                                                isDisabled={!canUpdateSettings || saving}
                                                                radius={themeRadius}
                                                            />
                                                            
                                                            <Input
                                                                label="Maximum Days Per Request"
                                                                type="number"
                                                                value={settings.general?.maxDaysPerRequest || 30}
                                                                onChange={(e) => handleSettingsUpdate('general', 'maxDaysPerRequest', parseInt(e.target.value))}
                                                                isDisabled={!canUpdateSettings || saving}
                                                                radius={themeRadius}
                                                            />
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>

                                        <Tab key="approval" title="Approval Workflow">
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="text-lg font-semibold">Approval Configuration</h3>
                                                    </CardHeader>
                                                    <CardBody className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">Auto-Approve Short Requests</p>
                                                                <p className="text-sm text-default-500">Automatically approve requests under specified days</p>
                                                            </div>
                                                            <Switch 
                                                                isSelected={settings.approval?.autoApproveShort || false}
                                                                onValueChange={(value) => handleSettingsUpdate('approval', 'autoApproveShort', value)}
                                                                isDisabled={!canUpdateSettings || saving}
                                                            />
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <Input
                                                                label="Auto-Approve Threshold (Days)"
                                                                type="number"
                                                                value={settings.approval?.autoApproveThreshold || 1}
                                                                onChange={(e) => handleSettingsUpdate('approval', 'autoApproveThreshold', parseInt(e.target.value))}
                                                                isDisabled={!canUpdateSettings || saving || !settings.approval?.autoApproveShort}
                                                                radius={themeRadius}
                                                            />
                                                            
                                                            <Select
                                                                label="Default Approver"
                                                                placeholder="Direct Manager"
                                                                selectedKeys={settings.approval?.defaultApprover ? [settings.approval.defaultApprover] : []}
                                                                onSelectionChange={(keys) => handleSettingsUpdate('approval', 'defaultApprover', Array.from(keys)[0])}
                                                                isDisabled={!canUpdateSettings || saving}
                                                                radius={themeRadius}
                                                            >
                                                                <SelectItem key="manager">Direct Manager</SelectItem>
                                                                <SelectItem key="hr">HR Manager</SelectItem>
                                                                <SelectItem key="admin">System Admin</SelectItem>
                                                            </Select>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>

                                        <Tab key="notifications" title="Notifications">
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <h3 className="text-lg font-semibold">Notification Settings</h3>
                                                    </CardHeader>
                                                    <CardBody className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">Email Notifications</p>
                                                                <p className="text-sm text-default-500">Send email notifications for requests and approvals</p>
                                                            </div>
                                                            <Switch 
                                                                isSelected={settings.notifications?.email || true}
                                                                onValueChange={(value) => handleSettingsUpdate('notifications', 'email', value)}
                                                                isDisabled={!canUpdateSettings || saving}
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">Slack Notifications</p>
                                                                <p className="text-sm text-default-500">Send Slack notifications to designated channels</p>
                                                            </div>
                                                            <Switch 
                                                                isSelected={settings.notifications?.slack || false}
                                                                onValueChange={(value) => handleSettingsUpdate('notifications', 'slack', value)}
                                                                isDisabled={!canUpdateSettings || saving}
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">Reminder Notifications</p>
                                                                <p className="text-sm text-default-500">Send reminder notifications for pending approvals</p>
                                                            </div>
                                                            <Switch 
                                                                isSelected={settings.notifications?.reminders || true}
                                                                onValueChange={(value) => handleSettingsUpdate('notifications', 'reminders', value)}
                                                                isDisabled={!canUpdateSettings || saving}
                                                            />
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>

                                        <Tab key="leave-types" title="Leave Types">
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader className="flex justify-between items-center">
                                                        <h3 className="text-lg font-semibold">Manage Leave Types</h3>
                                                        {canUpdateSettings && (
                                                            <Button size="sm" color="primary">
                                                                Add Leave Type
                                                            </Button>
                                                        )}
                                                    </CardHeader>
                                                    <CardBody>
                                                        <div className="space-y-4">
                                                            {leaveTypes.map((type, index) => (
                                                                <div key={index} className="flex items-center justify-between p-4 border border-divider rounded-lg">
                                                                    <div className="flex items-center gap-3">
                                                                        <div>
                                                                            <p className="font-medium">{type.name}</p>
                                                                            <p className="text-sm text-default-500">{type.description}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <Chip 
                                                                            color={type.isActive ? 'success' : 'default'} 
                                                                            size="sm"
                                                                        >
                                                                            {type.isActive ? 'Active' : 'Inactive'}
                                                                        </Chip>
                                                                        <Chip variant="flat" size="sm">
                                                                            {type.maxDaysPerYear || 'Unlimited'} days/year
                                                                        </Chip>
                                                                        {canUpdateSettings && (
                                                                            <Button size="sm" variant="flat">
                                                                                Edit
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {leaveTypes.length === 0 && (
                                                                <div className="text-center text-default-500 py-8">
                                                                    No leave types configured. Add your first leave type to get started.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </Tab>
                                    </Tabs>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

TimeOffSettings.layout = (page) => <App children={page} />;
export default TimeOffSettings;