import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card, CardBody, CardHeader, Button, Input, Select, SelectItem,
    Chip, Table, TableHeader, TableBody, TableRow, TableCell, TableColumn,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Spinner
} from "@heroui/react";
import {
    PlusIcon, MagnifyingGlassIcon, AcademicCapIcon,
    EllipsisVerticalIcon, EyeIcon, PencilIcon, TrashIcon,
    CalendarDaysIcon, MapPinIcon, UserIcon, ClockIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC.js';
import axios from 'axios';

const statusColorMap = {
    scheduled: 'primary',
    'in-progress': 'warning',
    completed: 'success',
    cancelled: 'danger',
};

const statusOptions = [
    { key: 'all', label: 'All Statuses' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
];

const columns = [
    { key: 'title', label: 'Title' },
    { key: 'department', label: 'Department' },
    { key: 'training_date', label: 'Date' },
    { key: 'duration', label: 'Duration (mins)' },
    { key: 'location', label: 'Location' },
    { key: 'trainer', label: 'Trainer' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
];

const SafetyTrainingIndex = ({ title, trainings: initialTrainings }) => {
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

    const [trainings, setTrainings] = useState(initialTrainings?.data ?? []);
    const [pagination, setPagination] = useState({
        currentPage: initialTrainings?.current_page ?? 1,
        lastPage: initialTrainings?.last_page ?? 1,
        total: initialTrainings?.total ?? 0,
        perPage: initialTrainings?.per_page ?? 30,
    });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const now = new Date().toISOString().split('T')[0];
    const stats = useMemo(() => {
        const all = initialTrainings?.data ?? [];
        return {
            total: pagination.total,
            scheduled: all.filter(t => t.status === 'scheduled').length,
            completed: all.filter(t => t.status === 'completed').length,
            upcoming: all.filter(t => t.status === 'scheduled' && t.training_date >= now).length,
        };
    }, [initialTrainings, pagination.total]);

    const statsData = useMemo(() => [
        {
            title: 'Total',
            value: stats.total,
            icon: <AcademicCapIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Scheduled',
            value: stats.scheduled,
            icon: <CalendarDaysIcon className="w-5 h-5" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
        {
            title: 'Completed',
            value: stats.completed,
            icon: <AcademicCapIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
        {
            title: 'Upcoming',
            value: stats.upcoming,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
        },
    ], [stats]);

    const filteredTrainings = useMemo(() => {
        const items = Array.isArray(trainings) ? trainings : [];
        return items.filter((item) => {
            const matchesSearch = !search || (item.title ?? '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [trainings, search, statusFilter]);

    useEffect(() => {
        if (initialTrainings) {
            setTrainings(initialTrainings?.data ?? []);
            setPagination(prev => ({
                ...prev,
                currentPage: initialTrainings?.current_page ?? 1,
                lastPage: initialTrainings?.last_page ?? 1,
                total: initialTrainings?.total ?? 0,
                perPage: initialTrainings?.per_page ?? prev.perPage,
            }));
        }
    }, [initialTrainings]);

    const handlePageChange = (page) => {
        setLoading(true);
        router.get(
            route('hrm.safety.training.index'),
            { page },
            {
                preserveState: false,
                preserveScroll: true,
                onFinish: () => setLoading(false),
            }
        );
    };

    const handleDelete = (id) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.safety.training.destroy', id));
                if (response.status === 200 || response.status === 204) {
                    setTrainings(prev => prev.filter(t => t.id !== id));
                    resolve([response.data?.message || 'Training deleted']);
                } else {
                    reject(['Failed to delete training']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting training...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'title':
                return <span className="font-medium text-foreground">{item.title}</span>;
            case 'department':
                return <span className="text-default-600">{item.department?.name ?? '—'}</span>;
            case 'training_date':
                return (
                    <span className="text-default-600 flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {item.training_date ?? '—'}
                    </span>
                );
            case 'duration':
                return (
                    <span className="text-default-600 flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {item.duration ?? '—'}
                    </span>
                );
            case 'location':
                return (
                    <span className="text-default-600 flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {item.location ?? '—'}
                    </span>
                );
            case 'trainer':
                return (
                    <span className="text-default-600 flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        {item.trainer?.name ?? '—'}
                    </span>
                );
            case 'status':
                return (
                    <Chip
                        color={statusColorMap[item.status] ?? 'default'}
                        size="sm"
                        variant="flat"
                        className="capitalize"
                    >
                        {item.status?.replace('-', ' ') ?? '—'}
                    </Chip>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light" aria-label="Actions">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Training actions">
                            <DropdownItem
                                key="view"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('hrm.safety.training.show', item.id))}
                            >
                                View
                            </DropdownItem>
                            {canUpdate('hrm.safety.safety-training') && (
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => router.visit(route('hrm.safety.training.edit', item.id))}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete('hrm.safety.safety-training') && (
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
            <Head title={title ?? 'Safety Training'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Safety Training">
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
                                                    <AcademicCapIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Safety Training
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage and schedule workplace safety training sessions
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate('hrm.safety.safety-training') && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route('hrm.safety.training.create'))}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Schedule Training
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
                                            placeholder="Search training sessions..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="flex-1"
                                        />
                                        <Select
                                            label="Status"
                                            placeholder="All Statuses"
                                            selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                                            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] || 'all')}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            className="sm:w-48"
                                        >
                                            {statusOptions.map(opt => (
                                                <SelectItem key={opt.key}>{opt.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    {loading ? (
                                        <div className="flex justify-center items-center py-12">
                                            <Spinner size="lg" color="primary" />
                                        </div>
                                    ) : (
                                        <Table
                                            aria-label="Safety training table"
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
                                            <TableBody items={filteredTrainings.map(t => ({ ...t, key: t.id }))} emptyContent="No training sessions found">
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => (
                                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}

                                    {pagination.lastPage > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={handlePageChange}
                                                color="primary"
                                                showControls
                                                radius={themeRadius}
                                            />
                                        </div>
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

SafetyTrainingIndex.layout = (page) => <App children={page} />;
export default SafetyTrainingIndex;
