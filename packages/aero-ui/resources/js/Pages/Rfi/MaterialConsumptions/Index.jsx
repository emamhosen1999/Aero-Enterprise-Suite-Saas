import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Chip,
    Tooltip,
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
    Spinner,
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ChartBarIcon,
    DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const MaterialConsumptions = ({ title }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();

    // Theme radius helper
    const themeRadius = useThemeRadius();
// Responsive breakpoints
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
    const [materials, setMaterials] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        material_type: '',
        quality_status: '',
        date_from: '',
        date_to: '',
    });
    const [pagination, setPagination] = useState({
        perPage: 30,
        currentPage: 1,
        total: 0,
        lastPage: 1,
    });
    const [stats, setStats] = useState({
        total_records: 0,
        total_cost: 0,
        quality_passed: 0,
        quality_failed: 0,
        total_wastage_cost: 0,
    });

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Records",
            value: stats.total_records,
            icon: <DocumentChartBarIcon className="w-6 h-6" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
        },
        {
            title: "Total Cost",
            value: `$${stats.total_cost.toLocaleString()}`,
            icon: <ChartBarIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20",
        },
        {
            title: "Quality Passed",
            value: stats.quality_passed,
            icon: <DocumentChartBarIcon className="w-6 h-6" />,
            color: "text-success",
            iconBg: "bg-success/20",
        },
        {
            title: "Quality Failed",
            value: stats.quality_failed,
            icon: <DocumentChartBarIcon className="w-6 h-6" />,
            color: "text-danger",
            iconBg: "bg-danger/20",
        },
        {
            title: "Wastage Cost",
            value: `$${stats.total_wastage_cost.toLocaleString()}`,
            icon: <ChartBarIcon className="w-6 h-6" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
        },
    ], [stats]);

    // Permission checks
    // Permissions using HRMAC
    // TODO: Update with correct HRMAC path once module hierarchy is defined for RFI
    const canCreateMaterial = canCreate("rfi.material-consumptions") || isSuperAdmin();
    const canEditMaterial = canUpdate("rfi.material-consumptions") || isSuperAdmin();
    const canDeleteMaterial = canDelete("rfi.material-consumptions") || isSuperAdmin();

    // Fetch data
    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.material-consumptions.index'), {
                params: {
                    page: pagination.currentPage,
                    perPage: pagination.perPage,
                    ...filters,
                },
                headers: { Accept: 'application/json' },
            });

            if (response.status === 200) {
                setMaterials(response.data.items || []);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.lastPage || 1,
                }));
                if (response.data.stats) {
                    setStats(response.data.stats);
                }
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch material consumptions',
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    // Quality status color map
    const qualityColorMap = {
        pending: 'warning',
        passed: 'success',
        failed: 'danger',
        conditional: 'primary',
    };

    // Table columns
    const columns = [
        { uid: 'material_name', name: 'Material' },
        { uid: 'material_type', name: 'Type' },
        { uid: 'quantity', name: 'Quantity' },
        { uid: 'quality_status', name: 'Quality' },
        { uid: 'wastage', name: 'Wastage %' },
        { uid: 'cost', name: 'Total Cost' },
        { uid: 'recorded_at', name: 'Date' },
        { uid: 'actions', name: 'Actions' },
    ];

    // Render cell
    const renderCell = useCallback((material, columnKey) => {
        switch (columnKey) {
            case 'material_name':
                return (
                    <div>
                        <p className="font-semibold">{material.material_name}</p>
                        {material.material_code && (
                            <p className="text-xs text-default-500">{material.material_code}</p>
                        )}
                    </div>
                );
            case 'material_type':
                return <span className="text-sm">{material.material_type}</span>;
            case 'quantity':
                return (
                    <span className="text-sm">
                        {material.quantity} {material.unit}
                    </span>
                );
            case 'quality_status':
                return (
                    <Chip
                        color={qualityColorMap[material.quality_status]}
                        variant="flat"
                        size="sm"
                    >
                        {material.quality_status}
                    </Chip>
                );
            case 'wastage':
                const wastagePercent = material.wastage_quantity
                    ? ((material.wastage_quantity / material.quantity) * 100).toFixed(2)
                    : '0.00';
                return (
                    <span
                        className={`text-sm ${
                            parseFloat(wastagePercent) > 5 ? 'text-danger font-semibold' : ''
                        }`}
                    >
                        {wastagePercent}%
                    </span>
                );
            case 'cost':
                const totalCost = material.unit_cost
                    ? (material.quantity * material.unit_cost).toFixed(2)
                    : '0.00';
                return <span className="text-sm">${totalCost}</span>;
            case 'recorded_at':
                return (
                    <span className="text-sm">
                        {new Date(material.recorded_at).toLocaleDateString()}
                    </span>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            {canEditMaterial && (
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                >
                                    Edit
                                </DropdownItem>
                            )}
                            {canDeleteMaterial && (
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                >
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return material[columnKey];
        }
    }, [canEdit, canDelete]);

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col w-full h-full p-4" role="main">
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
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <DocumentChartBarIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Material Consumptions
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Track material usage with quality tests and wastage analysis
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateMaterial && (
                                                    <Button
                                                        color="primary"
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        size={isMobile ? 'sm' : 'md'}
                                                    >
                                                        Add Material
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search materials..."
                                            value={filters.search}
                                            onValueChange={(value) => handleFilterChange('search', value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: 'bg-default-100' }}
                                        />

                                        <Select
                                            placeholder="Material Type"
                                            selectedKeys={filters.material_type ? [filters.material_type] : []}
                                            onSelectionChange={(keys) =>
                                                handleFilterChange('material_type', Array.from(keys)[0] || '')
                                            }
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ trigger: 'bg-default-100' }}
                                        >
                                            <SelectItem key="">All Types</SelectItem>
                                            <SelectItem key="cement">Cement</SelectItem>
                                            <SelectItem key="steel">Steel</SelectItem>
                                            <SelectItem key="aggregate">Aggregate</SelectItem>
                                            <SelectItem key="concrete">Concrete</SelectItem>
                                        </Select>

                                        <Select
                                            placeholder="Quality Status"
                                            selectedKeys={filters.quality_status ? [filters.quality_status] : []}
                                            onSelectionChange={(keys) =>
                                                handleFilterChange('quality_status', Array.from(keys)[0] || '')
                                            }
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ trigger: 'bg-default-100' }}
                                        >
                                            <SelectItem key="">All Status</SelectItem>
                                            <SelectItem key="pending">Pending</SelectItem>
                                            <SelectItem key="passed">Passed</SelectItem>
                                            <SelectItem key="failed">Failed</SelectItem>
                                            <SelectItem key="conditional">Conditional</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Data Table */}
                                    {loading ? (
                                        <div className="flex justify-center items-center py-10">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : (
                                        <>
                                            <Table
                                                aria-label="Material consumptions table"
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
                                                <TableBody
                                                    items={materials}
                                                    emptyContent="No material consumptions found"
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

                                            {/* Pagination */}
                                            {pagination.lastPage > 1 && (
                                                <div className="flex justify-center mt-6">
                                                    <Pagination
                                                        total={pagination.lastPage}
                                                        page={pagination.currentPage}
                                                        onChange={(page) =>
                                                            setPagination((prev) => ({ ...prev, currentPage: page }))
                                                        }
                                                        showControls
                                                        radius={themeRadius}
                                                    />
                                                </div>
                                            )}
                                        </>
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

MaterialConsumptions.layout = (page) => <App children={page} />;
export default MaterialConsumptions;
