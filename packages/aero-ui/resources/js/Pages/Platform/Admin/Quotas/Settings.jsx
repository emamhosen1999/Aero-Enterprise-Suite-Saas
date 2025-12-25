import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, Input, Slider, Switch, Select, SelectItem, Button } from '@heroui/react';
import { showToast } from '@/utils/toastUtils';

import PageHeader from '@/Components/PageHeader';

export default function Settings({ title, settings: initialSettings }) {
    const [settings, setSettings] = useState(initialSettings || {
        users: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
        storage: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
        api_calls: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
        employees: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
        projects: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
        notifications: { email: true, sms: true, slack: false },
        escalation: { daily_at: 90, hourly_at: 95, realtime_at: 99 },
        throttling: { enabled: true, delay_95: 1, delay_99: 2 },
        retention: 90
    });

    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'xl';
    };

    const themeRadius = getThemeRadius();
    const quotaTypes = ['users', 'storage', 'api_calls', 'employees', 'projects'];

    const handleQuotaChange = (type, field, value) => {
        setSettings(prev => ({
            ...prev,
            [type]: { ...prev[type], [field]: value }
        }));
    };

    const handleNotificationToggle = (channel) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [channel]: !prev.notifications[channel] }
        }));
    };

    const handleEscalationChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            escalation: { ...prev.escalation, [field]: value }
        }));
    };

    const handleThrottlingChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            throttling: { ...prev.throttling, [field]: value }
        }));
    };

    const handleSave = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.quotas.settings.update'), settings);
                if (response.status === 200) {
                    resolve([response.data.message || 'Settings saved successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save settings']);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving settings...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleReset = () => {
        setSettings({
            users: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
            storage: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
            api_calls: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
            employees: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
            projects: { warning_threshold: 80, block_threshold: 100, grace_period_days: 10 },
            notifications: { email: true, sms: true, slack: false },
            escalation: { daily_at: 90, hourly_at: 95, realtime_at: 99 },
            throttling: { enabled: true, delay_95: 1, delay_99: 2 },
            retention: 90
        });
        showToast.success('Settings reset to defaults');
    };

    return (
        <>
            <Head title={title || 'Quota Enforcement Settings'} />
            
            <div className="space-y-6">
                <PageHeader 
                    title="Quota Enforcement Settings"
                    subtitle="Configure warning thresholds, grace periods, and notification channels"
                />

                {/* Quota Type Settings */}
                <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                    <CardHeader className="border-b border-divider p-4">
                        <h3 className="text-lg font-semibold">Quota Thresholds & Grace Periods</h3>
                    </CardHeader>
                    <CardBody className="p-6 space-y-6">
                        {quotaTypes.map(type => (
                            <div key={type} className="space-y-4 pb-6 border-b border-divider last:border-0 last:pb-0">
                                <h4 className="font-medium capitalize">{type.replace('_', ' ')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm text-default-600 mb-2 block">Warning Threshold (%)</label>
                                        <Slider
                                            value={settings[type]?.warning_threshold || 80}
                                            onChange={(value) => handleQuotaChange(type, 'warning_threshold', value)}
                                            min={50}
                                            max={100}
                                            step={5}
                                            className="max-w-md"
                                            color="warning"
                                        />
                                        <span className="text-xs text-default-500 mt-1">{settings[type]?.warning_threshold || 80}%</span>
                                    </div>
                                    <div>
                                        <label className="text-sm text-default-600 mb-2 block">Block Threshold (%)</label>
                                        <Slider
                                            value={settings[type]?.block_threshold || 100}
                                            onChange={(value) => handleQuotaChange(type, 'block_threshold', value)}
                                            min={80}
                                            max={100}
                                            step={5}
                                            className="max-w-md"
                                            color="danger"
                                        />
                                        <span className="text-xs text-default-500 mt-1">{settings[type]?.block_threshold || 100}%</span>
                                    </div>
                                    <Input
                                        type="number"
                                        label="Grace Period (days)"
                                        value={settings[type]?.grace_period_days || 10}
                                        onChange={(e) => handleQuotaChange(type, 'grace_period_days', parseInt(e.target.value))}
                                        min={1}
                                        max={90}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardBody>
                </Card>

                {/* Notification Channels */}
                <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                    <CardHeader className="border-b border-divider p-4">
                        <h3 className="text-lg font-semibold">Notification Channels</h3>
                    </CardHeader>
                    <CardBody className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between p-4 bg-default-100 rounded-lg">
                                <span className="font-medium">Email</span>
                                <Switch
                                    isSelected={settings.notifications?.email}
                                    onValueChange={() => handleNotificationToggle('email')}
                                    color="primary"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-default-100 rounded-lg">
                                <span className="font-medium">SMS</span>
                                <Switch
                                    isSelected={settings.notifications?.sms}
                                    onValueChange={() => handleNotificationToggle('sms')}
                                    color="primary"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-default-100 rounded-lg">
                                <span className="font-medium">Slack</span>
                                <Switch
                                    isSelected={settings.notifications?.slack}
                                    onValueChange={() => handleNotificationToggle('slack')}
                                    color="primary"
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Warning Escalation */}
                <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                    <CardHeader className="border-b border-divider p-4">
                        <h3 className="text-lg font-semibold">Warning Escalation Schedule</h3>
                    </CardHeader>
                    <CardBody className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                type="number"
                                label="Daily Alerts At (%)"
                                value={settings.escalation?.daily_at || 90}
                                onChange={(e) => handleEscalationChange('daily_at', parseInt(e.target.value))}
                                min={80}
                                max={100}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            <Input
                                type="number"
                                label="Hourly Alerts At (%)"
                                value={settings.escalation?.hourly_at || 95}
                                onChange={(e) => handleEscalationChange('hourly_at', parseInt(e.target.value))}
                                min={80}
                                max={100}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            <Input
                                type="number"
                                label="Real-time Alerts At (%)"
                                value={settings.escalation?.realtime_at || 99}
                                onChange={(e) => handleEscalationChange('realtime_at', parseInt(e.target.value))}
                                min={80}
                                max={100}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* API Throttling */}
                <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                    <CardHeader className="border-b border-divider p-4">
                        <h3 className="text-lg font-semibold">API Throttling Configuration</h3>
                    </CardHeader>
                    <CardBody className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Enable Progressive Throttling</span>
                                <Switch
                                    isSelected={settings.throttling?.enabled}
                                    onValueChange={(value) => handleThrottlingChange('enabled', value)}
                                    color="primary"
                                />
                            </div>
                            {settings.throttling?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <Input
                                        type="number"
                                        label="Delay at 95% (seconds)"
                                        value={settings.throttling?.delay_95 || 1}
                                        onChange={(e) => handleThrottlingChange('delay_95', parseInt(e.target.value))}
                                        min={0}
                                        max={10}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                        description="75% speed reduction"
                                    />
                                    <Input
                                        type="number"
                                        label="Delay at 99% (seconds)"
                                        value={settings.throttling?.delay_99 || 2}
                                        onChange={(e) => handleThrottlingChange('delay_99', parseInt(e.target.value))}
                                        min={0}
                                        max={10}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                        description="50% speed reduction"
                                    />
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Warning History Retention */}
                <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                    <CardHeader className="border-b border-divider p-4">
                        <h3 className="text-lg font-semibold">Warning History Retention</h3>
                    </CardHeader>
                    <CardBody className="p-6">
                        <Input
                            type="number"
                            label="Retain warnings for (days)"
                            value={settings.retention || 90}
                            onChange={(e) => setSettings(prev => ({ ...prev, retention: parseInt(e.target.value) }))}
                            min={30}
                            max={365}
                            radius={themeRadius}
                            classNames={{ inputWrapper: "bg-default-100" }}
                            description="Warnings older than this will be automatically deleted"
                        />
                    </CardBody>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Button
                        variant="flat"
                        onPress={handleReset}
                        radius={themeRadius}
                    >
                        Reset to Defaults
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSave}
                        radius={themeRadius}
                    >
                        Save Settings
                    </Button>
                </div>
            </div>
        </>
    );
}
