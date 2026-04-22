import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card, CardBody, CardHeader, Button, Input, Select, SelectItem,
    Chip, Table, TableHeader, TableBody, TableRow, TableCell, TableColumn,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Spinner
} from "@heroui/react";
import {
    PlusIcon, MagnifyingGlassIcon, ClipboardDocumentCheckIcon,
    EllipsisVerticalIcon, EyeIcon, PencilIcon, TrashIcon,
    CalendarDaysIcon, MapPinIcon, UserIcon
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
    { key: 'inspection_date', label: 'Date' },
    { key: 'location', label: 'Location' },
    { key: 'inspector', label: 'Inspector' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
];

const SafetyInspectionsIndex = ({ title, inspections: initialInspections }) => {
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

    const [inspections, setInspections] = useState(initialInspections?.data ?? []);
    const [pagination, setPagination] = useState({
        currentPage: initialInspections?.current_page ?? 1,
        lastPage: initialInspections?.last_page ?? 1,
        total: initialInspections?.total ?? 0,
        perPage: initialInspections?.per_page ?? 30,
    });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const stats = useMemo(() => {
        const all = initialInspections?.data ?? [];
        return {
            total: pagination.total,
            scheduled: all.filter(i => i.status === 'scheduled').length,
            inProgress: all.filter(i => i.status === 'in-progress').length,
            completed: all.filter(i => i.status === 'completed').length,
        };
    }, [initialInspections, pagination.total]);

    const statsData = useMemo(() => [
        {
            title: 'Total',
            value: stats.total,
            icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />,
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
            title: 'In Progress',
            value: stats.inProgress,
            icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
        },
        {
            title: 'Completed',
            value: stats.completed,
            icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
    ], [stats]);

    const filteredInspections = useMemo(() => {
        const items = Array.isArray(inspections) ? inspections : [];
        return items.filter((item) => {
            const matchesSearch = !search || (item.title ?? '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [inspections, search, statusFilter]);

    useEffect(() => {
        if (initialInspections) {
            setInspections(initialInspections?.data ?? []);
            setPagination(prev => ({
                ...prev,
                currentPage: initialInspections?.current_page ?? 1,
                lastPage: initialInspections?.last_page ?? 1,
                total: initialInspections?.total ?? 0,
                perPage: initialInspections?.per_page ?? prev.perPage,
            }));
        }
    }, [initialInspections]);

    const handlePageChange = (page) => {
        setLoading(true);
        router.get(
            route('hrm.safety.inspections.index'),
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
                const response = await axios.delete(route('hrm.safety.inspections.destroy', id));
                if (response.status === 200 || response.status === 204) {
                    setInspections(prev => prev.filter(i => i.id !== id));
                    resolve([response.data?.message || 'Inspection deleted']);
                } else {
                    reject(['Failed to delete inspection']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['An error occurred']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting inspection...',
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
            case 'inspection_date':
                return (
                    <span className="text-default-600 flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {item.inspection_date ?? '—'}
                    </span>
                );
            case 'location':
                return (
                    <span className="text-default-600 flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {item.location ?? '—'}
                    </span>
                );
            case 'inspector':
                return (
                    <span className="text-default-600 flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        {item.inspector?.name ?? '—'}
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
                        <DropdownMenu aria-label="Inspection actions">
                            <DropdownItem
                                key="view"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('hrm.safety.inspections.show', item.id))}
                            >
                                View
                            </DropdownItem>
                            {canUpdate('hrm.safety.safety-inspections') && (
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => router.visit(route('hrm.safety.inspections.edit', item.id))}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDelete('hrm.safety.safety-inspections') && (
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
            <Head title={title ?? 'Safety Inspections'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Safety Inspections">
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
                                                    <ClipboardDocumentCheckIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Safety Inspections
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage and track workplace safety inspections
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreate('hrm.safety.safety-inspections') && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => router.visit(route('hrm.safety.inspections.create'))}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        New Inspection
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
                                            placeholder="Search inspections..."
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
                                            aria-label="Safety inspections table"
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
                                            <TableBody items={filteredInspections.map(i => ({ ...i, key: i.id }))} emptyContent="No inspections found">
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

SafetyInspectionsIndex.layout = (page) => <App children={page} />;
export default SafetyInspectionsIndex;
