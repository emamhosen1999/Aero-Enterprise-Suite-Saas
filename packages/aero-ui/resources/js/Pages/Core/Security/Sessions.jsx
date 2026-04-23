import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
} from '@heroui/react';
import {
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    GlobeAltIcon,
    ShieldExclamationIcon,
    TrashIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const deviceIcon = (deviceType) => {
    if (deviceType === 'mobile') { return <DevicePhoneMobileIcon className="w-5 h-5" />; }
    return <ComputerDesktopIcon className="w-5 h-5" />;
};

const Sessions = ({ title, sessions: initialSessions, current_session_id, max_sessions }) => {
    const { auth } = usePage().props;
    const { hasAccess } = useHRMAC();
    const canTerminate = hasAccess('core.authentication.sessions.terminate');
    const canTerminateAll = hasAccess('core.authentication.sessions.terminate_all');

    const getThemeRadius = () => {
        if (typeof window === 'undefined') { return 'lg'; }
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) { return 'none'; }
        if (radiusValue <= 4) { return 'sm'; }
        if (radiusValue <= 8) { return 'md'; }
        if (radiusValue <= 16) { return 'lg'; }
        return 'full';
    };

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [sessions, setSessions] = useState(initialSessions || []);
    const [loading, setLoading] = useState(false);

    const stats = useMemo(() => ({
        total: sessions.length,
        current: sessions.filter(s => s.id === current_session_id).length,
        other: sessions.filter(s => s.id !== current_session_id).length,
    }), [sessions, current_session_id]);

    const statsData = useMemo(() => [
        {
            title: 'Active Sessions',
            value: stats.total,
            icon: <GlobeAltIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Current Session',
            value: stats.current,
            icon: <ComputerDesktopIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
        {
            title: 'Other Sessions',
            value: stats.other,
            icon: <ShieldExclamationIcon className="w-5 h-5" />,
            color: stats.other > 0 ? 'text-warning' : 'text-default-400',
            iconBg: stats.other > 0 ? 'bg-warning/20' : 'bg-default-100',
        },
        {
            title: 'Max Allowed',
            value: max_sessions ?? '∞',
            icon: <GlobeAltIcon className="w-5 h-5" />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
        },
    ], [stats, max_sessions]);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('core.security.sessions.paginate'));
            setSessions(response.data.sessions);
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to refresh sessions.' });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleTerminate = useCallback(async (sessionId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('core.security.sessions.terminate', { sessionId }));
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                resolve(['Session terminated successfully.']);
            } catch (error) {
                reject(['Failed to terminate session.']);
            }
        });

        showToast.promise(promise, {
            loading: 'Terminating session...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, []);

    const handleTerminateAll = useCallback(async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.delete(route('core.security.sessions.terminate-all'));
                setSessions(prev => prev.filter(s => s.id === current_session_id));
                resolve(['All other sessions terminated.']);
            } catch (error) {
                reject(['Failed to terminate sessions.']);
            }
        });

        showToast.promise(promise, {
            loading: 'Terminating all sessions...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    }, [current_session_id]);

    const renderCell = useCallback((session, columnKey) => {
        const isCurrent = session.id === current_session_id;

        switch (columnKey) {
            case 'device':
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-default-500">{deviceIcon(session.device_type)}</span>
                        <div>
                            <p className="text-sm font-medium">{session.browser || 'Unknown browser'}</p>
                            <p className="text-xs text-default-400">{session.platform || 'Unknown OS'}</p>
                        </div>
                    </div>
                );
            case 'ip':
                return (
                    <div>
                        <p className="text-sm font-mono">{session.ip_address || '—'}</p>
                        {session.location && (
                            <p className="text-xs text-default-400">{session.location}</p>
                        )}
                    </div>
                );
            case 'activity':
                return (
                    <div>
                        <p className="text-sm">{session.last_active_at}</p>
                        <p className="text-xs text-default-400">Started {session.created_at}</p>
                    </div>
                );
            case 'status':
                return isCurrent
                    ? <Chip color="success" size="sm" variant="flat">Current</Chip>
                    : <Chip color="default" size="sm" variant="flat">Active</Chip>;
            case 'actions':
                return isCurrent ? (
                    <Chip size="sm" variant="flat" color="primary">This session</Chip>
                ) : canTerminate ? (
                    <Tooltip content="Terminate session" color="danger">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleTerminate(session.id)}
                        >
                            <XCircleIcon className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                ) : null;
            default:
                return session[columnKey] ?? '—';
        }
    }, [current_session_id, canTerminate, handleTerminate]);

    const columns = [
        { uid: 'device', name: 'Device & Browser' },
        { uid: 'ip', name: 'IP / Location' },
        { uid: 'activity', name: 'Last Activity' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    return (
        <>
            <Head title={title} />
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Active Sessions">
                <div className="space-y-4">
                    <div className="w-full">
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
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <GlobeAltIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Active Sessions</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage your active login sessions across devices
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    color="default"
                                                    variant="flat"
                                                    onPress={refresh}
                                                    isLoading={loading}
                                                    size={isMobile ? 'sm' : 'md'}
                                                >
                                                    Refresh
                                                </Button>
                                                {canTerminateAll && stats.other > 0 && (
                                                    <Button
                                                        color="danger"
                                                        variant="flat"
                                                        startContent={<TrashIcon className="w-4 h-4" />}
                                                        onPress={handleTerminateAll}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Terminate All Others
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {loading ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-3/4 rounded" />
                                                        <Skeleton className="h-3 w-1/2 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="Active sessions table"
                                            isHeaderSticky
                                            classNames={{
                                                wrapper: 'shadow-none border border-divider rounded-lg',
                                                th: 'bg-default-100 text-default-600 font-semibold',
                                                td: 'py-3',
                                            }}
                                        >
                                            <TableHeader columns={columns}>
                                                {(column) => (
                                                    <TableColumn key={column.uid}>{column.name}</TableColumn>
                                                )}
                                            </TableHeader>
                                            <TableBody items={sessions} emptyContent="No active sessions found.">
                                                {(session) => (
                                                    <TableRow key={session.id}>
                                                        {(columnKey) => (
                                                            <TableCell>{renderCell(session, columnKey)}</TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Sessions.layout = (page) => <App children={page} />;
export default Sessions;
