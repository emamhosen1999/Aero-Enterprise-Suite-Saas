import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Switch,
    Select,
    SelectItem,
    Divider,
    Chip,
} from "@heroui/react";
import {
    Cog8ToothIcon,
    ClockIcon,
    ShieldCheckIcon,
    EnvelopeIcon,
    DocumentTextIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const Settings = ({ settings: initialSettings, plans, auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        default_trial_days: initialSettings?.default_trial_days || 14,
        require_email_verification: initialSettings?.require_email_verification ?? true,
        require_phone_verification: initialSettings?.require_phone_verification ?? false,
        require_manual_approval: initialSettings?.require_manual_approval ?? initialSettings?.require_admin_approval ?? false,
        auto_provision_on_approval: initialSettings?.auto_provision_on_approval ?? true,
        default_plan_id: initialSettings?.default_plan_id || '',
        welcome_email_enabled: initialSettings?.welcome_email_enabled ?? true,
        trial_reminder_days: initialSettings?.trial_reminder_days || '3,1',
        max_tenants_per_user: initialSettings?.max_tenants_per_user || 3,
        allow_custom_subdomain: initialSettings?.allow_custom_subdomain ?? true,
        require_company_info: initialSettings?.require_company_info ?? true,
        ...initialSettings,
    });

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const themeRadius = useThemeRadius();

    const canUpdateSettings = auth?.permissions?.includes('platform-onboarding.onboarding_settings.update')
        || auth?.permissions?.includes('*');

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.settings.update'), { settings });
                if (response.status === 200) {
                    resolve([response.data.message || 'Settings saved successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save settings']);
            } finally {
                setSaving(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving settings...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const availablePlans = plans || [
        { id: 1, name: 'Free' },
        { id: 2, name: 'Starter' },
        { id: 3, name: 'Professional' },
        { id: 4, name: 'Enterprise' },
    ];

    return (
        <>
            <Head title="Onboarding Settings" />

            <div className="flex flex-col w-full h-full p-4">
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="transition-all duration-200">
                            <CardHeader
                                className="border-b p-0"
                                style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}
                            >
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div
                                                className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                                                    borderRadius: 'var(--borderRadius, 12px)',
                                                }}
                                            >
                                                <Cog8ToothIcon
                                                    className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Onboarding Settings
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Configure registration, trials, and approval workflows
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                color="primary"
                                                variant="shadow"
                                                startContent={<CheckCircleIcon className="w-4 h-4" />}
                                                size={isMobile ? 'sm' : 'md'}
                                                onPress={handleSave}
                                                isLoading={saving}
                                                isDisabled={!canUpdateSettings}
                                            >
                                                Save Settings
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Trial Settings */}
                                    <Card className="border border-divider">
                                        <CardHeader className="border-b border-divider flex items-center gap-2">
                                            <ClockIcon className="w-5 h-5 text-default-500" />
                                            <h3 className="text-lg font-semibold">Trial Settings</h3>
                                        </CardHeader>
                                        <CardBody className="space-y-4">
                                            <Input
                                                type="number"
                                                label="Default Trial Days"
                                                placeholder="14"
                                                value={String(settings.default_trial_days)}
                                                onValueChange={(value) => handleChange('default_trial_days', parseInt(value) || 14)}
                                                radius={themeRadius}
                                                min={1}
                                                max={90}
                                            />
                                            <Select
                                                label="Default Plan"
                                                placeholder="Select default plan"
                                                selectedKeys={settings.default_plan_id ? [String(settings.default_plan_id)] : []}
                                                onSelectionChange={(keys) => handleChange('default_plan_id', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {availablePlans.map((plan) => (
                                                    <SelectItem key={String(plan.id)}>{plan.name}</SelectItem>
                                                ))}
                                            </Select>
                                            <Input
                                                label="Trial Reminder Days"
                                                placeholder="3,1"
                                                value={settings.trial_reminder_days}
                                                onValueChange={(value) => handleChange('trial_reminder_days', value)}
                                                description="Comma-separated days before expiry to send reminders"
                                                radius={themeRadius}
                                            />
                                        </CardBody>
                                    </Card>

                                    {/* Verification Settings */}
                                    <Card className="border border-divider">
                                        <CardHeader className="border-b border-divider flex items-center gap-2">
                                            <ShieldCheckIcon className="w-5 h-5 text-default-500" />
                                            <h3 className="text-lg font-semibold">Verification</h3>
                                        </CardHeader>
                                        <CardBody className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">Email Verification</p>
                                                    <p className="text-xs text-default-400">Require email verification before activation</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.require_email_verification}
                                                    onValueChange={(value) => handleChange('require_email_verification', value)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">Phone Verification</p>
                                                    <p className="text-xs text-default-400">Require phone verification</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.require_phone_verification}
                                                    onValueChange={(value) => handleChange('require_phone_verification', value)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">Admin Approval</p>
                                                    <p className="text-xs text-default-400">Require admin approval for new registrations</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.require_manual_approval}
                                                    onValueChange={(value) => handleChange('require_manual_approval', value)}
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Provisioning Settings */}
                                    <Card className="border border-divider">
                                        <CardHeader className="border-b border-divider flex items-center gap-2">
                                            <DocumentTextIcon className="w-5 h-5 text-default-500" />
                                            <h3 className="text-lg font-semibold">Provisioning</h3>
                                        </CardHeader>
                                        <CardBody className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">Auto-Provision</p>
                                                    <p className="text-xs text-default-400">Automatically provision after approval</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.auto_provision_on_approval}
                                                    onValueChange={(value) => handleChange('auto_provision_on_approval', value)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">Allow Custom Subdomain</p>
                                                    <p className="text-xs text-default-400">Let tenants choose their subdomain</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.allow_custom_subdomain}
                                                    onValueChange={(value) => handleChange('allow_custom_subdomain', value)}
                                                />
                                            </div>
                                            <Input
                                                type="number"
                                                label="Max Tenants Per User"
                                                placeholder="3"
                                                value={String(settings.max_tenants_per_user)}
                                                onValueChange={(value) => handleChange('max_tenants_per_user', parseInt(value) || 3)}
                                                radius={themeRadius}
                                                min={1}
                                                max={10}
                                            />
                                        </CardBody>
                                    </Card>

                                    {/* Email Settings */}
                                    <Card className="border border-divider">
                                        <CardHeader className="border-b border-divider flex items-center gap-2">
                                            <EnvelopeIcon className="w-5 h-5 text-default-500" />
                                            <h3 className="text-lg font-semibold">Email Notifications</h3>
                                        </CardHeader>
                                        <CardBody className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">Welcome Email</p>
                                                    <p className="text-xs text-default-400">Send welcome email on registration</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.welcome_email_enabled}
                                                    onValueChange={(value) => handleChange('welcome_email_enabled', value)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">Require Company Info</p>
                                                    <p className="text-xs text-default-400">Make company details mandatory</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.require_company_info}
                                                    onValueChange={(value) => handleChange('require_company_info', value)}
                                                />
                                            </div>
                                            <Divider />
                                            <div className="pt-2">
                                                <p className="text-sm text-default-500 mb-2">Email Templates</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Chip size="sm" variant="flat" color="success">Welcome</Chip>
                                                    <Chip size="sm" variant="flat" color="warning">Trial Reminder</Chip>
                                                    <Chip size="sm" variant="flat" color="danger">Trial Expired</Chip>
                                                    <Chip size="sm" variant="flat" color="primary">Approval</Chip>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

Settings.layout = (page) => <App children={page} />;

export default Settings;

