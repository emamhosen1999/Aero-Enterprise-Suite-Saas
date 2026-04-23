import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
import axios from 'axios';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Switch,
    Chip,
    Skeleton,
    Divider,
    Select,
    SelectItem,
    Input,
} from '@heroui/react';
import { motion } from 'framer-motion';
import {
    BellIcon,
    EnvelopeIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    MoonIcon,
    ClockIcon,
    ArrowPathIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const NotificationPreferences = ({ title, preferences: initialPreferences = [] }) => {
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
    const [preferences, setPreferences] = useState({});
    const [quietHours, setQuietHours] = useState({
        enabled: false,
        start: '22:00',
        end: '07:00',
    });
    const [digestFrequency, setDigestFrequency] = useState('instant');

    // Event types that can be configured
    const eventTypes = [
        {
            key: 'employee.created',
            label: 'Welcome Message',
            description: 'Notification when you join the organization',
            category: 'Employee',
        },
        {
            key: 'employee.promoted',
            label: 'Promotions',
            description: 'Congratulations on promotions and title changes',
            category: 'Employee',
        },
        {
            key: 'employee.transferred',
            label: 'Transfers',
            description: 'Department or location transfer notifications',
            category: 'Employee',
        },
        {
            key: 'leave.requested',
            label: 'Leave Requests',
            description: 'Notifications about leave request submissions',
            category: 'Leave',
        },
        {
            key: 'leave.approved',
            label: 'Leave Approvals',
            description: 'When your leave requests are approved',
            category: 'Leave',
        },
        {
            key: 'leave.rejected',
            label: 'Leave Rejections',
            description: 'When your leave requests are declined',
            category: 'Leave',
        },
        {
            key: 'attendance.late',
            label: 'Late Arrival Alerts',
            description: 'Warning when marked as late',
            category: 'Attendance',
        },
        {
            key: 'attendance.absent',
            label: 'Absence Alerts',
            description: 'Notification for unmarked attendance',
            category: 'Attendance',
        },
        {
            key: 'timesheet.reminder',
            label: 'Timesheet Reminders',
            description: 'Weekly reminders to submit timesheets',
            category: 'Attendance',
        },
        {
            key: 'safety.incident',
            label: 'Safety Incidents',
            description: 'Critical safety incident notifications',
            category: 'Safety',
        },
    ];

    const channels = [
        { key: 'database', label: 'In-App', icon: <ComputerDesktopIcon className="w-5 h-5" /> },
        { key: 'mail', label: 'Email', icon: <EnvelopeIcon className="w-5 h-5" /> },
        { key: 'sms', label: 'SMS', icon: <DevicePhoneMobileIcon className="w-5 h-5" /> },
        { key: 'push', label: 'Push', icon: <BellIcon className="w-5 h-5" /> },
    ];

    // Group events by category
    const eventsByCategory = useMemo(() => {
        const grouped = {};
        eventTypes.forEach(event => {
            if (!grouped[event.category]) {
                grouped[event.category] = [];
            }
            grouped[event.category].push(event);
        });
        return grouped;
    }, []);

    // Fetch preferences on mount
    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await axios.get(route('core.profile.notifications.index'));
            if (response.data) {
                setPreferences(response.data.preferences || {});
                if (response.data.quiet_hours) {
                    setQuietHours(response.data.quiet_hours);
                }
                if (response.data.digest_frequency) {
                    setDigestFrequency(response.data.digest_frequency);
                }
            }
        } catch (error) {
            console.error('Failed to fetch preferences:', error);
            // Initialize with defaults
            initializeDefaults();
        } finally {
            setLoading(false);
        }
    };

    const initializeDefaults = () => {
        const defaults = {};
        eventTypes.forEach(event => {
            defaults[event.key] = {
                database: true,
                mail: true,
                sms: false,
                push: false,
            };
        });
        setPreferences(defaults);
    };

    const handleToggle = async (eventType, channel, enabled) => {
        const newPreferences = {
            ...preferences,
            [eventType]: {
                ...(preferences[eventType] || { database: true, mail: true, sms: false, push: false }),
                [channel]: enabled,
            },
        };
        setPreferences(newPreferences);

        try {
            await axios.post(route('core.profile.notifications.update'), {
                event_type: eventType,
                channel: channel,
                enabled: enabled,
            });
        } catch (error) {
            // Revert on error
            setPreferences(preferences);
            showToast.error('Failed to update preference');
        }
    };

    const handleQuietHoursChange = async (field, value) => {
        const newQuietHours = { ...quietHours, [field]: value };
        setQuietHours(newQuietHours);
    };

    const handleDigestChange = async (value) => {
        setDigestFrequency(value);
    };

    const saveGlobalSettings = async () => {
        setSaving(true);
        try {
            await axios.post(route('core.profile.notifications.update-global'), {
                quiet_hours: quietHours,
                digest_frequency: digestFrequency,
            });
            showToast.success('Preferences saved');
        } catch (error) {
            showToast.error('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const resetToDefaults = async () => {
        setSaving(true);
        try {
            await axios.post(route('core.profile.notifications.reset'));
            initializeDefaults();
            setQuietHours({ enabled: false, start: '22:00', end: '07:00' });
            setDigestFrequency('instant');
            showToast.success('Preferences reset to defaults');
        } catch (error) {
            showToast.error('Failed to reset preferences');
        } finally {
            setSaving(false);
        }
    };

    const isChannelEnabled = (eventType, channel) => {
        return preferences[eventType]?.[channel] ?? (channel === 'database' || channel === 'mail');
    };

    return (
        <>
            <Head title={title} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Notification Preferences">
                <div className="space-y-6 max-w-4xl mx-auto">
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
                                                <BellIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                    style={{ color: 'var(--theme-primary)' }} />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Notification Preferences
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Choose how and when you want to be notified
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 flex-wrap">
                                            <Button 
                                                color="default" 
                                                variant="flat"
                                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                onPress={resetToDefaults}
                                                isLoading={saving}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                Reset to Defaults
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6 space-y-6">
                                {/* Global Settings */}
                                <Card className="border border-divider">
                                    <CardBody className="space-y-4 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MoonIcon className="w-5 h-5 text-default-500" />
                                            <h5 className="font-semibold">Global Settings</h5>
                                        </div>

                                        {/* Quiet Hours */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="font-medium">Quiet Hours</p>
                                                <p className="text-sm text-default-500">
                                                    Pause notifications during specific hours
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    isSelected={quietHours.enabled}
                                                    onValueChange={(enabled) => handleQuietHoursChange('enabled', enabled)}
                                                />
                                                {quietHours.enabled && (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="time"
                                                            value={quietHours.start}
                                                            onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                                                            className="w-28"
                                                            size="sm"
                                                            radius={themeRadius}
                                                        />
                                                        <span className="text-default-400">to</span>
                                                        <Input
                                                            type="time"
                                                            value={quietHours.end}
                                                            onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                                                            className="w-28"
                                                            size="sm"
                                                            radius={themeRadius}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Divider />

                                        {/* Digest Frequency */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="font-medium">Email Digest</p>
                                                <p className="text-sm text-default-500">
                                                    Receive notifications as a summary digest
                                                </p>
                                            </div>
                                            <Select
                                                selectedKeys={[digestFrequency]}
                                                onSelectionChange={(keys) => handleDigestChange(Array.from(keys)[0])}
                                                className="max-w-xs"
                                                size="sm"
                                                radius={themeRadius}
                                            >
                                                <SelectItem key="instant">Instant (as they happen)</SelectItem>
                                                <SelectItem key="hourly">Hourly Digest</SelectItem>
                                                <SelectItem key="daily">Daily Digest</SelectItem>
                                                <SelectItem key="weekly">Weekly Digest</SelectItem>
                                            </Select>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <Button
                                                color="primary"
                                                size="sm"
                                                onPress={saveGlobalSettings}
                                                isLoading={saving}
                                                startContent={<CheckCircleIcon className="w-4 h-4" />}
                                            >
                                                Save Settings
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Channel Legend */}
                                <div className="flex flex-wrap gap-3 items-center">
                                    <span className="text-sm text-default-500">Channels:</span>
                                    {channels.map(channel => (
                                        <Chip
                                            key={channel.key}
                                            variant="flat"
                                            size="sm"
                                            startContent={channel.icon}
                                        >
                                            {channel.label}
                                        </Chip>
                                    ))}
                                </div>

                                {/* Event Preferences by Category */}
                                {Object.entries(eventsByCategory).map(([category, events]) => (
                                    <Card key={category} className="border border-divider">
                                        <CardBody className="p-4">
                                            <h5 className="font-semibold mb-4">{category}</h5>
                                            <div className="space-y-4">
                                                {events.map((event, index) => (
                                                    <React.Fragment key={event.key}>
                                                        {index > 0 && <Divider />}
                                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
                                                            <div className="flex-1">
                                                                <p className="font-medium">{event.label}</p>
                                                                <p className="text-sm text-default-500">
                                                                    {event.description}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-3 flex-wrap">
                                                                {channels.map(channel => (
                                                                    <div key={channel.key} className="flex flex-col items-center gap-1">
                                                                        <span className="text-xs text-default-400">{channel.label}</span>
                                                                        {loading ? (
                                                                            <Skeleton className="h-6 w-10 rounded-full" />
                                                                        ) : (
                                                                            <Switch
                                                                                size="sm"
                                                                                isSelected={isChannelEnabled(event.key, channel.key)}
                                                                                onValueChange={(enabled) => handleToggle(event.key, channel.key, enabled)}
                                                                                aria-label={`${event.label} via ${channel.label}`}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

NotificationPreferences.layout = (page) => <App children={page} />;
export default NotificationPreferences;
