import React, { useState, useCallback } from 'react';
import { Button, Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { DevicePhoneMobileIcon, TrashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * TrustedDevicesCard Component
 * 
 * Displays user's registered trusted devices with ability to remove devices.
 * Trusted devices can bypass 2FA verification for improved UX.
 * 
 * @param {Array} devices - Array of device objects
 * @param {Function} onDeviceRemoved - Callback when a device is removed
 * @param {number} trustedDevices - Count of trusted devices for display
 */
const TrustedDevicesCard = ({ devices = [], onDeviceRemoved, trustedDevices = 0 }) => {
    const [devicesData, setDevicesData] = useState(devices);
    const [removingId, setRemovingId] = useState(null);

    // Remove a specific device
    const handleRemoveDevice = useCallback(async (deviceId) => {
        setRemovingId(deviceId);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('devices.deactivate', deviceId));
                if (response.status === 200) {
                    // Update local state
                    setDevicesData(prev => prev.filter(d => d.id !== deviceId));
                    
                    // Notify parent component
                    if (onDeviceRemoved) {
                        onDeviceRemoved(deviceId);
                    }
                    
                    resolve([response.data.message || 'Device removed successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to remove device']);
            } finally {
                setRemovingId(null);
            }
        });

        showToast.promise(promise, {
            loading: 'Removing device...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [onDeviceRemoved]);

    // Revoke trust for a device (without removing it)
    const handleRevokeTrust = useCallback(async (deviceId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('devices.revoke-trust', deviceId));
                if (response.status === 200) {
                    // Update local state
                    setDevicesData(prev => prev.map(d => 
                        d.id === deviceId ? { ...d, trusted: false } : d
                    ));
                    
                    // Notify parent component
                    if (onDeviceRemoved) {
                        onDeviceRemoved(deviceId, false);
                    }
                    
                    resolve([response.data.message || 'Device trust revoked']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to revoke trust']);
            }
        });

        showToast.promise(promise, {
            loading: 'Revoking device trust...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [onDeviceRemoved]);

    // Get device icon based on device type
    const getDeviceIcon = (deviceType) => {
        return <DevicePhoneMobileIcon className="w-5 h-5 text-default-600" />;
    };

    // Format device info for display
    const formatDeviceInfo = (device) => {
        const parts = [];
        
        if (device.platform) {
            parts.push(device.platform);
        }
        
        if (device.created_at) {
            parts.push(`Added ${device.created_at}`);
        }
        
        return parts.join(' · ');
    };

    return (
        <Card shadow="sm" className="border border-divider">
            <CardHeader className="px-6 py-4 border-b border-divider">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                            <DevicePhoneMobileIcon className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Trusted Devices</h3>
                            <p className="text-sm text-default-500">
                                Devices registered for 2FA bypass
                            </p>
                        </div>
                    </div>
                    <Chip 
                        color="warning" 
                        variant="flat" 
                        size="sm"
                    >
                        {trustedDevices || devicesData.filter(d => d.trusted).length} Trusted
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-6">
                {devicesData.length > 0 ? (
                    <div className="space-y-3">
                        {devicesData.map((device) => (
                            <div 
                                key={device.id} 
                                className="flex items-center justify-between p-4 border border-divider rounded-lg hover:border-warning/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 bg-default-100 rounded-lg">
                                        {getDeviceIcon(device.device_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium truncate">
                                                {device.device_name || device.device_type}
                                            </p>
                                            {device.trusted && (
                                                <Chip 
                                                    size="sm" 
                                                    color="success" 
                                                    variant="flat"
                                                    startContent={<ShieldCheckIcon className="w-3 h-3" />}
                                                >
                                                    Trusted
                                                </Chip>
                                            )}
                                        </div>
                                        <p className="text-sm text-default-500 truncate">
                                            {formatDeviceInfo(device)}
                                        </p>
                                        {device.last_used_at && (
                                            <p className="text-xs text-default-400 mt-1">
                                                Last used: {device.last_used_at}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-4 flex items-center gap-2">
                                    {device.trusted && (
                                        <Button 
                                            size="sm" 
                                            color="warning" 
                                            variant="flat"
                                            onPress={() => handleRevokeTrust(device.id)}
                                        >
                                            Revoke Trust
                                        </Button>
                                    )}
                                    <Button 
                                        size="sm" 
                                        color="danger" 
                                        variant="flat"
                                        onPress={() => handleRemoveDevice(device.id)}
                                        isLoading={removingId === device.id}
                                        isIconOnly={removingId !== device.id}
                                    >
                                        {removingId === device.id ? (
                                            <Spinner size="sm" color="danger" />
                                        ) : (
                                            <TrashIcon className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="p-4 bg-default-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <DevicePhoneMobileIcon className="w-8 h-8 text-default-400" />
                        </div>
                        <p className="text-default-500 font-medium">No registered devices</p>
                        <p className="text-sm text-default-400 mt-1">
                            Trust a device when logging in with 2FA to skip verification next time
                        </p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default TrustedDevicesCard;
