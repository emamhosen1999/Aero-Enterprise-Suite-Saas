/**
 * Active Sessions Page
 * 
 * View and manage active user sessions.
 */

import React from 'react';
import { Head } from '@inertiajs/react';
import { 
    Card, CardBody, CardHeader, 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Tooltip
} from '@heroui/react';
import { 
    ComputerDesktopIcon, DevicePhoneMobileIcon, 
    GlobeAltIcon, TrashIcon 
} from '@heroicons/react/24/outline';

export default function Index({ sessions = [] }) {
    const mockSessions = sessions.length > 0 ? sessions : [
        {
            id: 1,
            user: 'Admin User',
            device: 'Chrome on Windows',
            ip: '192.168.1.100',
            location: 'New York, US',
            lastActive: '2 minutes ago',
            isCurrent: true,
        },
        {
            id: 2,
            user: 'Admin User',
            device: 'Safari on iPhone',
            ip: '192.168.1.101',
            location: 'New York, US',
            lastActive: '1 hour ago',
            isCurrent: false,
        },
    ];

    const getDeviceIcon = (device) => {
        if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('phone')) {
            return <DevicePhoneMobileIcon className="w-5 h-5" />;
        }
        return <ComputerDesktopIcon className="w-5 h-5" />;
    };

    return (
        <>
            <Head title="Active Sessions" />
            
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GlobeAltIcon className="w-8 h-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">Active Sessions</h1>
                            <p className="text-default-500">View and manage all active user sessions</p>
                        </div>
                    </div>
                    <Button color="danger" variant="flat">
                        Revoke All Other Sessions
                    </Button>
                </div>

                <Card>
                    <CardBody>
                        <Table aria-label="Active sessions table">
                            <TableHeader>
                                <TableColumn>DEVICE</TableColumn>
                                <TableColumn>USER</TableColumn>
                                <TableColumn>IP ADDRESS</TableColumn>
                                <TableColumn>LOCATION</TableColumn>
                                <TableColumn>LAST ACTIVE</TableColumn>
                                <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {mockSessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getDeviceIcon(session.device)}
                                                <span>{session.device}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{session.user}</TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-default-100 px-2 py-1 rounded">
                                                {session.ip}
                                            </code>
                                        </TableCell>
                                        <TableCell>{session.location}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {session.lastActive}
                                                {session.isCurrent && (
                                                    <Chip size="sm" color="success" variant="flat">
                                                        Current
                                                    </Chip>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {!session.isCurrent && (
                                                <Tooltip content="Revoke session">
                                                    <Button 
                                                        isIconOnly 
                                                        size="sm" 
                                                        variant="light" 
                                                        color="danger"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
