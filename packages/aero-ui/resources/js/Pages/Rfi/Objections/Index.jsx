import React, { useState, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import App from '@/Layouts/App';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Skeleton,
    User as UserAvatar,
} from '@heroui/react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import StatsCards from '@/Components/StatsCards';
import { showToast } from '@/utils/toastUtils';

const statusColorMap = {
    open: 'warning',
    in_review: 'primary',
    resolved: 'success',
    rejected: 'danger',
    closed: 'default',
};

const ObjectionsIndex = ({
    auth,
    title = 'Objections',
    objections = { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
    filters = {},
    statuses = [],
    statusLabels = {},
    categories = [],
    categoryLabels = {},
    users = [],
}) => {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [loading, setLoading] = useState(false);

    // Stats calculation
    const stats = useMemo(() => {
        const total = objections.meta?.total || objections.data?.length || 0;
        const open = objections.data?.filter(o => o.status === 'open').length || 0;
        const resolved = objections.data?.filter(o => o.status === 'resolved').length || 0;
        const inReview = objections.data?.filter(o => o.status === 'in_review').length || 0;

        return [
            { title: 'Total Objections', value: total, color: 'primary', icon: ExclamationTriangleIcon },
            { title: 'Open', value: open, color: 'warning', icon: ExclamationTriangleIcon },
            { title: 'In Review', value: inReview, color: 'primary', icon: EyeIcon },
            { title: 'Resolved', value: resolved, color: 'success', icon: CheckCircleIcon },
        ];
    }, [objections]);

    const handleSearch = useCallback((value) => {
        setSearch(value);
        router.get(route('rfi.objections.index'), {
            ...filters,
            search: value,
        }, { preserveState: true, preserveScroll: true });
    }, [filters]);

    const handleStatusFilter = useCallback((keys) => {
        const value = Array.from(keys)[0] || 'all';
        setStatusFilter(value);
        router.get(route('rfi.objections.index'), {
            ...filters,
            status: value === 'all' ? null : value,
        }, { preserveState: true, preserveScroll: true });
    }, [filters]);

    const handlePageChange = useCallback((page) => {
        router.get(route('rfi.objections.index'), {
            ...filters,
            page,
        }, { preserveState: true, preserveScroll: true });
    }, [filters]);

    const handleView = (objection) => {
        safeNavigate('rfi.objections.show', objection.id);
    };

    const handleEdit = (objection) => {
        safeNavigate('rfi.objections.edit', objection.id);
    };

    const handleDelete = async (objection) => {
        if (!confirm('Are you sure you want to delete this objection?')) return;

        safeDelete('rfi.objections.destroy', { id: objection.id }, {
            onSuccess: () => showToast.success('Objection deleted successfully'),
            onError: () => showToast.error('Failed to delete objection'),
        });
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        { key: 'created_by', label: 'Created By' },
        { key: 'created_at', label: 'Created At' },
        { key: 'actions', label: 'Actions' },
    ];

    const renderCell = useCallback((objection, columnKey) => {
        switch (columnKey) {
            case 'id':
                return <span className="font-mono text-sm">#{objection.id}</span>;
            case 'title':
                return (
                    <div className="max-w-xs">
                        <p className="font-medium truncate">{objection.title}</p>
                        {objection.description && (
                            <p className="text-xs text-default-500 truncate">{objection.description}</p>
                        )}
                    </div>
                );
            case 'category':
                return (
                    <Chip size="sm" variant="flat">
                        {categoryLabels[objection.category] || objection.category}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={statusColorMap[objection.status] || 'default'}
                    >
                        {statusLabels[objection.status] || objection.status}
                    </Chip>
                );
            case 'created_by':
                return objection.created_by_user ? (
                    <UserAvatar
                        name={objection.created_by_user.name}
                        avatarProps={{ size: 'sm' }}
                    />
                ) : '-';
            case 'created_at':
                return new Date(objection.created_at).toLocaleDateString();
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            <DropdownItem
                                key="view"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => handleView(objection)}
                            >
                                View
                            </DropdownItem>
                            <DropdownItem
                                key="edit"
                                startContent={<PencilIcon className="w-4 h-4" />}
                                onPress={() => handleEdit(objection)}
                            >
                                Edit
                            </DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => handleDelete(objection)}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return objection[columnKey];
        }
    }, [categoryLabels, statusLabels]);

    return (
        <App auth={auth}>
            <Head title={title} />

            <div className="space-y-6">
                {/* Stats Cards */}
                <StatsCards stats={stats} />

                {/* Filters & Actions */}
                <Card className="aero-card">
                    <CardBody className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                <Input
                                    placeholder="Search objections..."
                                    value={search}
                                    onValueChange={handleSearch}
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                    classNames={{ inputWrapper: 'bg-default-100' }}
                                    className="sm:max-w-xs"
                                />
                                <Select
                                    placeholder="All Statuses"
                                    selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                                    onSelectionChange={handleStatusFilter}
                                    classNames={{ trigger: 'bg-default-100' }}
                                    className="sm:max-w-[180px]"
                                >
                                    <SelectItem key="all">All Statuses</SelectItem>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <SelectItem key={key}>{label}</SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-5 h-5" />}
                                onPress={() => safeNavigate('rfi.objections.create')}
                            >
                                New Objection
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* Objections Table */}
                <Card className="aero-card">
                    <CardHeader className="border-b border-divider p-4">
                        <h3 className="text-lg font-semibold">Objections List</h3>
                    </CardHeader>
                    <CardBody className="p-0">
                        <Table
                            aria-label="Objections table"
                            classNames={{
                                wrapper: 'shadow-none',
                                th: 'bg-default-100 text-default-600 font-semibold',
                                td: 'py-3',
                            }}
                        >
                            <TableHeader columns={columns}>
                                {(column) => (
                                    <TableColumn key={column.key} align={column.key === 'actions' ? 'center' : 'start'}>
                                        {column.label}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody
                                items={objections.data || []}
                                emptyContent="No objections found"
                            >
                                {(item) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => (
                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                                        )}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {objections.meta && objections.meta.last_page > 1 && (
                            <div className="flex justify-center py-4 border-t border-divider">
                                <Pagination
                                    total={objections.meta.last_page}
                                    page={objections.meta.current_page}
                                    onChange={handlePageChange}
                                />
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </App>
    );
};

export default ObjectionsIndex;
