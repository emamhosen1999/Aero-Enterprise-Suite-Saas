import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card, CardBody, CardHeader, Button, Input, Select, SelectItem,
    Chip, Table, TableHeader, TableBody, TableRow, TableCell, TableColumn,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import {
    PlusIcon, MagnifyingGlassIcon, ShieldExclamationIcon,
    EllipsisVerticalIcon, EyeIcon, TrashIcon, CheckCircleIcon,
    CalendarDaysIcon, MapPinIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC.js';
import axios from 'axios';

const severityColorMap = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
};

const statusColorMap = {
    open: 'warning',
    investigating: 'primary',
    resolved: 'success',
    closed: 'default',
};

const severityOptions = [
    { key: 'all', label: 'All Severities' },
    { key: 'low', label: 'Low' },
    { key: 'medium', label: 'Medium' },
    { key: 'high', label: 'High' },
    { key: 'critical', label: 'Critical' },
];

const statusOptions = [
    { key: 'all', label: 'All Statuses' },
    { key: 'open', label: 'Open' },
    { key: 'investigating', label: 'Investigating' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
];

const columns = [
    { key: 'title', label: 'Title' },
    { key: 'department', label: 'Department' },
    { key: 'incident_date', label: 'Date' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
    { key: 'reporter', label: 'Reporter' },
    { key: 'actions', label: 'Actions' },
];

const SafetyIncidentsIndex = ({ title, incidents: initialIncidents }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete } = useHRMAC();

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

    const [incidents, setIncidents] = useState(initialIncidents?.data ?? initialIncidents ?? []);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const stats = useMemo(() => ({
        total: incidents.length,
        open: incidents.filter(i => i.status === 'open').length,
        investigating: incidents.filter(i => i.status === 'investigating').length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
    }), [incidents]);

    const statsData = useMemo(() => [
        {
            title: 'Total',
            value: stats.total,
            icon: <ShieldExclamationIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Open',
            value: stats.open,
            icon: <ShieldExclamationIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
        },
        {
            title: 'Investigating',
            value: stats.investigating,
            icon: <ShieldExclamationIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Resolved',
            value: stats.resolved,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
    ], [stats]);

    const filteredIncidents = useMemo(() => {
        return incidents.filter(incident => {
            const matchesSearch = !search ||
                incident.title?.toLowerCase().includes(search.toLowerCase()) ||
                incident.location?.toLowerCase().includes(search.toLowerCase()) ||
                incident.reporter_name?.toLowerCase().includes(search.toLowerCase());
            const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
            const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
            return matchesSearch && matchesSeverity && matchesStatus;
        });
    }, [incidents, search, severityFilter, statusFilter]);

    const handleResolve = (id) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.safety.incidents.resolve', id));
                if (response.status === 200) {
                    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
                    resolve([response.data?.message || 'Incident resolved']);
                } else {
                    reject(['Failed to resolve incident']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            }
        });

        showToast.promise(promise, {
            loading: 'Resolving incident...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = (id) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.safety.incidents.destroy', id));
                if (response.status === 200 || response.status === 204) {
                    setIncidents(prev => prev.filter(i => i.id !== id));
                    resolve([response.data?.message || 'Incident deleted']);
                } else {
                    reject(['Failed to delete incident']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting incident...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'title':
                return <span className="font-medium text-foreground">{item.title}</span>;
            case 'department':
                return <span className="text-default-600">{item.department_name ?? '—'}</span>;
            case 'incident_date':
                return (
                    <span className="text-default-600 flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {item.incident_date ?? '—'}
                    </span>
                );
            case 'severity':
                return (
                    <Chip
                        color={severityColorMap[item.severity] ?? 'default'}
                        size="sm"
                        variant="flat"
                        className="capitalize"
                    >
                        {item.severity ?? '—'}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip
                        color={statusColorMap[item.status] ?? 'default'}
                        size="sm"
                        variant="flat"
                        className="capitalize"
                    >
                        {item.status ?? '—'}
                    </Chip>
                );
            case 'reporter':
                return <span className="text-default-600">{item.reporter_name ?? '—'}</span>;
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light" aria-label="Actions">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Incident actions">
                            <DropdownItem
                                key="view"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('hrm.safety.incidents.show', item.id))}
                            >
                                View
                            </DropdownItem>
                            {canUpdate('hrm.safety.safety-incidents') && item.status !== 'resolved' && (
                                <DropdownItem
                                    key="resolve"
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    onPress={() => handleResolve(item.id)}
                                >
                                    Resolve
                                </DropdownItem>
                            )}
                            {canDelete('hrm.safety.safety-incidents') && (
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => handleDelete(item.id)}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title ?? 'Safety Incidents'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Safety Incidents">
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
                                    background: `linear-gradient(135deg,
                                        var(--theme-content1, #FAFAFA) 20%,
                                        var(--theme-content2, #F4F4F5) 10%,
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                    color: `var(--theme-foreground)`,
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
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ShieldExclamationIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Safety Incidents
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Track and manage workplace safety incidents
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate('hrm.safety.safety-incidents') && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route('hrm.safety.incidents.create'))}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Report Incident
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />

                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search incidents..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="flex-1"
                                        />
                                        <Select
                                            label="Severity"
                                            placeholder="All Severities"
                                            selectedKeys={severityFilter !== 'all' ? [severityFilter] : []}
                                            onSelectionChange={(keys) => setSeverityFilter(Array.from(keys)[0] || 'all')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="sm:w-44"
                                        >
                                            {severityOptions.map(opt => (
                                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            label="Status"
                                            placeholder="All Statuses"
                                            selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                                            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] || 'all')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="sm:w-44"
                                        >
                                            {statusOptions.map(opt => (
                                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    <Table
                                        aria-label="Safety incidents table"
                                        isHeaderSticky
                                        classNames={{
                                            wrapper: 'shadow-none border border-divider',
                                            th: 'bg-content2 text-default-600 font-semibold',
                                            td: 'py-3',
                                        }}
                                        style={{ borderRadius: `var(--borderRadius, 12px)` }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => (
                                                <TableColumn key={column.key}>
                                                    {column.label}
                                                </TableColumn>
                                            )}
                                        </TableHeader>
                                        <TableBody items={(Array.isArray(filteredIncidents) ? filteredIncidents : []).map(i => ({ ...i, key: i.id }))} emptyContent="No incidents found">
                                            {(item) => (
                                                <TableRow key={item.id}>
                                                    {(columnKey) => (
                                                        <TableCell>{renderCell(item, columnKey)}</TableCell>
                                                    )}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

SafetyIncidentsIndex.layout = (page) => <App children={page} />;
export default SafetyIncidentsIndex;
