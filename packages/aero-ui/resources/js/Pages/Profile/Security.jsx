import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import {
    ShieldCheckIcon,
    DevicePhoneMobileIcon,
    ClockIcon,
    ComputerDesktopIcon,
    LockClosedIcon,
    KeyIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import TwoFactorSettings from '@/Components/Auth/TwoFactorSettings.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

const Security = ({ title, twoFactorEnabled, recoveryCodesCount, sessions, devices }) => {
    const { auth } = usePage().props;
    
    // Helper function to convert theme borderRadius to HeroUI radius values
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
    // Custom media queries
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
    const [sessionsData, setSessionsData] = useState(sessions || []);
    const [devicesData, setDevicesData] = useState(devices || []);
    const [securityStats, setSecurityStats] = useState({
        twoFactorEnabled: twoFactorEnabled || false,
        recoveryCodesCount: recoveryCodesCount || 0,
        activeSessions: sessions?.length || 0,
        trustedDevices: devices?.filter(d => d.trusted)?.length || 0,
        totalDevices: devices?.length || 0
    });

    // Prepare stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Two-Factor Auth",
            value: securityStats.twoFactorEnabled ? "Enabled" : "Disabled",
            icon: <ShieldCheckIcon />,
            color: securityStats.twoFactorEnabled ? "text-success" : "text-danger",
            iconBg: securityStats.twoFactorEnabled ? "bg-success/20" : "bg-danger/20",
            description: securityStats.twoFactorEnabled ? `${securityStats.recoveryCodesCount} recovery codes` : "Not configured"
        },
        {
            title: "Active Sessions",
            value: securityStats.activeSessions,
            icon: <ComputerDesktopIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Logged in devices"
        },
        {
            title: "Trusted Devices",
            value: securityStats.trustedDevices,
            icon: <DevicePhoneMobileIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: `${securityStats.totalDevices} total devices`
        },
        {
            title: "Last Activity",
            value: auth.user?.last_login_at ? new Date(auth.user.last_login_at).toLocaleDateString() : "N/A",
            icon: <ClockIcon />,
            color: "text-default-600",
            iconBg: "bg-default/20",
            description: "Last login time"
        }
    ], [securityStats, auth.user]);

    // Fetch latest security data
    const fetchSecurityData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('profile.security'));
            if (response.status === 200) {
                const { twoFactorEnabled, recoveryCodesCount, sessions, devices } = response.data;
                setSessionsData(sessions || []);
                setDevicesData(devices || []);
                setSecurityStats({
                    twoFactorEnabled: twoFactorEnabled || false,
                    recoveryCodesCount: recoveryCodesCount || 0,
                    activeSessions: sessions?.length || 0,
                    trustedDevices: devices?.filter(d => d.trusted)?.length || 0,
                    totalDevices: devices?.length || 0
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch security data'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Terminate session
    const handleTerminateSession = useCallback(async (sessionId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('sessions.terminate', sessionId));
                if (response.status === 200) {
                    setSessionsData(prev => prev.filter(s => s.id !== sessionId));
                    setSecurityStats(prev => ({ ...prev, activeSessions: prev.activeSessions - 1 }));
                    resolve([response.data.message || 'Session terminated']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to terminate session']);
            }
        });

        showToast.promise(promise, {
            loading: 'Terminating session...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, []);

    // Remove device
    const handleRemoveDevice = useCallback(async (deviceId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('devices.deactivate', deviceId));
                if (response.status === 200) {
                    setDevicesData(prev => prev.filter(d => d.id !== deviceId));
                    setSecurityStats(prev => ({ 
                        ...prev, 
                        totalDevices: prev.totalDevices - 1,
                        trustedDevices: prev.trustedDevices - (devicesData.find(d => d.id === deviceId)?.trusted ? 1 : 0)
                    }));
                    resolve([response.data.message || 'Device removed']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to remove device']);
            }
        });

        showToast.promise(promise, {
            loading: 'Removing device...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [devicesData]);

    return (
        <>
            <Head title={title || "Security Settings"} />
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Security Settings">
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
                                {/* Card Header with title + action buttons */}
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
                                            {/* Title Section with icon */}
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <LockClosedIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Security Settings
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage your account security and authentication
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* 1. Stats Cards (REQUIRED at top) */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    {/* 2. Two-Factor Authentication Section */}
                                    <div className="mb-6">
                                        <Card shadow="sm" className="border border-divider">
                                            <CardHeader className="px-6 py-4 border-b border-divider">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10">
                                                        <KeyIcon className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                                                        <p className="text-sm text-default-500">
                                                            Add an extra layer of security to your account
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardBody className="p-6">
                                                <TwoFactorSettings />
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* 3. Active Sessions Section - Placeholder */}
                                    <div className="mb-6">
                                        <Card shadow="sm" className="border border-divider">
                                            <CardHeader className="px-6 py-4 border-b border-divider">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-success/10">
                                                        <ComputerDesktopIcon className="w-5 h-5 text-success" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold">Active Sessions</h3>
                                                        <p className="text-sm text-default-500">
                                                            Manage devices with active authenticated sessions
                                                        </p>
                                                    </div>
                                                    <Chip 
                                                        color="primary" 
                                                        variant="flat" 
                                                        size="sm"
                                                    >
                                                        {securityStats.activeSessions} Active
                                                    </Chip>
                                                </div>
                                            </CardHeader>
                                            <CardBody className="p-6">
                                                {sessionsData.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {sessionsData.map((session, index) => (
                                                            <div 
                                                                key={session.id} 
                                                                className="flex items-center justify-between p-4 border border-divider rounded-lg"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-default-100 rounded-lg">
                                                                        <ComputerDesktopIcon className="w-5 h-5 text-default-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">{session.device_type} - {session.browser}</p>
                                                                        <p className="text-sm text-default-500">
                                                                            {session.ip_address} · {session.location || 'Unknown location'}
                                                                        </p>
                                                                        <p className="text-xs text-default-400">
                                                                            Last active: {session.last_active_at}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {session.is_current && (
                                                                        <Chip size="sm" color="success" variant="flat">Current</Chip>
                                                                    )}
                                                                    {!session.is_current && (
                                                                        <Button 
                                                                            size="sm" 
                                                                            color="danger" 
                                                                            variant="flat"
                                                                            onPress={() => handleTerminateSession(session.id)}
                                                                        >
                                                                            Terminate
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-center text-default-500 py-8">No active sessions</p>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* 4. Trusted Devices Section - Placeholder */}
                                    <div className="mb-6">
                                        <Card shadow="sm" className="border border-divider">
                                            <CardHeader className="px-6 py-4 border-b border-divider">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-warning/10">
                                                        <DevicePhoneMobileIcon className="w-5 h-5 text-warning" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold">Trusted Devices</h3>
                                                        <p className="text-sm text-default-500">
                                                            Devices registered for 2FA bypass
                                                        </p>
                                                    </div>
                                                    <Chip 
                                                        color="warning" 
                                                        variant="flat" 
                                                        size="sm"
                                                    >
                                                        {securityStats.trustedDevices} Trusted
                                                    </Chip>
                                                </div>
                                            </CardHeader>
                                            <CardBody className="p-6">
                                                {devicesData.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {devicesData.map((device) => (
                                                            <div 
                                                                key={device.id} 
                                                                className="flex items-center justify-between p-4 border border-divider rounded-lg"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-default-100 rounded-lg">
                                                                        <DevicePhoneMobileIcon className="w-5 h-5 text-default-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">{device.device_name || device.device_type}</p>
                                                                        <p className="text-sm text-default-500">
                                                                            {device.platform} · Added {device.created_at}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {device.trusted && (
                                                                        <Chip size="sm" color="success" variant="flat">Trusted</Chip>
                                                                    )}
                                                                    <Button 
                                                                        size="sm" 
                                                                        color="danger" 
                                                                        variant="flat"
                                                                        onPress={() => handleRemoveDevice(device.id)}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-center text-default-500 py-8">No trusted devices</p>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

// REQUIRED: Use App layout wrapper
Security.layout = (page) => <App children={page} />;
export default Security;
