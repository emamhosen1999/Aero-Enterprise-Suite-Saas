import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
import axios from 'axios';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Switch,
    Tab,
    Tabs,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Skeleton,
    Tooltip,
    Divider,
} from '@heroui/react';
import { motion } from 'framer-motion';
import {
    BellIcon,
    EnvelopeIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    Cog6ToothIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const NotificationSettings = ({ title }) => {
    const { auth } = usePage().props;
    
    // Theme radius helper
    const themeRadius = useThemeRadius();
// Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        channels: {
            database: { enabled: true, label: 'In-App Notifications' },
            mail: { enabled: true, label: 'Email' },
            sms: { enabled: false, label: 'SMS' },
            push: { enabled: false, label: 'Push Notifications' },
        },
        retry: {
            max_attempts: 3,
            backoff_minutes: [5, 15, 60],
        },
    });
    const [stats, setStats] = useState({
        total_sent: 0,
        total_failed: 0,
        pending: 0,
        today_sent: 0,
    });

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
        fetchStats();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(route('core.settings.notifications.index'));
            if (response.data) {
                // Transform array of settings to structured object
                const settingsData = response.data.settings || [];
                const transformed = { channels: {}, retry: {} };
                
                settingsData.forEach(setting => {
                    if (setting.key.startsWith('channels.')) {
                        const parts = setting.key.split('.');
                        const channel = parts[1];
                        const prop = parts[2];
                        if (!transformed.channels[channel]) {
                            transformed.channels[channel] = { enabled: false, label: channel };
                        }
                        if (prop === 'enabled') {
                            transformed.channels[channel].enabled = JSON.parse(setting.value);
                        }
                    } else if (setting.key.startsWith('retry.')) {
                        const prop = setting.key.replace('retry.', '');
                        transformed.retry[prop] = JSON.parse(setting.value);
                    }
                });
                
                setSettings(prev => ({
                    channels: { ...prev.channels, ...transformed.channels },
                    retry: { ...prev.retry, ...transformed.retry },
                }));
            }
        } catch (error) {
            console.error('Failed to fetch notification settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(route('core.settings.notifications.stats'));
            if (response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch notification stats:', error);
        }
    };

    const handleChannelToggle = async (channel, enabled) => {
        const newSettings = {
            ...settings,
            channels: {
                ...settings.channels,
                [channel]: { ...settings.channels[channel], enabled },
            },
        };
        setSettings(newSettings);

        try {
            await axios.post(route('core.settings.notifications.update'), {
                key: `channels.${channel}.enabled`,
                value: enabled,
            });
            showToast.success(`${settings.channels[channel]?.label || channel} notifications ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            // Revert on error
            setSettings(settings);
            showToast.error('Failed to update setting');
        }
    };

    const handleRetrySettingChange = async (key, value) => {
        const newSettings = {
            ...settings,
            retry: { ...settings.retry, [key]: value },
        };
        setSettings(newSettings);
    };

    const saveRetrySettings = async () => {
        setSaving(true);
        try {
            await axios.post(route('core.settings.notifications.update-retry'), {
                max_attempts: settings.retry.max_attempts,
                backoff_minutes: settings.retry.backoff_minutes,
            });
            showToast.success('Retry settings saved');
        } catch (error) {
            showToast.error('Failed to save retry settings');
        } finally {
            setSaving(false);
        }
    };

    const channelIcons = {
        database: <ComputerDesktopIcon className="w-5 h-5" />,
        mail: <EnvelopeIcon className="w-5 h-5" />,
        sms: <DevicePhoneMobileIcon className="w-5 h-5" />,
        push: <BellIcon className="w-5 h-5" />,
    };

    const channelDescriptions = {
        database: 'Store notifications in the database for in-app display',
        mail: 'Send email notifications for important events',
        sms: 'Send SMS text messages (requires Twilio configuration)',
        push: 'Send browser push notifications in real-time',
    };

    const statsData = useMemo(() => [
        { 
            title: "Sent Today", 
            value: stats.today_sent, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Total Sent", 
            value: stats.total_sent, 
            icon: <BellIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Pending", 
            value: stats.pending, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Failed", 
            value: stats.total_failed, 
            icon: <XCircleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    return (
        <>
            <Head title={title} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Notification Settings">
                <div className="space-y-6">
                    {/* Page Header */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card 
                            className="transition-all duration-200"
                            style={{
                                border: `var(--borderWidth, 2px) solid transparent`,
                                borderRadius: `var(--borderRadius, 12px)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                                background: `linear-gradient(135deg, 
                                    var(--theme-content1, #FAFAFA) 20%, 
                                    var(--theme-content2, #F4F4F5) 10%, 
                                    var(--theme-content3, #F1F3F4) 20%)`,
                            }}
                        >
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
                                                    Notification Settings
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Configure notification channels and delivery settings
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 flex-wrap">
                                            <Button 
                                                color="default" 
                                                variant="flat"
                                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                onPress={() => { fetchSettings(); fetchStats(); }}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                Refresh
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {statsData.map((stat, index) => (
                                        <Card key={index} className="border border-divider">
                                            <CardBody className="flex flex-row items-center gap-3 p-4">
                                                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                                                    <span className={stat.color}>{stat.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-default-500 text-xs">{stat.title}</p>
                                                    {loading ? (
                                                        <Skeleton className="h-6 w-12 rounded" />
                                                    ) : (
                                                        <p className="text-xl font-bold">{stat.value.toLocaleString()}</p>
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>

                                <Tabs aria-label="Notification settings tabs" color="primary" variant="underlined">
                                    {/* Channels Tab */}
                                    <Tab key="channels" title="Notification Channels">
                                        <div className="py-4">
                                            <p className="text-default-500 mb-4">
                                                Enable or disable notification channels globally. Individual users can customize their preferences.
                                            </p>
                                            
                                            <div className="space-y-4">
                                                {Object.entries(settings.channels).map(([channel, config]) => (
                                                    <Card key={channel} className="border border-divider">
                                                        <CardBody className="flex flex-row items-center justify-between p-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-3 rounded-lg ${config.enabled ? 'bg-primary/20 text-primary' : 'bg-default-100 text-default-400'}`}>
                                                                    {channelIcons[channel]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold">{config.label}</p>
                                                                    <p className="text-sm text-default-500">
                                                                        {channelDescriptions[channel]}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Chip 
                                                                    size="sm" 
                                                                    color={config.enabled ? 'success' : 'default'}
                                                                    variant="flat"
                                                                >
                                                                    {config.enabled ? 'Enabled' : 'Disabled'}
                                                                </Chip>
                                                                {loading ? (
                                                                    <Skeleton className="h-6 w-12 rounded-full" />
                                                                ) : (
                                                                    <Switch
                                                                        isSelected={config.enabled}
                                                                        onValueChange={(enabled) => handleChannelToggle(channel, enabled)}
                                                                        aria-label={`Toggle ${config.label}`}
                                                                        isDisabled={channel === 'database'} // Database always enabled
                                                                    />
                                                                )}
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                                                <div className="flex items-start gap-3">
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-warning mt-0.5" />
                                                    <div>
                                                        <p className="font-medium text-warning-700 dark:text-warning-300">
                                                            Channel Configuration Required
                                                        </p>
                                                        <p className="text-sm text-warning-600 dark:text-warning-400 mt-1">
                                                            SMS requires Twilio credentials. Push notifications require Firebase or OneSignal setup.
                                                            Configure these in System Settings before enabling.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Tab>

                                    {/* Retry Settings Tab */}
                                    <Tab key="retry" title="Retry Configuration">
                                        <div className="py-4">
                                            <p className="text-default-500 mb-4">
                                                Configure how failed notifications should be retried.
                                            </p>
                                            
                                            <Card className="border border-divider">
                                                <CardBody className="space-y-6 p-6">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">
                                                            Maximum Retry Attempts
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={10}
                                                            value={settings.retry.max_attempts}
                                                            onValueChange={(val) => handleRetrySettingChange('max_attempts', parseInt(val) || 0)}
                                                            className="max-w-xs"
                                                            description="Number of times to retry a failed notification (0-10)"
                                                            radius={themeRadius}
                                                        />
                                                    </div>
                                                    
                                                    <Divider />
                                                    
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">
                                                            Backoff Intervals (minutes)
                                                        </label>
                                                        <p className="text-sm text-default-500 mb-3">
                                                            Time to wait between retry attempts. Each value corresponds to retry 1, 2, 3, etc.
                                                        </p>
                                                        <div className="flex gap-3 flex-wrap">
                                                            {(settings.retry.backoff_minutes || [5, 15, 60]).map((minutes, index) => (
                                                                <Input
                                                                    key={index}
                                                                    type="number"
                                                                    min={1}
                                                                    max={1440}
                                                                    value={minutes}
                                                                    onValueChange={(val) => {
                                                                        const newBackoff = [...(settings.retry.backoff_minutes || [5, 15, 60])];
                                                                        newBackoff[index] = parseInt(val) || 5;
                                                                        handleRetrySettingChange('backoff_minutes', newBackoff);
                                                                    }}
                                                                    className="w-24"
                                                                    label={`Retry ${index + 1}`}
                                                                    radius={themeRadius}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex justify-end">
                                                        <Button
                                                            color="primary"
                                                            onPress={saveRetrySettings}
                                                            isLoading={saving}
                                                        >
                                                            Save Retry Settings
                                                        </Button>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    </Tab>

                                    {/* Event Types Tab */}
                                    <Tab key="events" title="Event Types">
                                        <div className="py-4">
                                            <p className="text-default-500 mb-4">
                                                View all notification event types and their default channels.
                                            </p>
                                            
                                            <Table aria-label="Notification event types" className="border border-divider rounded-lg">
                                                <TableHeader>
                                                    <TableColumn>Event Type</TableColumn>
                                                    <TableColumn>Description</TableColumn>
                                                    <TableColumn>Default Channels</TableColumn>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow key="employee.created">
                                                        <TableCell>
                                                            <span className="font-mono text-sm">employee.created</span>
                                                        </TableCell>
                                                        <TableCell>Welcome notification for new employees</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Chip size="sm" variant="flat">Database</Chip>
                                                                <Chip size="sm" variant="flat" color="primary">Email</Chip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow key="employee.promoted">
                                                        <TableCell>
                                                            <span className="font-mono text-sm">employee.promoted</span>
                                                        </TableCell>
                                                        <TableCell>Promotion congratulations</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Chip size="sm" variant="flat">Database</Chip>
                                                                <Chip size="sm" variant="flat" color="primary">Email</Chip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow key="attendance.late">
                                                        <TableCell>
                                                            <span className="font-mono text-sm">attendance.late</span>
                                                        </TableCell>
                                                        <TableCell>Late arrival warning with escalation</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Chip size="sm" variant="flat">Database</Chip>
                                                                <Chip size="sm" variant="flat" color="primary">Email</Chip>
                                                                <Chip size="sm" variant="flat" color="secondary">Push</Chip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow key="leave.requested">
                                                        <TableCell>
                                                            <span className="font-mono text-sm">leave.requested</span>
                                                        </TableCell>
                                                        <TableCell>Leave request submitted</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Chip size="sm" variant="flat">Database</Chip>
                                                                <Chip size="sm" variant="flat" color="primary">Email</Chip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow key="leave.approved">
                                                        <TableCell>
                                                            <span className="font-mono text-sm">leave.approved</span>
                                                        </TableCell>
                                                        <TableCell>Leave request approved</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Chip size="sm" variant="flat">Database</Chip>
                                                                <Chip size="sm" variant="flat" color="primary">Email</Chip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow key="safety.incident">
                                                        <TableCell>
                                                            <span className="font-mono text-sm">safety.incident</span>
                                                        </TableCell>
                                                        <TableCell>Safety incident reported (escalation enabled)</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Chip size="sm" variant="flat">Database</Chip>
                                                                <Chip size="sm" variant="flat" color="primary">Email</Chip>
                                                                <Chip size="sm" variant="flat" color="secondary">Push</Chip>
                                                                <Chip size="sm" variant="flat" color="warning">SMS</Chip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Tab>
                                </Tabs>
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

NotificationSettings.layout = (page) => <App children={page} />;
export default NotificationSettings;
