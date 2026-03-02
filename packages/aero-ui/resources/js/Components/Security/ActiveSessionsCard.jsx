import React, { useState, useCallback } from 'react';
import { Button, Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { ComputerDesktopIcon, TrashIcon } from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * ActiveSessionsCard Component
 * 
 * Displays user's active sessions with ability to terminate individual sessions.
 * Includes device information, IP address, location, and last activity timestamp.
 * 
 * @param {Array} sessions - Array of session objects
 * @param {Function} onSessionTerminated - Callback when a session is terminated
 * @param {number} activeSessions - Count of active sessions for display
 */
const ActiveSessionsCard = ({ sessions = [], onSessionTerminated, activeSessions = 0 }) => {
    const [sessionsData, setSessionsData] = useState(sessions);
    const [loading, setLoading] = useState(false);
    const [terminatingId, setTerminatingId] = useState(null);

    // Terminate a specific session
    const handleTerminateSession = useCallback(async (sessionId) => {
        setTerminatingId(sessionId);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('sessions.terminate', sessionId));
                if (response.status === 200) {
                    // Update local state
                    setSessionsData(prev => prev.filter(s => s.id !== sessionId));
                    
                    // Notify parent component
                    if (onSessionTerminated) {
                        onSessionTerminated(sessionId);
                    }
                    
                    resolve([response.data.message || 'Session terminated successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to terminate session']);
            } finally {
                setTerminatingId(null);
            }
        });

        showToast.promise(promise, {
            loading: 'Terminating session...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [onSessionTerminated]);

    // Terminate all other sessions (sign out all devices)
    const handleTerminateAllSessions = useCallback(async () => {
        setLoading(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('sessions.terminate-all'));
                if (response.status === 200) {
                    // Keep only current session
                    setSessionsData(prev => prev.filter(s => s.is_current));
                    
                    // Notify parent component
                    if (onSessionTerminated) {
                        onSessionTerminated('all');
                    }
                    
                    resolve([response.data.message || 'All sessions terminated']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to terminate sessions']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Terminating all sessions...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [onSessionTerminated]);

    // Get device icon based on device type
    const getDeviceIcon = (deviceType) => {
        return <ComputerDesktopIcon className="w-5 h-5 text-default-600" />;
    };

    // Format session info for display
    const formatSessionInfo = (session) => {
        const parts = [];
        
        if (session.ip_address) {
            parts.push(session.ip_address);
        }
        
        if (session.location) {
            parts.push(session.location);
        } else {
            parts.push('Unknown location');
        }
        
        return parts.join(' · ');
    };

    return (
        <Card shadow="sm" className="border border-divider">
            <CardHeader className="px-6 py-4 border-b border-divider">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10">
                            <ComputerDesktopIcon className="w-5 h-5 text-success" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Active Sessions</h3>
                            <p className="text-sm text-default-500">
                                Manage devices with active authenticated sessions
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Chip 
                            color="primary" 
                            variant="flat" 
                            size="sm"
                        >
                            {activeSessions || sessionsData.length} Active
                        </Chip>
                        {sessionsData.length > 1 && (
                            <Button 
                                size="sm" 
                                color="danger" 
                                variant="flat"
                                onPress={handleTerminateAllSessions}
                                isLoading={loading}
                                startContent={!loading && <TrashIcon className="w-4 h-4" />}
                            >
                                Sign Out All Devices
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardBody className="p-6">
                {sessionsData.length > 0 ? (
                    <div className="space-y-3">
                        {sessionsData.map((session) => (
                            <div 
                                key={session.id} 
                                className="flex items-center justify-between p-4 border border-divider rounded-lg hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 bg-default-100 rounded-lg">
                                        {getDeviceIcon(session.device_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium truncate">
                                                {session.device_type} - {session.browser}
                                            </p>
                                            {session.is_current && (
                                                <Chip size="sm" color="success" variant="flat">
                                                    Current
                                                </Chip>
                                            )}
                                        </div>
                                        <p className="text-sm text-default-500 truncate">
                                            {formatSessionInfo(session)}
                                        </p>
                                        <p className="text-xs text-default-400 mt-1">
                                            Last active: {session.last_active_at}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    {!session.is_current && (
                                        <Button 
                                            size="sm" 
                                            color="danger" 
                                            variant="flat"
                                            onPress={() => handleTerminateSession(session.id)}
                                            isLoading={terminatingId === session.id}
                                            isIconOnly={terminatingId !== session.id}
                                        >
                                            {terminatingId === session.id ? (
                                                <Spinner size="sm" color="danger" />
                                            ) : (
                                                <TrashIcon className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="p-4 bg-default-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <ComputerDesktopIcon className="w-8 h-8 text-default-400" />
                        </div>
                        <p className="text-default-500 font-medium">No active sessions</p>
                        <p className="text-sm text-default-400 mt-1">
                            Active authenticated sessions will appear here.
                        </p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default ActiveSessionsCard;
